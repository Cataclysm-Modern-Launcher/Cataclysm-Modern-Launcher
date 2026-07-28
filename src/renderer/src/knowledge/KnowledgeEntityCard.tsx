import { Badge, Group, Paper, Text } from "@mantine/core";
import { KnowledgeEntitySummary } from "@shared/knowledge/KnowledgeEntitySummary";
import React from "react";

export type KnowledgeEntityCardProps = {
    entity: KnowledgeEntitySummary;
    onOpen: (key: string) => void;
};

export function KnowledgeEntityCard({ entity, onOpen }: KnowledgeEntityCardProps): React.JSX.Element {
    return (
        <Paper withBorder p="sm" onClick={() => onOpen(entity.key)} style={{ cursor: "pointer" }}>
            <Text fw={600} lineClamp={1}>
                {entity.name}
            </Text>
            <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed" truncate>
                    {entity.id}
                </Text>
                <Badge size="xs" variant="outline">
                    {entity.jsonType}
                </Badge>
                <Badge size="xs" variant="light">
                    {entity.sourceModId}
                </Badge>
            </Group>
        </Paper>
    );
}
