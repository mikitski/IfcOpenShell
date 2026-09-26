// This file was generated with the assistance of an AI coding tool.
//
// Original TS coverage for `api.pset_template.addPropTemplate` -- real Python's own
// test suite has no `test_add_prop_template.py` at all (see `../../../src/api/
// pset_template/index.ts`'s own header comment), matching `test/util/cost.test.ts`'s
// own established precedent. Written directly against `add_prop_template.py`'s own
// docstring/source, including its two disclosed real Python quirks (a silently
// discarded `primaryMeasureType` for a QTO template, and a full re-sort by `Name` on
// every call -- see `../../../src/api/pset_template/addPropTemplate.ts`'s own header
// comment). Only IFC4/IFC4X3 are exercised -- see `./editPropTemplate.test.ts`'s own
// header comment for why.

import { describe, expect, test } from "vitest";
import { addPropTemplate } from "../../../src/api/pset_template/addPropTemplate";
import { addPsetTemplate } from "../../../src/api/pset_template/addPsetTemplate";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.psetTemplate.addPropTemplate (%s)", (schema) => {
	test("defaults for a PSET template", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_RiskFactors" });

		const prop = addPropTemplate(file, { psetTemplate: template });

		expect(prop.isA("IfcSimplePropertyTemplate")).toBe(true);
		expect(prop.get("Name")).toBe("NewProperty");
		expect(prop.get("TemplateType")).toBe("P_SINGLEVALUE");
		expect(prop.get("PrimaryMeasureType")).toBe("IfcLabel");
		expect(prop.get("AccessState")).toBe("READWRITE");
		expect((template.get("HasPropertyTemplates") as EntityInstance[]).map((p) => p.identity())).toEqual([
			prop.identity(),
		]);
	});

	test("defaults for a QTO template", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_Quantities", templateType: "QTO_OCCURRENCEDRIVEN" });

		const prop = addPropTemplate(file, { psetTemplate: template });

		expect(prop.get("TemplateType")).toBe("Q_LENGTH");
		expect(prop.get("PrimaryMeasureType")).toBeNull();
	});

	test("quirk: an explicit primaryMeasureType is silently discarded for a QTO template", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_Quantities", templateType: "QTO_OCCURRENCEDRIVEN" });

		const prop = addPropTemplate(file, {
			psetTemplate: template,
			primaryMeasureType: "IfcLengthMeasure",
		});

		expect(prop.get("PrimaryMeasureType")).toBeNull();
	});

	test("quirk: adding a property re-sorts every existing property template by Name", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_RiskFactors" });

		const propZ = addPropTemplate(file, { psetTemplate: template, name: "Zebra" });
		const propA = addPropTemplate(file, { psetTemplate: template, name: "Apple" });
		const propM = addPropTemplate(file, { psetTemplate: template, name: "Mango" });

		const names = (template.get("HasPropertyTemplates") as EntityInstance[]).map((p) => p.get("Name"));
		expect(names).toEqual(["Apple", "Mango", "Zebra"]);
		expect(propZ.get("Name")).toBe("Zebra");
		expect(propA.get("Name")).toBe("Apple");
		expect(propM.get("Name")).toBe("Mango");
	});
});
