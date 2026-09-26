// This file was generated with the assistance of an AI coding tool.
//
// No dedicated real Python test file exists for `get_horizontal_layout.py` -- see
// `../../../src/api/alignment/index.ts`'s own header comment. Original test coverage
// written here, gated to IFC4X3 (`IfcAlignment`/`IfcAlignmentHorizontal` don't exist
// on IFC2X3/IFC4 at all -- see that same header comment for the schema-availability
// writeup). `describe.skipIf` (NOT `describe.each(AVAILABLE_SCHEMAS.filter(...))`),
// matching this project's established convention for a single-schema-gated file
// (`test/util/schema.test.ts`; PR #125's own real regression on the `describe.each`
// form).
//
// Real Python's own `create()`/`create_by_pi_method()` (the functions every real
// `test_get_*` fixture in this module builds on) are NOT in this chunk's scope, so
// this fixture is built directly via `file.createEntity`/`IfcRelNests`, matching
// `api.cogo`'s own `assignSurveyPoint.test.ts` precedent for "can't reuse the real
// fixture, build an equivalent one instead".

import { describe, expect, test } from "vitest";
import { getHorizontalLayout } from "../../../src/api/alignment/getHorizontalLayout";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Nests `related` under `relating` via a fresh `IfcRelNests`. */
function nest(file: IfcFile, relating: EntityInstance, related: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcRelNests", guid.new(), null, null, null, relating, [...related]);
}

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.alignment.getHorizontalLayout (IFC4X3)", () => {
	test("returns the nested IfcAlignmentHorizontal", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const horizontal = file.createEntity("IfcAlignmentHorizontal", guid.new(), null, "H1");
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");
		nest(file, alignment, [horizontal, vertical]);

		expect(getHorizontalLayout(alignment)?.equals(horizontal)).toBe(true);
	});

	test("returns null when no IfcAlignmentHorizontal is nested", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");
		const vertical = file.createEntity("IfcAlignmentVertical", guid.new(), null, "V1");
		nest(file, alignment, [vertical]);

		expect(getHorizontalLayout(alignment)).toBeNull();
	});

	test("returns null when the alignment isn't nested by anything", () => {
		const file = createTestFile("IFC4X3");
		const alignment = file.createEntity("IfcAlignment", guid.new(), null, "A1");

		expect(getHorizontalLayout(alignment)).toBeNull();
	});
});
