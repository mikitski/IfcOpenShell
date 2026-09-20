// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_unassign_sequence.py` (src/ifcopenshell-python) -- real Python's own test
// class only runs against IFC4 ("sequence module features rely on entities introduced in
// IFC4 therefore no IFC2X3 tests"). This port widens coverage to IFC4X3 too, but excludes
// IFC2X3, matching this module's own established precedent for this chunk.

import { describe, expect, test } from "vitest";
import { addTask } from "../../../src/api/sequence/addTask";
import { assignSequence } from "../../../src/api/sequence/assignSequence";
import { unassignSequence } from "../../../src/api/sequence/unassignSequence";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.unassignSequence (%s)", (schema) => {
	function pair(file: ReturnType<typeof createTestFile>): [EntityInstance, EntityInstance] {
		return [addTask(file, {}), addTask(file, {})];
	}

	test("unassigning a sequence", () => {
		const file = createTestFile(schema);
		const [predecessor, successor] = pair(file);
		assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });
		unassignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });
		expect(file.byType("IfcRelSequence")).toHaveLength(0);
	});

	test("doing nothing if the tasks are not sequenced", () => {
		const file = createTestFile(schema);
		const [predecessor, successor] = pair(file);
		unassignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });
		expect(file.byType("IfcRelSequence")).toHaveLength(0);
	});

	test("unassigning every sequence between the pair by default", () => {
		const file = createTestFile(schema);
		const [predecessor, successor] = pair(file);
		for (const sequenceType of ["START_START", "FINISH_FINISH"]) {
			assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor, sequenceType });
		}
		unassignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });
		expect(file.byType("IfcRelSequence")).toHaveLength(0);
	});

	test("unassigning only the named type", () => {
		const file = createTestFile(schema);
		const [predecessor, successor] = pair(file);
		for (const sequenceType of ["START_START", "FINISH_FINISH"]) {
			assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor, sequenceType });
		}
		unassignSequence(file, { relatingProcess: predecessor, relatedProcess: successor, sequenceType: "START_START" });
		const rels = file.byType("IfcRelSequence");
		expect(rels).toHaveLength(1);
		expect(rels[0].get("SequenceType")).toBe("FINISH_FINISH");
	});

	test("not unassigning a type that is not there", () => {
		const file = createTestFile(schema);
		const [predecessor, successor] = pair(file);
		assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor, sequenceType: "START_START" });
		unassignSequence(file, { relatingProcess: predecessor, relatedProcess: successor, sequenceType: "FINISH_FINISH" });
		expect(file.byType("IfcRelSequence")).toHaveLength(1);
	});

	test("leaving the other direction alone", () => {
		const file = createTestFile(schema);
		const [task1, task2] = pair(file);
		assignSequence(file, { relatingProcess: task1, relatedProcess: task2 });
		assignSequence(file, { relatingProcess: task2, relatedProcess: task1 });
		unassignSequence(file, { relatingProcess: task1, relatedProcess: task2 });
		const rels = file.byType("IfcRelSequence");
		expect(rels).toHaveLength(1);
		expect((rels[0].get("RelatingProcess") as EntityInstance).equals(task2)).toBe(true);
	});
});
