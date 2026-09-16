// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset_template/test_remove_pset_template.py` (src/
// ifcopenshell-python) -- `TestRemovePsetTemplate`'s 2 cases ported verbatim. Only
// IFC4/IFC4X3 are exercised -- see `./editPropTemplate.test.ts`'s own header comment
// for why.

import { describe, expect, test } from "vitest";
import { addPropTemplate } from "../../../src/api/pset_template/addPropTemplate";
import { addPsetTemplate } from "../../../src/api/pset_template/addPsetTemplate";
import { removePsetTemplate } from "../../../src/api/pset_template/removePsetTemplate";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.psetTemplate.removePsetTemplate (%s)", (schema) => {
	test("removing a pset template", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_RiskFactors" });

		removePsetTemplate(file, { psetTemplate: template });

		expect(file.byType("IfcPropertySetTemplate").length).toBe(0);
	});

	test("removing a pset template with property templates", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_RiskFactors" });
		addPropTemplate(file, { psetTemplate: template });
		addPropTemplate(file, { psetTemplate: template });

		removePsetTemplate(file, { psetTemplate: template });

		expect(file.byType("IfcPropertySetTemplate").length).toBe(0);
		expect(file.byType("IfcSimplePropertyTemplate").length).toBe(0);
	});
});
