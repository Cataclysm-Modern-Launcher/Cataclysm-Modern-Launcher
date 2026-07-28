import { TLocalizeFn } from "@renderer/stores/useLocaleStore";

export function getKnowledgeCategoryLabel(category: string, t: TLocalizeFn): string {
    switch (category) {
        case "items":
            return t("knowledge.category.items");
        case "crafting":
            return t("knowledge.category.crafting");
        case "creatures":
            return t("knowledge.category.creatures");
        case "world":
            return t("knowledge.category.world");
        case "vehicles":
            return t("knowledge.category.vehicles");
        case "character":
            return t("knowledge.category.character");
        case "logic":
            return t("knowledge.category.logic");
        case "magic":
            return t("knowledge.category.magic");
        default:
            return t("knowledge.category.other");
    }
}
