import { TKnowledgeGraph } from "./types/TKnowledgeGraph";
import { TKnowledgeRelationCandidate } from "./types/TKnowledgeRelationCandidate";

const EXAMPLES_PER_GROUP = 5;

export function logKnowledgeGraphDiagnostics(graph: TKnowledgeGraph, timings: { extractionMs: number; resolutionMs: number; totalMs: number }): void {
    const byKind = countBy(graph.edges.map((edge) => edge.kind));
    const unresolvedByKind = countBy(graph.unresolved.map((edge) => edge.kind));
    const unresolvedBySourceType = countBy(graph.unresolved.map((edge) => edge.sourceType));
    const unresolvedByExpectedType = countBy(graph.unresolved.flatMap((edge) => edge.expectedTargetTypes));
    const unresolvedBySourceDirectory = countBy(graph.unresolved.map((edge) => getSourceDirectory(edge.sourceFile)));

    console.info("[knowledge:graph] summary", {
        nodes: graph.nodes.length,
        edges: graph.edges.length,
        unresolved: graph.unresolved.length,
        byKind,
        unresolvedByKind,
        unresolvedBySourceType,
        unresolvedByExpectedType,
        unresolvedBySourceDirectory
    });
    console.info("[knowledge:graph] timings", {
        extractionMs: Math.round(timings.extractionMs),
        resolutionMs: Math.round(timings.resolutionMs),
        totalMs: Math.round(timings.totalMs)
    });

    if (graph.unresolved.length > 0) console.warn("[knowledge:graph] unresolved examples by category", groupExamples(graph.unresolved));
}

function groupExamples(unresolved: TKnowledgeRelationCandidate[]): Record<string, TKnowledgeRelationCandidate[]> {
    const groups = new Map<string, TKnowledgeRelationCandidate[]>();
    for (const candidate of unresolved) {
        const key = `${candidate.sourceType}.${candidate.kind}.${candidate.expectedTargetTypes.join("|")}`;
        const examples = groups.get(key) ?? [];
        if (examples.length < EXAMPLES_PER_GROUP) examples.push(candidate);
        groups.set(key, examples);
    }
    return Object.fromEntries([...groups.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function countBy(values: string[]): Record<string, number> {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function getSourceDirectory(sourceFile: string): string {
    const normalized = sourceFile.replaceAll("\\", "/");
    const separatorIndex = normalized.indexOf("/");
    return separatorIndex === -1 ? "<root>" : normalized.slice(0, separatorIndex);
}
