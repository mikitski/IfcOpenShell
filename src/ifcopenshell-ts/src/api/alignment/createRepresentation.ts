// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create_representation.py` (src/ifcopenshell-python,
// 97 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 8 of many, the LAST chunk for this module). PUBLIC (confirmed present in
// real Python's own `__init__.py` `__all__`). Depends on already-landed
// `_addSegmentToCurve` (chunk 7), `_createGeometricRepresentation` (chunk 6),
// `updateFallbackPosition` (chunk 3), `getAlignmentLayouts`/`getAlignmentSegmentNest`/
// `getBasisCurve`/`getStationingNest` (chunk 1), `getLayoutCurve` (chunk 2) -- all
// verified directly against their real exported name/signature before use.
//
// --- CAREFULLY VERIFIED, CORRECTING this chunk's own task brief's "may be fully
//     functional for a fresh, empty alignment" hypothesis: `createRepresentation` is
//     ALSO effectively unconditionally blocked for every REALISTIC alignment shape,
//     though via a DIFFERENT, more specific path than a naive kernel-gap throw ---
//
// The task brief's own reasoning was: "for a genuinely fresh alignment with ZERO real
// segments in ANY of its layouts, `for segment in layout_nest.RelatedObjects` never
// executes at all". Tracing the real source precisely shows this is subtly wrong: real
// Python's own
//
//     layout_nest = ifcopenshell.api.alignment.get_alignment_segment_nest(layout)
//     for segment in layout_nest.RelatedObjects:
//
// has NO guard on `layout_nest` itself being `None` -- and `get_alignment_segment_nest`
// (chunk 1, `./getAlignmentSegmentNest.ts`) returns `None`/`null` PRECISELY when `layout`
// has ZERO real `IfcAlignmentSegment`s nested to it (it searches for, and only returns,
// a nest that already contains at least one). So for a layout with genuinely zero
// segments, `layout_nest` IS `None` -- and `None.RelatedObjects` raises a real Python
// `AttributeError` IMMEDIATELY, before the loop body ever has a chance to "not execute":
// the crash happens evaluating the `for`'s own iterable expression, not inside the loop.
// This port reproduces the identical crash shape via `layoutNest.get("RelatedObjects")`
// on a `null` `layoutNest` (`TypeError: Cannot read properties of null (reading 'get')`,
// the direct TS equivalent of real Python's own `AttributeError`).
//
// Since `getAlignmentSegmentNest` returning non-null NECESSARILY means at least one real
// `IfcAlignmentSegment` exists in that nest (by construction -- see its own header
// comment), the loop, if ever reached at all, ALWAYS has at least 1 iteration, which
// ALWAYS calls the now-unconditionally-blocked `_addSegmentToCurve` (chunk 7). So: for
// ANY alignment with at least one real layout -- whether that layout has zero segments
// (crashes on `layoutNest.get("RelatedObjects")` immediately) or at least one segment,
// even a hand-built one bypassing the also-blocked `createLayoutSegment` (crashes inside
// `_addSegmentToCurve` instead) -- `createRepresentation` throws. **There is no
// "genuinely fresh, empty alignment with a real layout" input for which this function
// completes successfully.**
//
// The ONLY way to reach the end of the function without throwing is a genuinely
// degenerate alignment with ZERO layouts at all (so the `for layout in layouts` loop
// itself never runs) -- `createRepresentation.test.ts` includes this as a real, passing
// test (demonstrating `_createGeometricRepresentation`'s own fully-portable "Reusing
// Horizontal" fallback branch fires unconditionally for a 0-layout alignment), purely to
// pin the precise boundary of what does and doesn't throw, not because a 0-layout
// alignment is a realistic real-world input.
//
// --- A SEPARATE, already-tracked primitive-layer gap independently blocks the trailing
//     stationing-referent-placement-update branch too, whenever it's actually reached ---
//
// The trailing `if stationing_nest and 0 < len(...) and ... and not ... is_a
// ("IfcLinearPlacement"):` block is ONLY reachable at all when the `for layout in
// layouts` loop above didn't throw -- i.e. only for the degenerate 0-layout case above,
// combined with a hand-built stationing referent whose `ObjectPlacement` is real but NOT
// already an `IfcLinearPlacement`. When exercised, this block's own
// `file.createIfcPointByDistanceExpression(DistanceAlong=file.createIfcLengthMeasure(0.0),
// ...)` construction hits the EXACT SAME already-disclosed `EntityInstance.setByIndex`/
// `IfcFile.createEntity` standalone-simple/defined-type-instance gap (`TODOS.md`'s entry
// tracked since PR #124, the SAME one `addStationingReferent.ts`'s/
// `addPositioningReferent.ts`'s own "gap 1" already discloses for their own
// `IfcPointByDistanceExpression.DistanceAlong` construction) -- NOT a new gap, no new
// `TODOS.md` entry needed. `createRepresentation.test.ts` pins this with a dedicated
// regression test (a 0-layout alignment + a hand-built stationing referent with a
// non-linear placement).
//
// --- Early-return / no-op behavior, fully portable ---
//
// `if alignment.Representation: return` is a plain, portable truthy check -- ported
// verbatim and tested with a real, passing assertion (an alignment that already has a
// representation is left completely untouched).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { _addSegmentToCurve } from "./_addSegmentToCurve";
import { _createGeometricRepresentation } from "./_createGeometricRepresentation";
import { getAlignmentLayouts } from "./getAlignmentLayouts";
import { getAlignmentSegmentNest } from "./getAlignmentSegmentNest";
import { getBasisCurve } from "./getBasisCurve";
import { getLayoutCurve } from "./getLayoutCurve";
import { getStationingNest } from "./getStationingNest";
import { updateFallbackPosition } from "./updateFallbackPosition";

