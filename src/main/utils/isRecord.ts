import { TJsonRecord } from "../knowledge/types/TJsonRecord";

export function isRecord(value: unknown): value is TJsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
