import React from "react";
import { ActionIcon, AppShell, Badge, Box, Center, Group, ScrollArea, Stack, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { IconRefresh, IconSearch } from "@tabler/icons-react";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeCategorySelect } from "./KnowledgeCategorySelect";
import { KnowledgeEntityCard } from "./KnowledgeEntityCard";
import { KnowledgeEntityDetailsView } from "./KnowledgeEntityDetailsView";

export type KnowledgeReadyViewProps = {
    status: Extract<KnowledgeIndexStatus, { status: "ready" }>;
    query: string;
    category: string | null;
    entities: KnowledgeEntitySummary[];
    selected: KnowledgeEntityDetails | null;
    onQueryChange: (value: string) => void;
    onCategoryChange: (value: string | null) => void;
    onOpen: (key: string) => void;
    onRebuild: () => void;
};

export function KnowledgeReadyView(props: KnowledgeReadyViewProps): React.JSX.Element {
    const t = useTranslate();
    return (
        <AppShell navbar={{ width: 380, breakpoint: "sm" }} padding={0} h="100vh" styles={{ main: { height: "100vh", overflow: "hidden" } }}>
            <AppShell.Navbar p="md">
                <Stack h="100%" gap="sm">
                    <Group justify="space-between">
                        <Title order={2}>{t("knowledge.title")}</Title>
                        <Group gap="xs">
                            <Badge variant="light">{props.status.entityCount}</Badge>
                            <Tooltip label={t("knowledge.index.rebuild")}>
                                <ActionIcon variant="subtle" onClick={props.onRebuild}>
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Group>
                    <KnowledgeCategorySelect categories={props.status.categories} value={props.category} onChange={props.onCategoryChange} />
                    <TextInput value={props.query} onChange={(event) => props.onQueryChange(event.currentTarget.value)} leftSection={<IconSearch size={16} />} placeholder={t("knowledge.search.entities")} />
                    <ScrollArea flex={1} offsetScrollbars>
                        <Stack gap={4} pr="xs">
                            {props.entities.map((entity) => (
                                <KnowledgeEntityCard key={entity.key} entity={entity} onOpen={props.onOpen} />
                            ))}
                        </Stack>
                    </ScrollArea>
                    <Text size="xs" c="dimmed">
                        {t("knowledge.index.sources", { count: props.status.sourceCount })}
                        {props.status.loadedFromCache ? ` · ${t("knowledge.index.cached")}` : ""}
                    </Text>
                </Stack>
            </AppShell.Navbar>
            <AppShell.Main>
                {props.selected === null ? (
                    <Center h="100%">
                        <Text c="dimmed">{t("knowledge.entity.select")}</Text>
                    </Center>
                ) : (
                    <ScrollArea h="100%" offsetScrollbars>
                        <Box p="md">
                            <KnowledgeEntityDetailsView entity={props.selected} />
                        </Box>
                    </ScrollArea>
                )}
            </AppShell.Main>
        </AppShell>
    );
}
