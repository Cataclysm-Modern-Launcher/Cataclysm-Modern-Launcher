import { Anchor, Group, Stack, Text } from "@mantine/core";
import React from "react";
import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { useKnowledgeNavigate } from "@renderer/stores/useKnowledgeNavigationStore";
import { useTranslate } from "@renderer/stores/useLocaleStore";

export function KnowledgeMonsterDropsView({ drops }: { drops: KnowledgeEntityRelation[] }): React.JSX.Element {
    const navigate = useKnowledgeNavigate();
    const t = useTranslate();
    return (
        <Stack gap="xs">
            {drops.map((drop, index) => (
                <Group key={`${drop.entity.key}:${index}`} justify="space-between" wrap="nowrap">
                    <Anchor component="button" type="button" size="sm" onClick={() => navigate(drop.entity.key)}>{drop.entity.name}</Anchor>
                    <Text size="xs" c="dimmed">{formatDropMetadata(drop.metadata, t)}</Text>
                </Group>
            ))}
        </Stack>
    );
}

function formatDropMetadata(metadata: Record<string, unknown>, t: ReturnType<typeof useTranslate>): string {
    const chance = typeof metadata.chance === "number" ? `${formatPercent(metadata.chance)}%` : t("knowledge.monster.drop.unknown.chance");
    const count = formatRange(metadata.count);
    const charges = formatRange(metadata.charges);
    const details = [count === null ? null : t("knowledge.monster.drop.count", { value: count }), charges === null ? null : t("knowledge.monster.drop.charges", { value: charges })].filter(Boolean);
    return [chance, ...details].join(" · ");
}

function formatPercent(value: number): string {
    const percent = value * 100;
    return percent < 0.1 && percent > 0 ? percent.toFixed(2) : percent < 1 ? percent.toFixed(1) : percent.toFixed(0);
}

function formatRange(value: unknown): string | null {
    if (typeof value === "number") return String(value);
    if (Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number") return `${value[0]}–${value[1]}`;
    return null;
}
