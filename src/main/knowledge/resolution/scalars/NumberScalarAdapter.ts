import { IScalarOperationAdapter } from "./IScalarOperationAdapter";
import { TScalarOperationResult } from "./TScalarOperationResult";

export class NumberScalarAdapter implements IScalarOperationAdapter {
    apply(current: unknown, operand: unknown, operation: "relative" | "proportional"): TScalarOperationResult {
        if (typeof operand !== "number") return { applied: false } as const;
        if (typeof current === "number") return { applied: true, value: operation === "relative" ? current + operand : current * operand } as const;
        if (current === undefined && operation === "relative") return { applied: true, value: operand } as const;
        return { applied: false } as const;
    }
}
