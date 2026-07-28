import { KnowledgeQualityRequirement } from "@shared/knowledge/KnowledgeQualityRequirement";

export function deduplicateQualities(qualities: KnowledgeQualityRequirement[]): KnowledgeQualityRequirement[] {
    const result = new Map<string, KnowledgeQualityRequirement>();
    for (const quality of qualities) {
        const key = `${quality.qualityId}:${quality.level}`;
        const previous = result.get(key);
        if (previous === undefined) result.set(key, quality);
        else result.set(key, { ...previous, providers: [...new Map([...previous.providers, ...quality.providers].map((provider) => [provider.itemId, provider])).values()] });
    }
    return [...result.values()];
}
