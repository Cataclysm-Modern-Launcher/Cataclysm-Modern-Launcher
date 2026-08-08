export function appendMapValue<TKey, TValue>(map: Map<TKey, TValue[]>, key: TKey, value: TValue): void {
    const values = map.get(key);
    if (values === undefined) map.set(key, [value]);
    else values.push(value);
}
