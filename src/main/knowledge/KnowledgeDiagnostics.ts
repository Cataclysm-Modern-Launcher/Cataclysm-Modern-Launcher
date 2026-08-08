import { TKnowledgeDefinitionIdentity } from "./types/TKnowledgeDefinitionIdentity";
import { TInheritanceResolutionResult } from "./resolution/TInheritanceResolutionResult";
import { TKnowledgeScanSummary } from "./types/TKnowledgeScanSummary";
import { TJsonRecord } from "@shared/TJsonRecord";
import { TScannedKnowledgeDefinition } from "./types/TScannedKnowledgeDefinition";
import { TIdentifiedKnowledgeDefinition } from "./types/TIdentifiedKnowledgeDefinition";
import { TResolvedKnowledgeDefinition } from "./types/TResolvedKnowledgeDefinition";

type DiagnosticExample = {
    type: string;
    id: string;
    sourceModId: string;
    sourceFile: string;
    detail?: string;
};

const MAX_EXAMPLES_PER_GROUP = 5;

export class KnowledgeDiagnostics {
    private readonly typeCounts = new Map<string, number>();
    private readonly identityCounts = new Map<TKnowledgeDefinitionIdentity["kind"], number>();
    private readonly unknownIdentityTypes = new Map<string, number>();
    private readonly unknownIdentityExamples = new Map<string, DiagnosticExample[]>();
    private readonly deferredIdentityTypes = new Map<string, number>();
    private readonly resolvedDeferredTypes = new Map<string, number>();
    private readonly unresolvedDeferredTypes = new Map<string, number>();
    private readonly anonymousIdentityTypes = new Map<string, number>();
    private readonly crossSourceOverrideTypes = new Map<string, number>();
    private readonly sameSourceReplacementTypes = new Map<string, number>();
    private readonly recipeReplacementExamples = new Map<string, DiagnosticExample[]>();
    private readonly missingParentTypes = new Map<string, number>();
    private readonly missingParentExamples = new Map<string, DiagnosticExample[]>();
    private readonly unresolvedSelfOverrideTypes = new Map<string, number>();
    private readonly unresolvedSelfOverrideExamples = new Map<string, DiagnosticExample[]>();
    private readonly inheritanceCycleTypes = new Map<string, number>();
    private readonly inheritanceCycleExamples = new Map<string, DiagnosticExample[]>();
    private readonly appliedOperationTypes = new Map<string, number>();
    private readonly unsupportedOperationTypes = new Map<string, number>();
    private readonly unsupportedOperationExamples = new Map<string, DiagnosticExample[]>();
    private readonly partiallyResolvedDefinitions = new Set<string>();
    private readonly externalIntegrationDefinitions = new Set<string>();
    private readonly untypedDefinitions = new Map<string, number>();
    private readonly parseFailures: Array<{ sourceModId: string; file: string; message: string }> = [];

    observeType(definition: TScannedKnowledgeDefinition): void {
        increment(this.typeCounts, definition.jsonType);
    }

    observeIdentity(definition: TScannedKnowledgeDefinition, identity: TKnowledgeDefinitionIdentity): void {
        increment(this.identityCounts, identity.kind);
        if (identity.kind === "unknown") {
            increment(this.unknownIdentityTypes, definition.jsonType);
            addExample(this.unknownIdentityExamples, definition.jsonType, createScannedExample(definition, summarizeIdentityFields(definition.raw)));
        } else if (identity.kind === "deferred") {
            increment(this.deferredIdentityTypes, definition.jsonType);
        } else if (identity.kind === "anonymous") {
            increment(this.anonymousIdentityTypes, definition.jsonType);
        }
    }

    observeReplacement(definition: TResolvedKnowledgeDefinition, previous: TResolvedKnowledgeDefinition | undefined): void {
        if (previous === undefined) return;
        const sameSource = previous.sourceModId === definition.sourceModId;
        increment(sameSource ? this.sameSourceReplacementTypes : this.crossSourceOverrideTypes, definition.canonicalType);
        if (definition.canonicalType === "recipe" || definition.canonicalType === "uncraft") {
            const key = `${sameSource ? "same-source" : "cross-source"}.${definition.canonicalType}`;
            addExample(this.recipeReplacementExamples, key, createResolvedExample(definition, `previous={${summarizeRecipe(previous.raw)}}; next={${summarizeRecipe(definition.raw)}}`));
        }
    }

