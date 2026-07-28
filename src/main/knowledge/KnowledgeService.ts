import { ipcMain } from "electron";
import { Bridge } from "@shared/bridge-api/Bridge";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
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

class KnowledgeService {
    private context: TKnowledgeIndexContext | null = null;
    private index: TKnowledgeIndex | null = null;
    private status: KnowledgeIndexStatus = { status: "idle" };
    private lastProgressPublishAt = 0;
    private progressPublishCount = 0;
    private progressPublishDurationMs = 0;

    initialize(): void {
        ipcMain.handle(Bridge.Knowledge.open, (_, worldFolderName: string) => this.open(worldFolderName));
        ipcMain.handle(Bridge.Knowledge.rebuild, () => this.rebuild());
        ipcMain.handle(Bridge.Knowledge.getStatus, () => this.status);
        ipcMain.handle(Bridge.Knowledge.searchEntities, (_, query: string, category: string | null, limit = 200) => this.search(query, category, limit));
        ipcMain.handle(Bridge.Knowledge.getEntity, (_, key: string) => this.getEntity(key));
    }

    private async open(worldFolderName: string): Promise<void> {
        knowledgeWindowService.open();

        // Create context
        const bundle = await gameBundleService.getActiveGameBundle();
        const workspace = workspaceService.getReadyWorkspace();
        if (bundle === null || workspace === null) throw new Error("Active game bundle or workspace is not available.");
        const parsed = parse(await readFile(join(bundle.userdataPath, "save", worldFolderName, "mods.json"), "utf8")) as unknown;
        const modIds = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
        this.context = { bundleId: bundle.id, bundlePath: bundle.path, userdataPath: bundle.userdataPath, worldFolderName, modIds, workspacePath: workspace.path };

        const cached = await knowledgeIndexStore.load(this.context);
        if (cached !== null) {
            this.index = cached;
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
        this.index = null;
        this.publish({ status: "building", processedFiles: 0, totalFiles: 0 });

        const dropStarted = performance.now();
        await knowledgeIndexStore.drop(this.context);
        console.info(`[knowledge:index] rebuild drop durationMs=${Math.round(performance.now() - dropStarted)}`);

        await this.build(false);
        console.info(`[knowledge:index] rebuild total durationMs=${Math.round(performance.now() - rebuildStarted)}`);
    }

    private async build(publishInitialStatus = true): Promise<void> {
        if (this.context === null) throw new Error("Knowledge context is not available.");

        this.index = null;
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
            this.index = index;
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

    private search(query: string, category: string | null, limit: number): KnowledgeEntitySummary[] {
        if (this.index === null) return [];
        const normalized = query.trim().toLocaleLowerCase();
        return (
            this.index.entities
                .filter((entity) => category === null || entity.category === category)
                .filter(
                    (entity) =>
                        normalized.length === 0 || entity.name.toLocaleLowerCase().includes(normalized) || entity.id.toLocaleLowerCase().includes(normalized) || entity.jsonType.toLocaleLowerCase().includes(normalized)
                )
                .sort((left, right) => left.name.localeCompare(right.name))
                .slice(0, limit)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .map(({ sourceFile: _sourceFile, raw: _raw, ...summary }) => summary)
        );
    }

    private getEntity(key: string): KnowledgeEntityDetails | null {
        return this.index?.entities.find((entity) => entity.key === key) ?? null;
    }

    private publish(status: KnowledgeIndexStatus): void {
        this.status = status;
        knowledgeWindowService.send(Bridge.Knowledge.statusChanged, status);
    }

    private createReadyStatus(index: TKnowledgeIndex, loadedFromCache: boolean): KnowledgeIndexStatus {
        const counts = new Map<string, number>();
        for (const entity of index.entities) counts.set(entity.category, (counts.get(entity.category) ?? 0) + 1);
        return {
            status: "ready",
            entityCount: index.entities.length,
            sourceCount: index.sourceCount,
            modIds: index.modIds,
            categories: [...counts].map(([id, count]) => ({ id, count })).sort((left, right) => left.id.localeCompare(right.id)),
            loadedFromCache
        };
    }
}

export const knowledgeService = new KnowledgeService();
