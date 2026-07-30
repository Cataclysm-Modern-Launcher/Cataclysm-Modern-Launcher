import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { readNumber } from "@shared/utils/readNumber";
import { readString } from "@shared/utils/readString";
import React from "react";
import { Anchor, Text } from "@mantine/core";

export function RelationLink({ relation, onOpen }: { relation: KnowledgeEntityRelation; onOpen: (key: string) => void }): React.JSX.Element {
    const content = formatRelation(relation);
    if (relation.entity.virtual) return <Text size="sm">{content}</Text>;
    return (
        <Anchor component="button" type="button" size="sm" onClick={() => onOpen(relation.entity.key)}>
            {content}
        </Anchor>
    );
}

function formatRelation(relation: KnowledgeEntityRelation): string {
    if (relation.kind === "requires-quality" || relation.kind === "requires-skill") {
        const level = readNumber(relation.metadata.level) ?? 1;
        const amount = readNumber(relation.metadata.count) ?? 1;
        return amount > 1 ? `${amount} × ${relation.entity.name} ${level}` : `${relation.entity.name} ${level}`;
    }
    if (relation.kind === "requires-proficiency") {
        const details = [
            readNumber(relation.metadata.timeMultiplier) === null ? null : `${readNumber(relation.metadata.timeMultiplier)}× time`,
            readNumber(relation.metadata.skillPenalty) === null ? null : `${readNumber(relation.metadata.skillPenalty)} skill penalty`
        ].filter((value): value is string => value !== null);
        return details.length === 0 ? relation.entity.name : `${relation.entity.name} (${details.join(", ")})`;
    }
    if (relation.kind === "learned-from") {
        const level = readNumber(relation.metadata.level);
        return level === null ? relation.entity.name : `${relation.entity.name} (${level})`;
    }

    const count = readNumber(relation.metadata.count) ?? readNumber(relation.metadata.quantity) ?? 1;
    const countMode = readString(relation.metadata.countMode);
    const consumed = relation.metadata.consumed === true;
    if (relation.kind === "uses-tool" && !consumed) return relation.entity.name;
    if (relation.kind === "uses-tool" && countMode === "charges") return `${relation.entity.name} (${count})`;
    return count === 1 ? relation.entity.name : `${count} × ${relation.entity.name}`;
}
