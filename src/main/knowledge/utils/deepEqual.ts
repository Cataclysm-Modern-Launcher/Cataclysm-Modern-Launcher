import { isRecord } from "../../utils/isRecord";

export function deepEqual(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) return true;
    if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length && left.every((value, index) => deepEqual(value, right[index]));
    }
    if (isRecord(left) && isRecord(right)) {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        return leftKeys.length === rightKeys.length && leftKeys.every((key) => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
    }
    return false;
}
