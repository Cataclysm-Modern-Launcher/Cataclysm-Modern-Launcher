import { NumericOperation } from "../applyNumericOperation";
import { TScalarOperationResult } from "./TScalarOperationResult";

const MONEY_UNITS: Record<string, number> = {
    cents: 1,
    cent: 1,
    dollars: 100,
    dollar: 100,
    USD: 100,
    kUSD: 100_000
};

const MONEY_PART_PATTERN = /([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*(cents|cent|dollars|dollar|USD|kUSD)(?=\s|$)/g;

export function applyMoneyStringScalarOperation(current: unknown, operand: unknown, operation: NumericOperation): TScalarOperationResult {
    if (typeof current !== "string") return { applied: false } as const;
    const currentCents = parseMoney(current);
    if (currentCents === null) return { applied: false } as const;

    if (operation === "proportional" && typeof operand === "number") {
        // units::money stores integer cents. Assigning the multiplied quantity
        // back to quantity<int> truncates toward zero, matching the game.
        return { applied: true, value: formatMoney(Math.trunc(currentCents * operand)) } as const;
    }

    if (operation === "relative" && typeof operand === "string") {
        const operandCents = parseMoney(operand);
        if (operandCents === null) return { applied: false } as const;
        return { applied: true, value: formatMoney(currentCents + operandCents) } as const;
    }

    return { applied: false } as const;
}

function parseMoney(value: string): number | null {
    let cents = 0;
    let consumed = "";
    for (const match of value.matchAll(MONEY_PART_PATTERN)) {
        const amount = Number(match[1]);
        const unit = match[2];
        if (!Number.isFinite(amount)) return null;
        cents += amount * MONEY_UNITS[unit];
        consumed += match[0];
    }
    if (consumed.replace(/\s+/g, "").length !== value.replace(/\s+/g, "").length) return null;
    return Number.isFinite(cents) ? Math.trunc(cents) : null;
}

function formatMoney(cents: number): string {
    const sign = cents < 0 ? "-" : "";
    const absolute = Math.abs(cents);
    const dollars = Math.trunc(absolute / 100);
    const remainingCents = absolute % 100;
    if (dollars === 0) return `${sign}${remainingCents} cent`;
    if (remainingCents === 0) return `${sign}${dollars} USD`;
    return `${sign}${dollars} USD ${remainingCents} cent`;
}