    observeInheritance(definition: TIdentifiedKnowledgeDefinition, parentDefinition: TIdentifiedKnowledgeDefinition | undefined, resolved: TResolvedKnowledgeDefinition, inheritance: TInheritanceResolutionResult): void {
        if (definition.identity.kind === "deferred") {
            const fallback = definition.parentId === null ? `${definition.sourceFile}#${definition.sequence}` : `${definition.parentId}#${definition.sequence}`;
            increment(resolved.effectiveId === fallback ? this.unresolvedDeferredTypes : this.resolvedDeferredTypes, definition.canonicalType);
        }
        if (definition.parentId !== null && parentDefinition === undefined) {
            const ownAliases = new Set(definition.identityAliases);
            if (ownAliases.has(definition.parentId) || (definition.identity.kind === "deferred" && definition.parentId === resolved.raw.result)) {
                increment(this.unresolvedSelfOverrideTypes, definition.canonicalType);
                this.externalIntegrationDefinitions.add(definitionKey(definition));
                addExample(this.unresolvedSelfOverrideExamples, definition.canonicalType, createExample(definition, definition.parentId));
            } else {
                increment(this.missingParentTypes, definition.canonicalType);
                addExample(this.missingParentExamples, definition.canonicalType, createExample(definition, definition.parentId));
            }
        }
        for (const operation of inheritance.appliedOperations) {
            increment(this.appliedOperationTypes, `${definition.canonicalType}.${operation}`);
        }
        for (const unsupported of inheritance.unsupportedOperations) {
            const key = `${definition.canonicalType}.${unsupported.operation}`;
            for (const entry of unsupported.paths) {
                this.partiallyResolvedDefinitions.add(definitionKey(definition));
                const reasonKey = `${key}.${entry.reason}`;
                increment(this.unsupportedOperationTypes, reasonKey);
                addExample(this.unsupportedOperationExamples, reasonKey, createExample(definition, summarizeUnsupported(entry)));
            }
        }
    }

    observeInheritanceCycle(definition: TIdentifiedKnowledgeDefinition, detail: string): void {
        increment(this.inheritanceCycleTypes, definition.canonicalType);
        addExample(this.inheritanceCycleExamples, definition.canonicalType, createExample(definition, detail));
    }

    observeUntypedDefinition(sourceModId: string, sourceFile: string, raw: TJsonRecord): void {
        const keys = Object.keys(raw).sort().slice(0, 5).join(",") || "<empty>";
        increment(this.untypedDefinitions, `${sourceModId}:${sourceFile}:${keys}`);
    }

    observeParseFailure(sourceModId: string, file: string, error: unknown): void {
        this.parseFailures.push({ sourceModId, file, message: error instanceof Error ? error.message : String(error) });
    }

    flush(scan: TKnowledgeScanSummary, effectiveEntityCount: number): void {
        console.info("[knowledge:index] scan summary", scan);
        console.info(`[knowledge:index] discovered ${this.typeCounts.size} JSON types`, sortedObject(this.typeCounts));
        console.info("[knowledge:index] identity strategies", sortedObject(this.identityCounts));
        console.info(`[knowledge:index] normalization raw=${scan.typedDefinitions} effective=${effectiveEntityCount} collapsed=${scan.typedDefinitions - effectiveEntityCount}`);
        this.logWarning("unknown identity types", this.unknownIdentityTypes, this.unknownIdentityExamples);
        this.logInfo("deferred identities", this.deferredIdentityTypes);
        this.logInfo("deferred identities resolved", this.resolvedDeferredTypes);
        this.logWarning("deferred identities unresolved", this.unresolvedDeferredTypes);
        this.logInfo("known anonymous definitions", this.anonymousIdentityTypes);
        this.logInfo("cross-source overrides", this.crossSourceOverrideTypes);
        this.logInfo("same-source replacements", this.sameSourceReplacementTypes);
        if (this.recipeReplacementExamples.size > 0) console.info("[knowledge:index] recipe replacement examples", sortedObject(this.recipeReplacementExamples));
        this.logInfo("unresolved self-overrides", this.unresolvedSelfOverrideTypes);
        if (this.unresolvedSelfOverrideExamples.size > 0) console.info("[knowledge:index] unresolved self-overrides examples", sortedObject(this.unresolvedSelfOverrideExamples));
        this.logWarning("missing inheritance parents", this.missingParentTypes, this.missingParentExamples);
        this.logWarning("inheritance cycles", this.inheritanceCycleTypes, this.inheritanceCycleExamples);
        this.logInfo("applied inheritance operations", this.appliedOperationTypes);
        this.logWarning("partially unsupported inheritance operations", this.unsupportedOperationTypes, this.unsupportedOperationExamples);
        console.info("[knowledge:index] semantic resolution", {
            fullyResolvedDefinitions: Math.max(0, effectiveEntityCount - this.partiallyResolvedDefinitions.size),
            partiallyResolvedDefinitions: this.partiallyResolvedDefinitions.size,
            optionalExternalIntegrations: this.externalIntegrationDefinitions.size
        });
        this.logWarning("top-level definitions without string type", this.untypedDefinitions);
        if (this.parseFailures.length > 0) console.warn("[knowledge:index] parse failures", this.parseFailures.slice(0, 50), { total: this.parseFailures.length });
    }

