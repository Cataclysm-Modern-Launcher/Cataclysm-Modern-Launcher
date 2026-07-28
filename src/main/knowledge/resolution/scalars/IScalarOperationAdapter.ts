import { NumericOperation } from "../applyNumericOperation";
import { TScalarOperationResult } from "./TScalarOperationResult";

export interface IScalarOperationAdapter {
    apply(current: unknown, operand: unknown, operation: NumericOperation): TScalarOperationResult;
}
