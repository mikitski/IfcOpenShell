// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_remove_system.py` (src/ifcopenshell-python).
// `test_removing_a_system`/`test_removing_orphaned_group_relationships` are ported
// verbatim. `test_removing_orphaned_property_relationships` is ported with one
// disclosed adaptation, matching `../group/removeGroup.test.ts`'s own established
// precedent: real Python's setup calls `ifcopenshell.api.pset.add_pset`/`edit_pset`
// (not ported -- `api.pset` remains a future, larger chunk beyond the minimal
// `removePset` this project already has, see `../../../src/api/pset/removePset.ts`'s
// own header comment); this test builds the equivalent `IfcPropertySet`/
// `IfcPropertySingleValue`/`IfcRelDefinesByProperties` fixture directly via
// `file.createEntity(...)` instead.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addSystem } from "../../../src/api/system/addSystem";
import { assignSystem } from "../../../src/api/system/assignSystem";
import { removeSystem } from "../../../src/api/system/removeSystem";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.removeSystem (%s)", (schema) => {
	test("removing a system", () => {
		const file = createTestFile(schema);
		const system = addSystem(file, { ifcClass: "IfcSystem" });

		removeSystem(file, { system });

		expect(file.byType("IfcSystem").length).toBe(0);
	});

	test("removing orphaned group relationships", () => {
		const file = createTestFile(schema);
		const element = createEntity(file, { ifcClass: "IfcFlowTerminal" });
		const system = addSystem(file, { ifcClass: "IfcSystem" });
		assignSystem(file, { products: [element], system });

		removeSystem(file, { system });

		expect(file.byType("IfcRelAssignsToGroup").length).toBe(0);
	});

	test("removing orphaned property relationships", () => {
		const file = createTestFile(schema);
		const system = addSystem(file, { ifcClass: "IfcSystem" });
		const prop = file.createEntity("IfcPropertySingleValue", "Foo", null, "Bar", null);
		const pset = file.createEntity("IfcPropertySet", guid.new(), null, "Foo_Bar", null, [prop]);
		file.createEntity("IfcRelDefinesByProperties", guid.new(), null, null, null, [system], pset);

		removeSystem(file, { system });

		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);
		expect(file.byType("IfcPropertySet").length).toBe(0);
		expect(file.byType("IfcPropertySingleValue").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.system.removeSystem Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed system; redo removes it again", () => {
		const file = createTestFile(schema);
		const system = addSystem(file, { ifcClass: "IfcSystem" });
		const id = system.id();

		file.beginTransaction();
		removeSystem(file, { system });
		file.endTransaction();

		expect(() => file.byId(id)).toThrow();

		file.undo();
		expect(file.byId(id).isA("IfcSystem")).toBe(true);

		file.redo();
		expect(() => file.byId(id)).toThrow();
	});
});
