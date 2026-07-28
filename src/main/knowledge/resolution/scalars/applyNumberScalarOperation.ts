import { NumericOperation } from "../applyNumericOperation";
import { TScalarOperationResult } from "./TScalarOperationResult";

export function applyNumberScalarOperation(current: unknown, operand: unknown, operation: NumericOperation): TScalarOperationResult {
    if (typeof operand !== "number") return { applied: false };
    if (typeof current === "number") return { applied: true, value: operation === "relative" ? current + operand : current * operand };
    if (current === undefined && operation === "relative") return { applied: true, value: operand };
    return { applied: false };
}