/**
 * Creates the geometric representation of an alignment if it does not already exist
 * (Python: `ifcopenshell.api.alignment.create_representation`).
 *
 * This function is intended to be used when a model has only the semantic definition of
 * an alignment and you want to add the geometric representation.
 *
 * If the alignments are complete, it is recommended that `addZeroLengthSegment` is
 * called before this method to ensure the proper structure of the semantic and
 * geometric definitions of the alignment.
 *
 * It is presumed that the alignment does not have any geometric representation.
 * However, if the alignment has stationing defined, the referent defining the stationing
 * is not related to the alignment geometry (it can't be because the geometry doesn't
 * exist yet). When the geometric representation is created, the referent is updated to
 * have an `IfcLinearPlacement` that references the basis curve geometry. This function
 * assumes the referent defines the stationing at the start of the alignment, and
 * therefore sets `IfcLinearPlacement.RelativePlacement.Location.DistanceAlong` to `0.0`.
 *
 * **Effectively unconditionally blocked for every realistic alignment (one with at
 * least one real layout)** -- see this file's own header comment for the precise,
 * carefully-verified finding (correcting this chunk's own task brief's hypothesis).
 *
 * @param file The file.
 * @param alignment The alignment to create the representation for.
 * @throws {TypeError} If `alignment` is not an `IfcAlignment`.
 * @throws {Error} `Cannot read properties of null` if any layout has zero real
 *   segments, or the already-disclosed `_addSegmentToCurve` kernel-gap error if a layout
 *   has at least one -- see this file's own header comment for exactly which.
 */
export function createRepresentation(file: IfcFile, alignment: EntityInstance): void {
	const expectedType = "IfcAlignment";
	if (!alignment.isA(expectedType)) {
		throw new TypeError(`Expected to see type '${expectedType}', instead received '${alignment.isA()}'.`);
	}

	if (alignment.get("Representation")) {
		return;
	}

	_createGeometricRepresentation(file, alignment);

	const layouts = getAlignmentLayouts(alignment);
	for (const layout of layouts) {
		const curve = getLayoutCurve(layout) as EntityInstance;

		const layoutNest = getAlignmentSegmentNest(layout) as EntityInstance;
		for (const segment of layoutNest.get("RelatedObjects") as EntityInstance[]) {
			_addSegmentToCurve(file, segment, curve);
		}
	}

	// if the alignment is created without geometry it's stationing referent isn't related to the alignment geometry.
	// the stationing referent needs to be updated to have an IfcLinearPlacement that references the basis curve geometry
	const stationingNest = getStationingNest(file, alignment);
	const stationingReferents = stationingNest?.get("RelatedObjects") as EntityInstance[] | undefined;
	if (
		stationingNest &&
		stationingReferents &&
		stationingReferents.length > 0 &&
		stationingReferents[0].get("ObjectPlacement") &&
		!(stationingReferents[0].get("ObjectPlacement") as EntityInstance).isA("IfcLinearPlacement")
	) {
		const basisCurve = getBasisCurve(alignment);

		const objectPlacement = stationingReferents[0].get("ObjectPlacement") as EntityInstance | null;
		if (objectPlacement) {
			const relativePlacement = objectPlacement.get("RelativePlacement") as EntityInstance;
			const location = relativePlacement.get("Location") as EntityInstance | null;
			if (location) {
				file.remove(location);
			}
			const refDirection = relativePlacement.get("RefDirection") as EntityInstance | null;
			if (refDirection) {
				file.remove(refDirection);
			}
			file.remove(relativePlacement);
			file.remove(objectPlacement);
		}

		// *** BLOCKED HERE -- see this file's own header comment. Real Python's own
		// `file.createIfcLengthMeasure(0.0)` needs the same already-disclosed standalone
		// simple/defined-type-instance construction gap `addStationingReferent.ts`'s own
		// "gap 1" already discloses. ***
		const lp = file.createEntity(
			"IfcLinearPlacement",
			null,
			file.createEntity(
				"IfcAxis2PlacementLinear",
				file.createEntity(
					"IfcPointByDistanceExpression",
					file.createEntity("IfcLengthMeasure", 0.0),
					null,
					null,
					null,
					basisCurve,
				),
			),
		);
		updateFallbackPosition(file, lp);
		stationingReferents[0].set("ObjectPlacement", lp);
	}
}
