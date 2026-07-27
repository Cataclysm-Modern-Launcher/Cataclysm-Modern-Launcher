export type KnowledgeWorld = {
    name: string;
    folderName: string;
    characterName: string | null;
};

export type KnowledgeIndexStatus =
    | { status: "idle" } //
    | { status: "building"; processedFiles: number; totalFiles: number }
    | { status: "ready"; itemCount: number; recipeCount: number; modIds: string[] }
    | { status: "error"; message: string };

export type KnowledgeItemSummary = {
    id: string;
    name: string;
    description: string | null;
    type: string;
    sourceModId: string;
};

export type KnowledgeRequirementAlternative = { itemId: string; itemName: string; count: number };
export type KnowledgeRequirementGroup = KnowledgeRequirementAlternative[];
export type KnowledgeSkillRequirement = { skillId: string; level: number };
export type KnowledgeQualityProvider = { itemId: string; itemName: string; level: number };
export type KnowledgeQualityRequirement = { qualityId: string; qualityName: string; level: number; providers: KnowledgeQualityProvider[] };
export type KnowledgeRequirementReference = { requirementId: string; multiplier: number };
export type KnowledgeByproduct = { itemId: string; itemName: string; count: number };
export type KnowledgeProficiencyRequirement = { proficiencyId: string; proficiencyName: string; required: boolean; timeMultiplier: number | null; skillPenalty: number | null };
export type KnowledgeResolvedRequirement = { requirementId: string; multiplier: number; components: KnowledgeRequirementGroup[]; tools: KnowledgeRequirementGroup[]; qualities: KnowledgeQualityRequirement[] };

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

export type KnowledgeItemDetails = KnowledgeItemSummary & {
    recipes: KnowledgeRecipe[];
    usedIn: Array<{ resultId: string; resultName: string; recipeKey: string }>;
};
