// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_map_alignment_vertical_segment.py`
// (src/ifcopenshell-python, 217 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 5 of many). Pure closed-form math
// (parabolic-segment point/tangent/curvature formulas) plus `IfcCurveSegment`
// construction -- no unported dependency of any kind, no blocker.
//
// Real Python's leading underscore marks this as module-private (absent from
// `__init__.py`'s own `__all__`) -- NOT re-exported from `./index.ts`'s public
// barrel, matching this module's established convention. Only the top-level
// `_mapAlignmentVerticalSegment` dispatcher is exported (for `_mapAlignmentSegment.ts`,
// chunk 5's own file 5, to import); its 4 `_map_*` helpers (`_map_constant_gradient`/
// `_map_parabolic_arc`/`_map_circular_arc`/`_map_clothoid` in real Python) and the
// `_polynomial_length` closed-form-length helper are all kept file-private (plain,
// non-`export`ed functions), matching `pythonListRepr`'s/`isCloseAbsTol`'s own
// established "small pure helper, no cross-file sharing" convention -- none of them
// is imported by any other real Python file in this module.
//
// --- `IfcLengthMeasure`/etc. construction technique: RAW NUMBERS at `IfcCurveSegment`
// construction time, not standalone-wrapped values ---
//
// Real Python wraps every `SegmentStart`/`SegmentLength` in
// `file.createIfcLengthMeasure(...)` before assigning it. This port passes the RAW
// NUMBER directly as the positional `SegmentStart`/`SegmentLength` argument to
// `file.createEntity("IfcCurveSegment", ...)` instead -- this exact technique was
// already proven working end to end in this codebase by chunk 3's own
// `updateEndPoint.test.ts` (a real `IfcCurveSegment` built with `SegmentStart`/
// `SegmentLength` set to a raw `0.0` at construction time) and is independently
// re-confirmed by this file's own test suite (which builds and geometrically
// verifies real, non-placeholder `IfcCurveSegment`s for every branch below). This is
// a DIFFERENT, unblocked code path from the standalone-simple/defined-type-instance-
// BY-NAME gap `TODOS.md`'s `EntityInstance.setByIndex`/`IfcFile.createEntity` entry
// tracks (e.g. `file.createEntity("IfcLengthMeasure", 100)`) -- see chunk 2's own
// `./index.ts` header-comment paragraph for the first place this was established.
// `IfcCurveSegment`'s/etc.'s own positional attribute order below was verified
// directly against `generated/ifc4x3.d.ts`'s own interface declarations (not assumed
// from Python's keyword-argument order alone) before writing any of this file.
//
// --- A cross-cutting, disclosed TS-vs-Python arithmetic divergence shared by this
// chunk's files 2-4 (this file, `_mapAlignmentCantSegment.ts`,
// `_mapAlignmentHorizontalSegment.ts`) ---
//
// Several of these closed-form formulas divide by a quantity that is legitimately
// zero for a genuinely DEGENERATE input (e.g. `_polynomial_length` below divides by
// `4.0 * C * C` when `C` -- the parabola's own quadratic coefficient -- is zero, which
// happens for `_map_parabolic_arc` whenever `start_gradient == end_gradient`; the twin
// `_map_circular_arc` divides by `sin(end_angle) - sin(start_angle)` in the same
// equal-gradient case). Real Python's own float division by `0.0` raises
// `ZeroDivisionError` for these; this port's `/` operator instead silently produces
// `Infinity`/`NaN`, propagating into the constructed `IfcCurveSegment`'s own numeric
// attributes rather than crashing -- the SAME category of divergence
// `distanceAlongFromStation.ts`'s own header comment already discloses for an
// unrelated `station - start_station` expression (chunk 2). None of these functions'
// own REAL real-world callers are expected to pass such degenerate inputs (a
// "parabolic arc" or "circular arc" segment with no actual curvature is a modeling
// error, not a normal case), so this is disclosed rather than specially guarded
// against, matching this project's "let a genuinely degenerate input diverge, don't
// invent a guard real Python itself doesn't have" precedent.
// --- The dispatcher's own final "else: throw TypeError" branch is DEAD CODE ---
//
// Empirically verified (queried directly against this chunk's own freshly-built
// native addon): real `IfcAlignmentVerticalSegmentTypeEnum`'s ONLY 4 valid schema
// keywords are exactly `CONSTANTGRADIENT`/`PARABOLICARC`/`CIRCULARARC`/`CLOTHOID` --
// the 4 branches `_mapAlignmentVerticalSegment` already handles below. Any other
// string is rejected by the native EXPRESS enum-keyword check at
// `file.createEntity(...)`/`.set(...)` time, before this function is ever reached --
// so no schema-valid `IfcAlignmentVerticalSegment` can ever hit the final `throw`.
// Ported verbatim regardless (matching real Python's own identical defensive `else`),
// matching `getMappedSegments.ts`'s own already-disclosed `_getCurveSegmentCount`
// "unreachable in practice" precedent (chunk 2) -- not directly tested here (see
// `_mapAlignmentVerticalSegment.test.ts`'s own header comment for why, and why a
// fake/duck-typed object was deliberately not introduced to force it).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";

