import { TDrawerKind, useOpenDrawerFn } from "@renderer/stores/useDrawerStore";
import type { LocaleKeys } from "@shared/localization/types/LocaleFile";
import { Button, ButtonVariant, Tooltip } from "@mantine/core";
import { ReactNode, useCallback } from "react";
import { useTranslate } from "@renderer/stores/useLocaleStore";
import { LocalizedText } from "@renderer/components/LocalizedText";

interface Props {
    drawer: TDrawerKind;
    i18nKey: LocaleKeys;
    i18nTooltipKey?: LocaleKeys;
    variant?: ButtonVariant;
    leftSection?: ReactNode;
    className?: string;
    children?: ReactNode;
}

export function OpenDrawerButton({ drawer, i18nKey, i18nTooltipKey, variant = "light", leftSection, className, children }: Props): ReactNode {
    const t = useTranslate();
    const openDrawer = useOpenDrawerFn();
    const handleClick = useCallback(() => openDrawer(drawer), [drawer, openDrawer]);

    if (i18nTooltipKey) {
        return (
            <Tooltip label={t(i18nTooltipKey)}>
                <Button variant={variant} size="xs" onClick={handleClick} leftSection={leftSection} className={className}>
                    <LocalizedText size="xs" i18nKey={i18nKey} />
                </Button>
                {children}
            </Tooltip>
        );
    } else {
        return (
            <Button variant={variant} size="xs" onClick={handleClick} leftSection={leftSection} className={className}>
                <LocalizedText size="xs" i18nKey={i18nKey} />
                {children}
            </Button>
        );
    }
}
