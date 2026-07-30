import { Badge, Box, Code, Divider, Group, Paper, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { RelationLink } from "@renderer/knowledge/RelationLink";
import { SummaryValue } from "@renderer/knowledge/SummaryValue";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import { KnowledgeRecipeRequirementAlternative } from "@shared/knowledge/KnowledgeRecipeRequirementAlternative";
import { KnowledgeRecipeRequirementGroup } from "@shared/knowledge/KnowledgeRecipeRequirementGroup";
import { readString } from "@shared/utils/readString";
import { IconBook2 } from "@tabler/icons-react";
import React from "react";
import { KnowledgeRecipeResults } from "@renderer/knowledge/recipes/KnowledgeRecipeResults";
import { KnowledgeQualityRequirementBadge } from "@renderer/knowledge/recipes/KnowledgeQualityRequirementBadge";

type Props = {
    recipe: KnowledgeEntityRelation;
    entity: KnowledgeEntityDetails | undefined;
    relations: KnowledgeEntityRelations | undefined;
    onOpen: (key: string) => void;
};

export function KnowledgeRecipeCard({ recipe, entity, relations, onOpen }: Props): React.JSX.Element {
    const t = useTranslate();
    const outgoing = relations?.outgoing ?? [];
    const skills = outgoing.filter((relation) => relation.kind === "requires-skill");
    const proficiencies = outgoing.filter((relation) => relation.kind === "requires-proficiency");
    const books = outgoing.filter((relation) => relation.kind === "learned-from");
    const autolearnSkills = outgoing.filter((relation) => relation.kind === "autolearned-at");
    const decompSkills = outgoing.filter((relation) => relation.kind === "learned-by-disassembly");
    const results = outgoing.filter((relation) => relation.kind === "produces" || relation.kind === "uncrafts-item");
    const byproducts = outgoing.filter((relation) => relation.kind === "produces-byproduct");
    const technicalResults = outgoing.filter((relation) => relation.kind === "applies-mapgen" || relation.kind === "provides-camp-feature" || relation.kind === "triggers-eoc");
    const raw = entity?.raw;

    const requirements = entity?.recipeRequirements;
    const canAutoLearn = raw?.autolearn === true || Array.isArray(raw?.autolearn);
    const hasLearningSource = canAutoLearn || books.length > 0 || decompSkills.length > 0;

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

                <Group gap="lg" align="flex-start" wrap="wrap">
                    <SummaryValue label={t("knowledge.recipe.time")} value={readString(raw?.time) ?? t("knowledge.recipe.unknown")} />
                    <SummaryValue label={t("knowledge.recipe.activity")} value={formatActivity(readString(raw?.activity_level), t)} />
                    <SummaryValue
                        label={t("knowledge.recipe.learning")}
                        value={[
                            canAutoLearn && autolearnSkills.length > 0 ? (
                                <Group gap={4} wrap="wrap">
                                    {autolearnSkills.map((skill) => (
                                        <RelationLink key={`${skill.entity.key}:${skill.metadata.level}`} relation={skill} onOpen={onOpen} />
                                    ))}
                                </Group>
                            ) : canAutoLearn ? (
                                <Tooltip label={t("knowledge.recipe.autolearn.immediate.tooltip")}>
                                    <Text size="sm" fw={500}>
                                        {t("knowledge.recipe.autolearn.available")}
                                    </Text>
                                </Tooltip>
                            ) : null,
                            ...books.map((book) => <RelationLink key={book.entity.key} relation={book} onOpen={onOpen} iconClass={IconBook2} />),
                            ...decompSkills.map((skill) => <RelationLink key={`${skill.entity.key}:${skill.metadata.level}`} relation={skill} onOpen={onOpen} />),
                            raw?.never_learn === true ? (
                                <Tooltip label={t("knowledge.recipe.never.learn.tooltip")}>
                                    <Text size="sm" fw={500}>
                                        {t("knowledge.recipe.never.learn")}
                                    </Text>
                                </Tooltip>
                            ) : !hasLearningSource ? (
                                <Tooltip label={t("knowledge.recipe.learning.unspecified.tooltip")}>
                                    <Text size="sm" fw={500}>
                                        {t("knowledge.recipe.learning.unspecified")}
                                    </Text>
                                </Tooltip>
                            ) : null
                        ]}
                    />
                    <SummaryValue label={t("knowledge.recipe.results")} value={<KnowledgeRecipeResults results={results} byproducts={byproducts} technicalResults={technicalResults} onOpen={onOpen} />} />
                </Group>

                <Group gap="lg" align="flex-start" wrap="wrap">
                    <SummaryValue
                        label={t("knowledge.recipe.required.skills")}
                        value={skills.map((skill) => (
                            <RelationLink key={skill.entity.key} relation={skill} onOpen={onOpen} />
                        ))}
                    />
                    <SummaryValue
                        label={t("knowledge.recipe.proficiencies")}
                        value={proficiencies.map((proficiency) => (
                            <RelationLink key={proficiency.entity.key} relation={proficiency} onOpen={onOpen} />
                        ))}
                    />
                </Group>

                {!!requirements?.qualities.length && <QualitySection groups={requirements.qualities} onOpen={onOpen} />}
                {!!requirements?.tools.length && <RequirementSection label={t("knowledge.recipe.tools")} groups={requirements.tools} onOpen={onOpen} />}
                {!!requirements?.components.length && <RequirementSection label={t("knowledge.recipe.components")} groups={requirements.components} onOpen={onOpen} />}
                {!!requirements?.recoveredComponents.length && <RequirementSection label={t("knowledge.recipe.disassembly.result")} groups={requirements.recoveredComponents} onOpen={onOpen} />}
            </Stack>
        </Paper>
    );
}

