// This file was generated with the assistance of an AI coding tool.
//
// Original TS coverage for `api.pset_template.addPsetTemplate` -- real Python's own
// test suite has no `test_add_pset_template.py` at all (confirmed by listing
// `test/api/pset_template/`, see `../../../src/api/pset_template/index.ts`'s own
// header comment), matching `test/util/cost.test.ts`'s own established precedent for a
// function Python itself doesn't directly test. Written directly against
// `add_pset_template.py`'s own docstring/source. Only IFC4/IFC4X3 are exercised -- see
// `./editPropTemplate.test.ts`'s own header comment for why.

import { describe, expect, test } from "vitest";
import { addPsetTemplate } from "../../../src/api/pset_template/addPsetTemplate";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.psetTemplate.addPsetTemplate (%s)", (schema) => {
	test("defaults", () => {
		const file = createTestFile(schema);

		const template = addPsetTemplate(file, {});

		expect(template.isA("IfcPropertySetTemplate")).toBe(true);
		expect(template.get("Name")).toBe("New_Pset");
		expect(template.get("TemplateType")).toBe("PSET_TYPEDRIVENOVERRIDE");
		expect(template.get("ApplicableEntity")).toBe("IfcObject,IfcTypeObject");
		// See `addPsetTemplate.ts`'s own header comment: no `OwnerHistory` is ever set.
		expect(template.get("OwnerHistory")).toBeNull();
		expect(template.get("GlobalId")).toBeTruthy();
	});

	test("explicit values", () => {
		const file = createTestFile(schema);

		const template = addPsetTemplate(file, {
			name: "ABC_RiskFactors",
			templateType: "QTO_OCCURRENCEDRIVEN",
			applicableEntity: "IfcWall",
		});

		expect(template.get("Name")).toBe("ABC_RiskFactors");
		expect(template.get("TemplateType")).toBe("QTO_OCCURRENCEDRIVEN");
		expect(template.get("ApplicableEntity")).toBe("IfcWall");
	});
});
