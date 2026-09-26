// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_parent_alignment.py` (src/ifcopenshell-python,
// 40 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). No dependency of any kind, no blocker.
//
// Real Python loops `alignment.Decomposes` (every `IfcRelDecomposes` this alignment is
// a `RelatedObject` of, whatever the concrete subtype -- `IfcRelAggregates` for a
// parent/child alignment pair per this module's own docstring) and returns the first
// whose `RelatingObject.is_a("IfcAlignment")` -- no `is_a("IfcRelAggregates")` filter
// on the relationship itself, ported verbatim (an `IfcAlignment` is only ever
// decomposed via aggregation in this module's own usage, so this is not a
// distinguishing check in practice).
import type { EntityInstance } from "../../entityInstance";

/**
 * Returns the parent alignment (Python: `ifcopenshell.api.alignment.get_parent_alignment`).
 *
 * When multiple vertical alignments share a horizontal alignment, the horizontal
 * alignment is nested to the parent alignment, a child alignment is aggregated to the
 * parent alignment for each vertical alignment, and the vertical alignment is nested
 * with its child alignment.
 *
 * @param alignment The `IfcAlignment`.
 * @returns The parent `IfcAlignment`, or `null` if this alignment has no parent.
 *
 * @example
 * ```ts
 * const alignment = file.byType("IfcAlignment")[0];
 * const parent = api.alignment.getParentAlignment(alignment);
 * ```
 */
export function getParentAlignment(alignment: EntityInstance): EntityInstance | null {
	for (const rel of alignment.get("Decomposes") as EntityInstance[]) {
		const relatingObject = rel.get("RelatingObject") as EntityInstance;
		if (relatingObject.isA("IfcAlignment")) return relatingObject;
	}
	return null;
}
