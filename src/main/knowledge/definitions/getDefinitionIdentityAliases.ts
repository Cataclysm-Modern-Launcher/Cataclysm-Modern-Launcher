import { TKnowledgeDefinitionIdentity } from "../types/TKnowledgeDefinitionIdentity";

export function getIdentityAliases(identity: TKnowledgeDefinitionIdentity): string[] {
    if (identity.kind === "deferred") return [];
    if (identity.kind === "unknown") return [identity.fallback];
    return identity.aliases;
}
