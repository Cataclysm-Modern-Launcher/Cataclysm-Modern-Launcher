import { TJsonRecord } from "../types/TJsonRecord";

export function readStringField(value: TJsonRecord, field: string): string | null {
    const candidate = value[field];
    return typeof candidate === "string" && candidate.length > 0 ? candidate : null;
}
