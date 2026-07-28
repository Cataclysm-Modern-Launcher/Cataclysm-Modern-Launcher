import { KnowledgeRecipe } from "@shared/knowledge/KnowledgeRecipe";
import React, { useState } from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { deduplicateQualities } from "@renderer/knowledge/utils/deduplicateQualities";
import { useKnownProficiency } from "@renderer/knowledge/stores/useKnownProficiency";
import { useShallow } from "zustand/react/shallow";
import { formatRecipeTime } from "@renderer/knowledge/utils/formatRecipeTime";
import { Badge, Group, SimpleGrid, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { toNumberFixed2 } from "@renderer/utils/toNumberFixed2";
import { KnowledgeItemRecipeSection } from "@renderer/knowledge/KnowledgeItemRecipeSection";
import { KnowledgeItemLabeledRequirement } from "@renderer/knowledge/KnowledgeItemLabeledRequirement";
import { KnowledgeItemRequirementGroups } from "@renderer/knowledge/KnowledgeItemRequirementGroups";
import { KnowledgeItemQualityRequirements } from "@renderer/knowledge/KnowledgeItemQualityRequirements";

export function KnowledgeItemRecipeDetails({ recipe, index, count, onNavigate }: { recipe: KnowledgeRecipe; index: number; count: number; onNavigate: (itemId: string) => void }): React.JSX.Element {
    const t = useTranslate();
    const [, refreshProficiencies] = useState(0);

    const components = [...recipe.components, ...recipe.resolvedRequirements.flatMap((requirement) => requirement.components)];
    const tools = [...recipe.tools, ...recipe.resolvedRequirements.flatMap((requirement) => requirement.tools)];
    const qualities = deduplicateQualities([...recipe.qualities, ...recipe.resolvedRequirements.flatMap((requirement) => requirement.qualities)]);
    const unresolvedRequirements = recipe.using.filter((reference) => !recipe.resolvedRequirements.some((resolved) => resolved.requirementId === reference.requirementId));

    const { hasProficiency, toggleProficiency } = useKnownProficiency(
        useShallow((state) => ({
            hasProficiency: state.hasProficiency,
            toggleProficiency: state.toggleProficiency
        }))
    );

    const timeMultiplier = recipe.proficiencies.reduce((result, proficiency) => {
        if (hasProficiency(proficiency.proficiencyId) || proficiency.required || proficiency.timeMultiplier === null || proficiency.timeMultiplier <= 0) return result;
        return result * proficiency.timeMultiplier;
    }, 1);
    const displayedTime = formatRecipeTime(recipe.time, timeMultiplier);

    const handleToggleProficiency = (id: string): void => {
        toggleProficiency(id);
        refreshProficiencies((value) => value + 1);
    };

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-start">
                <Stack gap={4}>
                    {count > 1 && <Text fw={600}>{t("knowledge.recipe.number", { index, count })}</Text>}
                    <Group gap="xs">
                        <Badge variant="light">{recipe.sourceModId}</Badge>
                        {recipe.resultCount > 1 && <Badge variant="outline">×{recipe.resultCount}</Badge>}
                    </Group>
                </Stack>
                <Group gap="xs" justify="flex-end">
                    {recipe.skillUsed && <Badge variant="outline">{t("knowledge.recipe.primary.skill", { skill: recipe.skillUsed, level: recipe.difficulty ?? 0 })}</Badge>}
                    {displayedTime !== null && (
                        <Tooltip label={timeMultiplier > 1 ? t("knowledge.recipe.time.multiplier", { value: toNumberFixed2(timeMultiplier) }) : undefined}>
                            <Badge variant="outline">{t("knowledge.recipe.time", { time: displayedTime })}</Badge>
                        </Tooltip>
                    )}
                    {recipe.activityLevel && <Badge variant="outline">{recipe.activityLevel}</Badge>}
                </Group>
            </Group>

            {(recipe.proficiencies.length > 0 || recipe.requiredSkills.length > 0) && (
                <KnowledgeItemRecipeSection title={t("knowledge.recipe.skills.and.proficiencies")}>
                    <Stack gap="sm">
                        {recipe.requiredSkills.length > 0 && (
                            <KnowledgeItemLabeledRequirement label={t("knowledge.recipe.additional.skills")}>
                                <Group gap="xs">
                                    {recipe.requiredSkills.map((skill) => (
                                        <Badge key={skill.skillId} variant="light">
                                            {skill.skillId} {skill.level}
                                        </Badge>
                                    ))}
                                </Group>
                            </KnowledgeItemLabeledRequirement>
                        )}
                        {recipe.proficiencies.length > 0 && (
                            <KnowledgeItemLabeledRequirement label={t("knowledge.recipe.proficiencies")}>
                                <Stack gap={6}>
                                    {recipe.proficiencies.map((proficiency) => {
                                        const known = hasProficiency(proficiency.proficiencyId);
                                        return (
                                            <Group key={proficiency.proficiencyId} gap="xs" wrap="nowrap">
                                                <Tooltip label={t(known ? "knowledge.recipe.proficiency.known" : "knowledge.recipe.proficiency.unknown")}>
                                                    <UnstyledButton onClick={() => handleToggleProficiency(proficiency.proficiencyId)}>
                                                        <Badge color={known ? "green" : proficiency.required ? "red" : "blue"} variant={known ? "filled" : "outline"}>
                                                            {proficiency.proficiencyName}
                                                        </Badge>
                                                    </UnstyledButton>
                                                </Tooltip>
                                                {proficiency.required && (
                                                    <Text size="xs" fw={600}>
                                                        {t("knowledge.recipe.proficiency.required")}
                                                    </Text>
                                                )}
                                                {proficiency.timeMultiplier !== null && (
                                                    <Text size="xs" c="dimmed">
                                                        {t("knowledge.recipe.proficiency.time", { value: proficiency.timeMultiplier })}
                                                    </Text>
                                                )}
                                                {proficiency.skillPenalty !== null && (
                                                    <Text size="xs" c="dimmed">
                                                        {t("knowledge.recipe.proficiency.skill", { value: proficiency.skillPenalty })}
                                                    </Text>
                                                )}
                                            </Group>
                                        );
                                    })}
                                </Stack>
                            </KnowledgeItemLabeledRequirement>
                        )}
                    </Stack>
                </KnowledgeItemRecipeSection>
            )}

            {(components.length > 0 || tools.length > 0 || qualities.length > 0) && (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {components.length > 0 && (
                        <KnowledgeItemRecipeSection title={t("knowledge.recipe.components")}>
                            <KnowledgeItemRequirementGroups groups={components} kind="component" onNavigate={onNavigate} />
                        </KnowledgeItemRecipeSection>
                    )}
                    {(tools.length > 0 || qualities.length > 0) && (
                        <KnowledgeItemRecipeSection title={t("knowledge.recipe.tools")}>
                            <Stack gap="xs">
                                <KnowledgeItemRequirementGroups groups={tools} kind="tool" onNavigate={onNavigate} />
                                <KnowledgeItemQualityRequirements qualities={qualities} onNavigate={onNavigate} />
                            </Stack>
                        </KnowledgeItemRecipeSection>
                    )}
                </SimpleGrid>
            )}

            {unresolvedRequirements.length > 0 && (
                <KnowledgeItemRecipeSection title={t("knowledge.recipe.requirements.unresolved")}>
                    <Stack gap={4}>
                        {unresolvedRequirements.map((entry) => (
                            <Text key={entry.requirementId} size="sm">
                                {t("knowledge.recipe.requirement", { requirement: entry.requirementId, multiplier: entry.multiplier })}
                            </Text>
                        ))}
                    </Stack>
                </KnowledgeItemRecipeSection>
            )}

            {recipe.byproducts.length > 0 && (
                <KnowledgeItemRecipeSection title={t("knowledge.recipe.byproducts")}>
                    <Stack gap={4}>
                        {recipe.byproducts.map((entry) => (
                            <UnstyledButton key={entry.itemId} onClick={() => onNavigate(entry.itemId)}>
                                <Text size="sm">
                                    ×{entry.count} {entry.itemName}
                                </Text>
                            </UnstyledButton>
                        ))}
                    </Stack>
                </KnowledgeItemRecipeSection>
            )}
        </Stack>
    );
}
