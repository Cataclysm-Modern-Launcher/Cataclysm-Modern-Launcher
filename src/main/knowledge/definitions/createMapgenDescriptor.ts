import { flattenStrings } from "@shared/utils/flattenStrings";
import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { readStringField } from "../utils/readStringField";

export function createMapgenDescriptor(): TKnowledgeTypeDescriptor {
    return {
        canonicalType: "mapgen",
        cardinality: "multiple",
        identify(definition) {
            for (const field of ["update_mapgen_id", "nested_mapgen_id"] as const) {
                const value = readStringField(definition.raw, field);
                if (value !== null) return { kind: "explicit", value, aliases: [value], field };
            }
            const terrainIds = flattenStrings(definition.raw.om_terrain);
            if (terrainIds.length > 0) return { kind: "composite", value: terrainIds[0], aliases: terrainIds, fields: ["om_terrain"] };
            return { kind: "unknown", fallback: `${definition.sourceFile}#${definition.sequence}` };
        },
        getParentId(value) {
            return readStringField(value, "copy-from");
        }
    };
}
