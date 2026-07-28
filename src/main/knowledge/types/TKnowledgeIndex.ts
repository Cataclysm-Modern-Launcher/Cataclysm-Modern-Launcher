import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";

export type TKnowledgeIndex = {
    entities: KnowledgeEntityDetails[];
    modIds: string[];
    sourceCount: number;
    rawDefinitionCount: number;
};
