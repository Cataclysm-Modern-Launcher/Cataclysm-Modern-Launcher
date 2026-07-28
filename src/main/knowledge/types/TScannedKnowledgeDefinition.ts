import { TJsonRecord } from "./TJsonRecord";

export type TScannedKnowledgeDefinition = {
    jsonType: string;
    sourceModId: string;
    sourceFile: string;
    sequence: number;
    raw: TJsonRecord;
};
