// This file was generated with the assistance of an AI coding tool.
//
// TS half of the reference-model read-parity harness
// (planning/ifcopenshell-ts/80-reference-parity-testing-plan.md, chunk 1 -- §4 "Normalized
// dump format"). Produces the identical normalized JSON shape
// `tools/reference_dump_python.py` emits from real `ifcopenshell-python`, so the two can
// be diffed (`diff.ts`) with no further reconciliation: one entry per instance, keyed by
// its STEP id (`"#<id>"`), holding its type name and every declared attribute slot as a
// plain positional array, in schema-declaration order.
//
// Iteration order/shape mirrors the Python script's own confirmed-empirically behavior
// (see that script's header comment), which in turn matches primitives this port's own
// `file.ts`/`entityInstance.ts`/`validate.ts` already established and rely on elsewhere
// -- nothing new is added to the native surface for this chunk:
// - `IfcFile`'s own `[Symbol.iterator]` (`file.ts`) walks every entity in the file,
//   matching Python's `file_mixin.__iter__` (`self[id] for id in self.entity_names()`) --
//   both ultimately enumerate every STEP-file instance exactly once.
// - Real Python's `entity_instance_mixin.__getitem__`/`__len__` -- what backs `list(inst)`,
//   the golden script's own attribute-walk -- resolve to the SWIG binding's `__len__`
//   (`declaration().as_entity()->attribute_count()`) and `get_argument(i)`
//   (`src/ifcwrap/IfcParseWrapper.i`, confirmed by reading it directly, not assumed).
//   `EntityInstance.attributeCount()`/`getByIndex(index)` already bind to the exact same
//   underlying "how many declared attribute slots"/"get attribute value by index"
//   primitives, so walking `0..attributeCount()-1` via `getByIndex` here reproduces
//   Python's own iteration exactly -- including DERIVE-reserved slots that don't
//   correspond to a real per-instance FORWARD occurrence (e.g. `IfcNamedUnit.Dimensions`,
//   re-declared DERIVE on `IfcSIUnit` -- confirmed empirically against a real golden that
//   Python's own `list(inst)` includes a `None` for that reserved slot position, not a
//   gap in the array; this dump function reproduces that by construction, not as a
//   special case).
//
// Scope note (matches the plan doc's §4): this is a FLAT, forward-attribute-only dump.
// Entity-typed attribute values collapse to `"#<id>"` strings, never recursively
// expanded (keeps the dump immune to inverse-relationship cycles, and directly
// comparable key-by-key against the Python golden, which does the same).

import { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";

/** One instance's normalized dump entry -- mirrors the Python script's per-key value shape. */
export interface DumpedInstance {
	readonly type: string;
	readonly attrs: readonly unknown[];
}

/** A whole file's normalized dump -- mirrors the golden JSON's own top-level shape. */
export type FileDump = Record<string, DumpedInstance>;

/**
 * Mirrors `tools/reference_dump_python.py`'s own `normalize()` exactly:
 * - An `EntityInstance` with a real STEP id (`id() > 0`) collapses to `"#<id>"`.
 * - An `EntityInstance` with `id() === 0` (an inline simple/defined-type wrapper with no
 *   own STEP line -- Python's own comment: "not expected to reach here in practice",
 *   since both SWIG's and this port's native attribute marshaling already transparently
 *   unwrap defined types to plain values at attribute-access time) falls back to its own
 *   scalar value, mirroring Python's `value.wrappedValue` fallback -- reached here via
 *   `getByIndex(0)`, the same index-based escape hatch `EntityInstance.equals()` and
 *   `validate.ts`'s own select-type branch already rely on for exactly this purpose
 *   (name-based `.get("wrappedValue")` access is a separate, disclosed, still-open gap,
 *   `entityInstance.ts`'s own header comment -- not needed here since this never goes
 *   through `.get()` by name).
 * - Arrays/aggregates recurse the same way, matching Python's `(tuple, list)` branch.
 * - Every other value (`null`/`boolean`/`number`/`string`) passes through as-is, already
 *   JSON-native.
 */
export function normalizeValue(value: unknown): unknown {
	if (value instanceof EntityInstance) {
		const stepId = value.id();
		if (stepId > 0) return `#${stepId}`;
		return normalizeValue(value.getByIndex(0));
	}
	if (Array.isArray(value)) {
		return value.map((element) => normalizeValue(element));
	}
	return value;
}

/**
 * Dumps every instance in an already-open `file` to the normalized §4 JSON shape. Pure
 * read -- never mutates `file` -- so callers own disposal of `file` themselves (matching
 * every other consumer of an `IfcFile` in this package, e.g. `validate()`).
 */
export function dumpFile(file: IfcFile): FileDump {
	const result: FileDump = {};
	for (const inst of file) {
		const attributeCount = inst.attributeCount();
		const attrs: unknown[] = new Array(attributeCount);
		for (let index = 0; index < attributeCount; index++) {
			attrs[index] = normalizeValue(inst.getByIndex(index));
		}
		result[`#${inst.id()}`] = { type: inst.isA(), attrs };
	}
	return result;
}
