// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_edit_actor.py` (src/ifcopenshell-python) --
// both real Python test methods ported.

import { describe, expect, test } from "vitest";
import { addActor } from "../../../src/api/owner/addActor";
import { editActor } from "../../../src/api/owner/editActor";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.editActor (%s)", (schema) => {
	test("editing an actor", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const actor = addActor(file, { ifcClass: "IfcActor", actor: person });
		editActor(file, {
			actor,
			attributes: { Name: "Name", Description: "Description", ObjectType: "ObjectType" },
		});
		expect(actor.get("Name")).toBe("Name");
		expect(actor.get("Description")).toBe("Description");
		expect(actor.get("ObjectType")).toBe("ObjectType");
	});

	test("editing an occupant", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const actor = addActor(file, { ifcClass: "IfcOccupant", actor: person });
		editActor(file, {
			actor,
			attributes: {
				Name: "Name",
				Description: "Description",
				ObjectType: "ObjectType",
				PredefinedType: "TENANT",
			},
		});
		expect(actor.get("Name")).toBe("Name");
		expect(actor.get("Description")).toBe("Description");
		expect(actor.get("ObjectType")).toBe("ObjectType");
		expect(actor.get("PredefinedType")).toBe("TENANT");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.editActor Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous Name; redo re-applies the edit", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const actor = addActor(file, { actor: person });
		actor.set("Name", "Before");

		file.beginTransaction();
		editActor(file, { actor, attributes: { Name: "After" } });
		file.endTransaction();

		expect(actor.get("Name")).toBe("After");

		file.undo();
		expect(actor.get("Name")).toBe("Before");

		file.redo();
		expect(actor.get("Name")).toBe("After");
	});
});
