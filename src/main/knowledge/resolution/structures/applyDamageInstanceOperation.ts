import { NumericOperation } from "../applyNumericOperation";
import { TJsonRecord } from "@shared/TJsonRecord";
import { cloneRecord } from "../../../utils/cloneRecord";
import { isRecord } from "@shared/utils/isRecord";
import { readString } from "@shared/utils/readString";
import { TStructuralOperationResult } from "./TStructuralOperationResult";

const DAMAGE_FIELDS = ["amount", "damage_multiplier", "armor_penetration", "armor_multiplier", "constant_armor_multiplier", "constant_damage_multiplier"] as const;

export function applyDamageInstanceOperation(current: unknown, operand: unknown, operation: NumericOperation, path: string): TStructuralOperationResult {
    if (!isDamagePath(path)) return { applied: false };
    const currentUnits = readDamageUnits(current);
    const operandUnits = readDamageUnits(operand);
    if (currentUnits === null || operandUnits === null) return { applied: false };

    const result = currentUnits.units.map((unit) => cloneRecord(unit));
    for (const operationUnit of operandUnits.units) {
        const damageType = readString(operationUnit.damage_type);
        if (damageType === null) return { applied: false, reason: "type-mismatch" };
        const index = result.findIndex((unit) => unit.damage_type === damageType);
        if (index < 0) return { applied: false, reason: "missing-target" };
        const applied = operation === "proportional" ? applyProportional(result[index], operationUnit) : applyRelative(result[index], operationUnit);
        if (!applied) return { applied: false, reason: "type-mismatch" };
    }

    return { applied: true, value: currentUnits.wasArray ? result : result[0] };
}

function applyProportional(target: TJsonRecord, operation: TJsonRecord): boolean {
    for (const field of DAMAGE_FIELDS) {
        const scalar = operation[field] === undefined ? 1 : operation[field];
        if (typeof scalar !== "number" || scalar <= 0 || (scalar === 1 && operation[field] !== undefined)) {
            if (operation[field] !== undefined) return false;
            continue;
        }
        const current = target[field] === undefined ? defaultDamageValue(field) : target[field];
        if (typeof current !== "number") return false;
        target[field] = current * scalar;
    }

    const amountScalar = operation.amount;
    if (Array.isArray(target.barrels) && typeof amountScalar === "number") {
        target.barrels = target.barrels.map((barrel) => {
            if (!isRecord(barrel) || typeof barrel.amount !== "number") return barrel;
            return { ...barrel, amount: barrel.amount * amountScalar };
        });
    }
    return true;
}

function applyRelative(target: TJsonRecord, operation: TJsonRecord): boolean {
    for (const field of DAMAGE_FIELDS) {
        if (operation[field] === undefined) continue;
        const delta = operation[field];
        if (typeof delta !== "number") return false;
        // damage_instance::operator+= treats the default multiplier value 1 as zero.
        if (isMultiplierField(field) && delta === 1) continue;
        // The C++ operator currently does not add constant_armor_multiplier.
        if (field === "constant_armor_multiplier") continue;
        const current = target[field] === undefined ? defaultDamageValue(field) : target[field];
        if (typeof current !== "number") return false;
        target[field] = current + delta;
    }

    const amountDelta = operation.amount;
    if (Array.isArray(target.barrels) && typeof amountDelta === "number") {
        target.barrels = target.barrels.map((barrel) => {
            if (!isRecord(barrel) || typeof barrel.amount !== "number") return barrel;
            return { ...barrel, amount: barrel.amount + amountDelta };
        });
    }
    return true;
}

function defaultDamageValue(field: (typeof DAMAGE_FIELDS)[number]): number {
    return isMultiplierField(field) ? 1 : 0;
}

function isMultiplierField(field: (typeof DAMAGE_FIELDS)[number]): boolean {
    return field === "damage_multiplier" || field === "armor_multiplier" || field === "constant_armor_multiplier" || field === "constant_damage_multiplier";
}

function readDamageUnits(value: unknown): { units: TJsonRecord[]; wasArray: boolean } | null {
    if (isRecord(value) && typeof value.damage_type === "string") return { units: [value], wasArray: false };
    if (Array.isArray(value) && value.every((entry) => isRecord(entry) && typeof entry.damage_type === "string")) {
        return { units: value, wasArray: true };
    }
    return null;
}

function isDamagePath(path: string): boolean {
    const field = path.split(".").at(-1);
    return field === "damage" || field === "shot_damage" || field === "melee_damage";
}
