import { isRecord } from "@shared/utils/isRecord";

export function cloneJsonValue(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(cloneJsonValue);
    if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneJsonValue(entry)]));
    return value;
}
