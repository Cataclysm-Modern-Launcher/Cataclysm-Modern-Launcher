import { createAnonymousDescriptor } from "./createAnonymousDescriptor";
import { createDreamDescriptor } from "./createDreamDescriptor";
import { createEmptySentinelDescriptor } from "./createEmptySentinelDescriptor";
import { createGenericDescriptor } from "./createGenericDescriptor";
import { createFieldDescriptor } from "./createFieldDescriptor";
import { createHelpDescriptor } from "./createHelpDescriptor";
import { createMapgenDescriptor } from "./createMapgenDescriptor";
import { createRecipeDescriptor } from "./createRecipeDescriptor";
import { createSnippetDescriptor } from "./createSnippetDescriptor";
import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { TScannedKnowledgeDefinition } from "../types/TScannedKnowledgeDefinition";

// Older game versions and forks use top-level item JSON types instead of ITEM + subtypes.
const LEGACY_ITEM_TYPES = new Set(["AMMO", "ARMOR", "BATTERY", "BIONIC_ITEM", "BOOK", "COMESTIBLE", "ENGINE", "GENERIC", "GUN", "GUNMOD", "MAGAZINE", "PET_ARMOR", "TOOL", "TOOLMOD", "WHEEL"]);

const ANONYMOUS_TYPES = new Set([
    "MONSTER_BLACKLIST",
    "SCENARIO_BLACKLIST",
    "charge_removal_blacklist",
    "temperature_removal_blacklist",
    "overlay_order",
    "var_migration",
    "camp_migration",
    "vehicle_part_migration",
    "ter_furn_migration",
    "oter_id_migration",
    "trap_migration",
    "effect_migration",
    "proficiency_migration",
    "profession_item_substitutions",
    "rotatable_symbol",
    "speech",
    "hit_range"
]);

const genericDescriptors = new Map<string, TKnowledgeTypeDescriptor>();

const descriptors = new Map<string, TKnowledgeTypeDescriptor>([
    ["mapgen", createMapgenDescriptor()],
    ["recipe", createRecipeDescriptor("recipe")],
    ["uncraft", createRecipeDescriptor("uncraft")],
    ["snippet", createSnippetDescriptor()],
    ["dream", createDreamDescriptor()],
    ["help", createHelpDescriptor()],
    ["talk_topic", createFieldDescriptor("talk_topic", "id")],
    ["MONSTER_FACTION", createEmptySentinelDescriptor("MONSTER_FACTION", "name")],
    ["overmap_land_use_code", createEmptySentinelDescriptor("overmap_land_use_code", "id")]
]);

function getGenericDescriptor(canonicalType: string): TKnowledgeTypeDescriptor {
    const existing = genericDescriptors.get(canonicalType);
    if (existing !== undefined) return existing;
    const descriptor = createGenericDescriptor(canonicalType);
    genericDescriptors.set(canonicalType, descriptor);
    return descriptor;
}

export function getKnowledgeTypeDescriptor(definition: TScannedKnowledgeDefinition): TKnowledgeTypeDescriptor {
    const registered = descriptors.get(definition.jsonType);
    if (registered !== undefined) return registered;
    if (LEGACY_ITEM_TYPES.has(definition.jsonType)) return getGenericDescriptor("ITEM");
    if (ANONYMOUS_TYPES.has(definition.jsonType)) return createAnonymousDescriptor(definition.jsonType, "known data operation without stable id");
    return getGenericDescriptor(definition.jsonType);
}
