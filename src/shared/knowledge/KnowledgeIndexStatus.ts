export type KnowledgeIndexStatus =
    | { status: "idle" } //
    | { status: "building"; processedFiles: number; totalFiles: number }
    | { status: "ready"; itemCount: number; recipeCount: number; modIds: string[] }
    | { status: "error"; message: string };
