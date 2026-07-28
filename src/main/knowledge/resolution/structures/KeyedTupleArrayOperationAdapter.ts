import { NumericOperation } from "../applyNumericOperation";
import { IStructuralOperationAdapter } from "./IStructuralOperationAdapter";
import { isTupleArray } from "../../../utils/isTupleArray";
import { TStructuralOperationResult } from "./TStructuralOperationResult";

export class KeyedTupleArrayOperationAdapter implements IStructuralOperationAdapter {
    apply(current: unknown, operand: unknown, operation: NumericOperation, path: string): TStructuralOperationResult {
        if (!path.endsWith("qualities") || !isTupleArray(current) || !isTupleArray(operand)) return { applied: false };
        const result: Array<[string, number]> = current.map(([key, value]) => [key, value]);

        for (const [key, value] of operand) {
            const index = result.findIndex((entry) => entry[0] === key);
            if (index < 0) {
                if (operation === "relative") {
                    result.push([key, value]);
                    continue;
                }
                return { applied: false, reason: "missing-target" };
            }
            result[index][1] = operation === "relative" ? result[index][1] + value : result[index][1] * value;
        }
        return { applied: true, value: result };
    }
}
