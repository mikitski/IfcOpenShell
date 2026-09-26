// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_calculate_task_duration.py` (src/ifcopenshell-python) -- real Python's
// own test class only runs against IFC4 ("NOTE: sequence module features relies on
// entities introduced in IFC4 therefore no IFC2X3 tests"). This port widens coverage to
// IFC4X3 too (the underlying `IfcConstructionResource`/`IfcResourceTime`/`IfcTaskTime`
// classes all exist there identically), but likewise excludes IFC2X3 -- see
// `../../../src/api/sequence/calculateTaskDuration.ts`'s own header comment for exactly
// why (`IfcConstructionResource` has no `Usage` attribute at all on IFC2X3).

import { describe, expect, test } from "vitest";
import { addPset } from "../../../src/api/pset/addPset";
import { editPset } from "../../../src/api/pset/editPset";
import { addResource } from "../../../src/api/resource/addResource";
import { addResourceTime } from "../../../src/api/resource/addResourceTime";
import { createEntity } from "../../../src/api/root/createEntity";
import { addTask } from "../../../src/api/sequence/addTask";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { assignProcess } from "../../../src/api/sequence/assignProcess";
import { calculateTaskDuration } from "../../../src/api/sequence/calculateTaskDuration";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.calculateTaskDuration (%s)", (schema) => {
	test("calculating the duration based on a labour resource with work hours", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		const schedule = addWorkSchedule(file, {});
		const task = addTask(file, { workSchedule: schedule });
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const resourceTime = addResourceTime(file, { resource });
		resourceTime.set("ScheduleWork", "PT48H");
		assignProcess(file, { relatingProcess: task, relatedObject: resource });
		calculateTaskDuration(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleDuration")).toBe("P6D");
	});

	test("calculating the duration based on a labour resource with work days", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		const schedule = addWorkSchedule(file, {});
		const task = addTask(file, { workSchedule: schedule });
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const resourceTime = addResourceTime(file, { resource });
		resourceTime.set("ScheduleWork", "P3.5D");
		assignProcess(file, { relatingProcess: task, relatedObject: resource });
		calculateTaskDuration(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleDuration")).toBe("P4D");
	});

	test("calculating a task duration without a work schedule defining workday duration", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		const task = addTask(file, {});
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const resourceTime = addResourceTime(file, { resource });
		resourceTime.set("ScheduleWork", "P2D");
		assignProcess(file, { relatingProcess: task, relatedObject: resource });
		calculateTaskDuration(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleDuration")).toBe("P2D");
	});

	// Reference-parity chunk 4 of 5: `TODOS.md`'s "EntityInstance.setByIndex/
	// IfcFile.createEntity ..." gate ("fourth consequence", `api.pset` chunk) was
	// already flipped in chunk 2 of 5 -- the `editPset` call below no longer throws,
	// so this fixture (a real `Pset_WorkControlCommon.WorkDayDuration` property) now
	// builds successfully, and `calculateTaskDuration`'s own `calculateSecondsPerWorkday`
	// logic correctly reads it back. Real Python:
	// `test_calculating_a_task_duration_with_a_custom_workday_duration` -- verified
	// against this chunk's own freshly-built native addon (`ScheduleDuration ===
	// "P24D"`, matching real Python's own assertion exactly).
	test("calculating a task duration with a custom workday duration", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		const schedule = addWorkSchedule(file, {});
		const pset = addPset(file, { product: schedule, name: "Pset_WorkControlCommon" });
		editPset(file, { pset, properties: { WorkDayDuration: "PT2H" } });
		const task = addTask(file, { workSchedule: schedule });
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const resourceTime = addResourceTime(file, { resource });
		resourceTime.set("ScheduleWork", "PT48H");
		assignProcess(file, { relatingProcess: task, relatedObject: resource });
		calculateTaskDuration(file, { task });
		expect((task.get("TaskTime") as EntityInstance).get("ScheduleDuration")).toBe("P24D");
	});

	test("failing to calculate if no schedule work usage", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		const schedule = addWorkSchedule(file, {});
		const task = addTask(file, { workSchedule: schedule });
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		assignProcess(file, { relatingProcess: task, relatedObject: resource });
		calculateTaskDuration(file, { task });
		expect(task.get("TaskTime")).toBe(null);
	});

	test("calculating a nested task duration based on a labour resource with work hours", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		const schedule = addWorkSchedule(file, {});
		const task = addTask(file, { workSchedule: schedule });
		const subtask = addTask(file, { parentTask: task });
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const resourceTime = addResourceTime(file, { resource });
		resourceTime.set("ScheduleWork", "PT48H");
		assignProcess(file, { relatingProcess: subtask, relatedObject: resource });
		calculateTaskDuration(file, { task: subtask });
		expect((subtask.get("TaskTime") as EntityInstance).get("ScheduleDuration")).toBe("P6D");
	});
});
