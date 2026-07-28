import { NumericOperation } from "../applyNumericOperation";
import { IStructuralOperationAdapter } from "./IStructuralOperationAdapter";
import { isRecord } from "../../../utils/isRecord";
import { TStructuralOperationResult } from "./TStructuralOperationResult";

const GRIP = { bad: 0, none: 1, solid: 2, weapon: 3 } as const;
const LENGTH = { hand: 0, short: 1, long: 2 } as const;
const SURFACE = { point: 0, line: 1, any: 2, every: 3 } as const;
const BALANCE = { clumsy: 0, uneven: 1, neutral: 2, good: 3 } as const;

export class MeleeAccuracyOperationAdapter implements IStructuralOperationAdapter {
    apply(current: unknown, operand: unknown, operation: NumericOperation, path: string): TStructuralOperationResult {
        if (path.split(".").at(-1) !== "to_hit" || operation !== "relative" || typeof operand !== "number") {
            return { applied: false };
        }
        if (typeof current === "number") return { applied: true, value: current + operand };
        if (!isRecord(current)) return { applied: false };

        const value = readEnum(current.grip, GRIP, GRIP.weapon) + readEnum(current.length, LENGTH, LENGTH.hand) + readEnum(current.surface, SURFACE, SURFACE.any) + readEnum(current.balance, BALANCE, BALANCE.neutral) - 7;
        return { applied: true, value: value + operand };
    }
}

function readEnum<T extends Record<string, number>>(value: unknown, values: T, fallback: number): number {
    return typeof value === "string" && Object.hasOwn(values, value) ? values[value as keyof T] : fallback;
}
