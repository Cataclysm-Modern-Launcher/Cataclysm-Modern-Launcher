import { ipcMain } from "electron";
import { Bridge } from "@shared/bridge-api/Bridge";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import { KnowledgeEntityReference } from "@shared/knowledge/KnowledgeEntityReference";
import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";
import { knowledgeIndexStore } from "./KnowledgeIndexStore";
import { knowledgeWindowService } from "./KnowledgeWindowService";
import { gameBundleService } from "../GameBundleService";
import { workspaceService } from "../WorkspaceService";
import { parse } from "jsonc-parser";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildKnowledgeIndex } from "./buildKnowledgeIndex";
import { TKnowledgeIndex } from "./types/TKnowledgeIndex";
import { TKnowledgeIndexContext } from "./types/TKnowledgeIndexContext";
import { TKnowledgeGraphEdge } from "./graph/types/TKnowledgeGraphEdge";
import { TKnowledgeGraphNode } from "./graph/types/TKnowledgeGraphNode";
import { isKnowledgeEntitySearchable } from "./isKnowledgeEntitySearchable";
import { KnowledgeTranslationService } from "./KnowledgeTranslationService";
import { KnowledgeLanguageInfo } from "@shared/knowledge/KnowledgeLanguageInfo";
import { KnowledgeRecipeRequirements } from "@shared/knowledge/KnowledgeRecipeRequirements";
import { KnowledgeRecipeRequirementGroup } from "@shared/knowledge/KnowledgeRecipeRequirementGroup";
import { KnowledgeRecipeRequirementAlternative } from "@shared/knowledge/KnowledgeRecipeRequirementAlternative";
import { KnowledgeItemDestruction, KnowledgeItemDestructionAction, KnowledgeItemDestructionResult } from "@shared/knowledge/KnowledgeItemDestruction";
import { isRecord } from "@shared/utils/isRecord";
import { readNumber } from "@shared/utils/readNumber";
import { KnowledgeMonsterHarvest, KnowledgeMonsterHarvestEntry } from "@shared/knowledge/KnowledgeMonsterHarvest";
import { KnowledgeLocationSpawn } from "@shared/knowledge/KnowledgeLocation";
import type { LocationBuildIndex } from "./locations/buildKnowledgeLocations";
import { buildKnowledgeLocations, buildKnowledgeTerrainLocation, createKnowledgeLocationBuildIndex } from "./locations/buildKnowledgeLocations";
import { appendMapValue } from "@shared/utils/appendMapValue";

function normalizeSearchText(value: string): string {
    return value.toLocaleLowerCase().replaceAll("ё", "е");
}

class KnowledgeService {
    private context: TKnowledgeIndexContext | null = null;
    private index: TKnowledgeIndex | null = null;
    private status: KnowledgeIndexStatus = { status: "idle" };
    private readonly entityByKey = new Map<string, KnowledgeEntityDetails>();
    private locationEntities: KnowledgeEntityDetails[] = [];
    private locationBuildIndex: LocationBuildIndex | null = null;
    private readonly nodeByKey = new Map<string, TKnowledgeGraphNode>();
    private readonly incomingEdgesByKey = new Map<string, TKnowledgeGraphEdge[]>();
    private readonly outgoingEdgesByKey = new Map<string, TKnowledgeGraphEdge[]>();
    private lastProgressPublishAt = 0;
    private progressPublishCount = 0;
    private progressPublishDurationMs = 0;
    private readonly translations = new KnowledgeTranslationService();

    initialize(): void {
        ipcMain.handle(Bridge.Knowledge.open, (_, worldFolderName: string) => this.open(worldFolderName));
        ipcMain.handle(Bridge.Knowledge.rebuild, () => this.rebuild());
        ipcMain.handle(Bridge.Knowledge.getStatus, () => this.status);
        ipcMain.handle(Bridge.Knowledge.getLanguage, () => this.getLanguage());
        ipcMain.handle(Bridge.Knowledge.searchEntities, (_, query: string, category: string | null, limit = 200, localized = true) => this.search(query, category, limit, localized));
        ipcMain.handle(Bridge.Knowledge.getEntity, (_, key: string, localized = true) => this.getEntity(key, localized));
        ipcMain.handle(Bridge.Knowledge.getEntityRelations, (_, key: string, localized = true) => this.getEntityRelations(key, localized));
        ipcMain.handle(Bridge.Knowledge.getEntityRelationsBatch, (_, keys: string[], localized = true) => this.getEntityRelationsBatch(keys, localized));
    }

