import { AppearanceApi } from "./AppearanceApi";
import { GameApi } from "./GameApi";
import { LocalizationApi } from "./LocalizationApi";
import { ModsApi } from "./ModsApi";
import { WorkspaceApi } from "./WorkspaceApi";
import { SettingsApi } from "./SettingsApi";
import { ShellApi } from "./ShellApi";
import { UpdaterApi } from "./UpdaterApi";
import { KnowledgeApi } from "./KnowledgeApi";

export type AppApi = {
    updater: UpdaterApi;
    workspace: WorkspaceApi;
    localization: LocalizationApi;
    appearance: AppearanceApi;
    shell: ShellApi;
    settings: SettingsApi;
    game: GameApi;
    mods: ModsApi;
    knowledge: KnowledgeApi;
};
