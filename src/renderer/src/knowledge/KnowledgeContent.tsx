import { Alert, Center, Loader, Stack, Text, Title } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeReadyView } from "./KnowledgeReadyView";

export function KnowledgeContent(): React.JSX.Element {
    const t = useTranslate();
    const [status, setStatus] = useState<KnowledgeIndexStatus>({ status: "idle" });
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [entities, setEntities] = useState<KnowledgeEntitySummary[]>([]);
    const [selected, setSelected] = useState<KnowledgeEntityDetails | null>(null);

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

    const openEntity = async (key: string): Promise<void> => setSelected(await window.api.knowledge.getEntity(key));
    const rebuild = async (): Promise<void> => {
        setSelected(null);
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
            onQueryChange={setQuery}
            onCategoryChange={setCategory}
            onOpen={(key) => void openEntity(key)}
            onRebuild={() => void rebuild()}
        />
    );
}
