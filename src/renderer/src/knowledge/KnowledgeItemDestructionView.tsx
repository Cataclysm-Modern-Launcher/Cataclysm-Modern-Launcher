import { Anchor, Badge, Group, Modal, Paper, SegmentedControl, Stack, Tabs, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeEntityReference } from "@shared/knowledge/KnowledgeEntityReference";
import { KnowledgeItemDestructionAction, KnowledgeItemDestructionResult } from "@shared/knowledge/KnowledgeItemDestruction";
import { KnowledgeRecipeRequirementGroup } from "@shared/knowledge/KnowledgeRecipeRequirementGroup";
import React, { useMemo, useState } from "react";
import { useKnowledgeNavigate } from "@renderer/stores/useKnowledgeNavigationStore";
import { KnowledgeQualityRequirementBadge } from "./KnowledgeQualityRequirementBadge";

const ACTION_KINDS = ["breakage", "disassembly", "salvage"] as const;

type Props = {
    actions: KnowledgeItemDestructionAction[];
    compactSources?: boolean;
};

export function KnowledgeItemDestructionView({ actions, compactSources = false }: Props): React.JSX.Element {
    const t = useTranslate();
    const groups = ACTION_KINDS.map((kind) => ({ kind, actions: actions.filter((action) => action.kind === kind) })).filter((group) => group.actions.length > 0);

    if (groups.length === 1) {
        const group = groups[0];
        return (
            <Stack gap="xs">
                <Text size="sm" fw={600}>
                    {t(`knowledge.destruction.${group.kind}` as never)}
                </Text>
                <GroupContent actions={group.actions} compactSources={compactSources} />
            </Stack>
        );
    }

    return (
        <Tabs defaultValue={groups[0].kind} variant="outline" keepMounted={false}>
            <Tabs.List>
                {groups.map((group) => (
                    <Tabs.Tab key={group.kind} value={group.kind}>
                        {t(`knowledge.destruction.${group.kind}` as never)}
                    </Tabs.Tab>
                ))}
            </Tabs.List>
            {groups.map((group) => (
                <Tabs.Panel key={group.kind} value={group.kind} pt="md">
                    <GroupContent actions={group.actions} compactSources={compactSources} />
                </Tabs.Panel>
            ))}
        </Tabs>
    );
}

function GroupContent({ actions, compactSources }: Pick<Props, "actions" | "compactSources">): React.JSX.Element {
    return compactSources ? <SourceList actions={actions} /> : <ActionList actions={actions} />;
}

function DependenciesNotice({ actions }: { actions: KnowledgeItemDestructionAction[] }): React.JSX.Element | null {
    const t = useTranslate();
    const dependencies = [...new Set(actions.flatMap((action) => action.dependencies))];
    if (dependencies.length === 0) return null;

    return (
        <Text size="xs" c="dimmed">
            {t("knowledge.destruction.depends")}: {dependencies.map((value) => t(`knowledge.destruction.dependency.${value}` as never)).join(", ")}.
        </Text>
    );
}

function ActionList({ actions }: { actions: KnowledgeItemDestructionAction[] }): React.JSX.Element {
    return (
        <Stack gap="md">
            <DependenciesNotice actions={actions} />
            {actions.map((action, index) => (
                <ActionCard key={`${action.kind}:${action.source?.key ?? index}`} action={action} />
            ))}
        </Stack>
    );
}

function ActionCard({ action }: { action: KnowledgeItemDestructionAction }): React.JSX.Element {
    const t = useTranslate();
    const qualities = action.requirements?.qualities ?? [];
    const tools = action.requirements?.tools ?? [];

    return (
        <Paper withBorder p="sm">
            <Stack gap="sm">
                <Group gap="lg" align="flex-start" wrap="wrap">
                    {(action.time !== undefined || action.timeNote) && (
                        <Stack gap={1}>
                            <Text size="xs" c="dimmed">
                                {t("knowledge.recipe.time")}
                            </Text>
                            <Text size="sm" fw={500}>
                                {action.time ?? action.timeNote}
                            </Text>
                        </Stack>
                    )}
                    {qualities.length > 0 && <RequirementSummary label={t("knowledge.recipe.qualities")} groups={qualities} quality />}
                    {tools.length > 0 && <RequirementSummary label={t("knowledge.recipe.tools")} groups={tools} />}
                </Group>

                <Stack gap={4}>
                    <Text size="xs" c="dimmed">
                        {t("knowledge.destruction.results")}
                    </Text>
                    {action.results.map((result, resultIndex) => (
                        <Result key={`${result.entity.key}:${resultIndex}`} result={result} />
                    ))}
                </Stack>
            </Stack>
        </Paper>
    );
}

