import { ActionIcon, Badge, Code, Group, Stack, Tabs, Text, Title, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconArrowRight, IconBraces } from "@tabler/icons-react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { KnowledgeEntityRelations } from "@shared/knowledge/KnowledgeEntityRelations";
import React, { useState } from "react";
import { KnowledgeJsonModal } from "./KnowledgeJsonModal";
import { KnowledgeRecipeCard } from "./KnowledgeRecipeCard";
import { KnowledgeItemDestructionView } from "./KnowledgeItemDestructionView";
import { useKnowledgeNavigationStore } from "@renderer/stores/useKnowledgeNavigationStore";
import { KnowledgeQualityRequirementBadge } from "./KnowledgeQualityRequirementBadge";
import { KnowledgeMonsterInfo } from "./KnowledgeMonsterInfo";
import { KnowledgeMonsterHarvestView } from "./KnowledgeMonsterHarvestView";
import { KnowledgeMonsterDropsView } from "./KnowledgeMonsterDropsView";
import { KnowledgeLocationInfo } from "./KnowledgeLocationInfo";
import { KnowledgeLocationSpawnList } from "./KnowledgeLocationSpawnList";

export type KnowledgeEntityDetailsViewProps = {
    entity: KnowledgeEntityDetails;
    relations: KnowledgeEntityRelations;
    relatedEntities: Record<string, KnowledgeEntityDetails>;
    relatedRelations: Record<string, KnowledgeEntityRelations>;
};

export function KnowledgeEntityDetailsView(props: KnowledgeEntityDetailsViewProps): React.JSX.Element {
    const t = useTranslate();
    const navigation = useKnowledgeNavigationStore();
    const current = navigation.entries[navigation.index];
    const recipes = filterRelations(props.relations.incoming, "produces");
    const destruction = props.entity.itemDestruction?.actions ?? [];
    const obtainedFrom = props.entity.itemDestruction?.obtainedFrom ?? [];
    const usedIn = props.relations.incoming.filter((relation) => relation.kind === "uses-component" || relation.kind === "uses-tool");
    const qualities = filterRelations(props.relations.outgoing, "provides-quality");
    const isItem = props.entity.jsonType === "ITEM";
    const isMonster = props.entity.jsonType === "MONSTER";
    const isLocation = props.entity.jsonType === "LOCATION";
    const locationAppearances = props.entity.locationAppearances ?? [];
    const locationFurniture = props.entity.location?.furniture ?? [];
    const locationLoot = props.entity.location?.loot ?? [];
    const locationMonsters = props.entity.location?.monsters ?? [];
    const monsterDrops = filterRelations(props.relations.outgoing, "drops-item");
    const droppedByMonsters = filterRelations(props.relations.incoming, "drops-item");
    const monsterHarvest = props.entity.monsterHarvest?.entries ?? [];
    const [jsonOpened, setJsonOpened] = useState(false);

    return (
        <Stack gap="md" pb="xl">
            <Group align="flex-start" wrap="nowrap">
                <Group gap={4} mt={4} wrap="nowrap">
                    <ActionIcon variant="subtle" disabled={navigation.index <= 0} onClick={navigation.back}>
                        <IconArrowLeft size={18} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" disabled={navigation.index < 0 || navigation.index >= navigation.entries.length - 1} onClick={navigation.forward}>
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
                            {isLocation ? t("knowledge.location.type") : props.entity.jsonType}
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

            <Tabs value={current?.tab ?? "info"} onChange={(value) => navigation.setTab(value ?? "info")} keepMounted={false}>
                <Tabs.List>
                    <Tabs.Tab value="info">{t("knowledge.tabs.info")}</Tabs.Tab>
                    {isItem && recipes.length > 0 && <Tabs.Tab value="recipes">{t("knowledge.tabs.recipes", { count: recipes.length })}</Tabs.Tab>}
                    {isItem && destruction.length > 0 && <Tabs.Tab value="destruction">{t("knowledge.tabs.destruction", { count: destruction.length })}</Tabs.Tab>}
                    {isItem && obtainedFrom.length > 0 && <Tabs.Tab value="obtainedFrom">{t("knowledge.tabs.obtained.from", { count: obtainedFrom.length })}</Tabs.Tab>}
                    {isItem && droppedByMonsters.length > 0 && <Tabs.Tab value="monsterDrops">{t("knowledge.tabs.monster.drops", { count: droppedByMonsters.length })}</Tabs.Tab>}
                    {isItem && usedIn.length > 0 && <Tabs.Tab value="usedIn">{t("knowledge.tabs.used.in", { count: usedIn.length })}</Tabs.Tab>}
                    {isMonster && monsterDrops.length > 0 && <Tabs.Tab value="drops">{t("knowledge.monster.tabs.drops", { count: monsterDrops.length })}</Tabs.Tab>}
                    {isMonster && monsterHarvest.length > 0 && <Tabs.Tab value="harvest">{t("knowledge.monster.tabs.harvest", { count: monsterHarvest.length })}</Tabs.Tab>}
                    {isItem && locationAppearances.length > 0 && <Tabs.Tab value="locations">{t("knowledge.item.tabs.locations", { count: locationAppearances.length })}</Tabs.Tab>}
                    {isMonster && locationAppearances.length > 0 && <Tabs.Tab value="locations">{t("knowledge.monster.tabs.locations", { count: locationAppearances.length })}</Tabs.Tab>}
                    {isLocation && locationFurniture.length > 0 && <Tabs.Tab value="furniture">{t("knowledge.location.tabs.furniture", { count: locationFurniture.length })}</Tabs.Tab>}
                    {isLocation && locationLoot.length > 0 && <Tabs.Tab value="loot">{t("knowledge.location.tabs.loot", { count: locationLoot.length })}</Tabs.Tab>}
                    {isLocation && locationMonsters.length > 0 && <Tabs.Tab value="monsters">{t("knowledge.location.tabs.monsters", { count: locationMonsters.length })}</Tabs.Tab>}
                </Tabs.List>

                <Tabs.Panel value="info" pt="md">
                    {isMonster ? (
                        <KnowledgeMonsterInfo entity={props.entity} />
                    ) : isLocation ? (
                        <KnowledgeLocationInfo entity={props.entity} />
                    ) : (
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
                                        <KnowledgeQualityRequirementBadge key={quality.entity.key} alternative={{ kind: "requires-quality", entity: quality.entity, metadata: quality.metadata }} />
                                    ))}
                                </Group>
                            )}
                        </Stack>
                    )}
                </Tabs.Panel>

                {isItem && recipes.length > 0 && (
                    <Tabs.Panel value="recipes" pt="md">
                        <RecipeList recipes={recipes} relatedEntities={props.relatedEntities} relatedRelations={props.relatedRelations} />
                    </Tabs.Panel>
                )}

                {isItem && destruction.length > 0 && (
                    <Tabs.Panel value="destruction" pt="md">
                        <KnowledgeItemDestructionView actions={destruction} />
                    </Tabs.Panel>
                )}

                {isItem && obtainedFrom.length > 0 && (
                    <Tabs.Panel value="obtainedFrom" pt="md">
                        <KnowledgeItemDestructionView actions={obtainedFrom} compactSources />
                    </Tabs.Panel>
                )}

                {isItem && droppedByMonsters.length > 0 && (
                    <Tabs.Panel value="monsterDrops" pt="md">
                        <KnowledgeMonsterDropsView drops={droppedByMonsters} />
                    </Tabs.Panel>
                )}

                {isItem && usedIn.length > 0 && (
                    <Tabs.Panel value="usedIn" pt="md">
                        <RecipeList recipes={usedIn} relatedEntities={props.relatedEntities} relatedRelations={props.relatedRelations} />
                    </Tabs.Panel>
                )}

                {isMonster && monsterDrops.length > 0 && (
                    <Tabs.Panel value="drops" pt="md">
                        <KnowledgeMonsterDropsView drops={monsterDrops} />
                    </Tabs.Panel>
                )}

                {isMonster && monsterHarvest.length > 0 && (
                    <Tabs.Panel value="harvest" pt="md">
                        <KnowledgeMonsterHarvestView entries={monsterHarvest} />
                    </Tabs.Panel>
                )}

                {(isItem || isMonster) && locationAppearances.length > 0 && (
                    <Tabs.Panel value="locations" pt="md">
                        <KnowledgeLocationSpawnList entries={locationAppearances} />
                    </Tabs.Panel>
                )}

                {isLocation && locationFurniture.length > 0 && (
                    <Tabs.Panel value="furniture" pt="md">
                        <KnowledgeLocationSpawnList entries={locationFurniture} />
                    </Tabs.Panel>
                )}

                {isLocation && locationLoot.length > 0 && (
                    <Tabs.Panel value="loot" pt="md">
                        <KnowledgeLocationSpawnList entries={locationLoot} />
                    </Tabs.Panel>
                )}

                {isLocation && locationMonsters.length > 0 && (
                    <Tabs.Panel value="monsters" pt="md">
                        <KnowledgeLocationSpawnList entries={locationMonsters} hint={t("knowledge.location.monsters.hint")} />
                    </Tabs.Panel>
                )}
            </Tabs>
            <KnowledgeJsonModal opened={jsonOpened} value={props.entity.raw} onClose={() => setJsonOpened(false)} />
        </Stack>
    );
}

