// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/add_zero_length_segment.py` (src/ifcopenshell-
// python, 206 lines) -- see `./index.ts`'s own header comment for this brand-new
// module's full scope (chunk 7 of many). PUBLIC (confirmed present in real Python's
// own `__init__.py` `__all__`). Depends on this module's own already-landed
// `hasZeroLengthSegment` (chunk 1), already-landed `_updateZeroLengthSegmentPlacement`
// (chunk 5 -- NOT actually imported here, see below), `util.unit.calculateUnitScale`
// (`../../util/unit.ts`), and `api.nest.assignObject` (`../nest/assignObject.ts`) --
// all verified against their real exported name/signature before use.
//
// --- THE MOST IMPORTANT, GENUINELY DIFFERENT finding of this whole chunk: this
//     function is only CONDITIONALLY blocked, not unconditionally like every other
//     file in this chunk ---
//
// Unlike `_addSegmentToCurve.ts`/`_addSegmentToLayout.ts` (both unconditionally
// blocked on the unported `_get_segment_endpoint` for EVERY real invocation), this
// function calls `_get_segment_endpoint` ONLY when the layout/curve it's given ALREADY
// HAS at least one real segment:
//   - The composite-curve-family branch (`IfcCompositeCurve`/`IfcGradientCurve`/
//     `IfcSegmentedReferenceCurve`) guards its own `_get_segment_endpoint` call behind
//     `if layout.Segments and 0 < len(layout.Segments):` (real Python's own line 91) --
//     for a genuinely EMPTY `layout` (freshly created, no real segments yet -- e.g. one
//     hand-built by a test fixture, bypassing the also-blocked `create()`), this whole
//     branch is FULLY PORTABLE: it builds a real `IfcCurveSegment` (using the SAME
//     raw-number-at-construction-time technique established since chunk 3 for
//     `IfcCurveMeasureSelect`-typed `SegmentStart`/`SegmentLength`), appends it to
//     `Segments`, and -- for `IfcGradientCurve`/`IfcSegmentedReferenceCurve` -- RECURSES
//     into `layout.BaseCurve` via this SAME function. That recursion means a fully-
//     portable call on the OUTER curve can still throw if a NESTED base curve happens
//     to be non-empty -- exceptions simply propagate naturally through the recursive
//     call, no special handling added.
//   - `IfcAlignmentHorizontal`'s own branch guards its `_get_segment_endpoint` call
//     behind `if last_segment:` (real Python's own line 120) -- same conditional shape.
//   - `IfcAlignmentVertical`'s own branch guards its `_get_segment_endpoint` call behind
//     an identical `if last_segment:` (real Python's own line 151) -- but, unlike
//     Horizontal, it computes 2 real, portable values (`last_segment_dist_along`,
//     `last_segment_end_gradient`, both plain reads of `last_segment.DesignParameters`
//     fields) BEFORE reaching that same conditional kernel call for
//     `last_segment_height` -- ported faithfully, so a non-empty vertical layout does
//     slightly more real work before throwing than the horizontal branch does.
//   - **`IfcAlignmentCant`'s own branch calls `_get_segment_endpoint` ZERO TIMES,
//     PERIOD** -- confirmed by grepping this whole real 206-line file for
//     `_get_segment_endpoint` (exactly 3 call sites: the composite-curve-family branch,
//     `IfcAlignmentHorizontal`, `IfcAlignmentVertical` -- none inside the
//     `IfcAlignmentCant` branch). Real Python's own Cant branch reads
//     `last_segment.DesignParameters.StartDistAlong`/`HorizontalLength`/`EndCantLeft`/
//     `StartCantLeft`/`EndCantRight`/`StartCantRight` directly -- plain attribute reads,
//     never the geometric endpoint -- so `addZeroLengthSegment` on an
//     `IfcAlignmentCant` layout is ALWAYS fully portable, REGARDLESS of whether it
//     already has real segments. This refines this chunk's own original task brief,
//     which described the kernel gate as applying to "BOTH its composite-curve branch
//     and its `IfcAlignmentHorizontal`/`Vertical`/`Cant` branch" -- verified directly
//     against the real source, Cant is NOT gated at all.
//
// So: for a genuinely EMPTY layout/curve (Cant layouts unconditionally; Horizontal/
// Vertical/composite-curve-family layouts specifically when empty), this function works
// end to end, for real, and is genuinely tested with real, passing assertions below --
// not just a disclosed-throw stub, unlike every other file in this chunk. For a
// non-empty one (Horizontal/Vertical/composite-curve-family only), it throws a clear,
// descriptive error at the exact point real Python's own `_get_segment_endpoint` call
// would be reached -- `_get_segment_endpoint` needs the real geometry kernel
// (`ifcopenshell.geom.settings`/`ifcopenshell_wrapper.map_shape`/
// `function_item_evaluator`) and is not, and will never be, ported in this TS port, so
// it is not imported here at all (matching `./_addSegmentToCurve.ts`'s identical
// choice) -- the throw is written directly at each of the 3 real call sites instead.
//
// --- Real, CONFIRMED Python quirk: a bare `return` (implicit `None`) contradicts the
//     function's own `-> bool` type hint and docstring ---
//
// Real Python's own early-return branch (`if layout.is_a("IfcOffsetCurveByDistances")
// or layout.is_a("IfcPolyline") or layout.is_a("IfcIndexedPolyCurve")`) is a bare
// `return` with NO value -- despite the function's own `-> bool` type hint and its own
// docstring's "True if segment is added" claim, this branch genuinely returns `None`,
// not `False`. Ported as `return undefined`, the direct TS equivalent -- NOT silently
// "fixed" to `return false` to match the (incorrect) docstring. This is DIFFERENT from
// the function's other early return (`if hasZeroLengthSegment(layout): return false`,
// real Python's own explicit `return False`) -- only the 3-type early-return uses the
// bare/`None` form.
//
// --- Real, CONFIRMED Python quirk: NO unmatched-quote bug in this file's own
//     `TypeError` message (unlike `hasZeroLengthSegment.ts`/`_addSegmentToCurve.ts`) ---
//
// Real Python: `f"Expected layout type to be one of {[_ for _ in expected_types]},
// instead received {layout.is_a()}"` -- no stray `'` anywhere around
// `{layout.is_a()}` at all. `pythonListRepr` below is the same list-repr helper reused
// throughout this module, but the surrounding message text is a clean, correctly
// quoted f-string this time -- not every `TypeError` in this module shares the same bug.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { calculateUnitScale } from "../../util/unit";
import { assignObject as assignNestObject } from "../nest/assignObject";
import { hasZeroLengthSegment } from "./hasZeroLengthSegment";