    private async open(worldFolderName: string): Promise<void> {
        knowledgeWindowService.open();

        // Create context
        const bundle = await gameBundleService.getActiveGameBundle();
        const workspace = workspaceService.getReadyWorkspace();
        if (bundle === null || workspace === null) throw new Error("Active game bundle or workspace is not available.");
        const parsed = parse(await readFile(join(bundle.userdataPath, "save", worldFolderName, "mods.json"), "utf8")) as unknown;
        const modIds = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
        await this.translations.load(bundle.path, bundle.userdataPath);
        this.context = { bundleId: bundle.id, bundlePath: bundle.path, userdataPath: bundle.userdataPath, worldFolderName, modIds, workspacePath: workspace.path };

        const cached = await knowledgeIndexStore.load(this.context);
        if (cached !== null) {
            this.setIndex(cached);
            console.info(
                `[knowledge:index] loaded persistent index entities=${cached.entities.length} graphNodes=${cached.graph.nodes.length} graphEdges=${cached.graph.edges.length} unresolved=${cached.graph.unresolved.length}`
            );
            this.publish(this.createReadyStatus(cached, true));
            return;
        }

        await this.build();
    }

    private async rebuild(): Promise<void> {
        if (this.context === null) throw new Error("Knowledge context is not available.");

        const rebuildStarted = performance.now();
        this.clearIndex();
        this.publish({ status: "building", processedFiles: 0, totalFiles: 0 });

        const dropStarted = performance.now();
        await knowledgeIndexStore.drop(this.context);
        console.info(`[knowledge:index] rebuild drop durationMs=${Math.round(performance.now() - dropStarted)}`);

        await this.build(false);
        console.info(`[knowledge:index] rebuild total durationMs=${Math.round(performance.now() - rebuildStarted)}`);
    }

    private async build(publishInitialStatus = true): Promise<void> {
        if (this.context === null) throw new Error("Knowledge context is not available.");

        this.clearIndex();
        this.lastProgressPublishAt = 0;
        this.progressPublishCount = 0;
        this.progressPublishDurationMs = 0;
        if (publishInitialStatus) this.publish({ status: "building", processedFiles: 0, totalFiles: 0 });
        try {
            const buildStarted = performance.now();
            const index = await buildKnowledgeIndex(this.context, (progress) => this.publishBuildProgress(progress));
            console.info(
                `[knowledge:index] build pipeline durationMs=${Math.round(performance.now() - buildStarted)} progressPublishes=${this.progressPublishCount} progressPublishDurationMs=${Math.round(this.progressPublishDurationMs)}`
            );
            const persistenceStarted = performance.now();
            await knowledgeIndexStore.save(this.context, index);
            console.info(`[knowledge:graph] persistence durationMs=${Math.round(performance.now() - persistenceStarted)}`);
            this.setIndex(index);
            this.publish(this.createReadyStatus(index, false));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("[knowledge:index] build failed", error);
            this.publish({ status: "error", message });
            throw error;
        }
    }

    private publishBuildProgress(progress: { processedFiles: number; totalFiles: number }): void {
        const now = performance.now();
        const isBoundary = progress.processedFiles === 0 || progress.processedFiles === progress.totalFiles;
        if (!isBoundary && now - this.lastProgressPublishAt < 200) return;

        this.lastProgressPublishAt = now;
        const publishStarted = performance.now();
        this.publish({ status: "building", ...progress });
        this.progressPublishCount += 1;
        this.progressPublishDurationMs += performance.now() - publishStarted;
    }

