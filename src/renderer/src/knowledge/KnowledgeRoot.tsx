import { ActionIcon, Alert, AppShell, Badge, Box, Center, Divider, Group, Loader, MantineProvider, Menu, Paper, ScrollArea, SimpleGrid, Stack, Tabs, Text, TextInput, Title, Tooltip, UnstyledButton } from "@mantine/core";
import { IconArrowLeft, IconChevronDown, IconChevronLeft, IconChevronRight, IconSearch, IconTool } from "@tabler/icons-react";
import React, { useEffect, useMemo, useState } from "react";
import { KnowledgeIndexStatus, KnowledgeItemDetails, KnowledgeItemSummary, KnowledgeQualityRequirement, KnowledgeRecipe, KnowledgeRequirementGroup } from "@shared/knowledge/KnowledgeTypes";
import { useAppearanceStore } from "@renderer/stores/useAppearanceStore";
import { useLocaleStoreMount, useTranslate } from "@renderer/stores/useLocaleStore";

const preferredAlternativeIds: string[] = [];
const knownProficiencyIds = new Set<string>();

export function KnowledgeRoot(): React.JSX.Element {
    const mountAppearance = useAppearanceStore((state) => state.mount);
    const mountLocale = useLocaleStoreMount();
    const theme = useAppearanceStore((state) => state.theme);

    useEffect(() => mountAppearance(), [mountAppearance]);
    useEffect(() => mountLocale(), [mountLocale]);

    return (
        <MantineProvider forceColorScheme={theme}>
            <KnowledgeContent />
        </MantineProvider>
    );
}

function KnowledgeContent(): React.JSX.Element {
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
        const timeout = window.setTimeout(() => void window.api.knowledge.searchItems(query, 200).then(setItems), 120);
        return () => window.clearTimeout(timeout);
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
                            <ItemDetails item={selected} onNavigate={(id) => void openItem(id)} canGoBack={history.length > 0} onBack={() => void goBack()} />
                        </Box>
                    </ScrollArea>
                )}
            </AppShell.Main>
        </AppShell>
    );
}

