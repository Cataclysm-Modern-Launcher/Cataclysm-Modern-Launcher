import { Badge, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import React from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";

export function KnowledgeRecipeCard({ recipe, relations, onOpen }: { recipe: KnowledgeEntityRelation; relations: KnowledgeEntityRelations | undefined; onOpen: (key: string) => void }): React.JSX.Element {
    const t = useTranslate();
    const components = relations?.outgoing.filter((relation) => relation.kind === "uses-component") ?? [];
    const tools = relations?.outgoing.filter((relation) => relation.kind === "uses-tool") ?? [];
    const qualities = relations?.outgoing.filter((relation) => relation.kind === "requires-quality") ?? [];
    const skills = relations?.outgoing.filter((relation) => relation.kind === "requires-skill") ?? [];
    const recovered = relations?.outgoing.filter((relation) => relation.kind === "recovers-component") ?? [];

    return (
        <Paper withBorder p="md">
            <Stack gap="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div>
                        <Text fw={600}>{recipe.entity.name}</Text>
                        <Text size="xs" c="dimmed">{recipe.entity.id}</Text>
                    </div>
                    <Badge variant="light">{recipe.entity.sourceModId}</Badge>
                </Group>
                {components.length > 0 && <RelationGroup label={t("knowledge.recipe.components")} relations={components} onOpen={onOpen} />}
                {recovered.length > 0 && <RelationGroup label={t("knowledge.recipe.disassembly.result")} relations={recovered} onOpen={onOpen} />}
                {tools.length > 0 && <RelationGroup label={t("knowledge.recipe.tools")} relations={tools} onOpen={onOpen} />}
                {qualities.length > 0 && <RelationGroup label={t("knowledge.recipe.qualities")} relations={qualities} onOpen={onOpen} />}
                {skills.length > 0 && <RelationGroup label={t("knowledge.recipe.skills")} relations={skills} onOpen={onOpen} />}
            </Stack>
        </Paper>
    );
}

function RelationGroup({ label, relations, onOpen }: { label: string; relations: KnowledgeEntityRelation[]; onOpen: (key: string) => void }): React.JSX.Element {
    return (
        <Stack gap={6}>
            <Divider label={label} labelPosition="left" />
            <Group gap={6}>
                {relations.map((relation, index) => (
                    <Badge
                        key={`${relation.kind}:${relation.entity.key}:${index}`}
                        variant="outline"
                        size="lg"
                        style={{ cursor: relation.entity.virtual ? "default" : "pointer", textTransform: "none" }}
                        onClick={() => !relation.entity.virtual && onOpen(relation.entity.key)}
                    >
                        {formatRelation(relation)}
                    </Badge>
                ))}
            </Group>
        </Stack>
    );
}

function formatRelation(relation: KnowledgeEntityRelation): string {
    const count = readNumber(relation.metadata.count) ?? readNumber(relation.metadata.quantity);
    const level = readNumber(relation.metadata.level);
    const countSuffix = count !== null && count !== 1 ? ` ×${count}` : "";
    const levelSuffix = level !== null ? ` ${level}` : "";
    return `${relation.entity.name}${relation.kind === "requires-quality" || relation.kind === "requires-skill" ? levelSuffix : countSuffix}`;
}

function readNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
