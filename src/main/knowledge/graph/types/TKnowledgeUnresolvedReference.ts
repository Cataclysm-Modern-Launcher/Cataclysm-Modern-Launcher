import { TKnowledgeRelationKind } from "./TKnowledgeRelationKind";

export type TKnowledgeUnresolvedReference = {
    sourceKey: string;
    sourceType: string;
    sourceModId: string;
    sourceFile: string;
    kind: TKnowledgeRelationKind;
    targetId: string;
    expectedTargetTypes: string[];
    jsonPath: string;
    metadata: Record<string, unknown>;
};
