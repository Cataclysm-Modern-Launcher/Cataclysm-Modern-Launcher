import { GameChannelDefinition } from "@shared/game-channel/GameChannelDefinition";

export function getReleaseCacheKey(channel: GameChannelDefinition): string {
    const platformKey = process.platform === "win32" ? "windows" : "linux";
    return `${channel.id}:${platformKey}:${channel.releasesUrl}`;
}
