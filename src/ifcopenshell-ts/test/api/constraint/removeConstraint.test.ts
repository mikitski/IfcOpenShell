// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/api/constraint/removeConstraint.ts` -- no real Python
// `test_remove_constraint.py` exists (confirmed by directory listing -- see
// `./editObjective.test.ts`'s header comment for the same gap), so this file's coverage
// is written directly against `remove_constraint.py`'s own source /
// `removeConstraint.ts`'s port, matching `../classification/
// removeClassification.test.ts`'s established shape for the "remove + sweep orphaned
// rels" pattern.

import { describe, expect, test } from "vitest";
import { addObjective } from "../../../src/api/constraint/addObjective";
import { assignConstraint } from "../../../src/api/constraint/assignConstraint";
import { removeConstraint } from "../../../src/api/constraint/removeConstraint";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.constraint.removeConstraint (%s)", (schema) => {
	test("removing a constraint with no associations", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});
		removeConstraint(file, { constraint: objective });
		expect(file.byType("IfcObjective").length).toBe(0);
	});

	test("removing a constraint also removes its dangling IfcRelAssociatesConstraint and OwnerHistory", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});
		const element = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element], constraint: objective });

		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(1);
		const ownerHistoryId = (file.byType("IfcRelAssociatesConstraint")[0].get("OwnerHistory") as EntityInstance).id();

		removeConstraint(file, { constraint: objective });

		expect(file.byType("IfcObjective").length).toBe(0);
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(0);
		expect(() => file.byId(ownerHistoryId)).toThrow();
	});

	test("does not remove other objectives' rels", () => {
		const file = createTestFile(schema);
		const objective1 = addObjective(file, {});
		const objective2 = addObjective(file, {});
		const element1 = createEntity(file, { ifcClass: "IfcWall" });
		const element2 = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element1], constraint: objective1 });
		assignConstraint(file, { products: [element2], constraint: objective2 });

		removeConstraint(file, { constraint: objective1 });

		expect(file.byType("IfcObjective").length).toBe(1);
		expect(file.byType("IfcRelAssociatesConstraint").length).toBe(1);
		const relatingConstraint = file.byType("IfcRelAssociatesConstraint")[0].get("RelatingConstraint") as EntityInstance;
		expect(relatingConstraint.equals(objective2)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.constraint.removeConstraint Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed objective; redo removes it again", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});
		const id = objective.id();

		file.beginTransaction();
		removeConstraint(file, { constraint: objective });
		file.endTransaction();

		expect(() => file.byId(id)).toThrow();

		file.undo();
		expect(file.byId(id).isA("IfcObjective")).toBe(true);

		file.redo();
		expect(() => file.byId(id)).toThrow();
	});

	test("undo restores the cascaded rel/owner-history cleanup", () => {
		const file = createTestFile(schema);
		const objective = addObjective(file, {});
		const element = createEntity(file, { ifcClass: "IfcWall" });
		assignConstraint(file, { products: [element], constraint: objective });
		const objectiveId = objective.id();
		const relId = file.byType("IfcRelAssociatesConstraint")[0].id();

		file.beginTransaction();
		removeConstraint(file, { constraint: objective });
		file.endTransaction();

		expect(() => file.byId(objectiveId)).toThrow();
		expect(() => file.byId(relId)).toThrow();

		file.undo();
		expect(file.byId(objectiveId).isA("IfcObjective")).toBe(true);
		expect(file.byId(relId).isA("IfcRelAssociatesConstraint")).toBe(true);

		file.redo();
		expect(() => file.byId(objectiveId)).toThrow();
		expect(() => file.byId(relId)).toThrow();
	});
});
