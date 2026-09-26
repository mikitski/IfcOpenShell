// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_unassign_actor.py` (src/ifcopenshell-python)
// -- the sole real Python test method ported, plus original coverage for the
// "shrink RelatedObjects instead of removing the whole rel" branch real Python's own
// test suite never exercises for `unassign_actor` specifically (see
// `../../../src/api/owner/unassignActor.ts`'s own header comment for the shape being
// tested).

import { describe, expect, test } from "vitest";
import { assignActor } from "../../../src/api/owner/assignActor";
import { unassignActor } from "../../../src/api/owner/unassignActor";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.unassignActor (%s)", (schema) => {
	test("unassigning an actor", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const actor = file.createEntity("IfcActor");
		assignActor(file, { relatingActor: actor, relatedObject: wall });
		unassignActor(file, { relatingActor: actor, relatedObject: wall });
		expect(file.byType("IfcRelAssignsToActor").length).toBe(0);
	});

	test("unassigning one of several related objects shrinks RelatedObjects instead of removing the rel", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const actor = file.createEntity("IfcActor");
		assignActor(file, { relatingActor: actor, relatedObject: wall });
		assignActor(file, { relatingActor: actor, relatedObject: wall2 });

		unassignActor(file, { relatingActor: actor, relatedObject: wall });

		expect(file.byType("IfcRelAssignsToActor").length).toBe(1);
		const relatedObjects = (actor.get("IsActingUpon") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.map((o) => o.id())).toEqual([wall2.id()]);
	});

	test("unassigning an object that isn't assigned does nothing", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const actor = file.createEntity("IfcActor");
		unassignActor(file, { relatingActor: actor, relatedObject: wall });
		expect(file.byType("IfcRelAssignsToActor").length).toBe(0);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.unassignActor Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed IfcRelAssignsToActor; redo removes it again", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const actor = file.createEntity("IfcActor");
		const rel = assignActor(file, { relatingActor: actor, relatedObject: wall });
		const relId = rel.id();

		file.beginTransaction();
		unassignActor(file, { relatingActor: actor, relatedObject: wall });
		file.endTransaction();

		expect(() => file.byId(relId)).toThrow();

		file.undo();
		expect(file.byId(relId).isA("IfcRelAssignsToActor")).toBe(true);

		file.redo();
		expect(() => file.byId(relId)).toThrow();
	});
});
