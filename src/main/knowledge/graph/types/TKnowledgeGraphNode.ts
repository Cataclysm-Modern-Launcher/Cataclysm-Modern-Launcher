export type TKnowledgeGraphNode = {
    key: string;
    type: string;
    id: string;
    sourceModId: string;
    sourceFile: string;
    virtual?: boolean;
    metadata?: Record<string, unknown>;
};
