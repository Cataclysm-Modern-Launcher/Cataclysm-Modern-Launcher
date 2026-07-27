import { BrowserWindow, ipcMain, nativeTheme } from "electron";
import { is } from "@electron-toolkit/utils";
import { dirname, join, resolve } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { parse } from "jsonc-parser";
import { Bridge } from "@shared/bridge-api/Bridge";
import { KnowledgeIndexStatus, KnowledgeItemDetails, KnowledgeItemSummary, KnowledgeRecipe, KnowledgeRequirementGroup, KnowledgeResolvedRequirement } from "@shared/knowledge/KnowledgeTypes";
import { gameBundleService } from "../GameBundleService";
import { attachRendererLogging } from "../logger";
import { appSettings } from "../settings/AppSettings";
import { attachWindowStatePersistence, resolveWindowBounds } from "../settings/WindowState";

const ITEM_TYPES = new Set(["ITEM", "AMMO", "ARMOR", "BATTERY", "BIONIC_ITEM", "BOOK", "COMESTIBLE", "ENGINE", "GENERIC", "GUN", "GUNMOD", "MAGAZINE", "PET_ARMOR", "TOOL", "TOOLMOD", "WHEEL"]);

type JsonRecord = Record<string, unknown>;
type IndexedItem = KnowledgeItemSummary & { raw: JsonRecord };
type KnowledgeIndex = { items: Map<string, IndexedItem>; recipes: KnowledgeRecipe[]; modIds: string[] };
type RawRequirement = { id: string; value: JsonRecord };
type ProficiencyDefinition = { id: string; name: string; timeMultiplier: number | null; skillPenalty: number | null };
type QualityDefinition = { id: string; name: string };

type ModSource = { id: string; rootPath: string };

class KnowledgeService {
    private window: BrowserWindow | null = null;
    private index: KnowledgeIndex | null = null;
    private status: KnowledgeIndexStatus = { status: "idle" };
    private indexKey: string | null = null;

    initialize(): void {
        ipcMain.handle(Bridge.Knowledge.open, (_, worldFolderName: string) => this.open(worldFolderName));
        ipcMain.handle(Bridge.Knowledge.getStatus, () => this.status);
        ipcMain.handle(Bridge.Knowledge.searchItems, (_, query: string, limit = 100) => this.searchItems(query, limit));
        ipcMain.handle(Bridge.Knowledge.getItem, (_, itemId: string) => this.getItem(itemId));
    }

    private async open(worldFolderName: string): Promise<void> {
        const bundle = await gameBundleService.getActiveGameBundle();
        if (bundle === null) throw new Error("Active game bundle is not available.");
        const modsPath = join(bundle.userdataPath, "save", worldFolderName, "mods.json");
        const modIds = this.readStringArray(await readFile(modsPath, "utf8"));

        this.createOrFocusWindow();
        const indexKey = `${bundle.id}:${worldFolderName}:${modIds.join(",")}`;
        if (this.index !== null && this.indexKey === indexKey) {
            this.publish({ status: "ready", itemCount: this.index.items.size, recipeCount: this.index.recipes.length, modIds: this.index.modIds });
            return;
        }
        await this.buildIndex(bundle.path, bundle.userdataPath, modIds);
        this.indexKey = indexKey;
    }

