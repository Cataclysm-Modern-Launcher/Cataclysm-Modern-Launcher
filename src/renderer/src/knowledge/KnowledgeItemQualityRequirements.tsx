import { KnowledgeQualityRequirement } from "@shared/knowledge/KnowledgeQualityRequirement";
import React from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { ActionIcon, Badge, Group, Menu, Stack, Text, Tooltip } from "@mantine/core";
import { IconTool } from "@tabler/icons-react";

export function KnowledgeItemQualityRequirements({ qualities, onNavigate }: { qualities: KnowledgeQualityRequirement[]; onNavigate: (itemId: string) => void }): React.JSX.Element {
    const t = useTranslate();
    return (
        <Stack gap={6}>
            {qualities.map((quality) => (
                <Group key={`${quality.qualityId}:${quality.level}`} gap="xs" wrap="nowrap">
                    <Badge variant="outline" color="cyan">
                        {t("knowledge.recipe.quality.badge")}
                    </Badge>
                    <Tooltip label={quality.qualityId} openDelay={350}>
                        <Text size="sm" truncate>
                            {t("knowledge.recipe.quality", { quality: quality.qualityName, level: quality.level })}
                        </Text>
                    </Tooltip>
                    {quality.providers.length > 0 && (
                        <Menu position="bottom-end" withinPortal shadow="md">
                            <Menu.Target>
                                <Tooltip label={t("knowledge.recipe.quality.providers")}>
                                    <ActionIcon size="sm" variant="subtle">
                                        <IconTool size={14} />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown mah={360} style={{ overflowY: "auto" }}>
                                <Menu.Label>{t("knowledge.recipe.quality.providers.count", { count: quality.providers.length })}</Menu.Label>
                                {quality.providers.map((provider) => (
                                    <Menu.Item key={provider.itemId} onClick={() => onNavigate(provider.itemId)}>
                                        <Group justify="space-between" wrap="nowrap">
                                            <Text size="sm" truncate maw={420}>
                                                {provider.itemName}
                                            </Text>
                                            <Badge size="xs" variant="light">
                                                {provider.level}
                                            </Badge>
                                        </Group>
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>
                    )}
                </Group>
            ))}
        </Stack>
    );
}
