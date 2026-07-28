import { NumericOperation } from "../applyNumericOperation";
import { DamageInstanceOperationAdapter } from "./DamageInstanceOperationAdapter";
import { DamageMapOperationAdapter } from "./DamageMapOperationAdapter";
import { KeyedTupleArrayOperationAdapter } from "./KeyedTupleArrayOperationAdapter";
import { MeleeAccuracyOperationAdapter } from "./MeleeAccuracyOperationAdapter";
import { IStructuralOperationAdapter } from "./IStructuralOperationAdapter";
import { TStructuralOperationResult } from "./TStructuralOperationResult";

export class StructuralOperationRegistry {
    private readonly adapters: IStructuralOperationAdapter[] = [
        new DamageInstanceOperationAdapter(), //
        new DamageMapOperationAdapter(),
        new MeleeAccuracyOperationAdapter(),
        new KeyedTupleArrayOperationAdapter()
    ];

    apply(current: unknown, operand: unknown, operation: NumericOperation, path: string): TStructuralOperationResult {
        for (const adapter of this.adapters) {
            const result = adapter.apply(current, operand, operation, path);
            if (result.applied || result.reason !== undefined) return result;
        }
        return { applied: false };
    }
}