/** Closed-form solution for the length of a parabolic curve `y = A + Bx + Cx^2` over
 * `[0, L]` (see https://www.integral-table.com, equation #37). Real Python:
 * `_polynomial_length`. See this file's own header comment for the disclosed
 * divide-by-zero-when-`C`-is-0 divergence. */
function polynomialLength(A: number, B: number, C: number, L: number): number {
	const a = 4.0 * C * C;
	const b = 4.0 * B * C;
	const c = B * B + 1;

	const v1 = (x: number) => (b + 2.0 * a * x) / (4.0 * a);
	const v2 = (x: number) => Math.sqrt(a * x * x + b * x + c);
	const v3 = (x: number) => (4.0 * a * c - b * b) / (8.0 * a ** 1.5);
	const v4 = (x: number) => Math.log(Math.abs(2.0 * a * x + b + 2.0 * Math.sqrt(a * (a * x * x + b * x + c))));

	const fn = (x: number) => v1(x) * v2(x) + v3(x) * v4(x);

	// Evaluated at both endpoints (L and 0) -- an integral must be evaluated at both
	// bounds, matching real Python's own comment verbatim.
	return fn(L) - fn(0);
}

function mapConstantGradient(
	file: IfcFile,
	designParameters: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const startDistanceAlong = designParameters.get("StartDistAlong") as number;
	const horizontalLength = designParameters.get("HorizontalLength") as number;
	const startHeight = designParameters.get("StartHeight") as number;
	const startGradient = designParameters.get("StartGradient") as number;
	const transition = "DISCONTINUOUS";

	const parentCurve = file.createEntity(
		"IfcLine",
		file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
		file.createEntity("IfcVector", file.createEntity("IfcDirection", [1.0, 0.0]), 1.0),
	);

	const dx = Math.cos(Math.atan(startGradient));
	const dy = Math.sin(Math.atan(startGradient));
	const curveSegmentLength = horizontalLength / dx;

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [startDistanceAlong, startHeight]),
			file.createEntity("IfcDirection", [dx, dy]),
		),
		0.0,
		curveSegmentLength,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapParabolicArc(
	file: IfcFile,
	designParameters: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const startDistanceAlong = designParameters.get("StartDistAlong") as number;
	const horizontalLength = designParameters.get("HorizontalLength") as number;
	const startHeight = designParameters.get("StartHeight") as number;
	const startGradient = designParameters.get("StartGradient") as number;
	const endGradient = designParameters.get("EndGradient") as number;
	const transition = "DISCONTINUOUS";

	const A = startHeight;
	const B = startGradient;
	const C = (endGradient - startGradient) / (2.0 * horizontalLength);

	const parentCurve = file.createEntity(
		"IfcPolynomialCurve",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [0.0, 0.0]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		[0.0, 1.0],
		[A, B, C],
	);

	const dx = Math.cos(Math.atan(startGradient));
	const dy = Math.sin(Math.atan(startGradient));
	const curveSegmentLength = polynomialLength(A, B, C, horizontalLength);

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [startDistanceAlong, startHeight]),
			file.createEntity("IfcDirection", [dx, dy]),
		),
		0.0,
		curveSegmentLength,
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapCircularArc(
	file: IfcFile,
	designParameters: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const startDistanceAlong = designParameters.get("StartDistAlong") as number;
	const horizontalLength = designParameters.get("HorizontalLength") as number;
	const startHeight = designParameters.get("StartHeight") as number;
	const startGradient = designParameters.get("StartGradient") as number;
	const endGradient = designParameters.get("EndGradient") as number;
	const transition = "DISCONTINUOUS";

	let startAngle = Math.atan(startGradient);
	let endAngle = Math.atan(endGradient);
	const dx = Math.cos(startAngle);
	const dy = Math.sin(startAngle);

	// Start and end angles are for the curve tangents -- convert them to be angles of
	// the radii lines.
	let radius: number;
	let x: number;
	let y: number;
	if (startAngle < endAngle) {
		radius = horizontalLength / (Math.sin(endAngle) - Math.sin(startAngle));
		x = -radius * Math.sin(startAngle);
		y = radius * Math.cos(startAngle);
		startAngle += (3.0 * Math.PI) / 2.0;
		endAngle += (3.0 * Math.PI) / 2.0;
	} else {
		radius = horizontalLength / (Math.sin(startAngle) - Math.sin(endAngle));
		x = radius * Math.sin(startAngle);
		y = -radius * Math.cos(startAngle);
		startAngle += Math.PI / 2.0;
		endAngle += Math.PI / 2.0;
	}

	const parentCurve = file.createEntity(
		"IfcCircle",
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [x, y]),
			file.createEntity("IfcDirection", [1.0, 0.0]),
		),
		radius,
	);

	const curveSegment = file.createEntity(
		"IfcCurveSegment",
		transition,
		file.createEntity(
			"IfcAxis2Placement2D",
			file.createEntity("IfcCartesianPoint", [startDistanceAlong, startHeight]),
			file.createEntity("IfcDirection", [dx, dy]),
		),
		radius * startAngle,
		radius * (endAngle - startAngle),
		parentCurve,
	);
	return [curveSegment, null] as const;
}

