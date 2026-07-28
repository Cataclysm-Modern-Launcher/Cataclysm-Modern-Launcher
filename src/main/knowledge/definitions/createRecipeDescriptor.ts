import { TKnowledgeTypeDescriptor } from "../types/TKnowledgeTypeDescriptor";
import { readStringField } from "../utils/readStringField";

export function createRecipeDescriptor(jsonType: "recipe" | "uncraft"): TKnowledgeTypeDescriptor {
    return {
        canonicalType: jsonType,
        cardinality: "single",
        identify(definition) {
            const identity = identifyRecipe(definition.raw, jsonType);
            if (identity !== null) return identity;
            if (readStringField(definition.raw, "copy-from") !== null) return { kind: "deferred", reason: "requires-inheritance" };
            return { kind: "unknown", fallback: `${definition.sourceFile}#${definition.sequence}` };
        },
        getParentId(value) {
            return readStringField(value, "copy-from");
        },
        resolveIdentity(_definition, resolvedRaw) {
            const identity = identifyRecipe(resolvedRaw, jsonType);
            if (identity === null) return null;
            return { value: identity.value, aliases: identity.aliases };
        }
    };
}

type R = { kind: "explicit"; value: string; aliases: string[]; field: "result" | "id" | "abstract" } | { kind: "composite"; value: string; aliases: string[]; fields: ("result" | "id_suffix" | "variant")[] } | null;

function identifyRecipe(raw: Record<string, unknown>, jsonType: "recipe" | "uncraft"): R {
    // Uncraft definitions commonly inherit from an abstract template while each
    // concrete definition is identified by its result. Treating abstract as the
    // entity id collapses unrelated disassembly recipes into the template.
    if (jsonType === "uncraft") {
        const resultIdentity = identifyByResult(raw);
        if (resultIdentity !== null) return resultIdentity;
    }

    for (const field of ["id", "abstract"] as const) {
        const value = readStringField(raw, field);
        if (value !== null) return { kind: "explicit" as const, value, aliases: [value], field };
    }

    return identifyByResult(raw);
}

function identifyByResult(raw: Record<string, unknown>): R {
    const result = readStringField(raw, "result");
    if (result === null) return null;

    const suffix = readStringField(raw, "id_suffix");
    const variant = readStringField(raw, "variant");
    const parts = [result, suffix, variant].filter((value): value is string => value !== null);
    const value = parts.join(":");
    const aliases = createRecipeAliases(result, suffix, variant, value);

    return parts.length === 1
        ? { kind: "explicit" as const, value, aliases, field: "result" as const }
        : {
              kind: "composite" as const,
              value,
              aliases,
              fields: ["result", ...(suffix === null ? [] : ["id_suffix" as const]), ...(variant === null ? [] : ["variant" as const])]
          };
}

function createRecipeAliases(result: string, suffix: string | null, variant: string | null, value: string): string[] {
    const aliases = new Set<string>([value, result]);
    if (suffix !== null) aliases.add(`${result}_${suffix}`);
    if (variant !== null) aliases.add(`${result}_${variant}`);
    return [...aliases];
}
