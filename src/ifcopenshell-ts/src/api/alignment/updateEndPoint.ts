// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/update_end_point.py` (src/ifcopenshell-python,
// 91 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 3 of many). Depends on this module's own already-landed
// `hasZeroLengthSegment` (chunk 1) and already-landed `util.placement
// .getAxis2placement` (`../../util/placement.ts`) -- both reused directly.
//
// *** RESOLVED 2026-09-18 (chunk 7 lands `addZeroLengthSegment` for real) -- see UPDATE
// in `TODOS.md`'s own dedicated entry for the full writeup ***. This file's own
// previously-disclosed blocker (`ifcopenshell.api.alignment.add_zero_length_segment`
// was not ported) is now wired in for real: `api.alignment.addZeroLengthSegment`
// landed in chunk 7 (`./addZeroLengthSegment.ts`) and is called here exactly as real
// Python does, in the `if (!hasZeroLengthSegment(curve))` branch below. Since
// `addZeroLengthSegment` is itself only CONDITIONALLY blocked (see that file's own
// header comment for the full writeup) -- fully portable for a genuinely empty
// `curve` (no real segments yet), and throwing a clear, disclosed error for a non-empty
// one (transitively needing the still-unported, still-permanently-excluded
// `_get_segment_endpoint`/real geometry kernel) -- `updateEndPoint` now inherits that
// SAME conditional behavior: a freshly-created, still-empty `IfcGradientCurve`/
// `IfcSegmentedReferenceCurve` now computes a real, correct `EndPoint` end to end (the
// zero-length segment `addZeroLengthSegment` builds is placed at the origin, since it
// has no earlier real segment to derive a position from), while a non-empty `curve`
// missing its own zero-length segment still throws -- now via `addZeroLengthSegment`'s
// own disclosed error message, bubbled up transparently, rather than this file's own
// former bespoke message (which is now stale/incorrect, since `addZeroLengthSegment`
// IS ported).
//
// The `TypeError` message has the SAME genuine unmatched-quote bug as
// `hasZeroLengthSegment.ts`'s own already-disclosed one (real Python: `f"Expected
// entity type to be one of {[_ for _ in expected_types]}, instead received
// '{curve.is_a()}"` -- opens a `'` right before `{curve.is_a()}` but never closes it).
// `pythonListRepr` below is `hasZeroLengthSegment.ts`'s own identical helper,
// redefined here per this project's "small pure helper, no cross-file sharing"
// convention (see `util/alignment.ts`'s own header comment for the same convention
// applied to `isCloseAbsTol`).
//
// A useful, EMPIRICALLY-confirmed technique this file's own test suite reuses from
// chunk 2 (`./index.ts`'s own header comment): assigning a raw JS `number` directly to
// an already-real entity's OWN SELECT-typed attribute at construction time (here,
// `IfcCurveSegment.SegmentStart`/`SegmentLength`, both `IfcCurveMeasureSelect`) works
// fine end to end -- letting this file's own test fixtures build a REAL zero-length
// `IfcCurveSegment` (so `hasZeroLengthSegment` genuinely returns `true`) without
// hitting the blocked `add_zero_length_segment` path at all.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getAxis2placement } from "../../util/placement";
import { addZeroLengthSegment } from "./addZeroLengthSegment";
import { hasZeroLengthSegment } from "./hasZeroLengthSegment";

const EXPECTED_TYPES = ["IfcGradientCurve", "IfcSegmentedReferenceCurve"];

/** Python's `f"{[_ for _ in expected_types]}"` -- `repr()` of a list of strings
 * (single-quoted elements, `", "`-joined) -- see this file's own header comment for
 * why the caller deliberately leaves the message's closing quote off (matching
 * `hasZeroLengthSegment.ts`'s own identical, already-disclosed quirk). */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

/**
 * Updates the `IfcGradientCurve.EndPoint`/`IfcSegmentedReferenceCurve.EndPoint`
 * (Python: `ifcopenshell.api.alignment.update_end_point`).
 *
 * If the curve does not have a zero length segment, one is added. The `EndPoint` is
 * then updated to match the placement of the zero length segment.
 *
 * @param file The file.
 * @param curve The `IfcGradientCurve` or `IfcSegmentedReferenceCurve`.
 * @throws {TypeError} If `curve` is not one of the expected types -- see this file's
 *   own header comment for the exact (deliberately malformed) message text.
 * @throws {Error} If `curve` has no zero length segment yet AND is not empty -- see
 *   `addZeroLengthSegment.ts`'s own header comment for exactly when this throws
 *   (transitively needing the still-unported, permanently-excluded
 *   `_get_segment_endpoint`/real geometry kernel).
 */
export function updateEndPoint(file: IfcFile, curve: EntityInstance): void {
	if (!EXPECTED_TYPES.includes(curve.isA())) {
		throw new TypeError(
			`Expected entity type to be one of ${pythonListRepr(EXPECTED_TYPES)}, instead received '${curve.isA()}`,
		);
	}

	if (!hasZeroLengthSegment(curve)) {
		addZeroLengthSegment(file, curve);
	}

	const segments = curve.get("Segments") as EntityInstance[];
	const zeroLengthSegment = segments[segments.length - 1];

	if (!curve.get("EndPoint")) {
		if (curve.isA("IfcGradientCurve")) {
			curve.set(
				"EndPoint",
				file.createEntity(
					"IfcAxis2Placement2D",
					file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
					file.createEntity("IfcDirection", [1.0, 0.0]),
				),
			);
		} else {
			curve.set(
				"EndPoint",
				file.createEntity(
					"IfcAxis2Placement3D",
					file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]),
					file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
					file.createEntity("IfcDirection", [1.0, 0.0, 0.0]),
				),
			);
		}
	}

	// `p[row, col]` (numpy) -> flat `gl-matrix` `mat4` index mapping: see
	// `updateFallbackPosition.ts`'s own header comment for the full derivation
	// (independently re-derived from `a2p`'s real source and cross-checked against
	// `api/geometry/editObjectPlacement.ts`'s own identical extraction).
	const p = getAxis2placement(zeroLengthSegment.get("Placement") as EntityInstance);

	const x = p[12];
	const y = p[13];
	const z = p[14];

	const rx = p[0];
	const ry = p[1];
	const rz = p[2];

	const ax = p[8];
	const ay = p[9];
	const az = p[10];

	const endPoint = curve.get("EndPoint") as EntityInstance;

	if (curve.isA("IfcGradientCurve")) {
		(endPoint.get("Location") as EntityInstance).set("Coordinates", [x, y]);

		if (!endPoint.get("RefDirection")) {
			endPoint.set("RefDirection", file.createEntity("IfcDirection", [1.0, 0.0]));
		}

		(endPoint.get("RefDirection") as EntityInstance).set("DirectionRatios", [rx, ry]);
	} else {
		(endPoint.get("Location") as EntityInstance).set("Coordinates", [x, y, z]);

		if (!endPoint.get("RefDirection")) {
			endPoint.set("RefDirection", file.createEntity("IfcDirection", [1.0, 0.0, 0.0]));
		}

		if (!endPoint.get("Axis")) {
			endPoint.set("Axis", file.createEntity("IfcDirection", [0.0, 0.0, 1.0]));
		}

		(endPoint.get("RefDirection") as EntityInstance).set("DirectionRatios", [rx, ry, rz]);
		(endPoint.get("Axis") as EntityInstance).set("DirectionRatios", [ax, ay, az]);
	}
}
