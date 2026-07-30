import { Badge, Box, Code, Divider, Group, Paper, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import React from "react";
import { readString } from "@shared/utils/readString";
import { readNumber } from "@shared/utils/readNumber";
import { RelationLink } from "@renderer/knowledge/RelationLink";
import { RecipeLearningSummary } from "@renderer/knowledge/recipe/RecipeLearningSummary";
import { SummaryValue } from "@renderer/knowledge/SummaryValue";

type Props = {
    recipe: KnowledgeEntityRelation;
    entity: KnowledgeEntityDetails | undefined;
    relations: KnowledgeEntityRelations | undefined;
    relatedRelations: Record<string, KnowledgeEntityRelations>;
    onOpen: (key: string) => void;
};

export function KnowledgeRecipeCard({ recipe, entity, relations, relatedRelations, onOpen }: Props): React.JSX.Element {
    const t = useTranslate();
    const expanded = expandRequirements(relations?.outgoing ?? [], relatedRelations);
    const components = expanded.filter((relation) => relation.kind === "uses-component");
    const recovered = expanded.filter((relation) => relation.kind === "recovers-component");
    const toolsAndQualities = expanded.filter((relation) => relation.kind === "uses-tool" || relation.kind === "requires-quality");
    const skills = expanded.filter((relation) => relation.kind === "requires-skill");
    const proficiencies = expanded.filter((relation) => relation.kind === "requires-proficiency");
    const books = expanded.filter((relation) => relation.kind === "learned-from");
    const raw = entity?.raw;
    const primarySkill = skills.find((relation) => relation.metadata.primary === true);
    const secondarySkills = skills.filter((relation) => relation !== primarySkill);

    return (
        <Paper withBorder p="md">
            <Stack gap="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="md">
                        <Text fw={600}>{getRecipeTitle(recipe, raw, t)}</Text>
                        <Code fz={10} c="dimmed">
                            {recipe.entity.id}
                        </Code>
                    </Group>

                    <Badge variant="light">{recipe.entity.sourceModId}</Badge>
                </Group>

                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                    <SummaryValue label={t("knowledge.recipe.primary.skill")} value={primarySkill === undefined ? t("knowledge.recipe.none") : formatSkill(primarySkill)} />
                    <SummaryValue label={t("knowledge.recipe.time")} value={readString(raw?.time) ?? t("knowledge.recipe.unknown")} />
                    <SummaryValue label={t("knowledge.recipe.activity")} value={formatActivity(readString(raw?.activity_level), t)} />
                    <RecipeLearningSummary books={books} autoLearn={raw?.autolearn} onOpen={onOpen} />
                </SimpleGrid>

                {secondarySkills.length > 0 && <RequirementSection label={t("knowledge.recipe.skills")} relations={secondarySkills} onOpen={onOpen} />}

                {proficiencies.length > 0 && <RequirementSection label={t("knowledge.recipe.proficiencies")} relations={proficiencies} onOpen={onOpen} />}

                {toolsAndQualities.length > 0 && <RequirementSection label={t("knowledge.recipe.required.tools.qualities")} relations={toolsAndQualities} onOpen={onOpen} />}

                {components.length > 0 && <RequirementSection label={t("knowledge.recipe.components")} relations={components} onOpen={onOpen} />}

                {recovered.length > 0 && <RequirementSection label={t("knowledge.recipe.disassembly.result")} relations={recovered} onOpen={onOpen} />}
            </Stack>
        </Paper>
    );
}

function RequirementSection({ label, relations, onOpen }: { label: string; relations: KnowledgeEntityRelation[]; onOpen: (key: string) => void }): React.JSX.Element {
    const groups = groupAlternatives(relations);
    return (
        <Stack gap={6}>
            <Divider label={label} labelPosition="left" />
            <Stack gap={6}>
                {groups.map((group) => (
                    <AlternativeGroup key={group.key} relations={group.relations} onOpen={onOpen} />
                ))}
            </Stack>
        </Stack>
    );
}

function AlternativeGroup({ relations, onOpen }: { relations: KnowledgeEntityRelation[]; onOpen: (key: string) => void }): React.JSX.Element {
    const t = useTranslate();
    const [opened, { toggle }] = useDisclosure(false);
    const collapsible = relations.length > 3;

    return (
        <Paper withBorder p="xs" radius="sm">
            <Stack gap={4}>
                <Box style={collapsible && !opened ? { maxHeight: "1.55em", overflow: "hidden" } : undefined}>
                    <Group gap={6} align="baseline" wrap="wrap">
                        {relations.map((relation, index) => (
                            <React.Fragment key={`${relation.kind}:${relation.entity.key}:${index}`}>
                                {index > 0 && (
                                    <Text size="xs" c="dimmed" fw={600}>
                                        {t("knowledge.recipe.or")}
                                    </Text>
                                )}
                                <RelationLink relation={relation} onOpen={onOpen} />
                            </React.Fragment>
                        ))}
                    </Group>
                </Box>
                {collapsible && (
                    <UnstyledButton onClick={toggle} w="fit-content">
                        <Text size="xs" c="dimmed" td="underline">
                            {opened ? t("knowledge.recipe.collapse") : t("knowledge.recipe.expand.alternatives", { count: relations.length })}
                        </Text>
                    </UnstyledButton>
                )}
            </Stack>
        </Paper>
    );
}

function groupAlternatives(relations: KnowledgeEntityRelation[]): { key: string; relations: KnowledgeEntityRelation[] }[] {
    const groups = new Map<string, KnowledgeEntityRelation[]>();
    relations.forEach((relation, index) => {
        const groupKey = readString(relation.metadata.groupKey);
        const key = groupKey ?? `single:${relation.kind}:${index}`;
        const current = groups.get(key) ?? [];
        current.push(relation);
        groups.set(key, current);
    });
    return [...groups.entries()].map(([key, value]) => ({
        key,
        relations: value.sort((a, b) => (readNumber(a.metadata.alternativeIndex) ?? 0) - (readNumber(b.metadata.alternativeIndex) ?? 0))
    }));
}

function expandRequirements(relations: KnowledgeEntityRelation[], relatedRelations: Record<string, KnowledgeEntityRelations>): KnowledgeEntityRelation[] {
    const result = relations.filter((relation) => relation.kind !== "uses-requirement");

    const visit = (requirement: KnowledgeEntityRelation, multiplier: number, groupPath: string, visited: Set<string>): void => {
        if (visited.has(requirement.entity.key)) return;
        const nested = relatedRelations[requirement.entity.key]?.outgoing ?? [];
        const nextVisited = new Set(visited).add(requirement.entity.key);

        nested.forEach((relation, relationIndex) => {
            const localGroup = readString(relation.metadata.groupKey) ?? `${relation.kind}:${relationIndex}`;
            const nestedPath = `${groupPath}/${localGroup}`;
            if (relation.kind === "uses-requirement") {
                const nestedMultiplier = readNumber(relation.metadata.multiplier) ?? readNumber(relation.metadata.count) ?? 1;
                visit(relation, multiplier * nestedMultiplier, nestedPath, nextVisited);
                return;
            }
            if (!isDisplayRequirement(relation)) return;
            const count = readNumber(relation.metadata.count);
            result.push({
                ...relation,
                metadata: {
                    ...relation.metadata,
                    groupKey: nestedPath,
                    count: count === null || relation.kind === "requires-quality" ? relation.metadata.count : count * multiplier
                }
            });
        });
    };

    relations
        .filter((relation) => relation.kind === "uses-requirement")
        .forEach((requirement, index) => {
            const rootGroup = readString(requirement.metadata.groupKey) ?? `using:${index}`;
            visit(requirement, readNumber(requirement.metadata.multiplier) ?? readNumber(requirement.metadata.count) ?? 1, `${rootGroup}:${requirement.entity.key}`, new Set());
        });

    return result;
}

function isDisplayRequirement(relation: KnowledgeEntityRelation): boolean {
    return (
        relation.kind === "uses-component" ||
        relation.kind === "uses-tool" ||
        relation.kind === "requires-quality" ||
        relation.kind === "requires-skill" ||
        relation.kind === "requires-proficiency" ||
        relation.kind === "learned-from" ||
        relation.kind === "recovers-component"
    );
}

function getRecipeTitle(recipe: KnowledgeEntityRelation, raw: Record<string, unknown> | undefined, t: ReturnType<typeof useTranslate>): string {
    if (recipe.entity.jsonType === "uncraft") return t("knowledge.recipe.disassembly");
    const suffix = readString(raw?.id_suffix);
    return suffix === null ? t("knowledge.recipe.craft") : t("knowledge.recipe.craft.variant", { variant: suffix.replaceAll("_", " ") });
}

function formatSkill(relation: KnowledgeEntityRelation): string {
    const level = readNumber(relation.metadata.level) ?? 0;
    return `${relation.entity.name} ${level}`;
}

function formatActivity(value: string | null, t: ReturnType<typeof useTranslate>): string {
    if (value === null) return t("knowledge.recipe.unknown");
    return value
        .replace(/_EXERCISE$/, "")
        .replaceAll("_", " ")
        .toLocaleLowerCase();
}
