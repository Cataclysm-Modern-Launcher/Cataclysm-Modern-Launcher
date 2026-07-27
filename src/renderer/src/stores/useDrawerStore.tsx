import { create } from "zustand";
import { useCallback } from "react";

type TDrawer = { kind: null } | { kind: "backups" } | { kind: "mods" } | { kind: "settings" } | { kind: "game-bundles" };

export type TDrawerKind = TDrawer["kind"];

interface State {
    drawer: TDrawer;
    openDrawer: (drawer: TDrawer) => void;
    close: () => void;
}

const useDrawerStore = create<State>((set) => ({
    drawer: { kind: null },
    openDrawer: (drawer: TDrawer) => set({ drawer }),
    close: () => set({ drawer: { kind: null } })
}));

export function useCloseDrawer(): () => void {
    const close = useDrawerStore((state) => state.close);
    return () => close();
}

export function useOpenDrawer(kind: TDrawerKind) {
    const openDrawer = useDrawerStore((state) => state.openDrawer);
    return () => openDrawer({ kind });
}

export function useOpenDrawerFn(): (kind: TDrawerKind) => void {
    const openDrawer = useDrawerStore((state) => state.openDrawer);
    return useCallback((kind: TDrawerKind) => openDrawer({ kind }), [openDrawer]);
}

export function useIsDrawerOpened(kind: TDrawerKind): boolean {
    const drawer = useDrawerStore((state) => state.drawer);
    return kind === drawer.kind;
}
