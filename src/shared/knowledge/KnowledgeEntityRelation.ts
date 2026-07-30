import { KnowledgeEntityReference } from "./KnowledgeEntityReference";
import { KnowledgeRelationKind } from "./KnowledgeRelationKind";

export type KnowledgeEntityRelation = {
    kind: KnowledgeRelationKind;
    direction: "incoming" | "outgoing";
    entity: KnowledgeEntityReference;
    metadata: Record<string, unknown>;
};
