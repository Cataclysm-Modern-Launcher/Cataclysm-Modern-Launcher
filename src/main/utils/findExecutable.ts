import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function findExecutable(rootPath: string, executableNames: string[]): Promise<string | null> {
    const candidates = new Set(executableNames.map((name) => name.toLowerCase()));
    const queue = [rootPath];
    while (queue.length > 0) {
        const directory = queue.shift()!;
        const entries = await readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) queue.push(path);
            else if (entry.isFile() && candidates.has(entry.name.toLowerCase())) return path;
        }
    }
    return null;
}