    private createOrFocusWindow(): void {
        if (this.window !== null && !this.window.isDestroyed()) {
            this.window.focus();
            return;
        }
        const isDark = nativeTheme.shouldUseDarkColors;
        const savedWindowState = appSettings.get("knowledgeWindowState");
        const bounds = resolveWindowBounds(savedWindowState.bounds, { width: 1180, height: 780 });
        this.window = new BrowserWindow({
            ...bounds,
            minWidth: 760,
            minHeight: 520,
            show: false,
            autoHideMenuBar: true,
            backgroundColor: isDark ? "#141517" : "#f8f9fa",
            webPreferences: { preload: join(__dirname, "../preload/index.js"), sandbox: false }
        });
        attachWindowStatePersistence(this.window, savedWindowState, (state) => appSettings.set({ knowledgeWindowState: state }));
        attachRendererLogging(this.window);
        this.window.once("ready-to-show", () => {
            if (savedWindowState.maximized) this.window?.maximize();
            this.window?.show();
        });
        this.window.on("closed", () => (this.window = null));
        if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
            void this.window.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}?view=knowledge`);
        } else {
            void this.window.loadFile(join(__dirname, "../renderer/index.html"), { query: { view: "knowledge" } });
        }
    }

    private async buildIndex(bundlePath: string, userdataPath: string, modIds: string[]): Promise<void> {
        this.index = null;
        this.publish({ status: "building", processedFiles: 0, totalFiles: 0 });
        try {
            const sources = await this.findModSources(bundlePath, userdataPath, modIds);
            const files = (await Promise.all(sources.map(async (source) => ({ source, files: await this.listJsonFiles(source.rootPath) })))).flatMap(({ source, files }) => files.map((file) => ({ source, file })));
            this.publish({ status: "building", processedFiles: 0, totalFiles: files.length });

            const rawItems = new Map<string, JsonRecord>();
            const itemSources = new Map<string, string>();
            const rawRecipes = new Map<string, JsonRecord>();
            const recipeEntries: Array<{ value: JsonRecord; sourceModId: string }> = [];
            const requirements = new Map<string, RawRequirement>();
            const proficiencies = new Map<string, ProficiencyDefinition>();
            const qualities = new Map<string, QualityDefinition>();
            let processed = 0;
            for (const { source, file } of files) {
                const values = this.readDefinitions(await readFile(file, "utf8"));
                for (const value of values) {
                    const type = typeof value.type === "string" ? value.type : "";
                    if (ITEM_TYPES.has(type)) {
                        const id = typeof value.id === "string" ? value.id : null;
                        if (id !== null) {
                            const parentId = typeof value["copy-from"] === "string" ? value["copy-from"] : null;
                            const parent = parentId === null ? undefined : rawItems.get(parentId);
                            rawItems.set(id, parent === undefined ? value : { ...parent, ...value, id });
                            itemSources.set(id, source.id);
                        }
                    } else if (type === "requirement" && typeof value.id === "string") {
                        const previous = requirements.get(value.id)?.value;
                        requirements.set(value.id, { id: value.id, value: this.mergeDefinition(previous, value) });
                    } else if (type === "tool_quality" && typeof value.id === "string") {
                        qualities.set(value.id, { id: value.id, name: this.translationText(value.name) ?? value.id });
                    } else if (type === "proficiency" && typeof value.id === "string") {
                        proficiencies.set(value.id, {
                            id: value.id,
                            name: this.translationText(value.name) ?? value.id,
                            timeMultiplier: typeof value.default_time_multiplier === "number" ? value.default_time_multiplier : null,
                            skillPenalty: typeof value.default_skill_penalty === "number" ? value.default_skill_penalty : null
                        });
                    } else if (type === "recipe" && typeof value.result === "string") {
                        const parentId = typeof value["copy-from"] === "string" ? value["copy-from"] : null;
                        const parent = parentId === null ? undefined : rawRecipes.get(parentId);
                        const resolved = parent === undefined ? value : { ...parent, ...value, result: value.result };
                        rawRecipes.set(String(value.result), resolved);
                        recipeEntries.push({ value: resolved, sourceModId: source.id });
                    }
                }
                processed += 1;
                if (processed % 100 === 0 || processed === files.length) this.publish({ status: "building", processedFiles: processed, totalFiles: files.length });
            }

            const items = new Map<string, IndexedItem>();
            for (const [id, raw] of rawItems) {
                items.set(id, {
                    id,
                    name: this.translationText(raw.name) ?? id,
                    description: this.translationText(raw.description),
                    type: String(raw.type ?? "ITEM"),
                    sourceModId: itemSources.get(id) ?? "unknown",
                    raw
                });
            }
            const qualityProviders = this.buildQualityProviders(items);
            const recipes = recipeEntries.map((entry, sequence) => this.toRecipe(entry.value, entry.sourceModId, sequence, requirements, proficiencies, qualities, qualityProviders));
            this.index = { items, recipes, modIds };
            this.publish({ status: "ready", itemCount: items.size, recipeCount: recipes.length, modIds });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.publish({ status: "error", message });
            throw error;
        }
    }

    private searchItems(query: string, limit: number): KnowledgeItemSummary[] {
        if (this.index === null) return [];
        const normalized = query.trim().toLocaleLowerCase();
        return [...this.index.items.values()]
            .filter((item) => normalized.length === 0 || item.id.toLocaleLowerCase().includes(normalized) || item.name.toLocaleLowerCase().includes(normalized))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, Math.max(1, Math.min(limit, 500)))
            .map(({ raw: _raw, ...summary }) => summary);
    }

    private getItem(itemId: string): KnowledgeItemDetails | null {
        if (this.index === null) return null;
        const item = this.index.items.get(itemId);
        if (item === undefined) return null;
        const recipes = this.index.recipes.filter((recipe) => recipe.resultId === itemId).map((recipe) => this.resolveRecipeItemNames(recipe));
        const usedIn = this.index.recipes
            .filter((recipe) => recipe.components.some((group) => group.some((alternative) => alternative.itemId === itemId)))
            .map((recipe) => ({ resultId: recipe.resultId, resultName: this.index?.items.get(recipe.resultId)?.name ?? recipe.resultId, recipeKey: recipe.key }));
        const { raw: _raw, ...summary } = item;
        return { ...summary, recipes, usedIn };
    }

    private async findModSources(bundlePath: string, userdataPath: string, activeModIds: string[]): Promise<ModSource[]> {
        const manifests = [...(await this.findFiles(join(bundlePath, "data", "mods"), "modinfo.json")), ...(await this.findFiles(join(userdataPath, "mods"), "modinfo.json"))];
        const byId = new Map<string, ModSource>();
        for (const manifestPath of manifests) {
            for (const entry of this.readDefinitions(await readFile(manifestPath, "utf8"))) {
                if (entry.type !== "MOD_INFO" || typeof entry.id !== "string") continue;
                const configuredPath = typeof entry.path === "string" ? entry.path : ".";
                byId.set(entry.id, { id: entry.id, rootPath: resolve(dirname(manifestPath), configuredPath) });
            }
        }
        return activeModIds.map((id) => byId.get(id)).filter((source): source is ModSource => source !== undefined);
    }

    private async findFiles(root: string, fileName: string): Promise<string[]> {
        const result: string[] = [];
        let entries;
        try {
            entries = await readdir(root, { withFileTypes: true });
        } catch {
            return result;
        }
        for (const entry of entries) {
            const path = join(root, entry.name);
            if (entry.isDirectory()) result.push(...(await this.findFiles(path, fileName)));
            else if (entry.isFile() && entry.name === fileName) result.push(path);
        }
        return result;
    }

    private async listJsonFiles(root: string): Promise<string[]> {
        const result: string[] = [];
        let entries;
        try {
            entries = await readdir(root, { withFileTypes: true });
        } catch {
            return result;
        }
        for (const entry of entries) {
            const path = join(root, entry.name);
            if (entry.isDirectory()) result.push(...(await this.listJsonFiles(path)));
            else if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "modinfo.json") result.push(path);
        }
        return result;
    }

    private readDefinitions(text: string): JsonRecord[] {
        const value = parse(text) as unknown;
        if (Array.isArray(value)) return value.filter((entry): entry is JsonRecord => this.isRecord(entry));
        return this.isRecord(value) ? [value] : [];
    }

    private readStringArray(text: string): string[] {
        const value = parse(text) as unknown;
        return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
    }

    private toRecipe(
        value: JsonRecord,
        sourceModId: string,
        sequence: number,
        requirements: Map<string, RawRequirement>,
        proficiencies: Map<string, ProficiencyDefinition>,
        qualities: Map<string, QualityDefinition>,
        qualityProviders: Map<string, KnowledgeRecipe["qualities"][number]["providers"]>
    ): KnowledgeRecipe {
        const resultId = String(value.result);
        return {
            key: `${resultId}:${String(value.id_suffix ?? "")}:${sequence}`,
            resultId,
            resultCount: typeof value.result_mult === "number" ? value.result_mult : 1,
            sourceModId,
            difficulty: typeof value.difficulty === "number" ? value.difficulty : null,
            skillUsed: typeof value.skill_used === "string" ? value.skill_used : null,
            requiredSkills: this.toSkillRequirements(value.skills_required),
            time: typeof value.time === "string" || typeof value.time === "number" ? value.time : null,
            activityLevel: typeof value.activity_level === "string" ? value.activity_level : null,
            components: this.toRequirementGroups(value.components),
            tools: this.toRequirementGroups(value.tools),
            qualities: this.toQualityRequirements(value.qualities, qualities, qualityProviders),
            using: this.toRequirementReferences(value.using),
            byproducts: this.toByproducts(value.byproducts),
            proficiencies: this.toProficiencies(value.proficiencies, proficiencies),
            resolvedRequirements: this.resolveRequirements(value.using, requirements, qualities, qualityProviders)
        };
    }

    private resolveRecipeItemNames(recipe: KnowledgeRecipe): KnowledgeRecipe {
        if (this.index === null) return recipe;
        const itemName = (itemId: string): string => this.index?.items.get(itemId)?.name ?? itemId;
        const resolveGroups = (groups: KnowledgeRequirementGroup[]): KnowledgeRequirementGroup[] => groups.map((group) => group.map((entry) => ({ ...entry, itemName: itemName(entry.itemId) })));
        return {
            ...recipe,
            components: resolveGroups(recipe.components),
            tools: resolveGroups(recipe.tools),
            resolvedRequirements: recipe.resolvedRequirements.map((requirement) => ({
                ...requirement,
                components: resolveGroups(requirement.components),
                tools: resolveGroups(requirement.tools)
            })),
            byproducts: recipe.byproducts.map((entry) => ({ ...entry, itemName: itemName(entry.itemId) }))
        };
    }

    private toProficiencies(value: unknown, definitions: Map<string, ProficiencyDefinition>): KnowledgeRecipe["proficiencies"] {
        if (!Array.isArray(value)) return [];
        return value.flatMap((entry) => {
            if (!this.isRecord(entry) || typeof entry.proficiency !== "string") return [];
            const definition = definitions.get(entry.proficiency);
            return [
                {
                    proficiencyId: entry.proficiency,
                    proficiencyName: definition?.name ?? entry.proficiency,
                    required: entry.required === true,
                    timeMultiplier: typeof entry.time_multiplier === "number" ? entry.time_multiplier : (definition?.timeMultiplier ?? null),
                    skillPenalty: typeof entry.skill_penalty === "number" ? entry.skill_penalty : (definition?.skillPenalty ?? null)
                }
            ];
        });
    }

    private resolveRequirements(
        value: unknown,
        requirements: Map<string, RawRequirement>,
        qualities: Map<string, QualityDefinition>,
        qualityProviders: Map<string, KnowledgeRecipe["qualities"][number]["providers"]>
    ): KnowledgeResolvedRequirement[] {
        const references = this.toRequirementReferences(value);
        return references.flatMap((reference) => {
            const definition = requirements.get(reference.requirementId)?.value;
            if (definition === undefined) return [];
            return [
                {
                    requirementId: reference.requirementId,
                    multiplier: reference.multiplier,
                    components: this.multiplyGroups(this.toRequirementGroups(definition.components), reference.multiplier),
                    tools: this.multiplyToolGroups(this.toRequirementGroups(definition.tools), reference.multiplier),
                    qualities: this.toQualityRequirements(definition.qualities, qualities, qualityProviders)
                }
            ];
        });
    }

    private multiplyGroups(groups: KnowledgeRequirementGroup[], multiplier: number): KnowledgeRequirementGroup[] {
        return groups.map((group) => group.map((entry) => ({ ...entry, count: entry.count * multiplier })));
    }

    private multiplyToolGroups(groups: KnowledgeRequirementGroup[], multiplier: number): KnowledgeRequirementGroup[] {
        return groups.map((group) => group.map((entry) => ({ ...entry, count: entry.count > 0 ? entry.count * multiplier : entry.count })));
    }

    private mergeDefinition(previous: JsonRecord | undefined, current: JsonRecord): JsonRecord {
        if (previous === undefined) return current;
        const merged: JsonRecord = { ...previous, ...current };
        const extend = this.isRecord(current.extend) ? current.extend : null;
        if (extend !== null) {
            for (const [key, extension] of Object.entries(extend)) {
                if (!Array.isArray(extension)) continue;
                const original = Array.isArray(merged[key]) ? (merged[key] as unknown[]) : [];
                if ((key === "tools" || key === "components") && original.length > 0) {
                    const combined = original.map((group) => (Array.isArray(group) ? [...group] : group));
                    extension.forEach((group, index) => {
                        if (!Array.isArray(group)) return;
                        if (index < combined.length && Array.isArray(combined[index])) {
                            combined[index] = [...(combined[index] as unknown[]), ...group];
                        } else {
                            combined.push(group);
                        }
                    });
                    merged[key] = combined;
                } else {
                    merged[key] = [...original, ...extension];
                }
            }
        }
        const deleted = this.isRecord(current.delete) ? current.delete : null;
        if (deleted !== null) {
            for (const [key, removal] of Object.entries(deleted)) {
                if (!Array.isArray(removal) || !Array.isArray(merged[key])) continue;
                const removalKeys = new Set(removal.map((entry) => JSON.stringify(entry)));
                merged[key] = (merged[key] as unknown[]).filter((entry) => !removalKeys.has(JSON.stringify(entry)));
            }
        }
        return merged;
    }

    private toSkillRequirements(value: unknown): KnowledgeRecipe["requiredSkills"] {
        if (!Array.isArray(value)) return [];
        return value.flatMap((entry) => (Array.isArray(entry) && typeof entry[0] === "string" ? [{ skillId: entry[0], level: typeof entry[1] === "number" ? entry[1] : 1 }] : []));
    }

    private toQualityRequirements(value: unknown, definitions: Map<string, QualityDefinition>, providers: Map<string, KnowledgeRecipe["qualities"][number]["providers"]>): KnowledgeRecipe["qualities"] {
        if (!Array.isArray(value)) return [];
        return value.flatMap((entry) =>
            this.isRecord(entry) && typeof entry.id === "string"
                ? [
                      {
                          qualityId: entry.id,
                          qualityName: definitions.get(entry.id)?.name ?? entry.id,
                          level: typeof entry.level === "number" ? entry.level : 1,
                          providers: (providers.get(entry.id) ?? []).filter((provider) => provider.level >= (typeof entry.level === "number" ? entry.level : 1))
                      }
                  ]
                : []
        );
    }

    private buildQualityProviders(items: Map<string, IndexedItem>): Map<string, KnowledgeRecipe["qualities"][number]["providers"]> {
        const result = new Map<string, KnowledgeRecipe["qualities"][number]["providers"]>();
        for (const item of items.values()) {
            const rawQualities = item.raw.qualities;
            if (!Array.isArray(rawQualities)) continue;
            for (const entry of rawQualities) {
                if (!this.isRecord(entry) || typeof entry.id !== "string") continue;
                const level = typeof entry.level === "number" ? entry.level : 1;
                const providers = result.get(entry.id) ?? [];
                providers.push({ itemId: item.id, itemName: item.name, level });
                result.set(entry.id, providers);
            }
        }
        for (const providers of result.values()) providers.sort((a, b) => b.level - a.level || a.itemName.localeCompare(b.itemName));
        return result;
    }

    private toRequirementReferences(value: unknown): KnowledgeRecipe["using"] {
        if (!Array.isArray(value)) return [];
        return value.flatMap((entry) => (Array.isArray(entry) && typeof entry[0] === "string" ? [{ requirementId: entry[0], multiplier: typeof entry[1] === "number" ? entry[1] : 1 }] : []));
    }

    private toByproducts(value: unknown): KnowledgeRecipe["byproducts"] {
        if (!Array.isArray(value)) return [];
        return value.flatMap((entry) => (Array.isArray(entry) && typeof entry[0] === "string" ? [{ itemId: entry[0], itemName: entry[0], count: typeof entry[1] === "number" ? entry[1] : 1 }] : []));
    }

    private toRequirementGroups(value: unknown): KnowledgeRequirementGroup[] {
        if (!Array.isArray(value)) return [];
        return value.map((group) => {
            if (!Array.isArray(group)) return [];
            return group.flatMap((entry) => (Array.isArray(entry) && typeof entry[0] === "string" ? [{ itemId: entry[0], itemName: entry[0], count: typeof entry[1] === "number" ? entry[1] : 1 }] : []));
        });
    }

    private translationText(value: unknown): string | null {
        if (typeof value === "string") return value;
        if (!this.isRecord(value)) return null;
        return typeof value.str === "string" ? value.str : null;
    }

    private isRecord(value: unknown): value is JsonRecord {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }

    private publish(status: KnowledgeIndexStatus): void {
        this.status = status;
        if (this.window !== null && !this.window.isDestroyed()) this.window.webContents.send(Bridge.Knowledge.statusChanged, status);
    }
}

export const knowledgeService = new KnowledgeService();
