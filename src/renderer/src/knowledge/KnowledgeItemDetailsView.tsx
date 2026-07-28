import { KnowledgeItemDetails } from "@shared/knowledge/KnowledgeItemDetails";
import React from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { ActionIcon, Badge, Box, Group, Paper, Stack, Text, Title, Tooltip } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { KnowledgeItemRecipeBrowser } from "@renderer/knowledge/KnowledgeItemRecipeBrowser";

export function KnowledgeItemDetailsView({ item, onNavigate, canGoBack, onBack }: { item: KnowledgeItemDetails; onNavigate: (itemId: string) => void; canGoBack: boolean; onBack: () => void }): React.JSX.Element {
    const t = useTranslate();
    return (
        <Stack maw={1000} mx="auto" pb="xl">
            <Group align="flex-start" wrap="nowrap">
                <Tooltip label={t("knowledge.navigation.back")}>
                    <ActionIcon mt={6} variant="subtle" disabled={!canGoBack} onClick={onBack}>
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                </Tooltip>
                <Box miw={0}>
                    <Title>{item.name}</Title>
                    <Group>
                        <Text c="dimmed">{item.id}</Text>
                        <Badge>{item.sourceModId}</Badge>
                        <Badge variant="outline">{item.type}</Badge>
                    </Group>
                </Box>
            </Group>
            {item.description && <Text>{item.description}</Text>}
            <Title order={3}>{t("knowledge.crafting.title")}</Title>
            {item.recipes.length === 0 ? <Text c="dimmed">{t("knowledge.crafting.empty")}</Text> : <KnowledgeItemRecipeBrowser recipes={item.recipes} onNavigate={onNavigate} />}
            <Title order={3}>{t("knowledge.used.in.title")}</Title>
            {item.usedIn.length === 0 ? (
                <Text c="dimmed">{t("knowledge.used.in.empty")}</Text>
            ) : (
                <Stack gap={4}>
                    {item.usedIn.map((usage) => (
                        <Paper key={usage.recipeKey} withBorder p="sm" onClick={() => onNavigate(usage.resultId)} style={{ cursor: "pointer" }}>
                            <Text>{usage.resultName}</Text>
                            <Text size="xs" c="dimmed">
                                {usage.resultId}
                            </Text>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}
