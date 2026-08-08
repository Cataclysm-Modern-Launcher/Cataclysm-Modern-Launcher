import { TResolvedKnowledgeDefinition } from "../types/TResolvedKnowledgeDefinition";
import { TItemMigration } from "./types/TItemMigration";

export function buildItemMigrationMap(definitions: TResolvedKnowledgeDefinition[]): Map<string, TItemMigration> {
    const migrations = new Map<string, TItemMigration>();
    for (const definition of definitions) {
        if (definition.canonicalType !== "MIGRATION") continue;
        const replace = typeof definition.raw.replace === "string" ? definition.raw.replace : undefined;
        const variant = typeof definition.raw.variant === "string" ? definition.raw.variant : undefined;
        for (const id of [definition.effectiveId, ...definition.effectiveAliases]) migrations.set(id, { replace, variant });
    }
    return migrations;
}
