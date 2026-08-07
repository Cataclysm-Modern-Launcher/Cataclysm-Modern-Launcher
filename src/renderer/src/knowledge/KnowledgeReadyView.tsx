import React, { useEffect, useRef } from "react";
import { ActionIcon, AppShell, Badge, Box, Center, Group, Menu, ScrollArea, Stack, Switch, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { IconChevronDown, IconHistory, IconRefresh, IconSearch, IconTrash } from "@tabler/icons-react";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import { KnowledgeIndexStatus } from "@shared/knowledge/KnowledgeIndexStatus";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeCategorySelect } from "./KnowledgeCategorySelect";
import { KnowledgeEntityCard } from "./KnowledgeEntityCard";
import { KnowledgeEntityDetailsView } from "./KnowledgeEntityDetailsView";
import { KnowledgePage } from "./KnowledgePage";

export type KnowledgeReadyViewProps = {
    status: Extract<KnowledgeIndexStatus, { status: "ready" }>;
    query: string;
    category: string | null;
    entities: KnowledgeEntitySummary[];
    selected: (KnowledgePage & { tab: string }) | null;
    searchHistory: string[];
    onQueryChange: (value: string) => void;
    onQueryCommit: (value: string) => void;
    onClearSearchHistory: () => void;
    onCategoryChange: (value: string | null) => void;
    onRebuild: () => void;
    localized: boolean;
    onLocalizedChange: (value: boolean) => void;
};

export function KnowledgeReadyView(props: KnowledgeReadyViewProps): React.JSX.Element {
    const t = useTranslate();
    const resultsViewportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        resultsViewportRef.current?.scrollTo({ top: 0 });
    }, [props.entities]);

    const historyButton = (
        <Menu position="bottom-end" withinPortal>
            <Menu.Target>
                <ActionIcon variant="subtle" size="sm" disabled={props.searchHistory.length === 0} aria-label={t("knowledge.search.history")}>
                    <IconChevronDown size={15} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label>{t("knowledge.search.history")}</Menu.Label>
                {props.searchHistory.map((item) => (
                    <Menu.Item key={item} leftSection={<IconHistory size={14} />} onClick={() => props.onQueryChange(item)}>
                        {item}
                    </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={props.onClearSearchHistory}>
                    {t("knowledge.search.history.clear")}
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );

    return (
        <AppShell navbar={{ width: 380, breakpoint: "sm" }} padding={0} h="100vh" styles={{ main: { height: "100vh", overflow: "hidden" } }}>
            <AppShell.Navbar p="md">
                <Stack h="100%" gap="sm">
                    <Group justify="space-between">
                        <Group gap="sm">
                            <Title order={2}>{t("knowledge.title")}</Title>
                            {props.status.language.hasTranslation && (
                                <Tooltip label={t("knowledge.language.switch.tooltip")} refProp="rootRef">
                                    <Switch
                                        size="md"
                                        checked={props.localized}
                                        onChange={(event) => props.onLocalizedChange(event.currentTarget.checked)}
                                        offLabel="EN"
                                        onLabel={props.status.language.gameLanguage.toUpperCase()}
                                    />
                                </Tooltip>
                            )}
                        </Group>
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
                    <TextInput
                        value={props.query}
                        onChange={(event) => props.onQueryChange(event.currentTarget.value)}
                        onBlur={() => props.onQueryCommit(props.query)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") props.onQueryCommit(props.query);
                        }}
                        leftSection={<IconSearch size={16} />}
                        rightSection={historyButton}
                        rightSectionPointerEvents="all"
                        placeholder={t("knowledge.search.entities")}
                    />
                    <ScrollArea flex={1} offsetScrollbars viewportRef={resultsViewportRef}>
                        <Stack gap={4} pr="xs">
                            {props.entities.map((entity) => (
                                <KnowledgeEntityCard key={entity.key} entity={entity} />
                            ))}
                        </Stack>
                    </ScrollArea>
                    <Group justify="space-between" gap="sm" wrap="nowrap">
                        <Text size="xs" c="dimmed">
                            {t("knowledge.index.sources", { count: props.status.sourceCount })}
                            {props.status.loadedFromCache ? ` · ${t("knowledge.index.cached")}` : ""}
                        </Text>
                    </Group>
                </Stack>
            </AppShell.Navbar>
            <AppShell.Main>
                {props.selected === null ? (
                    <Center h="100%">
                        <Text c="dimmed">{t("knowledge.entity.select")}</Text>
                    </Center>
                ) : (
                    <ScrollArea key={props.selected.entity.key} h="100%" offsetScrollbars>
                        <Box p="md">
                            <KnowledgeEntityDetailsView
                                entity={props.selected.entity}
                                relations={props.selected.relations}
                                relatedEntities={props.selected.relatedEntities}
                                relatedRelations={props.selected.relatedRelations}
                            />
                        </Box>
                    </ScrollArea>
                )}
            </AppShell.Main>
        </AppShell>
    );
}
