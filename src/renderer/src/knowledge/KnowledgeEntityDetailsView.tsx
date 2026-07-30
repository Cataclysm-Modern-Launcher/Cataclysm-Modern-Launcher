import { ActionIcon, Badge, Code, Group, Stack, Tabs, Text, Title, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconArrowRight, IconBraces } from "@tabler/icons-react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import React, { useState } from "react";
import { KnowledgeJsonModal } from "./KnowledgeJsonModal";
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
    const [jsonOpened, setJsonOpened] = useState(false);

    return (
        <Stack gap="md" pb="xl">
            <Group align="flex-start" wrap="nowrap">
                <Group gap={4} mt={4} wrap="nowrap">
                    <ActionIcon variant="subtle" disabled={!props.canGoBack} onClick={props.onBack}>
                        <IconArrowLeft size={18} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" disabled={!props.canGoForward} onClick={props.onForward}>
                        <IconArrowRight size={18} />
                    </ActionIcon>
                </Group>

                <Stack gap={0}>
                    <Group gap="sm" wrap="nowrap">
                        <Title order={2}>{props.entity.name}</Title>

                        <Tooltip label={t("knowledge.entity.raw.json")}>
                            <ActionIcon variant="light" onClick={() => setJsonOpened(true)} mb={-4}>
                                <IconBraces size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                    <Group gap="xs" mt="xs">
                        <Badge size="xs" variant="outline">
                            {props.entity.jsonType}
                        </Badge>
                        <Badge size="xs" variant="light">
                            {props.entity.sourceModId}
                        </Badge>
                        {props.entity.abstract && (
                            <Badge size="xs" color="gray">
                                {t("knowledge.entity.abstract")}
                            </Badge>
                        )}

                        <Tooltip label={t("knowledge.entity.id")}>
                            <Code fz={10} lh={1.2}>
                                {props.entity.id}
                            </Code>
                        </Tooltip>
                        <Tooltip label={t("knowledge.entity.source")}>
                            <Code fz={10} lh={1.2}>
                                {props.entity.sourceFile}
                            </Code>
                        </Tooltip>
                    </Group>
                </Stack>
            </Group>

            <Tabs defaultValue="info" keepMounted={false}>
                <Tabs.List>
                    <Tabs.Tab value="info">{t("knowledge.tabs.info")}</Tabs.Tab>
                    {isItem && recipes.length > 0 && <Tabs.Tab value="recipes">{t("knowledge.tabs.recipes", { count: recipes.length })}</Tabs.Tab>}
                    {isItem && disassembly.length > 0 && <Tabs.Tab value="disassembly">{t("knowledge.tabs.disassembly", { count: disassembly.length })}</Tabs.Tab>}
                    {isItem && usedIn.length > 0 && <Tabs.Tab value="usedIn">{t("knowledge.tabs.used.in", { count: usedIn.length })}</Tabs.Tab>}
                </Tabs.List>

                <Tabs.Panel value="info" pt="md">
                    <Stack gap="sm">
                        {props.entity.description !== null && (
                            <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                                {props.entity.description}
                            </Text>
                        )}

                        {qualities.length > 0 && (
                            <Group gap={6} mt="xs">
                                <Text size="sm" fw={600}>
                                    {t("knowledge.entity.qualities")}:
                                </Text>
                                {qualities.map((quality) => (
                                    <Badge size="md" key={quality.entity.key} variant="outline" style={{ cursor: "pointer", textTransform: "none" }} onClick={() => props.onOpen(quality.entity.key)}>
                                        {quality.entity.name} {readNumber(quality.metadata.level) ?? 1}
                                    </Badge>
                                ))}
                            </Group>
                        )}
                    </Stack>
                </Tabs.Panel>

                {isItem && recipes.length > 0 && (
                    <Tabs.Panel value="recipes" pt="md">
                        <RecipeList recipes={recipes} relatedRelations={props.relatedRelations} onOpen={props.onOpen} />
                    </Tabs.Panel>
                )}

                {isItem && disassembly.length > 0 && (
                    <Tabs.Panel value="disassembly" pt="md">
                        <RecipeList recipes={disassembly} relatedRelations={props.relatedRelations} onOpen={props.onOpen} />
                    </Tabs.Panel>
                )}

                {isItem && usedIn.length > 0 && (
                    <Tabs.Panel value="usedIn" pt="md">
                        <RecipeList recipes={usedIn} relatedRelations={props.relatedRelations} onOpen={props.onOpen} />
                    </Tabs.Panel>
                )}
            </Tabs>
            <KnowledgeJsonModal opened={jsonOpened} value={props.entity.raw} onClose={() => setJsonOpened(false)} />
        </Stack>
    );
}

function RecipeList({ recipes, relatedRelations, onOpen }: { recipes: KnowledgeEntityRelation[]; relatedRelations: Record<string, KnowledgeEntityRelations>; onOpen: (key: string) => void }): React.JSX.Element {
    return (
        <Stack gap="sm">
            {recipes.map((recipe, index) => (
                <KnowledgeRecipeCard key={`${recipe.entity.key}:${index}`} recipe={recipe} relations={relatedRelations[recipe.entity.key]} onOpen={onOpen} />
            ))}
        </Stack>
    );
}

function filterRelations(relations: KnowledgeEntityRelation[], kind: KnowledgeEntityRelation["kind"]): KnowledgeEntityRelation[] {
    return relations.filter((relation) => relation.kind === kind);
}

function readNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
