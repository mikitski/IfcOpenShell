// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `duplicate_task.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). Coverage is written directly from
// the real source, gated across all 3 schemas via `AVAILABLE_SCHEMAS` (this file itself
// has no schema-specific branching in real Python).

import { describe, expect, test } from "vitest";
import { addPset } from "../../../src/api/pset/addPset";
import { createEntity } from "../../../src/api/root/createEntity";
import { addTask } from "../../../src/api/sequence/addTask";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { assignProcess } from "../../../src/api/sequence/assignProcess";
import { assignProduct } from "../../../src/api/sequence/assignProduct";
import { assignSequence } from "../../../src/api/sequence/assignSequence";
import { duplicateTask } from "../../../src/api/sequence/duplicateTask";
import type { EntityInstance } from "../../../src/entityInstance";
import { getPsets } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.duplicateTask (%s)", (schema) => {
	test("duplicates a task's own attributes, regenerating GlobalId", () => {
		const file = createTestFile(schema);
		const task = addTask(file, { name: "Design", description: "Draft the plans" });
		const [current, duplicate] = duplicateTask(file, { task });

		expect(current).toHaveLength(1);
		expect(duplicate).toHaveLength(1);
		expect(current[0].equals(task)).toBe(true);
		expect(duplicate[0].equals(task)).toBe(false);
		expect(duplicate[0].get("Name")).toBe("Design");
		expect(duplicate[0].get("Description")).toBe("Draft the plans");
		expect(duplicate[0].get("GlobalId")).not.toBe(task.get("GlobalId"));
	});

	test("duplicates nested subtasks and re-nests the duplicates under their own duplicate parent", () => {
		const file = createTestFile(schema);
		const parent = addTask(file, { name: "Construction" });
		const child = addTask(file, { parentTask: parent, name: "Foundations" });

		const [current, duplicate] = duplicateTask(file, { task: parent });

		expect(current.map((t) => t.get("Name"))).toEqual(["Construction", "Foundations"]);
		expect(duplicate.map((t) => t.get("Name"))).toEqual(["Construction", "Foundations"]);
		const [duplicateParent, duplicateChild] = duplicate;

		// The duplicate child is nested under the duplicate parent...
		const duplicateNests = duplicateChild.get("Nests") as EntityInstance[];
		expect(duplicateNests).toHaveLength(1);
		expect((duplicateNests[0].get("RelatingObject") as EntityInstance).equals(duplicateParent)).toBe(true);

		// ...and the ORIGINAL nest relationship still connects the originals, untouched.
		const originalNests = child.get("Nests") as EntityInstance[];
		expect(originalNests).toHaveLength(1);
		expect((originalNests[0].get("RelatingObject") as EntityInstance).equals(parent)).toBe(true);
	});

	test("duplicates property sets via a fresh, independent IfcPropertySet", () => {
		const file = createTestFile(schema);
		const task = addTask(file, { name: "Design" });
		addPset(file, { product: task, name: "Pset_Custom" });

		const [, duplicate] = duplicateTask(file, { task });

		const originalPsets = getPsets(task);
		const duplicatePsets = getPsets(duplicate[0]);
		expect(Object.keys(originalPsets)).toEqual(["Pset_Custom"]);
		expect(Object.keys(duplicatePsets)).toEqual(["Pset_Custom"]);
		// A real, independent copy -- not the same underlying rel/pset instance.
		const originalRel = [...(file.getInverse(task) as Set<EntityInstance>)].find((i) =>
			i.isA("IfcRelDefinesByProperties"),
		) as EntityInstance;
		const duplicateRel = [...(file.getInverse(duplicate[0]) as Set<EntityInstance>)].find((i) =>
			i.isA("IfcRelDefinesByProperties"),
		) as EntityInstance;
		expect(originalRel.equals(duplicateRel)).toBe(false);
	});

	test("duplicating a sequenced pair of nested subtasks re-creates the sequence between the duplicates", () => {
		const file = createTestFile(schema);
		const parent = addTask(file, { name: "Construction" });
		const predecessor = addTask(file, { parentTask: parent, name: "Formwork" });
		const successor = addTask(file, { parentTask: parent, name: "Reinforcement" });
		assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor, sequenceType: "START_START" });

		const [current, duplicate] = duplicateTask(file, { task: parent });
		const duplicatePredecessor = duplicate[current.findIndex((t) => t.equals(predecessor))];
		const duplicateSuccessor = duplicate[current.findIndex((t) => t.equals(successor))];

		const duplicateIsPredecessorTo = duplicatePredecessor.get("IsPredecessorTo") as EntityInstance[];
		expect(duplicateIsPredecessorTo).toHaveLength(1);
		expect((duplicateIsPredecessorTo[0].get("RelatedProcess") as EntityInstance).equals(duplicateSuccessor)).toBe(true);
		expect(duplicateIsPredecessorTo[0].get("SequenceType")).toBe("START_START");

		// The original sequence relationship still connects the originals, untouched.
		const originalIsPredecessorTo = predecessor.get("IsPredecessorTo") as EntityInstance[];
		expect(originalIsPredecessorTo).toHaveLength(1);
		expect((originalIsPredecessorTo[0].get("RelatedProcess") as EntityInstance).equals(successor)).toBe(true);
	});

	test("duplicating one side of a sequence whose other side is NOT part of the batch keeps the untouched side as-is", () => {
		const file = createTestFile(schema);
		const task = addTask(file, { name: "Formwork" });
		const externalSuccessor = addTask(file, { name: "Reinforcement" });
		assignSequence(file, { relatingProcess: task, relatedProcess: externalSuccessor });

		const [, duplicate] = duplicateTask(file, { task });
		const duplicateIsPredecessorTo = duplicate[0].get("IsPredecessorTo") as EntityInstance[];
		expect(duplicateIsPredecessorTo).toHaveLength(1);
		// "thus the related process is not part of the duplicated tasks" -- the ORIGINAL
		// external task is reused directly, not a duplicate of it.
		expect((duplicateIsPredecessorTo[0].get("RelatedProcess") as EntityInstance).equals(externalSuccessor)).toBe(true);
	});

	test("does NOT connect a duplicated root task to its own work schedule (docstring over-claims this -- see header comment)", () => {
		const file = createTestFile(schema);
		const workSchedule = addWorkSchedule(file, {});
		const task = addTask(file, { workSchedule, name: "Design" });
		expect(file.byType("IfcRelAssignsToControl")).toHaveLength(1);

		duplicateTask(file, { task });

		// Still exactly one -- the duplicate is NOT auto-assigned to the schedule.
		expect(file.byType("IfcRelAssignsToControl")).toHaveLength(1);
	});

	test("single-valued-attribute match: clones the referencing relationship and redirects just that attribute", () => {
		const file = createTestFile(schema);
		const task = addTask(file, { name: "Design" });
		const product = createEntity(file, { ifcClass: "IfcWall" });
		const originalRel = assignProcess(file, { relatingProcess: task, relatedObject: product }) as EntityInstance;

		const [, duplicate] = duplicateTask(file, { task });

		const rels = file.byType("IfcRelAssignsToProcess");
		expect(rels).toHaveLength(2);
		const newRel = rels.find((r) => !r.equals(originalRel)) as EntityInstance;
		expect((newRel.get("RelatingProcess") as EntityInstance).equals(duplicate[0])).toBe(true);
		expect((newRel.get("RelatedObjects") as EntityInstance[])[0].equals(product)).toBe(true);
		// The ORIGINAL relationship is untouched.
		expect((originalRel.get("RelatingProcess") as EntityInstance).equals(task)).toBe(true);
	});

	test("list-valued-attribute match: appends the duplicate into the SAME existing list on the original relationship", () => {
		const file = createTestFile(schema);
		const task = addTask(file, { name: "Design" });
		const product = createEntity(file, { ifcClass: "IfcWall" });
		const rel = assignProduct(file, { relatingProduct: product, relatedObject: task });

		const [, duplicate] = duplicateTask(file, { task });

		// No new relationship was created -- the SAME rel now lists both.
		expect(file.byType("IfcRelAssignsToProduct")).toHaveLength(1);
		const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects).toHaveLength(2);
		expect(relatedObjects[0].equals(task)).toBe(true);
		expect(relatedObjects[1].equals(duplicate[0])).toBe(true);
	});
});
