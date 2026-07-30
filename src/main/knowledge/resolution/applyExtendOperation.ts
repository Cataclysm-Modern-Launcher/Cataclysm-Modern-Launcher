import { TJsonRecord } from "@shared/TJsonRecord";
import { isRecord } from "@shared/utils/isRecord";
import { cloneJsonValue } from "../utils/cloneJsonValue";

const REQUIREMENT_GROUP_FIELDS = new Set(["tools", "components"]);

export function applyExtendOperation(target: TJsonRecord, operation: unknown, canonicalType?: string): TJsonRecord {
    if (!isRecord(operation)) return target;

    const result = cloneJsonValue(target);

    for (const [field, extension] of Object.entries(operation)) {
        const current = result[field];

        if (canonicalType === "requirement" && REQUIREMENT_GROUP_FIELDS.has(field) && Array.isArray(current) && Array.isArray(extension)) {
            result[field] = extendRequirementGroups(current, extension);
            continue;
        }

        if (Array.isArray(current) && Array.isArray(extension)) {
            result[field] = [...current, ...cloneJsonValue(extension)];
            continue;
        }

        if (isRecord(current) && isRecord(extension)) {
            result[field] = {
                ...current,
                ...cloneJsonValue(extension)
            };
            continue;
        }

        if (current === undefined) {
            result[field] = cloneJsonValue(extension);
        }
    }

    return result;
}

function extendRequirementGroups(current: unknown[], extension: unknown[]): unknown[] {
    const result = cloneJsonValue(current);

    for (const [groupIndex, extensionGroup] of extension.entries()) {
        const currentGroup = result[groupIndex];

        if (Array.isArray(currentGroup) && Array.isArray(extensionGroup)) {
            result[groupIndex] = [...currentGroup, ...cloneJsonValue(extensionGroup)];
        } else {
            result.push(cloneJsonValue(extensionGroup));
        }
    }

    return result;
}
