import { KnowledgeRecipeRequirementGroup } from "./KnowledgeRecipeRequirementGroup";

export type KnowledgeRecipeRequirements = {
    toolsAndQualities: KnowledgeRecipeRequirementGroup[];
    components: KnowledgeRecipeRequirementGroup[];
    recoveredComponents: KnowledgeRecipeRequirementGroup[];
};
