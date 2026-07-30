import { deepEqual } from "../utils/deepEqual";
import { TJsonRecord } from "../types/TJsonRecord";
import { isRecord } from "@shared/utils/isRecord";

export function applyDeleteOperation(target: TJsonRecord, operation: unknown): TJsonRecord {
    if (!isRecord(operation)) return target;
    const result = { ...target };
    for (const [field, deletion] of Object.entries(operation)) {
        const current = result[field];
        if (Array.isArray(current) && Array.isArray(deletion)) {
            result[field] = current.filter((entry) => !deletion.some((candidate) => deepEqual(entry, candidate)));
        } else if (isRecord(current) && isRecord(deletion)) {
            const next = { ...current };
            for (const key of Object.keys(deletion)) delete next[key];
            result[field] = next;
        } else if (deletion === true) {
            delete result[field];
        }
    }
    return result;
}
