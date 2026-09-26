// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_add_actor.py` (src/ifcopenshell-python) --
// both real Python test methods ported (run against IFC4/IFC2X3 there via multiple
// inheritance; `describe.each(AVAILABLE_SCHEMAS)` below covers all 3 schemas this port
// builds).

import { describe, expect, test } from "vitest";
import { addActor } from "../../../src/api/owner/addActor";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.addActor (%s)", (schema) => {
	test("adding an actor", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const actor = addActor(file, { ifcClass: "IfcActor", actor: person });
		expect(actor.isA()).toBe("IfcActor");
		expect((actor.get("TheActor") as EntityInstance).equals(person)).toBe(true);
	});

	test("adding an occupant", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const actor = addActor(file, { ifcClass: "IfcOccupant", actor: person });
		expect(actor.isA()).toBe("IfcOccupant");
		expect((actor.get("TheActor") as EntityInstance).equals(person)).toBe(true);
	});

	test("defaults to IfcActor when ifcClass is omitted", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const actor = addActor(file, { actor: person });
		expect(actor.isA()).toBe("IfcActor");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.addActor Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcActor; redo recreates it", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");

		file.beginTransaction();
		const actor = addActor(file, { actor: person });
		file.endTransaction();
		const actorId = actor.id();

		expect(file.byType("IfcActor").length).toBe(1);

		file.undo();
		expect(() => file.byId(actorId)).toThrow();
		expect(file.byType("IfcActor").length).toBe(0);

		file.redo();
		expect(file.byId(actorId).isA("IfcActor")).toBe(true);
		expect((file.byId(actorId).get("TheActor") as EntityInstance).equals(person)).toBe(true);
	});
});
