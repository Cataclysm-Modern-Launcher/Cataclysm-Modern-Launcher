import { TIdentifiedKnowledgeDefinition } from "./TIdentifiedKnowledgeDefinition";
import { TJsonRecord } from "@shared/TJsonRecord";

export type TResolvedKnowledgeDefinition = TIdentifiedKnowledgeDefinition & {
    effectiveId: string;
    effectiveAliases: string[];
    rawDefinitionCount: number;
    raw: TJsonRecord;
};
