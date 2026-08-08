import { GithubRelease, GithubReleaseAsset } from "../GithubRelease";

export function selectGithubReleaseAsset(release: GithubRelease, withoutSounds: boolean): GithubReleaseAsset | null {
    return withoutSounds ? (release.assets.withoutSounds ?? release.assets.withSounds) : (release.assets.withSounds ?? release.assets.withoutSounds);
}
