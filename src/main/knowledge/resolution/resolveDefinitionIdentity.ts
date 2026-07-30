import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { TResolvedKnowledgeIdentity } from "../types/TResolvedKnowledgeIdentity";
import { TJsonRecord } from "@shared/TJsonRecord";
import { TIdentifiedKnowledgeDefinition } from "../types/TIdentifiedKnowledgeDefinition";
import { TResolvedKnowledgeDefinition } from "../types/TResolvedKnowledgeDefinition";

export function resolveDefinitionIdentity(
    definition: TIdentifiedKnowledgeDefinition,
    resolvedRaw: TJsonRecord,
    parent: TResolvedKnowledgeDefinition | undefined,
    descriptor: TKnowledgeTypeDescriptor
): TResolvedKnowledgeIdentity {
    const resolvedByDescriptor = descriptor.resolveIdentity?.(definition, resolvedRaw, parent);
    if (resolvedByDescriptor !== undefined && resolvedByDescriptor !== null) return resolvedByDescriptor;

    if (definition.identity.kind !== "deferred") {
        const value = definition.identity.kind === "unknown" ? definition.identity.fallback : definition.identity.value;
        return { value, aliases: definition.identityAliases.length > 0 ? definition.identityAliases : [value] };
    }

    const fallback = definition.parentId === null ? `${definition.sourceFile}#${definition.sequence}` : `${definition.parentId}#${definition.sequence}`;
    return { value: fallback, aliases: [fallback] };
}