function QualitySection({ groups, onOpen }: { groups: KnowledgeRecipeRequirementGroup[]; onOpen: (key: string) => void }): React.JSX.Element {
    const t = useTranslate();
    return (
        <Stack gap={6}>
            <Divider label={t("knowledge.recipe.qualities")} labelPosition="left" />
            <Group gap={6} wrap="wrap">
                {groups.flatMap((group) =>
                    group.alternatives.map((alternative, index) => <KnowledgeQualityRequirementBadge key={`${group.key}:${alternative.entity.key}:${index}`} alternative={alternative} onOpen={onOpen} />)
                )}
            </Group>
        </Stack>
    );
}

function RequirementSection({ label, groups, onOpen }: { label: string; groups: KnowledgeRecipeRequirementGroup[]; onOpen: (key: string) => void }): React.JSX.Element {
    return (
        <Stack gap={6}>
            <Divider label={label} labelPosition="left" />
            <Stack gap={6}>
                {groups.map((group) => (
                    <AlternativeGroup key={group.key} alternatives={group.alternatives} onOpen={onOpen} />
                ))}
            </Stack>
        </Stack>
    );
}

const alternativesCountCollapse = 3;

function AlternativeGroup({ alternatives, onOpen }: { alternatives: KnowledgeRecipeRequirementAlternative[]; onOpen: (key: string) => void }): React.JSX.Element {
    const t = useTranslate();
    const [opened, { toggle }] = useDisclosure(false);
    const collapsible = alternatives.length > alternativesCountCollapse;
    const content = (
        <Stack gap={0}>
            <Box style={collapsible && !opened ? { maxHeight: "1.55em", overflow: "hidden" } : undefined}>
                <Group gap={6} align="baseline" wrap="wrap">
                    {alternatives.map((alternative, index) => (
                        <React.Fragment key={`${alternative.kind}:${alternative.entity.key}:${index}`}>
                            {index > 0 && (
                                <Text size="xs" c="dimmed" fw={600}>
                                    {t("knowledge.recipe.or")}
                                </Text>
                            )}
                            <RelationLink relation={toRelation(alternative)} onOpen={onOpen} />
                        </React.Fragment>
                    ))}
                </Group>
            </Box>

            {collapsible && (
                <UnstyledButton onClick={toggle} w="fit-content">
                    <Text size="xs" c="dimmed" td="underline">
                        {opened ? t("knowledge.recipe.collapse") : t("knowledge.recipe.expand.alternatives", { count: alternatives.length })}
                    </Text>
                </UnstyledButton>
            )}
        </Stack>
    );
    return alternatives.length <= alternativesCountCollapse ? (
        content
    ) : (
        <Paper withBorder p="xs" radius="sm">
            {content}
        </Paper>
    );
}

function toRelation(alternative: KnowledgeRecipeRequirementAlternative): KnowledgeEntityRelation {
    return { kind: alternative.kind, direction: "outgoing", entity: alternative.entity, metadata: alternative.metadata };
}

function getRecipeTitle(recipe: KnowledgeEntityRelation, raw: Record<string, unknown> | undefined, t: ReturnType<typeof useTranslate>): string {
    if (recipe.entity.jsonType === "uncraft") return t("knowledge.recipe.disassembly");
    const suffix = readString(raw?.id_suffix);
    return suffix === null ? t("knowledge.recipe.craft") : t("knowledge.recipe.craft.variant", { variant: suffix.replaceAll("_", " ") });
}

function formatActivity(value: string | null, t: ReturnType<typeof useTranslate>): string {
    if (value === null) return t("knowledge.recipe.unknown");
    return value
        .replace(/_EXERCISE$/, "")
        .replaceAll("_", " ")
        .toLocaleLowerCase();
}
