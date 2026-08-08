import { GithubRelease, GithubReleaseAsset } from "@shared/GithubRelease";
import { GameChannelDefinition } from "@shared/game-channel/GameChannelDefinition";
import { GitHubAsset } from "./GitHubAsset";
import { GitHubRelease } from "./GitHubRelease";
import { selectReleaseAsset } from "./selectReleaseAsset";

export function toGameRelease(value: unknown, channel: GameChannelDefinition): GithubRelease | null {
    if (typeof value !== "object" || value === null) return null;
    const release = value as GitHubRelease;
    if (release.draft === true || typeof release.tag_name !== "string" || typeof release.published_at !== "string") return null;

    const withSounds = toGithubReleaseAsset(selectReleaseAsset(release.assets, channel, "with-sounds"));
    const withoutSounds = toGithubReleaseAsset(selectReleaseAsset(release.assets, channel, "without-sounds"));
    if (withSounds === null && withoutSounds === null) return null;

    return {
        id: release.tag_name,
        name: release.name ?? release.tag_name,
        tagName: release.tag_name,
        publishedAt: release.published_at,
        htmlUrl: release.html_url ?? `https://github.com/${channel.githubOwner}/${channel.githubRepo}/releases/tag/${encodeURIComponent(release.tag_name)}`,
        body: release.body ?? "",
        prerelease: release.prerelease === true,
        assets: { withSounds, withoutSounds }
    };
}

function toGithubReleaseAsset(asset: GitHubAsset | null): GithubReleaseAsset | null {
    if (asset?.name === undefined || asset.browser_download_url === undefined) return null;
    return {
        name: asset.name,
        size: typeof asset.size === "number" ? asset.size : 0,
        downloadUrl: asset.browser_download_url
    };
}
