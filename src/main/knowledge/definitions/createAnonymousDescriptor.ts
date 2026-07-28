import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";

export function createAnonymousDescriptor(canonicalType: string, strategy: string): TKnowledgeTypeDescriptor {
    return {
        canonicalType,
        cardinality: "multiple",
        identify(definition) {
            const value = `${definition.sourceFile}#${definition.sequence}`;
            return { kind: "anonymous", value, aliases: [value], strategy };
        }
    };
}
