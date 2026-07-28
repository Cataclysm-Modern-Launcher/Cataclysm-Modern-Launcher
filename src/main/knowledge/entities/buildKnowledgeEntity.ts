import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { getKnowledgeCategory } from "./getKnowledgeCategory";
import { TResolvedKnowledgeDefinition } from "../types/TResolvedKnowledgeDefinition";
import { isRecord } from "../../utils/isRecord";

export function buildKnowledgeEntity(definition: TResolvedKnowledgeDefinition): KnowledgeEntityDetails {
    const id = definition.effectiveId;
    const name = readDefinitionTranslation(definition.raw.name) ?? readDefinitionTranslation(definition.raw.description) ?? id;
    const uniqueSuffix = definition.cardinality === "multiple" ? `:${definition.sourceModId}:${definition.sequence}` : "";
    return {
        key: `${definition.canonicalType}:${id}${uniqueSuffix}`,
        id,
        name,
        description: readDefinitionTranslation(definition.raw.description),
        jsonType: definition.jsonType,
        category: getKnowledgeCategory(definition.canonicalType),
        sourceModId: definition.sourceModId,
        sourceFile: definition.sourceFile,
        abstract: typeof definition.raw.abstract === "string",
        identityKind: definition.identity.kind,
        rawDefinitionCount: definition.rawDefinitionCount,
        raw: definition.raw
    };
}

function readDefinitionTranslation(value: unknown): string | null {
    if (typeof value === "string") return value;
    if (!isRecord(value)) return null;
    if (typeof value.str === "string") return value.str;
    if (typeof value.str_sp === "string") return value.str_sp;
    return null;
}
