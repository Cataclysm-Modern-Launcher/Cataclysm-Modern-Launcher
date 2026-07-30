import { TJsonRecord } from "@shared/TJsonRecord";

export function cloneRecord(value: TJsonRecord): TJsonRecord {
    return { ...value };
}
