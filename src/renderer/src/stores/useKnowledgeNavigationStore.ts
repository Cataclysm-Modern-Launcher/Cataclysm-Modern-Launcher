import { create } from "zustand";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgePage } from "@renderer/knowledge/KnowledgePage";

type NavigationEntry = KnowledgePage & { tab: string };

type KnowledgeNavigationState = {
    entries: NavigationEntry[];
    index: number;
    requestId: number;
    open: (key: string, localized: boolean) => Promise<void>;
    back: () => void;
    forward: () => void;
    setTab: (tab: string) => void;
    reload: (localized: boolean) => Promise<void>;
    reset: () => void;
};

async function loadPage(key: string, localized: boolean): Promise<NavigationEntry | null> {
    const [entity, relations] = await Promise.all([window.api.knowledge.getEntity(key, localized), window.api.knowledge.getEntityRelations(key, localized)]);
    if (entity === null) return null;

    const relatedKeys = [...new Set(relations.incoming.filter((relation) => relation.entity.jsonType === "recipe" || relation.entity.jsonType === "uncraft").map((relation) => relation.entity.key))];
    const [relatedRelations, relatedEntityValues] = await Promise.all([
        window.api.knowledge.getEntityRelationsBatch(relatedKeys, localized),
        Promise.all(relatedKeys.map((relatedKey) => window.api.knowledge.getEntity(relatedKey, localized)))
    ]);
    const relatedEntities = Object.fromEntries(relatedEntityValues.filter((value): value is KnowledgeEntityDetails => value !== null).map((value) => [value.key, value]));
    return { entity, relations, relatedEntities, relatedRelations, tab: "info" };
}

export const useKnowledgeNavigationStore = create<KnowledgeNavigationState>((set, get) => ({
    entries: [],
    index: -1,
    requestId: 0,
    open: async (key, localized) => {
        const current = get();
        if (current.entries[current.index]?.entity.key === key) return;
        const requestId = current.requestId + 1;
        set({ requestId });
        const page = await loadPage(key, localized);
        if (page === null || get().requestId !== requestId) return;
        set((state) => ({ entries: [...state.entries.slice(0, state.index + 1), page], index: state.index + 1 }));
    },
    back: () => set((state) => ({ index: Math.max(0, state.index - 1) })),
    forward: () => set((state) => ({ index: Math.min(state.entries.length - 1, state.index + 1) })),
    setTab: (tab) =>
        set((state) => ({
            entries: state.entries.map((entry, index) => (index === state.index ? { ...entry, tab } : entry))
        })),
    reload: async (localized) => {
        const current = get();
        const requestId = current.requestId + 1;
        set({ requestId });
        const pages = await Promise.all(current.entries.map((entry) => loadPage(entry.entity.key, localized)));
        if (get().requestId !== requestId || pages.some((page) => page === null)) return;
        set({
            entries: pages.map((page, index) => ({ ...(page as NavigationEntry), tab: current.entries[index].tab })),
            index: current.index
        });
    },
    reset: () => set((state) => ({ entries: [], index: -1, requestId: state.requestId + 1 }))
}));

export function useKnowledgeNavigate(): (key: string) => void {
    const open = useKnowledgeNavigationStore((state) => state.open);
    return (key: string) => {
        const localized = localStorage.getItem("knowledge.use-game-language") !== "false";
        void open(key, localized);
    };
}
