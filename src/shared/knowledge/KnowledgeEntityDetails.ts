import { KnowledgeEntitySummary } from "./KnowledgeEntitySummary";
import { KnowledgeRecipeRequirements } from "./KnowledgeRecipeRequirements";

export type KnowledgeEntityDetails = KnowledgeEntitySummary & {
    sourceFile: string;
    raw: Record<string, unknown>;
    recipeRequirements?: KnowledgeRecipeRequirements;
};
