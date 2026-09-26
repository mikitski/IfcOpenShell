// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_structural_load.py` (confirmed: no
// `test_remove_structural_load.py` under `test/api/structural/`). This suite is
// written directly from the real source's own behavior/docstring.

import { describe, expect, test } from "vitest";
import { addStructuralLoad } from "../../../src/api/structural/addStructuralLoad";
import { removeStructuralLoad } from "../../../src/api/structural/removeStructuralLoad";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.removeStructuralLoad (%s)", (schema) => {
	test("removing a structural load", () => {
		const file = createTestFile(schema);
		const load = addStructuralLoad(file, {});

		removeStructuralLoad(file, { structuralLoad: load });

		expect(file.byType("IfcStructuralLoadLinearForce").length).toBe(0);
	});
});
