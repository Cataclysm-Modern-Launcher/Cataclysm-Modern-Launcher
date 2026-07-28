import { TKnowledgeGraphNode } from "./TKnowledgeGraphNode";
import { TKnowledgeGraphEdge } from "./TKnowledgeGraphEdge";
import { TKnowledgeUnresolvedReference } from "./TKnowledgeUnresolvedReference";

export type TKnowledgeGraph = {
    nodes: TKnowledgeGraphNode[];
    edges: TKnowledgeGraphEdge[];
    unresolved: TKnowledgeUnresolvedReference[];
};
