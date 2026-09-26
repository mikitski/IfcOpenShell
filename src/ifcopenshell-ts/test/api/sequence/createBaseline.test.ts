// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_create_baseline.py` (src/ifcopenshell-python) -- real Python's own test
// class is IFC4-only (no IFC2X3/IFC4X3 subclasses, unlike most of this module's other
// test files). This port widens coverage to IFC4X3 too (confirmed against
// `ifc4x3.d.ts`: `IfcWorkSchedule.PredefinedType` has an identical shape to IFC4), but
// excludes IFC2X3 for the same reason real Python does -- see
// `../../../src/api/sequence/createBaseline.ts`'s own header comment: IFC2X3 has no
// `PredefinedType` attribute on `IfcWorkSchedule` at all, so this function throws an
// EARLIER, DIFFERENT error there than the documented `ValueError`, pinned in a
// dedicated IFC2X3-only block below rather than silently excluded.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addTask } from "../../../src/api/sequence/addTask";
import { addTaskTime } from "../../../src/api/sequence/addTaskTime";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { assignSequence } from "../../../src/api/sequence/assignSequence";
import { createBaseline } from "../../../src/api/sequence/createBaseline";
import { editTaskTime } from "../../../src/api/sequence/editTaskTime";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getNestedTasks, getRootTasks } from "../../../src/util/sequence";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function createPlannedSchedule(file: IfcFile, name = "Design & Build"): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	return addWorkSchedule(file, { name, predefinedType: "PLANNED" });
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.createBaseline (%s)", (schema) => {
	test("returns the created baseline schedule", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);
		const rootTask = addTask(file, { workSchedule: planned, name: "Design" });

		const baseline = createBaseline(file, { workSchedule: planned, name: "Baseline 1" });

		expect(baseline.isA("IfcWorkSchedule")).toBe(true);
		expect(baseline.get("Name")).toBe("Baseline 1");
		expect(baseline.get("PredefinedType")).toBe("BASELINE");
		const baselineRoots = getRootTasks(baseline);
		expect(baselineRoots.map((t) => t.get("Name"))).toEqual([rootTask.get("Name")]);
		expect(baselineRoots.some((t) => t.equals(rootTask))).toBe(false);
	});

	test("falls back to the planned schedule name", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);

		const baseline = createBaseline(file, { workSchedule: planned });

		expect(baseline.get("Name")).toBe("Design & Build");
	});

	test("leaves the name null when both names are omitted", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);
		planned.set("Name", null);

		const baseline = createBaseline(file, { workSchedule: planned });

		expect(baseline.get("Name")).toBeNull();
	});

	test("rejects a non-planned schedule", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		const actual = addWorkSchedule(file, { predefinedType: "ACTUAL" });

		expect(() => createBaseline(file, { workSchedule: actual })).toThrow(
			"Only a PLANNED work schedule can be baselined.",
		);
	});

	test("baselines a schedule without tasks", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);

		const baseline = createBaseline(file, { workSchedule: planned, name: "Baseline 1" });

		expect(getRootTasks(baseline)).toEqual([]);
	});

	test("baselines every root task", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);
		addTask(file, { workSchedule: planned, name: "Design" });
		addTask(file, { workSchedule: planned, name: "Construction" });

		const baseline = createBaseline(file, { workSchedule: planned, name: "Baseline 1" });

		const baselineRoots = getRootTasks(baseline);
		expect(baselineRoots.map((t) => t.get("Name") as string).sort()).toEqual(["Construction", "Design"]);
	});

	test("baselines nested tasks", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);
		const rootTask = addTask(file, { workSchedule: planned, name: "Construction" });
		addTask(file, { parentTask: rootTask, name: "Foundations" });
		addTask(file, { parentTask: rootTask, name: "Superstructure" });

		const baseline = createBaseline(file, { workSchedule: planned, name: "Baseline 1" });

		const baselineRoot = getRootTasks(baseline)[0];
		const nested = getNestedTasks(baselineRoot);
		expect(nested.map((t) => t.get("Name") as string).sort()).toEqual(["Foundations", "Superstructure"]);
		expect(file.byType("IfcTask")).toHaveLength(6);
	});

	test("baselines task attributes and times", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);
		const task = addTask(file, {
			workSchedule: planned,
			name: "Foundations",
			identification: "A1",
			description: "Pour concrete",
		});
		addTaskTime(file, { task });
		editTaskTime(file, { taskTime: task.get("TaskTime") as EntityInstance, attributes: { ScheduleDuration: "P5D" } });

		const baseline = createBaseline(file, { workSchedule: planned, name: "Baseline 1" });

		const baselineTask = getRootTasks(baseline)[0];
		expect(baselineTask.get("Identification")).toBe("A1");
		expect(baselineTask.get("Description")).toBe("Pour concrete");
		expect((baselineTask.get("TaskTime") as EntityInstance).equals(task.get("TaskTime") as EntityInstance)).toBe(false);
		expect((baselineTask.get("TaskTime") as EntityInstance).get("ScheduleDuration")).toBe("P5D");
	});

	test("baselines sequence relationships between tasks", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);
		const rootTask = addTask(file, { workSchedule: planned, name: "Construction" });
		const predecessor = addTask(file, { parentTask: rootTask, name: "Foundations" });
		const successor = addTask(file, { parentTask: rootTask, name: "Superstructure" });
		assignSequence(file, { relatingProcess: predecessor, relatedProcess: successor });

		const baseline = createBaseline(file, { workSchedule: planned, name: "Baseline 1" });

		const baselineRoot = getRootTasks(baseline)[0];
		const nested = new Map(getNestedTasks(baselineRoot).map((t) => [t.get("Name") as string, t]));
		const rels = (nested.get("Foundations") as EntityInstance).get("IsPredecessorTo") as EntityInstance[];
		expect(rels).toHaveLength(1);
		expect(
			(rels[0].get("RelatedProcess") as EntityInstance).equals(nested.get("Superstructure") as EntityInstance),
		).toBe(true);
	});

	test("references the planned schedule and tasks", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);
		const rootTask = addTask(file, { workSchedule: planned, name: "Construction" });
		const subtask = addTask(file, { parentTask: rootTask, name: "Foundations" });

		const baseline = createBaseline(file, { workSchedule: planned, name: "Baseline 1" });

		const baselineRoot = getRootTasks(baseline)[0];
		const baselineSubtask = getNestedTasks(baselineRoot)[0];
		const references = new Map<EntityInstance, EntityInstance[]>();
		for (const rel of file.byType("IfcRelDefinesByObject")) {
			references.set(rel.get("RelatingObject") as EntityInstance, [...(rel.get("RelatedObjects") as EntityInstance[])]);
		}
		const findRefs = (key: EntityInstance): EntityInstance[] | undefined => {
			for (const [k, v] of references) if (k.equals(key)) return v;
			return undefined;
		};
		expect(findRefs(planned)?.map((e) => e.id())).toEqual([baseline.id()]);
		expect(findRefs(rootTask)?.map((e) => e.id())).toEqual([baselineRoot.id()]);
		expect(findRefs(subtask)?.map((e) => e.id())).toEqual([baselineSubtask.id()]);
	});

	test("reuses the existing reference for further baselines", () => {
		const file = createTestFile(schema);
		const planned = createPlannedSchedule(file);

		const first = createBaseline(file, { workSchedule: planned, name: "Baseline 1" });
		const second = createBaseline(file, { workSchedule: planned, name: "Baseline 2" });

		const declares = planned.get("Declares") as EntityInstance[];
		expect(declares).toHaveLength(1);
		const relatedObjects = declares[0].get("RelatedObjects") as EntityInstance[];
		expect(relatedObjects.map((e) => e.id())).toEqual([first.id(), second.id()]);
	});
});

// --- IFC2X3: `IfcWorkSchedule.PredefinedType` doesn't exist at all -- an EARLIER,
//     DIFFERENT throw than the documented `ValueError`, reached before it would even
//     matter (see `createBaseline.ts`'s own header comment) ---
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.sequence.createBaseline (IFC2X3)", () => {
	test("throws on an undeclared attribute read, not the documented ValueError", () => {
		const file = createTestFile("IFC2X3");
		createEntity(file, { ifcClass: "IfcProject" });
		const workSchedule = addWorkSchedule(file, {});
		expect(() => createBaseline(file, { workSchedule })).toThrow(/has no attribute 'PredefinedType'/);
	});
});
