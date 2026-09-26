// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_add_role.py` (src/ifcopenshell-python) --
// both real Python test methods ported.

import { describe, expect, test } from "vitest";
import { addRole } from "../../../src/api/owner/addRole";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.addRole (%s)", (schema) => {
	test("adding a role to a person", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const role = addRole(file, { assignedObject: person });
		expect(role.isA("IfcActorRole")).toBe(true);
		expect(role.get("Role")).toBe("ARCHITECT");
		const roles = person.get("Roles") as EntityInstance[];
		expect(roles.map((r) => r.id())).toEqual([role.id()]);
	});

	test("adding a role to an organisation", () => {
		const file = createTestFile(schema);
		const organisation = file.createEntity("IfcOrganization");
		const role = addRole(file, { assignedObject: organisation });
		expect(role.isA("IfcActorRole")).toBe(true);
		expect(role.get("Role")).toBe("ARCHITECT");
		const roles = organisation.get("Roles") as EntityInstance[];
		expect(roles.map((r) => r.id())).toEqual([role.id()]);
	});

	test("a custom built-in role is set directly", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const role = addRole(file, { assignedObject: person, role: "ENGINEER" });
		expect(role.get("Role")).toBe("ENGINEER");
		expect(role.get("UserDefinedRole")).toBeNull();
	});

	test("a custom non-enum role falls back to USERDEFINED", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const role = addRole(file, { assignedObject: person, role: "Ballpen Wrangler" });
		expect(role.get("Role")).toBe("USERDEFINED");
		expect(role.get("UserDefinedRole")).toBe("Ballpen Wrangler");
	});

	test("appends to existing roles rather than replacing them", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const first = addRole(file, { assignedObject: person, role: "ARCHITECT" });
		const second = addRole(file, { assignedObject: person, role: "ENGINEER" });
		const roles = person.get("Roles") as EntityInstance[];
		expect(roles.map((r) => r.id())).toEqual([first.id(), second.id()]);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.addRole Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcActorRole and un-assigns it; redo recreates both", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");

		file.beginTransaction();
		const role = addRole(file, { assignedObject: person, role: "ARCHITECT" });
		file.endTransaction();
		const roleId = role.id();

		expect((person.get("Roles") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect(() => file.byId(roleId)).toThrow();
		expect(person.get("Roles")).toBeNull();

		file.redo();
		expect(file.byId(roleId).isA("IfcActorRole")).toBe(true);
		expect((person.get("Roles") as EntityInstance[]).length).toBe(1);
	});
});
