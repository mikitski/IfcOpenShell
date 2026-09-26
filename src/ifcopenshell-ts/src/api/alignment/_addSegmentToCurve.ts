// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_add_segment_to_curve.py` (src/ifcopenshell-
// python, 168 lines) -- see `./index.ts`'s own header comment for this brand-new
// module's full scope (chunk 7 of many). Two functions: private (to the real Python
// FILE, not re-exported by it at all) `_add_curve_segment_to_composite_curve`, and the
// module-private `_add_segment_to_curve` (the only one imported by any OTHER real
// Python file -- `_add_segment_to_layout.py`, landed later in this same chunk, and
// `create_representation.py`, out of this chunk's scope -- confirmed by grepping the
// whole real Python source tree). Only `_addSegmentToCurve` is `export`ed from this
// file; `_addCurveSegmentToCompositeCurve` stays fully file-private (no `export` at
// all), matching that same real-Python-level privacy distinction exactly.
//
// Depends on this module's own already-landed `_mapAlignmentHorizontalSegment`/
// `_mapAlignmentVerticalSegment`/`_mapAlignmentCantSegment` (chunk 5),
// `hasZeroLengthSegment` (chunk 1), and this chunk's own `_updateCurveSegmentTransitionCode`
// (file 1 of this chunk, `./_updateCurveSegmentTransitionCode.ts`) -- all verified
// against their real exported name/signature before use. Does NOT import
// `_updateZeroLengthSegmentPlacement` or anything standing in for the unported
// `_get_segment_endpoint` -- see the dedicated section below for why.
//
// --- CONFIRMED: `IfcGradientCurve`/`IfcSegmentedReferenceCurve` genuinely ARE schema
//     subtypes of `IfcCompositeCurve` -- the blanket `curve.is_a("IfcCompositeCurve")`
//     check is NOT a bug ---
//
// Empirically verified against a real installed `ifcopenshell` (not assumed): after the
// 3 earlier, more specific per-`DesignParameters`-type checks (which already require
// `curve.is_a("IfcCompositeCurve")`/`"IfcGradientCurve"`/`"IfcSegmentedReferenceCurve")`
// respectively), real Python's own final `if not curve.is_a("IfcCompositeCurve"): raise
// TypeError(...)` is a real, if redundant-looking, defensive check -- since
// `IfcGradientCurve`/`IfcSegmentedReferenceCurve` both really are `IfcCompositeCurve`
// subtypes (per the real IFC4X3 EXPRESS schema), this check always passes for any
// `curve` that already passed one of the 3 earlier checks. Ported verbatim, not removed
// as "dead"/"redundant" -- it's real Python's own defensive-programming style, not a
// translation artifact.
//
// --- Real Python quirk: `settings = ifcopenshell.geom.settings()` is a genuine DEAD,
//     UNUSED local variable in `_add_curve_segment_to_composite_curve` -- and this port
//     has no `ifcopenshell.geom` binding of any kind to even construct one ---
//
// Real Python's own line 64 (`settings = ifcopenshell.geom.settings()`) is assigned and
// then NEVER referenced again anywhere in the rest of the function (confirmed by
// reading the full 75-line body after that assignment) -- a genuine real-Python dead-
// variable bug, independent of any kernel gap. Since this TS port also has no
// `ifcopenshell.geom` binding of any kind (confirmed: no `geom` module exists anywhere
// under `src/`, the same permanent architectural boundary `TODOS.md`'s
// `getAxis2placement`/`util.shape` entries already track), this line is simply not
// transcribed at all -- there is nothing to preserve (its result is thrown away in real
// Python too) and nothing meaningful to throw about (unlike `_get_segment_endpoint`
// below, this call has no real caller-visible effect to disclose).
//
// --- THE ACTUAL BLOCKER, and a genuinely NUANCED finding about exactly WHERE each
//     real invocation throws ---
//
// `_add_curve_segment_to_composite_curve`'s own `_get_segment_endpoint` call (its own
// line 112) is UNCONDITIONAL -- reached for every real invocation, first segment or
// not. `_get_segment_endpoint` needs the real geometry kernel
// (`ifcopenshell.geom.settings`/`ifcopenshell_wrapper.map_shape`/
// `function_item_evaluator`) and is NOT, and will never be, ported in this TS port
// (matching `./index.ts`'s own "Still pending" list) -- so it is not imported here at
// all; the exact call site throws a clear, descriptive `Error` directly instead,
// matching `updateEndPoint.ts`'s own established "calls an unported dependency"
// disclosure phrasing.
//
// BUT real Python's own control flow means this is not the ONLY throw point reached in
// practice, and WHICH one fires first depends on `curve`'s current shape:
//   1. First segment (`curve.Segments` empty/null): `prev_segment` stays `null` --
//      control falls straight through to the unconditional `_get_segment_endpoint`
//      call, which throws THIS file's own disclosed kernel-gap error.
//   2. Not the first segment, with a `prev_segment` (either sub-case: a zero-length
//      segment exists AND `curve.Segments.length > 1`, OR no zero-length segment exists
//      at all): `if (prevSegment)` is true, so `_updateCurveSegmentTransitionCode
//      (prevSegment, curveSegment)` (this chunk's own file 1) is called FIRST -- and
//      THAT function throws UNCONDITIONALLY (it calls the separately-unported,
//      separately-permanently-excluded `getCurveSegmentTransitionCode`) -- so this
//      sub-case throws EARLIER, at file 1's own error, and the unconditional
//      `_get_segment_endpoint` call below it is never even reached.
//   3. Not the first segment, but WITHOUT a `prev_segment` (the narrow edge case: a
//      zero-length segment exists AND `curve.Segments.length <= 1`, i.e. `curve`
//      currently holds ONLY that one zero-length segment and nothing before it):
//      `prev_segment` stays `null` (the `elif zero_length_segment == None` branch
//      doesn't fire either, since `zero_length_segment` IS truthy here) -- falls
//      through to the SAME unconditional `_get_segment_endpoint` throw as case 1.
// In EVERY case, the real `composite_curve.Segments` array-splicing mutation (the
// actual segment-insertion "graph surgery" -- appending the first segment, or
// re-slicing/re-appending around an existing zero-length segment) has ALREADY happened,
// for real, by the time either throw occurs -- ported completely and faithfully,
// matching this project's "port every real branch up to the exact blocked call"
// discipline. `curveSegment.UsingCurves.length === 1` (real Python's own bare `assert`
// after the first-segment append) is ported as a thrown `Error` (this project's
// established "Python `assert` -> thrown `Error`" convention, see
// `_createGeometricRepresentation.ts`'s own header comment).
//
// The 2-step `compositeCurve.set("Segments", [])` then `.set("Segments", [...])` dance
// (real Python: `composite_curve.Segments = []` immediately followed by `composite_curve
// .Segments += segments`, rather than a single assignment) is ported LITERALLY as 2
// separate `.set()` calls, not collapsed into one -- unclear whether this is a
// deliberate inverse-attribute-cache reset or just incidental style in real Python, so
// it's preserved rather than "simplified" away.
//
// --- `_add_segment_to_curve`'s own unmatched-quote `TypeError`, same bug family as
//     `hasZeroLengthSegment.ts`/`updateEndPoint.ts` ---
//
// Real Python: `f"Expected entity type to be one of {[_ for _ in expected_types]},
// instead received '{layout_segment.is_a()}"` -- opens a `'` right before
// `{layout_segment.is_a()}` but never closes it. `pythonListRepr` below is the same
// helper redefined per this project's "small pure helper, no cross-file sharing"
// convention.
//
// `layout_segment.Nests[0].RelatingObject` (the cant-layout lookup) is read with NO
// length guard on `Nests`, matching real Python's own unguarded `Nests[0]` (an
// `IndexError` in real Python for an un-nested segment; this port's `nests[0]` is
// `undefined`, and `.get("RelatingObject")` on it throws a different, but equally
// natural, TS crash for the same malformed input -- not specially guarded against,
// matching `getLayoutCurve.ts`'s own identical precedent).
//
// `mappedSegments`'s loop (`for (const mappedSegment of mappedSegments) if
// (mappedSegment) ...`) and the `endPoint = ...` Python `Ellipsis`-sentinel dance
// (`assert end_point is not ...` at the end) are ported using the same `unique symbol`
// sentinel technique `util/migrator.ts`'s own `UNRESOLVED` constant already established
// for this exact pattern.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import type { MatrixType } from "../../util/placement";
import { _mapAlignmentCantSegment } from "./_mapAlignmentCantSegment";
import { _mapAlignmentHorizontalSegment } from "./_mapAlignmentHorizontalSegment";
import { _mapAlignmentVerticalSegment } from "./_mapAlignmentVerticalSegment";
import { _updateCurveSegmentTransitionCode } from "./_updateCurveSegmentTransitionCode";
import { hasZeroLengthSegment } from "./hasZeroLengthSegment";

