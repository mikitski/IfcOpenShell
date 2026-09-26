// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_map_alignment_cant_segment.py`
// (src/ifcopenshell-python, 475 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 5 of many). Pure closed-form math for 7
// cant-transition-curve types (constant/linear/Helmert/Bloss/cosine/sine/Viennese)
// plus `IfcCurveSegment` construction -- no unported dependency of any kind, no
// blocker.
//
// Real Python's leading underscore marks this as module-private -- NOT re-exported
// from `./index.ts`'s public barrel. Only the top-level `_mapAlignmentCantSegment`
// dispatcher is exported (for `_mapAlignmentSegment.ts` to import); its 7 `_map_*`
// helpers and `_get_axis` are all kept file-private, matching
// `_mapAlignmentVerticalSegment.ts`'s own identical convention (none is imported by
// any other real Python file in this module).
//
// See `_mapAlignmentVerticalSegment.ts`'s own header comment for 2 conventions this
// file reuses without repeating in full: (1) every `file.createIfcLengthMeasure(...)`
// -wrapped `SegmentStart`/`SegmentLength` in real Python is ported as a RAW NUMBER
// passed directly to `file.createEntity("IfcCurveSegment", ...)` at construction
// time -- the same already-proven-working technique; (2) several formulas below
// divide by a quantity that is legitimately zero for a genuinely degenerate input
// (e.g. `_get_axis`'s own `Math.sqrt(Dh*Dh - Dy*Dy)` for a `rail_head_distance`
// smaller than `2 * Ds`, or `_map_helmert_curve`'s own `pow(A2_1, 3.0)` denominator
// when the cant differential `f` is 0) -- real Python raises `ValueError`/
// `ZeroDivisionError` for these; this port's `Math.sqrt`/`/` instead silently produce
// `NaN`/`Infinity`, the SAME disclosed divergence category, not specially guarded
// against here either.
//
// Every `_map_*` helper's own `A0`/`A1`/`A2`/... "sign-preserving power" idiom
// (`math.pow(length, k) * math.pow(math.fabs(a), -1/n) * (a / math.fabs(a)) if a !=
// 0.0 else 0.0`) is guarded by its own `!= 0.0` check in real Python already, so no
// NEW divide-by-zero risk is introduced by porting `a / Math.abs(a)` verbatim (ported
// as-is, not simplified to `Math.sign(a)`, to keep the exact same expression shape as
// real Python for line-by-line auditability).
//
// The dispatcher's own final "else: throw TypeError" branch is ALSO dead code, for
// the identical reason `_mapAlignmentVerticalSegment.ts`'s own header comment
// discloses: real `IfcAlignmentCantSegmentTypeEnum`'s ONLY 7 valid schema keywords
// are exactly the 7 branches handled below (empirically verified against this
// chunk's own freshly-built native addon) -- no schema-valid `IfcAlignmentCantSegment`
// can ever reach it. Ported verbatim; not directly tested (see
// `_mapAlignmentCantSegment.test.ts`'s own header comment).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";

/** Solves the ratio right triangle legs to hypotenuse: `Dh^2 = Dy^2 + Dz^2`. Real
 * Python: `_get_axis`. See this file's own header comment for the disclosed
 * `sqrt`-of-negative divergence when `rail_head_distance < 2 * Ds`. */
function getAxis(file: IfcFile, Ds: number, railHeadDistance: number): EntityInstance {
	const Dh = railHeadDistance; // hypotenuse
	const Dy = 2 * Ds; // horizontal leg
	const Dz = Math.sqrt(Dh * Dh - Dy * Dy); // vertical leg
	return file.createEntity("IfcDirection", [0.0, Dy / Dh, Dz / Dh]);
}

