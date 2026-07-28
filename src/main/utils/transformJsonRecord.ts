import { TJsonRecord } from "../knowledge/types/TJsonRecord";

export function transformJsonRecord(value: TJsonRecord, transform: (value: number) => number): TJsonRecord {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, transform(entry as number)]));
}
