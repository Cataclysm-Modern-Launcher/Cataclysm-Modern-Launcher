import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";

export type KnowledgePage = {
    entity: KnowledgeEntityDetails;
    relations: KnowledgeEntityRelations;
    relatedRelations: Record<string, KnowledgeEntityRelations>;
};
