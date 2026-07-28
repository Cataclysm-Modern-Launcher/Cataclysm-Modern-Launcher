import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "../types/TKnowledgeRelationCandidate";
import { extractItemRelations } from "./extractItemRelations";
import { extractRecipeRelations } from "./extractRecipeRelations";
import { extractRequirementRelations } from "./extractRequirementRelations";

type RelationExtractor = (definition: TResolvedKnowledgeDefinition, sourceKey: string) => TKnowledgeRelationCandidate[];

const extractorsByType = new Map<string, RelationExtractor>([
    ["ITEM", extractItemRelations],
    ["recipe", extractRecipeRelations],
    ["uncraft", extractRecipeRelations],
    ["requirement", extractRequirementRelations]
]);

export function extractRelations(definition: TResolvedKnowledgeDefinition, sourceKey: string): TKnowledgeRelationCandidate[] {
    return extractorsByType.get(definition.canonicalType)?.(definition, sourceKey) ?? [];
}
