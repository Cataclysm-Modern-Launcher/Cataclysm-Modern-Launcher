import { KnowledgeEntityReference } from "./KnowledgeEntityReference";
import { KnowledgeRecipeRequirements } from "./KnowledgeRecipeRequirements";

export type KnowledgeItemDestructionResult = {
    entity: KnowledgeEntityReference;
    count?: number;
    countMin?: number;
    countMax?: number;
    chance?: number;
    note?: string;
    highlighted?: boolean;
};

export type KnowledgeItemDestructionAction = {
    kind: "disassembly" | "salvage" | "breakage";
    source?: KnowledgeEntityReference;
    time?: string | number;
    timeNote?: string;
    results: KnowledgeItemDestructionResult[];
    requirements?: KnowledgeRecipeRequirements;
    dependencies: string[];
};

export type KnowledgeItemDestruction = {
    actions: KnowledgeItemDestructionAction[];
    obtainedFrom: KnowledgeItemDestructionAction[];
};
