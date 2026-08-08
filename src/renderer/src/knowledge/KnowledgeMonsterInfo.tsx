import { Badge, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import React from "react";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { useTranslate } from "@renderer/stores/useLocaleStore";

export function KnowledgeMonsterInfo({ entity }: { entity: KnowledgeEntityDetails }): React.JSX.Element {
    const t = useTranslate();
    const raw = entity.raw;
    const stats = [
        [t("knowledge.monster.hp"), readScalar(raw.hp)],
        [t("knowledge.monster.speed"), readScalar(raw.speed)],
        [t("knowledge.monster.dodge"), readScalar(raw.dodge)],
        [t("knowledge.monster.attack.cost"), readScalar(raw.attack_cost)],
        [t("knowledge.monster.melee.skill"), readScalar(raw.melee_skill)],
        [t("knowledge.monster.melee.dice"), formatDice(raw.melee_dice, raw.melee_dice_sides)],
        [t("knowledge.monster.vision.day"), readScalar(raw.vision_day)],
        [t("knowledge.monster.vision.night"), readScalar(raw.vision_night)],
        [t("knowledge.monster.aggression"), readScalar(raw.aggression)],
        [t("knowledge.monster.morale"), readScalar(raw.morale)]
    ].filter((entry): entry is [string, string] => entry[1] !== null);
    const species = readStringArray(raw.species);
    const flags = readStringArray(raw.flags);

    return (
        <Stack gap="md">
            {entity.description !== null && (
                <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                    {entity.description}
                </Text>
            )}
            {stats.length > 0 && (
                <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
                    {stats.map(([label, value]) => (
                        <Stack key={label} gap={1}>
                            <Text size="xs" c="dimmed">
                                {label}
                            </Text>
                            <Text size="sm" fw={500}>
                                {value}
                            </Text>
                        </Stack>
                    ))}
                </SimpleGrid>
            )}
            {species.length > 0 && <BadgeList label={t("knowledge.monster.species")} values={species} />}
            {flags.length > 0 && <BadgeList label={t("knowledge.monster.flags")} values={flags} />}
        </Stack>
    );
}

function BadgeList({ label, values }: { label: string; values: string[] }): React.JSX.Element {
    return (
        <Stack gap={4}>
            <Text size="xs" c="dimmed">
                {label}
            </Text>
            <Group gap={6} wrap="wrap">
                {values.map((value) => (
                    <Badge key={value} size="sm" variant="light">
                        {value}
                    </Badge>
                ))}
            </Group>
        </Stack>
    );
}

function readScalar(value: unknown): string | null {
    return typeof value === "number" || typeof value === "string" ? String(value) : null;
}

function readStringArray(value: unknown): string[] {
    if (typeof value === "string") return [value];
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function formatDice(count: unknown, sides: unknown): string | null {
    if (typeof count !== "number" || typeof sides !== "number") return null;
    return `${count}d${sides}`;
}
