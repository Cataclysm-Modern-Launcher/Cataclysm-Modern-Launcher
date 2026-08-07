import { KnowledgeEntityReference } from "./KnowledgeEntityReference";

export type KnowledgeMonsterHarvestEntry = {
    dropId: string;
    drop?: KnowledgeEntityReference;
    type: string | null;
    baseNum?: number | [number, number];
    scaleNum?: number | [number, number];
    max?: number;
    massRatio?: number;
};

export type KnowledgeMonsterHarvest = {
    id: string;
    entries: KnowledgeMonsterHarvestEntry[];
};
