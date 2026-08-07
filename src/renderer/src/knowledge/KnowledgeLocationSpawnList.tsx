import { Anchor, Group, Paper, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { useKnowledgeNavigate } from "@renderer/stores/useKnowledgeNavigationStore";
import { KnowledgeLocationSpawn } from "@shared/knowledge/KnowledgeLocation";
import React, { useMemo, useState } from "react";

export function KnowledgeLocationSpawnList({ entries, hint }: { entries: KnowledgeLocationSpawn[]; hint?: string }): React.JSX.Element {
    const t = useTranslate();
    const navigate = useKnowledgeNavigate();
    const [query, setQuery] = useState("");
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredEntries = useMemo(
        () => (normalizedQuery.length === 0 ? entries : entries.filter((entry) => entry.entity.name.toLocaleLowerCase().includes(normalizedQuery) || entry.entity.id.toLocaleLowerCase().includes(normalizedQuery))),
        [entries, normalizedQuery]
    );

    return (
        <Stack gap="xs">
            {entries.length > 10 && (
                <TextInput value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder={t("knowledge.location.results.search")} leftSection={<IconSearch size={16} />} size="sm" />
            )}

            {hint && (
                <Text size="xs" c="dimmed">
                    {hint}
                </Text>
            )}

            {filteredEntries.map((entry) => (
                <Paper key={entry.entity.key} withBorder px="sm" py={7}>
                    <Group justify="space-between" wrap="nowrap">
                        <Anchor component="button" type="button" size="sm" onClick={() => navigate(entry.entity.key)}>
                            {entry.entity.name}
                        </Anchor>
                        {entry.approximate ? (
                            <Tooltip label={t("knowledge.location.chance.approximate.tooltip")}>
                                <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap", borderBottom: "1px dotted currentColor", cursor: "help" }}>
                                    {t("knowledge.location.chance", { chance: formatChance(entry.chance) })}
                                </Text>
                            </Tooltip>
                        ) : (
                            <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                                {t("knowledge.location.chance", { chance: formatChance(entry.chance) })}
                            </Text>
                        )}
                    </Group>
                </Paper>
            ))}

            {filteredEntries.length === 0 && (
                <Text size="sm" c="dimmed">
                    {t("knowledge.location.results.empty")}
                </Text>
            )}
        </Stack>
    );
}

function formatChance(chance: number): string {
    const percent = chance * 100;
    if (percent >= 10) return percent.toFixed(percent % 1 === 0 ? 0 : 1);
    if (percent >= 1) return percent.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return percent.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
