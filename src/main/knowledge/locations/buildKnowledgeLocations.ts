import { KnowledgeEntityDetails } from "@shared/knowledge/KnowledgeEntityDetails";
import { KnowledgeEntityReference } from "@shared/knowledge/KnowledgeEntityReference";
import { KnowledgeLocationDetails, KnowledgeLocationSpawn } from "@shared/knowledge/KnowledgeLocation";
import { isRecord } from "@shared/utils/isRecord";

type Point = { x: number; y: number; z: number; id: string };
type Candidate = { type: "ITEM" | "MONSTER" | "furniture"; id: string; chance: number; approximate: boolean };
export type LocationBuildIndex = {
    by: Map<string, KnowledgeEntityDetails>;
    mapgensByTerrain: Map<string, KnowledgeEntityDetails[]>;
    nestedMapgensById: Map<string, KnowledgeEntityDetails[]>;
    multiOmtGroupsByTerrain: Map<string, Set<string>>;
    multiOmtGroups: Map<string, KnowledgeEntityDetails[]>;
    nestedSpawnCache: Map<string, Candidate[]>;
    mapgenSpawnCache: Map<string, Candidate[]>;
    itemGroupCache: Map<string, Candidate[]>;
    monsterGroupCache: Map<string, Candidate[]>;
    paletteSpawnCache: Map<string, Candidate[]>;
};

export function buildKnowledgeLocations(entities: KnowledgeEntityDetails[], index = createKnowledgeLocationBuildIndex(entities)): KnowledgeEntityDetails[] {
    const { by } = index;
    const referenced = new Set<string>();
    const multiTileReferenced = new Set<string>();
    const emittedSignatures = new Set<string>();
    const campTerrainIds = collectCampTerrainIds(entities, index);
    const locations: KnowledgeEntityDetails[] = [];
    const appearanceGroups = new Map<string, KnowledgeEntityDetails[]>();

    const appendOwner = (owner: KnowledgeEntityDetails, points: Point[]): void => {
        const normalized = points.map((point) => ({ ...point, id: stripRotation(normalizeOter(point.id, by)) }));
        const signature = locationSignature(normalized);
        if (emittedSignatures.has(signature)) return;
        emittedSignatures.add(signature);

        for (const point of normalized) referenced.add(point.id);
        const location = buildDetails(points, owner.raw.subtype === "mutable", index, owner.raw, points.length > 1);
        const entity = toLocation(owner, deriveLocationName(owner, points, by), location);
        locations.push(entity);
        if (owner.jsonType === "overmap_special") appendArray(appearanceGroups, locationAppearanceSignature(points, by), entity);
    };

    for (const owner of entities.filter((entity) => entity.jsonType === "overmap_special")) {
        const points = readSpecialPoints(owner.raw);
        if (points.length === 0) continue;
        appendOwner(owner, points);
        if (isMultiTile(points)) {
            for (const point of points) multiTileReferenced.add(stripRotation(normalizeOter(point.id, by)));
        }
    }

    for (const owner of entities.filter((entity) => entity.jsonType === "city_building")) {
        const points = readSpecialPoints(owner.raw);
        if (points.length === 0) continue;
        const terrainIds = points.map((point) => stripRotation(normalizeOter(point.id, by)));
        if (terrainIds.length > 0 && terrainIds.every((id) => multiTileReferenced.has(id))) continue;
        appendOwner(owner, points);
    }

    for (const terrain of entities.filter((entity) => entity.jsonType === "overmap_terrain" && !entity.abstract)) {
        const aliases = entityAliases(terrain).map(stripRotation);
        if (aliases.some((id) => referenced.has(id) || campTerrainIds.has(id))) continue;
        if (!aliases.some((id) => index.mapgensByTerrain.has(id) || index.multiOmtGroupsByTerrain.has(id))) continue;
        const location = buildDetails([{ x: 0, y: 0, z: 0, id: terrain.id }], false, index, terrain.raw, false);
        locations.push(toLocation(terrain, terrain.name, location));
    }
    applyAppearanceGroups(appearanceGroups);
    return locations;
}

export function buildKnowledgeTerrainLocation(key: string, index: LocationBuildIndex): KnowledgeEntityDetails | null {
    const terrainId = parseTileLocationKey(key);
    if (terrainId === null) return null;

    const terrain = index.by.get(`overmap_terrain:${terrainId}`);
    if (terrain === undefined) return null;

    const location = buildDetails([{ x: 0, y: 0, z: 0, id: terrainId }], false, index, terrain.raw, false);
    return {
        ...toLocation(terrain, terrain.name, location),
        key,
        id: terrainId
    };
}

