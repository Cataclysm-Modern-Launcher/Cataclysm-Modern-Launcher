export type GithubReleaseAsset = {
    name: string;
    size: number;
    downloadUrl: string;
};

export type GithubRelease = {
    id: string;
    name: string;
    tagName: string;
    publishedAt: string;
    htmlUrl: string;
    body: string;
    prerelease: boolean;
    assets: {
        withSounds: GithubReleaseAsset | null;
        withoutSounds: GithubReleaseAsset | null;
    };
};
