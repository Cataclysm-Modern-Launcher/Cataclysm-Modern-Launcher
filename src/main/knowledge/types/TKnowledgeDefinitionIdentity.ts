export type TKnowledgeDefinitionIdentity =
    | { kind: "explicit"; value: string; aliases: string[]; field: string }
    | { kind: "composite"; value: string; aliases: string[]; fields: string[] }
    | { kind: "deferred"; reason: "requires-inheritance" }
    | { kind: "anonymous"; value: string; aliases: string[]; strategy: string }
    | { kind: "unknown"; fallback: string };
