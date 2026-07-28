import { NumericOperation } from "../applyNumericOperation";
import { applyDamageInstanceOperation } from "./applyDamageInstanceOperation";
import { applyDamageMapOperation } from "./applyDamageMapOperation";
import { applyKeyedTupleArrayOperation } from "./applyKeyedTupleArrayOperation";
import { applyMeleeAccuracyOperation } from "./applyMeleeAccuracyOperation";
import { TStructuralOperationResult } from "./TStructuralOperationResult";

type StructuralOperationAdapter = (current: unknown, operand: unknown, operation: NumericOperation, path: string) => TStructuralOperationResult;

const adapters: StructuralOperationAdapter[] = [applyDamageInstanceOperation, applyDamageMapOperation, applyMeleeAccuracyOperation, applyKeyedTupleArrayOperation];

export function applyStructuralOperation(current: unknown, operand: unknown, operation: NumericOperation, path: string): TStructuralOperationResult {
    for (const adapter of adapters) {
        const result = adapter(current, operand, operation, path);
        if (result.applied || ("reason" in result && result.reason !== undefined)) return result;
    }
    return { applied: false };
}
