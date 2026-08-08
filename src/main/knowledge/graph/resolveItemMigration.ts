import { TItemMigrationResolution } from "./types/TItemMigrationResolution";
import { TItemMigration } from "./types/TItemMigration";

export function resolveItemMigration(migrations: ReadonlyMap<string, TItemMigration>, id: string, targetExists: (id: string) => boolean): TItemMigrationResolution | null {
    const chain = [id];
    const visited = new Set(chain);
    let current = id;
    let variant: string | undefined = undefined;
    while (!targetExists(current)) {
        const migration = migrations.get(current);
        if (migration?.replace === undefined || visited.has(migration.replace)) return null;
        variant = migration.variant ?? variant;
        current = migration.replace;
        visited.add(current);
        chain.push(current);
    }
    return { targetId: current, chain, ...(variant === undefined ? {} : { variant }) };
}
