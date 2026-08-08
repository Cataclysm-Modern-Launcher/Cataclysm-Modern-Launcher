import { GameReleaseAssetDefinition } from "@shared/game-channel/GameChannelDefinition";
import { GitHubAsset } from "./GitHubAsset";

export function matchesReleaseAssetDefinition(asset: GitHubAsset, definition: GameReleaseAssetDefinition): boolean {
    if (typeof asset.name !== "string" || typeof asset.browser_download_url !== "string") return false;

    const assetName = asset.name.toLowerCase();
    const includes = definition.nameIncludes.map((part) => part.toLowerCase());
    const excludes = definition.nameExcludes?.map((part) => part.toLowerCase()) ?? [];
    const isSupportedArchive = assetName.endsWith(".zip") || assetName.endsWith(".tar.gz") || assetName.endsWith(".tgz");

    return isSupportedArchive && includes.every((part) => assetName.includes(part)) && excludes.every((part) => !assetName.includes(part));
}
