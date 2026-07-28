import { TJsonRecord } from "../knowledge/types/TJsonRecord";

export function cloneRecord(value: TJsonRecord): TJsonRecord {
    return { ...value };
}
