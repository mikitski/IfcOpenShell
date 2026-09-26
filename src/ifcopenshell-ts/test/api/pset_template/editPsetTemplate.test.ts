// This file was generated with the assistance of an AI coding tool.
//
// Original TS coverage for `api.pset_template.editPsetTemplate` -- real Python's own
// test suite has no `test_edit_pset_template.py` at all (see `../../../src/api/
// pset_template/index.ts`'s own header comment), matching `test/util/cost.test.ts`'s
// own established precedent. Written directly against `edit_pset_template.py`'s own
// docstring/source (the docstring's own "Pset_" reserved-prefix rename example is
// ported directly). Only IFC4/IFC4X3 are exercised -- see `./editPropTemplate.test.ts`'s
// own header comment for why.

import { describe, expect, test } from "vitest";
import { addPsetTemplate } from "../../../src/api/pset_template/addPsetTemplate";
import { editPsetTemplate } from "../../../src/api/pset_template/editPsetTemplate";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.psetTemplate.editPsetTemplate (%s)", (schema) => {
	test("renaming a reserved-prefix pset template", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "Pset_RiskFactors" });

		editPsetTemplate(file, { psetTemplate: template, attributes: { Name: "ABC_RiskFactors" } });

		expect(template.get("Name")).toBe("ABC_RiskFactors");
	});

	test("editing multiple attributes at once", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_RiskFactors" });

		editPsetTemplate(file, {
			psetTemplate: template,
			attributes: { Name: "ABC_RiskFactors2", ApplicableEntity: "IfcWall", Description: "Updated" },
		});

		expect(template.get("Name")).toBe("ABC_RiskFactors2");
		expect(template.get("ApplicableEntity")).toBe("IfcWall");
		expect(template.get("Description")).toBe("Updated");
	});
});
