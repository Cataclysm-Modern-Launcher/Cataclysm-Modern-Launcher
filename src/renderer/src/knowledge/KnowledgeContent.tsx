import { Alert, Center, Loader, Stack, Text, Title } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { useKnowledgeNavigationStore } from "@renderer/stores/useKnowledgeNavigationStore";
import { KnowledgeReadyView } from "./KnowledgeReadyView";
import { useKnowledgeSearchHistory } from "./useKnowledgeSearchHistory";

const languageStorageKey = "knowledge.use-game-language";

export function KnowledgeContent(): React.JSX.Element {
    const t = useTranslate();
    const [status, setStatus] = useState<KnowledgeIndexStatus>({ status: "idle" });
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [entities, setEntities] = useState<KnowledgeEntitySummary[]>([]);
    const [localized, setLocalized] = useState(() => localStorage.getItem(languageStorageKey) !== "false");
    const navigation = useKnowledgeNavigationStore();
    const searchHistory = useKnowledgeSearchHistory();

    useEffect(() => {
        void window.api.knowledge.getStatus().then(setStatus);
        return window.api.knowledge.onStatusChanged(setStatus);
    }, []);

    useEffect(() => {
        if (status.status !== "ready") return;
        const timeout = window.setTimeout(() => {
            void window.api.knowledge.searchEntities(query, category, 300, localized).then(setEntities);
            searchHistory.remember(query);
        }, 500);
        return () => window.clearTimeout(timeout);
    }, [query, category, status, localized, searchHistory.remember, searchHistory]);

    if (status.status === "idle" || status.status === "building")
        return (
            <Center h="100vh">
                <Stack align="center">
                    <Loader />
                    <Title order={3}>{t("knowledge.index.building")}</Title>
                    {status.status === "building" && <Text c="dimmed">{t("knowledge.index.progress", { processed: status.processedFiles, total: status.totalFiles })}</Text>}
                </Stack>
            </Center>
        );
    if (status.status === "error")
        return (
            <Center h="100vh">
                <Alert color="red" title={t("knowledge.index.failed")}>
                    {status.message}
                </Alert>
            </Center>
        );

    const selected = navigation.index >= 0 ? navigation.entries[navigation.index] : null;
    const changeLanguage = async (value: boolean): Promise<void> => {
        localStorage.setItem(languageStorageKey, String(value));
        setLocalized(value);
        await navigation.reload(value);
    };
    const rebuild = async (): Promise<void> => {
        navigation.reset();
        setEntities([]);
        setStatus({ status: "building", processedFiles: 0, totalFiles: 0 });
        await window.api.knowledge.rebuild();
    };

    return (
        <KnowledgeReadyView
            status={status}
            query={query}
            category={category}
            entities={entities}
            selected={selected}
            searchHistory={searchHistory.history}
            onQueryChange={setQuery}
            onClearSearchHistory={searchHistory.clear}
            onCategoryChange={setCategory}
            onRebuild={() => void rebuild()}
            localized={localized}
            onLocalizedChange={(value) => void changeLanguage(value)}
        />
    );
}