function tileLocationKey(terrainId: string): string {
    return `LOCATION_TILE:${terrainId}`;
}

function parseTileLocationKey(key: string): string | null {
    const prefix = "LOCATION_TILE:";
    return key.startsWith(prefix) ? key.slice(prefix.length) : null;
}

function isMultiTile(points: Point[]): boolean {
    return new Set(points.map((point) => `${point.x},${point.y}`)).size > 1;
}

export function createKnowledgeLocationBuildIndex(entities: KnowledgeEntityDetails[]): LocationBuildIndex {
    const by = new Map<string, KnowledgeEntityDetails>();
    for (const entity of entities) {
        by.set(`${entity.jsonType}:${entity.id}`, entity);
        if (entity.jsonType === "overmap_terrain") {
            for (const alias of entityAliases(entity)) by.set(`overmap_terrain:${alias}`, entity);
        }
    }
    const mapgensByTerrain = new Map<string, KnowledgeEntityDetails[]>();
    const nestedMapgensById = new Map<string, KnowledgeEntityDetails[]>();
    const multiOmtGroupsByTerrain = new Map<string, Set<string>>();
    const multiOmtGroups = new Map<string, KnowledgeEntityDetails[]>();
    const nestedSpawnCache = new Map<string, Candidate[]>();
    const mapgenSpawnCache = new Map<string, Candidate[]>();
    const itemGroupCache = new Map<string, Candidate[]>();
    const monsterGroupCache = new Map<string, Candidate[]>();
    const paletteSpawnCache = new Map<string, Candidate[]>();

    for (const mapgen of entities) {
        if (mapgen.jsonType !== "mapgen") continue;

        if (isNestedMapgen(mapgen.raw)) {
            const id = mapgen.raw.nested_mapgen_id;
            if (typeof id === "string") appendArray(nestedMapgensById, id, mapgen);
            continue;
        }

        if (isMultiOmtMapgen(mapgen.raw)) {
            const terrainIds = [...new Set(flattenStrings(mapgen.raw.om_terrain).map((id) => stripRotation(normalizeOter(id, by))))];
            const signature = terrainIds.join("\u0000");
            appendArray(multiOmtGroups, signature, mapgen);
            for (const terrainId of terrainIds) {
                let signatures = multiOmtGroupsByTerrain.get(terrainId);
                if (signatures === undefined) {
                    signatures = new Set();
                    multiOmtGroupsByTerrain.set(terrainId, signatures);
                }
                signatures.add(signature);
            }
            continue;
        }

        for (const terrainId of new Set(flattenStrings(mapgen.raw.om_terrain).map(stripRotation))) {
            appendArray(mapgensByTerrain, terrainId, mapgen);
        }
    }

    return {
        by,
        mapgensByTerrain,
        nestedMapgensById,
        multiOmtGroupsByTerrain,
        multiOmtGroups,
        nestedSpawnCache,
        mapgenSpawnCache,
        itemGroupCache,
        monsterGroupCache,
        paletteSpawnCache
    };
}

function appendArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    const values = map.get(key);
    if (values === undefined) map.set(key, [value]);
    else values.push(value);
}

function toLocation(source: KnowledgeEntityDetails, name: string, location: KnowledgeLocationDetails): KnowledgeEntityDetails {
    return {
        key: `LOCATION:${source.jsonType}:${source.id}`,
        id: source.id,
        name,
        description: source.description,
        jsonType: "LOCATION",
        category: "world",
        sourceModId: source.sourceModId,
        sourceFile: source.sourceFile,
        abstract: false,
        identityKind: "explicit",
        rawDefinitionCount: source.rawDefinitionCount,
        raw: source.raw,
        location
    };
}

