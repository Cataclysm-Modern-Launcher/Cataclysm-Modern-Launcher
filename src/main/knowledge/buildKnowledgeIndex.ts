import { KnowledgeDiagnostics } from "./KnowledgeDiagnostics";
import { identifyDefinitions } from "./definitions/identifyDefinitions";
import { resolveKnowledgeDefinitions } from "./resolution/resolveKnowledgeDefinitions";
import { buildKnowledgeEntity } from "./entities/buildKnowledgeEntity";
import { TKnowledgeIndex } from "./types/TKnowledgeIndex";
import { TKnowledgeIndexContext } from "./types/TKnowledgeIndexContext";
import { TKnowledgeSource } from "./types/TKnowledgeSource";
import { join, relative } from "node:path";
import { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { parse } from "jsonc-parser";
import { TKnowledgeScanResult } from "./types/TKnowledgeScanResult";
import { TScannedKnowledgeDefinition } from "./types/TScannedKnowledgeDefinition";
import { isRecord } from "../utils/isRecord";

export async function buildKnowledgeIndex(context: TKnowledgeIndexContext, onProgress: (progress: ScanProgress) => void): Promise<TKnowledgeIndex> {
    const diagnostics = new KnowledgeDiagnostics();
    const sources = await resolveKnowledgeSources(context);
    const scan = await scanKnowledgeJsonDefinitions(sources, diagnostics, onProgress);
    const identified = identifyDefinitions(scan.definitions, diagnostics);
    const resolved = resolveKnowledgeDefinitions(identified, diagnostics);
    const entities = resolved.map(buildKnowledgeEntity);

    diagnostics.flush(scan.summary, entities.length);
    console.info(`[knowledge:index] built entities=${entities.length} rawDefinitions=${scan.definitions.length} sources=${sources.length}`);
    return { entities, modIds: context.modIds, sourceCount: sources.length, rawDefinitionCount: scan.definitions.length };
}

type ScanProgress = { processedFiles: number; totalFiles: number };

async function resolveKnowledgeSources(context: TKnowledgeIndexContext): Promise<TKnowledgeSource[]> {
    const userMods = await findModRoots(join(context.userdataPath, "mods"));
    const bundledMods = await findModRoots(join(context.bundlePath, "data", "mods"));
    const sources: TKnowledgeSource[] = [];
    for (const [order, modId] of context.modIds.entries()) {
        if (modId === "dda") {
            sources.push({ modId, rootPath: join(context.bundlePath, "data", "json"), order });
            continue;
        }
        const rootPath = userMods.get(modId) ?? bundledMods.get(modId);
        if (rootPath === undefined) {
            console.warn(`[knowledge:index] active mod source not found mod=${modId}`);
            continue;
        }
        sources.push({ modId, rootPath, order });
    }
    console.info(
        `[knowledge:index] resolved ${sources.length}/${context.modIds.length} active sources`,
        sources.map((source) => ({ modId: source.modId, rootPath: source.rootPath }))
    );
    return sources;
}

async function findModRoots(rootPath: string): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    let entries: Dirent[];
    try {
        entries = (await readdir(rootPath, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name));
    } catch {
        return result;
    }
    for (const entry of entries) {
        const path = join(rootPath, entry.name);
        const directory = entry.isDirectory() || (entry.isSymbolicLink() && (await stat(path).catch(() => null))?.isDirectory());
        if (!directory) continue;
        for (const id of await readModIdentifiers(path)) result.set(id, path);
    }
    return result;
}

async function readModIdentifiers(rootPath: string): Promise<string[]> {
    try {
        const parsed = parse(await readFile(join(rootPath, "modinfo.json"), "utf8")) as unknown;
        const values = Array.isArray(parsed) ? parsed : [parsed];
        return values.flatMap((value) => (isRecord(value) && value.type === "MOD_INFO" && typeof value.id === "string" ? [value.id] : typeof value.ident === "string" ? [value.ident] : []));
    } catch {
        return [];
    }
}

async function scanKnowledgeJsonDefinitions(sources: TKnowledgeSource[], diagnostics: KnowledgeDiagnostics, onProgress: (progress: ScanProgress) => void): Promise<TKnowledgeScanResult> {
    const sourceFiles = (await Promise.all(sources.map(async (source) => ({ source, files: await listJsonFiles(source.rootPath) })))).flatMap(({ source, files }) => files.map((file) => ({ source, file })));
    onProgress({ processedFiles: 0, totalFiles: sourceFiles.length });
    const result: TScannedKnowledgeDefinition[] = [];
    let sequence = 0;
    let parsedFiles = 0;
    let failedFiles = 0;
    let skippedUntypedDefinitions = 0;

    for (const [index, entry] of sourceFiles.entries()) {
        try {
            const text = await readFile(entry.file, "utf8");
            const parsed = parse(text) as unknown;
            const values = Array.isArray(parsed) ? parsed.filter(isRecord) : isRecord(parsed) ? [parsed] : [];

            parsedFiles += 1;
            for (const raw of values) {
                if (typeof raw.type !== "string" || raw.type.length === 0) {
                    skippedUntypedDefinitions += 1;
                    diagnostics.observeUntypedDefinition(entry.source.modId, relative(entry.source.rootPath, entry.file), raw);
                    continue;
                }
                const definition: TScannedKnowledgeDefinition = {
                    jsonType: raw.type,
                    sourceModId: entry.source.modId,
                    sourceFile: relative(entry.source.rootPath, entry.file),
                    sequence: sequence++,
                    raw
                };
                diagnostics.observeType(definition);
                result.push(definition);
            }
        } catch (error) {
            failedFiles += 1;
            diagnostics.observeParseFailure(entry.source.modId, entry.file, error);
        }
        if ((index + 1) % 100 === 0 || index + 1 === sourceFiles.length) onProgress({ processedFiles: index + 1, totalFiles: sourceFiles.length });
    }

    return {
        definitions: result,
        summary: {
            discoveredFiles: sourceFiles.length,
            parsedFiles,
            failedFiles,
            typedDefinitions: result.length,
            skippedUntypedDefinitions
        }
    };
}

async function listJsonFiles(rootPath: string): Promise<string[]> {
    const result: string[] = [];
    let entries: Dirent[];
    try {
        entries = (await readdir(rootPath, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name));
    } catch {
        return result;
    }
    for (const entry of entries) {
        const path = join(rootPath, entry.name);
        if (entry.isDirectory()) result.push(...(await listJsonFiles(path)));
        else if (entry.isSymbolicLink()) {
            const target = await stat(path).catch(() => null);
            if (target?.isDirectory()) result.push(...(await listJsonFiles(path)));
            else if (target?.isFile() && entry.name.endsWith(".json") && entry.name !== "modinfo.json") result.push(path);
        } else if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "modinfo.json") result.push(path);
    }
    return result;
}
