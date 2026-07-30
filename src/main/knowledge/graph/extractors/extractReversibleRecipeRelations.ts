import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "../types/TKnowledgeRelationCandidate";

interface ComponentContext {
    multiplier: number;
    path: string;
    visitedRequirements: ReadonlySet<string>;
}

export function extractReversibleRecipeRelations(definitions: TResolvedKnowledgeDefinition[]): TKnowledgeRelationCandidate[] {
    const requirements = new Map(definitions.filter((definition) => definition.canonicalType === "requirement").map((definition) => [definition.effectiveId, definition] as const));

    return selectGeneratedUncraftRecipes(definitions).flatMap((definition) => extractRecipe(definition, requirements));
}

function selectGeneratedUncraftRecipes(definitions: TResolvedKnowledgeDefinition[]): TResolvedKnowledgeDefinition[] {
    const explicitUncraftResults = new Set(
        definitions
            .filter((definition) => definition.canonicalType === "uncraft")
            .map((definition) => definition.raw.result)
            .filter((result): result is string => typeof result === "string")
    );
    const selectedResults = new Set<string>();

    return definitions
        .filter((definition) => definition.canonicalType === "recipe" && isReversible(definition.raw.reversible))
        .sort((left, right) => left.effectiveId.localeCompare(right.effectiveId, "en"))
        .filter((definition) => {
            const result = definition.raw.result;
            if (typeof result !== "string" || explicitUncraftResults.has(result) || selectedResults.has(result)) return false;
            selectedResults.add(result);
            return true;
        });
}

function extractRecipe(definition: TResolvedKnowledgeDefinition, requirements: ReadonlyMap<string, TResolvedKnowledgeDefinition>): TKnowledgeRelationCandidate[] {
    const resultId = typeof definition.raw.result === "string" ? definition.raw.result : null;
    if (resultId === null) return [];

    const sourceKey = key(definition.canonicalType, definition.effectiveId);
    const relations: TKnowledgeRelationCandidate[] = [
        candidate(definition, sourceKey, "uncrafts-item", resultId, "result", {
            quantity: typeof definition.raw.result_mult === "number" ? definition.raw.result_mult : 1,
            generatedFromReversibleRecipe: true
        })
    ];

    extractComponents(
        definition,
        sourceKey,
        definition.raw.components,
        requirements,
        {
            multiplier: 1,
            path: "components",
            visitedRequirements: new Set()
        },
        relations
    );

    const using = definition.raw.using;
    if (Array.isArray(using)) {
        using.forEach((entry, index) => {
            if (!Array.isArray(entry) || typeof entry[0] !== "string") return;
            const multiplier = typeof entry[1] === "number" ? Math.abs(entry[1]) : 1;
            extractRequirement(
                definition,
                sourceKey,
                entry[0],
                requirements,
                {
                    multiplier,
                    path: `using[${index}]`,
                    visitedRequirements: new Set()
                },
                relations
            );
        });
    }

    return relations;
}

function extractComponents(
    owner: TResolvedKnowledgeDefinition,
    sourceKey: string,
    groups: unknown,
    requirements: ReadonlyMap<string, TResolvedKnowledgeDefinition>,
    context: ComponentContext,
    result: TKnowledgeRelationCandidate[]
): void {
    if (!Array.isArray(groups)) return;

    groups.forEach((group, groupIndex) => {
        if (!Array.isArray(group)) return;
        group.forEach((entry, alternativeIndex) => {
            if (!Array.isArray(entry) || typeof entry[0] !== "string") return;

            const entryPath = `${context.path}[${groupIndex}][${alternativeIndex}]`;
            const count = (typeof entry[1] === "number" ? Math.abs(entry[1]) : 1) * context.multiplier;
            if (entry.slice(2).includes("LIST")) {
                extractRequirement(
                    owner,
                    sourceKey,
                    entry[0],
                    requirements,
                    {
                        multiplier: count,
                        path: entryPath,
                        visitedRequirements: context.visitedRequirements
                    },
                    result
                );
                return;
            }

            result.push(
                candidate(owner, sourceKey, "recovers-component", entry[0], entryPath, {
                    count,
                    groupIndex,
                    alternativeIndex,
                    groupKey: `${context.path}:${groupIndex}`,
                    generatedFromReversibleRecipe: true
                })
            );
        });
    });
}

function extractRequirement(
    owner: TResolvedKnowledgeDefinition,
    sourceKey: string,
    requirementId: string,
    requirements: ReadonlyMap<string, TResolvedKnowledgeDefinition>,
    context: ComponentContext,
    result: TKnowledgeRelationCandidate[]
): void {
    if (context.visitedRequirements.has(requirementId)) return;
    const requirement = requirements.get(requirementId);
    if (requirement === undefined) return;

    const visitedRequirements = new Set(context.visitedRequirements);
    visitedRequirements.add(requirementId);
    extractComponents(
        owner,
        sourceKey,
        requirement.raw.components,
        requirements,
        {
            multiplier: context.multiplier,
            path: `${context.path}:${requirementId}:components`,
            visitedRequirements
        },
        result
    );

    const using = requirement.raw.using;
    if (!Array.isArray(using)) return;
    using.forEach((entry, index) => {
        if (!Array.isArray(entry) || typeof entry[0] !== "string") return;
        extractRequirement(
            owner,
            sourceKey,
            entry[0],
            requirements,
            {
                multiplier: context.multiplier * (typeof entry[1] === "number" ? Math.abs(entry[1]) : 1),
                path: `${context.path}:${requirementId}:using[${index}]`,
                visitedRequirements
            },
            result
        );
    });
}

function candidate(
    definition: TResolvedKnowledgeDefinition,
    sourceKey: string,
    kind: "uncrafts-item" | "recovers-component",
    targetId: string,
    jsonPath: string,
    metadata: Record<string, unknown>
): TKnowledgeRelationCandidate {
    return {
        sourceKey,
        sourceType: definition.canonicalType,
        sourceModId: definition.sourceModId,
        sourceFile: definition.sourceFile,
        kind,
        targetId,
        expectedTargetTypes: ["ITEM"],
        jsonPath,
        metadata
    };
}

function isReversible(value: unknown): boolean {
    return value === true || (typeof value === "object" && value !== null && !Array.isArray(value));
}

function key(type: string, id: string): string {
    return `${type}:${id}`;
}
