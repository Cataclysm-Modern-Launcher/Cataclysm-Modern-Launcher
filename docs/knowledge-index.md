# Knowledge index

The knowledge subsystem treats game JSON as a load-ordered stream of definitions rather than as an item database.

The indexing pipeline is split into independent stages:

1. Resolve the active game data and world mod sources in `mods.json` order.
2. Scan JSON files and retain every top-level definition with a string `type`.
3. Use `GetKnowledgeTypeDescriptor` descriptors to assign a canonical namespace, identity strategy and cardinality.
4. Resolve inheritance through a definition lookup that preserves source order and identity aliases.
5. Build generic knowledge entities for search and display.
6. Persist the completed index through `KnowledgeIndexPersistence`.

Identity strategies are explicit, composite, deferred until inheritance, known anonymous, and unknown. Unknown identities are retained with deterministic fallback keys and are reported with representative source examples.

Descriptors are deliberately small and type-focused. Types without a dedicated descriptor use the generic `id`/`abstract`/`ident` strategy. Legacy top-level item types share the canonical `ITEM` namespace. String-array identifiers are retained as aliases so inheritance references can resolve through any registered ID.

Inheritance resolution keeps raw definitions addressable before selecting effective single-cardinality entities. A parent lookup prefers the latest matching definition that appears before the child. When no earlier definition exists, it may resolve a later declaration, which is required because the launcher's deterministic file traversal does not necessarily match every loader's registration order. Self-copy overrides therefore inherit from the previous definition, while ordinary forward references remain resolvable.

The resolver applies best-effort `extend`, `delete`, `relative` and `proportional` operations. Numeric operations recurse through objects and match structured array entries by stable discriminator fields. Because DDA loaders do not all share identical inheritance semantics, partially unsupported paths are retained unchanged and logged with representative source examples rather than being silently accepted.

Diagnostics separately report unknown identities, deferred identities resolved after inheritance, unresolved parents, inheritance cycles, source overrides, same-source replacements, and partially unsupported operations.

The persisted snapshot is disposable. Its key includes the schema version, bundle, world and ordered active mod IDs. A schema change invalidates the snapshot. The renderer also exposes a manual rebuild action. The storage implementation is hidden behind `KnowledgeIndexPersistence` so the JSON snapshot can later be replaced by SQLite without changing the index builder.

## Recipe identity and scalar inheritance

Recipe identity is finalized after inheritance has been applied. Recipe lookup aliases include the result ID and the legacy underscore form used by `copy-from` for suffixes and variants, while the entity keeps a distinct result/suffix/variant identity.

Numeric inheritance delegates scalar handling to a registry. Plain numbers and unit-bearing strings are currently supported; structured operations still report the exact path and reason when they cannot be applied. Missing numeric fields used by `relative` are treated as zero, matching the common JSON inheritance form for newly introduced numeric members.

## Numeric inheritance semantics

The resolver mirrors the current DDA loaders for structured numeric inheritance where the game defines custom handlers:

- `damage_instance` proportional operations select an existing `damage_type` and multiply only the provided damage fields; omitted multipliers stay at `1`.
- `damage_instance` relative operations add fields to an existing matching `damage_type`; multiplier defaults are treated as zero additions, matching `damage_instance::operator+=`.
- item melee damage maps multiply or add only existing damage-type entries and floor the result, preserving the game's legacy integer behavior.
- monster armor maps are handled as keyed resistance values when explicit keys are present. Full damage-type derivation remains a later concern because the game performs it during finalization using loaded `damage_type` definitions.
- money is parsed using the units supported by `units::money_units`, converted to integer cents, and proportional results truncate toward zero as `units::money` does.

Unsupported structured forms remain unchanged and are reported with target and operand previews.

## Loader defaults and specialized numeric operations

The resolver keeps C++ loader defaults outside the generic numeric-operation engine. `getDefinitionDefault` currently covers only values verified in the game sources: item price (`0 cent`), ammo dispersion (`0`), monster attack cost (`100`), morale (`0`), and melee dice sides (`0`).

Specialized operation adapters mirror loader behavior where raw JSON shape is insufficient:

- `uncraft` entities are identified by their concrete `result`; `abstract` remains an inheritance key.
- Item melee-damage relative operations add only damage types already present in the loaded damage map, matching `item_melee_damage::operator+=`; proportional operations multiply existing types and floor the result.
- Monster resistance relative operations add missing damage types from zero; proportional scalar operations multiply every resistance value without integer rounding.
- Legacy numeric `relative.to_hit` applied to an object-form melee-accuracy definition first converts grip, length, surface, and balance to the same summed integer used by the game, then applies the delta.
