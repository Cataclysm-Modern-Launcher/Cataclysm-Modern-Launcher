import { GameChannelDefinition } from "@shared/game-channel/GameChannelDefinition";
import { GitHubAsset } from "./GitHubAsset";
import { TReleaseAssetSoundVariant } from "@shared/release-asset/TReleaseAssetSoundVariant";
import { matchesReleaseAssetDefinition } from "./matchesReleaseAssetDefinition";

export function selectReleaseAsset(assets: GitHubAsset[] | undefined, channel: GameChannelDefinition, soundVariant: TReleaseAssetSoundVariant): GitHubAsset | null {
    const platformKey = process.platform === "win32" ? "windows" : "linux";
    const definitions = channel.releaseAssets[platformKey].filter((candidate) => candidate.soundVariant === soundVariant);

    for (const definition of definitions) {
        const asset = assets?.find((candidate) => matchesReleaseAssetDefinition(candidate, definition));
        if (asset !== undefined) return asset;
    }

    return null;
}
