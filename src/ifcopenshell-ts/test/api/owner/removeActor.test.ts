// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_remove_actor.py` (src/ifcopenshell-python) --
// the sole real Python test method ported.

import { describe, expect, test } from "vitest";
import { addActor } from "../../../src/api/owner/addActor";
import { removeActor } from "../../../src/api/owner/removeActor";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeActor (%s)", (schema) => {
	test("removing an actor", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const actor = addActor(file, { actor: person });
		removeActor(file, { actor });
		expect(file.byType("IfcActor").length).toBe(0);
	});

	test("removing an actor cleans up its own OwnerHistory but not TheActor", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const personId = person.id();
		const actor = addActor(file, { actor: person });
		removeActor(file, { actor });
		// `TheActor` (the wrapped person) is untouched -- only the `IfcActor` wrapper
		// itself is removed, see this file's own ported function's header comment.
		expect(file.byId(personId).isA("IfcPerson")).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeActor Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed actor; redo removes it again", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const actor = addActor(file, { actor: person });
		const actorId = actor.id();

		file.beginTransaction();
		removeActor(file, { actor });
		file.endTransaction();

		expect(() => file.byId(actorId)).toThrow();

		file.undo();
		expect(file.byId(actorId).isA("IfcActor")).toBe(true);

		file.redo();
		expect(() => file.byId(actorId)).toThrow();
	});
});
