import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { readStringField } from "../utils/readStringField";

export function createDreamDescriptor(): TKnowledgeTypeDescriptor {
    return {
        canonicalType: "dream",
        cardinality: "multiple",
        identify(definition) {
            const category = readStringField(definition.raw, "category");
            const strength = definition.raw.strength;
            if (category !== null && typeof strength === "number") return { kind: "composite", value: `${category}:${strength}`, aliases: [`${category}:${strength}`], fields: ["category", "strength"] };
            return { kind: "unknown", fallback: `${definition.sourceFile}#${definition.sequence}` };
        }
    };
}
