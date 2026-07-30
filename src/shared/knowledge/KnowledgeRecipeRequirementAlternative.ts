import { KnowledgeEntityReference } from "./KnowledgeEntityReference";
import { KnowledgeRelationKind } from "./KnowledgeRelationKind";

export type KnowledgeRecipeRequirementAlternative = {
    kind: KnowledgeRelationKind;
    entity: KnowledgeEntityReference;
    metadata: Record<string, unknown>;
};
