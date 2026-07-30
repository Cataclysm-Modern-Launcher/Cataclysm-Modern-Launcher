import { TResolvedKnowledgeDefinition } from "../../types/TResolvedKnowledgeDefinition";
import { TKnowledgeRelationCandidate } from "../types/TKnowledgeRelationCandidate";
import { extractRequirementRelations } from "./extractRequirementRelations";
import { isRecord } from "@shared/utils/isRecord";

export function extractRecipeRelations(definition: TResolvedKnowledgeDefinition, sourceKey: string): TKnowledgeRelationCandidate[] {
    const result = extractRequirementRelations(definition, sourceKey);
    const raw = definition.raw;
    const isUncraft = definition.canonicalType === "uncraft";
    const blueprint = typeof raw.construction_blueprint === "string" ? raw.construction_blueprint : null;

    if (blueprint !== null) {
        result.push(make(definition, sourceKey, "applies-mapgen", blueprint, "mapgen", "construction_blueprint", {}));
        if (typeof raw.result === "string") result.push(makeVirtual(definition, sourceKey, "provides-camp-feature", raw.result, "camp_feature", "result", { amount: 1 }));
        if (Array.isArray(raw.blueprint_provides))
            raw.blueprint_provides.forEach((entry, index) => {
                if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return;
                const id = typeof entry.id === "string" ? entry.id : null;
                if (id === null) return;
                result.push(makeVirtual(definition, sourceKey, "provides-camp-feature", id, "camp_feature", `blueprint_provides[${index}].id`, { amount: typeof entry.amount === "number" ? entry.amount : 1 }));
            });
    } else if (typeof raw.result === "string") {
        if (isUncraft) {
            result.push(make(definition, sourceKey, "uncrafts-item", raw.result, "ITEM", "result", { quantity: typeof raw.result_mult === "number" ? raw.result_mult : 1 }));
        } else {
            const candidate = make(definition, sourceKey, "produces", raw.result, "ITEM", "result", { quantity: typeof raw.result_mult === "number" ? raw.result_mult : 1 });
            // DDA has a C++-driven basecamp fortification special case where recipe.result is an update_mapgen_id.
            // This is a game-side workaround rather than the normal recipe schema, so the graph supports it explicitly.
            candidate.expectedTargetTypes = ["ITEM", "mapgen"];
            candidate.resolvedKindsByTargetType = { ITEM: "produces", mapgen: "applies-mapgen" };
            result.push(candidate);
        }
    }

    if (Array.isArray(raw.result_eocs)) {
        raw.result_eocs.forEach((entry, index) => {
            if (typeof entry === "string") {
                result.push(make(definition, sourceKey, "triggers-eoc", entry, "effect_on_condition", `result_eocs[${index}]`, {}));
            } else if (typeof entry === "object" && entry !== null && !Array.isArray(entry)) {
                const id = typeof entry.id === "string" ? entry.id : `${definition.effectiveId}:result_eocs:${index}`;
                result.push(makeVirtual(definition, sourceKey, "triggers-eoc", id, "effect_on_condition", `result_eocs[${index}]`, { inline: true, definition: entry }));
            }
        });
    }

    if (isUncraft) {
        for (const relation of result) {
            if (relation.kind === "uses-component") {
                relation.kind = "recovers-component";
            }
        }
    }
    if (typeof raw.skill_used === "string" && raw.skill_used.length > 0) {
        result.push(make(definition, sourceKey, "requires-skill", raw.skill_used, "skill", "skill_used", { level: typeof raw.difficulty === "number" ? raw.difficulty : 0, primary: true }));
    }
    if (Array.isArray(raw.skills_required)) {
        raw.skills_required.forEach((entry, index) => {
            if (Array.isArray(entry) && typeof entry[0] === "string") {
                result.push(make(definition, sourceKey, "requires-skill", entry[0], "skill", `skills_required[${index}]`, { level: typeof entry[1] === "number" ? entry[1] : 0, primary: false }));
            }
        });
    }
    if (Array.isArray(raw.proficiencies)) {
        raw.proficiencies.forEach((entry, index) => {
            if (!isRecord(entry) || typeof entry.proficiency !== "string") return;
            result.push(
                make(definition, sourceKey, "requires-proficiency", entry.proficiency, "proficiency", `proficiencies[${index}]`, {
                    required: entry.required === true,
                    timeMultiplier: typeof entry.time_multiplier === "number" ? entry.time_multiplier : undefined,
                    skillPenalty: typeof entry.skill_penalty === "number" ? entry.skill_penalty : typeof entry.fail_multiplier === "number" ? entry.fail_multiplier - 1 : undefined
                })
            );
        });
    }
    if (Array.isArray(raw.book_learn)) {
        raw.book_learn.forEach((entry, index) => {
            if (!Array.isArray(entry) || typeof entry[0] !== "string") return;
            result.push(make(definition, sourceKey, "learned-from", entry[0], "ITEM", `book_learn[${index}]`, { level: typeof entry[1] === "number" ? entry[1] : undefined }));
        });
    }
    if (Array.isArray(raw.autolearn)) {
        raw.autolearn.forEach((entry, index) => {
            if (!Array.isArray(entry) || typeof entry[0] !== "string") return;
            result.push(make(definition, sourceKey, "autolearned-at", entry[0], "skill", `autolearn[${index}]`, { level: typeof entry[1] === "number" ? entry[1] : 0 }));
        });
    } else if (raw.autolearn === true) {
        const levels = new Map<string, number>();
        if (Array.isArray(raw.skills_required)) {
            raw.skills_required.forEach((entry) => {
                if (Array.isArray(entry) && typeof entry[0] === "string") levels.set(entry[0], typeof entry[1] === "number" ? entry[1] : 0);
            });
        }
        if (typeof raw.skill_used === "string" && raw.skill_used.length > 0) levels.set(raw.skill_used, typeof raw.difficulty === "number" ? raw.difficulty : 0);
        [...levels].forEach(([skill, level], index) => result.push(make(definition, sourceKey, "autolearned-at", skill, "skill", `autolearn[derived:${index}]`, { level })));
    }
    if (typeof raw.decomp_learn === "number" && typeof raw.skill_used === "string" && raw.skill_used.length > 0) {
        result.push(make(definition, sourceKey, "learned-by-disassembly", raw.skill_used, "skill", "decomp_learn", { level: raw.decomp_learn }));
    } else if (Array.isArray(raw.decomp_learn)) {
        raw.decomp_learn.forEach((entry, index) => {
            if (!Array.isArray(entry) || typeof entry[0] !== "string") return;
            result.push(make(definition, sourceKey, "learned-by-disassembly", entry[0], "skill", `decomp_learn[${index}]`, { level: typeof entry[1] === "number" ? entry[1] : 0 }));
        });
    }
    if (Array.isArray(raw.using)) {
        raw.using.forEach((entry, index) => {
            if (Array.isArray(entry) && typeof entry[0] === "string") {
                result.push(make(definition, sourceKey, "uses-requirement", entry[0], "requirement", `using[${index}]`, { multiplier: typeof entry[1] === "number" ? entry[1] : 1, groupKey: `using:${index}` }));
            }
        });
    }
    return result;
}

function make(
    definition: TResolvedKnowledgeDefinition,
    sourceKey: string,
    kind: TKnowledgeRelationCandidate["kind"],
    targetId: string,
    targetType: string,
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
        expectedTargetTypes: [targetType],
        jsonPath,
        metadata
    };
}

function makeVirtual(
    definition: TResolvedKnowledgeDefinition,
    sourceKey: string,
    kind: TKnowledgeRelationCandidate["kind"],
    targetId: string,
    targetType: string,
    jsonPath: string,
    metadata: Record<string, unknown>
): TKnowledgeRelationCandidate {
    return {
        ...make(definition, sourceKey, kind, targetId, targetType, jsonPath, metadata),
        virtualTarget: {
            type: targetType,
            id: targetId,
            sourceModId: definition.sourceModId,
            sourceFile: definition.sourceFile,
            metadata
        }
    };
}
