import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "../types/TKnowledgeRelationCandidate";
import { isRecord } from "@shared/utils/isRecord";

export function extractRequirementRelations(definition: TResolvedKnowledgeDefinition, sourceKey: string): TKnowledgeRelationCandidate[] {
    const result: TKnowledgeRelationCandidate[] = [];
    extractTupleGroups(definition, sourceKey, "components", "uses-component", result);
    extractTupleGroups(definition, sourceKey, "tools", "uses-tool", result);
    const qualities = definition.raw.qualities;
    if (Array.isArray(qualities)) {
        qualities.forEach((group, groupIndex) => {
            const alternatives = Array.isArray(group) ? group : [group];
            alternatives.forEach((value, alternativeIndex) => {
                if (!isRecord(value) || typeof value.id !== "string") return;
                result.push(
                    candidate(definition, sourceKey, "requires-quality", value.id, ["tool_quality"], `qualities[${groupIndex}][${alternativeIndex}]`, {
                        level: typeof value.level === "number" ? value.level : 1,
                        count: typeof value.amount === "number" ? value.amount : 1,
                        groupIndex,
                        alternativeIndex,
                        groupKey: `qualities:${groupIndex}`
                    })
                );
            });
        });
    }
    return result;
}

function extractTupleGroups(definition: TResolvedKnowledgeDefinition, sourceKey: string, field: "components" | "tools", kind: "uses-component" | "uses-tool", result: TKnowledgeRelationCandidate[]): void {
    const groups = definition.raw[field];
    if (!Array.isArray(groups)) return;
    groups.forEach((group, groupIndex) => {
        if (!Array.isArray(group)) return;
        group.forEach((entry, alternativeIndex) => {
            if (!Array.isArray(entry) || typeof entry[0] !== "string") return;
            const count = typeof entry[1] === "number" ? entry[1] : field === "tools" ? -1 : 1;
            const requirementReference = entry.slice(2).includes("LIST");
            result.push(
                candidate(definition, sourceKey, requirementReference ? "uses-requirement" : kind, entry[0], [requirementReference ? "requirement" : "ITEM"], `${field}[${groupIndex}][${alternativeIndex}]`, {
                    groupIndex,
                    alternativeIndex,
                    groupKey: `${field}:${groupIndex}`,
                    count: Math.abs(count),
                    consumed: field === "components" || count > 0,
                    countMode: field === "tools" && count > 0 ? "charges" : "items"
                })
            );
        });
    });
}

function candidate(
    definition: TResolvedKnowledgeDefinition,
    sourceKey: string,
    kind: TKnowledgeRelationCandidate["kind"],
    targetId: string,
    expectedTargetTypes: string[],
    jsonPath: string,
    metadata: Record<string, unknown>
): TKnowledgeRelationCandidate {
    return { sourceKey, sourceType: definition.canonicalType, sourceModId: definition.sourceModId, sourceFile: definition.sourceFile, kind, targetId, expectedTargetTypes, jsonPath, metadata };
}
