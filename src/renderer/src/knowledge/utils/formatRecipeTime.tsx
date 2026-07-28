import { KnowledgeRecipe } from "@shared/knowledge/KnowledgeRecipe";

export function formatRecipeTime(value: KnowledgeRecipe["time"], multiplier: number): string | null {
    if (value === null) return null;
    let seconds: number | null = null;
    if (typeof value === "number") seconds = value / 100;
    else {
        const match = value.trim().match(/^([\d.]+)\s*(s|m|h|d)$/i);
        if (match !== null) {
            const amount = Number(match[1]);
            const unit = match[2].toLowerCase();
            seconds = amount * ({ s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1);
        }
    }
    if (seconds === null || !Number.isFinite(seconds)) return String(value);
    let remaining = Math.round(seconds * multiplier);
    const days = Math.floor(remaining / 86400);
    remaining %= 86400;
    const hours = Math.floor(remaining / 3600);
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    remaining %= 60;
    return (
        [
            [days, "d"],
            [hours, "h"],
            [minutes, "m"],
            [remaining, "s"]
        ]
            .filter(([amount]) => Number(amount) > 0)
            .map(([amount, unit]) => `${amount} ${unit}`)
            .join(" ") || "0 s"
    );
}
