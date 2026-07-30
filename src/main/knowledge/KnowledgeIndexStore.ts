import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { TKnowledgeIndexSnapshot } from "./types/TKnowledgeIndexSnapshot";
import { TKnowledgeIndex } from "./types/TKnowledgeIndex";
import { TKnowledgeIndexContext } from "./types/TKnowledgeIndexContext";
import { IKnowledgeIndexPersistence } from "./types/IKnowledgeIndexPersistence";
import { createHash } from "node:crypto";

const KNOWLEDGE_INDEX_SCHEMA_VERSION = 10;
const KNOWLEDGE_GRAPH_SCHEMA_VERSION = 6;

class KnowledgeIndexStore implements IKnowledgeIndexPersistence {
    async load(context: TKnowledgeIndexContext): Promise<TKnowledgeIndex | null> {
        try {
            const snapshot = JSON.parse(await readFile(this.getFilePath(context), "utf8")) as TKnowledgeIndexSnapshot;
            if (snapshot.schemaVersion !== KNOWLEDGE_INDEX_SCHEMA_VERSION) return null;
            return snapshot.index;
        } catch {
            return null;
        }
    }

    async save(context: TKnowledgeIndexContext, index: TKnowledgeIndex): Promise<void> {
        const directory = this.getDirectory(context);
        await mkdir(directory, { recursive: true });
        const snapshot: TKnowledgeIndexSnapshot = { schemaVersion: KNOWLEDGE_INDEX_SCHEMA_VERSION, index };
        await writeFile(this.getFilePath(context), JSON.stringify(snapshot), "utf8");
    }

    async drop(context: TKnowledgeIndexContext): Promise<void> {
        await rm(this.getDirectory(context), { recursive: true, force: true });
    }

    private getDirectory(context: TKnowledgeIndexContext): string {
        return join(context.workspacePath, "cache", "knowledge", this.createKnowledgeIndexKey(context));
    }

    private getFilePath(context: TKnowledgeIndexContext): string {
        return join(this.getDirectory(context), "index.json");
    }

    private createKnowledgeIndexKey(context: TKnowledgeIndexContext): string {
        const value = JSON.stringify({
            schemaVersion: KNOWLEDGE_INDEX_SCHEMA_VERSION,
            graphSchemaVersion: KNOWLEDGE_GRAPH_SCHEMA_VERSION,
            bundleId: context.bundleId,
            worldFolderName: context.worldFolderName,
            modIds: context.modIds
        });
        return createHash("sha256").update(value).digest("hex").slice(0, 24);
    }
}

export const knowledgeIndexStore = new KnowledgeIndexStore();
