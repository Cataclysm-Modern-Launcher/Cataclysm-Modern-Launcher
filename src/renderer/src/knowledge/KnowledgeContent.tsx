import { Alert, Center, Loader, Stack, Text, Title } from "@mantine/core";
import React, { useEffect, useState } from "react";
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

export function KnowledgeContent(): React.JSX.Element {
    const t = useTranslate();
    const [status, setStatus] = useState<KnowledgeIndexStatus>({ status: "idle" });
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [entities, setEntities] = useState<KnowledgeEntitySummary[]>([]);
    const [navigation, setNavigation] = useState<NavigationState>(emptyNavigation);

    useEffect(() => {
        void window.api.knowledge.getStatus().then(setStatus);
        return window.api.knowledge.onStatusChanged(setStatus);
    }, []);

    useEffect(() => {
        if (status.status !== "ready") return;
        const timeout = window.setTimeout(() => void window.api.knowledge.searchEntities(query, category, 300).then(setEntities), 100);
        return () => window.clearTimeout(timeout);
    }, [query, category, status]);

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
    const openEntity = async (key: string): Promise<void> => {
        if (selected?.entity.key === key) return;
        const [entity, relations] = await Promise.all([window.api.knowledge.getEntity(key), window.api.knowledge.getEntityRelations(key)]);
        if (entity === null) return;
        const relatedKeys = relations.incoming
            .filter((relation) => relation.entity.jsonType === "recipe" || relation.entity.jsonType === "uncraft")
            .map((relation) => relation.entity.key);
        const relatedRelations = await window.api.knowledge.getEntityRelationsBatch(relatedKeys);
        setNavigation((current) => ({ entries: [...current.entries.slice(0, current.index + 1), { entity, relations, relatedRelations }], index: current.index + 1 }));
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
        />
    );
}
