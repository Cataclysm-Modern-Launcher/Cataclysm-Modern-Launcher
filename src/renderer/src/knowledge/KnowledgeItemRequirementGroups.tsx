import { KnowledgeRequirementGroup } from "@shared/knowledge/KnowledgeRequirementGroup";
import React from "react";
import { Stack } from "@mantine/core";
import { KnowledgeAlternativeSelector } from "@renderer/knowledge/KnowledgeAlternativeSelector";

export function KnowledgeItemRequirementGroups({ groups, kind, onNavigate }: { groups: KnowledgeRequirementGroup[]; kind: "component" | "tool"; onNavigate: (itemId: string) => void }): React.JSX.Element {
    return (
        <Stack gap="xs">
            {groups.map((group, index) => (
                <KnowledgeAlternativeSelector key={index} alternatives={group} kind={kind} onNavigate={onNavigate} />
            ))}
        </Stack>
    );
}
