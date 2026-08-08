import { KnowledgeEntityReference } from "./KnowledgeEntityReference";

export type KnowledgeLocationCell = {
    symbol: string;
    color: string | null;
    name: string | null;
    entityKey: string | null;
};

export type KnowledgeLocationLayout = {
    z: number;
    rows: KnowledgeLocationCell[][];
};

export type KnowledgeLocationSpawn = {
    entity: KnowledgeEntityReference;
    chance: number;
    approximate: boolean;
};

export type KnowledgeLocationDetails = {
    layouts: KnowledgeLocationLayout[];
    furniture: KnowledgeLocationSpawn[];
    loot: KnowledgeLocationSpawn[];
    monsters: KnowledgeLocationSpawn[];
    terrainIds: string[];
    dynamicLayout: boolean;
    generationWeight: number | null;
    occurrences: [number, number] | null;
    appearanceVariants?: KnowledgeEntityReference[];
    appearanceRepresentativeKey?: string;
};
