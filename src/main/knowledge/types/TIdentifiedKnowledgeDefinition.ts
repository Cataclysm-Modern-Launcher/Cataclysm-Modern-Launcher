import { TScannedKnowledgeDefinition } from "./TScannedKnowledgeDefinition";
import { TKnowledgeDefinitionIdentity } from "./TKnowledgeDefinitionIdentity";

export type TIdentifiedKnowledgeDefinition = TScannedKnowledgeDefinition & {
    canonicalType: string;
    identity: TKnowledgeDefinitionIdentity;
    cardinality: "single" | "multiple";
    parentId: string | null;
    identityAliases: string[];
};
