import { TJsonRecord } from "../types/TJsonRecord";
import { isRecord } from "@shared/utils/isRecord";
import { cloneJsonValue } from "../utils/cloneJsonValue";

export function applyExtendOperation(target: TJsonRecord, operation: unknown, canonicalType?: string): TJsonRecord {
    if (!isRecord(operation)) return target;
    const result = { ...target };
    for (const [field, extension] of Object.entries(operation)) {
        const current = result[field];
        if (canonicalType === "requirement" && (field === "tools" || field === "components") && Array.isArray(current) && Array.isArray(extension)) {
            result[field] = extendRequirementGroups(current, extension);
        } else if (Array.isArray(current) && Array.isArray(extension)) {
            result[field] = [...current, ...extension];
        } else if (isRecord(current) && isRecord(extension)) {
            result[field] = { ...current, ...extension };
        } else if (current === undefined) {
            result[field] = cloneJsonValue(extension);
        }
    }
    return result;
}

function extendRequirementGroups(current: unknown[], extension: unknown[]): unknown[] {
    const result = current.map((group) => cloneJsonValue(group));
    extension.forEach((extensionGroup, groupIndex) => {
        const currentGroup = result[groupIndex];
        if (Array.isArray(currentGroup) && Array.isArray(extensionGroup)) {
            result[groupIndex] = [...currentGroup, ...cloneJsonValue(extensionGroup)];
        } else {
            result.push(cloneJsonValue(extensionGroup));
        }
    });
    return result;
}