    private search(query: string, category: string | null, limit: number, localized: boolean): KnowledgeEntitySummary[] {
        if (this.index === null) return [];
        const normalized = normalizeSearchText(query.trim());
        return (
            [...this.index.entities, ...this.locationEntities]
                .filter(isKnowledgeEntitySearchable)
                .filter(isKnowledgeSearchRepresentative)
                .filter((entity) => category === null || entity.category === category)
                .filter((entity) => normalized.length === 0 || this.matchesSearch(entity, normalized))
                .sort((left, right) => this.displayName(left, localized).localeCompare(this.displayName(right, localized), this.translations.getLanguage()))
                .slice(0, limit)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .map(({ sourceFile: _sourceFile, raw: _raw, ...summary }) => this.localizeSummary(summary, localized))
        );
    }

    private matchesSearch(entity: KnowledgeEntityDetails, normalized: string): boolean {
        const matches = (name: string, id: string, jsonType: string): boolean =>
            normalizeSearchText(name).includes(normalized) ||
            normalizeSearchText(this.translations.translate(name)).includes(normalized) ||
            normalizeSearchText(id).includes(normalized) ||
            normalizeSearchText(jsonType).includes(normalized);
        if (matches(entity.name, entity.id, entity.jsonType)) return true;
        return entity.location?.appearanceVariants?.some((variant) => matches(variant.name, variant.id, variant.jsonType)) === true;
    }

    private getEntity(key: string, localized: boolean): KnowledgeEntityDetails | null {
        let entity = this.entityByKey.get(key);
        if (entity === undefined && this.locationBuildIndex !== null) {
            entity = buildKnowledgeTerrainLocation(key, this.locationBuildIndex) ?? undefined;
            if (entity !== undefined) this.entityByKey.set(entity.key, entity);
        }
        return entity === undefined ? null : this.localizeEntity(entity, localized);
    }

    private getEntityRelations(key: string, localized: boolean): KnowledgeEntityRelations {
        return {
            incoming: (this.incomingEdgesByKey.get(key) ?? []).map((edge) => this.toRelation(edge, "incoming", localized)),
            outgoing: (this.outgoingEdgesByKey.get(key) ?? []).map((edge) => this.toRelation(edge, "outgoing", localized))
        };
    }

    private getEntityRelationsBatch(keys: string[], localized: boolean): Record<string, KnowledgeEntityRelations> {
        return Object.fromEntries([...new Set(keys)].map((key) => [key, this.getEntityRelations(key, localized)]));
    }

    private toRelation(edge: TKnowledgeGraphEdge, direction: KnowledgeEntityRelation["direction"], localized: boolean): KnowledgeEntityRelation {
        const relatedKey = direction === "incoming" ? edge.sourceKey : edge.targetKey;
        return {
            kind: edge.kind,
            direction,
            entity: this.getEntityReference(relatedKey, localized),
            metadata: edge.metadata
        };
    }

    private getEntityReference(key: string, localized: boolean): KnowledgeEntityReference {
        const entity = this.entityByKey.get(key);
        if (entity !== undefined) {
            return {
                key: entity.key,
                id: entity.id,
                name: this.displayName(entity, localized),
                jsonType: entity.jsonType,
                sourceModId: entity.sourceModId,
                virtual: false
            };
        }

        const node = this.nodeByKey.get(key);
        if (node !== undefined) {
            return {
                key: node.key,
                id: node.id,
                name: node.id,
                jsonType: node.type,
                sourceModId: node.sourceModId,
                virtual: node.virtual === true
            };
        }

        return { key, id: key, name: key, jsonType: "unknown", sourceModId: "unknown", virtual: true };
    }

    private getLanguage(): KnowledgeLanguageInfo {
        return { gameLanguage: this.translations.getLanguage(), hasTranslation: this.translations.hasTranslation };
    }

    private displayName(entity: KnowledgeEntitySummary, localized: boolean): string {
        return localized ? this.translations.translate(entity.name) : entity.name;
    }

    private localizeSummary(entity: KnowledgeEntitySummary, localized: boolean): KnowledgeEntitySummary {
        if (!localized) return entity;
        return { ...entity, name: this.translations.translate(entity.name), description: entity.description === null ? null : this.translations.translate(entity.description) };
    }

