import { KnowledgeEntitySummary } from "./KnowledgeEntitySummary";

export type KnowledgeEntityDetails = KnowledgeEntitySummary & {
    sourceFile: string;
    raw: Record<string, unknown>;
};