function ItemDetails({ item, onNavigate, canGoBack, onBack }: { item: KnowledgeItemDetails; onNavigate: (itemId: string) => void; canGoBack: boolean; onBack: () => void }): React.JSX.Element {
    const t = useTranslate();
    return (
        <Stack maw={1000} mx="auto" pb="xl">
            <Group align="flex-start" wrap="nowrap">
                <Tooltip label={t("knowledge.navigation.back")}>
                    <ActionIcon mt={6} variant="subtle" disabled={!canGoBack} onClick={onBack}>
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                </Tooltip>
                <Box miw={0}>
                    <Title>{item.name}</Title>
                    <Group>
                        <Text c="dimmed">{item.id}</Text>
                        <Badge>{item.sourceModId}</Badge>
                        <Badge variant="outline">{item.type}</Badge>
                    </Group>
                </Box>
            </Group>
            {item.description && <Text>{item.description}</Text>}
            <Title order={3}>{t("knowledge.crafting.title")}</Title>
            {item.recipes.length === 0 ? <Text c="dimmed">{t("knowledge.crafting.empty")}</Text> : <RecipeBrowser recipes={item.recipes} onNavigate={onNavigate} />}
            <Title order={3}>{t("knowledge.used.in.title")}</Title>
            {item.usedIn.length === 0 ? (
                <Text c="dimmed">{t("knowledge.used.in.empty")}</Text>
            ) : (
                <Stack gap={4}>
                    {item.usedIn.map((usage) => (
                        <Paper key={usage.recipeKey} withBorder p="sm" onClick={() => onNavigate(usage.resultId)} style={{ cursor: "pointer" }}>
                            <Text>{usage.resultName}</Text>
                            <Text size="xs" c="dimmed">
                                {usage.resultId}
                            </Text>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}

function RecipeBrowser({ recipes, onNavigate }: { recipes: KnowledgeRecipe[]; onNavigate: (itemId: string) => void }): React.JSX.Element {
    const t = useTranslate();
    const [active, setActive] = useState(recipes[0]?.key ?? null);
    useEffect(() => setActive(recipes[0]?.key ?? null), [recipes]);
    const selected = useMemo(() => recipes.find((recipe) => recipe.key === active) ?? recipes[0], [active, recipes]);
    if (selected === undefined) return <></>;

    return (
        <Paper withBorder p="md">
            {recipes.length > 1 && (
                <Tabs value={active} onChange={setActive} variant="outline" mb="md">
                    <Tabs.List>
                        {recipes.map((recipe, index) => (
                            <Tabs.Tab key={recipe.key} value={recipe.key}>
                                {t("knowledge.recipe.tab", { index: index + 1 })}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs>
            )}
            <RecipeDetails recipe={selected} index={recipes.indexOf(selected) + 1} count={recipes.length} onNavigate={onNavigate} />
        </Paper>
    );
}

function RecipeDetails({ recipe, index, count, onNavigate }: { recipe: KnowledgeRecipe; index: number; count: number; onNavigate: (itemId: string) => void }): React.JSX.Element {
    const t = useTranslate();
    const [, refreshProficiencies] = useState(0);
    const components = [...recipe.components, ...recipe.resolvedRequirements.flatMap((requirement) => requirement.components)];
    const tools = [...recipe.tools, ...recipe.resolvedRequirements.flatMap((requirement) => requirement.tools)];
    const qualities = deduplicateQualities([...recipe.qualities, ...recipe.resolvedRequirements.flatMap((requirement) => requirement.qualities)]);
    const hasRequirements = components.length > 0 || tools.length > 0 || qualities.length > 0;
    const unresolvedRequirements = recipe.using.filter((reference) => !recipe.resolvedRequirements.some((resolved) => resolved.requirementId === reference.requirementId));
    const timeMultiplier = recipe.proficiencies.reduce((result, proficiency) => {
        if (knownProficiencyIds.has(proficiency.proficiencyId) || proficiency.required || proficiency.timeMultiplier === null || proficiency.timeMultiplier <= 0) return result;
        return result * proficiency.timeMultiplier;
    }, 1);
    const displayedTime = formatRecipeTime(recipe.time, timeMultiplier);

    const toggleProficiency = (id: string): void => {
        if (knownProficiencyIds.has(id)) knownProficiencyIds.delete(id);
        else knownProficiencyIds.add(id);
        refreshProficiencies((value) => value + 1);
    };

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                    {count > 1 && <Text fw={600}>{t("knowledge.recipe.number", { index, count })}</Text>}
                    <Group gap="xs">
                        <Badge variant="light">{recipe.sourceModId}</Badge>
                        {recipe.resultCount > 1 && <Badge variant="outline">×{recipe.resultCount}</Badge>}
                    </Group>
                </Stack>
                <Group gap="xs" justify="flex-end">
                    {recipe.skillUsed && <Badge variant="outline">{t("knowledge.recipe.primary.skill", { skill: recipe.skillUsed, level: recipe.difficulty ?? 0 })}</Badge>}
                    {displayedTime !== null && (
                        <Tooltip label={timeMultiplier > 1 ? t("knowledge.recipe.time.multiplier", { value: formatMultiplier(timeMultiplier) }) : undefined}>
                            <Badge variant="outline">{t("knowledge.recipe.time", { time: displayedTime })}</Badge>
                        </Tooltip>
                    )}
                    {recipe.activityLevel && <Badge variant="outline">{recipe.activityLevel}</Badge>}
                </Group>
            </Group>

            {(recipe.proficiencies.length > 0 || recipe.requiredSkills.length > 0) && (
                <RecipeSection title={t("knowledge.recipe.skills.and.proficiencies")}>
                    <Stack gap="sm">
                        {recipe.requiredSkills.length > 0 && (
                            <LabeledRequirement label={t("knowledge.recipe.additional.skills")}>
                                <Group gap="xs">
                                    {recipe.requiredSkills.map((skill) => (
                                        <Badge key={skill.skillId} variant="light">
                                            {skill.skillId} {skill.level}
                                        </Badge>
                                    ))}
                                </Group>
                            </LabeledRequirement>
                        )}
                        {recipe.proficiencies.length > 0 && (
                            <LabeledRequirement label={t("knowledge.recipe.proficiencies")}>
                                <Stack gap={6}>
                                    {recipe.proficiencies.map((proficiency) => {
                                        const known = knownProficiencyIds.has(proficiency.proficiencyId);
                                        return (
                                            <Group key={proficiency.proficiencyId} gap="xs" wrap="nowrap">
                                                <Tooltip label={t(known ? "knowledge.recipe.proficiency.known" : "knowledge.recipe.proficiency.unknown")}>
                                                    <UnstyledButton onClick={() => toggleProficiency(proficiency.proficiencyId)}>
                                                        <Badge color={known ? "green" : proficiency.required ? "red" : "blue"} variant={known ? "filled" : "outline"}>
                                                            {proficiency.proficiencyName}
                                                        </Badge>
                                                    </UnstyledButton>
                                                </Tooltip>
                                                {proficiency.required && (
                                                    <Text size="xs" fw={600}>
                                                        {t("knowledge.recipe.proficiency.required")}
                                                    </Text>
                                                )}
                                                {proficiency.timeMultiplier !== null && (
                                                    <Text size="xs" c="dimmed">
                                                        {t("knowledge.recipe.proficiency.time", { value: proficiency.timeMultiplier })}
                                                    </Text>
                                                )}
                                                {proficiency.skillPenalty !== null && (
                                                    <Text size="xs" c="dimmed">
                                                        {t("knowledge.recipe.proficiency.skill", { value: proficiency.skillPenalty })}
                                                    </Text>
                                                )}
                                            </Group>
                                        );
                                    })}
                                </Stack>
                            </LabeledRequirement>
                        )}
                    </Stack>
                </RecipeSection>
            )}

            {hasRequirements && (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {components.length > 0 && (
                        <RecipeSection title={t("knowledge.recipe.components")}>
                            <RequirementGroups groups={components} kind="component" onNavigate={onNavigate} />
                        </RecipeSection>
                    )}
                    {(tools.length > 0 || qualities.length > 0) && (
                        <RecipeSection title={t("knowledge.recipe.tools")}>
                            <Stack gap="xs">
                                <RequirementGroups groups={tools} kind="tool" onNavigate={onNavigate} />
                                <QualityRequirements qualities={qualities} onNavigate={onNavigate} />
                            </Stack>
                        </RecipeSection>
                    )}
                </SimpleGrid>
            )}

            {unresolvedRequirements.length > 0 && (
                <RecipeSection title={t("knowledge.recipe.requirements.unresolved")}>
                    <Stack gap={4}>
                        {unresolvedRequirements.map((entry) => (
                            <Text key={entry.requirementId} size="sm">
                                {t("knowledge.recipe.requirement", { requirement: entry.requirementId, multiplier: entry.multiplier })}
                            </Text>
                        ))}
                    </Stack>
                </RecipeSection>
            )}
            {recipe.byproducts.length > 0 && (
                <RecipeSection title={t("knowledge.recipe.byproducts")}>
                    <Stack gap={4}>
                        {recipe.byproducts.map((entry) => (
                            <UnstyledButton key={entry.itemId} onClick={() => onNavigate(entry.itemId)}>
                                <Text size="sm">
                                    ×{entry.count} {entry.itemName}
                                </Text>
                            </UnstyledButton>
                        ))}
                    </Stack>
                </RecipeSection>
            )}
        </Stack>
    );
}

function LabeledRequirement({ label, children }: React.PropsWithChildren<{ label: string }>): React.JSX.Element {
    return (
        <Box style={{ display: "grid", gridTemplateColumns: "150px minmax(0, 1fr)", alignItems: "start", columnGap: 16 }}>
            <Text size="sm" c="dimmed">
                {label}
            </Text>
            <Box miw={0}>{children}</Box>
        </Box>
    );
}

function QualityRequirements({ qualities, onNavigate }: { qualities: KnowledgeQualityRequirement[]; onNavigate: (itemId: string) => void }): React.JSX.Element {
    const t = useTranslate();
    return (
        <Stack gap={6}>
            {qualities.map((quality) => (
                <Group key={`${quality.qualityId}:${quality.level}`} gap="xs" wrap="nowrap">
                    <Badge variant="outline" color="cyan">
                        {t("knowledge.recipe.quality.badge")}
                    </Badge>
                    <Tooltip label={quality.qualityId} openDelay={350}>
                        <Text size="sm" truncate>
                            {t("knowledge.recipe.quality", { quality: quality.qualityName, level: quality.level })}
                        </Text>
                    </Tooltip>
                    {quality.providers.length > 0 && (
                        <Menu position="bottom-end" withinPortal shadow="md">
                            <Menu.Target>
                                <Tooltip label={t("knowledge.recipe.quality.providers")}>
                                    <ActionIcon size="sm" variant="subtle">
                                        <IconTool size={14} />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown mah={360} style={{ overflowY: "auto" }}>
                                <Menu.Label>{t("knowledge.recipe.quality.providers.count", { count: quality.providers.length })}</Menu.Label>
                                {quality.providers.map((provider) => (
                                    <Menu.Item key={provider.itemId} onClick={() => onNavigate(provider.itemId)}>
                                        <Group justify="space-between" wrap="nowrap">
                                            <Text size="sm" truncate maw={420}>
                                                {provider.itemName}
                                            </Text>
                                            <Badge size="xs" variant="light">
                                                {provider.level}
                                            </Badge>
                                        </Group>
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>
                    )}
                </Group>
            ))}
        </Stack>
    );
}

function RecipeSection({ title, children }: React.PropsWithChildren<{ title: string }>): React.JSX.Element {
    return (
        <Stack gap="xs">
            <Divider label={title} labelPosition="left" />
            <Box>{children}</Box>
        </Stack>
    );
}

function RequirementGroups({ groups, kind, onNavigate }: { groups: KnowledgeRequirementGroup[]; kind: "component" | "tool"; onNavigate: (itemId: string) => void }): React.JSX.Element {
    return (
        <Stack gap="xs">
            {groups.map((group, index) => (
                <AlternativeSelector key={index} alternatives={group} kind={kind} onNavigate={onNavigate} />
            ))}
        </Stack>
    );
}

function AlternativeSelector({ alternatives, kind, onNavigate }: { alternatives: KnowledgeRequirementGroup; kind: "component" | "tool"; onNavigate: (itemId: string) => void }): React.JSX.Element {
    const t = useTranslate();
    const ordered = useMemo(() => [...alternatives].sort((a, b) => alternativePriority(a.itemId) - alternativePriority(b.itemId)), [alternatives]);
    const [selectedId, setSelectedId] = useState(ordered[0]?.itemId ?? "");
    useEffect(() => setSelectedId(ordered[0]?.itemId ?? ""), [ordered]);
    if (ordered.length === 0) return <></>;
    const selectedIndex = Math.max(
        0,
        ordered.findIndex((entry) => entry.itemId === selectedId)
    );
    const selected = ordered[selectedIndex];
    const select = (itemId: string): void => {
        rememberAlternative(itemId);
        setSelectedId(itemId);
    };
    const move = (offset: number): void => select(ordered[(selectedIndex + offset + ordered.length) % ordered.length].itemId);
    const countText = kind === "tool" ? (selected.count > 0 ? t("knowledge.requirement.charges", { count: selected.count }) : "") : `×${selected.count}`;

    return (
        <Group gap={4} wrap="nowrap" justify="flex-start">
            <RequirementBadge itemId={selected.itemId} name={selected.itemName} countText={countText} onNavigate={onNavigate} />
            {ordered.length > 1 && (
                <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <ActionIcon size="sm" variant="subtle" onClick={() => move(-1)} aria-label={t("knowledge.requirement.previous")}>
                        <IconChevronLeft size={14} />
                    </ActionIcon>
                    <Menu position="bottom-start" withinPortal shadow="md">
                        <Menu.Target>
                            <UnstyledButton>
                                <Badge variant="outline" rightSection={<IconChevronDown size={11} />}>{`+${ordered.length - 1}`}</Badge>
                            </UnstyledButton>
                        </Menu.Target>
                        <Menu.Dropdown mah={360} style={{ overflowY: "auto" }}>
                            <Menu.Label>{t("knowledge.requirement.alternatives", { count: ordered.length })}</Menu.Label>
                            {ordered.map((alternative) => {
                                const alternativeCount = kind === "tool" ? (alternative.count > 0 ? t("knowledge.requirement.charges", { count: alternative.count }) : "") : `×${alternative.count}`;
                                return (
                                    <Menu.Item key={alternative.itemId} onClick={() => select(alternative.itemId)}>
                                        <Tooltip label={alternative.itemName} openDelay={350}>
                                            <Text size="sm" truncate maw={440}>
                                                {alternativeCount.length > 0 ? `${alternativeCount} ` : ""}
                                                {alternative.itemName}
                                            </Text>
                                        </Tooltip>
                                    </Menu.Item>
                                );
                            })}
                        </Menu.Dropdown>
                    </Menu>
                    <ActionIcon size="sm" variant="subtle" onClick={() => move(1)} aria-label={t("knowledge.requirement.next")}>
                        <IconChevronRight size={14} />
                    </ActionIcon>
                </Group>
            )}
        </Group>
    );
}

function RequirementBadge({ itemId, name, countText, onNavigate }: { itemId: string; name: string; countText: string; onNavigate: (itemId: string) => void }): React.JSX.Element {
    return (
        <Tooltip label={name} openDelay={350}>
            <UnstyledButton onClick={() => onNavigate(itemId)} style={{ minWidth: 0, maxWidth: "100%" }}>
                <Badge variant="light" size="lg" tt="none" maw="100%">
                    <Text span truncate>
                        {countText.length > 0 ? `${countText} ` : ""}
                        {name}
                    </Text>
                </Badge>
            </UnstyledButton>
        </Tooltip>
    );
}

function rememberAlternative(itemId: string): void {
    const currentIndex = preferredAlternativeIds.indexOf(itemId);
    if (currentIndex >= 0) preferredAlternativeIds.splice(currentIndex, 1);
    preferredAlternativeIds.unshift(itemId);
}

function alternativePriority(itemId: string): number {
    const index = preferredAlternativeIds.indexOf(itemId);
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
}

function deduplicateQualities(qualities: KnowledgeQualityRequirement[]): KnowledgeQualityRequirement[] {
    const result = new Map<string, KnowledgeQualityRequirement>();
    for (const quality of qualities) {
        const key = `${quality.qualityId}:${quality.level}`;
        const previous = result.get(key);
        if (previous === undefined) result.set(key, quality);
        else result.set(key, { ...previous, providers: [...new Map([...previous.providers, ...quality.providers].map((provider) => [provider.itemId, provider])).values()] });
    }
    return [...result.values()];
}

function formatMultiplier(value: number): string {
    return Number(value.toFixed(2)).toString();
}

function formatRecipeTime(value: KnowledgeRecipe["time"], multiplier: number): string | null {
    if (value === null) return null;
    let seconds: number | null = null;
    if (typeof value === "number") seconds = value / 100;
    else {
        const match = value.trim().match(/^([\d.]+)\s*(s|m|h|d)$/i);
        if (match !== null) {
            const amount = Number(match[1]);
            const unit = match[2].toLowerCase();
            seconds = amount * ({ s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1);
        }
    }
    if (seconds === null || !Number.isFinite(seconds)) return String(value);
    let remaining = Math.round(seconds * multiplier);
    const days = Math.floor(remaining / 86400);
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    remaining %= 60;
    return (
        [
            [days, "d"],
            [hours, "h"],
            [minutes, "m"],
            [remaining, "s"]
        ]
            .filter(([amount]) => Number(amount) > 0)
            .map(([amount, unit]) => `${amount} ${unit}`)
            .join(" ") || "0 s"
    );
}
