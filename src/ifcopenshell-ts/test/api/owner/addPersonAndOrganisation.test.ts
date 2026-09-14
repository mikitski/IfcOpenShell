// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_add_person_and_organisation.py` (src/
// ifcopenshell-python) -- the sole real Python test method ported (`test_adding`, run
// against IFC4/IFC2X3 there via multiple inheritance).

import { describe, expect, test } from "vitest";
import { addPersonAndOrganisation } from "../../../src/api/owner/addPersonAndOrganisation";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.addPersonAndOrganisation (%s)", (schema) => {
	test("adding", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const organisation = file.createEntity("IfcOrganization");
		const user = addPersonAndOrganisation(file, { person, organisation });
		expect(user.isA("IfcPersonAndOrganization")).toBe(true);
		expect((user.get("ThePerson") as typeof person).equals(person)).toBe(true);
		expect((user.get("TheOrganization") as typeof organisation).equals(organisation)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.addPersonAndOrganisation Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcPersonAndOrganization; redo recreates it", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const organisation = file.createEntity("IfcOrganization");

		file.beginTransaction();
		const user = addPersonAndOrganisation(file, { person, organisation });
		file.endTransaction();
		const userId = user.id();

		file.undo();
		expect(() => file.byId(userId)).toThrow();

		file.redo();
		expect(file.byId(userId).isA("IfcPersonAndOrganization")).toBe(true);
		expect((file.byId(userId).get("ThePerson") as typeof person).equals(person)).toBe(true);
	});
});