function buildDetails(points: Point[], dynamicLayout: boolean, index: LocationBuildIndex, ownerRaw: Record<string, unknown>, linkTiles: boolean): KnowledgeLocationDetails {
    const { by } = index;
    const normalizedPoints = points.map((point) => ({ ...point, id: normalizeOter(point.id, by) }));
    const terrainIds = [...new Set(normalizedPoints.map((point) => point.id))];
    const candidates: Candidate[] = [];
    const terrainOccurrences = dynamicLayout ? terrainIds.map((id) => ({ id, baseChance: 1, approximate: true })) : normalizedPoints.map(({ id }) => ({ id, baseChance: 1, approximate: false }));

    for (const occurrence of terrainOccurrences) {
        const terrain = by.get(`overmap_terrain:${occurrence.id}`);
        if (terrain) candidates.push(...oterMonsterSpawns(terrain.raw, occurrence.baseChance, index));

        const variants = index.mapgensByTerrain.get(stripRotation(occurrence.id)) ?? [];
        candidates.push(...weightedMapgenVariants(variants, occurrence.baseChance, occurrence.approximate, index));
    }

    const multiOmtSignatures = new Set<string>();
    for (const terrainId of terrainIds) {
        for (const signature of index.multiOmtGroupsByTerrain.get(stripRotation(terrainId)) ?? []) multiOmtSignatures.add(signature);
    }
    for (const signature of multiOmtSignatures) {
        candidates.push(...weightedMapgenVariants(index.multiOmtGroups.get(signature) ?? [], 1, dynamicLayout, index));
    }

    return {
        layouts: dynamicLayout ? [] : layouts(points, by, linkTiles),
        furniture: merge(
            candidates.filter((candidate) => candidate.type === "furniture"),
            by
        ),
        loot: merge(
            candidates.filter((candidate) => candidate.type === "ITEM"),
            by
        ),
        monsters: merge(
            candidates.filter((candidate) => candidate.type === "MONSTER"),
            by
        ),
        terrainIds,
        dynamicLayout,
        generationWeight: readPositiveNumber(ownerRaw.weight),
        occurrences: readOccurrences(ownerRaw.occurrences)
    };
}

function weightedMapgenVariants(variants: KnowledgeEntityDetails[], baseChance: number, approximateBase: boolean, index: LocationBuildIndex): Candidate[] {
    if (variants.length === 0) return [];
    const staticWeights = variants.every((mapgen) => mapgen.raw.weight === undefined || typeof mapgen.raw.weight === "number");
    const weighted = variants.map((mapgen) => ({ mapgen, weight: typeof mapgen.raw.weight === "number" ? mapgen.raw.weight : 1000 })).filter(({ weight }) => weight > 0);
    const total = staticWeights ? weighted.reduce((sum, variant) => sum + variant.weight, 0) : 0;
    const sums = new Map<string, Candidate>();

    for (const variant of weighted) {
        const variantWeight = staticWeights && total > 0 ? variant.weight / total : weighted.length > 0 ? 1 / weighted.length : 0;
        const variantApproximate = approximateBase || !staticWeights;
        const withinVariant = collapseCandidates(mapgenSpawns(variant.mapgen, 1, false, index));
        for (const candidate of withinVariant) {
            const chance = mul(baseChance, variantWeight, candidate.chance);
            const key = `${candidate.type}:${candidate.id}`;
            const current = sums.get(key);
            if (current === undefined) sums.set(key, { ...candidate, chance, approximate: candidate.approximate || variantApproximate });
            else {
                current.chance = clamp(current.chance + chance);
                current.approximate ||= candidate.approximate || variantApproximate;
            }
        }
    }
    return [...sums.values()];
}

function readSpecialPoints(raw: Record<string, unknown>): Point[] {
    if (Array.isArray(raw.overmaps))
        return raw.overmaps.flatMap((v): Point[] => (isRecord(v) && typeof v.overmap === "string" && isPoint(v.point) ? [{ x: v.point[0], y: v.point[1], z: v.point[2], id: v.overmap }] : []));
    if (isRecord(raw.overmaps)) return Object.values(raw.overmaps).flatMap((v): Point[] => (isRecord(v) && typeof v.overmap === "string" ? [{ x: 0, y: 0, z: 0, id: v.overmap }] : []));
    return [];
}

function layouts(points: Point[], by: Map<string, KnowledgeEntityDetails>, linkTiles: boolean): KnowledgeLocationDetails["layouts"] {
    const levels = new Map<number, Point[]>();
    points.forEach((point) => levels.set(point.z, [...(levels.get(point.z) ?? []), point]));
    return [...levels.entries()]
        .sort(([a], [b]) => b - a)
        .map(([z, level]) => {
            const minX = Math.min(...level.map((point) => point.x));
            const maxX = Math.max(...level.map((point) => point.x));
            const minY = Math.min(...level.map((point) => point.y));
            const maxY = Math.max(...level.map((point) => point.y));
            const cells = new Map(level.map((point) => [`${point.x},${point.y}`, oterAppearance(point.id, by, linkTiles)]));
            return {
                z,
                rows: Array.from({ length: maxY - minY + 1 }, (_, y) =>
                    Array.from({ length: maxX - minX + 1 }, (_, x) => cells.get(`${minX + x},${minY + y}`) ?? { symbol: " ", color: null, name: null, entityKey: null })
                )
            };
        });
}

