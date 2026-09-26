// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/alignment/test_map_alignment_horizontal_segment.py`
// (src/ifcopenshell-python, 2641 lines, the LARGEST of the 3 `_map_alignment_*_segment`
// reference files) -- a real Python test file DOES exist for
// `_map_alignment_horizontal_segment.py` (this file's own previous header comment
// claimed otherwise; that claim was FALSE, corrected here after a dedicated
// parity-audit finding -- see `PROGRESS.md`'s "`api.alignment` test-fidelity backfill"
// entry, chunk 3 of that item, following the same pattern chunks 1/2 already
// established for `_mapAlignmentVerticalSegment.test.ts`/`_mapAlignmentCantSegment
// .test.ts`). All 72 real reference cases (9 curve-type prefixes -- Line/CircularArc/
// Clothoid/Cubic/HelmertCurve/BlossCurve/CosineCurve/SineCurve/VienneseBend -- 8 cases
// each) are ported below as `test.each` tables (one `describe` per `PredefinedType`),
// matching this directory's own established golden-value-table convention. Real Python
// calls all 72 from ONE `test_map_alignment_horizontal_segment()` function (72
// helpers, one per case); split here into individual `test()`s so a failure in one
// case doesn't hide failures in the others.
//
// The 1 error-handling test below (non-`IfcAlignmentSegment` argument) is genuinely
// distinct from the golden dataset (which only ever exercises well-formed segments)
// -- kept alongside the golden-value tests rather than replaced. The LINE case's own
// prior self-derived test also asserted a genuinely distinct structural fact the
// golden dataset itself never checks -- that `Placement.Location` is the SAME entity
// instance as `DesignParameters.StartPoint` (real Python passes it through unchanged,
// not a copy) -- kept as its own dedicated test rather than folded into the golden
// `test.each` table below (which only compares `Coordinates` values, not identity).
// Every other prior self-derived-formula test is superseded by the golden dataset
// (which exercises every one of this file's own 9 `PredefinedType`s with real,
// externally-validated numeric cases) and is not kept separately.
//
// --- 2 real quirks found in the real Python reference file's own literal case
// bodies (both confirmed by reading the raw source directly, not just this port's own
// transcription) ---
//
// 1. **All 8 `_Line_*` cases construct IDENTICAL inputs**
//    (`StartRadiusOfCurvature=0.0`/`EndRadiusOfCurvature=0.0` in every one, regardless
//    of what each case's own name suggests) -- not a bug, just a consequence of the
//    shared per-curve-type naming template applied to a curve type
//    (`_map_line`/`mapLine` below) that never reads either radius field at all. Ported
//    as 8 distinct `test.each` rows anyway (matching real Python's own literal
//    structure and preserving each case's own `pythonName` for traceability), even
//    though the rows are numerically redundant.
// 2. **`_CircularArc_*`'s own naming convention (suggesting 8 distinct
//    Start/EndRadiusOfCurvature pairs, matching every other curve-type group's own
//    table) does NOT hold for 7 of its 8 real case bodies** -- confirmed by reading
//    each function's own literal `StartRadiusOfCurvature`/`EndRadiusOfCurvature`
//    kwargs directly: `_CircularArc_100_0_300_1000_1_Meter`/
//    `_CircularArc_100_0_300_inf_1_Meter`/`_CircularArc_100_0_inf_300_1_Meter` all
//    three literally construct `(300.0, 300.0)` (not `(300.0, 1000.0)`/`(300.0, 0.0)`/
//    `(0.0, 300.0)` as their own names suggest), and
//    `_CircularArc_100_0__300__1000_1_Meter`/`_CircularArc_100_0__300__inf_1_Meter`/
//    `_CircularArc_100_0__1000__300_1_Meter`/`_CircularArc_100_0__inf__300_1_Meter` all
//    four literally construct `(-300.0, -300.0)` (not `(-300.0, -1000.0)`/
//    `(-300.0, 0.0)`/`(-1000.0, -300.0)`/`(0.0, -300.0)`). Only
//    `_CircularArc_100_0_1000_300_1_Meter` genuinely varies (`(1000.0, 300.0)`). Since
//    `_map_circular_arc`/`mapCircularArc`
//    below never reads `EndRadiusOfCurvature` at all (only `StartRadiusOfCurvature`
//    and its own sign), this has NO effect on the correctness of any case's own
//    assertions -- each case is still internally self-consistent with its own literal
//    inputs, just not with what its own name implies. Ported each case's own LITERAL
//    body values verbatim (not the name-implied ones), matching this project's
//    "preserve real quirks verbatim, disclose rather than silently fix" policy. No
//    `TODOS.md` entry: this doesn't block or misrepresent any behavior of this port's
//    own code, only describes an authoring artifact in the upstream reference file.
//
// --- VienneseBend: hand-built minimal real entity graph, NOT `api.alignment.create`/
// `createLayoutSegment` ---
//
// Real Python's own 8 `_VienneseBend_*` cases build a full real alignment via
// `ifcopenshell.api.alignment.create(file, "", include_vertical=True,
// include_cant=True)` + 3x `ifcopenshell.api.alignment.create_layout_segment` (cant,
// horizontal, vertical) -- `mapVienneseBend`'s own real logic
// (`_map_alignment_horizontal_segment.py`) needs to read the corresponding REAL cant
// segment's `StartCantLeft`/`EndCantLeft`/`StartCantRight`/`EndCantRight` and the cant
// layout's own `RailHeadDistance` via this module's own already-landed `_getCantSegment`
// (chunk 3, `./_getCantSegment.ts`). Both `create`/`createLayoutSegment` are ALREADY
// CONFIRMED, by this port's own PROGRESS.md (chunk 8 of the main `api.alignment`
// port), to be UNCONDITIONALLY BLOCKED on this port (`create` blocked on
// `addStationingReferent`'s 2 already-disclosed primitive-layer gaps;
// `createLayoutSegment` blocked on chunk 7's `_addSegmentToLayout`) -- so real
// Python's own construction path cannot be used here.
//
// Resolved the same way already-merged PR #145 resolved an analogous
// wrapped-API-is-circularly-blocked problem for IFC2X3 owner bootstrapping: hand-built
// the minimal REAL entity graph `_getCantSegment`'s own actual read path needs, via
// raw `file.createEntity`/`IfcRelNests` calls that bypass the blocked wrapped API
// entirely -- reusing this very file's own PRIOR `VienneseBend` test's already-
// established, already-passing fixture shape (an `IfcAlignment` nesting a sibling
// `IfcAlignmentHorizontal`/`IfcAlignmentCant` pair -- IFC CT 4.1.4.4.1.1 -- the
// horizontal segment nested under the horizontal layout, and one real
// `IfcAlignmentCantSegment`-based `IfcAlignmentSegment` nested under the cant layout
// at the same index) via `vienneseBendFixture` below, now parameterized over all 8
// golden cases rather than just one hand-picked example. Verified this reproduces the
// exact golden values for all 8 cases by independently re-deriving every one of
// `mapVienneseBend`'s own closed-form terms in a disposable Python script BEFORE
// writing this file (not just assumed) -- 0 mismatches against the golden dataset at
// `pytest.approx`'s own default tolerance. All 8 landed; no deferral needed.
//
// --- `pytestApprox`/`pytestApproxTuple`: see `_mapAlignmentVerticalSegment.test.ts`'s
// own header comment (chunk 1) for the full rationale for reimplementing
// `pytest.approx`'s own default tolerance here instead of Vitest's fixed-decimal-
// precision `toBeCloseTo` -- not repeated in full below. Verified for this file's own
// math the same way chunks 1/2 verified theirs: every one of this port's own
// closed-form formulas was independently re-derived in a disposable Python script for
// this chunk's own cross-check. Most of the resulting tiny gaps found (e.g. several
// `HELMERTCURVE`/`VIENNESEBEND` terms differing from the golden dataset by ~1e-9-1e-8)
// are the SAME disclosed category chunks 1/2 already established: the golden
// dataset's own separate bSI-produced reference tool differing negligibly from
// Python's own closed-form evaluation, well inside `pytest.approx`'s default
// tolerance -- not a bug in this port.
//
// **A GENUINE BUG WAS FOUND AND FIXED, though, not merely a negligible-tolerance
// difference**: 4 of the 8 `HELMERTCURVE` cases (`_HelmertCurve_100_0_300_inf_1_Meter`/
// `_HelmertCurve_100_0__300__inf_1_Meter`/`_HelmertCurve_100_0_1000_300_1_Meter`/
// `_HelmertCurve_100_0__1000__300_1_Meter`) initially FAILED against the golden
// dataset by ~1.3-1.6e-7 absolute error on the second segment's own
// `ParentCurve.Position.Location` -- 12-16x outside `pytest.approx`'s own tolerance
// for these specific cases (catastrophic cancellation in `xp`/`yp`'s own
// `x1 - x2*cos(anglep) + y2*sin(anglep)`-shaped formula amplifies a small absolute
// error into a large relative one against the small resulting `xp`/`yp`). Traced this
// to a genuine, confirmed bug in `_mapAlignmentHorizontalSegment.ts`'s OWN
// `trapezoidal` helper (landed in chunk 5, previously untested against real golden
// values) -- its termination criterion didn't match Boost's real one (read directly
// from a local Boost 1.92.0 install's own `trapezoidal.hpp`), converging to a more
// numerically "exact" value than real boost's own deliberately coarser
// L1-norm-relative stopping rule actually produces -- see that file's own header
// comment (the "CORRECTION" section, `mapHelmertCurve`) for the full writeup and fix,
// independently verified against the real native `ifcopenshell_wrapper
// .helmert_curve_point` binding (via a real installed `ifcopenshell` 0.8.4.post1
// Python package) bit-for-bit before landing. All 8 `HELMERTCURVE` cases (and all 72
// cases overall) pass against the corrected `trapezoidal`. No `TODOS.md` entry: this
// is a self-contained, already-fixed bug in this same PR's own diff, not an unfixed
// gap needing tracking.

