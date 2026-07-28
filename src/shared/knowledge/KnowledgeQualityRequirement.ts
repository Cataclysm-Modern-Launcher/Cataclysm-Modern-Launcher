import { KnowledgeQualityProvider } from "@shared/knowledge/KnowledgeQualityProvider";

export type KnowledgeQualityRequirement = { qualityId: string; qualityName: string; level: number; providers: KnowledgeQualityProvider[] };
