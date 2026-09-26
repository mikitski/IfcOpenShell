// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_child_alignments.py` (src/ifcopenshell-python,
// 41 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). No dependency of any kind, no blocker.
//
// Real Python's return type is `collections.abc.Sequence[entity_instance]` -- a
// return-type hint only (no runtime behavior of its own), ported here as
// `readonly EntityInstance[]`, matching this project's established convention for a
// read-only-return `Sequence` hint (e.g. `util/representation.ts`'s own
// `getRepresentationsIter`).
import type { EntityInstance } from "../../entityInstance";

/**
 * Returns the aggregated child alignments to this alignment per CT 4.1.4.4.1.2
 * Alignment Layout - Reusing Horizontal Layout (Python:
 * `ifcopenshell.api.alignment.get_child_alignments`).
 *
 * @param alignment The `IfcAlignment`.
 * @returns The child `IfcAlignment`s aggregated to this alignment (possibly empty).
 *
 * @example
 * ```ts
 * const alignment = file.byType("IfcAlignment")[0];
 * const children = api.alignment.getChildAlignments(alignment);
 * ```
 */
export function getChildAlignments(alignment: EntityInstance): readonly EntityInstance[] {
	const children: EntityInstance[] = [];
	for (const rel of alignment.get("IsDecomposedBy") as EntityInstance[]) {
		for (const child of rel.get("RelatedObjects") as EntityInstance[]) {
			if (child.isA("IfcAlignment")) children.push(child);
		}
	}
	return children;
}
