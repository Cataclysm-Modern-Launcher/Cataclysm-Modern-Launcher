import { NumericOperation } from "../applyNumericOperation";
import { applyMoneyStringScalarOperation } from "./applyMoneyStringScalarOperation";
import { applyNumberScalarOperation } from "./applyNumberScalarOperation";
import { applyQuantityStringScalarOperation } from "./applyQuantityStringScalarOperation";
import { TScalarOperationResult } from "./TScalarOperationResult";

type ScalarOperationAdapter = (current: unknown, operand: unknown, operation: NumericOperation) => TScalarOperationResult;

const adapters: ScalarOperationAdapter[] = [applyNumberScalarOperation, applyMoneyStringScalarOperation, applyQuantityStringScalarOperation];

export function applyScalarOperation(current: unknown, operand: unknown, operation: NumericOperation): TScalarOperationResult {
    for (const adapter of adapters) {
        const result = adapter(current, operand, operation);
        if (result.applied) return result;
    }
    return { applied: false };
}
