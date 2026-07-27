import { join } from "node:path";

import { getChannelModRepositoryPath } from "./getChannelModRepositoryPath";

export function getChannelModsPath(repositoryPath: string, channelId: string): string {
    return join(getChannelModRepositoryPath(repositoryPath, channelId), "mods");
}
