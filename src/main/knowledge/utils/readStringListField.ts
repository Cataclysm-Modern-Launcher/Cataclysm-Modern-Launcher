import { flattenStrings } from "../../utils/flattenStrings";
import { TJsonRecord } from "../types/TJsonRecord";

export function readStringListField(value: TJsonRecord, field: string): string[] {
    return uniqueNonEmptyStrings(flattenStrings(value[field]));
}

function uniqueNonEmptyStrings(values: string[]): string[] {
    return [...new Set(values.filter((value) => value.length > 0))];
}
