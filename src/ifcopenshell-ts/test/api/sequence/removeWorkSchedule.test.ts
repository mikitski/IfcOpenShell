// This file was generated with the assistance of an AI coding tool.
//
// Port of `test_remove_work_schedule.py` (src/ifcopenshell-python) -- real Python's own
// test class runs against IFC4 and IFC4X3 ("sequence module features relies on entities
// introduced in IFC4 therefore no IFC2X3 tests"), matched here via
// `AVAILABLE_SCHEMAS.filter(...)`.

import { describe, expect, test } from "vitest";
import { addTask } from "../../../src/api/sequence/addTask";
import { addWorkPlan } from "../../../src/api/sequence/addWorkPlan";
import { addWorkSchedule } from "../../../src/api/sequence/addWorkSchedule";
import { assignWorkPlan } from "../../../src/api/sequence/assignWorkPlan";
import { removeWorkSchedule } from "../../../src/api/sequence/removeWorkSchedule";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function declaredObjects(file: IfcFile): Set<EntityInstance> {
	const project = file.byType("IfcProject")[0];
	const declared = new Set<EntityInstance>();
	for (const rel of (project.get("Declares") as EntityInstance[] | null) ?? []) {
		for (const obj of rel.get("RelatedDefinitions") as EntityInstance[]) {
			declared.add(obj);
		}
	}
	return declared;
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.removeWorkSchedule (%s)", (schema) => {
	test("removing a work schedule and its subschedules, unassigning from its work plan and project", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const workSchedule = addWorkSchedule(file, {});

		const workPlan = addWorkPlan(file, {});
		assignWorkPlan(file, { workSchedule, workPlan });

		const workSchedule1 = addWorkSchedule(file, {});
		const rel = file.createEntity("IfcRelDefinesByObject");
		rel.set("RelatingObject", workSchedule);
		rel.set("RelatedObjects", [workSchedule1]);

		addTask(file, { workSchedule });

		removeWorkSchedule(file, { workSchedule });
		// Remove work schedule and subschedules.
		expect(file.byType("IfcWorkSchedule")).toHaveLength(0);
		expect(file.byType("IfcRelDefinesByObject")).toHaveLength(0);
		// Unassign from a work plan.
		expect(file.byType("IfcRelAggregates")).toHaveLength(0);
		// Remove related IfcTasks.
		expect(file.byType("IfcTask")).toHaveLength(0);
		expect(file.byType("IfcRelAssignsToControl")).toHaveLength(0);
		// Unassign from a project.
		const declared = declaredObjects(file);
		expect(declared.size).toBe(1);
		expect([...declared][0].equals(workPlan)).toBe(true);
	});
});
