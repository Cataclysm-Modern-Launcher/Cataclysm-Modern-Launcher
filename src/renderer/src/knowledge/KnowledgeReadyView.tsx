import React from "react";
import { ActionIcon, AppShell, Badge, Box, Center, Group, ScrollArea, Stack, Switch, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { IconRefresh, IconSearch } from "@tabler/icons-react";
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
    selected: KnowledgePage | null;
    canGoBack: boolean;
    canGoForward: boolean;
    onQueryChange: (value: string) => void;
    onCategoryChange: (value: string | null) => void;
    onOpen: (key: string) => void;
    onBack: () => void;
    onForward: () => void;
    onRebuild: () => void;
    localized: boolean;
    onLocalizedChange: (value: boolean) => void;
};

export function KnowledgeReadyView(props: KnowledgeReadyViewProps): React.JSX.Element {
    const t = useTranslate();
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
                                        onLabel="EN"
                                        offLabel={props.status.language.gameLanguage.toUpperCase()}
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
                    <TextInput value={props.query} onChange={(event) => props.onQueryChange(event.currentTarget.value)} leftSection={<IconSearch size={16} />} placeholder={t("knowledge.search.entities")} />
                    <ScrollArea flex={1} offsetScrollbars>
                        <Stack gap={4} pr="xs">
                            {props.entities.map((entity) => (
                                <KnowledgeEntityCard key={entity.key} entity={entity} onOpen={props.onOpen} />
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
                    <ScrollArea h="100%" offsetScrollbars>
                        <Box p="md">
                            <KnowledgeEntityDetailsView
                                key={`${props.selected.entity.key}:${props.localized ? props.status.language.gameLanguage : "en"}`}
                                entity={props.selected.entity}
                                relations={props.selected.relations}
                                relatedRelations={props.selected.relatedRelations}
                                canGoBack={props.canGoBack}
                                canGoForward={props.canGoForward}
                                onOpen={props.onOpen}
                                onBack={props.onBack}
                                onForward={props.onForward}
                            />
                        </Box>
                    </ScrollArea>
                )}
            </AppShell.Main>
        </AppShell>
    );
}
