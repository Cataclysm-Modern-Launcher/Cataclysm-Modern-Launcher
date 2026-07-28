import { KnowledgeResolvedRequirement } from "@shared/knowledge/KnowledgeResolvedRequirement";
import { KnowledgeProficiencyRequirement } from "@shared/knowledge/KnowledgeProficiencyRequirement";
import { KnowledgeByproduct } from "@shared/knowledge/KnowledgeByproduct";
import { KnowledgeRequirementReference } from "@shared/knowledge/KnowledgeRequirementReference";
import { KnowledgeQualityRequirement } from "@shared/knowledge/KnowledgeQualityRequirement";
import { KnowledgeSkillRequirement } from "@shared/knowledge/KnowledgeSkillRequirement";
import { KnowledgeRequirementGroup } from "@shared/knowledge/KnowledgeRequirementGroup";

export type KnowledgeRecipe = {
    key: string;
    resultId: string;
    resultCount: number;
    sourceModId: string;
    difficulty: number | null;
    skillUsed: string | null;
    requiredSkills: KnowledgeSkillRequirement[];
    time: string | number | null;
    activityLevel: string | null;
    components: KnowledgeRequirementGroup[];
    tools: KnowledgeRequirementGroup[];
    qualities: KnowledgeQualityRequirement[];
    using: KnowledgeRequirementReference[];
    byproducts: KnowledgeByproduct[];
    proficiencies: KnowledgeProficiencyRequirement[];
    resolvedRequirements: KnowledgeResolvedRequirement[];
};
