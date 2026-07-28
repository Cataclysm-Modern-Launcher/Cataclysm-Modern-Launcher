import { KnowledgeDiagnostics } from "../KnowledgeDiagnostics";
import { getKnowledgeTypeDescriptor } from "../definitions/getKnowledgeTypeDescriptor";
import { applyInheritanceOperations } from "./applyInheritanceOperations";
import { mergeJsonDefinitions } from "./mergeJsonDefinitions";
import { resolveDefinitionIdentity } from "./resolveDefinitionIdentity";
import { TIdentifiedKnowledgeDefinition } from "../types/TIdentifiedKnowledgeDefinition";
import { TResolvedKnowledgeDefinition } from "../types/TResolvedKnowledgeDefinition";

const resolving = new Set<number>();
const resolved = new Map<number, TResolvedKnowledgeDefinition>();

const singleDefinitions = new Map<string, TResolvedKnowledgeDefinition>();
const multipleDefinitions: TResolvedKnowledgeDefinition[] = [];

const definitionsByAlias = new Map<string, TIdentifiedKnowledgeDefinition[]>();

function createDefinitionLookupKey(canonicalType: string, identity: string): string {
    return `${canonicalType}:${identity}`;
}

function getCurrentDefinition(canonicalType: string, identity: string): TResolvedKnowledgeDefinition | undefined {
    return singleDefinitions.get(createDefinitionLookupKey(canonicalType, identity));
}

function registerDefinition(definition: TResolvedKnowledgeDefinition): void {
    if (definition.cardinality === "multiple") {
        multipleDefinitions.push(definition);
        return;
    }
    singleDefinitions.set(createDefinitionLookupKey(definition.canonicalType, definition.effectiveId), definition);
}

function resolveWithoutParent(definition: TIdentifiedKnowledgeDefinition, reason: string, diagnostics: KnowledgeDiagnostics): TResolvedKnowledgeDefinition {
    const inheritance = applyInheritanceOperations({ ...definition.raw, ...pickOperationFields(definition.raw) }, definition.canonicalType);
    const descriptor = getKnowledgeTypeDescriptor(definition);
    const identity = resolveDefinitionIdentity(definition, inheritance.value, undefined, descriptor);
    const resolvedResult: TResolvedKnowledgeDefinition = { ...definition, effectiveId: identity.value, effectiveAliases: identity.aliases, rawDefinitionCount: 1, raw: inheritance.value };
    diagnostics.observeInheritanceCycle(definition, reason);
    return resolvedResult;
}

function pickOperationFields(value: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const field of ["extend", "delete", "relative", "proportional"] as const) {
        if (Object.hasOwn(value, field)) result[field] = value[field];
    }
    return result;
}

function findLast<T>(values: T[], predicate: (value: T) => boolean): T | undefined {
    for (let index = values.length - 1; index >= 0; index -= 1) {
        if (predicate(values[index])) return values[index];
    }
    return undefined;
}

function findParent(definition: TIdentifiedKnowledgeDefinition): TIdentifiedKnowledgeDefinition | undefined {
    if (definition.parentId === null) return undefined;
    const key = createDefinitionLookupKey(definition.canonicalType, definition.parentId);
    const candidates = definitionsByAlias.get(key) ?? [];
    const previous = findLast(candidates, (candidate) => candidate.sequence < definition.sequence);
    if (previous !== undefined) return previous;
    return candidates.find((candidate) => candidate.sequence !== definition.sequence);
}

function resolve(definition: TIdentifiedKnowledgeDefinition, diagnostics: KnowledgeDiagnostics): TResolvedKnowledgeDefinition {
    const cached = resolved.get(definition.sequence);
    if (cached !== undefined) return cached;
    if (resolving.has(definition.sequence)) return resolveWithoutParent(definition, "inheritance-cycle", diagnostics);

    resolving.add(definition.sequence);
    const parentDefinition = findParent(definition);
    const parent = parentDefinition === undefined ? undefined : resolve(parentDefinition, diagnostics);
    const merged = mergeJsonDefinitions(parent?.raw, definition.raw);
    const inheritance = applyInheritanceOperations({ ...merged, ...pickOperationFields(definition.raw) }, definition.canonicalType);
    const descriptor = getKnowledgeTypeDescriptor(definition);
    const identity = resolveDefinitionIdentity(definition, inheritance.value, parent, descriptor);
    const resolvedResult: TResolvedKnowledgeDefinition = {
        ...definition,
        effectiveId: identity.value,
        effectiveAliases: identity.aliases,
        rawDefinitionCount: (parent?.rawDefinitionCount ?? 0) + 1,
        raw: inheritance.value
    };

    resolving.delete(definition.sequence);
    resolved.set(definition.sequence, resolvedResult);
    diagnostics.observeInheritance(definition, parentDefinition, resolvedResult, inheritance);
    return resolvedResult;
}

export function resolveKnowledgeDefinitions(definitions: TIdentifiedKnowledgeDefinition[], diagnostics: KnowledgeDiagnostics): TResolvedKnowledgeDefinition[] {
    for (const definition of definitions) {
        for (const alias of definition.identityAliases) {
            const key = createDefinitionLookupKey(definition.canonicalType, alias);
            const entries = definitionsByAlias.get(key) ?? [];
            entries.push(definition);
            definitionsByAlias.set(key, entries);
        }
    }

    resolving.clear();
    resolved.clear();
    singleDefinitions.clear();
    multipleDefinitions.length = 0;

    for (const definition of definitions) {
        const resolved = resolve(definition, diagnostics);
        const previous = getCurrentDefinition(resolved.canonicalType, resolved.effectiveId);
        diagnostics.observeReplacement(resolved, previous);
        registerDefinition(resolved);
    }

    return [...singleDefinitions.values(), ...multipleDefinitions];
}
