// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_curve_segment.py` (src/ifcopenshell-python,
// 48 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 2 of many). Depends on chunk 1's already-landed
// `getAlignmentSegmentNest` and this same chunk's own `getLayoutCurve`
// (`./getLayoutCurve.ts`) and `_getCurveSegmentCount` (real Python's own
// module-private helper, imported here from `./getMappedSegments.ts` exactly as real
// Python itself imports it from `get_mapped_segments.py` -- see that file's own
// header comment) -- no blocker.
//
// Real Python calls `.RelatedObjects` on `segment_nest` (`get_alignment_segment_nest`'s
// own possibly-`None` result) with no guard -- ported with the identical lack of a
// guard (a non-null assertion), matching real Python's own crash-on-`None`-attribute-
// access behavior for a `layout` with no `IfcAlignmentSegment` nested to it at all,
// rather than silently adding a null-check real Python doesn't have.
import type { EntityInstance } from "../../entityInstance";
import { getAlignmentSegmentNest } from "./getAlignmentSegmentNest";
import { getLayoutCurve } from "./getLayoutCurve";
import { _getCurveSegmentCount } from "./getMappedSegments";

/**
 * Returns the `IfcCurveSegment` associated with the given alignment segment (Python:
 * `ifcopenshell.api.alignment.get_curve_segment`). If the curve segment does not
 * exist, `null` is returned.
 *
 * @param layout An alignment layout.
 * @param segment The `IfcAlignmentSegment` to find the corresponding
 *   `IfcCurveSegment` for.
 * @returns The `IfcCurveSegment`, or `null` if none is found.
 *
 * @example
 * ```ts
 * const horizontal = file.byType("IfcAlignmentHorizontal")[0];
 * const curveSegment = api.alignment.getCurveSegment(horizontal, alignmentSegment);
 * ```
 */
export function getCurveSegment(layout: EntityInstance, segment: EntityInstance): EntityInstance | null {
	let index = 0;
	const segmentNest = getAlignmentSegmentNest(layout) as EntityInstance;
	for (const relatedObject of segmentNest.get("RelatedObjects") as EntityInstance[]) {
		if (relatedObject.equals(segment)) break;
		index += _getCurveSegmentCount(relatedObject);
	}

	const curve = getLayoutCurve(layout);
	if (curve && index < (curve.get("Segments") as EntityInstance[]).length) {
		return (curve.get("Segments") as EntityInstance[])[index];
	}
	return null;
}
