// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_stationing_nest.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3.
//
// `../../../src/api/alignment/getStationingNest.ts`'s own header comment discloses
// that real Python's own `file` parameter is unused -- this file's own fixtures still
// pass a real `IfcFile` positionally (matching the real signature exactly), just to
// confirm the port genuinely never touches it (no `TypeError`/crash from an unrelated
// file, etc.).

import { describe, expect, test } from "vitest";
import { getStationingNest } from "../../../src/api/alignment/getStationingNest";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getStationingNest (IFC4X3)", () => {
	test("returns the IfcRelNests whose RelatedObjects contains an IfcReferent", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal]);
		const referent = file.createEntity("IfcReferent", guid.new(), null, "A1 0+00.00");
		const stationingNest = file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [referent]);

		expect(getStationingNest(file, alignment)?.equals(stationingNest)).toBe(true);
	});

	test("returns null when no nested IfcReferent exists", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [horizontal]);

		expect(getStationingNest(file, alignment)).toBeNull();
	});

	test("throws TypeError for a non-IfcAlignment argument, matching real Python's own message", () => {
		const file = createTestFile("IFC4X3");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");

		expect(() => getStationingNest(file, horizontal)).toThrow(
			new TypeError("Expected IfcAlignment, instead received IfcAlignmentHorizontal"),
		);
	});
});
