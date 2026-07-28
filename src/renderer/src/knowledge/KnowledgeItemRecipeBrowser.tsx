import { KnowledgeRecipe } from "@shared/knowledge/KnowledgeRecipe";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { Paper, Tabs } from "@mantine/core";
import { KnowledgeItemRecipeDetails } from "@renderer/knowledge/KnowledgeItemRecipeDetails";

export function KnowledgeItemRecipeBrowser({ recipes, onNavigate }: { recipes: KnowledgeRecipe[]; onNavigate: (itemId: string) => void }): ReactNode {
    const t = useTranslate();
    const [active, setActive] = useState<string | null>(recipes[0]?.key ?? null);

    useEffect(() => {
        setActive(recipes[0]?.key ?? null);
    }, [recipes]);

    const selected = useMemo(() => recipes.find((recipe) => recipe.key === active) ?? recipes[0], [active, recipes]);

    if (selected === undefined) return null;

    return (
        <Paper withBorder p="md">
            {recipes.length > 1 && (
                <Tabs value={active} onChange={setActive} variant="outline" mb="md">
                    <Tabs.List>
                        {recipes.map((recipe, index) => (
                            <Tabs.Tab key={recipe.key} value={recipe.key}>
                                {t("knowledge.recipe.tab", { index: index + 1 })}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                </Tabs>
            )}
            <KnowledgeItemRecipeDetails recipe={selected} index={recipes.indexOf(selected) + 1} count={recipes.length} onNavigate={onNavigate} />
        </Paper>
    );
}
