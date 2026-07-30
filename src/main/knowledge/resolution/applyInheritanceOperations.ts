import { TInheritanceResolutionResult } from "./TInheritanceResolutionResult";
import { applyDeleteOperation } from "./applyDeleteOperation";
import { applyExtendOperation } from "./applyExtendOperation";
import { applyNumericOperation } from "./applyNumericOperation";
import { TJsonRecord } from "../types/TJsonRecord";

const OPERATION_FIELDS = new Set(["extend", "delete", "relative", "proportional"]);

export function applyInheritanceOperations(value: TJsonRecord, canonicalType: string): TInheritanceResolutionResult {
    let result = withoutOperationFields(value);
    const appliedOperations: string[] = [];
    const unsupportedOperations: TInheritanceResolutionResult["unsupportedOperations"] = [];

    if (Object.hasOwn(value, "extend")) {
        result = applyExtendOperation(result, value.extend, canonicalType);
        appliedOperations.push("extend");
    }
    if (Object.hasOwn(value, "delete")) {
        result = applyDeleteOperation(result, value.delete);
        appliedOperations.push("delete");
    }
    for (const operation of ["relative", "proportional"] as const) {
        if (!Object.hasOwn(value, operation)) continue;
        const resolved = applyNumericOperation(result, value[operation], operation, canonicalType);
        result = resolved.value;
        appliedOperations.push(operation);
        if (resolved.unsupportedPaths.length > 0) unsupportedOperations.push({ operation, paths: deduplicate(resolved.unsupportedPaths) });
    }

    return { value: result, appliedOperations, unsupportedOperations };
}

function withoutOperationFields(value: TJsonRecord): TJsonRecord {
    return Object.fromEntries(Object.entries(value).filter(([field]) => !OPERATION_FIELDS.has(field)));
}

function deduplicate<T extends { path: string; reason: string; current?: string; operand?: string }>(values: T[]): T[] {
    return [...new Map(values.map((value) => [`${value.reason}:${value.path}:${value.current ?? ""}:${value.operand ?? ""}`, value])).values()];
}
