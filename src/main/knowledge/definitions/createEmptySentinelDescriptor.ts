import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { readStringField } from "../utils/readStringField";

export function createEmptySentinelDescriptor(canonicalType: string, field: string): TKnowledgeTypeDescriptor {
    return {
        canonicalType,
        cardinality: "multiple",
        identify(definition) {
            const value = readStringField(definition.raw, field);
            if (value !== null) return { kind: "explicit", value, aliases: [value], field };
            const fallback = `${definition.sourceFile}#${definition.sequence}`;
            return { kind: "anonymous", value: fallback, aliases: [fallback], strategy: `empty ${field} sentinel` };
        }
    };
}
