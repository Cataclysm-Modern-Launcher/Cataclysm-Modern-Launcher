import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import React from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { Stack, Text } from "@mantine/core";
import { RelationLink } from "@renderer/knowledge/RelationLink";

export function RecipeLearningSummary({ books, autoLearn, onOpen }: { books: KnowledgeEntityRelation[]; autoLearn: unknown; onOpen: (key: string) => void }): React.JSX.Element {
    const t = useTranslate();
    const canAutoLearn = autoLearn === true || Array.isArray(autoLearn);
    return (
        <Stack gap={2}>
            <Text size="xs" c="dimmed">
                {t("knowledge.recipe.learning")}
            </Text>

            {canAutoLearn && (
                <Text size="sm" fw={500}>
                    {t("knowledge.recipe.autolearn.available")}
                </Text>
            )}

            {books.map((book) => (
                <RelationLink key={book.entity.key} relation={book} onOpen={onOpen} />
            ))}

            {!canAutoLearn && !books.length && (
                <Text size="sm" fw={500}>
                    {t("knowledge.recipe.none")}
                </Text>
            )}
        </Stack>
    );
}
