// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_map_alignment_cant_segment.py`
// (src/ifcopenshell-python, 1963 lines) -- a real Python test file DOES exist for
// `_map_alignment_cant_segment.py` (this file's own previous header comment claimed
// otherwise; that claim was FALSE, corrected here after a dedicated parity-audit
// finding -- see `PROGRESS.md`'s "`api.alignment` test-fidelity backfill" entry,
// chunk 2 of that item). Unlike `_mapAlignmentVerticalSegment.test.ts`'s own real
// Python file (chunk 1), real Python's file here carries no explicit top-of-file
// "generated from bSI-RailwayRoom..." attribution comment -- but the case-name
// convention (e.g. `_BlossCurve_100_0_300_1000_1_Meter`) matches the same
// externally-validated bSI-RailwayRoom `IFC-Rail-Unit-Test-Reference-Code` dataset
// `PROGRESS.md`'s own tracking entry documents as this file's source, categorically
// stronger verification than a self-derived-formula cross-check (which can't catch a
// bug shared by both the real Python source and this port's transcription of it).
// All 56 real reference cases (7 curve-type prefixes -- BlossCurve/ConstantCant/
// CosineCurve/HelmertCurve/LinearTransition/SineCurve/VienneseBend -- 8 cases each)
// are ported below as `test.each` tables, one `describe` per `PredefinedType`,
// matching this directory's own established golden-value-table convention (see
// `./_mapAlignmentVerticalSegment.test.ts`, chunk 1). Real Python calls all 56 from
// ONE `test_map_alignment_cant_segment()` function (56 helpers, one per case); split
// here into individual `test()`s so a failure in one case doesn't hide failures in
// the others. Unlike the vertical-segment file's own disclosed "VERTICAL CLOTHOID NOT
// IMPLEMENTED" real-Python-itself gap, this file's tail has no such disclaimer -- all
// 7 `PredefinedType` values this port's own `_mapAlignmentCantSegment.ts` implements
// have full golden coverage here.
//
// NOT covered by the golden dataset (confirmed by reading the whole real Python file
// -- none of its 56 cases' own assertions ever reference `Placement.Axis`): the
// `IfcCurveSegment.Placement.Axis` direction (`_get_axis`'s own
// `rail_head_distance`-derived vector). This file's own previous self-derived-formula
// test coverage recomputed `_get_axis`'s own formula independently just to assert
// this one field -- a same-formula echo, not an independent cross-check (the same
// category of low-value coverage chunk 1's own header comment already established as
// superseded wherever the golden dataset itself provides real coverage). Since the
// golden dataset never exercises `Axis` at all, that self-echoing assertion is
// dropped here rather than kept, matching real Python's own test scope exactly rather
// than inventing new coverage beyond it -- `getAxis`/`Placement.Axis` still runs on
// every case below (it is unconditionally called by every `_map_*` helper under
// test), just not independently asserted against a recomputation of its own formula.
//
// The 1 error-handling test below (non-`IfcAlignmentSegment` argument) is genuinely
// distinct from the golden dataset (which only ever exercises well-formed segments)
// -- kept alongside the golden-value tests rather than replaced.
//
// --- `pytestApprox`/`pytestApproxTuple`: see `_mapAlignmentVerticalSegment.test.ts`'s
// own header comment for the full rationale for reimplementing `pytest.approx`'s own
// default tolerance semantics here instead of Vitest's fixed-decimal-precision
// `toBeCloseTo` -- not repeated in full below. Verified for this file's own math the
// same way chunk 1 verified the vertical-segment file's: this port's own closed-form
// formulas were independently re-derived in a disposable Python script for this
// chunk's own cross-check (not just trusted), confirming bit-for-bit agreement with
// real Python's `_map_alignment_cant_segment` (same formulas, same IEEE-754 double
// arithmetic) for all 56 cases -- 0 mismatches against the golden dataset at
// `pytest.approx`'s own default tolerance. The single largest gap against the golden
// dataset itself found by that cross-check -- the `HELMERTCURVE` second segment's
// `Placement.RefDirection` y-component (`_HelmertCurve_100_0_300_1000_1_Meter` and
// its 3 sign/permutation variants): this port's own closed-form value
// `-0.0015999979520039342` vs. the golden file's own `-0.00159999897600066` -- is the
// SAME disclosed category as the vertical-segment file's own finding: the golden
// dataset's own separate bSI-produced reference tool differing from Python's
// closed-form `atan`/`pow` evaluation (confirmed identical between real Python's
// source and this port, line-by-line) by ~1.02e-9 absolute (~6.4e-7 relative) --
// comfortably inside `pytest.approx`'s default tolerance
// (`abs(actual-expected) <= max(1e-6*|expected|, 1e-12)` evaluates to
// `1.024e-9 <= 1.6e-9`) -- not a bug in this port.

