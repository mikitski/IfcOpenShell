// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_update_zero_length_segment_placement.py`
// (src/ifcopenshell-python, 73 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 5 of many). Depends on this module's own
// already-landed `getLayout` (chunk 1) and already-landed `util.unit
// .calculateUnitScale` (`../../util/unit.ts`, verified against its real exported
// name/signature -- `calculateUnitScale(ifcFile, unitType = "LENGTHUNIT")` -- before
// use). No unported dependency of any kind, no blocker: every branch below only
// mutates an already-real entity's plain attributes (`.Coordinates`,
// `.DirectionRatios`, numeric `DesignParameters` fields), never constructs a
// standalone simple/defined-type value by name (the `EntityInstance.setByIndex`/
// `IfcFile.createEntity` gap `TODOS.md` already tracks does not apply here at all).
//
// Real Python's leading underscore marks this as module-private (absent from
// `__init__.py`'s own `__all__`) -- NOT re-exported from `./index.ts`'s public barrel,
// matching `_getCantSegment.ts`'s/`_sortNest.ts`'s own established convention.
//
// *** Confirmed UNREACHABLE end-to-end from any currently-ported public entry point,
// same situation as chunk 3's own `updateFallbackPosition`/`updateEndPoint` before
// their own later-landed callers arrived ***: this function's ONLY real caller in the
// whole module, `_add_segment_to_curve.py`, is itself still blocked on the unported,
// geometry-kernel-needing `_get_segment_endpoint` (see `./index.ts`'s own "Still
// pending" list) for every realistic invocation. Ported completely and correctly
// regardless, and tested directly with hand-built fixtures matching that same chunk 3
// precedent, rather than left unported pending its caller.
//
// --- `placement`'s numpy-`[row, col]` -> flat `gl-matrix` `mat4` index mapping ---
//
// Reuses the SAME index derivation already established by `updateEndPoint.ts`'s and
// `updateFallbackPosition.ts`'s own header comments (independently re-derived from
// `util/placement.ts`'s own `a2p` source and cross-checked against
// `api/geometry/editObjectPlacement.ts`): column 3 (flat indices 12-14) is the
// translation, column 0 (flat indices 0-2) is the local +X axis ("Rd" below, real
// Python's `placement[0, 0]`/`[1, 0]`/`[2, 0]`), column 2 (flat indices 8-10) is the
// local +Z axis ("Ad" below, real Python's `placement[0, 2]`/`[1, 2]`/`[2, 2]`). This
// file's own `placement` parameter is therefore typed `MatrixType` (`../../util
// /placement.ts`'s own `mat4` alias), matching real Python's own `np.array` 4x4
// parameter shape exactly (just a different concrete representation of the same
// matrix).
//
// --- One trivial, verbatim-preserved Python quirk ---
//
// Real Python's vertical/cant branches set `EndGradient`/`EndCantLeft`/`EndCantRight`
// by literally RE-READING the `Start*` field it just wrote a line above (e.g.
// `zero_length_segment.DesignParameters.EndGradient =
// zero_length_segment.DesignParameters.StartGradient`), rather than reusing a local
// variable -- functionally identical (the getter simply returns the value the setter
// just stored), so this port uses a local variable for the same numeric result
// without a behavioral difference worth disclosing further.
//
// The final (cant) branch calls `getLayout(zeroLengthSegment)` with NO null-guard on
// its result, exactly like real Python's own unguarded
// `ifcopenshell.api.alignment.get_layout(zero_length_segment)` -- `layout
// .RailHeadDistance` would raise a real Python `AttributeError` for a `None` result;
// this port's non-null assertion fails the same way (a runtime crash, not a graceful
// `null`), matching `_getCantSegment.ts`'s own identical unguarded-`getAlignment(...)`
// precedent.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import type { MatrixType } from "../../util/placement";
import { calculateUnitScale } from "../../util/unit";
import { getLayout } from "./getLayout";

/**
 * Updates the placement of a zero length segment (i.e. a segment with identical
 * start and end point) based on a 4x4 placement matrix (Python:
 * `ifcopenshell.api.alignment._update_zero_length_segment_placement`).
 *
 * `zeroLengthSegment` can be an `IfcAlignmentSegment` or `IfcCurveSegment`.
 *
 * @param file The file.
 * @param zeroLengthSegment The `IfcAlignmentSegment` or `IfcCurveSegment` to update.
 * @param placement The 4x4 placement matrix (see this file's own header comment for
 *   the numpy-`[row, col]` -> flat `gl-matrix` index mapping).
 */
export function _updateZeroLengthSegmentPlacement(
	file: IfcFile,
	zeroLengthSegment: EntityInstance,
	placement: MatrixType,
): void {
	const unitScale = calculateUnitScale(file);
	const x = placement[12] / unitScale;
	const y = placement[13] / unitScale;
	const z = placement[14] / unitScale;
	const Rdx = placement[0];
	const Rdy = placement[1];
	const Rdz = placement[2];
	const Adx = placement[8];
	const Ady = placement[9];
	const Adz = placement[10];

	if (zeroLengthSegment.isA("IfcCurveSegment")) {
		const segmentPlacement = zeroLengthSegment.get("Placement") as EntityInstance;
		if (segmentPlacement.isA("IfcAxis2Placement2D")) {
			(segmentPlacement.get("Location") as EntityInstance).set("Coordinates", [x, y]);
			(segmentPlacement.get("RefDirection") as EntityInstance).set("DirectionRatios", [Rdx, Rdy]);
		} else {
			(segmentPlacement.get("Location") as EntityInstance).set("Coordinates", [x, y, z]);
			(segmentPlacement.get("RefDirection") as EntityInstance).set("DirectionRatios", [Rdx, Rdy, Rdz]);
			(segmentPlacement.get("Axis") as EntityInstance).set("DirectionRatios", [Adx, Ady, Adz]);
		}
		return;
	}

	const designParameters = zeroLengthSegment.get("DesignParameters") as EntityInstance;

	if (designParameters.isA("IfcAlignmentHorizontalSegment")) {
		(designParameters.get("StartPoint") as EntityInstance).set("Coordinates", [x, y]);
		designParameters.set("StartDirection", Math.atan(Rdy / Rdx));
	} else if (designParameters.isA("IfcAlignmentVerticalSegment")) {
		designParameters.set("StartDistAlong", x);
		designParameters.set("StartHeight", y);
		const startGradient = Rdy / Rdx;
		designParameters.set("StartGradient", startGradient);
		designParameters.set("EndGradient", startGradient);
	} else {
		const slope = Ady / Math.sqrt(Ady ** 2 + Adz ** 2);
		const layout = getLayout(zeroLengthSegment) as EntityInstance;
		const railhead = layout.get("RailHeadDistance") as number;

		designParameters.set("StartDistAlong", x);
		const startCantLeft = y - (slope * railhead) / 2.0;
		const startCantRight = y + (slope * railhead) / 2.0;
		designParameters.set("StartCantLeft", startCantLeft);
		designParameters.set("StartCantRight", startCantRight);
		designParameters.set("EndCantLeft", startCantLeft);
		designParameters.set("EndCantRight", startCantRight);
	}
}
