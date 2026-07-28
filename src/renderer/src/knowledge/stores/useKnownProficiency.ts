import { create } from "zustand";
import { IMountableState } from "@renderer/types/IMountableState";

interface State extends IMountableState {
    knownProficiencyIds: Set<string>;
    hasProficiency: (id: string) => boolean;
    toggleProficiency: (id: string) => void;
}

export const useKnownProficiency = create<State>((set, get) => ({
    knownProficiencyIds: new Set<string>(),

    mount: () => {
        return function cleanup() {
            // no-op for now, todo: load state from storage
        };
    },

    hasProficiency: (id: string) => get().knownProficiencyIds.has(id),

    toggleProficiency: (id: string) => {
        const knownProficiencyIds = new Set(get().knownProficiencyIds);
        if (knownProficiencyIds.has(id)) knownProficiencyIds.delete(id);
        else knownProficiencyIds.add(id);
        set({ knownProficiencyIds });
    }
}));
