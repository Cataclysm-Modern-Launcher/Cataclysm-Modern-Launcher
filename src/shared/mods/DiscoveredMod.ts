export type DiscoveredMod = {
    id: string;
    name: string;
    description?: string;
    dependencies: string[];
    dependencyCompatible?: boolean;
    expectedCoreModId?: string;
    subdirectory: string;
};
