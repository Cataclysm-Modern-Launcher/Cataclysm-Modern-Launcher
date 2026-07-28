import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "./TKnowledgeRelationCandidate";

export interface IKnowledgeRelationExtractor {
    supports(canonicalType: string): boolean;
    extract(definition: TResolvedKnowledgeDefinition, sourceKey: string): TKnowledgeRelationCandidate[];
}