function RecipeList({
    recipes,
    relatedEntities,
    relatedRelations
}: {
    recipes: KnowledgeEntityRelation[];
    relatedEntities: Record<string, KnowledgeEntityDetails>;
    relatedRelations: Record<string, KnowledgeEntityRelations>;
}): React.JSX.Element {
    const t = useTranslate();
    const cards = recipes.map((recipe, index) => ({
        key: `${recipe.entity.key}:${index}`,
        label: getRecipeTabLabel(relatedEntities[recipe.entity.key], index, t),
        content: <KnowledgeRecipeCard recipe={recipe} entity={relatedEntities[recipe.entity.key]} relations={relatedRelations[recipe.entity.key]} />
    }));

    if (cards.length === 1) return cards[0].content;

    return (
        <Tabs defaultValue={cards[0].key} variant="outline" keepMounted={false}>
            <Tabs.List>
                {cards.map((card) => (
                    <Tabs.Tab key={card.key} value={card.key}>
                        {card.label}
                    </Tabs.Tab>
                ))}
            </Tabs.List>
            {cards.map((card) => (
                <Tabs.Panel key={card.key} value={card.key} pt="md">
                    {card.content}
                </Tabs.Panel>
            ))}
        </Tabs>
    );
}

function getRecipeTabLabel(entity: KnowledgeEntityDetails | undefined, index: number, t: ReturnType<typeof useTranslate>): string {
    const raw = entity?.raw;
    const suffix = typeof raw?.id_suffix === "string" && raw.id_suffix.length > 0 ? raw.id_suffix.replaceAll("_", " ") : null;
    if (suffix !== null) return suffix;
    return t("knowledge.recipe.variant", { number: index + 1 });
}

function filterRelations(relations: KnowledgeEntityRelation[], kind: KnowledgeEntityRelation["kind"]): KnowledgeEntityRelation[] {
    return relations.filter((relation) => relation.kind === kind);
}