import { describe, expect, test } from "vitest";
import { _mapAlignmentCantSegment } from "../../../src/api/alignment/_mapAlignmentCantSegment";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Reimplements `pytest.approx`'s own default comparison
 * (`abs(actual - expected) <= max(rel * abs(expected), abs)`, `rel=1e-6`/`abs=1e-12`)
 * -- see this file's own header comment, and `_mapAlignmentVerticalSegment.test.ts`'s
 * own header comment, for why this, and not Vitest's digit-precision-based
 * `toBeCloseTo`, is the faithful port of real Python's own tolerance here. */
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

/** All 56 golden cases share `HorizontalLength=100.0`/`StartDistAlong=0.0` and a
 * fixed `RailHeadDistance=1.5` -- ported as constants rather than per-row table
 * columns (matching real Python's own literal per-case kwargs, which never vary
 * these either). */
const LENGTH = 100.0;
const RAIL_HEAD_DISTANCE = 1.5;

function cantSegment(
	file: IfcFile,
	predefinedType: string,
	fields: {
		startCantLeft: number;
		endCantLeft: number;
		startCantRight: number;
		endCantRight: number;
	},
): EntityInstance {
	const designParameters = file.createEntity(
		"IfcAlignmentCantSegment",
		null,
		null,
		0.0,
		LENGTH,
		fields.startCantLeft,
		fields.endCantLeft,
		fields.startCantRight,
		fields.endCantRight,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

/** Asserts the shape every single-`IfcCurveSegment`-result golden case below shares
 * (result-pair shape, `Transition`, `Placement.Location`/`RefDirection`,
 * `SegmentStart`/`SegmentLength`) -- everything except `Placement.Axis` (see this
 * file's own header comment for why `Axis` itself is deliberately not asserted here)
 * and the `ParentCurve`-specific fields, which the caller checks itself. `refDirection`
 * defaults to `[1.0, 0.0, 0.0]` (true for every curve type here EXCEPT
 * `LINEARTRANSITION`, whose own `startDirection` is not always 0 -- see that
 * `describe` block's own table comment) rather than being hardcoded, so
 * `LINEARTRANSITION` can still reuse this helper. Only `HELMERTCURVE` (2 real result
 * segments, asserted separately in its own `describe` block below) doesn't use this
 * helper at all. */
function assertCommonSegmentShape(
	mappedSegments: readonly [EntityInstance, EntityInstance | null],
	placementY: number,
	refDirection: readonly [number, number, number] = [1.0, 0.0, 0.0],
): { curveSegment: EntityInstance; parentCurve: EntityInstance } {
	const [curveSegment, second] = mappedSegments;
	expect(second).toBeNull();
	expect(curveSegment.get("Transition")).toBe("DISCONTINUOUS");

	const placement = curveSegment.get("Placement") as EntityInstance;
	pytestApproxTuple((placement.get("Location") as EntityInstance).get("Coordinates") as number[], [
		0.0,
		placementY,
		0.0,
	]);
	pytestApproxTuple((placement.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], refDirection);

	pytestApprox(curveSegment.get("SegmentStart") as number, 0.0);
	pytestApprox(curveSegment.get("SegmentLength") as number, LENGTH);

	return { curveSegment, parentCurve: curveSegment.get("ParentCurve") as EntityInstance };
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._mapAlignmentCantSegment (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignmentSegment argument", () => {
		const file = createTestFile("IFC4X3");
		const notASegment = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);

		expect(() => _mapAlignmentCantSegment(file, notASegment, RAIL_HEAD_DISTANCE)).toThrow(
			new TypeError("Expected to see type 'IfcAlignmentSegment', instead received 'IfcCartesianPoint'."),
		);
	});

	// NOT tested: the dispatcher's own final "else: throw TypeError" branch. Empirically
	// verified (against this chunk's own freshly-built native addon) that real
	// `IfcAlignmentCantSegmentTypeEnum`'s ONLY 7 valid schema keywords are exactly the
	// 7 branches this dispatcher already handles, so no schema-valid
	// `IfcAlignmentCantSegment` can ever reach that branch -- see
	// `_mapAlignmentVerticalSegment.test.ts`'s own identical disclosure for the full
	// reasoning (same category of genuinely dead branch).

	// --- 56 real bSI-RailwayRoom reference cases, ported from
	// `test_map_alignment_cant_segment.py` verbatim (exact golden values, not
	// re-derived) ---

	describe("BLOSSCURVE (real bSI reference cases)", () => {
		test.each([
			// [pythonName, Dsl, Del, Dsr, Der, placementY, cubicTerm, quadraticTerm, constantTerm]
			[
				"_BlossCurve_100_0_300_1000_1_Meter",
				0.0,
				0.0,
				0.16,
				0.0,
				0.08,
				500.00000000000017,
				-746.9007910928623,
				125000.0,
			],
			[
				"_BlossCurve_100_0__300__1000_1_Meter",
				0.16,
				0.0,
				0.0,
				0.0,
				0.08,
				500.00000000000017,
				-746.9007910928623,
				125000.0,
			],
			[
				"_BlossCurve_100_0_300_inf_1_Meter",
				0.0,
				0.0,
				0.16,
				0.0,
				0.08,
				500.00000000000017,
				-746.9007910928623,
				125000.0,
			],
			[
				"_BlossCurve_100_0__300__inf_1_Meter",
				0.16,
				0.0,
				0.0,
				0.0,
				0.08,
				500.00000000000017,
				-746.9007910928623,
				125000.0,
			],
			["_BlossCurve_100_0_1000_300_1_Meter", 0.0, 0.0, 0.0, 0.16, 0.0, -500.00000000000017, 746.9007910928623, null],
			["_BlossCurve_100_0__1000__300_1_Meter", 0.0, 0.16, 0.0, 0.0, 0.0, -500.00000000000017, 746.9007910928623, null],
			["_BlossCurve_100_0_inf_300_1_Meter", 0.0, 0.0, 0.0, 0.16, 0.0, -500.00000000000017, 746.9007910928623, null],
			["_BlossCurve_100_0__inf__300_1_Meter", 0.0, 0.16, 0.0, 0.0, 0.0, -500.00000000000017, 746.9007910928623, null],
		] as const)(
			"%s (Dsl=%p, Del=%p, Dsr=%p, Der=%p)",
			(_pythonName, Dsl, Del, Dsr, Der, placementY, cubicTerm, quadraticTerm, constantTerm) => {
				const file = createTestFile("IFC4X3");
				const segment = cantSegment(file, "BLOSSCURVE", {
					startCantLeft: Dsl,
					endCantLeft: Del,
					startCantRight: Dsr,
					endCantRight: Der,
				});

				const mappedSegments = _mapAlignmentCantSegment(file, segment, RAIL_HEAD_DISTANCE);
				const { parentCurve } = assertCommonSegmentShape(mappedSegments, placementY);

				expect(parentCurve.isA("IfcThirdOrderPolynomialSpiral")).toBe(true);
				const position = parentCurve.get("Position") as EntityInstance;
				pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				pytestApproxTuple(
					(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0],
				);
				pytestApprox(parentCurve.get("CubicTerm") as number, cubicTerm);
				pytestApprox(parentCurve.get("QuadraticTerm") as number, quadraticTerm);
				expect(parentCurve.get("LinearTerm")).toBeNull();
				if (constantTerm === null) {
					expect(parentCurve.get("ConstantTerm")).toBeNull();
				} else {
					pytestApprox(parentCurve.get("ConstantTerm") as number, constantTerm);
				}
			},
		);
	});

	describe("CONSTANTCANT (real bSI reference cases)", () => {
		test.each([
			// [pythonName, Dsl, Del, Dsr, Der, placementY]
			["_ConstantCant_100_0_300_1000_1_Meter", 0.0, 0.0, 0.16, 0.0, 0.08],
			["_ConstantCant_100_0__300__1000_1_Meter", 0.16, 0.0, 0.0, 0.0, 0.08],
			["_ConstantCant_100_0_300_inf_1_Meter", 0.0, 0.0, 0.16, 0.0, 0.08],
			["_ConstantCant_100_0__300__inf_1_Meter", 0.16, 0.0, 0.0, 0.0, 0.08],
			["_ConstantCant_100_0_1000_300_1_Meter", 0.0, 0.0, 0.0, 0.16, 0.0],
			["_ConstantCant_100_0__1000__300_1_Meter", 0.0, 0.16, 0.0, 0.0, 0.0],
			["_ConstantCant_100_0_inf_300_1_Meter", 0.0, 0.0, 0.0, 0.16, 0.0],
			["_ConstantCant_100_0__inf__300_1_Meter", 0.0, 0.16, 0.0, 0.0, 0.0],
		] as const)("%s (Dsl=%p, Del=%p, Dsr=%p, Der=%p)", (_pythonName, Dsl, Del, Dsr, Der, placementY) => {
			const file = createTestFile("IFC4X3");
			const segment = cantSegment(file, "CONSTANTCANT", {
				startCantLeft: Dsl,
				endCantLeft: Del,
				startCantRight: Dsr,
				endCantRight: Der,
			});

			const mappedSegments = _mapAlignmentCantSegment(file, segment, RAIL_HEAD_DISTANCE);
			const { parentCurve } = assertCommonSegmentShape(mappedSegments, placementY);

			expect(parentCurve.isA("IfcLine")).toBe(true);
			pytestApproxTuple((parentCurve.get("Pnt") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
			const dir = parentCurve.get("Dir") as EntityInstance;
			pytestApproxTuple((dir.get("Orientation") as EntityInstance).get("DirectionRatios") as number[], [1.0, 0.0]);
			pytestApprox(dir.get("Magnitude") as number, 1.0);
		});
	});

	describe("COSINECURVE (real bSI reference cases)", () => {
		test.each([
			// [pythonName, Dsl, Del, Dsr, Der, placementY, cosineTerm, constantTerm]
			["_CosineCurve_100_0_300_1000_1_Meter", 0.0, 0.0, 0.16, 0.0, 0.08, 250000.0, 250000.0],
			["_CosineCurve_100_0__300__1000_1_Meter", 0.16, 0.0, 0.0, 0.0, 0.08, 250000.0, 250000.0],
			["_CosineCurve_100_0_300_inf_1_Meter", 0.0, 0.0, 0.16, 0.0, 0.08, 250000.0, 250000.0],
			["_CosineCurve_100_0__300__inf_1_Meter", 0.16, 0.0, 0.0, 0.0, 0.08, 250000.0, 250000.0],
			["_CosineCurve_100_0_1000_300_1_Meter", 0.0, 0.0, 0.0, 0.16, 0.0, -250000.0, 250000.0],
			["_CosineCurve_100_0__1000__300_1_Meter", 0.0, 0.16, 0.0, 0.0, 0.0, -250000.0, 250000.0],
			["_CosineCurve_100_0_inf_300_1_Meter", 0.0, 0.0, 0.0, 0.16, 0.0, -250000.0, 250000.0],
			["_CosineCurve_100_0__inf__300_1_Meter", 0.0, 0.16, 0.0, 0.0, 0.0, -250000.0, 250000.0],
		] as const)(
			"%s (Dsl=%p, Del=%p, Dsr=%p, Der=%p)",
			(_pythonName, Dsl, Del, Dsr, Der, placementY, cosineTerm, constantTerm) => {
				const file = createTestFile("IFC4X3");
				const segment = cantSegment(file, "COSINECURVE", {
					startCantLeft: Dsl,
					endCantLeft: Del,
					startCantRight: Dsr,
					endCantRight: Der,
				});

				const mappedSegments = _mapAlignmentCantSegment(file, segment, RAIL_HEAD_DISTANCE);
				const { parentCurve } = assertCommonSegmentShape(mappedSegments, placementY);

				expect(parentCurve.isA("IfcCosineSpiral")).toBe(true);
				const position = parentCurve.get("Position") as EntityInstance;
				pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				pytestApproxTuple(
					(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0],
				);
				pytestApprox(parentCurve.get("CosineTerm") as number, cosineTerm);
				pytestApprox(parentCurve.get("ConstantTerm") as number, constantTerm);
			},
		);
	});

	// HELMERTCURVE returns 2 real result segments (not a "second: null" pair like
	// every other curve type below) -- its own dedicated table/assertions don't reuse
	// `assertCommonSegmentShape` for that reason.
	describe("HELMERTCURVE (real bSI reference cases)", () => {
		test.each([
			// [pythonName, Dsl, Del, Dsr, Der,
			//  seg1Y, seg1QuadraticTerm, seg1ConstantTerm,
			//  seg2Y, seg2RefDirX, seg2RefDirY, seg2QuadraticTerm, seg2LinearTerm, seg2ConstantTerm]
			[
				"_HelmertCurve_100_0_300_1000_1_Meter",
				0.0,
				0.0,
				0.16,
				0.0,
				0.08,
				-538.6086725079696,
				31250.0,
				0.04,
				0.999998720000819,
				-0.00159999897600066,
				538.6086725079696,
				-883.8834764831845,
				15625.0,
			],
			[
				"_HelmertCurve_100_0__300__1000_1_Meter",
				0.16,
				0.0,
				0.0,
				0.0,
				0.08,
				-538.6086725079696,
				31250.0,
				0.04,
				0.999998720000819,
				-0.00159999897600066,
				538.6086725079696,
				-883.8834764831845,
				15625.0,
			],
			[
				"_HelmertCurve_100_0_300_inf_1_Meter",
				0.0,
				0.0,
				0.16,
				0.0,
				0.08,
				-538.6086725079696,
				31250.0,
				0.04,
				0.999998720000819,
				-0.00159999897600066,
				538.6086725079696,
				-883.8834764831845,
				15625.0,
			],
			[
				"_HelmertCurve_100_0__300__inf_1_Meter",
				0.16,
				0.0,
				0.0,
				0.0,
				0.08,
				-538.6086725079696,
				31250.0,
				0.04,
				0.999998720000819,
				-0.00159999897600066,
				538.6086725079696,
				-883.8834764831845,
				15625.0,
			],
			[
				"_HelmertCurve_100_0_1000_300_1_Meter",
				0.0,
				0.0,
				0.0,
				0.16,
				0.0,
				538.6086725079696,
				null,
				0.04,
				0.999998720000819,
				0.00159999897600066,
				-538.6086725079696,
				883.8834764831845,
				-31250.0,
			],
			[
				"_HelmertCurve_100_0__1000__300_1_Meter",
				0.0,
				0.16,
				0.0,
				0.0,
				0.0,
				538.6086725079696,
				null,
				0.04,
				0.999998720000819,
				0.00159999897600066,
				-538.6086725079696,
				883.8834764831845,
				-31250.0,
			],
			[
				"_HelmertCurve_100_0_inf_300_1_Meter",
				0.0,
				0.0,
				0.0,
				0.16,
				0.0,
				538.6086725079696,
				null,
				0.04,
				0.999998720000819,
				0.00159999897600066,
				-538.6086725079696,
				883.8834764831845,
				-31250.0,
			],
			[
				"_HelmertCurve_100_0__inf__300_1_Meter",
				0.0,
				0.16,
				0.0,
				0.0,
				0.0,
				538.6086725079696,
				null,
				0.04,
				0.999998720000819,
				0.00159999897600066,
				-538.6086725079696,
				883.8834764831845,
				-31250.0,
			],
		] as const)(
			"%s (Dsl=%p, Del=%p, Dsr=%p, Der=%p)",
			(
				_pythonName,
				Dsl,
				Del,
				Dsr,
				Der,
				seg1Y,
				seg1QuadraticTerm,
				seg1ConstantTerm,
				seg2Y,
				seg2RefDirX,
				seg2RefDirY,
				seg2QuadraticTerm,
				seg2LinearTerm,
				seg2ConstantTerm,
			) => {
				const file = createTestFile("IFC4X3");
				const segment = cantSegment(file, "HELMERTCURVE", {
					startCantLeft: Dsl,
					endCantLeft: Del,
					startCantRight: Dsr,
					endCantRight: Der,
				});

				const [seg1, seg2] = _mapAlignmentCantSegment(file, segment, RAIL_HEAD_DISTANCE);
				expect(seg2).not.toBeNull();
				const segment2 = seg2 as EntityInstance;

				expect(seg1.get("Transition")).toBe("DISCONTINUOUS");
				const placement1 = seg1.get("Placement") as EntityInstance;
				pytestApproxTuple((placement1.get("Location") as EntityInstance).get("Coordinates") as number[], [
					0.0,
					seg1Y,
					0.0,
				]);
				pytestApproxTuple(
					(placement1.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0, 0.0],
				);
				pytestApprox(seg1.get("SegmentStart") as number, 0.0);
				pytestApprox(seg1.get("SegmentLength") as number, LENGTH / 2.0);

				const parentCurve1 = seg1.get("ParentCurve") as EntityInstance;
				expect(parentCurve1.isA("IfcSecondOrderPolynomialSpiral")).toBe(true);
				const position1 = parentCurve1.get("Position") as EntityInstance;
				pytestApproxTuple((position1.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				pytestApproxTuple(
					(position1.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0],
				);
				pytestApprox(parentCurve1.get("QuadraticTerm") as number, seg1QuadraticTerm);
				expect(parentCurve1.get("LinearTerm")).toBeNull();
				if (seg1ConstantTerm === null) {
					expect(parentCurve1.get("ConstantTerm")).toBeNull();
				} else {
					pytestApprox(parentCurve1.get("ConstantTerm") as number, seg1ConstantTerm);
				}

				expect(segment2.get("Transition")).toBe("DISCONTINUOUS");
				const placement2 = segment2.get("Placement") as EntityInstance;
				pytestApproxTuple((placement2.get("Location") as EntityInstance).get("Coordinates") as number[], [
					LENGTH / 2.0,
					seg2Y,
					0.0,
				]);
				pytestApproxTuple((placement2.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [
					seg2RefDirX,
					seg2RefDirY,
					0.0,
				]);
				pytestApprox(segment2.get("SegmentStart") as number, LENGTH / 2.0);
				pytestApprox(segment2.get("SegmentLength") as number, LENGTH / 2.0);

				const parentCurve2 = segment2.get("ParentCurve") as EntityInstance;
				expect(parentCurve2.isA("IfcSecondOrderPolynomialSpiral")).toBe(true);
				const position2 = parentCurve2.get("Position") as EntityInstance;
				pytestApproxTuple((position2.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				pytestApproxTuple(
					(position2.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0],
				);
				pytestApprox(parentCurve2.get("QuadraticTerm") as number, seg2QuadraticTerm);
				pytestApprox(parentCurve2.get("LinearTerm") as number, seg2LinearTerm);
				if (seg2ConstantTerm === null) {
					expect(parentCurve2.get("ConstantTerm")).toBeNull();
				} else {
					pytestApprox(parentCurve2.get("ConstantTerm") as number, seg2ConstantTerm);
				}
			},
		);
	});

	describe("LINEARTRANSITION (real bSI reference cases)", () => {
		// Unlike every other single-segment curve type below, this one's own
		// `startDirection` is NOT always 0 (`atan((A1*length^2)/|A1^3|)`, not a
		// literal `0.0` like the rest) -- so `Placement.RefDirection` is not always
		// `[1,0,0]` either; the table below carries its own `refDirX`/`refDirY`
		// columns rather than relying on `assertCommonSegmentShape`'s default.
		test.each([
			// [pythonName, Dsl, Del, Dsr, Der, placementY, refDirX, refDirY, clothoidConstant]
			[
				"_LinearTransition_100_0_300_1000_1_Meter",
				0.0,
				0.0,
				0.16,
				0.0,
				0.08,
				0.999999680000154,
				-0.000799999744000123,
				-3535.53390593274,
			],
			[
				"_LinearTransition_100_0__300__1000_1_Meter",
				0.16,
				0.0,
				0.0,
				0.0,
				0.08,
				0.999999680000154,
				-0.000799999744000123,
				-3535.53390593274,
			],
			[
				"_LinearTransition_100_0_300_inf_1_Meter",
				0.0,
				0.0,
				0.16,
				0.0,
				0.08,
				0.999999680000154,
				-0.000799999744000123,
				-3535.53390593274,
			],
			[
				"_LinearTransition_100_0__300__inf_1_Meter",
				0.16,
				0.0,
				0.0,
				0.0,
				0.08,
				0.999999680000154,
				-0.000799999744000123,
				-3535.53390593274,
			],
			[
				"_LinearTransition_100_0_1000_300_1_Meter",
				0.0,
				0.0,
				0.0,
				0.16,
				0.0,
				0.999999680000154,
				0.000799999744000123,
				3535.53390593274,
			],
			[
				"_LinearTransition_100_0__1000__300_1_Meter",
				0.0,
				0.16,
				0.0,
				0.0,
				0.0,
				0.999999680000154,
				0.000799999744000123,
				3535.53390593274,
			],
			[
				"_LinearTransition_100_0_inf_300_1_Meter",
				0.0,
				0.0,
				0.0,
				0.16,
				0.0,
				0.999999680000154,
				0.000799999744000123,
				3535.53390593274,
			],
			[
				"_LinearTransition_100_0__inf__300_1_Meter",
				0.0,
				0.16,
				0.0,
				0.0,
				0.0,
				0.999999680000154,
				0.000799999744000123,
				3535.53390593274,
			],
		] as const)(
			"%s (Dsl=%p, Del=%p, Dsr=%p, Der=%p)",
			(_pythonName, Dsl, Del, Dsr, Der, placementY, refDirX, refDirY, clothoidConstant) => {
				const file = createTestFile("IFC4X3");
				const segment = cantSegment(file, "LINEARTRANSITION", {
					startCantLeft: Dsl,
					endCantLeft: Del,
					startCantRight: Dsr,
					endCantRight: Der,
				});

				const mappedSegments = _mapAlignmentCantSegment(file, segment, RAIL_HEAD_DISTANCE);
				const { parentCurve } = assertCommonSegmentShape(mappedSegments, placementY, [refDirX, refDirY, 0.0]);

				expect(parentCurve.isA("IfcClothoid")).toBe(true);
				const position = parentCurve.get("Position") as EntityInstance;
				pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				pytestApproxTuple(
					(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0],
				);
				pytestApprox(parentCurve.get("ClothoidConstant") as number, clothoidConstant);
			},
		);
	});

	describe("SINECURVE (real bSI reference cases)", () => {
		test.each([
			// [pythonName, Dsl, Del, Dsr, Der, placementY, sineTerm, linearTerm, constantTerm]
			["_SineCurve_100_0_300_1000_1_Meter", 0.0, 0.0, 0.16, 0.0, 0.08, 785398.163397448, -3535.53390593274, 125000.0],
			["_SineCurve_100_0__300__1000_1_Meter", 0.16, 0.0, 0.0, 0.0, 0.08, 785398.163397448, -3535.53390593274, 125000.0],
			["_SineCurve_100_0_300_inf_1_Meter", 0.0, 0.0, 0.16, 0.0, 0.08, 785398.163397448, -3535.53390593274, 125000.0],
			["_SineCurve_100_0__300__inf_1_Meter", 0.16, 0.0, 0.0, 0.0, 0.08, 785398.163397448, -3535.53390593274, 125000.0],
			["_SineCurve_100_0_1000_300_1_Meter", 0.0, 0.16, 0.0, 0.0, 0.0, -785398.163397448, 3535.53390593274, null],
			["_SineCurve_100_0__1000__300_1_Meter", 0.0, 0.16, 0.0, 0.0, 0.0, -785398.163397448, 3535.53390593274, null],
			["_SineCurve_100_0_inf_300_1_Meter", 0.0, 0.0, 0.0, 0.16, 0.0, -785398.163397448, 3535.53390593274, null],
			["_SineCurve_100_0__inf__300_1_Meter", 0.0, 0.16, 0.0, 0.0, 0.0, -785398.163397448, 3535.53390593274, null],
		] as const)(
			"%s (Dsl=%p, Del=%p, Dsr=%p, Der=%p)",
			(_pythonName, Dsl, Del, Dsr, Der, placementY, sineTerm, linearTerm, constantTerm) => {
				const file = createTestFile("IFC4X3");
				const segment = cantSegment(file, "SINECURVE", {
					startCantLeft: Dsl,
					endCantLeft: Del,
					startCantRight: Dsr,
					endCantRight: Der,
				});

				const mappedSegments = _mapAlignmentCantSegment(file, segment, RAIL_HEAD_DISTANCE);
				const { parentCurve } = assertCommonSegmentShape(mappedSegments, placementY);

				expect(parentCurve.isA("IfcSineSpiral")).toBe(true);
				const position = parentCurve.get("Position") as EntityInstance;
				pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				pytestApproxTuple(
					(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0],
				);
				pytestApprox(parentCurve.get("SineTerm") as number, sineTerm);
				if (linearTerm === null) {
					expect(parentCurve.get("LinearTerm")).toBeNull();
				} else {
					pytestApprox(parentCurve.get("LinearTerm") as number, linearTerm);
				}
				if (constantTerm === null) {
					expect(parentCurve.get("ConstantTerm")).toBeNull();
				} else {
					pytestApprox(parentCurve.get("ConstantTerm") as number, constantTerm);
				}
			},
		);
	});

	describe("VIENNESEBEND (real bSI reference cases)", () => {
		test.each([
			// [pythonName, Dsl, Del, Dsr, Der, placementY, septicTerm, sexticTerm, quinticTerm, quarticTerm, constantTerm]
			[
				"_VienneseBend_100_0_300_1000_1_Meter",
				0.0,
				0.0,
				0.1,
				0.03,
				0.05,
				185.93568367635672,
				-169.87095595653895,
				180.0012184608678,
				-241.1974890085123,
				200000.0,
			],
			[
				"_VienneseBend_100_0__300__1000_1_Meter",
				0.1,
				0.03,
				0.0,
				0.0,
				0.05,
				185.93568367635672,
				-169.87095595653895,
				180.0012184608678,
				-241.1974890085123,
				200000.0,
			],
			[
				"_VienneseBend_100_0_300_inf_1_Meter",
				0.0,
				0.0,
				0.1,
				0.0,
				0.05,
				177.82794100389228,
				-161.4322423756691,
				169.6127328157867,
				-224.5910214113641,
				200000.0,
			],
			[
				"_VienneseBend_100_0__300__inf_1_Meter",
				0.1,
				0.0,
				0.0,
				0.0,
				0.05,
				177.82794100389228,
				-161.4322423756691,
				169.6127328157867,
				-224.5910214113641,
				200000.0,
			],
			[
				"_VienneseBend_100_0_1000_300_1_Meter",
				0.0,
				0.0,
				0.03,
				0.1,
				0.015,
				-185.93568367635672,
				169.87095595653895,
				-180.0012184608678,
				241.1974890085123,
				666666.666666667,
			],
			[
				"_VienneseBend_100_0__1000__300_1_Meter",
				0.03,
				0.1,
				0.0,
				0.0,
				0.015,
				-185.93568367635672,
				169.87095595653895,
				-180.0012184608678,
				241.1974890085123,
				666666.666666667,
			],
			[
				"_VienneseBend_100_0_inf_300_1_Meter",
				0.0,
				0.0,
				0.0,
				0.1,
				0.0,
				-177.82794100389228,
				161.4322423756691,
				-169.6127328157867,
				224.5910214113641,
				null,
			],
			[
				"_VienneseBend_100_0__inf__300_1_Meter",
				0.0,
				0.1,
				0.0,
				0.0,
				0.0,
				-177.82794100389228,
				161.4322423756691,
				-169.6127328157867,
				224.5910214113641,
				null,
			],
		] as const)(
			"%s (Dsl=%p, Del=%p, Dsr=%p, Der=%p)",
			(_pythonName, Dsl, Del, Dsr, Der, placementY, septicTerm, sexticTerm, quinticTerm, quarticTerm, constantTerm) => {
				const file = createTestFile("IFC4X3");
				const segment = cantSegment(file, "VIENNESEBEND", {
					startCantLeft: Dsl,
					endCantLeft: Del,
					startCantRight: Dsr,
					endCantRight: Der,
				});

				const mappedSegments = _mapAlignmentCantSegment(file, segment, RAIL_HEAD_DISTANCE);
				const { parentCurve } = assertCommonSegmentShape(mappedSegments, placementY);

				expect(parentCurve.isA("IfcSeventhOrderPolynomialSpiral")).toBe(true);
				const position = parentCurve.get("Position") as EntityInstance;
				pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				pytestApproxTuple(
					(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0],
				);
				pytestApprox(parentCurve.get("SepticTerm") as number, septicTerm);
				pytestApprox(parentCurve.get("SexticTerm") as number, sexticTerm);
				pytestApprox(parentCurve.get("QuinticTerm") as number, quinticTerm);
				pytestApprox(parentCurve.get("QuarticTerm") as number, quarticTerm);
				expect(parentCurve.get("CubicTerm")).toBeNull();
				expect(parentCurve.get("QuadraticTerm")).toBeNull();
				expect(parentCurve.get("LinearTerm")).toBeNull();
				if (constantTerm === null) {
					expect(parentCurve.get("ConstantTerm")).toBeNull();
				} else {
					pytestApprox(parentCurve.get("ConstantTerm") as number, constantTerm);
				}
			},
		);
	});
});