function mapgenSpawns(mapgen: KnowledgeEntityDetails, baseChance: number, approximateBase: boolean, index: LocationBuildIndex): Candidate[] {
    const cached = index.mapgenSpawnCache.get(mapgen.key);
    if (cached !== undefined) return scaleCandidates(cached, baseChance, approximateBase);

    const object = isRecord(mapgen.raw.object) ? mapgen.raw.object : null;
    if (object === null) return [];

    const result = [...furnitureSpawns(object, 1, false), ...itemSpawns(object, 1, false, index), ...monsterSpawns(object, 1, false, index), ...paletteSpawns(object, 1, false, index)];

    for (const id of nestedIds(object)) result.push(...nestedMapgenSpawns(id, index));
    const collapsed = collapseCandidates(result);
    index.mapgenSpawnCache.set(mapgen.key, collapsed);
    return scaleCandidates(collapsed, baseChance, approximateBase);
}

function nestedMapgenSpawns(id: string, index: LocationBuildIndex): Candidate[] {
    const cached = index.nestedSpawnCache.get(id);
    if (cached !== undefined) return cached;

    const pending = [...(index.nestedMapgensById.get(id) ?? [])];
    const visited = new Set<string>();
    const candidates = new Map<string, Candidate>();

    while (pending.length > 0) {
        const mapgen = pending.pop();
        if (mapgen === undefined || visited.has(mapgen.key)) continue;
        visited.add(mapgen.key);

        const object = isRecord(mapgen.raw.object) ? mapgen.raw.object : null;
        if (object === null) continue;

        for (const candidate of [...furnitureSpawns(object, 1, true), ...itemSpawns(object, 1, true, index), ...monsterSpawns(object, 1, true, index), ...paletteSpawns(object, 1, true, index)]) {
            candidates.set(`${candidate.type}:${candidate.id}`, candidate);
        }

        for (const nestedId of nestedIds(object)) {
            for (const nested of index.nestedMapgensById.get(nestedId) ?? []) {
                if (!visited.has(nested.key)) pending.push(nested);
            }
        }
    }

    const result = [...candidates.values()];
    index.nestedSpawnCache.set(id, result);
    return result;
}

function paletteSpawns(object: Record<string, unknown>, baseChance: number, approximateBase: boolean, index: LocationBuildIndex): Candidate[] {
    const result: Candidate[] = [];
    for (const id of strings(object.palettes)) {
        const cached = index.paletteSpawnCache.get(id);
        if (cached !== undefined) {
            result.push(...scaleCandidates(cached, baseChance, approximateBase));
            continue;
        }

        const palette = index.by.get(`palette:${id}`) ?? index.by.get(`mapgen_palette:${id}`);
        if (palette === undefined) continue;
        const spawns = collapseCandidates([...furnitureSpawns(palette.raw, 1, false), ...itemSpawns(palette.raw, 1, false, index), ...monsterSpawns(palette.raw, 1, false, index)]);
        index.paletteSpawnCache.set(id, spawns);
        result.push(...scaleCandidates(spawns, baseChance, approximateBase));
    }
    return result;
}

function furnitureSpawns(o: Record<string, unknown>, base: number, approximateBase: boolean): Candidate[] {
    const result: Candidate[] = [];
    if (isRecord(o.furniture)) {
        for (const value of Object.values(o.furniture)) {
            for (const option of weightedAlternatives(value)) {
                result.push({ type: "furniture", id: option.id, chance: mul(base, option.chance), approximate: approximateBase || option.approximate });
            }
        }
    }
    if (Array.isArray(o.set))
        for (const v of o.set)
            if (isRecord(v) && (v.point === "furniture" || v.line === "furniture" || v.square === "furniture") && typeof v.id === "string")
                result.push({ type: "furniture", id: v.id, chance: mul(base, oneInEstimate(v.chance)), approximate: approximateBase || !isStaticChance(v.chance) });
    return result;
}

