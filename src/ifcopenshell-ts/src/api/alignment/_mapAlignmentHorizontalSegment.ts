// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_map_alignment_horizontal_segment.py`
// (src/ifcopenshell-python, 554 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 5 of many). Pure closed-form math for 9
// horizontal-transition-curve types plus `IfcCurveSegment` construction. Depends on
// this module's own already-landed `_getCantSegment` (chunk 3, `./_getCantSegment.ts`)
// and already-landed `util.unit.calculateUnitScale` (`../../util/unit.ts`) -- both
// verified against their real exported name/signature before use. No unported
// dependency of any kind, no blocker.
//
// Real Python's leading underscore marks this as module-private -- NOT re-exported
// from `./index.ts`'s public barrel. Only the top-level
// `_mapAlignmentHorizontalSegment` dispatcher is exported (for `_mapAlignmentSegment
// .ts` to import); its 9 `_map_*` helpers and `_get_curve_factor` are all kept
// file-private, matching `_mapAlignmentVerticalSegment.ts`'s/
// `_mapAlignmentCantSegment.ts`'s own identical convention.
//
// See `_mapAlignmentVerticalSegment.ts`'s own header comment for the RAW-NUMBER-at-
// construction-time `IfcCurveSegment` technique this file reuses, and
// `_mapAlignmentCantSegment.ts`'s own header comment for the disclosed divide-by-zero/
// sqrt-of-negative divergence class several formulas below also share (e.g.
// `_map_circular_arc`'s own `length * (start_radius / math.fabs(start_radius))` when
// `start_radius` is `0.0`, or `_map_clothoid`'s own `end_radius - start_radius`
// denominator when both radii are equal).
//
// --- `ifcopenshell_wrapper.helmert_curve_point` -- NOT a geometry-kernel call,
// despite living in the `ifcopenshell_wrapper` module ---
//
// Real Python's own `_map_helmert_curve` calls
// `ifcopenshell.ifcopenshell_wrapper.helmert_curve_point(A0, A1, A2, s)`. Read
// directly from `src/ifcgeom/function_item_evaluator.cpp` (lines 8-22,
// `ifcopenshell::geom::helmert_curve_point`) -- this is a PURE numerical integration,
// with no OpenCASCADE/kernel dependency of any kind:
//
//   std::vector<double> helmert_curve_point(double A0, double A1, double A2, double s) {
//       auto theta = [A0, A1, A2](double t) -> double {
//          auto a0 = A0 ? t / A0 : 0.0;
//          auto a1 = A1 ? A1 * std::pow(t, 2) / (2 * fabs(std::pow(A1, 3))) : 0.0;
//          auto a2 = A2 ? std::pow(t, 3) / (3 * std::pow(A2, 3)) : 0.0;
//          return a0 + a1 + a2;
//       };
//       auto fn_x = [theta](double t) -> double { return cos(theta(t)); };
//       auto fn_y = [theta](double t) -> double { return sin(theta(t)); };
//       auto x = boost::math::quadrature::trapezoidal(fn_x, 0.0, s);
//       auto y = boost::math::quadrature::trapezoidal(fn_y, 0.0, s);
//       auto angle = theta(x);
//       return {x, y, angle};
//   }
//
// `theta`/`helmertCurvePoint` below reimplement this exactly, including the ONE
// asymmetry worth calling out explicitly: `fabs` wraps only the CUBE in the `a1`
// term's own denominator (`2 * fabs(A1^3)`), NOT the `a2` term's own denominator
// (`3 * A2^3`, no `fabs` at all -- a negative `A2` keeps its own sign through the odd
// cube, so this isn't a bug, just asymmetric-looking at a glance); ported verbatim,
// not "symmetrized". `trapezoidal` below is a standard adaptive composite-trapezoidal
// quadrature (doubling the interval count each refinement until the estimate's own
// relative change is within tolerance, or a refinement cap is hit) -- the same
// algorithm SHAPE as `boost::math::quadrature::trapezoidal`'s own adaptive doubling,
// reimplemented as a small local pure TS helper since this TS port has no Boost
// dependency of any kind (NOT a byte-for-byte port of Boost's own C++ template code,
// but numerically equivalent for the well-behaved, non-degenerate `theta` integrands
// this file's own real callers pass in -- this file's own test suite cross-checks
// `helmertCurvePoint`'s own output against closed-form values for symmetric inputs
// where `theta` reduces to a simple polynomial).
// The dispatcher's own final "else: throw TypeError" branch is ALSO dead code, for
// the identical reason `_mapAlignmentVerticalSegment.ts`'s own header comment
// discloses: real `IfcAlignmentHorizontalSegmentTypeEnum`'s ONLY 9 valid schema
// keywords are exactly the 9 branches handled below (empirically verified against
// this chunk's own freshly-built native addon -- e.g. `PARABOLICARC`, a real
// keyword, but only for `IfcAlignmentVerticalSegmentTypeEnum`, is REJECTED by the
// native EXPRESS enum-keyword check for THIS entity) -- no schema-valid
// `IfcAlignmentHorizontalSegment` can ever reach it. Ported verbatim; not directly
// tested (see `_mapAlignmentHorizontalSegment.test.ts`'s own header comment).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { calculateUnitScale } from "../../util/unit";
import { _getCantSegment } from "./_getCantSegment";

