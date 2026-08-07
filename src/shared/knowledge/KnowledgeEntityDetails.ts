import { KnowledgeEntitySummary } from "./KnowledgeEntitySummary";
import { KnowledgeRecipeRequirements } from "./KnowledgeRecipeRequirements";
import { KnowledgeItemDestruction } from "./KnowledgeItemDestruction";
import { KnowledgeMonsterHarvest } from "./KnowledgeMonsterHarvest";

export type KnowledgeEntityDetails = KnowledgeEntitySummary & {
    sourceFile: string;
    raw: Record<string, unknown>;
    recipeRequirements?: KnowledgeRecipeRequirements;
    itemDestruction?: KnowledgeItemDestruction;
    monsterHarvest?: KnowledgeMonsterHarvest;
};
