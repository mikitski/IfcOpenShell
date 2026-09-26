// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset_template/test_remove_prop_template.py` (src/
// ifcopenshell-python) -- `TestRemovePropTemplate`'s 2 cases ported verbatim. Only
// IFC4/IFC4X3 are exercised -- see `./editPropTemplate.test.ts`'s own header comment
// for why (`IfcPropertySetTemplate`/`IfcSimplePropertyTemplate` don't exist on IFC2X3).

import { describe, expect, test } from "vitest";
import { addPropTemplate } from "../../../src/api/pset_template/addPropTemplate";
import { addPsetTemplate } from "../../../src/api/pset_template/addPsetTemplate";
import { removePropTemplate } from "../../../src/api/pset_template/removePropTemplate";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.psetTemplate.removePropTemplate (%s)", (schema) => {
	test("removing a prop template", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_RiskFactors" });
		const prop1 = addPropTemplate(file, { psetTemplate: template });
		const prop2 = addPropTemplate(file, { psetTemplate: template });

		removePropTemplate(file, { propTemplate: prop2 });

		expect(file.byType("IfcSimplePropertyTemplate").length).toBe(1);
		expect((template.get("HasPropertyTemplates") as (typeof prop1)[]).map((p) => p.identity())).toEqual([
			prop1.identity(),
		]);
	});

	test("not removing the last prop template", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_RiskFactors" });
		const prop = addPropTemplate(file, { psetTemplate: template });

		removePropTemplate(file, { propTemplate: prop });

		// The last prop template should not be removed to keep the pset template valid.
		expect(file.byType("IfcSimplePropertyTemplate").length).toBe(1);
		expect((template.get("HasPropertyTemplates") as (typeof prop)[]).map((p) => p.identity())).toEqual([
			prop.identity(),
		]);
	});
});
