import { IKnowledgeRelationExtractor } from "../types/IKnowledgeRelationExtractor";
import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "../types/TKnowledgeRelationCandidate";
import { extractRequirementRelations } from "./extractRequirementRelations";

export class RequirementRelationExtractor implements IKnowledgeRelationExtractor {
    supports(canonicalType: string): boolean {
        return canonicalType === "requirement";
    }
    extract(definition: TResolvedKnowledgeDefinition, sourceKey: string): TKnowledgeRelationCandidate[] {
        return extractRequirementRelations(definition, sourceKey);
    }
}