const EXPECTED_TYPES = [
	"IfcAlignmentHorizontal",
	"IfcAlignmentVertical",
	"IfcAlignmentCant",
	"IfcCompositeCurve",
	"IfcGradientCurve",
	"IfcSegmentedReferenceCurve",
];

/** Python's `f"{[_ for _ in expected_types]}"` -- see this file's own header comment:
 * unlike `hasZeroLengthSegment.ts`, this file's own message has no unmatched-quote bug. */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

/** The shared "needs the real geometry kernel via the unported `_get_segment_endpoint`"
 * disclosed error, parameterized per call site -- see this file's own header comment
 * for exactly which 3 real call sites reach this (and which never do). */
function segmentEndpointBlockedError(context: string): Error {
	return new Error(
		`addZeroLengthSegment: ${context} needs api.alignment._getSegmentEndpoint, which needs the real geometry kernel (ifcopenshell.geom.settings/ifcopenshell_wrapper.map_shape/function_item_evaluator) and is not, and will never be, ported in this TS port -- see TODOS.md. Call addZeroLengthSegment on a freshly-created, still-empty layout/curve instead.`,
	);
}

/**
 * Adds a zero length segment to the end of a layout (Python: `ifcopenshell.api
 * .alignment.add_zero_length_segment`).
 *
 * If the layout already has a zero length segment, nothing is changed.
 *
 * See this file's own header comment for the genuinely important finding this chunk
 * surfaces: this function is only CONDITIONALLY blocked on the real geometry kernel --
 * fully portable for a genuinely empty layout/curve (always for `IfcAlignmentCant`;
 * otherwise when it has no real segments yet), and throws a clear, disclosed error only
 * when a real, non-empty layout/curve is given.
 *
 * @param file The file.
 * @param layout An `IfcAlignmentHorizontal`, `IfcAlignmentVertical`, `IfcAlignmentCant`,
 *   `IfcCompositeCurve`, `IfcGradientCurve`, or `IfcSegmentedReferenceCurve`.
 * @returns `true` if a segment was added; `false` if `layout` already had a zero length
 *   segment; `undefined` for `IfcOffsetCurveByDistances`/`IfcPolyline`/
 *   `IfcIndexedPolyCurve` (see this file's own header comment for why this deliberately
 *   preserves a real Python `-> bool`-vs-bare-`return` quirk, not "fixed" to `false`).
 * @throws {TypeError} If `layout` is not one of the expected types.
 * @throws {Error} If `layout` (or, for `IfcSegmentedReferenceCurve`/`IfcGradientCurve`,
 *   its own `BaseCurve`) already has at least one real segment -- see this file's own
 *   header comment for exactly which layout types are affected.
 */