function itemSpawns(o: Record<string, unknown>, base: number, approximateBase: boolean, index: LocationBuildIndex): Candidate[] {
    const result: Candidate[] = [];
    if (isRecord(o.item)) {
        for (const value of Object.values(o.item)) {
            if (isRecord(value) && typeof value.item === "string")
                result.push({ type: "ITEM", id: value.item, chance: mul(base, oneInEstimate(value.chance)), approximate: approximateBase || !isStaticChance(value.chance) });
        }
    }
    for (const v of [...records(o.place_item), ...records(o.place_items)])
        if (typeof v.item === "string") result.push({ type: "ITEM", id: v.item, chance: mul(base, oneInEstimate(v.chance)), approximate: approximateBase || !isStaticChance(v.chance) });
    for (const v of [...records(o.place_loot), ...records(o.loot)]) {
        const chance = mul(base, percentEstimate(v.chance));
        const approximate = approximateBase || !isStaticChance(v.chance);
        if (typeof v.item === "string") result.push({ type: "ITEM", id: v.item, chance, approximate });
        if (typeof v.group === "string") result.push(...itemGroup(v.group, chance, approximate, index, new Set()));
    }
    if (isRecord(o.items))
        for (const v of Object.values(o.items))
            if (isRecord(v) && typeof v.item === "string") result.push(...itemGroup(v.item, mul(base, percentEstimate(v.chance)), approximateBase || !isStaticChance(v.chance), index, new Set()));
    return result;
}

function monsterSpawns(o: Record<string, unknown>, base: number, approximateBase: boolean, index: LocationBuildIndex): Candidate[] {
    const result: Candidate[] = [];

    if (isRecord(o.monster)) {
        for (const value of Object.values(o.monster)) {
            if (isRecord(value) && typeof value.monster === "string") result.push({ type: "MONSTER", id: value.monster, chance: base, approximate: approximateBase });
        }
    }

    for (const value of records(o.place_monster)) {
        const chance = mul(base, percentEstimate(value.chance));
        const approximate = approximateBase || !isStaticChance(value.chance);
        if (typeof value.monster === "string") result.push({ type: "MONSTER", id: value.monster, chance, approximate });
        if (typeof value.group === "string") result.push(...monsterGroup(value.group, chance, index, new Set()));
    }

    for (const value of records(o.place_monsters)) {
        const groupId = typeof value.monster === "string" ? value.monster : typeof value.group === "string" ? value.group : null;
        if (groupId !== null) result.push(...monsterGroup(groupId, mul(base, oneInEstimate(value.chance)), index, new Set()));
    }

    if (isRecord(o.monsters)) {
        for (const value of Object.values(o.monsters)) {
            if (!isRecord(value) || typeof value.monster !== "string") continue;
            result.push(...monsterGroup(value.monster, mul(base, oneInEstimate(value.chance)), index, new Set()));
        }
    }
    return result;
}

function oterMonsterSpawns(raw: Record<string, unknown>, base: number, index: LocationBuildIndex): Candidate[] {
    return isRecord(raw.spawns) && typeof raw.spawns.group === "string" ? monsterGroup(raw.spawns.group, mul(base, percentEstimate(raw.spawns.chance)), index, new Set()) : [];
}

function itemGroup(id: string, base: number, approximateBase: boolean, index: LocationBuildIndex, seen: Set<string>): Candidate[] {
    if (seen.has(id)) return [];
    const cached = index.itemGroupCache.get(id);
    if (cached !== undefined) return scaleCandidates(cached, base, approximateBase);

    const group = index.by.get(`item_group:${id}`);
    if (!group) return [];
    const entries = groupEntries(group.raw);
    const distribution = group.raw.subtype === "distribution";
    const total = distribution ? entries.reduce((n, e) => n + e.weight, 0) : 100;
    const next = new Set(seen).add(id);
    const result = entries.flatMap((e): Candidate[] => {
        const chance = distribution ? (total ? e.weight / total : 0) : Math.min(1, e.weight / 100);
        if (e.item) return [{ type: "ITEM", id: e.item, chance, approximate: false }];
        return e.group ? itemGroup(e.group, chance, false, index, next) : [];
    });
    const collapsed = collapseCandidates(result);
    if (seen.size === 0) index.itemGroupCache.set(id, collapsed);
    return scaleCandidates(collapsed, base, approximateBase);
}

