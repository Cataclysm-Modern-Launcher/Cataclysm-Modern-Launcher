import { KnowledgeCategorySummary } from "./KnowledgeCategorySummary";

export type KnowledgeIndexStatus =
    | { status: "idle" }
    | { status: "building"; processedFiles: number; totalFiles: number }
    | { status: "ready"; entityCount: number; sourceCount: number; modIds: string[]; categories: KnowledgeCategorySummary[]; loadedFromCache: boolean }
    | { status: "error"; message: string };
