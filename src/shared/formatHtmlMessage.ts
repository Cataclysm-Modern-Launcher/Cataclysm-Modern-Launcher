import { FormatArgs } from "./FormatArgs";
import { formatMessage } from "./formatMessage";

const HTML_ESCAPE_MAP: Readonly<Record<string, string>> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};

export function formatHtmlMessage(message: string, variables: FormatArgs = {}): string {
    const escapedVariables = Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, value === null || value === undefined ? value : escapeHtml(String(value))]));
    return formatMessage(message, escapedVariables);
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}