/** Python's `f"{[_ for _ in expected_types]}"` -- see this file's own header comment
 * for the deliberately unmatched closing quote this reproduces (same bug family as
 * `hasZeroLengthSegment.ts`). */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

/** Sentinel for Python's `end_point = ...` (Ellipsis, "no branch matched at all yet") --
 * see `util/migrator.ts`'s own identical `UNRESOLVED` sentinel's doc comment. */
const END_POINT_UNSET: unique symbol = Symbol("addSegmentToCurve-endPoint-unset");

/**
 * Adds a curve segment to a composite curve and returns the end point of the added
 * segment (Python: `ifcopenshell.api.alignment._add_segment_to_curve
 * ._add_curve_segment_to_composite_curve`, file-private in real Python too -- not
 * `export`ed here).
 *
 * @throws {TypeError} If `curveSegment` already belongs to another curve.
 * @throws {Error} A real Python `assert` (ported as a thrown `Error`, this project's
 *   established convention), or -- for every real invocation -- the disclosed kernel
 *   gap at exactly the point described in this file's own header comment.
 */
function _addCurveSegmentToCompositeCurve(
	_file: IfcFile,
	layoutSegment: EntityInstance,
	curveSegment: EntityInstance,
	compositeCurve: EntityInstance,
): MatrixType | null {
	if ((curveSegment.get("UsingCurves") as EntityInstance[]).length > 0) {
		throw new TypeError("IfcCurveSegment cannot belong to other curves");
	}

	let prevSegment: EntityInstance | null = null;
	let zeroLengthSegment: EntityInstance | null = null;

	// Real Python's own `settings = ifcopenshell.geom.settings()` here is a genuine
	// dead, unused local variable, and this port has no `ifcopenshell.geom` binding of
	// any kind to even construct one -- see this file's own header comment. Not ported.

	const currentSegments = compositeCurve.get("Segments") as EntityInstance[] | null;
	if (!currentSegments || currentSegments.length === 0) {
		// This is the first segment so just add it.
		if (!currentSegments) {
			compositeCurve.set("Segments", []);
		}

		// The last segment is always discontinuous.
		curveSegment.set("Transition", "DISCONTINUOUS");

		compositeCurve.set("Segments", [...((compositeCurve.get("Segments") as EntityInstance[]) ?? []), curveSegment]);

		if ((curveSegment.get("UsingCurves") as EntityInstance[]).length !== 1) {
			throw new Error("Assertion failed: curveSegment.UsingCurves must have exactly 1 entry after appending.");
		}
	} else {
		// Not the first segment, so get the zero-length segment (if it exists).
		zeroLengthSegment = hasZeroLengthSegment(compositeCurve) ? currentSegments[currentSegments.length - 1] : null;

		// Get the previous segment, which is either the one preceding the zero length
		// segment (if it exists) or the last curve segment if there is no zero length
		// segment. This segment's transition code will need to be updated to match the
		// new curve segment.
		if (zeroLengthSegment && currentSegments.length > 1) {
			prevSegment = currentSegments[currentSegments.length - 2];
		} else if (zeroLengthSegment === null) {
			prevSegment = currentSegments[currentSegments.length - 1];
		}

		// IfcCompositeCurve is supposed to be comprised of continuous segments.
		curveSegment.set("Transition", "DISCONTINUOUS");

		// Get a list of all but the last segment (skips the zero length segment, if it
		// exists).
		const segmentsPrefix = currentSegments.slice(0, -1);
		if (zeroLengthSegment) {
			// If there is a zero length segment, need to append the new curveSegment and
			// the zero length segment to the array, then update the composite curve
			// segments with the new array. Ported as 2 literal `.set()` calls -- see this
			// file's own header comment.
			compositeCurve.set("Segments", []);
			compositeCurve.set("Segments", [...segmentsPrefix, curveSegment, zeroLengthSegment]);
		} else {
			// If there is no zero length segment, we can just append the new curve
			// segment to the existing array of segments.
			compositeCurve.set("Segments", [...currentSegments, curveSegment]);
		}
	}

	if (prevSegment) {
		// *** BLOCKED HERE for every non-first-segment invocation with a real
		// `prevSegment` -- see this file's own header comment, case 2. Always throws
		// (file 1 of this chunk). ***
		_updateCurveSegmentTransitionCode(prevSegment, curveSegment);
	}

	// *** BLOCKED HERE, unconditionally, for every remaining reachable case -- see this
	// file's own header comment, cases 1 and 3. Real Python's own `_get_segment_endpoint`
	// needs the real geometry kernel and is not, and will never be, ported in this TS
	// port -- not imported here at all; thrown directly instead. The real Segments
	// mutation above has already happened for real by this point. ***
	throw new Error(
		`_addCurveSegmentToCompositeCurve: computing the end point of the newly-added segment for '${layoutSegment.isA()}' needs api.alignment._getSegmentEndpoint, which needs the real geometry kernel (ifcopenshell.geom.settings/ifcopenshell_wrapper.map_shape/function_item_evaluator) and is not, and will never be, ported in this TS port -- see TODOS.md. The real IfcCompositeCurve.Segments mutation above has already been applied.`,
	);
}

