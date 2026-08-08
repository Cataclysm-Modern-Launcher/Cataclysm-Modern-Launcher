import { Badge, Group, Paper, Stack, Text } from "@mantine/core";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import React from "react";
import { useKnowledgeNavigate } from "@renderer/stores/useKnowledgeNavigationStore";
import { useTranslate } from "@renderer/stores/useLocaleStore";

export function KnowledgeEntityCard({ entity }: { entity: KnowledgeEntitySummary }): React.JSX.Element {
    const navigate = useKnowledgeNavigate();
    const t = useTranslate();
    return (
        <Paper withBorder p="sm" onClick={() => navigate(entity.key)} style={{ cursor: "pointer" }}>
            <Group justify="space-between" wrap="nowrap">
                <Stack gap={1} style={{ minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate>
                        {entity.name}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                        {entity.id}
                        {entity.variantCount !== undefined && entity.variantCount > 1 ? ` · ${t("knowledge.location.variants.count", { count: entity.variantCount })}` : ""}
                    </Text>
                </Stack>
                <Badge size="xs" variant="light">
                    {entity.jsonType === "LOCATION" ? t("knowledge.location.type") : entity.jsonType}
                </Badge>
            </Group>
        </Paper>
    );
}
