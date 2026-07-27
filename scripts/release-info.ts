interface GitHubReleaseAsset {
    name: string;
    download_count: number;
}

interface GitHubRelease {
    tag_name: string;
    assets: GitHubReleaseAsset[];
}

interface ReleaseStats {
    version: string;
    downloads: number;
}

const API_URL = "https://api.github.com/repos/Cataclysm-Modern-Launcher/Cataclysm-Modern-Launcher/releases?per_page=5";

async function fetchReleaseStats(): Promise<ReleaseStats[]> {
    const response = await fetch(API_URL, {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "Cataclysm-Modern-Launcher-Stats",
            "X-GitHub-Api-Version": "2022-11-28"
        }
    });

    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
    }

    const releases = (await response.json()) as GitHubRelease[];

    if (!Array.isArray(releases)) {
        throw new Error("GitHub API returned an unexpected response");
    }

    return releases.map((release) => ({
        version: release.tag_name,
        downloads: release.assets.filter((asset) => !isServiceAsset(asset.name)).reduce((total, asset) => total + asset.download_count, 0)
    }));
}

function isServiceAsset(name: string): boolean {
    return name.endsWith(".yml") || name.endsWith(".yaml") || name.endsWith(".blockmap");
}

async function main(): Promise<void> {
    try {
        const releases = await fetchReleaseStats();

        console.table(
            releases.map((release) => ({
                Version: release.version,
                Downloads: release.downloads
            }))
        );
    } catch (error: unknown) {
        console.error(error instanceof Error ? error.message : "Unknown error occurred");

        process.exitCode = 1;
    }
}

void main();
