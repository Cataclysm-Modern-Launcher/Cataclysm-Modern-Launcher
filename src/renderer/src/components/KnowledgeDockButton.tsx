import { Button, Menu, Stack, Text } from "@mantine/core";
import { IconBook2 } from "@tabler/icons-react";
import React from "react";
import { useGameStateStore } from "@renderer/stores/useGameStateStore";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { defaultIconProps } from "@renderer/utils/defaultIconProps";

export function KnowledgeDockButton(): React.JSX.Element {
    const state = useGameStateStore((store) => store.state);
    const t = useTranslate();
    const worlds = state.status === "ready" ? (state.saves?.worlds ?? []) : [];
    const disabled = state.status !== "ready" || state.gameBundle === null || worlds.length === 0;

    if (worlds.length <= 1) {
        return (
            <Button size="xs" variant="light" disabled={disabled} leftSection={<IconBook2 {...defaultIconProps} />} onClick={() => worlds[0] && void window.api.knowledge.open(worlds[0].folderName)}>
                {t("dock.wiki")}
            </Button>
        );
    }
    return (
        <Menu width={320} position="top-end">
            <Menu.Target>
                <Button size="xs" variant="light" disabled={disabled} leftSection={<IconBook2 {...defaultIconProps} />}>
                    {t("dock.wiki")}
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label>{t("wiki.select.world")}</Menu.Label>
                {worlds.map((world) => (
                    <Menu.Item key={world.folderName} onClick={() => void window.api.knowledge.open(world.folderName)}>
                        <Stack gap={0}>
                            <Text size="sm">{world.name}</Text>
                            <Text size="xs" c="dimmed">
                                {world.characterName ?? t("home.world.unknown")}
                            </Text>
                        </Stack>
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
}
