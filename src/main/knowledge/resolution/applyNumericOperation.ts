import { applyScalarOperation } from "./scalars/applyScalarOperation";
import { applyStructuralOperation } from "./structures/applyStructuralOperation";
import { getDefinitionDefault } from "./defaults/getDefinitionDefault";
import { TJsonRecord } from "@shared/TJsonRecord";
import { isRecord } from "@shared/utils/isRecord";
import { isStructured } from "@shared/utils/isStructured";

export type NumericOperation = "relative" | "proportional";
export type UnsupportedNumericReason = "missing-target" | "type-mismatch" | "unsupported-structure";

export type UnsupportedNumericPath = {
    path: string;
    reason: UnsupportedNumericReason;
    current?: string;
    operand?: string;
};

export type NumericOperationResult = {
    value: TJsonRecord;
    unsupportedPaths: UnsupportedNumericPath[];
};

export function applyNumericOperation(target: TJsonRecord, operation: unknown, kind: NumericOperation, canonicalType: string): NumericOperationResult {
    if (!isRecord(operation)) {
        return { value: target, unsupportedPaths: [{ path: "<root>", reason: "type-mismatch", operand: preview(operation) }] };
    }
    const unsupportedPaths: UnsupportedNumericPath[] = [];
    const value = applyObject(target, operation, kind, "", unsupportedPaths, canonicalType);
    return { value, unsupportedPaths };
}

function applyObject(target: TJsonRecord, operation: TJsonRecord, kind: NumericOperation, path: string, unsupported: UnsupportedNumericPath[], canonicalType: string): TJsonRecord {
    const result = { ...target };
    for (const [field, operand] of Object.entries(operation)) {
        const fieldPath = path.length === 0 ? field : `${path}.${field}`;
        if (canonicalType === "ITEM" && fieldPath === "encumbrance" && typeof operand === "number") {
            const armor = applyArmorEncumbrance(result.armor, operand, kind);
            if (armor !== undefined) {
                result.armor = armor;
                continue;
            }
        }
        const current = result[field] ?? getDefinitionDefault(canonicalType, fieldPath);
        const next = applyValue(current, operand, kind, fieldPath, unsupported, canonicalType);
        if (next.applied) result[field] = next.value;
    }
    return result;
}

function applyValue(current: unknown, operand: unknown, kind: NumericOperation, path: string, unsupported: UnsupportedNumericPath[], canonicalType: string): { applied: boolean; value: unknown } {
    if ((typeof current === "string" || typeof current === "boolean") && current === operand) return { applied: true, value: current };

    const scalar = applyScalarOperation(current, operand, kind);
    if (scalar.applied) return scalar;

    const structural = applyStructuralOperation(current, operand, kind, path);
    if (structural.applied) return structural;
    if ("reason" in structural && structural.reason !== undefined) {
        unsupported.push(createUnsupported(path, structural.reason, current, operand));
        return { applied: false, value: current };
    }

    if (isRecord(current) && isRecord(operand)) return { applied: true, value: applyObject(current, operand, kind, path, unsupported, canonicalType) };
    if (current === undefined && isRecord(operand) && kind === "relative") return { applied: true, value: applyObject({}, operand, kind, path, unsupported, canonicalType) };

    if (Array.isArray(current) && Array.isArray(operand)) {
        const next = [...current];
        for (const operationEntry of operand) {
            const index = findMatchingArrayEntry(next, operationEntry);
            if (index < 0) {
                unsupported.push(createUnsupported(`${path}[]`, "missing-target", undefined, operationEntry));
                continue;
            }
            const applied = applyValue(next[index], operationEntry, kind, `${path}[${index}]`, unsupported, canonicalType);
            if (applied.applied) next[index] = applied.value;
        }
        return { applied: true, value: next };
    }

    const reason = current === undefined ? "missing-target" : isStructured(current) || isStructured(operand) ? "unsupported-structure" : "type-mismatch";
    unsupported.push(createUnsupported(path, reason, current, operand));
    return { applied: false, value: current };
}

function createUnsupported(path: string, reason: UnsupportedNumericReason, current: unknown, operand: unknown): UnsupportedNumericPath {
    return { path, reason, current: preview(current), operand: preview(operand) };
}

function preview(value: unknown): string {
    if (value === undefined) return "<missing>";
    const serialized = typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value);
    if (serialized === undefined) return String(value);
    return serialized.length <= 160 ? serialized : `${serialized.slice(0, 157)}...`;
}

function applyArmorEncumbrance(value: unknown, operand: number, kind: NumericOperation): unknown[] | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.map((entry) => {
        if (!isRecord(entry)) return entry;
        const result = { ...entry };
        for (const field of ["encumbrance", "max_encumbrance"]) {
            const current = result[field];
            const next = applyEncumbranceValue(current, operand, kind);
            if (next !== undefined) result[field] = next;
        }
        return result;
    });
}

function applyEncumbranceValue(value: unknown, operand: number, kind: NumericOperation): unknown {
    if (typeof value === "number" && value > 0) return Math.max(0, kind === "relative" ? value + operand : value * operand);
    if (Array.isArray(value) && value.every((entry) => typeof entry === "number")) {
        return value.map((entry) => (entry > 0 ? Math.max(0, kind === "relative" ? entry + operand : entry * operand) : entry));
    }
    return undefined;
}

const IDENTITY_FIELDS = ["id", "type", "damage_type", "part", "stat", "skill", "proficiency", "quality", "flag"] as const;

function findMatchingArrayEntry(values: unknown[], operationValue: unknown): number {
    if (!isRecord(operationValue)) return -1;
    for (const field of IDENTITY_FIELDS) {
        const identity = operationValue[field];
        if (identity === undefined) continue;
        const index = values.findIndex((value) => isRecord(value) && value[field] === identity);
        if (index >= 0) return index;
    }
    return -1;
}
