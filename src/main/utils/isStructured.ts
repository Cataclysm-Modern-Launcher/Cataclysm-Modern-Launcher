import { isRecord } from "./isRecord";

export function isStructured(value: unknown): boolean {
    return Array.isArray(value) || isRecord(value);
}
