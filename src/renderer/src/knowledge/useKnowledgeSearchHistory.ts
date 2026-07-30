import { useCallback, useState } from "react";

const storageKey = "knowledge.search-history";
const limit = 20;

function readHistory(): string[] {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
        return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, limit) : [];
    } catch {
        return [];
    }
}

export function useKnowledgeSearchHistory(): {
    history: string[];
    remember: (query: string) => void;
    clear: () => void;
} {
    const [history, setHistory] = useState(readHistory);
    const remember = useCallback((query: string) => {
        const normalized = query.trim();
        if (normalized.length === 0) return;
        setHistory((current) => {
            const next = [normalized, ...current.filter((item) => item !== normalized)].slice(0, limit);
            localStorage.setItem(storageKey, JSON.stringify(next));
            return next;
        });
    }, []);
    const clear = useCallback(() => {
        localStorage.removeItem(storageKey);
        setHistory([]);
    }, []);
    return { history, remember, clear };
}
