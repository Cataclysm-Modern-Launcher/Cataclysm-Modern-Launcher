import { KnowledgeDiagnostics } from "../KnowledgeDiagnostics";
import { getKnowledgeTypeDescriptor } from "./getKnowledgeTypeDescriptor";
import { getIdentityAliases } from "./getDefinitionIdentityAliases";
import { TScannedKnowledgeDefinition } from "../types/TScannedKnowledgeDefinition";
import { TIdentifiedKnowledgeDefinition } from "../types/TIdentifiedKnowledgeDefinition";

export function identifyDefinitions(definitions: TScannedKnowledgeDefinition[], diagnostics: KnowledgeDiagnostics): TIdentifiedKnowledgeDefinition[] {
    return definitions.map((definition) => {
        const descriptor = getKnowledgeTypeDescriptor(definition);
        const identity = descriptor.identify(definition);
        diagnostics.observeIdentity(definition, identity);
        return {
            ...definition,
            canonicalType: descriptor.canonicalType,
            identity,
            identityAliases: getIdentityAliases(identity),
            cardinality: descriptor.cardinality,
            parentId: descriptor.getParentId?.(definition.raw) ?? null
        };
    });
}