function getCurveFactor(designParameters: EntityInstance): number {
	const startRadius = designParameters.get("StartRadiusOfCurvature") as number;
	const endRadius = designParameters.get("EndRadiusOfCurvature") as number;
	const length = designParameters.get("SegmentLength") as number;

	const f = (endRadius === 0.0 ? 0.0 : length / endRadius) - (startRadius === 0.0 ? 0.0 : length / startRadius);
	return f;
}

/** `theta(t)` from `helmert_curve_point`'s own C++ source -- see this file's own
 * header comment for the exact formula (including the deliberate `A1`-only `fabs`
 * asymmetry, ported verbatim). */
function helmertTheta(A0: number, A1: number, A2: number, t: number): number {
	const a0 = A0 !== 0 ? t / A0 : 0.0;
	const a1 = A1 !== 0 ? (A1 * t ** 2) / (2 * Math.abs(A1 ** 3)) : 0.0;
	const a2 = A2 !== 0 ? t ** 3 / (3 * A2 ** 3) : 0.0;
	return a0 + a1 + a2;
}

/** A standard adaptive composite-trapezoidal quadrature of `f` over `[a, b]` -- see
 * this file's own header comment for why this reimplements (rather than byte-ports)
 * `boost::math::quadrature::trapezoidal`'s own adaptive doubling algorithm. */
function trapezoidal(f: (t: number) => number, a: number, b: number, tol = 1e-8, maxRefinements = 12): number {
	let h = b - a;
	let estimate = 0.5 * h * (f(a) + f(b));
	let n = 1;
	for (let k = 0; k < maxRefinements; k++) {
		h /= 2;
		let sum = 0;
		for (let i = 1; i <= n; i++) {
			sum += f(a + (2 * i - 1) * h);
		}
		const refined = estimate / 2 + h * sum;
		n *= 2;
		if (Math.abs(refined - estimate) <= tol * Math.abs(refined)) {
			return refined;
		}
		estimate = refined;
	}
	return estimate;
}

/** Real Python: `ifcopenshell.ifcopenshell_wrapper.helmert_curve_point(A0, A1, A2,
 * s)` -- see this file's own header comment for the full C++-source-verified
 * derivation. Returns `[x, y, angle]`. */
function helmertCurvePoint(A0: number, A1: number, A2: number, s: number): readonly [number, number, number] {
	const theta = (t: number) => helmertTheta(A0, A1, A2, t);
	const x = trapezoidal((t) => Math.cos(theta(t)), 0.0, s);
	const y = trapezoidal((t) => Math.sin(theta(t)), 0.0, s);
	const angle = theta(x);
	return [x, y, angle] as const;
}

