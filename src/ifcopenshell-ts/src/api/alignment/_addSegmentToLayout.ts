// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_add_segment_to_layout.py` (src/ifcopenshell-
// python, 79 lines) -- see `./index.ts`'s own header comment for this brand-new
// module's full scope (chunk 7 of many, the LAST of this chunk's 7 files). Real
// Python's own imports name `_add_segment_to_curve`/`_get_segment_endpoint`/
// `_update_zero_length_segment_placement`/`ifcopenshell.api.alignment`(for
// `get_alignment_segment_nest`)/`ifcopenshell.api.nest` as dependencies of the FULL
// function -- but this port only actually imports `api.nest.assignObject`/
// `reorderNesting` (`../nest/assignObject.ts`/`../nest/reorderNesting.ts`), both
// verified against their real exported name/signature before use. The rest
// (`_addSegmentToCurve`, `_updateZeroLengthSegmentPlacement`, `getAlignmentSegmentNest`,
// `getLayoutCurve`) are deliberately NOT imported, matching `./_addSegmentToCurve.ts`'s
// own established "don't import the unreachable thing" precedent -- see below.
//
// --- Real logic runs BEFORE hitting the unconditional kernel blocker ---
//
// Reading the real 79-line file in full: `nest.assign_object` (adding `layoutSegment`
// to `layout`'s own nesting set) and `nest.reorder_nesting` (swapping the newly-
// appended segment with the mandatory zero-length segment that was, until this call,
// last) are BOTH real, portable side effects that run BEFORE this function's own
// `_get_segment_endpoint` call (real Python's own line 66) -- which is UNCONDITIONAL,
// reached for every real invocation, no `if`/guard of any kind around it (unlike
// `addZeroLengthSegment.ts`'s own conditional gates). `_get_segment_endpoint` needs the
// real geometry kernel (`ifcopenshell.geom.settings`/`ifcopenshell_wrapper.map_shape`/
// `function_item_evaluator`) and is not, and will never be, ported in this TS port
// (matching `./index.ts`'s own "Still pending" list) -- so it is not imported here at
// all; thrown directly at the exact point real Python's own call would be, matching
// `updateEndPoint.ts`'s/`./_addSegmentToCurve.ts`'s own established "calls an unported
// dependency" disclosure phrasing.
//
// Since the throw happens before real Python's own `get_alignment_segment_nest`/
// `get_layout_curve`/`_add_segment_to_curve`/`_update_zero_length_segment_placement`
// calls are EVER reached (they all come strictly AFTER the unconditional
// `_get_segment_endpoint` call in real Python's own source), none of them is imported
// here either -- porting a call site that can never execute would be pure, unjustified
// scope creep, not fidelity. Ported the real, portable `nest.assign_object`/
// `nest.reorder_nesting` prefix completely and faithfully; the throw is disclosed at
// the exact point real Python's own kernel-needing call would actually happen, never
// proactively and never before that portable prefix has already run for real.
//
// `reorderNesting(file, { item: layoutSegment, oldIndex: -1, newIndex: -1 })` matches
// real Python's own positional `ifcopenshell.api.nest.reorder_nesting(file,
// layout_segment, -1, -1)` call exactly -- see `reorderNesting.ts`'s own header comment
// for its own disclosed `oldIndex=0`-means-"resolve actual index" falsy-default quirk,
// which does NOT apply here since `-1` (not `0`) is passed explicitly.
//
// Both `TypeError` messages here have NO unmatched-quote bug (same clean-quoting family
// as `addZeroLengthSegment.ts`'s/`_addZeroLengthSegment.ts`'s own messages, not
// `hasZeroLengthSegment.ts`'s/`_addSegmentToCurve.ts`'s buggy one) -- verified directly
// against the real source's own exact f-string text.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import type { MatrixType } from "../../util/placement";
import { assignObject as assignNestObject } from "../nest/assignObject";
import { reorderNesting } from "../nest/reorderNesting";

const EXPECTED_LAYOUT_TYPES = ["IfcAlignmentHorizontal", "IfcAlignmentVertical", "IfcAlignmentCant"];

/** Python's `f"{[_ for _ in expected_types]}"` -- see this file's own header comment:
 * no unmatched-quote bug here. */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

/**
 * Adds an `IfcAlignmentSegment` to a layout alignment (`IfcAlignmentHorizontal`/
 * `Vertical`/`Cant`) (Python: `ifcopenshell.api.alignment._add_segment_to_layout`).
 * This segment is added at the end of the layout, before the mandatory zero length
 * segment (if it exists). If the layout has a corresponding geometric representation,
 * an `IfcCurveSegment` is created for it and appended at the end of the representation
 * curve, before the zero length segment (if it exists).
 *
 * @param file The file.
 * @param layout The layout alignment.
 * @param layoutSegment The segment to be appended.
 * @throws {TypeError} If `layout` is not one of the 3 expected layout types, or
 *   `layoutSegment` is not an `IfcAlignmentSegment`.
 * @throws {Error} Always, after the real `nest.assignObject`/`reorderNesting` side
 *   effects above have already run -- see this file's own header comment. Real
 *   Python's own `_get_segment_endpoint` needs the real geometry kernel and is not, and
 *   will never be, ported in this TS port.
 */
export function _addSegmentToLayout(
	file: IfcFile,
	layout: EntityInstance,
	layoutSegment: EntityInstance,
): MatrixType | null {
	if (!EXPECTED_LAYOUT_TYPES.includes(layout.isA())) {
		throw new TypeError(
			`Expected entity type to be one of ${pythonListRepr(EXPECTED_LAYOUT_TYPES)}, instead received ${layout.isA()}`,
		);
	}

	if (!layoutSegment.isA("IfcAlignmentSegment")) {
		throw new TypeError(`Expected to see IfcAlignmentSegment, instead received ${layoutSegment.isA()}.`);
	}

	// Add the new segment to the layout.
	assignNestObject(file, { relatedObjects: [layoutSegment], relatingObject: layout });

	// Segment is attached at the end, but this is after the zero length segment --
	// swap the last two segments.
	reorderNesting(file, { item: layoutSegment, oldIndex: -1, newIndex: -1 });

	// For cant segments, the end point depends on the next segment. The next segment is
	// the zero-length segment and it hasn't been updated to match the end point. For
	// this reason, we can't compute the end point from the IfcCurveSegment, but instead
	// we compute it from the layout segment design parameters.
	//
	// *** BLOCKED HERE, unconditionally -- see this file's own header comment. The real
	// nest.assignObject/reorderNesting side effects above have already been applied. ***
	throw new Error(
		`_addSegmentToLayout: computing the end point of the newly-added segment on '${layout.isA()}' needs api.alignment._getSegmentEndpoint, which needs the real geometry kernel (ifcopenshell.geom.settings/ifcopenshell_wrapper.map_shape/function_item_evaluator) and is not, and will never be, ported in this TS port -- see TODOS.md. The real nest.assignObject/reorderNesting side effects above have already been applied.`,
	);
}
