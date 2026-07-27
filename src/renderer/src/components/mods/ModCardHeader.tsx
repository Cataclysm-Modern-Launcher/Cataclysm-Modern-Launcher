import React, { ReactNode, useCallback } from "react";
import { Anchor, Badge, Group, Stack, Text, Tooltip } from "@mantine/core";
import { ModInstanceInfo } from "@shared/mods/ModInstanceInfo";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { openUrl } from "@renderer/utils/openUrl";
import { ModCardActions } from "@renderer/components/mods/ModCardActions";
import { LocalizedText } from "@renderer/components/LocalizedText";
import { LocaleKeys } from "@shared/localization/types/LocaleFile";

interface Props {
    mod: ModInstanceInfo;
}

export const ModCardHeader = React.memo(function ModCardHeader({ mod }: Props): ReactNode {
    const t = useTranslate();

    return (
        <Group wrap="nowrap" justify="space-between" align="flex-start">
            <Stack gap={4} style={{ minWidth: 0 }}>
                <Group gap="xs" wrap="wrap">
                    <Title mod={mod} />

                    {!!mod.authors?.length && (
                        <Group gap="2">
                            {mod.authors.map((a) => (
                                <ModAuthorBadge name={a} key={a} />
                            ))}
                        </Group>
                    )}
                </Group>
                <Group gap="xs" wrap="wrap">
                    <Badge size="xs" color={getModStatusColor(mod)} variant="light">
                        {t(getModStatusKey(mod))}
                    </Badge>

                    <ModSourceBadge mod={mod} />

                    <ModIncompatibleBadge mod={mod} />
                </Group>

                {mod.description && (
                    <Text size="sm" c="dimmed" lineClamp={3}>
                        {mod.description}
                    </Text>
                )}
            </Stack>

            <ModCardActions mod={mod} />
        </Group>
    );
});

function Title({ mod }: { mod: ModInstanceInfo }): ReactNode {
    const id = mod.subdirectory ? `${mod.id} (<code>${mod.subdirectory}</code>)` : mod.id;
    return (
        <Tooltip label={<LocalizedText size="xs" i18nKey="content.sheet.mods.title.tooltip" variables={{ id }} />}>
            <Text fw={700}>{mod.displayName}</Text>
        </Tooltip>
    );
}

function ModAuthorBadge({ name }: { name: string }): ReactNode {
    return (
        <Tooltip label={<LocalizedText i18nKey="content.sheet.mods.author.name.tooltip" variables={{ name }} />}>
            <LocalizedText c="green" size="xs" i18nKey="content.sheet.mods.author.name" variables={{ name }} />
        </Tooltip>
    );
}

function ModSourceBadge({ mod }: { mod: ModInstanceInfo }): ReactNode {
    const handleOpenUrl = useCallback(() => openUrl(mod.sourceUrl!), [mod]);

    if (mod.sourceType === "git" && mod.sourceUrl) {
        return (
            <Tooltip label={<LocalizedText i18nKey="content.sheet.mods.source.git.tooltip" variables={{ url: mod.sourceUrl }} size="xs" />}>
                <Badge size="xs" variant="outline">
                    <Anchor onClick={handleOpenUrl}>
                        <LocalizedText size="xs" i18nKey={`content.sheet.mods.source.${mod.sourceType}`} />
                    </Anchor>
                </Badge>
            </Tooltip>
        );
    }

    return (
        <Badge size="xs" variant="outline">
            <LocalizedText i18nKey={`content.sheet.mods.source.${mod.sourceType}`} />
        </Badge>
    );
}

function ModIncompatibleBadge({ mod }: { mod: ModInstanceInfo }): ReactNode {
    const t = useTranslate();

    if (mod.dependencyCompatible || !mod.expectedCoreModId) return null;

    return (
        <Tooltip label={<LocalizedText size="xs" i18nKey="content.sheet.mods.compatibility.warning.description" variables={{ expected: mod.expectedCoreModId, actual: mod.dependencies?.join(", ") || "—" }} />}>
            <Badge size="xs" color="orange" variant="filled">
                {t("content.sheet.mods.compatibility.warning.badge")}
            </Badge>
        </Tooltip>
    );
}

function getModStatusKey(mod: ModInstanceInfo): LocaleKeys {
    if (mod.status === "update-available") return "content.sheet.mods.status.update.available";
    if (mod.status === "blocked-by-local-changes") return mod.hasUnpushedCommits && !mod.hasLocalChanges ? "content.sheet.mods.status.unpushed.commits" : "content.sheet.mods.status.blocked.by.local.changes";
    if (mod.status === "missing-local-copy") return "content.sheet.mods.status.missing.local.copy";
    if (mod.status === "invalid-local-copy") return "content.sheet.mods.status.invalid.local.copy";
    if (mod.status === "error") return "content.sheet.mods.status.error";
    return "content.sheet.mods.status.installed";
}

function getModStatusColor(mod: ModInstanceInfo): string {
    if (mod.status === "update-available") return "blue";
    if (mod.status === "blocked-by-local-changes") return "orange";
    if (mod.status === "missing-local-copy" || mod.status === "invalid-local-copy" || mod.status === "error") return "red";
    return "green";
}
