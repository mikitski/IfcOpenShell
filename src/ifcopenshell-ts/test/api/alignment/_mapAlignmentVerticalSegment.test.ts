// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_map_alignment_vertical_segment.py`
// (src/ifcopenshell-python, 806 lines) -- a real Python test file DOES exist for
// `_map_alignment_vertical_segment.py` (a previous version of this comment claimed
// otherwise; that claim was FALSE, corrected here after a dedicated parity-audit
// finding, see `PROGRESS.md`'s "`api.alignment` test-fidelity backfill" entry). Real
// Python's own top comment: "These are test cases generated from
// https://github.com/bSI-RailwayRoom/IFC-Rail-Unit-Test-Reference-Code/tree/master/alignment_testset/IFC-WithGeneratedGeometry
// for vertical alignment" -- an externally-validated, buildingSMART-International
// Railway Room reference dataset, categorically stronger verification than a
// self-derived-formula cross-check (which can't catch a bug shared by both the real
// Python source and this port's transcription of it). All 24 real reference cases
// (8 `CircularArc` / 8 `ConstantGradient` / 8 `ParabolicArc`) are ported below as
// `test.each` tables, one `describe` per `PredefinedType`, matching this directory's
// own established golden-value-table convention (see e.g. `./getBasisCurve.test.ts`).
// Real Python calls all 24 from ONE `test_map_alignment_vertical_segment()` function
// (24 helpers, one per case); split here into individual `test()`s so a failure in
// one case doesn't hide failures in the others (this project's general "one
// assertion-group per `test()`" convention). Real Python's own final comment --
// "VERTICAL CLOTHOID NOT IMPLEMENTED" -- confirms real Python's OWN test suite has no
// clothoid case either (a disclosed real-Python-itself limitation, not something to
// invent coverage for here).
//
// The 2 error-handling tests below (non-`IfcAlignmentSegment` argument, `CLOTHOID`
// throws) are genuinely distinct from the golden dataset (which only ever exercises
// well-formed `CIRCULARARC`/`CONSTANTGRADIENT`/`PARABOLICARC` input) -- kept
// alongside the golden-value tests rather than replaced.
//
// --- `pytestApprox`/`pytestApproxTuple`: porting `pytest.approx`'s OWN default
// tolerance semantics, not picking an arbitrary decimal precision ---
//
// Empirically verified (`node`, closed-form vs. an independent fine composite-
// Simpson's-rule numeric integration, AND a real installed `ifcopenshell` 0.8.4.post1
// Python package calling the exact same code path) that this port's own math is
// bit-for-bit IDENTICAL to real Python's own `_polynomial_length`/`_map_circular_arc`
// (same closed-form formula, same IEEE-754 double arithmetic) -- e.g. the
// `PARABOLICARC` `sg=0.0/eg=0.5` case's `SegmentLength` computes to
// `104.02288194345505` in BOTH this port and a real Python interpreter, not the
// golden file's own `104.02288238772185`. This ~4.44e-7 gap is the golden dataset's
// OWN external reference implementation (a separate bSI-produced tool, not real
// Python's `_map_alignment_vertical_segment` itself) differing from Python's closed-
// form evaluation by a tiny amount -- exactly why real Python's own test wraps every
// assertion in `pytest.approx(...)` (default `rel=1e-6`, `abs=1e-12`) instead of an
// exact-equality check: `4.44e-7` relative to `104.02` (~4.27e-9) is comfortably
// inside `pytest.approx`'s default relative tolerance, so real Python's own test
// PASSES against real Python's own implementation despite this gap (confirmed by
// running the case directly against the real installed package above). Vitest's
// `toBeCloseTo(expected, precision)` uses an ABSOLUTE decimal-digit tolerance, not
// `pytest.approx`'s relative-or-absolute one -- a fixed high precision (e.g. `10`,
// this file's own previous self-derived-formula convention) would be STRICTER than
// what real Python's own reference test actually requires and would misreport this
// harmless gap as a bug. `pytestApprox` below reimplements `pytest.approx`'s actual
// default comparison (`abs(actual - expected) <= max(rel * abs(expected), abs)`)
// instead, so this port's assertions carry the same real tolerance semantics the
// real Python test itself relies on -- not a coincidentally-chosen digit count.

import { describe, expect, test } from "vitest";
import { _mapAlignmentVerticalSegment } from "../../../src/api/alignment/_mapAlignmentVerticalSegment";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Reimplements `pytest.approx`'s own default comparison
 * (`abs(actual - expected) <= max(rel * abs(expected), abs)`, `rel=1e-6`/`abs=1e-12`)
 * -- see this file's own header comment for why this, and not Vitest's
 * digit-precision-based `toBeCloseTo`, is the faithful port of real Python's own
 * tolerance here. */