function mapClothoid(
	_file: IfcFile,
	_designParameters: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	// Real Python: `raise NotImplementedError("mapping for IfcVerticalSegment.CLOTHOID
	// not implemented")` -- real Python itself never implements this case either, not
	// a port gap.
	throw new Error("mapping for IfcVerticalSegment.CLOTHOID not implemented");
}

/**
 * Creates `IfcCurveSegment` entities for the representation of the supplied
 * `IfcAlignmentVerticalSegment` business logic entity instance (Python:
 * `ifcopenshell.api.alignment._map_alignment_vertical_segment`). A pair is returned
 * for consistency with `_mapAlignmentHorizontalSegment`/`_mapAlignmentCantSegment`
 * (the second element is always `null` here -- no vertical `PredefinedType` maps to 2
 * curve segments).
 *
 * @param file The file.
 * @param segment The `IfcAlignmentSegment` (its `DesignParameters` must be an
 *   `IfcAlignmentVerticalSegment`).
 * @throws {TypeError} If `segment` is not an `IfcAlignmentSegment`, or its
 *   `PredefinedType` is not one of `CONSTANTGRADIENT`/`PARABOLICARC`/`CIRCULARARC`/
 *   `CLOTHOID`.
 * @throws {Error} For `CLOTHOID`, matching real Python's own `NotImplementedError`
 *   (never implemented upstream either).
 */
export function _mapAlignmentVerticalSegment(
	file: IfcFile,
	segment: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	const expectedType = "IfcAlignmentSegment";
	if (!segment.isA(expectedType)) {
		throw new TypeError(`Expected to see type '${expectedType}', instead received '${segment.isA()}'.`);
	}

	const designParameters = segment.get("DesignParameters") as EntityInstance;
	const predefinedType = designParameters.get("PredefinedType") as string;

	if (predefinedType === "CONSTANTGRADIENT") {
		return mapConstantGradient(file, designParameters);
	}
	if (predefinedType === "PARABOLICARC") {
		return mapParabolicArc(file, designParameters);
	}
	if (predefinedType === "CIRCULARARC") {
		return mapCircularArc(file, designParameters);
	}
	if (predefinedType === "CLOTHOID") {
		return mapClothoid(file, designParameters);
	}
	throw new TypeError(`Unexpected predefined type - got ${predefinedType}`);
}
