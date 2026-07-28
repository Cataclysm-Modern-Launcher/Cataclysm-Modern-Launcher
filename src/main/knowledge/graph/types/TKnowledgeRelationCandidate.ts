import { TKnowledgeRelationKind } from "./TKnowledgeRelationKind";
import { TKnowledgeVirtualTarget } from "./TKnowledgeVirtualTarget";

export type TKnowledgeRelationCandidate = {
    sourceKey: string;
    sourceType: string;
    sourceModId: string;
    sourceFile: string;
    kind: TKnowledgeRelationKind;
    targetId: string;
    expectedTargetTypes: string[];
    jsonPath: string;
    metadata: Record<string, unknown>;
    resolvedKindsByTargetType?: Partial<Record<string, TKnowledgeRelationKind>>;
    virtualTarget?: TKnowledgeVirtualTarget;
};