/**
 * Creates an `IfcCurveSegment` from the `IfcAlignmentSegment` and adds it to the
 * representation curve (Python: `ifcopenshell.api.alignment._add_segment_to_curve`).
 * The `IfcCurveSegment` is added at the end of the curve, but before the mandatory zero
 * length segment. The `IfcCurveSegment.Transition` for the segment that precedes the
 * new segment is updated.
 *
 * @param file The file.
 * @param layoutSegment The `IfcAlignmentSegment` to be added to `curve`.
 * @param curve The representation curve receiving the segment.
 * @throws {TypeError} If `layoutSegment` is not an `IfcAlignmentSegment`, or `curve`
 *   doesn't match the shape expected for `layoutSegment.DesignParameters`'s own type --
 *   see this file's own header comment for the exact (deliberately malformed) first
 *   message text.
 * @throws {Error} For every real invocation -- see this file's own header comment for
 *   exactly which of 2 disclosed blockers is reached first, depending on `curve`'s
 *   current shape.
 */
export function _addSegmentToCurve(
	file: IfcFile,
	layoutSegment: EntityInstance,
	curve: EntityInstance,
): MatrixType | null {
	const expectedTypes = ["IfcAlignmentSegment"];
	if (!expectedTypes.includes(layoutSegment.isA())) {
		throw new TypeError(
			`Expected entity type to be one of ${pythonListRepr(expectedTypes)}, instead received '${layoutSegment.isA()}`,
		);
	}

	const designParameters = layoutSegment.get("DesignParameters") as EntityInstance;

	if (designParameters.isA("IfcAlignmentHorizontalSegment") && !curve.isA("IfcCompositeCurve")) {
		throw new TypeError(`Expected to see IfcCompositeCurve, instead received '${curve.isA()}'.`);
	}
	if (designParameters.isA("IfcAlignmentVerticalSegment") && !curve.isA("IfcGradientCurve")) {
		throw new TypeError(`Expected to see IfcGradientCurve, instead received '${curve.isA()}'.`);
	}
	if (designParameters.isA("IfcAlignmentCantSegment") && !curve.isA("IfcSegmentedReferenceCurve")) {
		throw new TypeError(`Expected to see IfcSegmentedReferenceCurve, instead received '${curve.isA()}'.`);
	}

	// See this file's own header comment: this blanket check is NOT a bug --
	// `IfcGradientCurve`/`IfcSegmentedReferenceCurve` genuinely ARE `IfcCompositeCurve`
	// subtypes, so it always passes for any `curve` that already passed one of the 3
	// checks above.
	const expectedType = "IfcCompositeCurve";
	if (!curve.isA(expectedType)) {
		throw new TypeError(`Expected to see ${expectedType}, instead received ${curve.isA()}.`);
	}

	// Map the IfcAlignmentSegment to an IfcCurveSegment (or two in the case of Helmert
	// curves).
	let mappedSegments: readonly [EntityInstance, EntityInstance | null];
	if (designParameters.isA("IfcAlignmentHorizontalSegment")) {
		mappedSegments = _mapAlignmentHorizontalSegment(file, layoutSegment);
	} else if (designParameters.isA("IfcAlignmentVerticalSegment")) {
		mappedSegments = _mapAlignmentVerticalSegment(file, layoutSegment);
	} else if (designParameters.isA("IfcAlignmentCantSegment")) {
		// Unguarded `Nests[0]` -- see this file's own header comment.
		const nests = layoutSegment.get("Nests") as EntityInstance[];
		const cantLayout = nests[0].get("RelatingObject") as EntityInstance;
		mappedSegments = _mapAlignmentCantSegment(file, layoutSegment, cantLayout.get("RailHeadDistance") as number);
	} else {
		throw new Error("Assertion failed: unreachable -- DesignParameters must be Horizontal/Vertical/Cant.");
	}

	let endPoint: MatrixType | null | typeof END_POINT_UNSET = END_POINT_UNSET;
	for (const mappedSegment of mappedSegments) {
		if (mappedSegment) {
			endPoint = _addCurveSegmentToCompositeCurve(file, layoutSegment, mappedSegment, curve);
		}
	}

	if (endPoint === END_POINT_UNSET) {
		throw new Error("Assertion failed: endPoint must be set after mapping at least one segment.");
	}

	return endPoint;
}
