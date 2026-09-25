// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset_template/test_edit_prop_template.py` (src/
// ifcopenshell-python). Both `test_editing_a_simple_template` and
// `test_editing_an_enumeration` are ported verbatim and pass -- the latter used to be
// blocked by a native `attribute_value_shim.cpp` gate (`TODOS.md`'s
// "EntityInstance.setByIndex/IfcFile.createEntity ..." entry, "sixth consequence"),
// fixed 2026-09-23; `editPropTemplate.ts`'s own `Enumerators` special case
// (`file.createEntity(primaryMeasureType, v)`) now materializes the wrapped values
// correctly.
//
// Only IFC4/IFC4X3 are exercised -- `IfcPropertySetTemplate`/`IfcSimplePropertyTemplate`
// don't exist on IFC2X3 at all (see `../../../src/api/pset_template/index.ts`'s own
// header comment), matching real Python's own test suite, which never extends an
// IFC2X3 variant for this module either.

import { describe, expect, test } from "vitest";
import { addPropTemplate } from "../../../src/api/pset_template/addPropTemplate";
import { addPsetTemplate } from "../../../src/api/pset_template/addPsetTemplate";
import { editPropTemplate } from "../../../src/api/pset_template/editPropTemplate";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.psetTemplate.editPropTemplate (%s)", (schema) => {
	test("editing a simple template", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_RiskFactors" });
		const prop = addPropTemplate(file, { psetTemplate: template });

		editPropTemplate(file, { propTemplate: prop, attributes: { Name: "DemoA", PrimaryMeasureType: "IfcLabel" } });
		editPropTemplate(file, { propTemplate: prop, attributes: { Name: "DemoB" } });

		expect(prop.get("Name")).toBe("DemoB");
	});

	test("editing an enumeration", () => {
		const file = createTestFile(schema);
		const template = addPsetTemplate(file, { name: "ABC_RiskFactors" });
		const prop = addPropTemplate(file, { psetTemplate: template });
		editPropTemplate(file, { propTemplate: prop, attributes: { Name: "DemoA", PrimaryMeasureType: "IfcLabel" } });

		editPropTemplate(file, { propTemplate: prop, attributes: { Enumerators: ["FOO", "BAR"] } });
		let enumerators = prop.get("Enumerators") as EntityInstance;
		let enumValues = enumerators.get("EnumerationValues") as EntityInstance[];
		expect(enumValues.map((v) => v.isA())).toEqual(["IfcLabel", "IfcLabel"]);
		expect(enumValues.map((v) => v.getByIndex(0))).toEqual(["FOO", "BAR"]);

		editPropTemplate(file, { propTemplate: prop, attributes: { Name: "DemoC", Enumerators: ["BAZ", "BAR"] } });
		enumerators = prop.get("Enumerators") as EntityInstance;
		expect(enumerators.get("Name")).toBe("DemoC");
		enumValues = enumerators.get("EnumerationValues") as EntityInstance[];
		expect(enumValues.map((v) => v.getByIndex(0))).toEqual(["BAZ", "BAR"]);
		// The existing IfcPropertyEnumeration is mutated in place, not replaced -- see
		// editPropTemplate.ts's own header comment.
		expect(file.byType("IfcPropertyEnumeration")).toHaveLength(1);
	});
});
