import { KnowledgeQualityRequirement } from "@shared/knowledge/KnowledgeQualityRequirement";
import { KnowledgeRequirementGroup } from "@shared/knowledge/KnowledgeRequirementGroup";

export type KnowledgeResolvedRequirement = { requirementId: string; multiplier: number; components: KnowledgeRequirementGroup[]; tools: KnowledgeRequirementGroup[]; qualities: KnowledgeQualityRequirement[] };