function RequirementSummary({ label, groups, quality = false }: { label: string; groups: KnowledgeRecipeRequirementGroup[]; quality?: boolean }): React.JSX.Element {
    return (
        <Stack gap={1}>
            <Text size="xs" c="dimmed">
                {label}
            </Text>
            <Group gap={4} wrap="wrap">
                {groups.flatMap((group) =>
                    group.alternatives.map((alternative, index) => (
                        <React.Fragment key={`${group.key}:${alternative.entity.key}:${index}`}>
                            {index > 0 && (
                                <Text component="span" size="sm" c="dimmed">
                                    /
                                </Text>
                            )}

                            {quality ? (
                                <KnowledgeQualityRequirementBadge alternative={alternative} />
                            ) : (
                                <>
                                    <EntityLink entity={alternative.entity} />
                                    {formatRequirementAmount(alternative.metadata) !== null && (
                                        <Text component="span" size="xs" c="dimmed">
                                            {formatRequirementAmount(alternative.metadata)}
                                        </Text>
                                    )}
                                </>
                            )}
                        </React.Fragment>
                    ))
                )}
            </Group>
        </Stack>
    );
}

function formatRequirementAmount(metadata: Record<string, unknown>): string | null {
    const level = typeof metadata.level === "number" ? metadata.level : null;
    if (level !== null) return `${level}`;
    const count = typeof metadata.count === "number" ? metadata.count : null;
    return count !== null && count !== 1 ? `×${count}` : null;
}

type SourceSort = "name" | "amount" | "time";

function SourceList({ actions }: { actions: KnowledgeItemDestructionAction[] }): React.JSX.Element {
    const t = useTranslate();
    const [sort, setSort] = useState<SourceSort>("name");
    const sorted = useMemo(() => [...actions].sort(sourceComparator(sort)), [actions, sort]);

    return (
        <Stack gap="xs">
            <Group justify="space-between" align="center" wrap="wrap">
                <DependenciesNotice actions={actions} />
                <SegmentedControl
                    size="xs"
                    value={sort}
                    onChange={(value) => setSort(value as SourceSort)}
                    data={[
                        { value: "name", label: t("knowledge.destruction.sort.name") },
                        { value: "amount", label: t("knowledge.destruction.sort.amount") },
                        { value: "time", label: t("knowledge.destruction.sort.time") }
                    ]}
                />
            </Group>
            <Stack gap={3}>
                {sorted.map((action, index) => (
                    <SourceRow key={`${action.kind}:${action.source?.key ?? index}`} action={action} />
                ))}
            </Stack>
        </Stack>
    );
}

function sourceComparator(sort: SourceSort): (left: KnowledgeItemDestructionAction, right: KnowledgeItemDestructionAction) => number {
    const byName = (left: KnowledgeItemDestructionAction, right: KnowledgeItemDestructionAction): number => (left.source?.name ?? "").localeCompare(right.source?.name ?? "");

    if (sort === "amount") {
        return (left, right) => highlightedAmount(right) - highlightedAmount(left) || byName(left, right);
    }
    if (sort === "time") {
        return (left, right) => actionDuration(left) - actionDuration(right) || byName(left, right);
    }
    return byName;
}

function highlightedAmount(action: KnowledgeItemDestructionAction): number {
    return action.results.filter((result) => result.highlighted).reduce((total, result) => total + (result.count ?? result.countMax ?? result.countMin ?? 0), 0);
}

function actionDuration(action: KnowledgeItemDestructionAction): number {
    if (typeof action.time === "number") return action.time;
    if (typeof action.time !== "string") return Number.POSITIVE_INFINITY;

    const unitSeconds: Record<string, number> = {
        turn: 1,
        turns: 1,
        s: 1,
        sec: 1,
        second: 1,
        seconds: 1,
        m: 60,
        min: 60,
        minute: 60,
        minutes: 60,
        h: 3600,
        hour: 3600,
        hours: 3600,
        d: 86400,
        day: 86400,
        days: 86400
    };
    let seconds = 0;
    let matched = false;
    for (const match of action.time.matchAll(/(\d+(?:\.\d+)?)\s*([a-z]+)/gi)) {
        const multiplier = unitSeconds[match[2].toLowerCase()];
        if (multiplier === undefined) continue;
        seconds += Number(match[1]) * multiplier;
        matched = true;
    }
    return matched ? seconds : Number.POSITIVE_INFINITY;
}

