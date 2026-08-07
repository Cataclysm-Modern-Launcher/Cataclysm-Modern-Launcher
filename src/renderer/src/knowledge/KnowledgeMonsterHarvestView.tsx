import { Anchor, Badge, Group, Stack, Tabs, Text } from "@mantine/core";
import React from "react";
import { KnowledgeMonsterHarvestEntry } from "@shared/knowledge/KnowledgeMonsterHarvest";
import { useKnowledgeNavigate } from "@renderer/stores/useKnowledgeNavigationStore";
import { useTranslate } from "@renderer/stores/useLocaleStore";

export function KnowledgeMonsterHarvestView({ entries }: { entries: KnowledgeMonsterHarvestEntry[] }): React.JSX.Element {
    const t = useTranslate();
    const butcher = entries.filter((entry) => !isDissectionEntry(entry));
    const dissect = entries.filter(isDissectionEntry);
    const defaultTab = butcher.length > 0 ? "butcher" : "dissect";

    return (
        <Tabs defaultValue={defaultTab} variant="outline" keepMounted={false}>
            <Tabs.List>
                {butcher.length > 0 && <Tabs.Tab value="butcher">{t("knowledge.monster.harvest.butcher", { count: butcher.length })}</Tabs.Tab>}
                {dissect.length > 0 && <Tabs.Tab value="dissect">{t("knowledge.monster.harvest.dissect", { count: dissect.length })}</Tabs.Tab>}
            </Tabs.List>
            {butcher.length > 0 && <Tabs.Panel value="butcher" pt="md"><HarvestEntries entries={butcher} /></Tabs.Panel>}
            {dissect.length > 0 && <Tabs.Panel value="dissect" pt="md"><HarvestEntries entries={dissect} /></Tabs.Panel>}
        </Tabs>
    );
}

function HarvestEntries({ entries }: { entries: KnowledgeMonsterHarvestEntry[] }): React.JSX.Element {
    const navigate = useKnowledgeNavigate();
    const t = useTranslate();
    return (
        <Stack gap="xs">
            {entries.map((entry, index) => (
                <Group key={`${entry.dropId}:${entry.type ?? "unknown"}:${index}`} justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                        {entry.drop === undefined ? (
                            <Text size="sm">{entry.dropId}</Text>
                        ) : (
                            <Anchor component="button" type="button" size="sm" onClick={() => navigate(entry.drop!.key)}>{entry.drop.name}</Anchor>
                        )}
                        {entry.type !== null && <Badge size="xs" variant="light">{entry.type}</Badge>}
                    </Group>
                    <Text size="xs" c="dimmed" ta="right">{formatYield(entry, t)}</Text>
                </Group>
            ))}
        </Stack>
    );
}

function isDissectionEntry(entry: KnowledgeMonsterHarvestEntry): boolean {
    return entry.type === "bionic" || entry.type === "bionic_group";
}

function formatYield(entry: KnowledgeMonsterHarvestEntry, t: ReturnType<typeof useTranslate>): string {
    const parts: string[] = [];
    if (entry.baseNum !== undefined) parts.push(t("knowledge.monster.harvest.base", { value: formatNumberOrRange(entry.baseNum) }));
    if (entry.scaleNum !== undefined) parts.push(t("knowledge.monster.harvest.scale", { value: formatNumberOrRange(entry.scaleNum) }));
    if (entry.max !== undefined) parts.push(t("knowledge.monster.harvest.max", { value: entry.max }));
    if (entry.massRatio !== undefined) parts.push(t("knowledge.monster.harvest.mass.ratio", { value: entry.massRatio }));
    return parts.join(" · ");
}

function formatNumberOrRange(value: number | [number, number]): string {
    return Array.isArray(value) ? `${value[0]}–${value[1]}` : String(value);
}
