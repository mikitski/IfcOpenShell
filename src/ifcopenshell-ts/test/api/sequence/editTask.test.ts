// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_task.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python), so this coverage is written directly
// from the real source/docstring.

import { describe, expect, test } from "vitest";
import { addTask } from "../../../src/api/sequence/addTask";
import { editTask } from "../../../src/api/sequence/editTask";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.sequence.editTask (%s)", (schema) => {
	test("edits a plain attribute present on every schema", () => {
		const file = createTestFile(schema);
		const task = addTask(file, { name: "Milestones" });
		editTask(file, { task, attributes: { Name: "Renamed" } });
		expect(task.get("Name")).toBe("Renamed");
	});

	test("edits multiple attributes at once", () => {
		const file = createTestFile(schema);
		const task = addTask(file, {});
		editTask(file, { task, attributes: { Name: "A", Description: "B" } });
		expect(task.get("Name")).toBe("A");
		expect(task.get("Description")).toBe("B");
	});

	// `IfcTask.Identification` is IFC4+-only (IFC2X3 has `TaskId` instead) -- see
	// `../../../src/api/sequence/addTask.ts`'s own header comment.
	test.skipIf(schema === "IFC2X3")("edits Identification (IFC4+ only)", () => {
		const file = createTestFile(schema);
		const task = addTask(file, {});
		editTask(file, { task, attributes: { Identification: "M" } });
		expect(task.get("Identification")).toBe("M");
	});

	test.runIf(schema === "IFC2X3")("edits TaskId (IFC2X3 only)", () => {
		const file = createTestFile(schema);
		const task = addTask(file, {});
		editTask(file, { task, attributes: { TaskId: "M" } });
		expect(task.get("TaskId")).toBe("M");
	});
});
