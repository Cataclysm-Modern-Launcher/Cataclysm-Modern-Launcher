import { Anchor, Box, Group, Paper, SegmentedControl, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { useKnowledgeNavigate } from "@renderer/stores/useKnowledgeNavigationStore";
import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeLocationCell, KnowledgeLocationLayout } from "@shared/knowledge/KnowledgeLocation";
import React, { useEffect, useMemo, useState } from "react";
import { getCataColor } from "./getCataColor";

export function KnowledgeLocationInfo({ entity }: { entity: KnowledgeEntityDetails }): React.JSX.Element {
    const t = useTranslate();
    const navigate = useKnowledgeNavigate();
    const location = entity.location;
    const layouts = location?.layouts ?? [];
    const defaultZ = layouts.some((layout) => layout.z === 0) ? 0 : (layouts[0]?.z ?? 0);
    const [z, setZ] = useState(defaultZ);

    useEffect(() => setZ(defaultZ), [entity.key, defaultZ]);

    const layout = useMemo(() => layouts.find((candidate) => candidate.z === z) ?? layouts[0], [layouts, z]);

    return (
        <Stack gap="md">
            {entity.description !== null && (
                <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                    {entity.description}
                </Text>
            )}

            {location?.generationWeight !== null && location?.generationWeight !== undefined && (
                <Group gap="xs">
                    <Text size="sm" fw={600}>
                        {t("knowledge.location.generation.weight")}:
                    </Text>
                    <Tooltip label={t("knowledge.location.generation.weight.tooltip")}>
                        <Text size="sm" style={{ borderBottom: "1px dotted currentColor", cursor: "help" }}>
                            {location.generationWeight}
                        </Text>
                    </Tooltip>
                </Group>
            )}

            {location?.occurrences !== null && location?.occurrences !== undefined && (
                <Group gap="xs">
                    <Text size="sm" fw={600}>
                        {t("knowledge.location.generation.occurrences")}:
                    </Text>
                    <Tooltip label={t("knowledge.location.generation.occurrences.tooltip")}>
                        <Text size="sm" style={{ borderBottom: "1px dotted currentColor", cursor: "help" }}>
                            {formatOccurrences(location.occurrences)}
                        </Text>
                    </Tooltip>
                </Group>
            )}

            {location?.appearanceVariants !== undefined && location.appearanceVariants.length > 1 && (
                <Group gap="xs" align="baseline">
                    <Text size="sm" fw={600}>
                        {t("knowledge.location.variants")}:
                    </Text>
                    <Group gap="xs">
                        {location.appearanceVariants.map((variant) =>
                            variant.key === entity.key ? (
                                <Text key={variant.key} size="sm" fw={600}>
                                    {variant.id}
                                </Text>
                            ) : (
                                <Tooltip key={variant.key} label={variant.name}>
                                    <Anchor component="button" type="button" size="sm" onClick={() => navigate(variant.key)}>
                                        {variant.id}
                                    </Anchor>
                                </Tooltip>
                            )
                        )}
                    </Group>
                </Group>
            )}

            {location?.dynamicLayout === true && (
                <Text size="sm" c="dimmed">
                    {t("knowledge.location.layout.dynamic")}
                </Text>
            )}

            {layout !== undefined && (
                <Stack gap="xs">
                    {layouts.length > 1 && (
                        <Group gap="xs">
                            <Text size="sm" fw={600}>
                                {t("knowledge.location.layout.layer")}
                            </Text>
                            <SegmentedControl
                                size="xs"
                                value={String(layout.z)}
                                onChange={(value) => setZ(Number(value))}
                                data={layouts.map((candidate) => ({
                                    value: String(candidate.z),
                                    label: candidate.z === 0 ? t("knowledge.location.layout.surface") : String(candidate.z)
                                }))}
                            />
                        </Group>
                    )}
                    {layouts.length === 1 && layout.z !== 0 && (
                        <Text size="sm" fw={600}>
                            {t("knowledge.location.layout.layer.value", { z: layout.z })}
                        </Text>
                    )}
                    <LocationLayout layout={layout} />
                </Stack>
            )}
        </Stack>
    );
}

function LocationLayout({ layout }: { layout: KnowledgeLocationLayout }): React.JSX.Element {
    const columns = Math.max(0, ...layout.rows.map((row) => row.length));

    return (
        <Paper withBorder p="sm" style={{ overflowX: "auto" }}>
            <Box
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, 28px)`,
                    gridAutoRows: "28px",
                    width: "max-content",
                    fontFamily: "var(--mantine-font-family-monospace)"
                }}
            >
                {layout.rows.flatMap((row, y) => Array.from({ length: columns }, (_, x) => <LocationCell key={`${x}:${y}`} cell={row[x] ?? { symbol: " ", color: null, name: null, entityKey: null }} />))}
            </Box>
        </Paper>
    );
}

function LocationCell({ cell }: { cell: KnowledgeLocationCell }): React.JSX.Element {
    const navigate = useKnowledgeNavigate();
    const style: React.CSSProperties = {
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        lineHeight: 1,
        color: getCataColor(cell.color),
        userSelect: "text"
    };

    const content =
        cell.entityKey === null ? (
            <Box style={style}>{cell.symbol}</Box>
        ) : (
            <UnstyledButton onClick={() => navigate(cell.entityKey!)} style={{ ...style, cursor: "pointer" }} aria-label={cell.name ?? undefined}>
                {cell.symbol}
            </UnstyledButton>
        );

    return cell.name === null ? content : <Tooltip label={cell.name}>{content}</Tooltip>;
}

function formatOccurrences([min, max]: [number, number]): string {
    return min === max ? String(min) : `${min}–${max}`;
}
