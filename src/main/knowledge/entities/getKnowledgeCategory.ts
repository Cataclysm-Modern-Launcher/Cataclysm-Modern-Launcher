const CATEGORY_BY_TYPE = new Map<string, string>([
    ["ITEM", "items"],
    ["recipe", "crafting"],
    ["uncraft", "crafting"],
    ["requirement", "crafting"],
    ["item_group", "items"],
    ["MONSTER", "creatures"],
    ["monstergroup", "creatures"],
    ["SPECIES", "creatures"],
    ["monster_attack", "creatures"],
    ["harvest", "creatures"],
    ["terrain", "world"],
    ["furniture", "world"],
    ["mapgen", "world"],
    ["overmap_terrain", "world"],
    ["overmap_special", "world"],
    ["city_building", "world"],
    ["map_extra", "world"],
    ["trap", "world"],
    ["field_type", "world"],
    ["vehicle", "vehicles"],
    ["vehicle_part", "vehicles"],
    ["vehicle_group", "vehicles"],
    ["vehicle_spawn", "vehicles"],
    ["mutation", "character"],
    ["mutation_category", "character"],
    ["profession", "character"],
    ["scenario", "character"],
    ["skill", "character"],
    ["proficiency", "character"],
    ["martial_art", "character"],
    ["technique", "character"],
    ["bionic", "character"],
    ["effect_on_condition", "logic"],
    ["talk_topic", "logic"],
    ["mission_definition", "logic"],
    ["npc", "logic"],
    ["npc_class", "logic"],
    ["SPELL", "magic"],
    ["enchantment", "magic"]
]);

const LEGACY_ITEM_TYPES = new Set(["AMMO", "ARMOR", "BATTERY", "BIONIC_ITEM", "BOOK", "COMESTIBLE", "ENGINE", "GENERIC", "GUN", "GUNMOD", "MAGAZINE", "PET_ARMOR", "TOOL", "TOOLMOD", "WHEEL"]);

export function getKnowledgeCategory(jsonType: string): string {
    if (LEGACY_ITEM_TYPES.has(jsonType)) return "items";
    return CATEGORY_BY_TYPE.get(jsonType) ?? "other";
}
