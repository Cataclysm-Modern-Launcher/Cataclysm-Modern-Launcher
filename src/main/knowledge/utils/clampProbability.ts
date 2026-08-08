export function clampProbability(value: number): number {
    return Math.max(0, Math.min(1, value));
}