function mapConstantCant(
	file: IfcFile,
	designParameters: EntityInstance,
	railHeadDistance: number,
): readonly [EntityInstance, EntityInstance | null] {
	const distAlong = designParameters.get("StartDistAlong") as number;
	const length = designParameters.get("HorizontalLength") as number;
	const Dsl = designParameters.get("StartCantLeft") as number;
	const Dsr = designParameters.get("StartCantRight") as number;

	const Ds = 0.5 * (Dsl + Dsr);

	const transition = "DISCONTINUOUS";

	const parentCurve = file.createEntity(
		"IfcLine",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
	);

	const startPoint = file.createEntity("IfcCartesianPoint", [distAlong, Ds, 0.0]);
	const startDirection = 0.0;

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement3D",
			startPoint,
			getAxis(file, 0.5 * (Dsr - Dsl), railHeadDistance),
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection), 0.0]),
		),
		0.0,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapLinearTransition(
	file: IfcFile,
	designParameters: EntityInstance,
	railHeadDistance: number,
): readonly [EntityInstance, EntityInstance | null] {
	const distAlong = designParameters.get("StartDistAlong") as number;
	const length = designParameters.get("HorizontalLength") as number;
	const Dsl = designParameters.get("StartCantLeft") as number;
	const Del = designParameters.get("EndCantLeft") as number;
	const Dsr = designParameters.get("StartCantRight") as number;
	const Der = designParameters.get("EndCantRight") as number;

	const Ds = 0.5 * (Dsl + Dsr);
	const De = 0.5 * (Del + Der);
	const f = De - Ds;

	const a0 = Ds; // constant term
	const a1 = f; // linear term

	const transition = "DISCONTINUOUS";

	const A0 = a0 !== 0.0 ? length ** (2.0 / 1.0) * Math.abs(a0) ** (-1.0 / 1.0) * (a0 / Math.abs(a0)) : 0.0;
	const A1 = a1 !== 0.0 ? length ** (3.0 / 2.0) * Math.abs(a1) ** (-1.0 / 2.0) * (a1 / Math.abs(a1)) : 0.0;

	const parentCurveLocation = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);
	const parentCurve = file.createEntity(
		"IfcClothoid",
		file.createEntity("IfcAxis2Placement2D", parentCurveLocation, file.createEntity("IfcDirection", [1.0, 0.0])),
		A1,
	);

	const startPoint = file.createEntity("IfcCartesianPoint", [
		distAlong,
		A0 !== 0.0 ? length ** (2.0 / 1.0) / A0 : 0.0,
		0.0,
	]);
	const startDirection = Math.atan((A1 * length ** (2.0 / 1.0)) / Math.abs(A1 ** (3.0 / 1.0)));

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement3D",
			startPoint,
			getAxis(file, Ds, railHeadDistance),
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection), 0.0]),
		),
		0.0,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapHelmertCurve(
	file: IfcFile,
	designParameters: EntityInstance,
	railHeadDistance: number,
): readonly [EntityInstance, EntityInstance] {
	const distAlong = designParameters.get("StartDistAlong") as number;
	const length = designParameters.get("HorizontalLength") as number;
	const Dsl = designParameters.get("StartCantLeft") as number;
	const Del = designParameters.get("EndCantLeft") as number;
	const Dsr = designParameters.get("StartCantRight") as number;
	const Der = designParameters.get("EndCantRight") as number;

	const Ds = Dsl + Dsr;
	const De = Del + Der;
	const f = De - Ds;

	const transition = "DISCONTINUOUS";

	// First half.
	const a0_1 = 2.0 * Ds; // constant term
	const a1_1 = 0.0; // linear term
	const a2_1 = 4.0 * f; // quadratic term

	const A0_1 = a0_1 !== 0.0 ? length ** (2.0 / 1.0) * Math.abs(a0_1) ** (-1.0 / 1.0) * (a0_1 / Math.abs(a0_1)) : 0.0;
	const A1_1 = a1_1 !== 0.0 ? length ** (3.0 / 2.0) * Math.abs(a1_1) ** (-1.0 / 2.0) * (a1_1 / Math.abs(a1_1)) : 0.0;
	const A2_1 = a2_1 !== 0.0 ? length ** (4.0 / 3.0) * Math.abs(a2_1) ** (-1.0 / 3.0) * (a2_1 / Math.abs(a2_1)) : 0.0;

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

	const startPoint1 = file.createEntity("IfcCartesianPoint", [distAlong, Ds / 2.0, 0.0]);
	const startDirection1 = 0.0;

	const curveSegment1 = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement3D",
			startPoint1,
			getAxis(file, Ds / 2.0, railHeadDistance),
			file.createEntity("IfcDirection", [Math.cos(startDirection1), Math.sin(startDirection1), 0.0]),
		),
		0.0,
		length / 2.0,
		parentCurve1,
	);

	// Second half.
	const a0_2 = -2.0 * f + 2.0 * Ds; // constant term
	const a1_2 = 8.0 * f; // linear term
	const a2_2 = -4.0 * f; // quadratic term

	const A0_2 = a0_2 !== 0.0 ? length ** (2.0 / 1.0) * Math.abs(a0_2) ** (-1.0 / 1.0) * (a0_2 / Math.abs(a0_2)) : 0.0;
	const A1_2 = a1_2 !== 0.0 ? length ** (3.0 / 2.0) * Math.abs(a1_2) ** (-1.0 / 2.0) * (a1_2 / Math.abs(a1_2)) : 0.0;
	const A2_2 = a2_2 !== 0.0 ? length ** (4.0 / 3.0) * Math.abs(a2_2) ** (-1.0 / 3.0) * (a2_2 / Math.abs(a2_2)) : 0.0;

	const parentCurve2 = file.createEntity(
		"IfcSecondOrderPolynomialSpiral",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		A2_2,
		A1_2 !== 0.0 ? A1_2 : null,
		A0_2 !== 0.0 ? A0_2 : null,
	);

	const startPoint2 = file.createEntity("IfcCartesianPoint", [distAlong + length / 2.0, Ds / 2.0 + f / 4.0, 0.0]);
	const slope = (length / 2.0) ** 2.0 * ((2.0 * (length / 2.0)) / A2_1 ** 3.0);
	const startDirection2 = Math.atan(slope);

	const curveSegment2 = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement3D",
			startPoint2,
			getAxis(file, (Ds + De) / 4.0, railHeadDistance),
			file.createEntity("IfcDirection", [Math.cos(startDirection2), Math.sin(startDirection2), 0.0]),
		),
		length / 2.0,
		length / 2.0,
		parentCurve2,
	);

	return [curveSegment1, curveSegment2] as const;
}

