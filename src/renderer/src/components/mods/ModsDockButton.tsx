import "./ModsDockButton.css";
import React from "react";
import { ModRepositoryState } from "../../../../shared/mods/ModRepositoryState";
import { useModsStore } from "@renderer/stores/useModsStore";
import { OpenDrawerButton } from "@renderer/components/OpenDrawerButton";

export function ModsDockButton(): React.JSX.Element | null {
    const modRepositoryState = useModsStore((state) => state.state);
    const modIndicatorState = getModIndicatorState(modRepositoryState);

    return (
        <OpenDrawerButton drawer="mods" i18nKey="dock.mods" className="launcher-dock__mods-button">
            {modIndicatorState !== "idle" && <span className={`launcher-dock__mods-indicator launcher-dock__mods-indicator--${modIndicatorState}`} aria-hidden="true" />}
        </OpenDrawerButton>
    );
}

function getModIndicatorState(state: ModRepositoryState): "idle" | "checking" | "updates" {
    if (state.status !== "ready") return "idle";
    if (state.mods.some((mod) => mod.updateAvailable)) return "updates";
    if (state.checking) return "checking";
    return "idle";
}
