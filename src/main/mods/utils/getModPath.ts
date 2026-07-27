import { join } from "node:path";

import { getChannelModsPath } from "./getChannelModsPath";

export function getModPath(repositoryPath: string, channelId: string, safeModId: string): string {
    return join(getChannelModsPath(repositoryPath, channelId), safeModId);
}
