import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";
import { KnowledgeItemSummary } from "@shared/knowledge/KnowledgeItemSummary";
import { KnowledgeItemDetails } from "@shared/knowledge/KnowledgeItemDetails";

export type KnowledgeApi = {
    open: (worldFolderName: string) => Promise<void>;
    getStatus: () => Promise<KnowledgeIndexStatus>;
    searchItems: (query: string, limit?: number) => Promise<KnowledgeItemSummary[]>;
    getItem: (itemId: string) => Promise<KnowledgeItemDetails | null>;
    onStatusChanged: (callback: (status: KnowledgeIndexStatus) => void) => () => void;
};