function SourceRow({ action }: { action: KnowledgeItemDestructionAction }): React.JSX.Element {
    const t = useTranslate();
    const [opened, { open, close }] = useDisclosure(false);
    const highlighted = action.results.filter((result) => result.highlighted);
    const remainingCount = action.results.length - highlighted.length;

    return (
        <>
            <Group gap={4} wrap="wrap" align="baseline">
                {action.source && <EntityLink entity={action.source} />}
                <Text component="span" size="sm">
                    (
                </Text>
                {highlighted.map((result, index) => (
                    <React.Fragment key={`${result.entity.key}:${index}`}>
                        {index > 0 && (
                            <Text component="span" size="sm">
                                ,
                            </Text>
                        )}
                        <ResultSummary result={result} />
                    </React.Fragment>
                ))}
                {remainingCount > 0 && (
                    <>
                        {highlighted.length > 0 && (
                            <Text component="span" size="sm">
                                ,
                            </Text>
                        )}
                        <UnstyledButton onClick={open}>
                            <Text component="span" size="sm" c="blue">
                                +{remainingCount}
                            </Text>
                        </UnstyledButton>
                    </>
                )}
                <Text component="span" size="sm">
                    )
                </Text>
                {(action.time !== undefined || action.timeNote) && (
                    <Text component="span" size="sm" c="dimmed">
                        {t("knowledge.destruction.obtained.time", { time: action.time ?? action.timeNote })}
                    </Text>
                )}
            </Group>

            <Modal
                opened={opened}
                onClose={close}
                title={t("knowledge.destruction.results.title", {
                    action: t(`knowledge.destruction.${action.kind}` as never),
                    source: action.source?.name ?? ""
                })}
                size="lg"
            >
                <Stack gap="xs">
                    {action.results.map((result, index) => (
                        <Result key={`${result.entity.key}:${index}`} result={result} onNavigate={close} />
                    ))}
                </Stack>
            </Modal>
        </>
    );
}

function ResultSummary({ result }: { result: KnowledgeItemDestructionResult }): React.JSX.Element {
    return (
        <Text component="span" size="sm" fw={700}>
            {formatAmount(result)}
            {result.entity.name}
        </Text>
    );
}

function Result({ result, onNavigate }: { result: KnowledgeItemDestructionResult; onNavigate?: () => void }): React.JSX.Element {
    const amount = formatAmount(result, "×");
    return (
        <Group gap="xs" wrap="nowrap">
            <EntityLink entity={result.entity} fw={result.highlighted ? 700 : undefined} onNavigate={onNavigate} />
            {amount !== null && (
                <Badge size="sm" variant="light">
                    {amount}
                </Badge>
            )}
            {result.chance !== undefined && (
                <Text size="xs" c="dimmed">
                    {result.chance}%
                </Text>
            )}
            {result.note && (
                <Text size="xs" c="dimmed">
                    ({result.note})
                </Text>
            )}
        </Group>
    );
}

function formatAmount(result: KnowledgeItemDestructionResult, suffix = "× "): string | null {
    if (result.count !== undefined) return `${result.count}${suffix}`;
    if (result.countMin !== undefined && result.countMax !== undefined) return `${result.countMin}–${result.countMax}${suffix}`;
    return null;
}

function EntityLink({ entity, fw, onNavigate }: { entity: KnowledgeEntityReference; fw?: number; onNavigate?: () => void }): React.JSX.Element {
    const navigate = useKnowledgeNavigate();
    return entity.virtual ? (
        <Text size="sm" fw={fw}>
            {entity.name}
        </Text>
    ) : (
        <Anchor
            component="button"
            type="button"
            size="sm"
            fw={fw}
            onClick={() => {
                onNavigate?.();
                navigate(entity.key);
            }}
        >
            {entity.name}
        </Anchor>
    );
}
