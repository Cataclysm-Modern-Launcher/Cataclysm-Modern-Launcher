import { TJsonRecord } from "@shared/TJsonRecord";

export type TScannedKnowledgeDefinition = {
    jsonType: string;
    sourceModId: string;
    sourceFile: string;
    sequence: number;
    raw: TJsonRecord;
};
