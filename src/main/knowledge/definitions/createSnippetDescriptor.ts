import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { readStringField } from "../utils/readStringField";

export function createSnippetDescriptor(): TKnowledgeTypeDescriptor {
    return {
        canonicalType: "snippet",
        cardinality: "multiple",
        identify(definition) {
            const category = readStringField(definition.raw, "category");
            if (category !== null) return { kind: "explicit", value: category, aliases: [category], field: "category" };
            return { kind: "unknown", fallback: `${definition.sourceFile}#${definition.sequence}` };
        }
    };
}
