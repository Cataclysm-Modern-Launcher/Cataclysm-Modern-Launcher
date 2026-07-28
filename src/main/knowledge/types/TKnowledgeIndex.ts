import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { TKnowledgeGraph } from "../graph/types/TKnowledgeGraph";

export type TKnowledgeIndex = {
    entities: KnowledgeEntityDetails[];
    modIds: string[];
    sourceCount: number;
    rawDefinitionCount: number;
    graph: TKnowledgeGraph;
};
