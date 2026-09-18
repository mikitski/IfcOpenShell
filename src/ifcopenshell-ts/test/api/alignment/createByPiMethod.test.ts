// This file was generated with the assistance of an AI coding tool.
//
// No real Python test file is reusable here -- real Python's own
// `test_create_by_pi_method.py` presumes a fully functional `create()`/
// `create_layout_segment()`, both unconditionally blocked in this port (see
// `../../../src/api/alignment/create.ts`'s own header comment). Original test coverage
// written here, pinning the real, portable `includeVertical` boolean logic that runs
// before the immediate, unconditional throw from `create()`.

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
