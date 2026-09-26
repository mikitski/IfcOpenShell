// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_structural_load.py` (confirmed: no
// `test_edit_structural_load.py` under `test/api/structural/`). This suite is
// written directly from the real source's own behavior/docstring.

import { describe, expect, test } from "vitest";
import { addStructuralLoad } from "../../../src/api/structural/addStructuralLoad";
import { editStructuralLoad } from "../../../src/api/structural/editStructuralLoad";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.editStructuralLoad (%s)", (schema) => {
	test("editing attributes", () => {
		const file = createTestFile(schema);
		const load = addStructuralLoad(file, {});

		editStructuralLoad(file, { structuralLoad: load, attributes: { Name: "Wind", LinearForceX: 5.0 } });

		expect(load.get("Name")).toBe("Wind");
		expect(load.get("LinearForceX")).toBe(5.0);
	});
});