function pytestApprox(actual: number, expected: number, rel = 1e-6, abs = 1e-12): void {
	const tolerance = Math.max(rel * Math.abs(expected), abs);
	expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

function pytestApproxTuple(actual: readonly number[], expected: readonly number[], rel = 1e-6, abs = 1e-12): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < expected.length; i++) {
		pytestApprox(actual[i], expected[i], rel, abs);
	}
}

/** Asserts the shape every one of the 24 golden reference cases below shares
 * regardless of `PredefinedType` (result-pair shape, `Transition`, and `Placement`),
 * then returns the mapped segment and its `ParentCurve` for the caller's own
 * type-specific assertions (`IfcLine`/`IfcCircle`/`IfcPolynomialCurve`). Factored out
 * of the 3 `describe` blocks below per `/code-review`'s own finding (near-identical
 * setup/assertion boilerplate repeated per `PredefinedType`). */
function assertCommonSegmentShape(
	mappedSegments: readonly [EntityInstance, EntityInstance | null],
	refDx: number,
	refDy: number,
): { mappedSegment: EntityInstance; parentCurve: EntityInstance } {
	const mappedSegment = mappedSegments[0];
	expect(mappedSegments.length).toBe(2);
	expect(mappedSegments[1]).toBeNull();
	expect(mappedSegment.get("Transition")).toBe("DISCONTINUOUS");

	const placement = mappedSegment.get("Placement") as EntityInstance;
	pytestApproxTuple((placement.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 10.0]);
	pytestApproxTuple((placement.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [
		refDx,
		refDy,
	]);

	return { mappedSegment, parentCurve: mappedSegment.get("ParentCurve") as EntityInstance };
}

function verticalSegment(
	file: IfcFile,
	predefinedType: string,
	fields: {
		startDistAlong?: number;
		horizontalLength?: number;
		startHeight?: number;
		startGradient?: number;
		endGradient?: number;
	},
): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentVerticalSegment",
		null,
		null,
		fields.startDistAlong ?? 0.0,
		fields.horizontalLength ?? 0.0,
		fields.startHeight ?? 0.0,
		fields.startGradient ?? 0.0,
		fields.endGradient ?? 0.0,
		null,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._mapAlignmentVerticalSegment (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignmentSegment argument", () => {
		const file = createTestFile("IFC4X3");
		const notASegment = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);

		expect(() => _mapAlignmentVerticalSegment(file, notASegment)).toThrow(
			new TypeError("Expected to see type 'IfcAlignmentSegment', instead received 'IfcCartesianPoint'."),
		);
	});

	// NOT tested: the dispatcher's own final "else: throw TypeError" branch. Empirically
	// verified (against this chunk's own freshly-built native addon) that real
	// `IfcAlignmentVerticalSegmentTypeEnum`'s ONLY 4 valid schema keywords are exactly
	// `CONSTANTGRADIENT`/`PARABOLICARC`/`CIRCULARARC`/`CLOTHOID` -- the 4 branches this
	// dispatcher already handles -- so no schema-valid `IfcAlignmentVerticalSegment`
	// can ever reach that branch; any other string is rejected by the native EXPRESS
	// enum-keyword check at `file.createEntity(...)` time, before this function is
	// even called. A genuinely dead branch, matching `getMappedSegments.ts`'s own
	// already-disclosed `_getCurveSegmentCount` "unreachable in practice" precedent
	// (chunk 2) -- not attempted here via a fake/duck-typed object, since this
	// project has no established mocking convention for this module.

	test("CLOTHOID throws, matching real Python's own NotImplementedError", () => {
		const file = createTestFile("IFC4X3");
		const segment = verticalSegment(file, "CLOTHOID", {});

		expect(() => _mapAlignmentVerticalSegment(file, segment)).toThrow(
			"mapping for IfcVerticalSegment.CLOTHOID not implemented",
		);
	});

	// --- 24 real bSI-RailwayRoom reference cases, ported from
	// `test_map_alignment_vertical_segment.py` verbatim (exact golden values, not
	// re-derived) ---

	describe("CIRCULARARC (real bSI reference cases)", () => {
		test.each([
			// [pythonName, startGradient, endGradient, refDx, refDy, segmentStart, segmentLength, posX, posY, radius]
			[
				"_CircularArc_100_0_10_0_0_0_0_5_1_Meter",
				0.0,
				0.5,
				1.0,
				0.0,
				1053.72220965611,
				103.674757133105,
				-0.0,
				223.606797749979,
				223.606797749979,
			],
			[
				"_CircularArc_100_0_10_0_0_0__0_5_1_Meter",
				0.0,
				-0.5,
				1.0,
				0.0,
				351.240736552036,
				-103.674757133105,
				-1.36919674566051e-14,
				-223.606797749979,
				223.606797749979,
			],
			[
				"_CircularArc_100_0_10_0_0_5_0_0_1_Meter",
				0.5,
				0.0,
				0.894427190999916,
				0.447213595499958,
				454.915493685141,
				-103.674757133105,
				100.0,
				-200.0,
				223.606797749979,
			],
			[
				"_CircularArc_100_0_10_0__0_5_0_0_1_Meter",
				-0.5,
				0.0,
				0.894427190999916,
				-0.447213595499958,
				950.047452523004,
				103.674757133105,
				100.0,
				200.0,
				223.606797749979,
			],
			[
				"_CircularArc_100_0_10_0_0_5_1_0_1_Meter",
				0.5,
				1.0,
				0.894427190999916,
				0.447213595499958,
				1991.60150186753,
				123.801073716741,
				-172.075922005613,
				344.151844011225,
				384.773458895502,
			],
			[
				"_CircularArc_100_0_10_0__0_5__1_0_1_Meter",
				-0.5,
				-1.0,
				0.894427190999916,
				-0.447213595499958,
				426.001441657352,
				-123.801073716741,
				-172.075922005613,
				-344.151844011225,
				384.773458895502,
			],
			[
				"_CircularArc_100_0_10_0_1_0_0_5_1_Meter",
				1.0,
				0.5,
				Math.SQRT1_2,
				Math.SQRT1_2,
				906.601103821832,
				-123.801073716741,
				272.075922005613,
				-272.075922005613,
				384.773458895502,
			],
			[
				"_CircularArc_100_0_10_0__1_0__0_5_1_Meter",
				-1.0,
				-0.5,
				Math.SQRT1_2,
				-Math.SQRT1_2,
				1511.00183970305,
				123.801073716741,
				272.075922005613,
				272.075922005613,
				384.773458895502,
			],
		] as const)(
			"%s (startGradient=%p, endGradient=%p)",
			(_pythonName, startGradient, endGradient, refDx, refDy, segmentStart, segmentLength, posX, posY, radius) => {
				const file = createTestFile("IFC4X3");
				const segment = verticalSegment(file, "CIRCULARARC", {
					startDistAlong: 0.0,
					horizontalLength: 100.0,
					startHeight: 10.0,
					startGradient,
					endGradient,
				});

				const mappedSegments = _mapAlignmentVerticalSegment(file, segment);
				const { mappedSegment, parentCurve } = assertCommonSegmentShape(mappedSegments, refDx, refDy);

				pytestApprox(mappedSegment.get("SegmentStart") as number, segmentStart);
				pytestApprox(mappedSegment.get("SegmentLength") as number, segmentLength);

				expect(parentCurve.isA("IfcCircle")).toBe(true);
				const position = parentCurve.get("Position") as EntityInstance;
				pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [posX, posY]);
				pytestApproxTuple(
					(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0],
				);
				pytestApprox(parentCurve.get("Radius") as number, radius);
			},
		);
	});

	describe("CONSTANTGRADIENT (real bSI reference cases)", () => {
		test.each([
			// [pythonName, startGradient, endGradient, refDx, refDy, segmentLength]
			["_ConstantGradient_100_0_10_0_0_0_0_5_1_Meter", 0.0, 0.5, 1.0, 0.0, 100.0],
			["_ConstantGradient_100_0_10_0_0_0__0_5_1_Meter", 0.0, -0.5, 1.0, 0.0, 100.0],
			[
				"_ConstantGradient_100_0_10_0_0_5_0_0_1_Meter",
				0.5,
				0.0,
				0.894427190999916,
				0.447213595499958,
				111.803398874989,
			],
			[
				"_ConstantGradient_100_0_10_0__0_5_0_0_1_Meter",
				-0.5,
				0.0,
				0.894427190999916,
				-0.447213595499958,
				111.803398874989,
			],
			[
				"_ConstantGradient_100_0_10_0_0_5_1_0_1_Meter",
				0.5,
				1.0,
				0.894427190999916,
				0.447213595499958,
				111.803398874989,
			],
			[
				"_ConstantGradient_100_0_10_0__0_5__1_0_1_Meter",
				-0.5,
				-1.0,
				0.894427190999916,
				-0.447213595499958,
				111.803398874989,
			],
			["_ConstantGradient_100_0_10_0_1_0_0_5_1_Meter", 1.0, 0.5, Math.SQRT1_2, Math.SQRT1_2, 141.42135623731],
			["_ConstantGradient_100_0_10_0__1_0__0_5_1_Meter", -1.0, -0.5, Math.SQRT1_2, -Math.SQRT1_2, 141.42135623731],
		] as const)(
			"%s (startGradient=%p, endGradient=%p)",
			(_pythonName, startGradient, endGradient, refDx, refDy, segmentLength) => {
				const file = createTestFile("IFC4X3");
				const segment = verticalSegment(file, "CONSTANTGRADIENT", {
					startDistAlong: 0.0,
					horizontalLength: 100.0,
					startHeight: 10.0,
					startGradient,
					endGradient,
				});

				const mappedSegments = _mapAlignmentVerticalSegment(file, segment);
				const { mappedSegment, parentCurve } = assertCommonSegmentShape(mappedSegments, refDx, refDy);

				pytestApprox(mappedSegment.get("SegmentStart") as number, 0.0);
				pytestApprox(mappedSegment.get("SegmentLength") as number, segmentLength);

				expect(parentCurve.isA("IfcLine")).toBe(true);
				pytestApproxTuple((parentCurve.get("Pnt") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				const dir = parentCurve.get("Dir") as EntityInstance;
				pytestApproxTuple((dir.get("Orientation") as EntityInstance).get("DirectionRatios") as number[], [1.0, 0.0]);
				pytestApprox(dir.get("Magnitude") as number, 1.0);
			},
		);
	});

	describe("PARABOLICARC (real bSI reference cases)", () => {
		test.each([
			// [pythonName, startGradient, endGradient, refDx, refDy, segmentLength, coeffB, coeffC]
			["_ParabolicArc_100_0_10_0_0_0_0_5_1_Meter", 0.0, 0.5, 1.0, 0.0, 104.02288238772185, 0.0, 0.0025],
			["_ParabolicArc_100_0_10_0_0_0__0_5_1_Meter", 0.0, -0.5, 1.0, 0.0, 104.02288238772185, 0.0, -0.0025],
			[
				"_ParabolicArc_100_0_10_0_0_5_0_0_1_Meter",
				0.5,
				0.0,
				0.894427190999916,
				0.447213595499958,
				104.02288238772185,
				0.5,
				-0.0025,
			],
			[
				"_ParabolicArc_100_0_10_0__0_5_0_0_1_Meter",
				-0.5,
				0.0,
				0.894427190999916,
				-0.447213595499958,
				104.02288238772185,
				-0.5,
				0.0025,
			],
			[
				"_ParabolicArc_100_0_10_0_0_5_1_0_1_Meter",
				0.5,
				1.0,
				0.894427190999916,
				0.447213595499958,
				125.53583299580873,
				0.5,
				0.0025,
			],
			[
				"_ParabolicArc_100_0_10_0__0_5__1_0_1_Meter",
				-0.5,
				-1.0,
				0.894427190999916,
				-0.447213595499958,
				125.53583299580873,
				-0.5,
				-0.0025,
			],
			[
				"_ParabolicArc_100_0_10_0_1_0_0_5_1_Meter",
				1.0,
				0.5,
				Math.SQRT1_2,
				Math.SQRT1_2,
				125.53583299580873,
				1.0,
				-0.0025,
			],
			[
				"_ParabolicArc_100_0_10_0__1_0__0_5_1_Meter",
				-1.0,
				-0.5,
				Math.SQRT1_2,
				-Math.SQRT1_2,
				125.53583299580873,
				-1.0,
				0.0025,
			],
		] as const)(
			"%s (startGradient=%p, endGradient=%p)",
			(_pythonName, startGradient, endGradient, refDx, refDy, segmentLength, coeffB, coeffC) => {
				const file = createTestFile("IFC4X3");
				const segment = verticalSegment(file, "PARABOLICARC", {
					startDistAlong: 0.0,
					horizontalLength: 100.0,
					startHeight: 10.0,
					startGradient,
					endGradient,
				});

				const mappedSegments = _mapAlignmentVerticalSegment(file, segment);
				const { mappedSegment, parentCurve } = assertCommonSegmentShape(mappedSegments, refDx, refDy);

				pytestApprox(mappedSegment.get("SegmentStart") as number, 0.0);
				pytestApprox(mappedSegment.get("SegmentLength") as number, segmentLength);

				expect(parentCurve.isA("IfcPolynomialCurve")).toBe(true);
				const position = parentCurve.get("Position") as EntityInstance;
				pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				pytestApproxTuple(parentCurve.get("CoefficientsX") as number[], [0.0, 1.0]);
				pytestApproxTuple(parentCurve.get("CoefficientsY") as number[], [10.0, coeffB, coeffC]);
			},
		);
	});
});
