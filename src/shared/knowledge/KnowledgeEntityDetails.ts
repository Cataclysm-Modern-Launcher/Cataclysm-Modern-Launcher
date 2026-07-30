import { KnowledgeEntitySummary } from "./KnowledgeEntitySummary";
import { KnowledgeRecipeRequirements } from "./KnowledgeRecipeRequirements";
import { KnowledgeItemDestruction } from "./KnowledgeItemDestruction";

export type KnowledgeEntityDetails = KnowledgeEntitySummary & {
    sourceFile: string;
    raw: Record<string, unknown>;
    recipeRequirements?: KnowledgeRecipeRequirements;
    itemDestruction?: KnowledgeItemDestruction;
};
