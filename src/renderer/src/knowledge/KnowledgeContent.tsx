import { Alert, Center, Loader, Stack, Text, Title } from "@mantine/core";
import React, { useEffect, useRef, useState } from "react";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgePage } from "./KnowledgePage";
import { KnowledgeReadyView } from "./KnowledgeReadyView";

type NavigationState = {
    entries: KnowledgePage[];
    index: number;
};

const emptyNavigation: NavigationState = { entries: [], index: -1 };
const languageStorageKey = "knowledge.use-game-language";

export function KnowledgeContent(): React.JSX.Element {
    const t = useTranslate();
    const [status, setStatus] = useState<KnowledgeIndexStatus>({ status: "idle" });
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [entities, setEntities] = useState<KnowledgeEntitySummary[]>([]);
    const [navigation, setNavigation] = useState<NavigationState>(emptyNavigation);
    const [localized, setLocalized] = useState(() => localStorage.getItem(languageStorageKey) !== "false");
    const languageChangeId = useRef(0);

    useEffect(() => {
        void window.api.knowledge.getStatus().then(setStatus);
        return window.api.knowledge.onStatusChanged(setStatus);
    }, []);

    useEffect(() => {
        if (status.status !== "ready") return;
        const timeout = window.setTimeout(() => void window.api.knowledge.searchEntities(query, category, 300, localized).then(setEntities), 100);
        return () => window.clearTimeout(timeout);
    }, [query, category, status, localized]);

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
    const loadPage = async (key: string, useGameLanguage: boolean): Promise<KnowledgePage | null> => {
        const [entity, relations] = await Promise.all([
            window.api.knowledge.getEntity(key, useGameLanguage),
            window.api.knowledge.getEntityRelations(key, useGameLanguage),
        ]);
        if (entity === null) return null;
        const relatedKeys = relations.incoming
            .filter((relation) => relation.entity.jsonType === "recipe" || relation.entity.jsonType === "uncraft")
            .map((relation) => relation.entity.key);
        const relatedRelations = await window.api.knowledge.getEntityRelationsBatch(relatedKeys, useGameLanguage);
        return { entity, relations, relatedRelations };
    };
    const openEntity = async (key: string): Promise<void> => {
        if (selected?.entity.key === key) return;
        const page = await loadPage(key, localized);
        if (page === null) return;
        setNavigation((current) => ({ entries: [...current.entries.slice(0, current.index + 1), page], index: current.index + 1 }));
    };
    const changeLanguage = async (value: boolean): Promise<void> => {
        localStorage.setItem(languageStorageKey, String(value));
        setLocalized(value);

        const requestId = ++languageChangeId.current;
        const currentNavigation = navigation;
        const pages = await Promise.all(currentNavigation.entries.map((page) => loadPage(page.entity.key, value)));
        if (requestId !== languageChangeId.current || pages.some((page) => page === null)) return;
        setNavigation({ entries: pages.filter((page): page is KnowledgePage => page !== null), index: currentNavigation.index });
    };

    const rebuild = async (): Promise<void> => {
        setNavigation(emptyNavigation);
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
            canGoBack={navigation.index > 0}
            canGoForward={navigation.index >= 0 && navigation.index < navigation.entries.length - 1}
            onQueryChange={setQuery}
            onCategoryChange={setCategory}
            onOpen={(key) => void openEntity(key)}
            onBack={() => setNavigation((current) => ({ ...current, index: Math.max(0, current.index - 1) }))}
            onForward={() => setNavigation((current) => ({ ...current, index: Math.min(current.entries.length - 1, current.index + 1) }))}
            onRebuild={() => void rebuild()}
            localized={localized}
            onLocalizedChange={(value) => void changeLanguage(value)}
        />
    );
}
