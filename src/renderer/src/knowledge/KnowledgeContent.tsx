import { Alert, AppShell, Badge, Box, Center, Group, Loader, Paper, ScrollArea, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";
import { KnowledgeItemSummary } from "@shared/knowledge/KnowledgeItemSummary";
import { KnowledgeItemDetails } from "@shared/knowledge/KnowledgeItemDetails";
import { KnowledgeItemDetailsView } from "@renderer/knowledge/KnowledgeItemDetailsView";

export function KnowledgeContent(): React.JSX.Element {
    const t = useTranslate();
    const [status, setStatus] = useState<KnowledgeIndexStatus>({ status: "idle" });
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<KnowledgeItemSummary[]>([]);
    const [selected, setSelected] = useState<KnowledgeItemDetails | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        void window.api.knowledge.getStatus().then(setStatus);
        return window.api.knowledge.onStatusChanged(setStatus);
    }, []);

    useEffect(() => {
        if (status.status !== "ready") return;
        const timeout = window.setTimeout(async () => {
            const items = await window.api.knowledge.searchItems(query, 200);
            setItems(items);
        }, 120);
        return function cleanup() {
            window.clearTimeout(timeout);
        };
    }, [query, status]);

    const openItem = async (itemId: string, rememberCurrent = true): Promise<void> => {
        const next = await window.api.knowledge.getItem(itemId);
        if (next === null) return;
        if (rememberCurrent && selected !== null && selected.id !== next.id) setHistory((current) => [...current, selected.id]);
        setSelected(next);
    };

    const goBack = async (): Promise<void> => {
        const previousId = history.at(-1);
        if (previousId === undefined) return;
        setHistory((current) => current.slice(0, -1));
        await openItem(previousId, false);
    };

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

    return (
        <AppShell navbar={{ width: 360, breakpoint: "sm" }} padding={0} h="100vh" styles={{ main: { height: "100vh", overflow: "hidden" } }}>
            <AppShell.Navbar p="md">
                <Stack h="100%" gap="sm">
                    <Group justify="space-between">
                        <Title order={2}>{t("knowledge.title")}</Title>
                        <Badge variant="light">{t("knowledge.items.count", { count: status.itemCount })}</Badge>
                    </Group>
                    <TextInput value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<IconSearch size={16} />} placeholder={t("knowledge.search.placeholder")} />
                    <ScrollArea flex={1} offsetScrollbars>
                        <Stack gap={4} pr="xs">
                            {items.map((item) => (
                                <Paper key={item.id} withBorder p="sm" onClick={() => void openItem(item.id)} style={{ cursor: "pointer" }}>
                                    <Text fw={600}>{item.name}</Text>
                                    <Group gap="xs">
                                        <Text size="xs" c="dimmed">
                                            {item.id}
                                        </Text>
                                        <Badge size="xs" variant="outline">
                                            {item.sourceModId}
                                        </Badge>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>
                    </ScrollArea>
                </Stack>
            </AppShell.Navbar>

            <AppShell.Main>
                {selected === null ? (
                    <Center h="100%">
                        <Text c="dimmed">{t("knowledge.item.select")}</Text>
                    </Center>
                ) : (
                    <ScrollArea h="100%" offsetScrollbars>
                        <Box p="md">
                            <KnowledgeItemDetailsView item={selected} onNavigate={(id) => void openItem(id)} canGoBack={history.length > 0} onBack={() => void goBack()} />
                        </Box>
                    </ScrollArea>
                )}
            </AppShell.Main>
        </AppShell>
    );
}
