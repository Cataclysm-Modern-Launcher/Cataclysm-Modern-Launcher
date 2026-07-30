export function isString(value: unknown): string | null {
    return typeof value === "string" ? value : null;
}
