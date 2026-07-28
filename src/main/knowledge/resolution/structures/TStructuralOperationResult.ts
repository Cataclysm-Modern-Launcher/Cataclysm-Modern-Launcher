export type TStructuralOperationResult = { applied: true; value: unknown } | { applied: false; reason?: "missing-target" | "type-mismatch" | "unsupported-structure" };
