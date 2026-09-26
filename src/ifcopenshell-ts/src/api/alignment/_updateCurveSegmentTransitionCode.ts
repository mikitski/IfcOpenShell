// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_update_curve_segment_transition_code.py`
// (src/ifcopenshell-python, 29 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 7 of many). This is the SMALLEST possible
// kind of blocker: real Python's ENTIRE body is one line:
//
//   prev_segment.Transition = ifcopenshell.api.alignment.get_curve_segment_transition_code(prev_segment, segment)
//
// `get_curve_segment_transition_code` is the OTHER (besides `_get_segment_endpoint`)
// permanently-excluded, real-geometry-kernel-needing file in this module -- already
// named in `./index.ts`'s own "Still pending" list, right alongside
// `_get_segment_endpoint`, both needing `ifcopenshell.geom.create_shape`/
// `ifcopenshell_wrapper.map_shape`/`function_item_evaluator` (confirmed by reading
// `get_curve_segment_transition_code.py` directly). Since `getCurveSegmentTransitionCode`
// itself will NEVER exist in this TS port (same permanent architectural boundary as
// `util.shape`/`getAxis2placement`'s `IfcAxis2PlacementLinear` fallback -- see
// `TODOS.md`'s dedicated entries), there is nothing real to port here at all: this
// function throws a clear, descriptive error unconditionally, the instant it's called.
//
// The real function's own 2-argument signature (`prevSegment`, `segment`) is preserved
// exactly, and it is still a real, callable, exported (module-private, not re-exported
// from `./index.ts`'s public barrel) function -- NOT inlined away -- so its own real
// callers (`_addSegmentToCurve.ts`'s `_addCurveSegmentToCompositeCurve`, and
// `addZeroLengthSegment.ts`'s composite-curve-family branch, both landed later in this
// same chunk) can keep calling it uniformly, exactly as real Python does, and get a
// single, consistent, descriptive throw. `prevSegment`/`segment` are referenced in the
// thrown message itself (their own `isA()`), both for a more useful error and so
// neither parameter is a dead unused one.
import type { EntityInstance } from "../../entityInstance";

/**
 * Updates `IfcCurveSegment.Transition` of `prevSegment` based on a comparison of the
 * position, reference direction, and curvature at the end of `prevSegment` and the
 * start of `segment` (Python: `ifcopenshell.api.alignment
 * ._update_curve_segment_transition_code`).
 *
 * @param prevSegment The preceding `IfcCurveSegment` whose `Transition` would be updated.
 * @param segment The `IfcCurveSegment` that follows `prevSegment`.
 * @throws {Error} Always -- see this file's own header comment. Real Python's own
 *   `get_curve_segment_transition_code` needs the real geometry kernel
 *   (`ifcopenshell.geom.create_shape`/`ifcopenshell_wrapper.map_shape`/
 *   `function_item_evaluator`) and is not, and will never be, ported in this TS port.
 */
export function _updateCurveSegmentTransitionCode(prevSegment: EntityInstance, segment: EntityInstance): void {
	throw new Error(
		`_updateCurveSegmentTransitionCode: comparing the end of a real ${prevSegment.isA()} against the start of a real ${segment.isA()} needs api.alignment.getCurveSegmentTransitionCode, which needs the real geometry kernel (ifcopenshell.geom.create_shape/ifcopenshell_wrapper.map_shape/function_item_evaluator) and is not, and will never be, ported in this TS port -- see TODOS.md and ./index.ts's own "Still pending" list.`,
	);
}