import { describe, expect, test } from "vitest";
import { _mapAlignmentHorizontalSegment } from "../../../src/api/alignment/_mapAlignmentHorizontalSegment";
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

/** All 72 golden cases share `SegmentLength=100.0`/`StartPoint=(0,0)`/
 * `StartDirection=0.0` -- ported as a constant rather than a per-row table column
 * (matching real Python's own literal per-case kwargs, which never vary these). */
const LENGTH = 100.0;

function horizontalSegment(
	file: IfcFile,
	predefinedType: string,
	fields: {
		startPoint?: readonly [number, number];
		startDirection?: number;
		startRadiusOfCurvature?: number;
		endRadiusOfCurvature?: number;
		segmentLength?: number;
		gravityCenterLineHeight?: number | null;
	},
): EntityInstance {
	const startPoint = file.createEntity("IfcCartesianPoint", [...(fields.startPoint ?? [0.0, 0.0])]);
	const designParameters = file.createEntity(
		"IfcAlignmentHorizontalSegment",
		null,
		null,
		startPoint,
		fields.startDirection ?? 0.0,
		fields.startRadiusOfCurvature ?? 0.0,
		fields.endRadiusOfCurvature ?? 0.0,
		fields.segmentLength ?? 0.0,
		fields.gravityCenterLineHeight ?? null,
		predefinedType,
	);
	return file.createEntity("IfcAlignmentSegment", guid.new(), null, null, null, null, null, null, designParameters);
}

