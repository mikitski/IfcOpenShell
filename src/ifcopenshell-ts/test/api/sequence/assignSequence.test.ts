// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_assign_sequence.py` (src/ifcopenshell-python) -- real Python's own test
// class only runs against IFC4 ("sequence module features rely on entities introduced in
// IFC4 therefore no IFC2X3 tests"). This port widens coverage to IFC4X3 too, but excludes
// IFC2X3 -- see `../../../src/api/sequence/assignSequence.ts`'s own header comment for
// why (`IfcRelSequence` exists on IFC2X3, but its own `IfcTask` shape and the general
// "no IFC2X3 tests" precedent for this module apply equally here).

import { describe, expect, test } from "vitest";
import { addTask } from "../../../src/api/sequence/addTask";
import { assignSequence } from "../../../src/api/sequence/assignSequence";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.assignSequence (%s)", (schema) => {
	test("assigning a sequence", () => {
		const file = createTestFile(schema);
		const predecessor = addTask(file, {});
		const successor = addTask(file, {});
		const rel = assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });
		expect(rel.isA("IfcRelSequence")).toBe(true);
		expect((rel.get("RelatingProcess") as EntityInstance).equals(predecessor)).toBe(true);
		expect((rel.get("RelatedProcess") as EntityInstance).equals(successor)).toBe(true);
		expect(rel.get("SequenceType")).toBe("FINISH_START");
	});

	test("assigning a sequence of a chosen type", () => {
		const file = createTestFile(schema);
		const predecessor = addTask(file, {});
		const successor = addTask(file, {});
		const rel = assignSequence(file, {
			relatingProcess: predecessor,
			relatedProcess: successor,
			sequenceType: "START_START",
		});
		expect(rel.get("SequenceType")).toBe("START_START");
	});

	test("not assigning the same sequence twice", () => {
		const file = createTestFile(schema);
		const predecessor = addTask(file, {});
		const successor = addTask(file, {});
		const rel1 = assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });
		const rel2 = assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });
		expect(rel1.equals(rel2)).toBe(true);
		expect(file.byType("IfcRelSequence")).toHaveLength(1);
	});

	test("assigning two sequences of different types to the same pair (the disclosed 'ladder' match rule)", () => {
		// A "ladder": the follower may start once the leader has started, and may not
		// finish before the leader finishes. Both constraints are real and neither
		// implies the other, so both relationships must survive.
		const file = createTestFile(schema);
		const predecessor = addTask(file, {});
		const successor = addTask(file, {});
		const start = assignSequence(file, {
			relatingProcess: predecessor,
			relatedProcess: successor,
			sequenceType: "START_START",
		});
		const finish = assignSequence(file, {
			relatingProcess: predecessor,
			relatedProcess: successor,
			sequenceType: "FINISH_FINISH",
		});
		expect(start.equals(finish)).toBe(false);
		expect(file.byType("IfcRelSequence")).toHaveLength(2);
		const types = new Set((successor.get("IsSuccessorFrom") as EntityInstance[]).map((r) => r.get("SequenceType")));
		expect(types).toEqual(new Set(["START_START", "FINISH_FINISH"]));
	});

	test("not confusing the two directions of a pair", () => {
		const file = createTestFile(schema);
		const task1 = addTask(file, {});
		const task2 = addTask(file, {});
		const forwards = assignSequence(file, { relatingProcess: task1, relatedProcess: task2 });
		const backwards = assignSequence(file, { relatingProcess: task2, relatedProcess: task1 });
		expect(forwards.equals(backwards)).toBe(false);
		expect(file.byType("IfcRelSequence")).toHaveLength(2);
	});
});
