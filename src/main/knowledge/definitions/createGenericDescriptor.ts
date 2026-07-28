import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { readStringListField } from "../utils/readStringListField";

export function createGenericDescriptor(canonicalType: string): TKnowledgeTypeDescriptor {
    return {
        canonicalType,
        cardinality: "single",
        identify(definition) {
            for (const field of ["id", "abstract", "ident"] as const) {
                const values = readStringListField(definition.raw, field);
                if (values.length === 1) return { kind: "explicit", value: values[0], aliases: values, field };
                if (values.length > 1) return { kind: "composite", value: values[0], aliases: values, fields: [field] };
            }
            for (const field of ["id", "abstract", "ident"] as const) {
                if (Object.hasOwn(definition.raw, field) && definition.raw[field] === "") {
                    const fallback = `${definition.sourceFile}#${definition.sequence}`;
                    return { kind: "anonymous", value: fallback, aliases: [fallback], strategy: `empty ${field} sentinel` };
                }
            }
            return { kind: "unknown", fallback: `${definition.sourceFile}#${definition.sequence}` };
        },
        getParentId(value) {
            return readStringListField(value, "copy-from")[0] ?? null;
        }
    };
}
