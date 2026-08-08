import { GithubRelease } from "@shared/GithubRelease";
import { GameChannelDefinition } from "@shared/game-channel/GameChannelDefinition";

export function matchesReleaseFilter(release: GithubRelease, channel: GameChannelDefinition): boolean {
    if (channel.releaseFilter === "all") return true;

    const value = `${release.id} ${release.name}`.toLowerCase();
    const isExperimentalRelease = release.prerelease || value.includes("experimental") || value.includes("nightly");
    return channel.releaseFilter === "experimental" ? isExperimentalRelease : !isExperimentalRelease;
}
