import { KnowledgeCategorySummary } from "./KnowledgeCategorySummary";
import { KnowledgeLanguageInfo } from "./KnowledgeLanguageInfo";

export type KnowledgeIndexStatus =
    | { status: "idle" }
    | { status: "building"; processedFiles: number; totalFiles: number }
    | { status: "ready"; entityCount: number; sourceCount: number; modIds: string[]; categories: KnowledgeCategorySummary[]; loadedFromCache: boolean; language: KnowledgeLanguageInfo }
    | { status: "error"; message: string };
