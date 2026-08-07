import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";

const SEARCHABLE_TYPES = new Set(["ITEM", "MONSTER"]);

export function isKnowledgeEntitySearchable(entity: KnowledgeEntityDetails): boolean {
    return SEARCHABLE_TYPES.has(entity.jsonType);
}
