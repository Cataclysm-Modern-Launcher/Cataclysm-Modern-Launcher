import { createKnowledgeGraphKey } from "../createKnowledgeGraphKey";
import { createItemRelationCandidate } from "./createItemRelationCandidate";
import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "../types/TKnowledgeRelationCandidate";
import { isRecord } from "@shared/utils/isRecord";

export function extractItemDestructionRelations(definitions: TResolvedKnowledgeDefinition[]): TKnowledgeRelationCandidate[] {
    const materials = new Map(
        definitions
            .filter((definition) => definition.canonicalType === "material" && typeof definition.raw.salvaged_into === "string")
            .map((definition) => [definition.effectiveId, definition.raw.salvaged_into as string])
    );

    return definitions
        .filter((definition) => definition.canonicalType === "ITEM")
        .flatMap((definition) => {
            const sourceKey = createKnowledgeGraphKey(definition.canonicalType, definition.effectiveId);
            return [...extractSalvageRelations(definition, sourceKey, materials), ...extractBreakageRelations(definition, sourceKey)];
        });
}

function extractSalvageRelations(definition: TResolvedKnowledgeDefinition, sourceKey: string, materials: ReadonlyMap<string, string>): TKnowledgeRelationCandidate[] {
    const flags = Array.isArray(definition.raw.flags) ? definition.raw.flags : [];
    if (flags.includes("NO_SALVAGE")) return [];

    const portions = readMaterialPortions(definition.raw.material);
    const totalPortions = portions.reduce((sum, entry) => sum + entry.portions, 0);

    return portions.flatMap(({ id, portions }, index) => {
        const salvagedInto = materials.get(id);
        if (salvagedInto === undefined) return [];
        return [
            createItemRelationCandidate(definition, sourceKey, "salvages-into", salvagedInto, `material[${index}]`, {
                materialId: id,
                materialPortions: portions,
                totalMaterialPortions: totalPortions
            })
        ];
    });
}

function extractBreakageRelations(definition: TResolvedKnowledgeDefinition, sourceKey: string): TKnowledgeRelationCandidate[] {
    if (!Array.isArray(definition.raw.breaks_into)) return [];
    return definition.raw.breaks_into.flatMap((entry, index) => {
        if (!isRecord(entry) || typeof entry.item !== "string") return [];
        return [createItemRelationCandidate(definition, sourceKey, "breaks-into", entry.item, `breaks_into[${index}]`, readCountMetadata(entry.count))];
    });
}

function readMaterialPortions(value: unknown): { id: string; portions: number }[] {
    if (typeof value === "string") return [{ id: value, portions: 1 }];
    if (!Array.isArray(value)) return [];

    return value.flatMap((entry) => {
        if (typeof entry === "string") return [{ id: entry, portions: 1 }];
        if (!Array.isArray(entry) || typeof entry[0] !== "string") return [];
        return [{ id: entry[0], portions: typeof entry[1] === "number" && entry[1] > 0 ? entry[1] : 1 }];
    });
}

function readCountMetadata(value: unknown): Record<string, unknown> {
    if (typeof value === "number") return { count: value };
    if (Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number") {
        return { countMin: value[0], countMax: value[1] };
    }
    return {};
}
