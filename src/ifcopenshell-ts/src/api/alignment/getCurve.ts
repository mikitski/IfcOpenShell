// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_curve.py` (src/ifcopenshell-python, 49
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). Its only real dependency
// (`ifcopenshell.util.representation.get_representations_iter`) is already landed
// (`util/representation.ts`'s `getRepresentationsIter`) and reused directly here --
// no blocker.
import type { EntityInstance } from "../../entityInstance";
import { getRepresentationsIter } from "../../util/representation";

/**
 * Returns the geometric representation curve for an alignment (Python:
 * `ifcopenshell.api.alignment.get_curve`).
 *
 * An alignment without layouts will have a curve of type `IfcPolyLine` or
 * `IfcIndexedPolyCurve`. A horizontal only will have a curve of type
 * `IfcCompositeCurve`. A horizontal+vertical will have a curve of type
 * `IfcGradientCurve`. A horizontal+vertical+cant will have a curve of type
 * `IfcSegmentedReferenceCurve`.
 *
 * @param alignment The alignment.
 * @returns The geometric representation of the alignment, or `null` if the alignment
 *   does not have a representation.
 *
 * @example
 * ```ts
 * const alignment = file.byType("IfcAlignment")[0];
 * const gradientCurve = api.alignment.getCurve(alignment);
 * ```
 */
export function getCurve(alignment: EntityInstance): EntityInstance | null {
	let axis: EntityInstance | null = null;
	for (const representation of getRepresentationsIter(alignment)) {
		const identifier = representation.get("RepresentationIdentifier");
		const type = representation.get("RepresentationType");
		if (identifier === "Axis" && (type === "Curve2D" || type === "Curve3D")) {
			axis = representation;
			break;
		}
	}

	if (axis == null) return null;
	const items = axis.get("Items") as EntityInstance[] | null;
	return items == null || items.length === 0 ? null : items[0];
}