function monsterGroup(id: string, base: number, index: LocationBuildIndex, seen: Set<string>): Candidate[] {
    if (seen.has(id)) return [];
    const cached = index.monsterGroupCache.get(id);
    if (cached !== undefined) return scaleCandidates(cached, base, true);

    const group = index.by.get(`monstergroup:${id}`);
    if (!group) return [];
    const entries = Array.isArray(group.raw.monsters) ? group.raw.monsters.filter(isRecord) : [];
    const weights = entries.map((entry) => monsterGroupWeight(entry));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    const next = new Set(seen).add(id);
    const result = entries.flatMap((entry, entryIndex): Candidate[] => {
        const chance = total > 0 ? weights[entryIndex] / total : entries.length > 0 ? 1 / entries.length : 0;
        if (typeof entry.monster === "string") return [{ type: "MONSTER", id: entry.monster, chance, approximate: true }];
        return typeof entry.group === "string" ? monsterGroup(entry.group, chance, index, next) : [];
    });
    const collapsed = collapseCandidates(result);
    if (seen.size === 0) index.monsterGroupCache.set(id, collapsed);
    return scaleCandidates(collapsed, base, true);
}

function groupEntries(raw: Record<string, unknown>): Array<{ item: string | null; group: string | null; weight: number }> {
    const result: Array<{ item: string | null; group: string | null; weight: number }> = [];
    for (const key of ["entries", "items", "groups"] as const)
        if (Array.isArray(raw[key]))
            for (const v of raw[key]) {
                if (typeof v === "string") result.push({ item: key === "groups" ? null : v, group: key === "groups" ? v : null, weight: 100 });
                else if (Array.isArray(v) && typeof v[0] === "string") result.push({ item: key === "groups" ? null : v[0], group: key === "groups" ? v[0] : null, weight: typeof v[1] === "number" ? v[1] : 100 });
                else if (isRecord(v)) result.push({ item: typeof v.item === "string" ? v.item : null, group: typeof v.group === "string" ? v.group : null, weight: typeof v.prob === "number" ? v.prob : 100 });
            }
    return result;
}

function scaleCandidates(values: Candidate[], base: number, approximateBase: boolean): Candidate[] {
    if (base === 1 && !approximateBase) return values;
    return values.map((value) => ({ ...value, chance: mul(base, value.chance), approximate: value.approximate || approximateBase }));
}

function collapseCandidates(values: Candidate[]): Candidate[] {
    const merged = new Map<string, { value: Candidate; miss: number }>();
    for (const value of values) {
        const key = `${value.type}:${value.id}`;
        const current = merged.get(key);
        if (current === undefined) merged.set(key, { value: { ...value }, miss: 1 - clamp(value.chance) });
        else {
            current.miss *= 1 - clamp(value.chance);
            current.value.approximate ||= value.approximate;
        }
    }
    return [...merged.values()].map(({ value, miss }) => ({ ...value, chance: 1 - miss }));
}

function merge(values: Candidate[], by: Map<string, KnowledgeEntityDetails>): KnowledgeLocationSpawn[] {
    const merged = new Map<string, { value: Candidate; miss: number }>();
    for (const value of values) {
        const key = `${value.type}:${value.id}`;
        const current = merged.get(key);
        if (!current) merged.set(key, { value: { ...value }, miss: 1 - clamp(value.chance) });
        else {
            current.miss *= 1 - clamp(value.chance);
            current.value.approximate ||= value.approximate;
        }
    }
    return [...merged.values()]
        .flatMap(({ value, miss }) => {
            const target = by.get(`${value.type}:${value.id}`);
            if (!target) return [];
            const entity: KnowledgeEntityReference = { key: target.key, id: target.id, name: target.name, jsonType: target.jsonType, sourceModId: target.sourceModId, virtual: false };
            return [{ entity, chance: 1 - miss, approximate: value.approximate }];
        })
        .sort((a, b) => b.chance - a.chance || a.entity.name.localeCompare(b.entity.name));
}

function deriveLocationName(owner: KnowledgeEntityDetails, points: Point[], by: Map<string, KnowledgeEntityDetails>): string {
    const surfaceName = mostCommonTerrainName(
        points.filter((point) => point.z === 0),
        by
    );
    if (surfaceName !== null) return surfaceName;

    if (owner.raw.subtype === "mutable" && typeof owner.raw.root === "string" && isRecord(owner.raw.overmaps)) {
        const root = owner.raw.overmaps[owner.raw.root];
        if (isRecord(root) && typeof root.overmap === "string") {
            const name = by.get(`overmap_terrain:${normalizeOter(root.overmap, by)}`)?.name;
            if (name !== undefined) return name;
        }
    }
    return owner.id;
}