    private localizeEntity(entity: KnowledgeEntityDetails, localized: boolean): KnowledgeEntityDetails {
        const localizedEntity = localized ? { ...this.localizeSummary(entity, true), sourceFile: entity.sourceFile, raw: this.translations.translateValue(entity.raw) as Record<string, unknown> } : entity;
        if (entity.jsonType === "recipe" || entity.jsonType === "uncraft") {
            return { ...localizedEntity, recipeRequirements: this.buildRecipeRequirements(entity.key, localized) };
        }
        if (entity.jsonType === "ITEM") {
            return {
                ...localizedEntity,
                itemDestruction: this.buildItemDestruction(entity, localized),
                locationAppearances: this.buildLocationAppearances(entity.key, "loot", localized)
            };
        }
        if (entity.jsonType === "MONSTER") {
            const monsterHarvest = this.buildMonsterHarvest(entity, localized);
            return {
                ...localizedEntity,
                ...(monsterHarvest === undefined ? {} : { monsterHarvest }),
                locationAppearances: this.buildLocationAppearances(entity.key, "monsters", localized)
            };
        }
        if (entity.jsonType === "LOCATION" && entity.location !== undefined) {
            return {
                ...localizedEntity,
                location: {
                    ...entity.location,
                    layouts: this.localizeLocationLayouts(entity.location.layouts, localized),
                    furniture: this.localizeLocationSpawns(entity.location.furniture, localized),
                    loot: this.localizeLocationSpawns(entity.location.loot, localized),
                    monsters: this.localizeLocationSpawns(entity.location.monsters, localized),
                    appearanceVariants: entity.location.appearanceVariants?.map((variant) => ({ ...variant, name: localized ? this.translations.translate(variant.name) : variant.name }))
                }
            };
        }
        return localizedEntity;
    }

    private buildLocationAppearances(entityKey: string, kind: "loot" | "monsters", localized: boolean): KnowledgeLocationSpawn[] {
        return this.locationEntities.flatMap((location): KnowledgeLocationSpawn[] => {
            const appearance = location.location?.[kind].find((entry) => entry.entity.key === entityKey);
            if (appearance === undefined) return [];
            return [{ entity: this.getEntityReference(location.key, localized), chance: appearance.chance, approximate: appearance.approximate }];
        });
    }

    private localizeLocationSpawns(spawns: KnowledgeLocationSpawn[], localized: boolean): KnowledgeLocationSpawn[] {
        if (!localized) return spawns;
        return spawns.map((spawn) => ({ ...spawn, entity: this.getEntityReference(spawn.entity.key, true) }));
    }

    private localizeLocationLayouts(layouts: NonNullable<KnowledgeEntityDetails["location"]>["layouts"], localized: boolean): NonNullable<KnowledgeEntityDetails["location"]>["layouts"] {
        if (!localized) return layouts;
        return layouts.map((layout) => ({
            ...layout,
            rows: layout.rows.map((row) => row.map((cell) => (cell.name === null ? cell : { ...cell, name: this.translations.translate(cell.name) })))
        }));
    }

    private buildMonsterHarvest(entity: KnowledgeEntityDetails, localized: boolean): KnowledgeMonsterHarvest | undefined {
        const harvestId = typeof entity.raw.harvest === "string" ? entity.raw.harvest : undefined;
        if (harvestId === undefined) return undefined;
        const harvest = this.entityByKey.get(`harvest:${harvestId}`);
        if (harvest === undefined || !Array.isArray(harvest.raw.entries)) return undefined;

        const entries = harvest.raw.entries.flatMap((value): KnowledgeMonsterHarvestEntry[] => {
            if (!isRecord(value) || typeof value.drop !== "string") return [];
            const item = this.entityByKey.get(`ITEM:${value.drop}`);
            return [
                {
                    dropId: value.drop,
                    ...(item === undefined ? {} : { drop: this.getEntityReference(item.key, localized) }),
                    type: typeof value.type === "string" ? value.type : null,
                    ...readHarvestNumberField("baseNum", value.base_num),
                    ...readHarvestNumberField("scaleNum", value.scale_num),
                    ...(typeof value.max === "number" ? { max: value.max } : {}),
                    ...(typeof value.mass_ratio === "number" ? { massRatio: value.mass_ratio } : {})
                }
            ];
        });
        return { id: harvestId, entries };
    }

