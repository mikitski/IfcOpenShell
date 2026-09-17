// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/update_end_point.py` (src/ifcopenshell-python,
// 91 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 3 of many). Depends on this module's own already-landed
// `hasZeroLengthSegment` (chunk 1) and already-landed `util.placement
// .getAxis2placement` (`../../util/placement.ts`) -- both reused directly.
//
// *** A GENUINELY NEW, disclosed blocker, found by reading this file's own full body
// (not just its top-level imports) -- `ifcopenshell.api.alignment
// .add_zero_length_segment` is called when `has_zero_length_segment(curve)` is
// `false`, and `add_zero_length_segment` is NOT ported in this chunk (confirmed: it
// is explicitly named in `./index.ts`'s own "Still pending" list) ***. Reading
// `add_zero_length_segment.py` directly confirms it is itself transitively blocked on
// `_get_segment_endpoint` (needed whenever the layout/curve already has at least one
// real segment -- i.e. every realistic, non-empty case) -- the SAME real geometry
// kernel gap `./index.ts`'s own header comment already discloses for
// `_get_segment_endpoint` itself (excluded from this chunk's scope per this chunk's
// own task brief). Porting `add_zero_length_segment` here would be real, disclosed
// scope creep into a separate, not-yet-reviewed file, not a small addition -- matching
// this project's own "do not inline a risky partial port for a dependency outside the
// module under review" discipline (e.g. `TODOS.md`'s `util.element.getShapeAspects`
// entry). Ported every other real behavior of this function correctly and completely
// (the type-check, the `EndPoint`-not-yet-assigned branch construction for BOTH
// `IfcGradientCurve`/`IfcSegmentedReferenceCurve`, the full `getAxis2placement`
// extraction and both classes' own final attribute-assignment tail), and throws a
// clear, disclosed error ONLY at the exact point, and only when, the real
// `add_zero_length_segment` call would actually be needed -- never proactively, and
// never before the type-check has already run. See `TODOS.md`'s own dedicated entry
// for this gap for the full writeup.
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
 * @throws {Error} If `curve` has no zero length segment yet -- see this file's own
 *   header comment for the disclosed `add_zero_length_segment` blocker.
 */
export function updateEndPoint(file: IfcFile, curve: EntityInstance): void {
	if (!EXPECTED_TYPES.includes(curve.isA())) {
		throw new TypeError(
			`Expected entity type to be one of ${pythonListRepr(EXPECTED_TYPES)}, instead received '${curve.isA()}`,
		);
	}

	if (!hasZeroLengthSegment(curve)) {
		throw new Error(
			`updateEndPoint: '${curve.isA()}' has no zero-length segment yet, and adding one needs api.alignment.addZeroLengthSegment, which is not ported in this chunk (itself transitively blocked on the unported _get_segment_endpoint, which needs the real geometry kernel) -- see TODOS.md.`,
		);
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