function mostCommonTerrainName(points: Point[], by: Map<string, KnowledgeEntityDetails>): string | null {
    const counts = new Map<string, number>();
    for (const point of points) {
        const name = by.get(`overmap_terrain:${normalizeOter(point.id, by)}`)?.name;
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
function oterAppearance(id: string, by: Map<string, KnowledgeEntityDetails>, linkTile: boolean): { symbol: string; color: string | null; name: string | null; entityKey: string | null } {
    const terrain = by.get(`overmap_terrain:${normalizeOter(id, by)}`);
    const raw = terrain?.raw;
    const rawSym = raw?.sym;
    const rawColor = raw?.color;
    const sym = Array.isArray(rawSym) ? rawSym[0] : rawSym;
    const color = Array.isArray(rawColor) ? rawColor[0] : rawColor;
    return {
        symbol: typeof sym === "string" ? sym : typeof sym === "number" ? String.fromCodePoint(sym) : "?",
        color: typeof color === "string" ? color : null,
        name: terrain?.name ?? null,
        entityKey: terrain === undefined || !linkTile ? null : tileLocationKey(normalizeOter(id, by))
    };
}

function locationSignature(points: Point[]): string {
    if (points.length === 0) return "";
    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    return points
        .map((point) => `${point.x - minX},${point.y - minY},${point.z}:${point.id}`)
        .sort()
        .join("|");
}

function locationAppearanceSignature(points: Point[], by: Map<string, KnowledgeEntityDetails>): string {
    const levels = [...new Set(points.map((point) => point.z))];
    if (levels.length === 0) return "";
    const z = levels.includes(0) ? 0 : [...levels].sort((left, right) => Math.abs(left) - Math.abs(right) || right - left)[0];
    const layer = points.filter((point) => point.z === z);
    const minX = Math.min(...layer.map((point) => point.x));
    const minY = Math.min(...layer.map((point) => point.y));
    const maxX = Math.max(...layer.map((point) => point.x));
    const maxY = Math.max(...layer.map((point) => point.y));
    const cells = new Map(layer.map((point) => [`${point.x},${point.y}`, appearanceSignatureCell(point.id, by)]));
    const rows: string[] = [];
    for (let y = minY; y <= maxY; y += 1) {
        const row: string[] = [];
        for (let x = minX; x <= maxX; x += 1) row.push(cells.get(`${x},${y}`) ?? "");
        rows.push(row.join("\u001f"));
    }
    return `${maxX - minX + 1}x${maxY - minY + 1}:${rows.join("\u001e")}`;
}

function appearanceSignatureCell(id: string, by: Map<string, KnowledgeEntityDetails>): string {
    const appearance = oterAppearance(stripRotation(normalizeOter(id, by)), by, false);
    return `${appearance.symbol}\u001d${appearance.color ?? ""}\u001d${appearance.name ?? ""}`;
}

function applyAppearanceGroups(groups: Map<string, KnowledgeEntityDetails[]>): void {
    for (const group of groups.values()) {
        if (group.length < 2) continue;
        const sorted = [...group].sort((left, right) => left.id.length - right.id.length || left.id.localeCompare(right.id));
        const representative = sorted[0];
        const variants: KnowledgeEntityReference[] = sorted.map((entity) => ({
            key: entity.key,
            id: entity.id,
            name: entity.name,
            jsonType: entity.jsonType,
            sourceModId: entity.sourceModId,
            virtual: false
        }));
        for (const entity of group) {
            if (entity.location === undefined) continue;
            entity.location.appearanceVariants = variants;
            entity.location.appearanceRepresentativeKey = representative.key;
            entity.variantCount = variants.length;
        }
    }
}

function collectCampTerrainIds(entities: KnowledgeEntityDetails[], index: LocationBuildIndex): Set<string> {
    const campMapgenIds = new Set<string>();
    for (const entity of entities) {
        if (entity.jsonType !== "recipe") continue;
        if (typeof entity.raw.construction_blueprint === "string") campMapgenIds.add(entity.raw.construction_blueprint);
        if (entity.raw.category === "CC_BUILDING" && typeof entity.raw.result === "string") campMapgenIds.add(entity.raw.result);
    }

    const result = new Set<string>();
    for (const terrain of entities) {
        if (terrain.jsonType !== "overmap_terrain") continue;
        if (isBasecampSource(terrain.sourceFile)) for (const alias of entityAliases(terrain)) result.add(stripRotation(alias));
    }
    for (const mapgenId of campMapgenIds) {
        const mapgen = index.by.get(`mapgen:${mapgenId}`);
        if (mapgen === undefined) continue;
        for (const terrainId of flattenStrings(mapgen.raw.om_terrain)) result.add(stripRotation(normalizeOter(terrainId, index.by)));
    }
    return result;
}

function isBasecampSource(sourceFile: string): boolean {
    const normalized = sourceFile.replaceAll("\\", "/").toLowerCase();
    return normalized.includes("/faction_base_camps/") || normalized.includes("/basecamps/") || normalized.includes("/basecamp/");
}

function weightedAlternatives(value: unknown): Array<{ id: string; chance: number; approximate: boolean }> {
    if (typeof value === "string") return [{ id: value, chance: 1, approximate: false }];
    if (!Array.isArray(value)) return [];

    const tuples = value.filter((entry): entry is [string, number] => Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "number");
    if (tuples.length === value.length && tuples.length > 0) {
        const total = tuples.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0);
        return tuples.map(([id, weight]) => ({ id, chance: total > 0 ? Math.max(0, weight) / total : 1 / tuples.length, approximate: false }));
    }

    const ids = flattenStrings(value);
    return ids.map((id) => ({ id, chance: ids.length > 0 ? 1 / ids.length : 0, approximate: true }));
}

function monsterGroupWeight(entry: Record<string, unknown>): number {
    const value = typeof entry.freq === "number" ? entry.freq : typeof entry.weight === "number" ? entry.weight : 1;
    return Math.max(0, value);
}

function isStaticChance(value: unknown): boolean {
    return value === undefined || typeof value === "number";
}
function entityAliases(entity: KnowledgeEntityDetails): string[] {
    const rawId = entity.raw.id ?? entity.raw.abstract;
    const aliases = flattenStrings(rawId);
    return aliases.length > 0 ? aliases : [entity.id];
}
function normalizeOter(id: string, by: Map<string, KnowledgeEntityDetails>): string {
    if (by.has(`overmap_terrain:${id}`)) return id;
    const stripped = stripRotation(id);
    return by.has(`overmap_terrain:${stripped}`) ? stripped : id;
}
function readPositiveNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
function readOccurrences(value: unknown): [number, number] | null {
    return Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number" ? [value[0], value[1]] : null;
}
function isNestedMapgen(raw: Record<string, unknown>): boolean {
    return typeof raw.nested_mapgen_id === "string";
}
function isMultiOmtMapgen(raw: Record<string, unknown>): boolean {
    return Array.isArray(raw.om_terrain) && raw.om_terrain.some(Array.isArray);
}
function nestedIds(o: Record<string, unknown>): string[] {
    const out: string[] = [];
    const visit = (v: unknown): void => {
        if (typeof v === "string") {
            if (v !== "null") out.push(v);
        } else if (Array.isArray(v)) v.forEach(visit);
        else if (isRecord(v)) {
            if (typeof v.nested_mapgen_id === "string") out.push(v.nested_mapgen_id);
            if ("chunks" in v) visit(v.chunks);
        }
    };
    if (isRecord(o.nested)) Object.values(o.nested).forEach(visit);
    if (Array.isArray(o.place_nested)) o.place_nested.forEach(visit);
    return [...new Set(out)];
}
function records(v: unknown): Record<string, unknown>[] {
    return Array.isArray(v) ? v.filter(isRecord) : [];
}
function strings(v: unknown): string[] {
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function flattenStrings(v: unknown): string[] {
    return typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(flattenStrings) : [];
}
function isPoint(v: unknown): v is [number, number, number] {
    return Array.isArray(v) && v.length >= 3 && v.slice(0, 3).every((x) => typeof x === "number");
}
function oneInEstimate(v: unknown): number {
    return v === undefined ? 1 : typeof v === "number" && v > 0 ? 1 / v : 1;
}
function percentEstimate(v: unknown): number {
    return v === undefined ? 1 : typeof v === "number" ? clamp(v / 100) : 1;
}
function mul(...values: number[]): number {
    return clamp(values.reduce((result, value) => result * value, 1));
}
function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
}
function stripRotation(id: string): string {
    return id.replace(/_(north|east|south|west)$/, "");
}
