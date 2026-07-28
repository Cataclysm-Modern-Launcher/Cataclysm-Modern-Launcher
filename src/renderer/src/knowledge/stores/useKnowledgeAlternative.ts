import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KnowledgeAlternativeKind = "component" | "tool";

interface KnowledgeAlternativeState {
    preferredIdsByKind: Record<KnowledgeAlternativeKind, string[]>;
    selectedIdByGroup: Record<string, string>;
    selectAlternative: (kind: KnowledgeAlternativeKind, groupKey: string, itemId: string) => void;
    clearPreferences: () => void;
}

const MAX_PREFERRED_IDS = 200;
const MAX_SELECTED_GROUPS = 1000;

const initialPreferredIdsByKind = (): Record<KnowledgeAlternativeKind, string[]> => ({
    component: [],
    tool: []
});

export const useKnowledgeAlternative = create<KnowledgeAlternativeState>()(
    persist(
        (set) => ({
            preferredIdsByKind: initialPreferredIdsByKind(),

            selectedIdByGroup: {},

            selectAlternative: (kind, groupKey, itemId) => {
                set((state) => {
                    const preferredIds = state.preferredIdsByKind[kind];
                    const selectedEntries = Object.entries(state.selectedIdByGroup).filter(([key]) => key !== groupKey);

                    return {
                        preferredIdsByKind: {
                            ...state.preferredIdsByKind,
                            [kind]: [itemId, ...preferredIds.filter((id) => id !== itemId)].slice(0, MAX_PREFERRED_IDS)
                        },
                        selectedIdByGroup: Object.fromEntries([[groupKey, itemId], ...selectedEntries].slice(0, MAX_SELECTED_GROUPS))
                    };
                });
            },

            clearPreferences: () => {
                set({
                    preferredIdsByKind: initialPreferredIdsByKind(),
                    selectedIdByGroup: {}
                });
            }
        }),
        {
            name: "knowledge-alternative-preferences",
            version: 1,
            partialize: (state) => ({
                preferredIdsByKind: state.preferredIdsByKind,
                selectedIdByGroup: state.selectedIdByGroup
            })
        }
    )
);
