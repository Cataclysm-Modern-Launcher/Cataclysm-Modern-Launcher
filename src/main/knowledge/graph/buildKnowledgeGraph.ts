import { TResolvedKnowledgeDefinition } from "../types/TResolvedKnowledgeDefinition";
import { TKnowledgeGraph } from "./types/TKnowledgeGraph";
import { logKnowledgeGraphDiagnostics } from "./logKnowledgeGraphDiagnostics";
import { extractRelations } from "./extractors/extractRelations";
import { extractItemDestructionRelations } from "./extractors/extractItemDestructionRelations";
import { extractReversibleRecipeRelations } from "./extractors/extractReversibleRecipeRelations";
import { buildItemMigrationMap } from "./buildItemMigrationMap";
import { resolveItemMigration } from "./resolveItemMigration";
import { createKnowledgeGraphKey } from "./createKnowledgeGraphKey";
import { extractMonsterDropRelations } from "./extractors/extractMonsterDropRelations";

export function buildKnowledgeGraph(definitions: TResolvedKnowledgeDefinition[]): TKnowledgeGraph {
    const started = performance.now();
    const nodes: TKnowledgeGraph["nodes"] = definitions.map((definition) => ({
        key: createKnowledgeGraphKey(definition.canonicalType, definition.effectiveId),
        type: definition.canonicalType,
        id: definition.effectiveId,
        sourceModId: definition.sourceModId,
        sourceFile: definition.sourceFile
    }));
    const definitionsByKey = new Map(definitions.map((definition) => [createKnowledgeGraphKey(definition.canonicalType, definition.effectiveId), definition]));
    const aliases = new Map<string, string>();
    definitions.forEach((definition) =>
        [definition.effectiveId, ...definition.effectiveAliases].forEach((id) =>
            aliases.set(createKnowledgeGraphKey(definition.canonicalType, id), createKnowledgeGraphKey(definition.canonicalType, definition.effectiveId))
        )
    );
    const itemMigrations = buildItemMigrationMap(definitions);
    const extractionStarted = performance.now();
    const candidates = [
        ...definitions.flatMap((definition) => extractRelations(definition, createKnowledgeGraphKey(definition.canonicalType, definition.effectiveId))),
        ...extractItemDestructionRelations(definitions),
        ...extractReversibleRecipeRelations(definitions),
        ...extractMonsterDropRelations(definitions)
    ];
    for (const candidate of candidates) {
        const target = candidate.virtualTarget;
        if (target === undefined) continue;
        const targetKey = createKnowledgeGraphKey(target.type, target.id);
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
            const resolved = aliases.get(createKnowledgeGraphKey(type, candidate.targetId));
            if (resolved === undefined) continue;
            resolvedTargetType = type;
            targetKey = resolved;
            break;
        }
        let metadata = candidate.metadata;
        if (targetKey === undefined && candidate.expectedTargetTypes.includes("ITEM") && allowsItemMigration(candidate.kind)) {
            const migration = resolveItemMigration(itemMigrations, candidate.targetId, (id) => aliases.has(createKnowledgeGraphKey("ITEM", id)));
            if (migration !== null) {
                resolvedTargetType = "ITEM";
                targetKey = aliases.get(createKnowledgeGraphKey("ITEM", migration.targetId));
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
            metadata = resolveMetadata(kind, metadata, definitionsByKey.get(targetKey));
            edges.push({ sourceKey: candidate.sourceKey, targetKey, kind, metadata });
        }
    }
    const resolutionMs = performance.now() - resolutionStarted;
    const graph = { nodes, edges, unresolved };
    logKnowledgeGraphDiagnostics(graph, { extractionMs, resolutionMs, totalMs: performance.now() - started });
    return graph;
}

function allowsItemMigration(kind: TKnowledgeGraph["edges"][number]["kind"]): boolean {
    return kind !== "uncrafts-item" && kind !== "recovers-component" && kind !== "salvages-into" && kind !== "breaks-into";
}

function resolveMetadata(kind: TKnowledgeGraph["edges"][number]["kind"], metadata: Record<string, unknown>, target: TResolvedKnowledgeDefinition | undefined): Record<string, unknown> {
    if (kind !== "requires-proficiency" || metadata.required === true) return metadata;

    const raw = target?.raw;
    const recipeTimeMultiplier = typeof metadata.timeMultiplier === "number" ? metadata.timeMultiplier : 0;
    const recipeSkillPenalty = typeof metadata.skillPenalty === "number" ? metadata.skillPenalty : undefined;

    return {
        ...metadata,
        timeMultiplier: recipeTimeMultiplier === 0 ? readNumber(raw?.default_time_multiplier, 2) : recipeTimeMultiplier,
        skillPenalty: recipeSkillPenalty ?? readNumber(raw?.default_skill_penalty, 1)
    };
}

function readNumber(value: unknown, fallback: number): number {
    return typeof value === "number" ? value : fallback;
}
