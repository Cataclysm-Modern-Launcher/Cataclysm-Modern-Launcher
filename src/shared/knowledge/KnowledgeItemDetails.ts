import { KnowledgeItemSummary } from "@shared/knowledge/KnowledgeItemSummary";
import { KnowledgeRecipe } from "@shared/knowledge/KnowledgeRecipe";

export type KnowledgeItemDetails = KnowledgeItemSummary & {
    recipes: KnowledgeRecipe[];
    usedIn: Array<{ resultId: string; resultName: string; recipeKey: string }>;
};
