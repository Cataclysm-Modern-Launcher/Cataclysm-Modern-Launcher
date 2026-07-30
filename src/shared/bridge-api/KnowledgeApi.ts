import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";
import { KnowledgeLanguageInfo } from "@shared/knowledge/KnowledgeLanguageInfo";

export type KnowledgeApi = {
    open: (worldFolderName: string) => Promise<void>;
    rebuild: () => Promise<void>;
    getStatus: () => Promise<KnowledgeIndexStatus>;
    getLanguage: () => Promise<KnowledgeLanguageInfo>;
    searchEntities: (query: string, category: string | null, limit?: number, localized?: boolean) => Promise<KnowledgeEntitySummary[]>;
    getEntity: (key: string, localized?: boolean) => Promise<KnowledgeEntityDetails | null>;
    getEntityRelations: (key: string, localized?: boolean) => Promise<KnowledgeEntityRelations>;
    getEntityRelationsBatch: (keys: string[], localized?: boolean) => Promise<Record<string, KnowledgeEntityRelations>>;
    onStatusChanged: (callback: (status: KnowledgeIndexStatus) => void) => () => void;
};
