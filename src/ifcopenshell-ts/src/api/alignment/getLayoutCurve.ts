// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_layout_curve.py` (src/ifcopenshell-python, 53
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 2 of many). Depends on this same chunk 1's already-landed
// `getAlignment`/`getCurve` (both reused directly, no blocker).
//
// Real Python calls `ifcopenshell.api.alignment.get_curve(alignment)` with
// `alignment` possibly `None` (when `layout` isn't actually nested to any
// `IfcAlignment` -- `get_alignment`'s own documented `None` return), with no guard --
// this would raise an `AttributeError` deep inside `get_curve`'s own
// `get_representations_iter` call in real Python too. Ported with the identical lack
// of a guard (a non-null assertion on `getAlignment`'s result, so a malformed-input
// call fails the same way real Python's own does: a runtime crash, not a graceful
// `null`), rather than silently adding a null-check real Python doesn't have.
import type { EntityInstance } from "../../entityInstance";
import { getAlignment } from "./getAlignment";
import { getCurve } from "./getCurve";

/**
 * Returns the representation curve for the layout (Python:
 * `ifcopenshell.api.alignment.get_layout_curve`). This will be an
 * `IfcCompositeCurve`, `IfcGradientCurve`, or `IfcSegmentedReferenceCurve` for
 * `IfcAlignmentHorizontal`, `IfcAlignmentVertical`, or `IfcAlignmentCant`,
 * respectively.
 *
 * @param layout An alignment layout.
 * @returns The geometric representation curve, or `null` if the alignment has no
 *   representation.
 *
 * @example
 * ```ts
 * const alignment = file.byType("IfcAlignment")[0];
 * const layout = api.alignment.getHorizontalLayout(alignment);
 * const compositeCurve = api.alignment.getLayoutCurve(layout);
 * ```
 */
export function getLayoutCurve(layout: EntityInstance): EntityInstance | null {
	const alignment = getAlignment(layout) as EntityInstance;

	let curve = getCurve(alignment);
	if (curve) {
		if (layout.isA("IfcAlignmentHorizontal")) {
			// Layout is horizontal so get the IfcCompositeCurve
			if (curve.isA("IfcGradientCurve")) {
				curve = curve.get("BaseCurve") as EntityInstance;
			} else if (curve.isA("IfcSegmentedReferenceCurve")) {
				curve = (curve.get("BaseCurve") as EntityInstance).get("BaseCurve") as EntityInstance;
			}
		} else if (layout.isA("IfcAlignmentVertical")) {
			// Layout is vertical so get the IfcGradientCurve
			if (curve.isA("IfcSegmentedReferenceCurve")) {
				curve = curve.get("BaseCurve") as EntityInstance;
			}
		}
	}

	return curve;
}
