import { TJsonRecord } from "../types/TJsonRecord";

const OPERATION_FIELDS = new Set(["extend", "delete", "relative", "proportional"]);

export function mergeJsonDefinitions(parent: TJsonRecord | undefined, value: TJsonRecord): TJsonRecord {
    const childFields = Object.fromEntries(Object.entries(value).filter(([field]) => !OPERATION_FIELDS.has(field)));
    if (parent === undefined) return childFields;
    return { ...parent, ...childFields };
}
