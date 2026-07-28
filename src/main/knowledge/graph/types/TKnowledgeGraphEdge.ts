import { TKnowledgeRelationKind } from "./TKnowledgeRelationKind";

export type TKnowledgeGraphEdge = {
    sourceKey: string;
    targetKey: string;
    kind: TKnowledgeRelationKind;
    metadata: Record<string, unknown>;
};
