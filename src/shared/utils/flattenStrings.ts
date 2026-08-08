export function flattenStrings(value: unknown): string[] {
    if (typeof value === "string") return [value];
    if (!Array.isArray(value)) return [];
    return value.flatMap(flattenStrings);
}
