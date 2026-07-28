export type KnowledgeEntitySummary = {
    key: string;
    id: string;
    name: string;
    description: string | null;
    jsonType: string;
    category: string;
    sourceModId: string;
    abstract: boolean;
    identityKind: "explicit" | "composite" | "deferred" | "anonymous" | "unknown";
    rawDefinitionCount: number;
};
