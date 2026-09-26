// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_alignment_layout_nest.py`
// (src/ifcopenshell-python) -- see `./index.ts`'s own header comment for this
// brand-new module's full scope (chunk 1 of many). No dependency of any kind, no
// blocker.
import type { EntityInstance } from "../../entityInstance";

const LAYOUT_TYPES = ["IfcAlignmentHorizontal", "IfcAlignmentVertical", "IfcAlignmentCant"];

/**
 * Searches for the `IfcRelNest` that contains `IfcAlignmentHorizontal`,
 * `IfcAlignmentVertical`, or `IfcAlignmentCant` (Python:
 * `ifcopenshell.api.alignment.get_alignment_layout_nest`).
 *
 * @param alignment The alignment.
 * @returns The `IfcRelNests` containing the alignment layout, or `null` if none is found.
 */
export function getAlignmentLayoutNest(alignment: EntityInstance): EntityInstance | null {
	for (const nest of alignment.get("IsNestedBy") as EntityInstance[]) {
		for (const relatedObject of nest.get("RelatedObjects") as EntityInstance[]) {
			if (LAYOUT_TYPES.includes(relatedObject.isA())) return nest;
		}
	}
	return null;
}
