import { createKnowledgeGraphKey } from "../createKnowledgeGraphKey";
import { clampProbability } from "../../utils/clampProbability";
import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "../types/TKnowledgeRelationCandidate";
import { isRecord } from "@shared/utils/isRecord";

type GroupEntry = { item?: string; group?: string; weight: number; metadata: Record<string, unknown> };

export function extractMonsterDropRelations(definitions: TResolvedKnowledgeDefinition[]): TKnowledgeRelationCandidate[] {
    const groups = new Map(definitions.filter((definition) => definition.canonicalType === "item_group").map((definition) => [definition.effectiveId, definition]));
    const result: TKnowledgeRelationCandidate[] = [];

    for (const monster of definitions.filter((definition) => definition.canonicalType === "MONSTER")) {
        const deathDrops = monster.raw.death_drops;
        if (typeof deathDrops !== "string") continue;
        flattenGroup(deathDrops, groups, 1, new Set(), []).forEach((drop, index) => {
            result.push({
                sourceKey: createKnowledgeGraphKey("MONSTER", monster.effectiveId),
                sourceType: "MONSTER",
                sourceModId: monster.sourceModId,
                sourceFile: monster.sourceFile,
                kind: "drops-item",
                targetId: drop.itemId,
                expectedTargetTypes: ["ITEM"],
                jsonPath: `death_drops[${index}]`,
                metadata: { chance: drop.chance, ...drop.metadata }
            });
        });
    }
    return result;
}

function flattenGroup(
    id: string,
    groups: Map<string, TResolvedKnowledgeDefinition>,
    parentChance: number,
    visiting: Set<string>,
    path: string[]
): Array<{ itemId: string; chance: number; metadata: Record<string, unknown> }> {
    if (visiting.has(id)) return [];
    const group = groups.get(id);
    if (group === undefined) return [];
    const nextVisiting = new Set(visiting).add(id);
    const subtype = group.raw.subtype === "collection" ? "collection" : "distribution";
    const entries = readEntries(group.raw);
    if (entries.length === 0) return [];
    const totalWeight = subtype === "distribution" ? entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0) : 100;

    return entries.flatMap((entry) => {
        const localChance = subtype === "collection" ? clampProbability(entry.weight / 100) : totalWeight <= 0 ? 0 : Math.max(0, entry.weight) / totalWeight;
        const chance = parentChance * localChance;
        const metadata = { ...entry.metadata, groupPath: [...path, id], groupSubtype: subtype };
        if (entry.item !== undefined) return [{ itemId: entry.item, chance, metadata }];
        if (entry.group !== undefined) return flattenGroup(entry.group, groups, chance, nextVisiting, [...path, id]);
        return [];
    });
}

function readEntries(raw: Record<string, unknown>): GroupEntry[] {
    const result: GroupEntry[] = [];
    const defaultWeight = raw.subtype === "collection" ? 100 : 100;

    const entries = raw.entries;
    if (Array.isArray(entries)) {
        entries.forEach((value) => {
            if (!isRecord(value)) return;
            const item = typeof value.item === "string" ? value.item : undefined;
            const group = typeof value.group === "string" ? value.group : undefined;
            if (item === undefined && group === undefined) return;
            result.push({ item, group, weight: readWeight(value.prob, defaultWeight), metadata: readDropMetadata(value) });
        });
    }
    readLegacyEntries(raw.items, "item", result, defaultWeight);
    readLegacyEntries(raw.groups, "group", result, defaultWeight);
    return result;
}

function readLegacyEntries(value: unknown, kind: "item" | "group", target: GroupEntry[], defaultWeight: number): void {
    if (!Array.isArray(value)) return;
    value.forEach((entry) => {
        if (typeof entry === "string") {
            target.push(kind === "item" ? { item: entry, weight: defaultWeight, metadata: {} } : { group: entry, weight: defaultWeight, metadata: {} });
            return;
        }
        if (Array.isArray(entry) && typeof entry[0] === "string") {
            const weight = readWeight(entry[1], defaultWeight);
            target.push(kind === "item" ? { item: entry[0], weight, metadata: {} } : { group: entry[0], weight, metadata: {} });
        }
    });
}

function readWeight(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readDropMetadata(value: Record<string, unknown>): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};
    for (const key of ["count", "charges", "damage", "ammo-item", "container-item", "contents-group"] as const) {
        if (value[key] !== undefined) metadata[key] = value[key];
    }
    return metadata;
}
