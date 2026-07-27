import { Group, Paper } from "@mantine/core";
import { ReactNode } from "react";
import { useConfigStore } from "@renderer/stores/useConfigStore";
import { SelectGameVariant } from "@renderer/components/SelectGameVariant";
import { ModsDockButton } from "@renderer/components/mods/ModsDockButton";
import { useWorkspaceStore } from "@renderer/stores/useWorkspaceStore";
import { IconSettings } from "@tabler/icons-react";
import { defaultIconProps } from "@renderer/utils/defaultIconProps";
import { OpenDrawerButton } from "@renderer/components/OpenDrawerButton";

export function AppBottomDock(): ReactNode {
    const backupsEnabled = useConfigStore((state) => state.backupsEnabled);
    const ws = useWorkspaceStore((state) => state.workspaceStatus);

    if (ws.status !== "ready") return null;

    return (
        <Paper withBorder radius="lg" shadow="xl" className="launcher-dock">
            <Group justify="space-between" gap="md" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" className="launcher-dock__section">
                    <SelectGameVariant />
                    <OpenDrawerButton drawer="game-bundles" i18nKey="versions.title" />
                </Group>

                <Group gap="xs" wrap="nowrap" className="launcher-dock__section launcher-dock__section--right">
                    {backupsEnabled && <OpenDrawerButton drawer="backups" i18nKey="backup.action.manage" variant="light" />}
                    <ModsDockButton />
                    <OpenDrawerButton drawer="settings" i18nKey="dock.settings" i18nTooltipKey="dock.settings.tooltip" variant="filled" leftSection={<IconSettings {...defaultIconProps} />} />
                </Group>
            </Group>
        </Paper>
    );
}
