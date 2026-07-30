import { UnsupportedNumericPath } from "./applyNumericOperation";
import { TJsonRecord } from "@shared/TJsonRecord";

export type TInheritanceResolutionResult = {
    value: TJsonRecord;
    appliedOperations: string[];
    unsupportedOperations: Array<{ operation: string; paths: UnsupportedNumericPath[] }>;
};