function mapLine(file: IfcFile, designParameters: EntityInstance): readonly [EntityInstance, EntityInstance | null] {
	const startPoint = designParameters.get("StartPoint") as EntityInstance;
	let startDirection = designParameters.get("StartDirection") as number;
	const length = designParameters.get("SegmentLength") as number;

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
	startDirection *= angleUnitScale;

	const transition = "DISCONTINUOUS";

	const parentCurve = file.createEntity(
		"IfcLine",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
	);
	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			startPoint,
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection)]),
		),
		0.0,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapCircularArc(
	file: IfcFile,
	designParameters: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const startPoint = designParameters.get("StartPoint") as EntityInstance;
	let startDirection = designParameters.get("StartDirection") as number;
	const startRadius = designParameters.get("StartRadiusOfCurvature") as number;
	const length = designParameters.get("SegmentLength") as number;

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
	startDirection *= angleUnitScale;

	const transition = "DISCONTINUOUS";

	const parentCurve = file.createEntity(
		"IfcCircle",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		Math.abs(startRadius),
	);

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			startPoint,
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection)]),
		),
		0.0,
		length * (startRadius / Math.abs(startRadius)),
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapClothoid(
	file: IfcFile,
	designParameters: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const startPoint = designParameters.get("StartPoint") as EntityInstance;
	let startDirection = designParameters.get("StartDirection") as number;
	const startRadius = designParameters.get("StartRadiusOfCurvature") as number;
	const endRadius = designParameters.get("EndRadiusOfCurvature") as number;
	const length = designParameters.get("SegmentLength") as number;

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
	startDirection *= angleUnitScale;

	const transition = "DISCONTINUOUS";

	const f = getCurveFactor(designParameters);
	const A = (length / Math.sqrt(Math.abs(f))) * (f / Math.abs(f));
	const parentCurve = file.createEntity(
		"IfcClothoid",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		A,
	);

	let offset: number;
	if ((Math.abs(startRadius) < Math.abs(endRadius) && startRadius !== 0.0) || endRadius === 0.0) {
		offset = -length - (endRadius !== 0.0 ? (length * startRadius) / (endRadius - startRadius) : 0.0);
	} else {
		offset = startRadius !== 0.0 ? (length * endRadius) / (startRadius - endRadius) : 0.0;
	}

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			startPoint,
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection)]),
		),
		offset,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapCubic(file: IfcFile, designParameters: EntityInstance): readonly [EntityInstance, EntityInstance | null] {
	const startPoint = designParameters.get("StartPoint") as EntityInstance;
	let startDirection = designParameters.get("StartDirection") as number;
	const startRadius = designParameters.get("StartRadiusOfCurvature") as number;
	const endRadius = designParameters.get("EndRadiusOfCurvature") as number;
	const length = designParameters.get("SegmentLength") as number;

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
	startDirection *= angleUnitScale;

	const transition = "DISCONTINUOUS";

	let offset = 0.0;
	const A0 = 0.0; // constant term
	const A1 = 0.0; // linear term
	const A2 = 0.0; // quadratic term
	let A3 = 0.0; // cubic term

	if (endRadius !== 0.0 && startRadius !== 0.0 && endRadius !== startRadius) {
		// Note: this "f" is different than `getCurveFactor` computes.
		const f = (startRadius - endRadius) / endRadius;
		A3 = f / (6.0 * startRadius * length);
		offset = length / f;
	} else if (endRadius !== 0.0) {
		A3 = 1.0 / (6.0 * endRadius * length);
		offset = 0.0;
	} else if (startRadius !== 0.0) {
		A3 = -1.0 / (6.0 * startRadius * length);
		offset = -length;
	}

	const parentCurve = file.createEntity(
		"IfcPolynomialCurve",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		[0.0, 1.0],
		[A0, A1, A2, A3],
	);

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			startPoint,
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection)]),
		),
		offset,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapHelmertCurve(file: IfcFile, designParameters: EntityInstance): readonly [EntityInstance, EntityInstance] {
	const startPoint = designParameters.get("StartPoint") as EntityInstance;
	let startDirection = designParameters.get("StartDirection") as number;
	const startRadius = designParameters.get("StartRadiusOfCurvature") as number;
	const length = designParameters.get("SegmentLength") as number;

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
	startDirection *= angleUnitScale;

	const transition = "DISCONTINUOUS";
	const f = getCurveFactor(designParameters);

	const a0_1 = startRadius !== 0 ? 0.0 * f + length / startRadius : 0.0; // constant term, first half
	const a1_1 = 0.0 * f; // linear term, first half
	const a2_1 = 2.0 * f; // quadratic term, first half

	const A0_1 = a0_1 !== 0.0 ? length * Math.abs(a0_1) ** (-1.0 / 1.0) * (a0_1 / Math.abs(a0_1)) : 0.0;
	const A1_1 = a1_1 !== 0.0 ? length * Math.abs(a1_1) ** (-1.0 / 2.0) * (a1_1 / Math.abs(a1_1)) : 0.0;
	const A2_1 = a2_1 !== 0.0 ? length * Math.abs(a2_1) ** (-1.0 / 3.0) * (a2_1 / Math.abs(a2_1)) : 0.0;

	const [x1, y1, angle1] = helmertCurvePoint(A0_1, A1_1, A2_1, length / 2);

	const parentCurve1 = file.createEntity(
		"IfcSecondOrderPolynomialSpiral",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		A2_1,
		A1_1 !== 0.0 ? A1_1 : null,
		A0_1 !== 0.0 ? A0_1 : null,
	);

	const curveSegment1 = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			startPoint,
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection)]),
		),
		0.0,
		length / 2,
		parentCurve1,
	);

	const a0_2 = -1.0 * f + (startRadius !== 0.0 ? length / startRadius : 0.0); // constant term, second half
	const a1_2 = 4.0 * f; // linear term, second half
	const a2_2 = -2.0 * f; // quadratic term, second half

	const A0_2 = a0_2 !== 0.0 ? length * Math.abs(a0_2) ** (-1.0 / 1.0) * (a0_2 / Math.abs(a0_2)) : 0.0;
	const A1_2 = a1_2 !== 0.0 ? length * Math.abs(a1_2) ** (-1.0 / 2.0) * (a1_2 / Math.abs(a1_2)) : 0.0;
	const A2_2 = a2_2 !== 0.0 ? length * Math.abs(a2_2) ** (-1.0 / 3.0) * (a2_2 / Math.abs(a2_2)) : 0.0;

	const [x2, y2, angle2] = helmertCurvePoint(A0_2, A1_2, A2_2, length / 2);
	const anglep = angle1 - angle2;
	const xp = x1 - x2 * Math.cos(anglep) + y2 * Math.sin(anglep);
	const yp = y1 - x2 * Math.sin(anglep) - y2 * Math.cos(anglep);

	const parentCurve2 = file.createEntity(
		"IfcSecondOrderPolynomialSpiral",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [xp, yp]),
			file.createEntity("IfcDirection", [Math.cos(anglep), Math.sin(anglep)]),
		),
		A2_2,
		A1_2 !== 0.0 ? A1_2 : null,
		A0_2 !== 0.0 ? A0_2 : null,
	);

	const startPointCoordinates = startPoint.get("Coordinates") as number[];
	const curveSegment2 = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [
				startPointCoordinates[0] + x1 * Math.cos(startDirection) - y1 * Math.sin(startDirection),
				startPointCoordinates[1] + x1 * Math.sin(startDirection) + y1 * Math.cos(startDirection),
			]),
			file.createEntity("IfcDirection", [Math.cos(startDirection + angle1), Math.sin(startDirection + angle1)]),
		),
		length / 2,
		length / 2,
		parentCurve2,
	);

	return [curveSegment1, curveSegment2] as const;
}

