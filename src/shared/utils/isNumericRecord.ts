import { TJsonRecord } from "../../main/knowledge/types/TJsonRecord";

export function isNumericRecord(value: unknown): value is TJsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value) && Object.values(value).every((entry) => typeof entry === "number");
}
