import { GameChannelDefinition } from "./GameChannelDefinition";

export const BUILT_IN_GAME_CHANNELS: GameChannelDefinition[] = [
    {
        id: "cdda-experimental",
        gameId: "cdda",
        channelId: "experimental",
        gameName: "Cataclysm: Dark Days Ahead",
        shortName: "CDDA",
        channelName: "Experimental",
        coreModId: "dda",
        githubOwner: "CleverRaven",
        githubRepo: "Cataclysm-DDA",
        githubBranch: "master",
        releasesUrl: "https://api.github.com/repos/CleverRaven/Cataclysm-DDA/releases",
        releaseDiscovery: "list",
        releaseFilter: "experimental",
        releaseAssets: {
            windows: [
                { soundVariant: "with-sounds", nameIncludes: ["windows-with-graphics-and-sounds-x64"] },
                { soundVariant: "without-sounds", nameIncludes: ["windows-with-graphics-x64"] },
                { soundVariant: "with-sounds", nameIncludes: ["cdda-windows-tiles-x64"] }
            ],
            linux: [
                { soundVariant: "with-sounds", nameIncludes: ["linux-with-graphics-and-sounds-x64"] },
                { soundVariant: "without-sounds", nameIncludes: ["linux-with-graphics-x64"] },
                { soundVariant: "with-sounds", nameIncludes: ["cdda-linux-tiles-x64"] }
            ]
        },
        executableNames: {
            windows: ["cataclysm-tiles.exe", "cataclysm.exe"],
            linux: ["cataclysm-tiles", "cataclysm"]
        },
        kind: "experimental",
        source: "built-in"
    },
    {
        id: "cdda-stable",
        gameId: "cdda",
        channelId: "stable",
        gameName: "Cataclysm: Dark Days Ahead",
        shortName: "CDDA",
        channelName: "Stable",
        coreModId: "dda",
        githubOwner: "CleverRaven",
        githubRepo: "Cataclysm-DDA",
        githubBranch: "0.I-branch",
        releasesUrl: "https://api.github.com/repos/CleverRaven/Cataclysm-DDA/releases",
        releaseDiscovery: "latest",
        releaseFilter: "stable",
        releaseAssets: {
            windows: [
                { soundVariant: "with-sounds", nameIncludes: ["windows-with-graphics-and-sounds-x64"] },
                { soundVariant: "without-sounds", nameIncludes: ["windows-with-graphics-x64"] },
                { soundVariant: "with-sounds", nameIncludes: ["cdda-windows-tiles-x64"] }
            ],
            linux: [
                { soundVariant: "with-sounds", nameIncludes: ["linux-with-graphics-and-sounds-x64"] },
                { soundVariant: "without-sounds", nameIncludes: ["linux-with-graphics-x64"] },
                { soundVariant: "with-sounds", nameIncludes: ["cdda-linux-tiles-x64"] }
            ]
        },
        executableNames: {
            windows: ["cataclysm-tiles.exe", "cataclysm.exe"],
            linux: ["cataclysm-tiles", "cataclysm", "cataclysm-launcher"]
        },
        kind: "stable",
        source: "built-in"
    },
    {
        id: "bn-experimental",
        gameId: "bn",
        channelId: "experimental",
        gameName: "Cataclysm: Bright Nights",
        shortName: "Bright Nights",
        channelName: "Nightly",
        coreModId: "bn",
        githubOwner: "cataclysmbn",
        githubRepo: "Cataclysm-BN",
        githubBranch: "main",
        releasesUrl: "https://api.github.com/repos/cataclysmbn/Cataclysm-BN/releases",
        releaseDiscovery: "list",
        releaseFilter: "experimental",
        releaseAssets: {
            windows: [
                { soundVariant: "with-sounds", nameIncludes: ["cbn-windows-tiles-x64-msvc-"], nameExcludes: ["no-soundpack", "-pdb"] },
                { soundVariant: "without-sounds", nameIncludes: ["cbn-windows-tiles-x64-msvc-no-soundpack-"] }
            ],
            linux: [{ soundVariant: "with-sounds", nameIncludes: ["cbn-linux-tiles-x64-"] }]
        },
        executableNames: {
            windows: ["cataclysm-bn-tiles.exe", "cataclysm-bn.exe"],
            linux: ["cataclysm-bn-tiles", "cataclysm-bn", "cataclysm-launcher"]
        },
        kind: "experimental",
        source: "built-in"
    },
    {
        id: "bn-stable",
        gameId: "bn",
        channelId: "stable",
        gameName: "Cataclysm: Bright Nights",
        shortName: "Bright Nights",
        channelName: "Stable",
        coreModId: "bn",
        githubOwner: "cataclysmbn",
        githubRepo: "Cataclysm-BN",
        githubBranch: "main",
        releasesUrl: "https://api.github.com/repos/cataclysmbn/Cataclysm-BN/releases",
        releaseDiscovery: "latest",
        releaseFilter: "stable",
        releaseAssets: {
            windows: [
                { soundVariant: "with-sounds", nameIncludes: ["cbn-windows-tiles-x64-msvc-"], nameExcludes: ["no-soundpack", "-pdb"] },
                { soundVariant: "without-sounds", nameIncludes: ["cbn-windows-tiles-x64-msvc-no-soundpack-"] }
            ],
            linux: [{ soundVariant: "with-sounds", nameIncludes: ["cbn-linux-tiles-x64-"] }]
        },
        executableNames: {
            windows: ["cataclysm-bn-tiles.exe", "cataclysm-bn.exe"],
            linux: ["cataclysm-bn-tiles", "cataclysm-bn", "cataclysm-launcher"]
        },
        kind: "stable",
        source: "built-in"
    },
    {
        id: "tlg-experimental",
        gameId: "tlg",
        channelId: "experimental",
        gameName: "Cataclysm: The Last Generation",
        shortName: "The Last Generation",
        channelName: "Experimental",
        coreModId: "tlg",
        githubOwner: "Cataclysm-TLG",
        githubRepo: "Cataclysm-TLG",
        githubBranch: "master",
        releasesUrl: "https://api.github.com/repos/Cataclysm-TLG/Cataclysm-TLG/releases",
        releaseDiscovery: "list",
        releaseFilter: "all",
        releaseAssets: {
            windows: [
                { soundVariant: "with-sounds", nameIncludes: ["ctlg-windows-tiles-sounds-x64-msvc-"] },
                { soundVariant: "without-sounds", nameIncludes: ["ctlg-windows-tiles-x64-msvc-"] }
            ],
            linux: [
                { soundVariant: "with-sounds", nameIncludes: ["ctlg-linux-tiles-sounds-x64-"] },
                { soundVariant: "without-sounds", nameIncludes: ["ctlg-linux-tiles-x64-"] }
            ]
        },
        executableNames: {
            windows: ["cataclysm-tlg-tiles.exe", "cataclysm-tlg.exe"],
            linux: ["cataclysm-tlg-tiles", "cataclysm-tlg", "cataclysm-launcher"]
        },
        kind: "experimental",
        source: "built-in"
    }
];
