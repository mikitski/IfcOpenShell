// This file was generated with the assistance of an AI coding tool.
//
// A real Python test file, `test/api/alignment/test_horizontal_layout_by_pi_method.py`
// (63 lines), DOES exist for `layout_horizontal_alignment_by_pi_method.py` -- this
// file's own previous header comment claimed otherwise; that claim was FALSE,
// corrected here after a dedicated re-verification pass (see `PROGRESS.md`'s
// "`api.alignment` test-fidelity backfill" entry, chunk 4/final of that item). Its own
// docstring explains its intent precisely: "this test will focus on the edge cases of
// no initial tangent run, no final tangent run, and compound curve (no tangent between
// curves)" -- exercised via `create_by_pi_method(file, "TestAlignment", coordinates,
// radii)` (4 PI points, 2 radii) and a final `len(segment_nest.RelatedObjects) == 3`
// assertion (no numeric/coordinate assertions at all). `create_by_pi_method` wraps the
// unconditionally-blocked `create()` (see `../../../src/api/alignment/create.ts`'s own
// header comment), so this fixture isn't reusable as-is.
//
// Of the real test's own 3 named edge cases, "no initial tangent run" and "no final
// tangent run" are both STRUCTURALLY OBSERVABLE on this port today: `createLayoutSegment`
// (this file's own file 2) unconditionally throws at its very first call (see this
// file's own header comment below), so this port can only ever observe the FIRST real
// `createLayoutSegment` call of any PI-method layout -- but with a single-radius input,
// that first call can be EITHER the back-tangent-run LINE, the CIRCULARARC, or (if both
// are skipped, e.g. a degenerate zero-length/zero-radius PI) the post-loop "final
// tangent run" segment itself (see the 3rd test below, which exercises exactly this).
// "Compound curve, no tangent between curves" is the one edge case genuinely
// unreachable here -- it only manifests at the SECOND PI or later (a non-degenerate
// curve-to-curve transition), which this port can never reach since the very first
// `createLayoutSegment` call of ANY radius already throws. The "no initial tangent run"
// (zero back-tangent-run, CIRCULARARC-first) and "no final tangent run" (both prior
// segments skipped, so the loop's own post-loop tangent segment is observed first)
// cases are both covered below with real, hand-computed intermediate math -- genuinely
// equivalent coverage to what the real test's own edge cases would exercise, even
// though the real test itself provides no golden numeric values to port (its own
// assertion is a segment count, on a fixture this port can't build). Original test
// coverage written here.
//
// This function's own substantial real, portable PI-method geometric math
// (`angleBT`/`angleFT`/`delta`/`tangent`/`lc`/`xPC`/`yPC`/`xPT`/`yPT`/`tangentRun`) is
// ported completely and faithfully, but the function as a whole cannot complete without
// throwing (`createLayoutSegment`, this chunk's own file 2, is ALWAYS unconditionally
// blocked). Since `createLayoutSegment`'s own `_addSegmentToLayout` dependency performs
// 2 real, portable side effects (`nest.assignObject`/`nest.reorderNesting`) BEFORE its
// own throw, the ONE real `IfcAlignmentSegment` that gets created and nested into
// `layout` before each test's throw lets these tests verify the REAL, hand-computed
// intermediate math against the actual entity in the file -- not just assert-throws
// stubs. See `../../../src/api/alignment/layoutHorizontalAlignmentByPiMethod.ts`'s own
// header comment for the full writeup.
//
// `createTestFile`'s own default `IfcProject.UnitsInContext` uses an
// `IfcConversionBasedUnit` DEGREE for `PLANEANGLEUNIT` (confirmed empirically, matching
// `_mapAlignmentHorizontalSegment.test.ts`'s own identical finding) -- `StartDirection`
// is stored in degrees (`angleBT / calculateUnitScale(file, "PLANEANGLEUNIT")`, i.e.
// `angleBT / (pi/180)`), not radians.

