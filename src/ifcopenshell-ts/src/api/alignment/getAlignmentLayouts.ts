// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_alignment_layouts.py` (src/ifcopenshell-python,
// 31 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). No dependency of any kind, no blocker.
//
// Real Python's return type is `collections.abc.Sequence[entity_instance]` -- ported
// as `readonly EntityInstance[]`, matching `./getChildAlignments.ts`'s own identical
// convention.
import type { EntityInstance } from "../../entityInstance";

/**
 * Returns the layout alignments nested to this alignment (Python:
 * `ifcopenshell.api.alignment.get_alignment_layouts`).
 *
 * @param alignment The `IfcAlignment`.
 * @returns The nested `IfcAlignmentHorizontal`/`IfcAlignmentVertical`/`IfcAlignmentCant`
 *   instances (possibly empty).
 */
export function getAlignmentLayouts(alignment: EntityInstance): readonly EntityInstance[] {
	const layouts: EntityInstance[] = [];
	for (const rel of alignment.get("IsNestedBy") as EntityInstance[]) {
		for (const layout of rel.get("RelatedObjects") as EntityInstance[]) {
			if (
				layout.isA("IfcAlignmentHorizontal") ||
				layout.isA("IfcAlignmentVertical") ||
				layout.isA("IfcAlignmentCant")
			) {
				layouts.push(layout);
			}
		}
	}
	return layouts;
}
