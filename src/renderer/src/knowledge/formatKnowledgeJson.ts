import { isRecord } from "@shared/utils/isRecord";

const INDENT_SIZE = 2;
const MAX_COLLECTION_LENGTH = 120;
const FORCE_WRAPPED_ARRAY_KEYS = new Set(["rows", "blueprint", "picture"]);

export function formatKnowledgeJson(value: unknown): string {
    const serializedValue = JSON.stringify(value);
    if (serializedValue === undefined) return "undefined";

    const normalizedValue: unknown = JSON.parse(serializedValue);
    return formatValue(normalizedValue, 0);
}

function formatValue(value: unknown, depth: number, forceWrap = false): string {
    if (Array.isArray(value)) return formatArray(value, depth, forceWrap);
    if (isRecord(value)) return formatObject(value, depth, forceWrap);
    return JSON.stringify(value) ?? "null";
}

function formatArray(value: unknown[], depth: number, forceWrap: boolean): string {
    const collectionDepth = depth + 1;

    if (collectionDepth > 1 && !forceWrap) {
        const compactValue = formatCompactArray(value);
        if (compactValue.length <= MAX_COLLECTION_LENGTH) return compactValue;
    }

    if (value.length === 0) return "[]";

    const childIndent = indent(collectionDepth);
    const entries = value.map((entry) => `${childIndent}${formatValue(entry, collectionDepth)}`);

    return `[
${entries.join(",\n")}
${indent(depth)}]`;
}

function formatObject(value: Record<string, unknown>, depth: number, forceWrap: boolean): string {
    const collectionDepth = depth + 1;

    if (collectionDepth > 1 && !forceWrap) {
        const compactValue = formatCompactObject(value);
        if (compactValue.length <= MAX_COLLECTION_LENGTH) return compactValue;
    }

    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";

    const childIndent = indent(collectionDepth);
    const formattedEntries = entries.map(([key, entryValue]) => {
        const forceChildWrap = FORCE_WRAPPED_ARRAY_KEYS.has(key) && Array.isArray(entryValue) && entryValue.length > 1;

        return `${childIndent}${JSON.stringify(key)}: ${formatValue(entryValue, collectionDepth, forceChildWrap)}`;
    });

    return `{
${formattedEntries.join(",\n")}
${indent(depth)}}`;
}

function formatCompactArray(value: unknown[]): string {
    if (value.length === 0) return "[]";
    return `[ ${value.map(formatCompactValue).join(", ")} ]`;
}

function formatCompactObject(value: Record<string, unknown>): string {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";

    return `{ ${entries.map(([key, entryValue]) => `${JSON.stringify(key)}: ${formatCompactValue(entryValue)}`).join(", ")} }`;
}

function formatCompactValue(value: unknown): string {
    if (Array.isArray(value)) return formatCompactArray(value);
    if (isRecord(value)) return formatCompactObject(value);
    return JSON.stringify(value) ?? "null";
}

function indent(depth: number): string {
    return " ".repeat(depth * INDENT_SIZE);
}
