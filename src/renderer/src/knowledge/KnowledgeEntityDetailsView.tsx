import { ActionIcon, Badge, Code, Group, Paper, Stack, Tabs, Text, Title, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import React from "react";
import { KnowledgeRecipeCard } from "./KnowledgeRecipeCard";

export type KnowledgeEntityDetailsViewProps = {
    entity: KnowledgeEntityDetails;
    relations: KnowledgeEntityRelations;
    relatedRelations: Record<string, KnowledgeEntityRelations>;
    canGoBack: boolean;
    canGoForward: boolean;
    onOpen: (key: string) => void;
    onBack: () => void;
    onForward: () => void;
};

export function KnowledgeEntityDetailsView(props: KnowledgeEntityDetailsViewProps): React.JSX.Element {
    const t = useTranslate();
    const recipes = filterRelations(props.relations.incoming, "produces");
    const disassembly = filterRelations(props.relations.incoming, "uncrafts-item");
    const usedIn = props.relations.incoming.filter((relation) => relation.kind === "uses-component" || relation.kind === "uses-tool");
    const qualities = filterRelations(props.relations.outgoing, "provides-quality");
    const isItem = props.entity.jsonType === "ITEM";

    return (
        <Stack gap="md" maw={1100} mx="auto" pb="xl">
            <Group align="flex-start" wrap="nowrap">
                <Group gap={4} mt={2} wrap="nowrap">
                    <Tooltip label={t("knowledge.navigation.back")}>
                        <ActionIcon variant="subtle" disabled={!props.canGoBack} onClick={props.onBack}><IconArrowLeft size={18} /></ActionIcon>
                    </Tooltip>
                    <Tooltip label={t("knowledge.navigation.forward")}>
                        <ActionIcon variant="subtle" disabled={!props.canGoForward} onClick={props.onForward}><IconArrowRight size={18} /></ActionIcon>
                    </Tooltip>
                </Group>
                <div style={{ minWidth: 0 }}>
                    <Title order={2}>{props.entity.name}</Title>
                    <Group gap="xs" mt="xs">
                        <Badge variant="outline">{props.entity.jsonType}</Badge>
                        <Badge variant="light">{props.entity.sourceModId}</Badge>
                        {props.entity.abstract && <Badge color="gray">{t("knowledge.entity.abstract")}</Badge>}
                    </Group>
                </div>
            </Group>

            <Tabs defaultValue="info" keepMounted={false}>
                <Tabs.List>
                    <Tabs.Tab value="info">{t("knowledge.tabs.info")}</Tabs.Tab>
                    {isItem && recipes.length > 0 && <Tabs.Tab value="recipes">{t("knowledge.tabs.recipes", { count: recipes.length })}</Tabs.Tab>}
                    {isItem && disassembly.length > 0 && <Tabs.Tab value="disassembly">{t("knowledge.tabs.disassembly", { count: disassembly.length })}</Tabs.Tab>}
                    {isItem && usedIn.length > 0 && <Tabs.Tab value="usedIn">{t("knowledge.tabs.used.in", { count: usedIn.length })}</Tabs.Tab>}
                </Tabs.List>

                <Tabs.Panel value="info" pt="md">
                    <Stack gap="md">
                        <Paper withBorder p="md">
                            <Stack gap="xs">
                                <Text size="sm"><b>{t("knowledge.entity.id")}:</b> {props.entity.id}</Text>
                                <Text size="sm"><b>{t("knowledge.entity.source")}:</b> {props.entity.sourceFile}</Text>
                                {props.entity.description !== null && <Text style={{ whiteSpace: "pre-wrap" }}>{props.entity.description}</Text>}
                                {qualities.length > 0 && (
                                    <Group gap={6} mt="xs">
                                        <Text size="sm" fw={600}>{t("knowledge.entity.qualities")}:</Text>
                                        {qualities.map((quality) => (
                                            <Badge key={quality.entity.key} variant="outline" style={{ cursor: "pointer", textTransform: "none" }} onClick={() => props.onOpen(quality.entity.key)}>
                                                {quality.entity.name} {readNumber(quality.metadata.level) ?? 1}
                                            </Badge>
                                        ))}
                                    </Group>
                                )}
                            </Stack>
                        </Paper>
                        <Code block style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{JSON.stringify(props.entity.raw, null, 2)}</Code>
                    </Stack>
                </Tabs.Panel>
                {isItem && recipes.length > 0 && <Tabs.Panel value="recipes" pt="md"><RecipeList recipes={recipes} relatedRelations={props.relatedRelations} onOpen={props.onOpen} /></Tabs.Panel>}
                {isItem && disassembly.length > 0 && <Tabs.Panel value="disassembly" pt="md"><RecipeList recipes={disassembly} relatedRelations={props.relatedRelations} onOpen={props.onOpen} /></Tabs.Panel>}
                {isItem && usedIn.length > 0 && <Tabs.Panel value="usedIn" pt="md"><RecipeList recipes={usedIn} relatedRelations={props.relatedRelations} onOpen={props.onOpen} /></Tabs.Panel>}
            </Tabs>
        </Stack>
    );
}

function RecipeList({ recipes, relatedRelations, onOpen }: { recipes: KnowledgeEntityRelation[]; relatedRelations: Record<string, KnowledgeEntityRelations>; onOpen: (key: string) => void }): React.JSX.Element {
    return <Stack gap="sm">{recipes.map((recipe, index) => <KnowledgeRecipeCard key={`${recipe.entity.key}:${index}`} recipe={recipe} relations={relatedRelations[recipe.entity.key]} onOpen={onOpen} />)}</Stack>;
}

function filterRelations(relations: KnowledgeEntityRelation[], kind: KnowledgeEntityRelation["kind"]): KnowledgeEntityRelation[] {
    return relations.filter((relation) => relation.kind === kind);
}

function readNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