function mapBlossCurve(
	file: IfcFile,
	designParameters: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const startPoint = designParameters.get("StartPoint") as EntityInstance;
	let startDirection = designParameters.get("StartDirection") as number;
	const startRadius = designParameters.get("StartRadiusOfCurvature") as number;
	const length = designParameters.get("SegmentLength") as number;

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
	startDirection *= angleUnitScale;

	const transition = "DISCONTINUOUS";
	const f = getCurveFactor(designParameters);

	const a0 = startRadius !== 0.0 ? length / startRadius : 0.0; // constant term
	const a1 = 0.0; // linear term
	const a2 = 3.0 * f; // quadratic term
	const a3 = -2.0 * f; // cubic term

	const A0 = a0 !== 0.0 ? length * Math.abs(a0) ** (-1.0 / 1.0) * (a0 / Math.abs(a0)) : 0.0;
	const A1 = a1 !== 0.0 ? length * Math.abs(a1) ** (-1.0 / 2.0) * (a1 / Math.abs(a1)) : 0.0;
	const A2 = a2 !== 0.0 ? length * Math.abs(a2) ** (-1.0 / 3.0) * (a2 / Math.abs(a2)) : 0.0;
	const A3 = a3 !== 0.0 ? length * Math.abs(a3) ** (-1.0 / 4.0) * (a3 / Math.abs(a3)) : 0.0;

	const parentCurve = file.createEntity(
		"IfcThirdOrderPolynomialSpiral",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		A3,
		A2 !== 0.0 ? A2 : null,
		A1 !== 0.0 ? A1 : null,
		A0 !== 0.0 ? A0 : null,
	);

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			startPoint,
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection)]),
		),
		0.0,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapCosineCurve(
	file: IfcFile,
	designParameters: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const startPoint = designParameters.get("StartPoint") as EntityInstance;
	let startDirection = designParameters.get("StartDirection") as number;
	const startRadius = designParameters.get("StartRadiusOfCurvature") as number;
	const length = designParameters.get("SegmentLength") as number;

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
	startDirection *= angleUnitScale;

	const transition = "DISCONTINUOUS";

	const f = getCurveFactor(designParameters);

	const a0 = 0.5 * f + (startRadius !== 0.0 ? length / startRadius : 0.0);
	const a1 = -0.5 * f;

	const A0 = a0 !== 0.0 ? length * Math.abs(a0) ** (-1.0 / 1.0) * (a0 / Math.abs(a0)) : 0.0;
	const A1 = a1 !== 0.0 ? length * Math.abs(a1) ** (-1.0 / 1.0) * (a1 / Math.abs(a1)) : 0.0;

	const parentCurve = file.createEntity(
		"IfcCosineSpiral",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		A1,
		A0 !== 0.0 ? A0 : null,
	);

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			startPoint,
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection)]),
		),
		0.0,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapSineCurve(
	file: IfcFile,
	designParameters: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const startPoint = designParameters.get("StartPoint") as EntityInstance;
	let startDirection = designParameters.get("StartDirection") as number;
	const startRadius = designParameters.get("StartRadiusOfCurvature") as number;
	const length = designParameters.get("SegmentLength") as number;

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
	startDirection *= angleUnitScale;

	const transition = "DISCONTINUOUS";

	const f = getCurveFactor(designParameters);
	const a0 = startRadius !== 0.0 ? length / startRadius : 0.0;
	const a1 = f;
	const a2 = -f / (2.0 * Math.PI);

	const A0 = a0 !== 0.0 ? length * Math.abs(a0) ** (-1.0 / 1.0) * (a0 / Math.abs(a0)) : 0.0;
	const A1 = a1 !== 0.0 ? length * Math.abs(a1) ** (-1.0 / 2.0) * (a1 / Math.abs(a1)) : 0.0;
	const A2 = a2 !== 0.0 ? length * Math.abs(a2) ** (-1.0 / 1.0) * (a2 / Math.abs(a2)) : 0.0;

	const parentCurve = file.createEntity(
		"IfcSineSpiral",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		A2,
		A1 !== 0.0 ? A1 : null,
		A0 !== 0.0 ? A0 : null,
	);

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			startPoint,
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection)]),
		),
		0.0,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapVienneseBend(file: IfcFile, segment: EntityInstance): readonly [EntityInstance, EntityInstance | null] {
	const designParameters = segment.get("DesignParameters") as EntityInstance;

	const startPoint = designParameters.get("StartPoint") as EntityInstance;
	let startDirection = designParameters.get("StartDirection") as number;
	const startRadius = designParameters.get("StartRadiusOfCurvature") as number;
	const length = designParameters.get("SegmentLength") as number;
	const gravityCenterLineHeight = (designParameters.get("GravityCenterLineHeight") as number | null) ?? 0.0;

	const angleUnitScale = calculateUnitScale(file, "PLANEANGLEUNIT");
	startDirection *= angleUnitScale;

	const transition = "DISCONTINUOUS";

	const cantSegment = _getCantSegment(segment);
	let startCantLeft: number;
	let endCantLeft: number;
	let startCantRight: number;
	let endCantRight: number;
	let railHeadDistance: number;
	if (cantSegment) {
		const cantDesignParameters = cantSegment.get("DesignParameters") as EntityInstance;
		startCantLeft = cantDesignParameters.get("StartCantLeft") as number;
		// Real Python's own `if cant_segment.DesignParameters.EndCantLeft else 0.0` is a
		// TRUTHY check (not a `None` check) -- ported with `||` to match exactly (a
		// legitimate `0.0` also falls back to `0.0` under both, so this is not an
		// observable divergence, just kept literal for auditability).
		endCantLeft = (cantDesignParameters.get("EndCantLeft") as number | null) || 0.0;
		startCantRight = cantDesignParameters.get("StartCantRight") as number;
		endCantRight = (cantDesignParameters.get("EndCantRight") as number | null) || 0.0;
		const cantLayout = (cantSegment.get("Nests") as EntityInstance[])[0].get("RelatingObject") as EntityInstance;
		railHeadDistance = cantLayout.get("RailHeadDistance") as number;
	} else {
		startCantLeft = 0.0;
		endCantLeft = 0.0;
		startCantRight = 0.0;
		endCantRight = 0.0;
		railHeadDistance = 1.0;
	}

	const cantAngleStart = railHeadDistance ? (startCantRight - startCantLeft) / railHeadDistance : 0.0;
	const cantAngleEnd = railHeadDistance ? (endCantRight - endCantLeft) / railHeadDistance : 0.0;

	const cantFactor = -420.0 * (gravityCenterLineHeight / length) * (cantAngleEnd - cantAngleStart);

	const f = getCurveFactor(designParameters);

	const a0 = startRadius !== 0.0 ? length / startRadius : 0.0; // constant term
	const a1 = 0.0; // linear term
	const a2 = 1.0 * cantFactor; // quadratic term
	const a3 = -4.0 * cantFactor; // cubic term
	const a4 = 5.0 * cantFactor + 35.0 * f; // quartic term
	const a5 = -2.0 * cantFactor - 84.0 * f; // quintic term
	const a6 = 70.0 * f; // sextic term
	const a7 = -20.0 * f; // septic term

	const A0 = a0 !== 0.0 ? length * Math.abs(a0) ** (-1.0 / 1.0) * (a0 / Math.abs(a0)) : 0.0;
	const A1 = a1 !== 0.0 ? length * Math.abs(a1) ** (-1.0 / 2.0) * (a1 / Math.abs(a1)) : 0.0;
	const A2 = a2 !== 0.0 ? length * Math.abs(a2) ** (-1.0 / 3.0) * (a2 / Math.abs(a2)) : 0.0;
	const A3 = a3 !== 0.0 ? length * Math.abs(a3) ** (-1.0 / 4.0) * (a3 / Math.abs(a3)) : 0.0;
	const A4 = a4 !== 0.0 ? length * Math.abs(a4) ** (-1.0 / 5.0) * (a4 / Math.abs(a4)) : 0.0;
	const A5 = a5 !== 0.0 ? length * Math.abs(a5) ** (-1.0 / 6.0) * (a5 / Math.abs(a5)) : 0.0;
	const A6 = a6 !== 0.0 ? length * Math.abs(a6) ** (-1.0 / 7.0) * (a6 / Math.abs(a6)) : 0.0;
	const A7 = a7 !== 0.0 ? length * Math.abs(a7) ** (-1.0 / 8.0) * (a7 / Math.abs(a7)) : 0.0;

	const parentCurve = file.createEntity(
		"IfcSeventhOrderPolynomialSpiral",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		A7,
		A6 !== 0.0 ? A6 : null,
		A5 !== 0.0 ? A5 : null,
		A4 !== 0.0 ? A4 : null,
		A3 !== 0.0 ? A3 : null,
		A2 !== 0.0 ? A2 : null,
		A1 !== 0.0 ? A1 : null,
		A0 !== 0.0 ? A0 : null,
	);

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			startPoint,
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection)]),
		),
		0.0,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

