import { TKnowledgeScanSummary } from "./TKnowledgeScanSummary";
import { TScannedKnowledgeDefinition } from "./TScannedKnowledgeDefinition";

export type TKnowledgeScanResult = {
    definitions: TScannedKnowledgeDefinition[];
    summary: TKnowledgeScanSummary;
};
