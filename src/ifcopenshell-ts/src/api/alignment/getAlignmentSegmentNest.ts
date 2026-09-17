// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_alignment_segment_nest.py`
// (src/ifcopenshell-python) -- see `./index.ts`'s own header comment for this
// brand-new module's full scope (chunk 1 of many). No dependency of any kind, no
// blocker.
import type { EntityInstance } from "../../entityInstance";

/**
 * Searches for the `IfcRelNest` that contains `IfcAlignmentSegment` (Python:
 * `ifcopenshell.api.alignment.get_alignment_segment_nest`).
 *
 * @param layout An alignment layout, expected to be one of `IfcAlignmentHorizontal`,
 *   `IfcAlignmentVertical`, or `IfcAlignmentCant`.
 * @returns The `IfcRelNests`, or `null` if none is found.
 */
export function getAlignmentSegmentNest(layout: EntityInstance): EntityInstance | null {
	for (const nest of layout.get("IsNestedBy") as EntityInstance[]) {
		for (const relatedObject of nest.get("RelatedObjects") as EntityInstance[]) {
			if (relatedObject.isA("IfcAlignmentSegment")) return nest;
		}
	}
	return null;
}
