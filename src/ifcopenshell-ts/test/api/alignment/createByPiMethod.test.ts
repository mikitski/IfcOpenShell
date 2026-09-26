// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file is reusable here -- real Python's own
// `test_create_by_pi_method.py` presumes a fully functional `create_layout_segment()`
// (`create()` itself now succeeds -- see `../../../src/api/alignment/create.ts`'s own
// header comment). Original test coverage written here, pinning the real, portable
// `includeVertical` boolean logic and `create()`'s own real success that both run
// before the immediate, unconditional throw from `layoutHorizontalAlignmentByPiMethod`'s
// own first `createLayoutSegment` call (the still-open, real-geometry-kernel-needing
// `_getSegmentEndpoint` gap).
//
// --- Upstream sync, chunk 3 of 4 (real upstream commit
//     `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`) ---
//
// `startStation` is now optional (default `null`) and, when given, is used for a direct
// `addStationingReferent` call AFTER the horizontal (and, if applicable, vertical)
// layout construction -- see `../../../src/api/alignment/createByPiMethod.ts`'s own
// header comment. That call is never reached by any real invocation of this function
// today (the function always throws earlier, at `layoutHorizontalAlignmentByPiMethod`'s
// own unconditional kernel gap) -- added a dedicated test below pinning this, matching
// this module's own "port every real branch, even an unreachable one" discipline.

import { describe, expect, test } from "vitest";
import { createByPiMethod } from "../../../src/api/alignment/createByPiMethod";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.createByPiMethod (IFC4X3)", () => {
	test("throws (unconditionally, via create()) for a horizontal-only invocation", () => {
		const file = createTestFile("IFC4X3");

		expect(() =>
			createByPiMethod(
				file,
				"A",
				[
					[0, 0],
					[100, 0],
					[200, 100],
				],
				[50],
			),
		).toThrow();

		expect(file.byType("IfcAlignmentHorizontal").length).toBe(1);
		expect(file.byType("IfcAlignmentVertical").length).toBe(0);
	});

	test("real, portable includeVertical=true logic runs (creates the vertical layout) before the same throw", () => {
		const file = createTestFile("IFC4X3");

		expect(() =>
			createByPiMethod(
				file,
				"A",
				[
					[0, 0],
					[100, 0],
					[200, 100],
				],
				[50],
				[
					[0, 0],
					[100, 10],
					[200, 10],
				],
				[40],
			),
		).toThrow();

		expect(file.byType("IfcAlignmentHorizontal").length).toBe(1);
		expect(file.byType("IfcAlignmentVertical").length).toBe(1);
	});

	test("startStation, when given, is never reached -- the function still throws at the same createLayoutSegment gap first, no referent is created", () => {
		const file = createTestFile("IFC4X3");

		expect(() =>
			createByPiMethod(
				file,
				"A",
				[
					[0, 0],
					[100, 0],
					[200, 100],
				],
				[50],
				null,
				null,
				10000.0,
			),
		).toThrow();

		expect(file.byType("IfcReferent")).toHaveLength(0);
	});

	test("includeVertical stays false if either vpoints or lengths is omitted", () => {
		const file = createTestFile("IFC4X3");

		expect(() =>
			createByPiMethod(
				file,
				"A",
				[
					[0, 0],
					[100, 0],
					[200, 100],
				],
				[50],
				[
					[0, 0],
					[100, 10],
					[200, 10],
				],
				null,
			),
		).toThrow();

		expect(file.byType("IfcAlignmentVertical").length).toBe(0);
	});
});
