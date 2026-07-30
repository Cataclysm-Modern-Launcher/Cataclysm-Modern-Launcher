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

class KnowledgeService {
    private context: TKnowledgeIndexContext | null = null;
    private index: TKnowledgeIndex | null = null;
    private status: KnowledgeIndexStatus = { status: "idle" };
    private readonly entityByKey = new Map<string, KnowledgeEntityDetails>();
    private readonly nodeByKey = new Map<string, TKnowledgeGraphNode>();
    private readonly incomingEdgesByKey = new Map<string, TKnowledgeGraphEdge[]>();
    private readonly outgoingEdgesByKey = new Map<string, TKnowledgeGraphEdge[]>();
    private lastProgressPublishAt = 0;
    private progressPublishCount = 0;
    private progressPublishDurationMs = 0;

    initialize(): void {
        ipcMain.handle(Bridge.Knowledge.open, (_, worldFolderName: string) => this.open(worldFolderName));
        ipcMain.handle(Bridge.Knowledge.rebuild, () => this.rebuild());
        ipcMain.handle(Bridge.Knowledge.getStatus, () => this.status);
        ipcMain.handle(Bridge.Knowledge.searchEntities, (_, query: string, category: string | null, limit = 200) => this.search(query, category, limit));
        ipcMain.handle(Bridge.Knowledge.getEntity, (_, key: string) => this.getEntity(key));
        ipcMain.handle(Bridge.Knowledge.getEntityRelations, (_, key: string) => this.getEntityRelations(key));
        ipcMain.handle(Bridge.Knowledge.getEntityRelationsBatch, (_, keys: string[]) => this.getEntityRelationsBatch(keys));
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

    private search(query: string, category: string | null, limit: number): KnowledgeEntitySummary[] {
        if (this.index === null) return [];
        const normalized = query.trim().toLocaleLowerCase();
        return (
            this.index.entities
                .filter(isKnowledgeEntitySearchable)
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
        return this.entityByKey.get(key) ?? null;
    }

    private getEntityRelations(key: string): KnowledgeEntityRelations {
        return {
            incoming: (this.incomingEdgesByKey.get(key) ?? []).map((edge) => this.toRelation(edge, "incoming")),
            outgoing: (this.outgoingEdgesByKey.get(key) ?? []).map((edge) => this.toRelation(edge, "outgoing"))
        };
    }

    private getEntityRelationsBatch(keys: string[]): Record<string, KnowledgeEntityRelations> {
        return Object.fromEntries([...new Set(keys)].map((key) => [key, this.getEntityRelations(key)]));
    }

    private toRelation(edge: TKnowledgeGraphEdge, direction: KnowledgeEntityRelation["direction"]): KnowledgeEntityRelation {
        const relatedKey = direction === "incoming" ? edge.sourceKey : edge.targetKey;
        return {
            kind: edge.kind,
            direction,
            entity: this.getEntityReference(relatedKey),
            metadata: edge.metadata
        };
    }

    private getEntityReference(key: string): KnowledgeEntityReference {
        const entity = this.entityByKey.get(key);
        if (entity !== undefined) {
            return {
                key: entity.key,
                id: entity.id,
                name: entity.name,
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

    private setIndex(index: TKnowledgeIndex): void {
        this.clearIndex();
        this.index = index;
        for (const entity of index.entities) this.entityByKey.set(entity.key, entity);
        for (const node of index.graph.nodes) this.nodeByKey.set(node.key, node);
        for (const edge of index.graph.edges) {
            append(this.outgoingEdgesByKey, edge.sourceKey, edge);
            append(this.incomingEdgesByKey, edge.targetKey, edge);
        }
    }

    private clearIndex(): void {
        this.index = null;
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
        const searchableEntities = index.entities.filter(isKnowledgeEntitySearchable);
        const counts = new Map<string, number>();
        for (const entity of searchableEntities) counts.set(entity.category, (counts.get(entity.category) ?? 0) + 1);
        return {
            status: "ready",
            entityCount: searchableEntities.length,
            sourceCount: index.sourceCount,
            modIds: index.modIds,
            categories: [...counts].map(([id, count]) => ({ id, count })).sort((left, right) => left.id.localeCompare(right.id)),
            loadedFromCache
        };
    }
}

function append<TKey, TValue>(map: Map<TKey, TValue[]>, key: TKey, value: TValue): void {
    const values = map.get(key);
    if (values === undefined) map.set(key, [value]);
    else values.push(value);
}

export const knowledgeService = new KnowledgeService();
