import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { readStringField } from "../utils/readStringField";

export function createHelpDescriptor(): TKnowledgeTypeDescriptor {
    return {
        canonicalType: "help",
        cardinality: "multiple",
        identify(definition) {
            const name = readStringField(definition.raw, "name");
            const order = definition.raw.order;
            if (name !== null && (typeof order === "number" || typeof order === "string")) {
                const value = `${String(order)}:${name}`;
                return { kind: "composite", value, aliases: [value], fields: ["order", "name"] };
            }
            return { kind: "unknown", fallback: `${definition.sourceFile}#${definition.sequence}` };
        }
    };
}