    private buildItemDestruction(entity: KnowledgeEntityDetails, localized: boolean): KnowledgeItemDestruction {
        return {
            actions: this.buildDestructionActions(entity.key, localized),
            obtainedFrom: this.buildObtainedFromActions(entity.key, localized)
        };
    }

    private buildDestructionActions(itemKey: string, localized: boolean): KnowledgeItemDestructionAction[] {
        const actions: KnowledgeItemDestructionAction[] = [];

        for (const edge of this.incomingEdgesByKey.get(itemKey) ?? []) {
            if (edge.kind !== "uncrafts-item") continue;
            const recipe = this.entityByKey.get(edge.sourceKey);
            if (recipe !== undefined) actions.push(this.buildDisassemblyAction(recipe, localized));
        }

        const salvage = this.buildSalvageAction(itemKey, localized);
        if (salvage !== null) actions.push(salvage);

        const breakage = this.buildBreakageAction(itemKey, localized);
        if (breakage !== null) actions.push(breakage);

        return actions;
    }

    private buildObtainedFromActions(itemKey: string, localized: boolean): KnowledgeItemDestructionAction[] {
        const actions = new Map<string, KnowledgeItemDestructionAction>();

        for (const edge of this.incomingEdgesByKey.get(itemKey) ?? []) {
            if (edge.kind === "recovers-component") {
                const recipe = this.entityByKey.get(edge.sourceKey);
                if (recipe === undefined) continue;
                const original = (this.outgoingEdgesByKey.get(recipe.key) ?? []).find((candidate) => candidate.kind === "uncrafts-item");
                if (original === undefined) continue;
                actions.set(`disassembly:${recipe.key}`, this.highlightResult(this.buildDisassemblyAction(recipe, localized, original.targetKey), itemKey));
                continue;
            }

            if (edge.kind === "salvages-into") {
                const action = this.buildSalvageAction(edge.sourceKey, localized, edge.sourceKey);
                if (action !== null) actions.set(`salvage:${edge.sourceKey}`, this.highlightResult(action, itemKey));
                continue;
            }

            if (edge.kind === "breaks-into") {
                const action = this.buildBreakageAction(edge.sourceKey, localized, edge.sourceKey);
                if (action !== null) actions.set(`breakage:${edge.sourceKey}`, this.highlightResult(action, itemKey));
            }
        }

        return [...actions.values()];
    }

    private buildDisassemblyAction(recipe: KnowledgeEntityDetails, localized: boolean, sourceItemKey?: string): KnowledgeItemDestructionAction {
        return {
            kind: "disassembly",
            source: sourceItemKey === undefined ? this.getEntityReference(recipe.key, localized) : this.getEntityReference(sourceItemKey, localized),
            time: readTime(readDisassemblyTime(recipe.raw)),
            results: this.readEdgeResults(recipe.key, "recovers-component", localized),
            requirements: this.buildRecipeRequirements(recipe.key, localized),
            dependencies: ["damage", "component history", "UNRECOVERABLE components"]
        };
    }

    private buildSalvageAction(itemKey: string, localized: boolean, sourceItemKey?: string): KnowledgeItemDestructionAction | null {
        const results = this.readEdgeResults(itemKey, "salvages-into", localized);
        if (results.length === 0) return null;
        const moves = this.findSalvageMoves();
        return {
            kind: "salvage",
            source: sourceItemKey === undefined ? undefined : this.getEntityReference(sourceItemKey, localized),
            timeNote: moves.length === 0 ? undefined : `${Math.min(...moves)}–${Math.max(...moves)} moves per recovered part, depending on the tool`,
            results,
            dependencies: ["item weight and material portions", "fabrication skill", "dexterity", "item damage", "actual component history"]
        };
    }

    private buildBreakageAction(itemKey: string, localized: boolean, sourceItemKey?: string): KnowledgeItemDestructionAction | null {
        const results = this.readEdgeResults(itemKey, "breaks-into", localized);
        if (results.length === 0) return null;
        return {
            kind: "breakage",
            source: sourceItemKey === undefined ? undefined : this.getEntityReference(sourceItemKey, localized),
            results,
            dependencies: ["vehicle-part damage roll"]
        };
    }

