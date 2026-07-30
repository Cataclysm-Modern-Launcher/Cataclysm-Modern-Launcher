import { KnowledgeEntityRelation } from "@shared/knowledge/KnowledgeEntityRelation";
import { readNumber } from "@shared/utils/readNumber";
import { readString } from "@shared/utils/readString";
import React, { ReactNode } from "react";
import { Anchor, AnchorProps, Badge, Group, Text, Tooltip } from "@mantine/core";
import { IconBook2, IconBrain, IconClock, IconProps, IconRosette, IconTool } from "@tabler/icons-react";
import { useTranslate } from "@renderer/stores/useLocaleStore";

interface Props extends AnchorProps {
    relation: KnowledgeEntityRelation;
    onOpen: (key: string) => void;
    iconClass?: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;
}

const iconProps = { size: 16, stroke: 1, style: { color: "light-dark(var(--mantine-color-orange-7), var(--mantine-color-orange-4))" } };

export function RelationLink(props: Props): React.JSX.Element {
    const t = useTranslate();
    const { relation, iconClass } = props;

    if (relation.kind === "requires-skill") {
        const tooltip = relation.metadata.primary === true ? t("knowledge.recipe.skill.primary.tooltip") : t("knowledge.recipe.skill.additional.tooltip");
        const fw = relation.metadata.primary === true ? "bold" : "normal";

        return (
            <Wrap {...props} tooltip={tooltip}>
                <Group gap={2} wrap="nowrap">
                    {(!!iconClass && React.createElement(iconClass, iconProps)) || <IconBrain {...iconProps} />}
                    <Text fw={fw}>
                        {relation.entity.name} {`${readNumber(relation.metadata.level) ?? 0}`}
                    </Text>
                </Group>
            </Wrap>
        );
    }

    if (relation.kind === "requires-proficiency") {
        return (
            <Group wrap="nowrap" gap={4}>
                <Wrap {...props}>
                    <Group gap={2} wrap="nowrap">
                        {(!!iconClass && React.createElement(iconClass, iconProps)) || <IconRosette {...iconProps} />}
                        <Text>{relation.entity.name}</Text>
                    </Group>
                </Wrap>

                {!!relation.metadata.timeMultiplier && (
                    <Tooltip label={t("knowledge.recipe.proficiency.time.multiplier", { value: readNumber(relation.metadata.timeMultiplier) })}>
                        <Badge size="sm">
                            <Group gap={2} wrap="nowrap">
                                <IconClock size={16} stroke={1} />
                                <Text size="xs">×{readNumber(relation.metadata.timeMultiplier)}</Text>
                            </Group>
                        </Badge>
                    </Tooltip>
                )}

                {!!relation.metadata.skillPenalty && (
                    <Tooltip label={t("knowledge.recipe.proficiency.skill.penalty", { value: readNumber(relation.metadata.skillPenalty) })}>
                        <Badge size="sm">
                            <Group gap={2} wrap="nowrap">
                                <IconBrain {...iconProps} />
                                <Text size="xs">-{readNumber(relation.metadata.skillPenalty)}</Text>
                            </Group>
                        </Badge>
                    </Tooltip>
                )}
            </Group>
        );
    }

    if (relation.kind === "requires-quality") {
        const level = readNumber(relation.metadata.level) ?? 1;
        // haha yes, this is a thing. recipe can require multiple of the same quality.
        const amount = readNumber(relation.metadata.count) ?? 1;
        return (
            <Wrap {...props}>
                <Group gap={2} wrap="nowrap">
                    {(!!iconClass && React.createElement(iconClass, iconProps)) || <IconTool {...iconProps} />}
                    {amount > 1 ? <Text>{amount}× </Text> : null}
                    <Text size="xs">
                        {relation.entity.name} {level}
                    </Text>
                </Group>
            </Wrap>
        );
    }

    if (relation.kind === "learned-from") {
        const level = readNumber(relation.metadata.level) ?? 0;
        return (
            <Group gap={2} wrap="nowrap">
                <Wrap {...props}>
                    <Group gap={2} wrap="nowrap">
                        {(!!iconClass && React.createElement(iconClass, iconProps)) || <IconBook2 {...iconProps} />}
                        <Text size="xs">{relation.entity.name}</Text>
                    </Group>
                </Wrap>
                {!!level && <Text size="xs">({level})</Text>}
            </Group>
        );
    }

    const consumed = relation.metadata.consumed === true;
    if (relation.kind === "uses-tool" && !consumed) {
        return (
            <Wrap {...props}>
                <Group gap={2} wrap="nowrap">
                    {!!iconClass && React.createElement(iconClass, { size: 16, stroke: 1 })}
                    {relation.entity.name}
                </Group>
            </Wrap>
        );
    }

    const countMode = readString(relation.metadata.countMode);
    const count = readNumber(relation.metadata.count) ?? readNumber(relation.metadata.quantity) ?? 1;
    if (relation.kind === "uses-tool" && countMode === "charges") {
        return (
            <Wrap {...props}>
                <Group gap={2} wrap="nowrap">
                    {!!iconClass && React.createElement(iconClass, { size: 16, stroke: 1 })}
                    {relation.entity.name} ({count})
                </Group>
            </Wrap>
        );
    }

    return (
        <Wrap {...props}>
            <Group gap={2} wrap="nowrap">
                {!!iconClass && React.createElement(iconClass, { size: 16, stroke: 1 })}
                {count > 1 && <Text size="xs">{count}× </Text>}
                <Text size="xs">{relation.entity.name}</Text>
            </Group>
        </Wrap>
    );
}

function Wrap({ relation, onOpen, iconClass, children, tooltip, ...props }: Props & { children: ReactNode; tooltip?: string }): React.JSX.Element {
    void iconClass;
    const content = relation.entity.virtual ? (
        <Text size="sm" {...props}>
            {children}
        </Text>
    ) : (
        <Anchor component="button" type="button" size="sm" onClick={() => onOpen(relation.entity.key)} {...props}>
            {children}
        </Anchor>
    );
    return tooltip ? <Tooltip label={tooltip}>{content}</Tooltip> : content;
}
