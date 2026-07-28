import React, { useEffect } from "react";
import { useConfigStore } from "@renderer/stores/useConfigStore";
import { useAppearanceStore } from "@renderer/stores/useAppearanceStore";
import { useModsStore } from "@renderer/stores/useModsStore";
import { useWorkspaceStore } from "@renderer/stores/useWorkspaceStore";
import { useLocaleStoreMount } from "@renderer/stores/useLocaleStore";
import { useGameRuntimeStatusMount } from "@renderer/stores/useGameRuntimeStore";
import { useGameStateStore } from "@renderer/stores/useGameStateStore";
import { useGameFileOperationStore } from "@renderer/stores/useGameFileOperationStore";
import { useGameBundleInstallStore } from "@renderer/stores/useGameBundleInstallStore";
import { useGameBackupStore } from "@renderer/stores/useGameBackupStore";
import { KnowledgeContent } from "@renderer/knowledge/KnowledgeContent";
import { useKnownProficiency } from "@renderer/knowledge/stores/useKnownProficiency";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { defaultModalProps } from "@renderer/utils/DefaultModalProps";
import { contextModals } from "@renderer/modals/contextModals";
import { Notifications } from "@mantine/notifications";
import { SelfUpdaterStatus } from "@renderer/components/SelfUpdaterStatus";
import { WorkspaceView } from "@renderer/components/workspace/WorkspaceView";
import { AppBottomDock } from "@renderer/components/AppBottomDock";
import { DrawerOwner } from "@renderer/components/DrawerOwner";

export function Root(): React.JSX.Element {
    return new URLSearchParams(window.location.search).get("view") === "knowledge" ? <KnowledgeRoot /> : <LauncherRoot />;
}

function LauncherRoot(): React.JSX.Element {
    // Appearance settings bridge
    const mountAppearance = useAppearanceStore((state) => state.mount);
    useEffect(() => mountAppearance(), [mountAppearance]);

    // Workspace settings bridge
    const mountConfig = useConfigStore((state) => state.mount);
    useEffect(() => mountConfig(), [mountConfig]);

    const mountLocale = useLocaleStoreMount();
    useEffect(() => mountLocale(), [mountLocale]);

    const mountWorkspace = useWorkspaceStore((state) => state.mount);
    useEffect(() => mountWorkspace(), [mountWorkspace]);

    const mountMods = useModsStore((state) => state.mount);
    useEffect(() => mountMods(), [mountMods]);

    const mountGameState = useGameStateStore((state) => state.mount);
    useEffect(() => mountGameState(), [mountGameState]);

    const mountGameFileOperation = useGameFileOperationStore((state) => state.mount);
    useEffect(() => mountGameFileOperation(), [mountGameFileOperation]);

    const mountGameBundleInstall = useGameBundleInstallStore((state) => state.mount);
    useEffect(() => mountGameBundleInstall(), [mountGameBundleInstall]);

    const mountGameBackup = useGameBackupStore((state) => state.mount);
    useEffect(() => mountGameBackup(), [mountGameBackup]);

    useGameRuntimeStatusMount();

    const colorTheme = useAppearanceStore((state) => state.theme);

    return (
        <MantineProvider forceColorScheme={colorTheme}>
            <ModalsProvider modalProps={defaultModalProps} modals={contextModals}>
                <Notifications position="top-right" />

                <SelfUpdaterStatus />

                <main className="app-shell">
                    <WorkspaceView />
                </main>

                <AppBottomDock />

                <DrawerOwner />
            </ModalsProvider>
        </MantineProvider>
    );
}

function KnowledgeRoot(): React.JSX.Element {
    const mountAppearance = useAppearanceStore((state) => state.mount);
    useEffect(() => mountAppearance(), [mountAppearance]);

    const mountLocale = useLocaleStoreMount();
    useEffect(() => mountLocale(), [mountLocale]);

    const mountKnownProficiency = useKnownProficiency((state) => state.mount);
    useEffect(() => mountKnownProficiency(), [mountKnownProficiency]);

    const theme = useAppearanceStore((state) => state.theme);

    return (
        <MantineProvider forceColorScheme={theme}>
            <KnowledgeContent />
        </MantineProvider>
    );
}
