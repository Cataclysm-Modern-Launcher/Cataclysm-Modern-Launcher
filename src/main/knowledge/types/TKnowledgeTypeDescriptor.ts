import { TKnowledgeDefinitionIdentity } from "./TKnowledgeDefinitionIdentity";
import { TResolvedKnowledgeIdentity } from "./TResolvedKnowledgeIdentity";
import { TKnowledgeDefinitionCardinality } from "./TKnowledgeDefinitionCardinality";
import { TJsonRecord } from "./TJsonRecord";
import { TScannedKnowledgeDefinition } from "./TScannedKnowledgeDefinition";
import { TResolvedKnowledgeDefinition } from "./TResolvedKnowledgeDefinition";

export type TKnowledgeTypeDescriptor = {
    canonicalType: string;
    cardinality: TKnowledgeDefinitionCardinality;
    identify(definition: TScannedKnowledgeDefinition): TKnowledgeDefinitionIdentity;
    getParentId?(value: TJsonRecord): string | null;
    resolveIdentity?(definition: TScannedKnowledgeDefinition, resolvedRaw: TJsonRecord, parent: TResolvedKnowledgeDefinition | undefined): TResolvedKnowledgeIdentity | null;
};
