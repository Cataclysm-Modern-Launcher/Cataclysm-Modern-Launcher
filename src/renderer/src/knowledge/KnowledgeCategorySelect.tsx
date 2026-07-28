import React from "react";
import { Select } from "@mantine/core";
import { KnowledgeCategorySummary } from "@shared/knowledge/KnowledgeCategorySummary";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { getKnowledgeCategoryLabel } from "./getKnowledgeCategoryLabel";

export type KnowledgeCategorySelectProps = {
    categories: KnowledgeCategorySummary[];
    value: string | null;
    onChange: (value: string | null) => void;
};

export function KnowledgeCategorySelect({ categories, value, onChange }: KnowledgeCategorySelectProps): React.JSX.Element {
    const t = useTranslate();
    return (
        <Select
            clearable
            searchable
            value={value}
            onChange={onChange}
            placeholder={t("knowledge.category.all")}
            data={categories.map((category) => ({ value: category.id, label: `${getKnowledgeCategoryLabel(category.id, t)} (${category.count})` }))}
        />
    );
}
