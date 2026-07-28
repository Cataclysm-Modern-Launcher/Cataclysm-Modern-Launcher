import { NumericOperation } from "../applyNumericOperation";
import { TStructuralOperationResult } from "./TStructuralOperationResult";

export interface IStructuralOperationAdapter {
    apply(current: unknown, operand: unknown, operation: NumericOperation, path: string): TStructuralOperationResult;
}
