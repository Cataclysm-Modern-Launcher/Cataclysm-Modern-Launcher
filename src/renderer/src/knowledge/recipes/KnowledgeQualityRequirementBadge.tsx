import { KnowledgeRecipeRequirementAlternative } from "@shared/knowledge/KnowledgeRecipeRequirementAlternative";
import React, { useEffect, useState } from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { useDisclosure } from "@mantine/hooks";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import { readNumber } from "@shared/utils/readNumber";
import { Anchor, Badge, Button, Group, Loader, Modal, Stack, Text } from "@mantine/core";
import { IconTool } from "@tabler/icons-react";

export function KnowledgeQualityRequirementBadge({ alternative, onOpen }: { alternative: KnowledgeRecipeRequirementAlternative; onOpen: (key: string) => void }): React.JSX.Element {
    const t = useTranslate();
    const [opened, { open, close }] = useDisclosure(false);
    const [relations, setRelations] = useState<KnowledgeEntityRelations | null>(null);
    const level = readNumber(alternative.metadata.level) ?? 1;
    const amount = readNumber(alternative.metadata.count) ?? 1;

    useEffect(() => {
        if (!opened || relations !== null) return;
        void window.api.knowledge.getEntityRelations(alternative.entity.key, true).then(setRelations);
    }, [alternative.entity.key, opened, relations]);

    const providers = (relations?.incoming ?? [])
        .filter((relation) => relation.kind === "provides-quality" && (readNumber(relation.metadata.level) ?? 1) >= level)
        .sort((left, right) => left.entity.name.localeCompare(right.entity.name));
    const navigate = (key: string): void => {
        close();
        onOpen(key);
    };

    return (
        <>
            <Badge component="button" type="button" variant="outline" size="md" style={{ cursor: "pointer", textTransform: "none" }} onClick={open}>
                <Group gap={4} wrap="nowrap">
                    <IconTool size={15} stroke={1} />
                    {amount > 1 && <Text size="xs">{amount}×</Text>}
                    <Text size="xs">
                        {alternative.entity.name} {level}
                    </Text>
                </Group>
            </Badge>
            <Modal opened={opened} onClose={close} title={t("knowledge.recipe.quality.providers.title", { quality: alternative.entity.name, level })} size="lg">
                <Stack gap="md">
                    <Anchor component="button" type="button" w="fit-content" onClick={() => navigate(alternative.entity.key)}>
                        {t("knowledge.recipe.quality.open.page")}
                    </Anchor>
                    {relations === null ? (
                        <Loader size="sm" />
                    ) : providers.length === 0 ? (
                        <Text size="sm" c="dimmed">
                            {t("knowledge.recipe.quality.providers.none")}
                        </Text>
                    ) : (
                        <Stack gap={4}>
                            {providers.map((provider) => (
                                <Button key={provider.entity.key} variant="subtle" justify="space-between" onClick={() => navigate(provider.entity.key)}>
                                    <Text size="sm">{provider.entity.name}</Text>
                                    <Badge variant="light">{readNumber(provider.metadata.level) ?? 1}</Badge>
                                </Button>
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Modal>
        </>
    );
}
