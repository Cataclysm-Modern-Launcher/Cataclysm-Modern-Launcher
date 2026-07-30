import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import React from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { Badge, Group, Stack, Text } from "@mantine/core";
import { RelationLink } from "@renderer/knowledge/RelationLink";

interface Props {
    results: KnowledgeEntityRelation[];
    byproducts: KnowledgeEntityRelation[];
    technicalResults: KnowledgeEntityRelation[];
}

export function KnowledgeRecipeResults({ results, byproducts, technicalResults }: Props): React.JSX.Element | null {
    const t = useTranslate();
    if (results.length === 0 && byproducts.length === 0 && technicalResults.length === 0) return null;
    return (
        <Stack gap={4}>
            {results.map((result) => (
                <RelationLink key={`${result.kind}:${result.entity.key}`} relation={result} />
            ))}
            {byproducts.map((byproduct) => (
                <Group gap={4} wrap="nowrap" key={byproduct.entity.key}>
                    <RelationLink relation={byproduct} c="cyan" />
                    <Text size="xs" c="dimmed">
                        ({t("knowledge.recipe.byproduct")})
                    </Text>
                </Group>
            ))}
            {technicalResults.map((result) => (
                <Group key={`${result.kind}:${result.entity.key}`} gap={4} wrap="nowrap">
                    <Badge size="xs" variant="outline" color="gray">
                        {technicalResultLabel(result.kind, t)}
                    </Badge>
                    <RelationLink relation={result} />
                </Group>
            ))}
        </Stack>
    );
}

function technicalResultLabel(kind: KnowledgeEntityRelation["kind"], t: ReturnType<typeof useTranslate>): string {
    if (kind === "triggers-eoc") return t("knowledge.recipe.result.eoc");
    if (kind === "applies-mapgen") return t("knowledge.recipe.result.mapgen");
    return t("knowledge.recipe.result.camp.feature");
}