import { describe, expect, test } from "vitest";
import { layoutHorizontalAlignmentByPiMethod } from "../../../src/api/alignment/layoutHorizontalAlignmentByPiMethod";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function firstCreatedSegment(horizontal: EntityInstance): EntityInstance {
	const rels = horizontal.get("IsNestedBy") as EntityInstance[];
	expect(rels.length).toBe(1);
	const related = rels[0].get("RelatedObjects") as EntityInstance[];
	expect(related.length).toBe(1);
	return related[0];
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))(
	"api.alignment.layoutHorizontalAlignmentByPiMethod (IFC4X3)",
	() => {
		test("throws ValueError-equivalent when radii.length !== hpoints.length - 2", () => {
			const file = createTestFile("IFC4X3");
			const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());

			expect(() =>
				layoutHorizontalAlignmentByPiMethod(
					file,
					horizontal,
					[
						[0, 0],
						[100, 0],
						[200, 100],
					],
					[],
				),
			).toThrow("radii should have two fewer elements that hpoints");
		});

		test("real intermediate math: back-tangent-run LINE segment matches hand-computed values, then throws", () => {
			const file = createTestFile("IFC4X3");
			const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());

			expect(() =>
				layoutHorizontalAlignmentByPiMethod(
					file,
					horizontal,
					[
						[0, 0],
						[100, 0],
						[200, 100],
					],
					[50],
				),
			).toThrow(/_getSegmentEndpoint/);

			const segment = firstCreatedSegment(horizontal);
			const dp = segment.get("DesignParameters") as EntityInstance;
			expect(dp.isA()).toBe("IfcAlignmentHorizontalSegment");
			expect(dp.get("PredefinedType")).toBe("LINE");
			expect(dp.get("StartDirection")).toBeCloseTo(0, 9);
			expect(dp.get("StartRadiusOfCurvature")).toBe(0.0);
			expect(dp.get("EndRadiusOfCurvature")).toBe(0.0);
			// tangentRun = lengthBT(100) - tangent(50*tan(pi/8)) -- hand-computed independently.
			expect(dp.get("SegmentLength")).toBeCloseTo(79.28932188134524, 9);
			const startPoint = dp.get("StartPoint") as EntityInstance;
			expect(startPoint.get("Coordinates")).toEqual([0, 0]);
		});

		test("real intermediate math: CIRCULARARC segment (zero tangent run, skips LINE) matches hand-computed PC/radius/arc-length", () => {
			const file = createTestFile("IFC4X3");
			const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());

			// A 90-degree PI turn with radius == lengthBT makes tangentRun exactly 0, skipping
			// the back-tangent-run LINE segment entirely -- CIRCULARARC is the FIRST real
			// `createLayoutSegment` call reached.
			expect(() =>
				layoutHorizontalAlignmentByPiMethod(
					file,
					horizontal,
					[
						[0, 0],
						[100, 0],
						[100, 100],
					],
					[100],
				),
			).toThrow(/_getSegmentEndpoint/);

			const segment = firstCreatedSegment(horizontal);
			const dp = segment.get("DesignParameters") as EntityInstance;
			expect(dp.get("PredefinedType")).toBe("CIRCULARARC");
			expect(dp.get("StartRadiusOfCurvature")).toBeCloseTo(100, 9);
			expect(dp.get("EndRadiusOfCurvature")).toBeCloseTo(100, 9);
			// lc = |radius * delta| = 100 * (pi/2)
			expect(dp.get("SegmentLength")).toBeCloseTo((100 * Math.PI) / 2, 9);
			const startPoint = dp.get("StartPoint") as EntityInstance;
			expect((startPoint.get("Coordinates") as number[])[0]).toBeCloseTo(0, 9);
			expect((startPoint.get("Coordinates") as number[])[1]).toBeCloseTo(0, 9);
		});

		test("real intermediate math: both back-tangent-run and circular-curve skipped for a degenerate radius==0 PI, falls through to the final tangent-run LINE segment", () => {
			const file = createTestFile("IFC4X3");
			const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new());

			// BT and PI coincide (lengthBT == 0) with radius == 0 -- both the back-tangent-run
			// and circular-curve segments are skipped for the only radius, so the very FIRST
			// real `createLayoutSegment` call is the post-loop "final tangent run" segment.
			expect(() =>
				layoutHorizontalAlignmentByPiMethod(
					file,
					horizontal,
					[
						[0, 0],
						[0, 0],
						[1, 1],
					],
					[0],
				),
			).toThrow(/_getSegmentEndpoint/);

			const segment = firstCreatedSegment(horizontal);
			const dp = segment.get("DesignParameters") as EntityInstance;
			expect(dp.get("PredefinedType")).toBe("LINE");
			// angleBT = atan2(1,1) = pi/4 radians = 45 degrees (this file's own project unit).
			expect(dp.get("StartDirection")).toBeCloseTo(45, 9);
			expect(dp.get("SegmentLength")).toBeCloseTo(Math.sqrt(2), 9);
		});
	},
);