function mapBlossCurve(
	file: IfcFile,
	designParameters: EntityInstance,
	railHeadDistance: number,
): readonly [EntityInstance, EntityInstance | null] {
	const distAlong = designParameters.get("StartDistAlong") as number;
	const length = designParameters.get("HorizontalLength") as number;
	const Dsl = designParameters.get("StartCantLeft") as number;
	const Del = designParameters.get("EndCantLeft") as number;
	const Dsr = designParameters.get("StartCantRight") as number;
	const Der = designParameters.get("EndCantRight") as number;

	const Ds = 0.5 * (Dsl + Dsr);
	const De = 0.5 * (Del + Der);
	const f = De - Ds;

	const a0 = Ds; // constant term
	const a1 = 0.0; // linear term
	const a2 = 3.0 * f; // quadratic term
	const a3 = -2.0 * f; // cubic term

	const transition = "DISCONTINUOUS";

	const A0 = a0 !== 0.0 ? length ** (2.0 / 1.0) * Math.abs(a0) ** (-1.0 / 1.0) * (a0 / Math.abs(a0)) : 0.0;
	const A1 = a1 !== 0.0 ? length ** (3.0 / 2.0) * Math.abs(a1) ** (-1.0 / 2.0) * (a1 / Math.abs(a1)) : 0.0;
	const A2 = a2 !== 0.0 ? length ** (4.0 / 3.0) * Math.abs(a2) ** (-1.0 / 3.0) * (a2 / Math.abs(a2)) : 0.0;
	const A3 = a3 !== 0.0 ? length ** (5.0 / 4.0) * Math.abs(a3) ** (-1.0 / 4.0) * (a3 / Math.abs(a3)) : 0.0;

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

	const startPoint = file.createEntity("IfcCartesianPoint", [distAlong, Ds, 0.0]);
	const startDirection = 0.0;

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement3D",
			startPoint,
			getAxis(file, Ds, railHeadDistance),
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection), 0.0]),
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
	railHeadDistance: number,
): readonly [EntityInstance, EntityInstance | null] {
	const distAlong = designParameters.get("StartDistAlong") as number;
	const length = designParameters.get("HorizontalLength") as number;
	const Dsl = designParameters.get("StartCantLeft") as number;
	const Del = designParameters.get("EndCantLeft") as number;
	const Dsr = designParameters.get("StartCantRight") as number;
	const Der = designParameters.get("EndCantRight") as number;

	const Ds = 0.5 * (Dsl + Dsr);
	const De = 0.5 * (Del + Der);
	const f = De - Ds;

	const a0 = Ds + 0.5 * f; // constant term
	const a1 = -0.5 * f; // cosine term

	const A0 = a0 !== 0.0 ? length ** 2.0 * Math.abs(a0) ** (-1.0 / 1.0) * (a0 / Math.abs(a0)) : 0.0;
	const A1 = a1 !== 0.0 ? length ** 2.0 * Math.abs(a1) ** (-1.0 / 1.0) * (a1 / Math.abs(a1)) : 0.0;

	const transition = "DISCONTINUOUS";

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

	const startPoint = file.createEntity("IfcCartesianPoint", [distAlong, Ds, 0.0]);
	const startDirection = 0.0;

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement3D",
			startPoint,
			getAxis(file, Ds, railHeadDistance),
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection), 0.0]),
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
	railHeadDistance: number,
): readonly [EntityInstance, EntityInstance | null] {
	const distAlong = designParameters.get("StartDistAlong") as number;
	const length = designParameters.get("HorizontalLength") as number;
	const Dsl = designParameters.get("StartCantLeft") as number;
	const Del = designParameters.get("EndCantLeft") as number;
	const Dsr = designParameters.get("StartCantRight") as number;
	const Der = designParameters.get("EndCantRight") as number;

	const Ds = 0.5 * (Dsl + Dsr);
	const De = 0.5 * (Del + Der);
	const f = De - Ds;

	const a0 = Ds; // constant term
	const a1 = f; // linear term
	const a2 = -(1.0 / (2.0 * Math.PI)) * f; // sine term

	const A0 = a0 !== 0.0 ? length ** 2.0 * Math.abs(a0) ** (-1.0 / 1.0) * (a0 / Math.abs(a0)) : 0.0;
	const A1 = a1 !== 0.0 ? length ** 1.5 * Math.abs(a1) ** (-1.0 / 2.0) * (a1 / Math.abs(a1)) : 0.0;
	const A2 = a2 !== 0.0 ? length ** 2.0 * Math.abs(a2) ** (-1.0 / 1.0) * (a2 / Math.abs(a2)) : 0.0;

	const transition = "DISCONTINUOUS";

	const parentCurve = file.createEntity(
		"IfcSineSpiral",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		A2,
		A1 !== 0 ? A1 : null,
		A0 !== 0.0 ? A0 : null,
	);

	const startPoint = file.createEntity("IfcCartesianPoint", [distAlong, Ds, 0.0]);
	const startDirection = 0.0;

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement3D",
			startPoint,
			getAxis(file, Ds, railHeadDistance),
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection), 0.0]),
		),
		0.0,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapVienneseBend(
	file: IfcFile,
	designParameters: EntityInstance,
	railHeadDistance: number,
): readonly [EntityInstance, EntityInstance | null] {
	const distAlong = designParameters.get("StartDistAlong") as number;
	const length = designParameters.get("HorizontalLength") as number;
	const Dsl = designParameters.get("StartCantLeft") as number;
	const Del = designParameters.get("EndCantLeft") as number;
	const Dsr = designParameters.get("StartCantRight") as number;
	const Der = designParameters.get("EndCantRight") as number;

	const Ds = 0.5 * (Dsl + Dsr);
	const De = 0.5 * (Del + Der);
	const f = De - Ds;

	const a0 = Ds; // constant term
	const a1 = 0.0; // linear term
	const a2 = 0.0 * f; // quadratic term
	const a3 = 0.0 * f; // cubic term
	const a4 = 35.0 * f; // quartic term
	const a5 = -84.0 * f; // quintic term
	const a6 = 70.0 * f; // sextic term
	const a7 = -20.0 * f; // septic term

	const transition = "DISCONTINUOUS";

	const A0 = a0 !== 0.0 ? length ** (2.0 / 1.0) * Math.abs(a0) ** (-1.0 / 1.0) * (a0 / Math.abs(a0)) : 0.0;
	const A1 = a1 !== 0.0 ? length ** (3.0 / 2.0) * Math.abs(a1) ** (-1.0 / 2.0) * (a1 / Math.abs(a1)) : 0.0;
	const A2 = a2 !== 0.0 ? length ** (4.0 / 3.0) * Math.abs(a2) ** (-1.0 / 3.0) * (a2 / Math.abs(a2)) : 0.0;
	const A3 = a3 !== 0.0 ? length ** (5.0 / 4.0) * Math.abs(a3) ** (-1.0 / 4.0) * (a3 / Math.abs(a3)) : 0.0;
	const A4 = a4 !== 0.0 ? length ** (6.0 / 5.0) * Math.abs(a4) ** (-1.0 / 5.0) * (a4 / Math.abs(a4)) : 0.0;
	const A5 = a5 !== 0.0 ? length ** (7.0 / 6.0) * Math.abs(a5) ** (-1.0 / 6.0) * (a5 / Math.abs(a5)) : 0.0;
	const A6 = a6 !== 0.0 ? length ** (8.0 / 7.0) * Math.abs(a6) ** (-1.0 / 7.0) * (a6 / Math.abs(a6)) : 0.0;
	const A7 = a7 !== 0.0 ? length ** (9.0 / 8.0) * Math.abs(a7) ** (-1.0 / 8.0) * (a7 / Math.abs(a7)) : 0.0;

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

	const startPoint = file.createEntity("IfcCartesianPoint", [distAlong, Ds, 0.0]);
	const startDirection = 0.0;

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement3D",
			startPoint,
			getAxis(file, Ds, railHeadDistance),
			file.createEntity("IfcDirection", [Math.cos(startDirection), Math.sin(startDirection), 0.0]),
		),
		0.0,
		length,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