    private readEdgeResults(sourceKey: string, kind: "recovers-component" | "salvages-into" | "breaks-into", localized: boolean): KnowledgeItemDestructionResult[] {
        return (this.outgoingEdgesByKey.get(sourceKey) ?? [])
            .filter((edge) => edge.kind === kind)
            .map((edge) => ({
                entity: this.getEntityReference(edge.targetKey, localized),
                count: readNumber(edge.metadata.count) ?? undefined,
                countMin: readNumber(edge.metadata.countMin) ?? undefined,
                countMax: readNumber(edge.metadata.countMax) ?? undefined,
                note: readMetadataString(edge.metadata.materialId) ?? undefined
            }));
    }

    private highlightResult(action: KnowledgeItemDestructionAction, itemKey: string): KnowledgeItemDestructionAction {
        return {
            ...action,
            results: action.results.map((result) => ({ ...result, highlighted: result.entity.key === itemKey }))
        };
    }

    private findSalvageMoves(): number[] {
        const values: number[] = [];
        for (const entity of this.entityByKey.values()) {
            if (entity.jsonType !== "ITEM") continue;
            for (const action of readUseActions(entity.raw.use_action)) {
                if (action.type === "salvage") values.push(readNumber(action.moves_per_part) ?? 25);
            }
        }
        return values;
    }

    private buildRecipeRequirements(recipeKey: string, localized: boolean): KnowledgeRecipeRequirements {
        const tools = new Map<string, KnowledgeRecipeRequirementAlternative[]>();
        const qualities = new Map<string, KnowledgeRecipeRequirementAlternative[]>();
        const components = new Map<string, KnowledgeRecipeRequirementAlternative[]>();
        const recoveredComponents = new Map<string, KnowledgeRecipeRequirementAlternative[]>();

        const appendEdge = (edge: TKnowledgeGraphEdge, groupKey: string, multiplier: number): void => {
            const target = edge.kind === "uses-tool" ? tools : edge.kind === "requires-quality" ? qualities : edge.kind === "uses-component" ? components : edge.kind === "recovers-component" ? recoveredComponents : null;
            if (target === null) return;
            const count = readNumber(edge.metadata.count);
            const metadata = {
                ...edge.metadata,
                groupKey,
                count: count === null || edge.kind === "requires-quality" ? edge.metadata.count : count * multiplier
            };
            const alternative: KnowledgeRecipeRequirementAlternative = {
                kind: edge.kind,
                entity: this.getEntityReference(edge.targetKey, localized),
                metadata
            };
            const values = target.get(groupKey) ?? [];
            values.push(alternative);
            target.set(groupKey, values);
        };

        const visitRequirement = (requirementKey: string, multiplier: number, path: string, visited: Set<string>): void => {
            if (visited.has(requirementKey)) return;
            const nextVisited = new Set(visited).add(requirementKey);
            for (const [index, edge] of (this.outgoingEdgesByKey.get(requirementKey) ?? []).entries()) {
                const localGroup = readMetadataString(edge.metadata.groupKey) ?? `${edge.kind}:${index}`;
                const nestedPath = `${path}/${localGroup}`;
                if (edge.kind === "uses-requirement") {
                    visitRequirement(edge.targetKey, multiplier * (readNumber(edge.metadata.multiplier) ?? readNumber(edge.metadata.count) ?? 1), nestedPath, nextVisited);
                } else {
                    appendEdge(edge, nestedPath, multiplier);
                }
            }
        };

        for (const [index, edge] of (this.outgoingEdgesByKey.get(recipeKey) ?? []).entries()) {
            const localGroup = readMetadataString(edge.metadata.groupKey) ?? `${edge.kind}:${index}`;
            if (edge.kind === "uses-requirement") {
                const alternativeIndex = readNumber(edge.metadata.alternativeIndex);
                const path = `${localGroup}:${edge.targetKey}${alternativeIndex === null ? "" : `:${alternativeIndex}`}`;
                visitRequirement(edge.targetKey, readNumber(edge.metadata.multiplier) ?? readNumber(edge.metadata.count) ?? 1, path, new Set());
            } else {
                appendEdge(edge, localGroup, 1);
            }
        }

        return {
            tools: toRequirementGroups(tools),
            qualities: toRequirementGroups(qualities),
            components: toRequirementGroups(components),
            recoveredComponents: toRequirementGroups(recoveredComponents)
        };
    }

