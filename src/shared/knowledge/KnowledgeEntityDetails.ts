import { KnowledgeEntitySummary } from "./KnowledgeEntitySummary";
import { KnowledgeRecipeRequirements } from "./KnowledgeRecipeRequirements";
import { KnowledgeItemDestruction } from "./KnowledgeItemDestruction";
import { KnowledgeMonsterHarvest } from "./KnowledgeMonsterHarvest";
import { KnowledgeLocationDetails, KnowledgeLocationSpawn } from "./KnowledgeLocation";

export type KnowledgeEntityDetails = KnowledgeEntitySummary & {
    sourceFile: string;
    raw: Record<string, unknown>;
    recipeRequirements?: KnowledgeRecipeRequirements;
    itemDestruction?: KnowledgeItemDestruction;
    monsterHarvest?: KnowledgeMonsterHarvest;
    location?: KnowledgeLocationDetails;
    locationAppearances?: KnowledgeLocationSpawn[];
};
