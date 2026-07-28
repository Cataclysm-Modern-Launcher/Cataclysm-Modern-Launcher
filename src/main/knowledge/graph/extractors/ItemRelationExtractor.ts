import { IKnowledgeRelationExtractor } from "../types/IKnowledgeRelationExtractor";
import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "../types/TKnowledgeRelationCandidate";

export class ItemRelationExtractor implements IKnowledgeRelationExtractor {
    supports(canonicalType: string): boolean {
        return canonicalType === "ITEM";
    }

    extract(definition: TResolvedKnowledgeDefinition, sourceKey: string): TKnowledgeRelationCandidate[] {
        if (!Array.isArray(definition.raw.qualities)) return [];
        return definition.raw.qualities.flatMap((entry, index) =>
            Array.isArray(entry) && typeof entry[0] === "string"
                ? [
                      {
                          sourceKey,
                          sourceType: definition.canonicalType,
                          sourceModId: definition.sourceModId,
                          sourceFile: definition.sourceFile,
                          kind: "provides-quality" as const,
                          targetId: entry[0],
                          expectedTargetTypes: ["tool_quality"],
                          jsonPath: `qualities[${index}]`,
                          metadata: { level: typeof entry[1] === "number" ? entry[1] : 1 }
                      }
                  ]
                : []
        );
    }
}
