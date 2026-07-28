import { NumericOperation } from "../applyNumericOperation";
import { TScalarOperationResult } from "./TScalarOperationResult";

type QuantityPart = { amount: number; unit: string };

const QUANTITY_PATTERN = /([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*([^\d+\-.]+?)(?=\s*[+-]?(?:\d|\.)|$)/g;

export function applyQuantityStringScalarOperation(current: unknown, operand: unknown, operation: NumericOperation): TScalarOperationResult {
    if (typeof current !== "string") return { applied: false } as const;
    const currentParts = parseQuantity(current);
    if (currentParts === null) return { applied: false } as const;

    if (operation === "proportional" && typeof operand === "number") {
        return { applied: true, value: formatQuantity(currentParts.map((part) => ({ ...part, amount: part.amount * operand }))) } as const;
    }
    if (operation === "relative" && typeof operand === "string") {
        const operandParts = parseQuantity(operand);
        if (operandParts === null) return { applied: false } as const;
        const result = [...currentParts];
        for (const operandPart of operandParts) {
            const index = result.findIndex((part) => part.unit === operandPart.unit);
            if (index < 0) result.push(operandPart);
            else result[index] = { ...result[index], amount: result[index].amount + operandPart.amount };
        }
        return { applied: true, value: formatQuantity(result) } as const;
    }
    return { applied: false } as const;
}

function parseQuantity(value: string): QuantityPart[] | null {
    const parts: QuantityPart[] = [];
    let consumed = "";
    for (const match of value.matchAll(QUANTITY_PATTERN)) {
        const amount = Number(match[1]);
        const unit = match[2].trim();
        if (!Number.isFinite(amount) || unit.length === 0) return null;
        parts.push({ amount, unit });
        consumed += match[0];
    }
    if (parts.length === 0 || normalizeWhitespace(consumed) !== normalizeWhitespace(value)) return null;
    return parts;
}

function formatQuantity(parts: QuantityPart[]): string {
    return parts.map((part) => `${formatNumber(part.amount)} ${part.unit}`).join(" ");
}

function formatNumber(value: number): string {
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toFixed(6)));
}

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, " ").trim();
}
