import { KnowledgeIndexStatus, KnowledgeItemDetails, KnowledgeItemSummary } from "../knowledge/KnowledgeTypes";

export type KnowledgeApi = {
    open: (worldFolderName: string) => Promise<void>;
    getStatus: () => Promise<KnowledgeIndexStatus>;
    searchItems: (query: string, limit?: number) => Promise<KnowledgeItemSummary[]>;
    getItem: (itemId: string) => Promise<KnowledgeItemDetails | null>;
    onStatusChanged: (callback: (status: KnowledgeIndexStatus) => void) => () => void;
};
