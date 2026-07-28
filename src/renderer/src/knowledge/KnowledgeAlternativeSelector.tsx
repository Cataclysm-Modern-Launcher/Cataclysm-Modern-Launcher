import { KnowledgeRequirementAlternative } from "@shared/knowledge/KnowledgeRequirementAlternative";
import { KnowledgeRequirementGroup } from "@shared/knowledge/KnowledgeRequirementGroup";
import React, { useMemo } from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeAlternativeKind, useKnowledgeAlternative } from "@renderer/knowledge/stores/useKnowledgeAlternative";
import { ActionIcon, Badge, Group, Menu, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { RecipeRequirementBadge } from "@renderer/knowledge/RecipeRequirementBadge";
import { IconChevronDown, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

interface Props {
    alternatives: KnowledgeRequirementGroup;
    kind: KnowledgeAlternativeKind;
    onNavigate: (itemId: string) => void;
}

function createGroupKey(kind: KnowledgeAlternativeKind, alternatives: KnowledgeRequirementGroup): string {
    const itemIds = alternatives.map((alternative) => alternative.itemId).sort();
    return `${kind}:${JSON.stringify(itemIds)}`;
}

function sortByPreference(alternatives: KnowledgeRequirementGroup, preferredIds: readonly string[]): KnowledgeRequirementAlternative[] {
    const priorities = new Map(preferredIds.map((itemId, index) => [itemId, index]));

    return [...alternatives].sort((left, right) => {
        const leftPriority = priorities.get(left.itemId) ?? Number.MAX_SAFE_INTEGER;
        const rightPriority = priorities.get(right.itemId) ?? Number.MAX_SAFE_INTEGER;
        return leftPriority - rightPriority;
    });
}

export function KnowledgeAlternativeSelector({ alternatives, kind, onNavigate }: Props): React.JSX.Element {
    const t = useTranslate();
    const groupKey = useMemo(() => createGroupKey(kind, alternatives), [alternatives, kind]);
    const preferredIds = useKnowledgeAlternative((state) => state.preferredIdsByKind[kind]);
    const selectedId = useKnowledgeAlternative((state) => state.selectedIdByGroup[groupKey]);
    const selectAlternative = useKnowledgeAlternative((state) => state.selectAlternative);

    const ordered = useMemo(() => sortByPreference(alternatives, preferredIds), [alternatives, preferredIds]);

    if (!ordered.length) return <></>;

    const selectedIndex = Math.max(
        0,
        ordered.findIndex((entry) => entry.itemId === selectedId)
    );
    const selected = ordered[selectedIndex];

    const select = (itemId: string): void => selectAlternative(kind, groupKey, itemId);
    const move = (offset: number): void => select(ordered[(selectedIndex + offset + ordered.length) % ordered.length].itemId);
    const countText = kind === "tool" ? (selected.count > 0 ? t("knowledge.requirement.charges", { count: selected.count }) : "") : `×${selected.count}`;

    return (
        <Group gap={4} wrap="nowrap" justify="flex-start">
            <RecipeRequirementBadge itemId={selected.itemId} name={selected.itemName} countText={countText} onNavigate={onNavigate} />

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
