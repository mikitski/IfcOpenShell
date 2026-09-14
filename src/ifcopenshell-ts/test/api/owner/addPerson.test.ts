// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_add_person.py` (src/ifcopenshell-python) --
// the sole real Python test method ported (`test_adding_a_person`, run against both
// IFC4 and IFC2X3 there via multiple inheritance; `describe.each(AVAILABLE_SCHEMAS)`
// below covers all 3 schemas this port builds).

import { describe, expect, test } from "vitest";
import { addPerson } from "../../../src/api/owner/addPerson";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.addPerson (%s)", (schema) => {
	test("adding a person", () => {
		const file = createTestFile(schema);
		const person = addPerson(file, {
			identification: "Identification",
			familyName: "FamilyName",
			givenName: "GivenName",
		});
		// 0: Identification (IFC4+) / Id (IFC2X3) -- same position in both.
		expect(person.getByIndex(0)).toBe("Identification");
		expect(person.get("FamilyName")).toBe("FamilyName");
		expect(person.get("GivenName")).toBe("GivenName");
	});

	test("adding a person with defaults", () => {
		const file = createTestFile(schema);
		const person = addPerson(file);
		expect(person.getByIndex(0)).toBe("HSeldon");
		expect(person.get("FamilyName")).toBe("Seldon");
		expect(person.get("GivenName")).toBe("Hari");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.addPerson Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcPerson; redo recreates it", () => {
		const file = createTestFile(schema);
		// `createTestFile`'s template pre-populates a default `IfcPerson` (see
		// `stripProjectBootstrap`'s own doc comment in `../../bootstrap.ts`) -- stripped
		// here so the `.length` assertions below reflect only this test's own person.
		stripProjectBootstrap(file);

		file.beginTransaction();
		const person = addPerson(file, { identification: "bobthebuilder", familyName: "Thebuilder", givenName: "Bob" });
		file.endTransaction();
		const personId = person.id();

		expect(file.byType("IfcPerson").length).toBe(1);

		file.undo();
		expect(() => file.byId(personId)).toThrow();
		expect(file.byType("IfcPerson").length).toBe(0);

		file.redo();
		expect(file.byId(personId).isA("IfcPerson")).toBe(true);
		expect(file.byId(personId).get("GivenName")).toBe("Bob");
	});
});
