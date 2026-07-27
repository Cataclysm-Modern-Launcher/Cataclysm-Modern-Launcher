import { join } from "node:path";

export function getChannelModRepositoryPath(repositoryPath: string, channelId: string): string {
    return join(repositoryPath, "mod-repository", channelId);
}
