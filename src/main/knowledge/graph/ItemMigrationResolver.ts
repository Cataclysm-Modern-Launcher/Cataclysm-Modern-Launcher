import { TResolvedKnowledgeDefinition } from "../types/TResolvedKnowledgeDefinition";
import { TItemMigrationResolution } from "./types/TItemMigrationResolution";

export class ItemMigrationResolver {
    private readonly migrations = new Map<string, { replace?: string; variant?: string }>();

    constructor(definitions: TResolvedKnowledgeDefinition[]) {
        for (const definition of definitions) {
            if (definition.canonicalType !== "MIGRATION") continue;
            const replace = typeof definition.raw.replace === "string" ? definition.raw.replace : undefined;
            const variant = typeof definition.raw.variant === "string" ? definition.raw.variant : undefined;
            for (const id of [definition.effectiveId, ...definition.effectiveAliases]) this.migrations.set(id, { replace, variant });
        }
    }

    resolve(id: string, targetExists: (id: string) => boolean): TItemMigrationResolution | null {
        const chain = [id];
        const visited = new Set(chain);
        let current = id;
        let variant: string | undefined = undefined;
        while (!targetExists(current)) {
            const migration = this.migrations.get(current);
            if (migration?.replace === undefined || visited.has(migration.replace)) return null;
            variant = migration.variant ?? variant;
            current = migration.replace;
            visited.add(current);
            chain.push(current);
        }
        return { targetId: current, chain, ...(variant === undefined ? {} : { variant }) };
    }
}