    private setIndex(index: TKnowledgeIndex): void {
        this.clearIndex();
        this.index = index;
        for (const entity of index.entities) this.entityByKey.set(entity.key, entity);
        const locationsStarted = performance.now();
        this.locationBuildIndex = createKnowledgeLocationBuildIndex(index.entities);
        this.locationEntities = buildKnowledgeLocations(index.entities, this.locationBuildIndex);
        console.info(`[knowledge:locations] build durationMs=${Math.round(performance.now() - locationsStarted)} locations=${this.locationEntities.length}`);
        for (const entity of this.locationEntities) this.entityByKey.set(entity.key, entity);
        for (const node of index.graph.nodes) this.nodeByKey.set(node.key, node);
        for (const edge of index.graph.edges) {
            appendMapValue(this.outgoingEdgesByKey, edge.sourceKey, edge);
            appendMapValue(this.incomingEdgesByKey, edge.targetKey, edge);
        }
    }

    private clearIndex(): void {
        this.index = null;
        this.locationEntities = [];
        this.locationBuildIndex = null;
        this.entityByKey.clear();
        this.nodeByKey.clear();
        this.incomingEdgesByKey.clear();
        this.outgoingEdgesByKey.clear();
    }

    private publish(status: KnowledgeIndexStatus): void {
        this.status = status;
        knowledgeWindowService.send(Bridge.Knowledge.statusChanged, status);
    }

    private createReadyStatus(index: TKnowledgeIndex, loadedFromCache: boolean): KnowledgeIndexStatus {
        const searchableEntities = [...index.entities, ...this.locationEntities].filter(isKnowledgeEntitySearchable).filter(isKnowledgeSearchRepresentative);
        const counts = new Map<string, number>();
        for (const entity of searchableEntities) counts.set(entity.category, (counts.get(entity.category) ?? 0) + 1);
        return {
            status: "ready",
            entityCount: searchableEntities.length,
            sourceCount: index.sourceCount,
            modIds: index.modIds,
            categories: [...counts].map(([id, count]) => ({ id, count })).sort((left, right) => left.id.localeCompare(right.id)),
            loadedFromCache,
            language: this.getLanguage()
        };
    }
}

function isKnowledgeSearchRepresentative(entity: KnowledgeEntityDetails): boolean {
    return entity.location?.appearanceRepresentativeKey === undefined || entity.location.appearanceRepresentativeKey === entity.key;
}

function toRequirementGroups(groups: Map<string, KnowledgeRecipeRequirementAlternative[]>): KnowledgeRecipeRequirementGroup[] {
    return [...groups.entries()]
        .map(([key, alternatives]) => ({
            key,
            alternatives: alternatives.sort((left, right) => (readNumber(left.metadata.alternativeIndex) ?? 0) - (readNumber(right.metadata.alternativeIndex) ?? 0))
        }))
        .sort((left, right) => right.alternatives.length - left.alternatives.length);
}

function readMetadataString(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
}

function readDisassemblyTime(raw: Record<string, unknown>): unknown {
    if (raw.reversible !== null && typeof raw.reversible === "object" && !Array.isArray(raw.reversible)) {
        const time = (raw.reversible as Record<string, unknown>).time;
        if (time !== undefined) return time;
    }
    return raw.time;
}

function readTime(value: unknown): string | number | undefined {
    return typeof value === "string" || typeof value === "number" ? value : undefined;
}

function readUseActions(value: unknown): Record<string, unknown>[] {
    if (isRecord(value)) return [value];
    return Array.isArray(value) ? value.filter(isRecord) : [];
}

function readHarvestNumberField<K extends "baseNum" | "scaleNum">(key: K, value: unknown): Partial<Record<K, number | [number, number]>> {
    if (typeof value === "number") return { [key]: value } as Partial<Record<K, number | [number, number]>>;
    if (Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number") {
        return { [key]: [value[0], value[1]] } as Partial<Record<K, number | [number, number]>>;
    }
    return {};
}

export const knowledgeService = new KnowledgeService();
