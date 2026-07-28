import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";

export type KnowledgeApi = {
    open: (worldFolderName: string) => Promise<void>;
    rebuild: () => Promise<void>;
    getStatus: () => Promise<KnowledgeIndexStatus>;
    searchEntities: (query: string, category: string | null, limit?: number) => Promise<KnowledgeEntitySummary[]>;
    getEntity: (key: string) => Promise<KnowledgeEntityDetails | null>;
    onStatusChanged: (callback: (status: KnowledgeIndexStatus) => void) => () => void;
};
