import { TJsonRecord } from "../types/TJsonRecord";
import { isRecord } from "../../utils/isRecord";
import { cloneJsonValue } from "../utils/cloneJsonValue";

export function applyExtendOperation(target: TJsonRecord, operation: unknown): TJsonRecord {
    if (!isRecord(operation)) return target;
    const result = { ...target };
    for (const [field, extension] of Object.entries(operation)) {
        const current = result[field];
        if (Array.isArray(current) && Array.isArray(extension)) result[field] = [...current, ...extension];
        else if (isRecord(current) && isRecord(extension)) result[field] = { ...current, ...extension };
        else if (current === undefined) result[field] = cloneJsonValue(extension);
    }
    return result;
}
