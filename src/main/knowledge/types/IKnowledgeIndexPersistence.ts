import { TKnowledgeIndexContext } from "./TKnowledgeIndexContext";
import { TKnowledgeIndex } from "./TKnowledgeIndex";

export interface IKnowledgeIndexPersistence {
    load(context: TKnowledgeIndexContext): Promise<TKnowledgeIndex | null>;
    save(context: TKnowledgeIndexContext, index: TKnowledgeIndex): Promise<void>;
    drop(context: TKnowledgeIndexContext): Promise<void>;
}
