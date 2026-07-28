import { TKnowledgeIndex } from "./TKnowledgeIndex";

export type TKnowledgeIndexSnapshot = {
    schemaVersion: number;
    index: TKnowledgeIndex;
};
