// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_basis_curve.py` (src/ifcopenshell-python, 56
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). Its only real dependency
// (`ifcopenshell.util.representation.get_representations_iter`) is already landed
// (`util/representation.ts`'s `getRepresentationsIter`) and reused directly here --
// no blocker.
//
// --- 2 real Python quirks, both preserved verbatim ---
//
// 1. Real Python returns FROM INSIDE the `for representation in representations`
//    loop on the first match (not `break`-then-compute-after, unlike this module's
//    own `./getCurve.ts`) -- functionally the loop only ever runs once before
//    returning, so this is behaviorally equivalent to breaking first, just written
//    with an early `return`. Ported the same way (a `return` inside the loop body).
// 2. The recursive "walk up to the parent alignment's own basis curve" fallback reads
//    `alignment.Decomposes[0].RelatingObject` UNCONDITIONALLY -- no `is_a("IfcAlignment")`
//    filter on the relationship the way `./getParentAlignment.ts`'s own port does. It
//    blindly assumes the first `IfcRelDecomposes` in `Decomposes` is the
//    parent-alignment aggregation. Ported with the same unfiltered `[0]` access.
import type { EntityInstance } from "../../entityInstance";
import { getRepresentationsIter } from "../../util/representation";

/**
 * Returns the basis curve for an alignment (Python:
 * `ifcopenshell.api.alignment.get_basis_curve`).
 *
 * This curve is the geometric representation that is used as the basis curve for
 * vertical and cant alignments.
 *
 * @param alignment The alignment.
 * @returns The geometric representation used as a basis curve, typically an
 *   `IfcCompositeCurve`, or `null` if the alignment does not have a representation.
 *
 * @example
 * ```ts
 * const alignment = file.byType("IfcAlignment")[0];
 * const compositeCurve = api.alignment.getBasisCurve(alignment);
 * ```
 */
export function getBasisCurve(alignment: EntityInstance): EntityInstance | null {
	let axis: EntityInstance | null = null;

	for (const representation of getRepresentationsIter(alignment)) {
		const identifier = representation.get("RepresentationIdentifier");
		const type = representation.get("RepresentationType");
		if (
			(identifier === "Axis" && type === "Curve2D") ||
			(identifier === "FootPrint" && type === "Curve2D") ||
			(identifier === "Axis" && type === "Curve3D") // IfcPolyline/IfcIndexedPolyCurve with 3D points
		) {
			axis = representation;
			const items = axis.get("Items") as EntityInstance[] | null;
			return items == null || items.length === 0 ? null : items[0];
		}
	}

	if (axis == null) {
		const decomposes = alignment.get("Decomposes") as EntityInstance[];
		if (decomposes.length > 0) {
			const parentAlignment = decomposes[0].get("RelatingObject") as EntityInstance;
			return getBasisCurve(parentAlignment);
		}
	}

	return null;
}
