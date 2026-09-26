// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_layout.py` (src/ifcopenshell-python, 34
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). No dependency of any kind, no blocker.
//
// Real Python: `nests = segment.Nests; if nests: layout = nests[0].RelatingObject` --
// only the FIRST `IfcRelNests` in `segment.Nests` is consulted (an
// `IfcAlignmentSegment` is expected to be nested to exactly one layout at a time, so
// this isn't a meaningful ordering choice, just ported verbatim for fidelity).
import type { EntityInstance } from "../../entityInstance";

/**
 * Retrieves the layout to which an alignment segment belongs (Python:
 * `ifcopenshell.api.alignment.get_layout`).
 *
 * @param segment The `IfcAlignmentSegment`.
 * @returns The `IfcAlignmentHorizontal`/`IfcAlignmentVertical`/`IfcAlignmentCant` this
 *   segment is nested to, or `null` if it isn't nested to anything.
 * @throws {TypeError} If `segment` is not an `IfcAlignmentSegment`.
 */
export function getLayout(segment: EntityInstance): EntityInstance | null {
	if (!segment.isA("IfcAlignmentSegment")) {
		throw new TypeError(`Expected entity type to be IfcAlignmentSegment, instead received ${segment.isA()}`);
	}

	const nests = segment.get("Nests") as EntityInstance[];
	return nests.length > 0 ? (nests[0].get("RelatingObject") as EntityInstance) : null;
}
