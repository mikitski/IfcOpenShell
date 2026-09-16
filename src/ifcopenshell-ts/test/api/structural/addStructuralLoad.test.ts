// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_structural_load.py` (confirmed: no
// `test_add_structural_load.py` under `test/api/structural/`). This suite is written
// directly from the real source's own behavior/docstring.

import { describe, expect, test } from "vitest";
import { addStructuralLoad } from "../../../src/api/structural/addStructuralLoad";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.addStructuralLoad (%s)", (schema) => {
	test("defaults to an unnamed IfcStructuralLoadLinearForce", () => {
		const file = createTestFile(schema);

		const load = addStructuralLoad(file, {});

		expect(load.isA("IfcStructuralLoadLinearForce")).toBe(true);
		expect(load.get("Name")).toBeNull();
	});

	test("a custom ifcClass/name is honoured", () => {
		const file = createTestFile(schema);

		const load = addStructuralLoad(file, { name: "Wind", ifcClass: "IfcStructuralLoadSingleForce" });

		expect(load.isA("IfcStructuralLoadSingleForce")).toBe(true);
		expect(load.get("Name")).toBe("Wind");
	});
});