function nest(file: IfcFile, relating: EntityInstance, related: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relating, [...related]);
}

/** Asserts the shape every single-`IfcCurveSegment`-result golden case below shares
 * (result-pair shape, `Transition`, `Placement.Location`/`RefDirection` -- always
 * `(0,0)`/`(1,0)` since every non-`HELMERTCURVE` case uses `StartPoint=(0,0)`/
 * `StartDirection=0.0` -- and `SegmentStart`/`SegmentLength`, which DO vary per case).
 * Only `HELMERTCURVE` (2 real result segments) doesn't use this helper at all, since
 * its own second segment's `Placement` is not the identity placement. */
function assertCommonSegmentShape(
	mappedSegments: readonly [EntityInstance, EntityInstance | null],
	segmentStart: number,
	segmentLength: number,
): { curveSegment: EntityInstance; parentCurve: EntityInstance } {
	const [curveSegment, second] = mappedSegments;
	expect(second).toBeNull();
	expect(curveSegment.get("Transition")).toBe("DISCONTINUOUS");

	const placement = curveSegment.get("Placement") as EntityInstance;
	pytestApproxTuple((placement.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
	pytestApproxTuple((placement.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [1.0, 0.0]);

	pytestApprox(curveSegment.get("SegmentStart") as number, segmentStart);
	pytestApprox(curveSegment.get("SegmentLength") as number, segmentLength);

	return { curveSegment, parentCurve: curveSegment.get("ParentCurve") as EntityInstance };
}

/** Hand-builds the minimal REAL entity graph `_getCantSegment` (chunk 3) actually
 * needs -- see this file's own header comment for why real Python's own
 * `api.alignment.create`/`create_layout_segment` construction path can't be used here
 * (both unconditionally blocked on this port), and why this exact shape (reusing this
 * file's own prior `VienneseBend` test's already-established fixture) is sufficient. */
function vienneseBendFixture(
	file: IfcFile,
	fields: {
		startRadiusOfCurvature: number;
		endRadiusOfCurvature: number;
		gravityCenterLineHeight: number;
		railHeadDistance: number;
		startCantLeft: number;
		endCantLeft: number;
		startCantRight: number;
		endCantRight: number;
	},
): EntityInstance {
	const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
	const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
	const cant = file.createEntity(
		"IfcAlignmentCant",
		guid.new(),
		null,
		"C1",
		null,
		null,
		null,
		null,
		fields.railHeadDistance,
	);
	nest(file, alignment, [horizontal, cant]);

	const segment = horizontalSegment(file, "VIENNESEBEND", {
		startPoint: [0, 0],
		startDirection: 0,
		startRadiusOfCurvature: fields.startRadiusOfCurvature,
		endRadiusOfCurvature: fields.endRadiusOfCurvature,
		segmentLength: LENGTH,
		gravityCenterLineHeight: fields.gravityCenterLineHeight,
	});
	nest(file, horizontal, [segment]);

	const cantDesignParameters = file.createEntity(
		"IfcAlignmentCantSegment",
		null,
		null,
		0.0,
		LENGTH,
		fields.startCantLeft,
		fields.endCantLeft,
		fields.startCantRight,
		fields.endCantRight,
		"VIENNESEBEND",
	);
	const cantSegmentEntity = file.createEntity(
		"IfcAlignmentSegment",
		guid.new(),
		null,
		null,
		null,
		null,
		null,
		null,
		cantDesignParameters,
	);
	nest(file, cant, [cantSegmentEntity]);

	return segment;
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment._mapAlignmentHorizontalSegment (IFC4X3)", () => {
	test("throws TypeError for a non-IfcAlignmentSegment argument", () => {
		const file = createTestFile("IFC4X3");
		const notASegment = file.createEntity("IfcCartesianPoint", [0.0, 0.0]);

		expect(() => _mapAlignmentHorizontalSegment(file, notASegment)).toThrow(
			new TypeError("Expected to see type 'IfcAlignmentSegment', instead received 'IfcCartesianPoint'."),
		);
	});

	// NOT tested: the dispatcher's own final "else: throw TypeError" branch. Empirically
	// verified (against this chunk's own freshly-built native addon) that real
	// `IfcAlignmentHorizontalSegmentTypeEnum`'s ONLY 9 valid schema keywords are
	// exactly the 9 branches this dispatcher already handles (`PARABOLICARC`, for
	// instance -- a real keyword, but only for `IfcAlignmentVerticalSegmentTypeEnum`
	// -- is REJECTED by the native EXPRESS enum-keyword check for THIS entity), so no
	// schema-valid `IfcAlignmentHorizontalSegment` can ever reach that branch -- see
	// `_mapAlignmentVerticalSegment.test.ts`'s own identical disclosure for the full
	// reasoning (same category of genuinely dead branch).

	test("LINE: Placement.Location is the SAME entity instance as DesignParameters.StartPoint (not a copy)", () => {
		// Genuinely distinct from the golden dataset below, which only ever compares
		// `Coordinates` VALUES -- real Python passes `design_parameters.StartPoint`
		// straight through as `Placement.Location`, without copying it.
		const file = createTestFile("IFC4X3");
		const segment = horizontalSegment(file, "LINE", { startPoint: [10, 20], startDirection: 0, segmentLength: 100 });

		const [curveSegment] = _mapAlignmentHorizontalSegment(file, segment);
		const designParameters = segment.get("DesignParameters") as EntityInstance;
		const placement = curveSegment.get("Placement") as EntityInstance;
		expect((placement.get("Location") as EntityInstance).equals(designParameters.get("StartPoint"))).toBe(true);
	});

	// --- 72 real bSI-RailwayRoom reference cases, ported from
	// `test_map_alignment_horizontal_segment.py` verbatim (exact golden values, not
	// re-derived) ---

	describe("LINE (real bSI reference cases)", () => {
		// All 8 real cases construct IDENTICAL inputs -- see this file's own header
		// comment, quirk 1.
		test.each([
			"_Line_100_0_300_1000_1_Meter",
			"_Line_100_0__300__1000_1_Meter",
			"_Line_100_0_300_inf_1_Meter",
			"_Line_100_0__300__inf_1_Meter",
			"_Line_100_0_1000_300_1_Meter",
			"_Line_100_0__1000__300_1_Meter",
			"_Line_100_0_inf_300_1_Meter",
			"_Line_100_0__inf__300_1_Meter",
		] as const)("%s", (_pythonName) => {
			const file = createTestFile("IFC4X3");
			const segment = horizontalSegment(file, "LINE", {
				startPoint: [0, 0],
				startDirection: 0,
				startRadiusOfCurvature: 0.0,
				endRadiusOfCurvature: 0.0,
				segmentLength: LENGTH,
			});

			const mappedSegments = _mapAlignmentHorizontalSegment(file, segment);
			const { parentCurve } = assertCommonSegmentShape(mappedSegments, 0.0, LENGTH);

			expect(parentCurve.isA("IfcLine")).toBe(true);
			pytestApproxTuple((parentCurve.get("Pnt") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
			const dir = parentCurve.get("Dir") as EntityInstance;
			pytestApproxTuple((dir.get("Orientation") as EntityInstance).get("DirectionRatios") as number[], [1.0, 0.0]);
			pytestApprox(dir.get("Magnitude") as number, 1.0);
		});
	});

	describe("CIRCULARARC (real bSI reference cases)", () => {
		// See this file's own header comment, quirk 2: 6 of these 8 cases' own real
		// Python bodies don't actually vary Start/EndRadiusOfCurvature to match their
		// own names -- the `sr`/`er` columns below are each case's own LITERAL body
		// values (verbatim), not the name-implied ones.
		test.each([
			// [pythonName, sr, er, radius, segmentLength]
			["_CircularArc_100_0_300_1000_1_Meter", 300.0, 300.0, 300.0, 100.0],
			["_CircularArc_100_0__300__1000_1_Meter", -300.0, -300.0, 300.0, -100.0],
			["_CircularArc_100_0_300_inf_1_Meter", 300.0, 300.0, 300.0, 100.0],
			["_CircularArc_100_0__300__inf_1_Meter", -300.0, -300.0, 300.0, -100.0],
			["_CircularArc_100_0_1000_300_1_Meter", 1000.0, 300.0, 1000.0, 100.0],
			["_CircularArc_100_0__1000__300_1_Meter", -300.0, -300.0, 300.0, -100.0],
			["_CircularArc_100_0_inf_300_1_Meter", 300.0, 300.0, 300.0, 100.0],
			["_CircularArc_100_0__inf__300_1_Meter", -300.0, -300.0, 300.0, -100.0],
		] as const)("%s (sr=%p, er=%p)", (_pythonName, sr, er, radius, segmentLength) => {
			const file = createTestFile("IFC4X3");
			const segment = horizontalSegment(file, "CIRCULARARC", {
				startPoint: [0, 0],
				startDirection: 0,
				startRadiusOfCurvature: sr,
				endRadiusOfCurvature: er,
				segmentLength: LENGTH,
			});

			const mappedSegments = _mapAlignmentHorizontalSegment(file, segment);
			const { parentCurve } = assertCommonSegmentShape(mappedSegments, 0.0, segmentLength);

			expect(parentCurve.isA("IfcCircle")).toBe(true);
			const position = parentCurve.get("Position") as EntityInstance;
			pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
			pytestApproxTuple(
				(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
				[1.0, 0.0],
			);
			pytestApprox(parentCurve.get("Radius") as number, radius);
		});
	});

	describe("CLOTHOID (real bSI reference cases)", () => {
		test.each([
			// [pythonName, sr, er, segmentStart, clothoidConstant]
			["_Clothoid_100_0_300_1000_1_Meter", 300.0, 1000.0, -142.857142857143, -207.019667802706],
			["_Clothoid_100_0__300__1000_1_Meter", -300.0, -1000.0, -142.857142857143, 207.019667802706],
			["_Clothoid_100_0_300_inf_1_Meter", 300.0, 0.0, -100.0, -173.205080756888],
			["_Clothoid_100_0__300__inf_1_Meter", -300.0, 0.0, -100.0, 173.205080756888],
			["_Clothoid_100_0_1000_300_1_Meter", 1000.0, 300.0, 42.8571428571429, 207.019667802706],
			["_Clothoid_100_0__1000__300_1_Meter", -1000.0, -300.0, 42.8571428571429, -207.019667802706],
			["_Clothoid_100_0_inf_300_1_Meter", 0.0, 300.0, 0.0, 173.205080756888],
			["_Clothoid_100_0__inf__300_1_Meter", 0.0, -300.0, 0.0, -173.205080756888],
		] as const)("%s (sr=%p, er=%p)", (_pythonName, sr, er, segmentStart, clothoidConstant) => {
			const file = createTestFile("IFC4X3");
			const segment = horizontalSegment(file, "CLOTHOID", {
				startPoint: [0, 0],
				startDirection: 0,
				startRadiusOfCurvature: sr,
				endRadiusOfCurvature: er,
				segmentLength: LENGTH,
			});

			const mappedSegments = _mapAlignmentHorizontalSegment(file, segment);
			const { parentCurve } = assertCommonSegmentShape(mappedSegments, segmentStart, LENGTH);

			expect(parentCurve.isA("IfcClothoid")).toBe(true);
			const position = parentCurve.get("Position") as EntityInstance;
			pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
			pytestApproxTuple(
				(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
				[1.0, 0.0],
			);
			pytestApprox(parentCurve.get("ClothoidConstant") as number, clothoidConstant);
		});
	});

	describe("CUBIC (real bSI reference cases)", () => {
		test.each([
			// [pythonName, sr, er, segmentStart, cubicTerm]
			["_Cubic_100_0_300_1000_1_Meter", 300.0, 1000.0, -142.857142857143, -3.88888888888889e-6],
			["_Cubic_100_0__300__1000_1_Meter", -300.0, -1000.0, -142.857142857143, 3.88888888888889e-6],
			["_Cubic_100_0_300_inf_1_Meter", 300.0, 0.0, -100.0, -5.55555555555556e-6],
			["_Cubic_100_0__300__inf_1_Meter", -300.0, 0.0, -100.0, 5.55555555555556e-6],
			["_Cubic_100_0_1000_300_1_Meter", 1000.0, 300.0, 42.8571428571429, 3.88888888888889e-6],
			["_Cubic_100_0__1000__300_1_Meter", -1000.0, -300.0, 42.8571428571429, -3.88888888888889e-6],
			["_Cubic_100_0_inf_300_1_Meter", 0.0, 300.0, 0.0, 5.55555555555556e-6],
			["_Cubic_100_0__inf__300_1_Meter", 0.0, -300.0, 0.0, -5.55555555555556e-6],
		] as const)("%s (sr=%p, er=%p)", (_pythonName, sr, er, segmentStart, cubicTerm) => {
			const file = createTestFile("IFC4X3");
			const segment = horizontalSegment(file, "CUBIC", {
				startPoint: [0, 0],
				startDirection: 0,
				startRadiusOfCurvature: sr,
				endRadiusOfCurvature: er,
				segmentLength: LENGTH,
			});

			const mappedSegments = _mapAlignmentHorizontalSegment(file, segment);
			const { parentCurve } = assertCommonSegmentShape(mappedSegments, segmentStart, LENGTH);

			expect(parentCurve.isA("IfcPolynomialCurve")).toBe(true);
			const position = parentCurve.get("Position") as EntityInstance;
			pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
			pytestApproxTuple(
				(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
				[1.0, 0.0],
			);
			pytestApproxTuple(parentCurve.get("CoefficientsX") as number[], [0.0, 1.0]);
			pytestApproxTuple(parentCurve.get("CoefficientsY") as number[], [0.0, 0.0, 0.0, cubicTerm]);
		});
	});

	describe("BLOSSCURVE (real bSI reference cases)", () => {
		test.each([
			// [pythonName, sr, er, constantTerm, quadraticTerm, cubicTerm]
			["_BlossCurve_100_0_300_1000_1_Meter", 300.0, 1000.0, 300.0, -112.624788044361, 120.989673502444],
			["_BlossCurve_100_0__300__1000_1_Meter", -300.0, -1000.0, -300.0, 112.624788044361, -120.989673502444],
			["_BlossCurve_100_0_300_inf_1_Meter", 300.0, 0.0, 300.0, -100.0, 110.668191970032],
			["_BlossCurve_100_0__300__inf_1_Meter", -300.0, 0.0, -300.0, 100.0, -110.668191970032],
			["_BlossCurve_100_0_1000_300_1_Meter", 1000.0, 300.0, 1000.0, 112.624788044361, -120.989673502444],
			["_BlossCurve_100_0__1000__300_1_Meter", -1000.0, -300.0, -1000.0, -112.624788044361, 120.989673502444],
			["_BlossCurve_100_0_inf_300_1_Meter", 0.0, 300.0, null, 100.0, -110.668191970032],
			["_BlossCurve_100_0__inf__300_1_Meter", 0.0, -300.0, null, -100.0, 110.668191970032],
		] as const)("%s (sr=%p, er=%p)", (_pythonName, sr, er, constantTerm, quadraticTerm, cubicTerm) => {
			const file = createTestFile("IFC4X3");
			const segment = horizontalSegment(file, "BLOSSCURVE", {
				startPoint: [0, 0],
				startDirection: 0,
				startRadiusOfCurvature: sr,
				endRadiusOfCurvature: er,
				segmentLength: LENGTH,
			});

			const mappedSegments = _mapAlignmentHorizontalSegment(file, segment);
			const { parentCurve } = assertCommonSegmentShape(mappedSegments, 0.0, LENGTH);

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
		});
	});

	describe("COSINECURVE (real bSI reference cases)", () => {
		test.each([
			// [pythonName, sr, er, constantTerm, cosineTerm]
			["_CosineCurve_100_0_300_1000_1_Meter", 300.0, 1000.0, 461.538461538462, 857.142857142857],
			["_CosineCurve_100_0__300__1000_1_Meter", -300.0, -1000.0, -461.538461538462, -857.142857142857],
			["_CosineCurve_100_0_300_inf_1_Meter", 300.0, 0.0, 600.0, 600.0],
			["_CosineCurve_100_0__300__inf_1_Meter", -300.0, 0.0, -600.0, -600.0],
			["_CosineCurve_100_0_1000_300_1_Meter", 1000.0, 300.0, 461.538461538462, -857.142857142857],
			["_CosineCurve_100_0__1000__300_1_Meter", -1000.0, -300.0, -461.538461538462, 857.142857142857],
			["_CosineCurve_100_0_inf_300_1_Meter", 0.0, 300.0, 600.0, -600.0],
			["_CosineCurve_100_0__inf__300_1_Meter", 0.0, -300.0, -600.0, 600.0],
		] as const)("%s (sr=%p, er=%p)", (_pythonName, sr, er, constantTerm, cosineTerm) => {
			const file = createTestFile("IFC4X3");
			const segment = horizontalSegment(file, "COSINECURVE", {
				startPoint: [0, 0],
				startDirection: 0,
				startRadiusOfCurvature: sr,
				endRadiusOfCurvature: er,
				segmentLength: LENGTH,
			});

			const mappedSegments = _mapAlignmentHorizontalSegment(file, segment);
			const { parentCurve } = assertCommonSegmentShape(mappedSegments, 0.0, LENGTH);

			expect(parentCurve.isA("IfcCosineSpiral")).toBe(true);
			const position = parentCurve.get("Position") as EntityInstance;
			pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
			pytestApproxTuple(
				(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
				[1.0, 0.0],
			);
			pytestApprox(parentCurve.get("CosineTerm") as number, cosineTerm);
			pytestApprox(parentCurve.get("ConstantTerm") as number, constantTerm);
		});
	});

	describe("SINECURVE (real bSI reference cases)", () => {
		test.each([
			// [pythonName, sr, er, constantTerm, linearTerm, sineTerm]
			["_SineCurve_100_0_300_1000_1_Meter", 300.0, 1000.0, 300.0, -207.019667802706, 2692.79370307697],
			["_SineCurve_100_0__300__1000_1_Meter", -300.0, -1000.0, -300.0, 207.019667802706, -2692.79370307697],
			["_SineCurve_100_0_300_inf_1_Meter", 300.0, 0.0, 300.0, -173.205080756888, 1884.95559215388],
			["_SineCurve_100_0__300__inf_1_Meter", -300.0, 0.0, -300.0, 173.205080756888, -1884.95559215388],
			["_SineCurve_100_0_1000_300_1_Meter", 1000.0, 300.0, 1000.0, 207.019667802706, -2692.79370307697],
			["_SineCurve_100_0__1000__300_1_Meter", -1000.0, -300.0, -1000.0, -207.019667802706, 2692.79370307697],
			["_SineCurve_100_0_inf_300_1_Meter", 0.0, 300.0, null, 173.205080756888, -1884.95559215388],
			["_SineCurve_100_0__inf__300_1_Meter", 0.0, -300.0, null, -173.205080756888, 1884.95559215388],
		] as const)("%s (sr=%p, er=%p)", (_pythonName, sr, er, constantTerm, linearTerm, sineTerm) => {
			const file = createTestFile("IFC4X3");
			const segment = horizontalSegment(file, "SINECURVE", {
				startPoint: [0, 0],
				startDirection: 0,
				startRadiusOfCurvature: sr,
				endRadiusOfCurvature: er,
				segmentLength: LENGTH,
			});

			const mappedSegments = _mapAlignmentHorizontalSegment(file, segment);
			const { parentCurve } = assertCommonSegmentShape(mappedSegments, 0.0, LENGTH);

			expect(parentCurve.isA("IfcSineSpiral")).toBe(true);
			const position = parentCurve.get("Position") as EntityInstance;
			pytestApproxTuple((position.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
			pytestApproxTuple(
				(position.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
				[1.0, 0.0],
			);
			pytestApprox(parentCurve.get("SineTerm") as number, sineTerm);
			pytestApprox(parentCurve.get("LinearTerm") as number, linearTerm);
			if (constantTerm === null) {
				expect(parentCurve.get("ConstantTerm")).toBeNull();
			} else {
				pytestApprox(parentCurve.get("ConstantTerm") as number, constantTerm);
			}
		});
	});

	// HELMERTCURVE returns 2 real result segments (not a "second: null" pair like
	// every other curve type above) -- its own dedicated table/assertions don't reuse
	// `assertCommonSegmentShape` for that reason (the second segment's own `Placement`
	// is not the identity placement).
	describe("HELMERTCURVE (real bSI reference cases)", () => {
		test.each([
			// [pythonName, sr, er,
			//  seg1ConstantTerm, seg1QuadraticTerm,
			//  seg2LocX, seg2LocY, seg2RefX, seg2RefY,
			//  seg2PosX, seg2PosY, seg2PosRefX, seg2PosRefY,
			//  seg2QuadraticTerm, seg2LinearTerm, seg2ConstantTerm]
			[
				"_HelmertCurve_100_0_300_1000_1_Meter",
				300.0,
				1000.0,
				300.0,
				-128.92319893893,
				49.7998035122387,
				3.91603145329256,
				0.9892460407218963,
				0.146260968532457,
				-0.009321141429516372,
				0.46831933573745577,
				0.9992574637140321,
				-0.03852948496670688,
				128.92319893893,
				-103.509833901353,
				176.470588235294,
			],
			[
				"_HelmertCurve_100_0__300__1000_1_Meter",
				-300.0,
				-1000.0,
				-300.0,
				128.92319893893,
				49.7998035122387,
				-3.91603145329256,
				0.9892460407218963,
				-0.146260968532457,
				-0.009321141429516372,
				-0.46831933573745577,
				0.9992574637140321,
				0.03852948496670688,
				-128.92319893893,
				103.509833901353,
				-176.470588235294,
			],
			[
				"_HelmertCurve_100_0_300_inf_1_Meter",
				300.0,
				0.0,
				300.0,
				-114.471424255333,
				49.8122545525202,
				3.81263503030693,
				0.9904138664989948,
				0.1381317235341378,
				-0.010305467756443198,
				0.6738837916692928,
				0.9984794480380026,
				-0.05512523782919828,
				114.471424255333,
				-86.6025403784439,
				150.0,
			],
			[
				"_HelmertCurve_100_0__300__inf_1_Meter",
				-300.0,
				0.0,
				-300.0,
				114.471424255333,
				49.8122545525202,
				-3.81263503030693,
				0.9904138664989948,
				-0.1381317235341378,
				-0.010305467756443198,
				-0.6738837916692928,
				0.9984794480380026,
				0.05512523782919828,
				-114.471424255333,
				86.6025403784439,
				-150.0,
			],
			[
				"_HelmertCurve_100_0_1000_300_1_Meter",
				1000.0,
				300.0,
				1000.0,
				128.92319893893,
				49.9681012468824,
				1.49252747074135,
				0.997594495159641,
				0.0693197174487962,
				0.010408767953926904,
				-0.4828832446956578,
				0.9992463304688143,
				0.03881714884698913,
				-128.92319893893,
				103.509833901353,
				-750.0,
			],
			[
				"_HelmertCurve_100_0__1000__300_1_Meter",
				-1000.0,
				-300.0,
				-1000.0,
				-128.92319893893,
				49.9681012468824,
				-1.49252747074135,
				0.997594495159641,
				-0.0693197174487962,
				0.010408767953926904,
				0.4828832446956578,
				0.9992463304688143,
				-0.03881714884698913,
				128.92319893893,
				-103.509833901353,
				750.0,
			],
			[
				"_HelmertCurve_100_0_inf_300_1_Meter",
				0.0,
				300.0,
				null,
				114.471424255333,
				49.9972443634885,
				0.347204361427475,
				0.999614222337484,
				0.027769614722351524,
				0.011625841243773832,
				-0.6968669147609581,
				0.9984543318840984,
				0.05557829739996359,
				-114.471424255333,
				86.6025403784439,
				-300.0,
			],
			[
				"_HelmertCurve_100_0__inf__300_1_Meter",
				0.0,
				-300.0,
				null,
				-114.471424255333,
				49.9972443634885,
				-0.347204361427475,
				0.999614222337484,
				-0.027769614722351524,
				0.011625841243773832,
				0.6968669147609581,
				0.9984543318840984,
				-0.05557829739996359,
				114.471424255333,
				-86.6025403784439,
				300.0,
			],
		] as const)(
			"%s (sr=%p, er=%p)",
			(
				_pythonName,
				sr,
				er,
				seg1ConstantTerm,
				seg1QuadraticTerm,
				seg2LocX,
				seg2LocY,
				seg2RefX,
				seg2RefY,
				seg2PosX,
				seg2PosY,
				seg2PosRefX,
				seg2PosRefY,
				seg2QuadraticTerm,
				seg2LinearTerm,
				seg2ConstantTerm,
			) => {
				const file = createTestFile("IFC4X3");
				const segment = horizontalSegment(file, "HELMERTCURVE", {
					startPoint: [0, 0],
					startDirection: 0,
					startRadiusOfCurvature: sr,
					endRadiusOfCurvature: er,
					segmentLength: LENGTH,
				});

				const [curveSegment1, curveSegment2] = _mapAlignmentHorizontalSegment(file, segment);
				expect(curveSegment2).not.toBeNull();
				const seg2 = curveSegment2 as EntityInstance;

				expect(curveSegment1.get("Transition")).toBe("DISCONTINUOUS");
				const placement1 = curveSegment1.get("Placement") as EntityInstance;
				pytestApproxTuple((placement1.get("Location") as EntityInstance).get("Coordinates") as number[], [0.0, 0.0]);
				pytestApproxTuple(
					(placement1.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[],
					[1.0, 0.0],
				);
				pytestApprox(curveSegment1.get("SegmentStart") as number, 0.0);
				pytestApprox(curveSegment1.get("SegmentLength") as number, LENGTH / 2);
				const parentCurve1 = curveSegment1.get("ParentCurve") as EntityInstance;
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

				expect(seg2.get("Transition")).toBe("DISCONTINUOUS");
				const placement2 = seg2.get("Placement") as EntityInstance;
				pytestApproxTuple((placement2.get("Location") as EntityInstance).get("Coordinates") as number[], [
					seg2LocX,
					seg2LocY,
				]);
				pytestApproxTuple((placement2.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [
					seg2RefX,
					seg2RefY,
				]);
				pytestApprox(seg2.get("SegmentStart") as number, LENGTH / 2);
				pytestApprox(seg2.get("SegmentLength") as number, LENGTH / 2);
				const parentCurve2 = seg2.get("ParentCurve") as EntityInstance;
				expect(parentCurve2.isA("IfcSecondOrderPolynomialSpiral")).toBe(true);
				const position2 = parentCurve2.get("Position") as EntityInstance;
				pytestApproxTuple((position2.get("Location") as EntityInstance).get("Coordinates") as number[], [
					seg2PosX,
					seg2PosY,
				]);
				pytestApproxTuple((position2.get("RefDirection") as EntityInstance).get("DirectionRatios") as number[], [
					seg2PosRefX,
					seg2PosRefY,
				]);
				pytestApprox(parentCurve2.get("QuadraticTerm") as number, seg2QuadraticTerm);
				pytestApprox(parentCurve2.get("LinearTerm") as number, seg2LinearTerm);
				pytestApprox(parentCurve2.get("ConstantTerm") as number, seg2ConstantTerm);
			},
		);
	});

	describe("VIENNESEBEND (real bSI reference cases)", () => {
		test.each([
			// [pythonName, sr, er, scl, ecl, scr, ecr,
			//  constantTerm, quadraticTerm, cubicTerm, quarticTerm, quinticTerm, sexticTerm, septicTerm]
			[
				"_VienneseBend_100_0_300_1000_1_Meter",
				300.0,
				1000.0,
				0.0,
				0.0,
				0.1,
				0.03,
				300.0,
				141.521951256265,
				-91.7493208218373,
				-68.9807356362507,
				61.2742234216927,
				-67.097076273516,
				82.48484305114,
			],
			[
				"_VienneseBend_100_0__300__1000_1_Meter",
				-300.0,
				-1000.0,
				0.1,
				0.03,
				0.0,
				0.0,
				-300.0,
				-141.521951256265,
				91.7493208218373,
				68.9807356362507,
				-61.2742234216927,
				67.097076273516,
				-82.48484305114,
			],
			[
				"_VienneseBend_100_0_300_inf_1_Meter",
				300.0,
				0.0,
				0.0,
				0.0,
				0.1,
				0.0,
				300.0,
				125.657906854859,
				-83.922298125931,
				-64.2314061308743,
				57.7378785242934,
				-63.7638813456506,
				78.8880838459446,
			],
			[
				"_VienneseBend_100_0__300__inf_1_Meter",
				-300.0,
				0.0,
				0.1,
				0.0,
				0.0,
				0.0,
				-300.0,
				-125.657906854859,
				83.922298125931,
				64.2314061308743,
				-57.7378785242934,
				63.7638813456506,
				-78.8880838459446,
			],
			[
				"_VienneseBend_100_0_1000_300_1_Meter",
				1000.0,
				300.0,
				0.0,
				0.0,
				0.03,
				0.1,
				1000.0,
				-141.521951256265,
				91.7493208218373,
				68.9807356362507,
				-61.2742234216927,
				67.097076273516,
				-82.48484305114,
			],
			[
				"_VienneseBend_100_0__1000__300_1_Meter",
				-1000.0,
				-300.0,
				0.03,
				0.1,
				0.0,
				0.0,
				-1000.0,
				141.521951256265,
				-91.7493208218373,
				-68.9807356362507,
				61.2742234216927,
				-67.097076273516,
				82.48484305114,
			],
			[
				"_VienneseBend_100_0_inf_300_1_Meter",
				0.0,
				300.0,
				0.0,
				0.0,
				0.0,
				0.1,
				null,
				-125.657906854859,
				83.922298125931,
				64.2314061308743,
				-57.7378785242934,
				63.7638813456506,
				-78.8880838459446,
			],
			[
				"_VienneseBend_100_0__inf__300_1_Meter",
				0.0,
				-300.0,
				0.0,
				0.1,
				0.0,
				0.0,
				null,
				125.657906854859,
				-83.922298125931,
				-64.2314061308743,
				57.7378785242934,
				-63.7638813456506,
				78.8880838459446,
			],
		] as const)(
			"%s (sr=%p, er=%p)",
			(
				_pythonName,
				sr,
				er,
				scl,
				ecl,
				scr,
				ecr,
				constantTerm,
				quadraticTerm,
				cubicTerm,
				quarticTerm,
				quinticTerm,
				sexticTerm,
				septicTerm,
			) => {
				const file = createTestFile("IFC4X3");
				const segment = vienneseBendFixture(file, {
					startRadiusOfCurvature: sr,
					endRadiusOfCurvature: er,
					gravityCenterLineHeight: 1.8,
					railHeadDistance: 1.5,
					startCantLeft: scl,
					endCantLeft: ecl,
					startCantRight: scr,
					endCantRight: ecr,
				});

				const mappedSegments = _mapAlignmentHorizontalSegment(file, segment);
				const { parentCurve } = assertCommonSegmentShape(mappedSegments, 0.0, LENGTH);

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
});