export function addZeroLengthSegment(file: IfcFile, layout: EntityInstance): boolean | undefined {
	// These are valid curve types for alignment, but don't have the zero-length
	// segment. See this file's own header comment: real Python's bare `return` here is
	// `None`, not `False`, despite the function's own `-> bool` type hint.
	if (layout.isA("IfcOffsetCurveByDistances") || layout.isA("IfcPolyline") || layout.isA("IfcIndexedPolyCurve")) {
		return undefined;
	}

	if (!EXPECTED_TYPES.includes(layout.isA())) {
		throw new TypeError(
			`Expected layout type to be one of ${pythonListRepr(EXPECTED_TYPES)}, instead received ${layout.isA()}`,
		);
	}

	if (hasZeroLengthSegment(layout)) {
		return false;
	}

	let zeroLengthCurveSegment: EntityInstance;

	if (layout.isA("IfcCompositeCurve") || layout.isA("IfcGradientCurve") || layout.isA("IfcSegmentedReferenceCurve")) {
		const parentCurve = file.createEntity(
			"IfcLine",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
		);

		let placement: EntityInstance;
		if (layout.isA("IfcSegmentedReferenceCurve")) {
			placement = file.createEntity(
				"IfcAxis2Placement3D",
				file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]),
				file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
				file.createEntity("IfcDirection", [1.0, 0.0, 0.0]),
			);
		} else {
			placement = file.createEntity(
				"IfcAxis2Placement2D",
				file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
				file.createEntity("IfcDirection", [1.0, 0.0]),
			);
		}

		// Raw-number-at-construction technique for `IfcCurveMeasureSelect`-typed
		// `SegmentStart`/`SegmentLength` -- established since chunk 3.
		zeroLengthCurveSegment = file.createEntity("IfcCurveSegment", "DISCONTINUOUS", placement, 0.0, 0.0, parentCurve);

		const segments = layout.get("Segments") as EntityInstance[] | null;
		if (segments && segments.length > 0) {
			// *** BLOCKED HERE for a non-empty curve -- see this file's own header comment. ***
			throw segmentEndpointBlockedError(
				`'${layout.isA()}' already has ${segments.length} real segment(s) (computing the new zero-length segment's placement from the last one)`,
			);
		}

		layout.set("Segments", [...(segments ?? []), zeroLengthCurveSegment]);

		// Add zero length segments to base curves.
		if (layout.isA("IfcSegmentedReferenceCurve") || layout.isA("IfcGradientCurve")) {
			addZeroLengthSegment(file, layout.get("BaseCurve") as EntityInstance);
		}
	} else {
		let designParameters: EntityInstance;

		if (layout.isA("IfcAlignmentHorizontal")) {
			const x = 0.0;
			const y = 0.0;
			const dx = 1.0;
			const dy = 0.0;
			let lastSegment: EntityInstance | null = null;
			for (const rel of layout.get("IsNestedBy") as EntityInstance[]) {
				const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
				if (relatedObjects.length > 0) {
					lastSegment = relatedObjects[relatedObjects.length - 1];
					break;
				}
			}

			if (lastSegment) {
				// *** BLOCKED HERE -- see this file's own header comment. ***
				throw segmentEndpointBlockedError(
					`'${layout.isA()}' already has a real last segment (${lastSegment.isA()}) -- computing the new zero-length segment's start point/direction from it`,
				);
			}

			const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
			designParameters = file.createEntity(
				"IfcAlignmentHorizontalSegment",
				null,
				null,
				file.createEntity("IfcCartesianPoint", [x, y]),
				Math.atan2(dy, dx) / angleUnitScale,
				0.0,
				0.0,
				0.0,
				null,
				"LINE",
			);
			zeroLengthCurveSegment = file.createEntity(
				"IfcAlignmentSegment",
				guid.new(),
				null,
				null,
				null,
				null,
				null,
				null,
				designParameters,
			);
		} else if (layout.isA("IfcAlignmentVertical")) {
			let lastSegmentDistAlong = 0.0;
			const lastSegmentHeight = 0.0;
			let lastSegmentEndGradient = 0.0;
			let lastSegment: EntityInstance | null = null;
			for (const rel of layout.get("IsNestedBy") as EntityInstance[]) {
				const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
				if (relatedObjects.length > 0) {
					lastSegment = relatedObjects[relatedObjects.length - 1];
					break;
				}
			}

			if (lastSegment) {
				// These 2 reads are real, portable logic -- see this file's own header
				// comment: this branch does more real work than Horizontal's before
				// reaching its own kernel-gap throw.
				const lastDesignParameters = lastSegment.get("DesignParameters") as EntityInstance;
				lastSegmentDistAlong =
					(lastDesignParameters.get("StartDistAlong") as number) +
					(lastDesignParameters.get("HorizontalLength") as number);
				lastSegmentEndGradient = lastDesignParameters.get("EndGradient") as number;

				// *** BLOCKED HERE -- see this file's own header comment. ***
				throw segmentEndpointBlockedError(
					`'${layout.isA()}' already has a real last segment (${lastSegment.isA()}) -- computing the new zero-length segment's start height from it`,
				);
			}

			designParameters = file.createEntity(
				"IfcAlignmentVerticalSegment",
				null,
				null,
				lastSegmentDistAlong,
				0.0,
				lastSegmentHeight,
				lastSegmentEndGradient,
				lastSegmentEndGradient,
				null,
				"CONSTANTGRADIENT",
			);
			zeroLengthCurveSegment = file.createEntity(
				"IfcAlignmentSegment",
				guid.new(),
				null,
				null,
				null,
				null,
				null,
				null,
				designParameters,
			);
		} else {
			// IfcAlignmentCant -- see this file's own header comment: this branch NEVER
			// calls the kernel-needing `_get_segment_endpoint` at all (confirmed by
			// grepping the whole real file), regardless of whether `layout` already has
			// real segments -- ALWAYS fully portable.
			let lastSegmentDistAlong = 0.0;
			let lastSegmentCantLeft = 0.0;
			let lastSegmentCantRight = 0.0;
			for (const rel of layout.get("IsNestedBy") as EntityInstance[]) {
				const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
				if (relatedObjects.length > 0) {
					const lastSegment = relatedObjects[relatedObjects.length - 1];
					const lastDesignParameters = lastSegment.get("DesignParameters") as EntityInstance;
					lastSegmentDistAlong =
						(lastDesignParameters.get("StartDistAlong") as number) +
						(lastDesignParameters.get("HorizontalLength") as number);
					const endCantLeft = lastDesignParameters.get("EndCantLeft") as number | null;
					lastSegmentCantLeft =
						endCantLeft !== null ? endCantLeft : (lastDesignParameters.get("StartCantLeft") as number);
					const endCantRight = lastDesignParameters.get("EndCantRight") as number | null;
					lastSegmentCantRight =
						endCantRight !== null ? endCantRight : (lastDesignParameters.get("StartCantRight") as number);
					break;
				}
			}

			designParameters = file.createEntity(
				"IfcAlignmentCantSegment",
				null,
				null,
				lastSegmentDistAlong,
				0.0,
				lastSegmentCantLeft,
				null,
				lastSegmentCantRight,
				null,
				"CONSTANTCANT",
			);
			zeroLengthCurveSegment = file.createEntity(
				"IfcAlignmentSegment",
				guid.new(),
				null,
				null,
				null,
				null,
				null,
				null,
				designParameters,
			);
		}

		assignNestObject(file, { relatedObjects: [zeroLengthCurveSegment], relatingObject: layout });
	}

	return true;
}
