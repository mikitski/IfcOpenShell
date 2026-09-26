// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `calculate_resource_usage.py` (see
// `test/api/resource/` -- no `test_calculate_resource_usage.py`). This suite is
// written directly from the real source's own behavior. Like
// `./calculateResourceWork.test.ts`, the resource-to-task assignment
// (`IfcRelAssignsToProcess`) is built directly rather than via the unported
// `api.sequence`, and an `IfcTaskTime` is attached to the task directly (again, no
// `api.sequence.add_task_time`-equivalent exists to reuse).

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { addResourceTime } from "../../../src/api/resource/addResourceTime";
import { calculateResourceUsage } from "../../../src/api/resource/calculateResourceUsage";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

function assignProcess(file: IfcFile, relatingProcess: EntityInstance, relatedObject: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssignsToProcess");
	rel.set("RelatedObjects", [relatedObject]);
	rel.set("RelatingProcess", relatingProcess);
	return rel;
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.resource.calculateResourceUsage (%s)", (schema) => {
	test("calculates usage from ScheduleWork and the task's WORKTIME duration (8h/day)", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const time = addResourceTime(file, { resource });
		time.set("ScheduleWork", "PT16H");

		const task = file.createEntity("IfcTask");
		const taskTime = file.createEntity("IfcTaskTime");
		taskTime.set("DurationType", "WORKTIME");
		taskTime.set("ScheduleDuration", "P1D");
		task.set("TaskTime", taskTime);
		assignProcess(file, task, resource);

		calculateResourceUsage(file, { resource });

		// 1 day WORKTIME = 8 hours; 16 hours of work / 8 hours = 2 resources required.
		expect(time.get("ScheduleUsage")).toBe(2);
	});

	test("uses 24h/day when DurationType is not WORKTIME", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const time = addResourceTime(file, { resource });
		time.set("ScheduleWork", "PT24H");

		const task = file.createEntity("IfcTask");
		const taskTime = file.createEntity("IfcTaskTime");
		taskTime.set("DurationType", "ELAPSEDTIME");
		taskTime.set("ScheduleDuration", "P1D");
		task.set("TaskTime", taskTime);
		assignProcess(file, task, resource);

		calculateResourceUsage(file, { resource });

		// 1 day ELAPSEDTIME = 24 hours; 24 hours of work / 24 hours = 1 resource required.
		expect(time.get("ScheduleUsage")).toBe(1);
	});

	test("does nothing if the resource has no Usage.ScheduleWork", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		addResourceTime(file, { resource });

		const task = file.createEntity("IfcTask");
		assignProcess(file, task, resource);

		// Should not throw.
		calculateResourceUsage(file, { resource });

		expect((resource.get("Usage") as EntityInstance).get("ScheduleUsage")).toBeNull();
	});

	test("does nothing if the assigned task has no TaskTime", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const resource = addResource(file, { ifcClass: "IfcLaborResource" });
		const time = addResourceTime(file, { resource });
		time.set("ScheduleWork", "PT16H");

		const task = file.createEntity("IfcTask");
		assignProcess(file, task, resource);

		calculateResourceUsage(file, { resource });

		expect(time.get("ScheduleUsage")).toBeNull();
	});
});
