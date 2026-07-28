export function getDefinitionDefault(canonicalType: string, fieldPath: string): unknown | undefined {
    if (canonicalType === "ITEM") {
        if (fieldPath === "price") return "0 cent";
        if (fieldPath === "dispersion") return 0;
        if (fieldPath === "healthy") return 0;
        if (fieldPath === "quench") return 0;
        if (fieldPath === "melee_damage") return {};
    }
    if (canonicalType === "MONSTER") {
        if (fieldPath === "attack_cost") return 100;
        if (fieldPath === "morale") return 0;
        if (fieldPath === "melee_dice_sides") return 0;
        if (fieldPath === "vision_day") return 40;
        if (fieldPath === "dodge") return 0;
    }
    return undefined;
}
