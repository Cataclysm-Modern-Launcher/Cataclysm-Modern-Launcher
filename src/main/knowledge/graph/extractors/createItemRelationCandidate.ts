import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "../types/TKnowledgeRelationCandidate";
import { TKnowledgeRelationKind } from "../types/TKnowledgeRelationKind";

export function createItemRelationCandidate(
    definition: TResolvedKnowledgeDefinition,
    sourceKey: string,
    kind: Extract<TKnowledgeRelationKind, "uncrafts-item" | "recovers-component" | "salvages-into" | "breaks-into">,
    targetId: string,
    jsonPath: string,
    metadata: Record<string, unknown>
): TKnowledgeRelationCandidate {
    return {
        sourceKey,
        sourceType: definition.canonicalType,
        sourceModId: definition.sourceModId,
        sourceFile: definition.sourceFile,
        kind,
        targetId,
        expectedTargetTypes: ["ITEM"],
        jsonPath,
        metadata
    };
}
