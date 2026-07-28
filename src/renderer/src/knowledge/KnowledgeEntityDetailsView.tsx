import { Badge, Code, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import React from "react";

export function KnowledgeEntityDetailsView({ entity }: { entity: KnowledgeEntityDetails }): React.JSX.Element {
    return (
        <Stack gap="md">
            <div>
                <Title order={2}>{entity.name}</Title>
                <Group gap="xs" mt="xs">
                    <Badge variant="outline">{entity.jsonType}</Badge>
                    <Badge variant="light">{entity.sourceModId}</Badge>
                    {entity.abstract && <Badge color="gray">abstract</Badge>}
                </Group>
            </div>
            <Paper withBorder p="md">
                <Stack gap="xs">
                    <Text size="sm">
                        <b>ID:</b> {entity.id}
                    </Text>
                    <Text size="sm">
                        <b>Source:</b> {entity.sourceFile}
                    </Text>
                    {entity.description !== null && <Text style={{ whiteSpace: "pre-wrap" }}>{entity.description}</Text>}
                </Stack>
            </Paper>
            <Code block style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {JSON.stringify(entity.raw, null, 2)}
            </Code>
        </Stack>
    );
}
