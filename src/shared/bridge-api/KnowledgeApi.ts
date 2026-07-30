import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";

export type KnowledgeApi = {
    open: (worldFolderName: string) => Promise<void>;
    rebuild: () => Promise<void>;
    getStatus: () => Promise<KnowledgeIndexStatus>;
    searchEntities: (query: string, category: string | null, limit?: number) => Promise<KnowledgeEntitySummary[]>;
    getEntity: (key: string) => Promise<KnowledgeEntityDetails | null>;
    getEntityRelations: (key: string) => Promise<KnowledgeEntityRelations>;
    getEntityRelationsBatch: (keys: string[]) => Promise<Record<string, KnowledgeEntityRelations>>;
    onStatusChanged: (callback: (status: KnowledgeIndexStatus) => void) => () => void;
};
