import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { readStringListField } from "../utils/readStringListField";

export function createFieldDescriptor(canonicalType: string, field: string): TKnowledgeTypeDescriptor {
    return {
        canonicalType,
        cardinality: "single",
        identify(definition) {
            const values = readStringListField(definition.raw, field);
            if (values.length === 1) return { kind: "explicit", value: values[0], aliases: values, field };
            if (values.length > 1) return { kind: "composite", value: values[0], aliases: values, fields: [field] };
            return { kind: "unknown", fallback: `${definition.sourceFile}#${definition.sequence}` };
        }
    };
}
