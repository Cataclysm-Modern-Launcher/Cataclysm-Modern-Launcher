import { NumericOperation } from "../applyNumericOperation";
import { MoneyStringScalarAdapter } from "./MoneyStringScalarAdapter";
import { NumberScalarAdapter } from "./NumberScalarAdapter";
import { QuantityStringScalarAdapter } from "./QuantityStringScalarAdapter";
import { IScalarOperationAdapter } from "./IScalarOperationAdapter";
import { TScalarOperationResult } from "./TScalarOperationResult";

export class ScalarOperationRegistry {
    private readonly adapters: IScalarOperationAdapter[] = [
        new NumberScalarAdapter(), //
        new MoneyStringScalarAdapter(),
        new QuantityStringScalarAdapter()
    ];

    apply(current: unknown, operand: unknown, operation: NumericOperation): TScalarOperationResult {
        for (const adapter of this.adapters) {
            const result = adapter.apply(current, operand, operation);
            if (result.applied) return result;
        }
        return { applied: false };
    }
}
