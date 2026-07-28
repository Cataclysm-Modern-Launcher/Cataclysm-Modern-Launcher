import { NumericOperation } from "../applyNumericOperation";
import { TJsonRecord } from "../../types/TJsonRecord";
import { isNumericRecord } from "../../../utils/isNumericRecord";
import { transformJsonRecord } from "../../../utils/transformJsonRecord";
import { TStructuralOperationResult } from "./TStructuralOperationResult";

export function applyDamageMapOperation(current: unknown, operand: unknown, operation: NumericOperation, path: string): TStructuralOperationResult {
    if (!isSupportedPath(path) || !isNumericRecord(current)) return { applied: false };

    if (operation === "proportional" && typeof operand === "number" && path.endsWith("armor")) {
        return { applied: true, value: transformJsonRecord(current, (value) => value * operand) };
    }
    if (!isNumericRecord(operand)) return { applied: false };

    const result: TJsonRecord = { ...current };
    const allMultiplier = operation === "proportional" ? operand.all : undefined;
    if (path.endsWith("melee_damage") && typeof allMultiplier === "number") {
        for (const [damageType, existing] of Object.entries(result)) {
            if (typeof existing === "number") result[damageType] = Math.floor(existing * allMultiplier);
        }
    }
    for (const [damageType, value] of Object.entries(operand)) {
        if (damageType === "all") continue;
        if (typeof value !== "number") return { applied: false, reason: "type-mismatch" };
        const existing = result[damageType];

        // item_melee_damage::operator+= and resistances::operator+= use map
        // semantics. Missing damage types start at zero for relative changes.
        if (operation === "relative") {
            if (path.endsWith("melee_damage") && typeof existing !== "number") continue;
            const next = (typeof existing === "number" ? existing : 0) + value;
            result[damageType] = path.endsWith("melee_damage") ? Math.floor(next) : next;
            continue;
        }

        // item_melee_damage::handle_proportional only modifies existing types.
        if (typeof existing !== "number") continue;
        const next = existing * value;
        result[damageType] = path.endsWith("melee_damage") ? Math.floor(next) : next;
    }
    return { applied: true, value: result };
}

function isSupportedPath(path: string): boolean {
    const field = path.split(".").at(-1);
    return field === "melee_damage" || field === "armor";
}
