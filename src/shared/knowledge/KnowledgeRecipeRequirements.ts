import { KnowledgeRecipeRequirementGroup } from "./KnowledgeRecipeRequirementGroup";

export type KnowledgeRecipeRequirements = {
    tools: KnowledgeRecipeRequirementGroup[];
    qualities: KnowledgeRecipeRequirementGroup[];
    components: KnowledgeRecipeRequirementGroup[];
    recoveredComponents: KnowledgeRecipeRequirementGroup[];
};
