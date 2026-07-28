import { TResolvedKnowledgeDefinition } from "../types/TResolvedKnowledgeDefinition";
import { TKnowledgeGraph } from "./types/TKnowledgeGraph";
import { logKnowledgeGraphDiagnostics } from "./logKnowledgeGraphDiagnostics";
import { extractRelations } from "./extractors/extractRelations";
import { buildItemMigrationMap, resolveItemMigration } from "./resolveItemMigration";

export function buildKnowledgeGraph(definitions: TResolvedKnowledgeDefinition[]): TKnowledgeGraph {
    const started = performance.now();
    const nodes: TKnowledgeGraph["nodes"] = definitions.map((definition) => ({
        key: key(definition.canonicalType, definition.effectiveId),
        type: definition.canonicalType,
        id: definition.effectiveId,
        sourceModId: definition.sourceModId,
        sourceFile: definition.sourceFile
    }));
    const aliases = new Map<string, string>();
    definitions.forEach((definition) => [definition.effectiveId, ...definition.effectiveAliases].forEach((id) => aliases.set(key(definition.canonicalType, id), key(definition.canonicalType, definition.effectiveId))));
    const itemMigrations = buildItemMigrationMap(definitions);
    const extractionStarted = performance.now();
    const candidates = definitions.flatMap((definition) => extractRelations(definition, key(definition.canonicalType, definition.effectiveId)));
    for (const candidate of candidates) {
        const target = candidate.virtualTarget;
        if (target === undefined) continue;
        const targetKey = key(target.type, target.id);
        if (!aliases.has(targetKey)) {
            aliases.set(targetKey, targetKey);
            nodes.push({ key: targetKey, type: target.type, id: target.id, sourceModId: target.sourceModId, sourceFile: target.sourceFile, virtual: true, metadata: target.metadata });
        }
    }
    const extractionMs = performance.now() - extractionStarted;
    const resolutionStarted = performance.now();
    const edges: TKnowledgeGraph["edges"] = [];
    const unresolved: TKnowledgeGraph["unresolved"] = [];
    for (const candidate of candidates) {
        let resolvedTargetType: string | undefined;
        let targetKey: string | undefined;
        for (const type of candidate.expectedTargetTypes) {
            const resolved = aliases.get(key(type, candidate.targetId));
            if (resolved === undefined) continue;
            resolvedTargetType = type;
            targetKey = resolved;
            break;
        }
        let metadata = candidate.metadata;
        if (targetKey === undefined && candidate.expectedTargetTypes.includes("ITEM")) {
            const migration = resolveItemMigration(itemMigrations, candidate.targetId, (id) => aliases.has(key("ITEM", id)));
            if (migration !== null) {
                resolvedTargetType = "ITEM";
                targetKey = aliases.get(key("ITEM", migration.targetId));
                metadata = {
                    ...metadata,
                    originalTargetId: candidate.targetId,
                    resolvedViaMigration: true,
                    migrationChain: migration.chain,
                    ...(migration.variant === undefined ? {} : { variant: migration.variant })
                };
            }
        }
        if (targetKey === undefined) unresolved.push(candidate);
        else {
            const kind = resolvedTargetType === undefined ? candidate.kind : (candidate.resolvedKindsByTargetType?.[resolvedTargetType] ?? candidate.kind);
            edges.push({ sourceKey: candidate.sourceKey, targetKey, kind, metadata });
        }
    }
    const resolutionMs = performance.now() - resolutionStarted;
    const graph = { nodes, edges, unresolved };
    logKnowledgeGraphDiagnostics(graph, { extractionMs, resolutionMs, totalMs: performance.now() - started });
    return graph;
}

function key(type: string, id: string): string {
    return `${type}:${id}`;
}
