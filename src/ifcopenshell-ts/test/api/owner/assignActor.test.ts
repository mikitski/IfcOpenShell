// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_assign_actor.py` (src/ifcopenshell-python) --
// both real Python test methods ported (the first, `test_assigning_an_actor`, doubles
// as coverage for `./assignActor.ts`'s own disclosed quirk: a single `IfcActor`
// accumulates related objects onto the SAME `IfcRelAssignsToActor` rel across separate
// calls, rather than one rel per call).

import { describe, expect, test } from "vitest";
import { assignActor } from "../../../src/api/owner/assignActor";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.assignActor (%s)", (schema) => {
	test("assigning an actor -- growing the same rel across calls", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const actor = file.createEntity("IfcActor");

		assignActor(file, { relatingActor: actor, relatedObject: wall });
		let isActingUpon = actor.get("IsActingUpon") as EntityInstance[];
		expect(isActingUpon.length).toBe(1);
		let relatedObjects = isActingUpon[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.map((o) => o.id())).toEqual([wall.id()]);

		assignActor(file, { relatingActor: actor, relatedObject: wall2 });
		isActingUpon = actor.get("IsActingUpon") as EntityInstance[];
		expect(isActingUpon.length).toBe(1);
		relatedObjects = isActingUpon[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.map((o) => o.id())).toEqual([wall.id(), wall2.id()]);
	});

	test("not assigning twice", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const actor = file.createEntity("IfcActor");

		assignActor(file, { relatingActor: actor, relatedObject: wall });
		assignActor(file, { relatingActor: actor, relatedObject: wall });

		const isActingUpon = actor.get("IsActingUpon") as EntityInstance[];
		expect(isActingUpon.length).toBe(1);
		const relatedObjects = isActingUpon[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.map((o) => o.id())).toEqual([wall.id()]);
	});

	test("returns the existing rel, unmodified, on dedup", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const actor = file.createEntity("IfcActor");

		const rel1 = assignActor(file, { relatingActor: actor, relatedObject: wall });
		const rel2 = assignActor(file, { relatingActor: actor, relatedObject: wall });
		expect(rel1.equals(rel2)).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.assignActor Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcRelAssignsToActor; redo recreates it", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const actor = file.createEntity("IfcActor");

		file.beginTransaction();
		const rel = assignActor(file, { relatingActor: actor, relatedObject: wall });
		file.endTransaction();
		const relId = rel.id();

		expect(file.byType("IfcRelAssignsToActor").length).toBe(1);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect(file.byType("IfcRelAssignsToActor").length).toBe(0);

		file.redo();
		expect(file.byId(relId).isA("IfcRelAssignsToActor")).toBe(true);
	});

	test("undo shrinks RelatedObjects back down when growing an existing rel; redo re-grows it", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const wall2 = file.createEntity("IfcWall");
		const actor = file.createEntity("IfcActor");
		assignActor(file, { relatingActor: actor, relatedObject: wall });

		file.beginTransaction();
		assignActor(file, { relatingActor: actor, relatedObject: wall2 });
		file.endTransaction();

		let relatedObjects = (actor.get("IsActingUpon") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(2);

		file.undo();
		relatedObjects = (actor.get("IsActingUpon") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(1);

		file.redo();
		relatedObjects = (actor.get("IsActingUpon") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.length).toBe(2);
	});
});
