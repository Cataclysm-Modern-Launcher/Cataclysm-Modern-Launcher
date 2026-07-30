export function isTupleArray(value: unknown): value is Array<[string, number]> {
    return Array.isArray(value) && value.every((entry) => Array.isArray(entry) && entry.length >= 2 && typeof entry[0] === "string" && typeof entry[1] === "number");
}
