import { TReleaseAssetSoundVariant } from "../release-asset/TReleaseAssetSoundVariant";

export type GameReleaseAssetDefinition = {
    soundVariant: TReleaseAssetSoundVariant;
    nameIncludes: string[];
    nameExcludes?: string[];
};

export type GameChannelDefinition = {
    id: string;
    gameId: string;
    channelId: string;
    gameName: string;
    shortName: string;
    channelName: string;
    coreModId?: string;
    githubOwner: string;
    githubRepo: string;
    githubBranch: string;
    releasesUrl: string;
    releaseDiscovery: "list" | "latest";
    releaseFilter: "stable" | "experimental" | "all";
    releaseAssets: {
        windows: GameReleaseAssetDefinition[];
        linux: GameReleaseAssetDefinition[];
    };
    executableNames: {
        windows: string[];
        linux: string[];
    };
    kind: "stable" | "experimental";
    source: "built-in" | "custom";
};