/**
 * Creates `IfcCurveSegment` entities for the representation of the supplied
 * `IfcAlignmentCantSegment` business logic entity instance (Python:
 * `ifcopenshell.api.alignment._map_alignment_cant_segment`). A pair is returned
 * because a single business-logic segment of type `HELMERTCURVE` maps to two
 * representation entities.
 *
 * The `IfcCurveSegment.Transition` transition code is set to `DISCONTINUOUS`.
 *
 * @param file The file.
 * @param segment The `IfcAlignmentSegment` (its `DesignParameters` must be an
 *   `IfcAlignmentCantSegment`).
 * @param railHeadDistance The cant layout's `IfcAlignmentCant.RailHeadDistance`.
 * @throws {TypeError} If `segment` is not an `IfcAlignmentSegment`, or its
 *   `PredefinedType` is not one of the 7 supported cant-transition-curve types.
 */
export function _mapAlignmentCantSegment(
	file: IfcFile,
	segment: EntityInstance,
	railHeadDistance: number,
): readonly [EntityInstance, EntityInstance | null] {
	const expectedType = "IfcAlignmentSegment";
	if (!segment.isA(expectedType)) {
		throw new TypeError(`Expected to see type '${expectedType}', instead received '${segment.isA()}'.`);
	}

	const designParameters = segment.get("DesignParameters") as EntityInstance;
	const predefinedType = designParameters.get("PredefinedType") as string;

	if (predefinedType === "CONSTANTCANT") {
		return mapConstantCant(file, designParameters, railHeadDistance);
	}
	if (predefinedType === "LINEARTRANSITION") {
		return mapLinearTransition(file, designParameters, railHeadDistance);
	}
	if (predefinedType === "HELMERTCURVE") {
		return mapHelmertCurve(file, designParameters, railHeadDistance);
	}
	if (predefinedType === "BLOSSCURVE") {
		return mapBlossCurve(file, designParameters, railHeadDistance);
	}
	if (predefinedType === "COSINECURVE") {
		return mapCosineCurve(file, designParameters, railHeadDistance);
	}
	if (predefinedType === "SINECURVE") {
		return mapSineCurve(file, designParameters, railHeadDistance);
	}
	if (predefinedType === "VIENNESEBEND") {
		return mapVienneseBend(file, designParameters, railHeadDistance);
	}
	throw new TypeError(`Unexpected predefined type: '${predefinedType}'.`);
}