/**
 * Creates `IfcCurveSegment` entities for the representation of the supplied
 * `IfcAlignmentHorizontalSegment` business logic entity instance (Python:
 * `ifcopenshell.api.alignment._map_alignment_horizontal_segment`). A pair is returned
 * because a single business-logic segment of type `HELMERTCURVE` maps to two
 * representation entities.
 *
 * The `IfcCurveSegment.Transition` transition code is set to `DISCONTINUOUS`.
 *
 * @param file The file.
 * @param segment The `IfcAlignmentSegment` (its `DesignParameters` must be an
 *   `IfcAlignmentHorizontalSegment`).
 * @throws {TypeError} If `segment` is not an `IfcAlignmentSegment`, or its
 *   `PredefinedType` is not one of the 8 supported horizontal-transition-curve types.
 */
export function _mapAlignmentHorizontalSegment(
	file: IfcFile,
	segment: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const expectedType = "IfcAlignmentSegment";
	if (!segment.isA(expectedType)) {
		throw new TypeError(`Expected to see type '${expectedType}', instead received '${segment.isA()}'.`);
	}

	const designParameters = segment.get("DesignParameters") as EntityInstance;
	const predefinedType = designParameters.get("PredefinedType") as string;

	if (predefinedType === "LINE") {
		return mapLine(file, designParameters);
	}
	if (predefinedType === "CIRCULARARC") {
		return mapCircularArc(file, designParameters);
	}
	if (predefinedType === "CLOTHOID") {
		return mapClothoid(file, designParameters);
	}
	if (predefinedType === "CUBIC") {
		return mapCubic(file, designParameters);
	}
	if (predefinedType === "HELMERTCURVE") {
		return mapHelmertCurve(file, designParameters);
	}
	if (predefinedType === "BLOSSCURVE") {
		return mapBlossCurve(file, designParameters);
	}
	if (predefinedType === "COSINECURVE") {
		return mapCosineCurve(file, designParameters);
	}
	if (predefinedType === "SINECURVE") {
		return mapSineCurve(file, designParameters);
	}
	if (predefinedType === "VIENNESEBEND") {
		return mapVienneseBend(file, segment);
	}
	throw new TypeError(`Unexpected predefined type: '${predefinedType}'.`);
}