    private logInfo(label: string, values: Map<string, number>): void {
        if (values.size > 0) console.info(`[knowledge:index] ${label}`, sortedObject(values));
    }

    private logWarning(label: string, values: Map<string, number>, examples?: Map<string, DiagnosticExample[]>): void {
        if (values.size === 0) return;
        console.warn(`[knowledge:index] ${label}`, sortedObject(values));
        if (examples !== undefined && examples.size > 0) console.warn(`[knowledge:index] ${label} examples`, sortedObject(examples));
    }
}

function createResolvedExample(definition: TResolvedKnowledgeDefinition, detail?: string): DiagnosticExample {
    return { type: definition.canonicalType, id: definition.effectiveId, sourceModId: definition.sourceModId, sourceFile: definition.sourceFile, detail };
}

function summarizeRecipe(raw: TJsonRecord): string {
    const fields = ["id", "abstract", "result", "id_suffix", "variant", "copy-from"].filter((field) => Object.hasOwn(raw, field)).map((field) => `${field}=${JSON.stringify(raw[field])}`);
    return fields.join(", ") || "<no recipe identity fields>";
}

function summarizeUnsupported(entry: { path: string; current?: string; operand?: string }): string {
    const values = [entry.path];
    if (entry.current !== undefined) values.push(`current=${entry.current}`);
    if (entry.operand !== undefined) values.push(`operand=${entry.operand}`);
    return values.join("; ");
}

function createExample(definition: TIdentifiedKnowledgeDefinition, detail?: string): DiagnosticExample {
    const id = definition.identity.kind === "deferred" ? (definition.parentId ?? "<deferred>") : definition.identity.kind === "unknown" ? definition.identity.fallback : definition.identity.value;
    return { type: definition.canonicalType, id, sourceModId: definition.sourceModId, sourceFile: definition.sourceFile, detail };
}

function createScannedExample(definition: TScannedKnowledgeDefinition, detail?: string): DiagnosticExample {
    return { type: definition.jsonType, id: `${definition.sourceFile}#${definition.sequence}`, sourceModId: definition.sourceModId, sourceFile: definition.sourceFile, detail };
}

function summarizeIdentityFields(raw: TJsonRecord): string {
    return (
        ["id", "abstract", "ident", "copy-from", "result", "om_terrain"]
            .filter((field) => Object.hasOwn(raw, field))
            .map((field) => `${field}=${JSON.stringify(raw[field])}`)
            .join(", ") || `fields=${Object.keys(raw).sort().slice(0, 8).join(",")}`
    );
}

function addExample(values: Map<string, DiagnosticExample[]>, key: string, example: DiagnosticExample): void {
    const examples = values.get(key) ?? [];
    if (examples.length < MAX_EXAMPLES_PER_GROUP) examples.push(example);
    values.set(key, examples);
}

function increment(values: Map<string, number>, key: string): void {
    values.set(key, (values.get(key) ?? 0) + 1);
}

function sortedObject<TValue>(values: Map<string, TValue>): Record<string, TValue> {
    return Object.fromEntries([...values].sort(([left], [right]) => left.localeCompare(right)));
}

function definitionKey(definition: TIdentifiedKnowledgeDefinition): string {
    return `${definition.sourceModId}:${definition.sourceFile}:${definition.sequence}`;
}
