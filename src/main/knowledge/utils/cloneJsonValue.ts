import { isRecord } from "@shared/utils/isRecord";

export function cloneJsonValue<T>(value: T): T {
    if (Array.isArray(value)) return value.map(cloneJsonValue) as T;
    if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneJsonValue(entry)])) as T;
    return value;
}
