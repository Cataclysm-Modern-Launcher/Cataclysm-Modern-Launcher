import { Badge, Group, Paper, Text } from "@mantine/core";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import React from "react";
import { useKnowledgeNavigate } from "@renderer/stores/useKnowledgeNavigationStore";

export function KnowledgeEntityCard({ entity }: { entity: KnowledgeEntitySummary }): React.JSX.Element {
    const navigate = useKnowledgeNavigate();
    return (
        <Paper withBorder p="sm" onClick={() => navigate(entity.key)} style={{ cursor: "pointer" }}>
            <Group justify="space-between" wrap="nowrap">
                <Text size="sm" fw={500} truncate>
                    {entity.name}
                </Text>
                <Badge size="xs" variant="light">
                    {entity.jsonType}
                </Badge>
            </Group>
        </Paper>
    );
}
