// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_resource_time.py` (see `test/api/resource/` --
// no `test_edit_resource_time.py`), only the docstring's own worked example. This
// suite is written directly from the real source's own behavior, and pins the
// disclosed `"RemainingTime"` typo quirk (see
// `../../../src/api/resource/editResourceTime.ts`'s own header comment) and exercises
// the `api.sequence.calculateTaskDuration` wiring end to end.
//
// Local fixture helpers (`createObjective`/`createMetric`/`associateConstraint`/
// `createReference`) build the underlying `IfcRelAssociatesConstraint`/`IfcObjective`/
// `IfcMetric`/`IfcReference` entity graph directly, matching
// `test/util/constraint.test.ts`'s own established pattern for this exact same gap (no
// Python/api fixture to port a hard-constraint setup from).

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { addResourceTime } from "../../../src/api/resource/addResourceTime";
import { editResourceTime } from "../../../src/api/resource/editResourceTime";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

// --- local fixture helpers (no Python/api counterpart) ---

function associateConstraint(file: IfcFile, products: EntityInstance[], constraint: EntityInstance): EntityInstance {
	const rel = file.createEntity("IfcRelAssociatesConstraint");
	rel.set("RelatedObjects", products);
	rel.set("RelatingConstraint", constraint);
	return rel;
}

function createObjective(file: IfcFile, name: string, benchmarkValues: EntityInstance[] = []): EntityInstance {
	const objective = file.createEntity("IfcObjective");
	objective.set("Name", name);
	objective.set("ConstraintGrade", "NOTDEFINED");
	objective.set("ObjectiveQualifier", "NOTDEFINED");
	if (benchmarkValues.length > 0) objective.set("BenchmarkValues", benchmarkValues);
	return objective;
}

function createMetric(
	file: IfcFile,
	name: string,
	constraintGrade: string,
	benchmark: string,
	referencePath: EntityInstance,
): EntityInstance {
	const metric = file.createEntity("IfcMetric");
	metric.set("Name", name);
	metric.set("ConstraintGrade", constraintGrade);
	metric.set("Benchmark", benchmark);
	metric.set("ReferencePath", referencePath);
	return metric;
}

function createReference(file: IfcFile, attributeIdentifier: string): EntityInstance {
	const reference = file.createEntity("IfcReference");
	reference.set("AttributeIdentifier", attributeIdentifier);
	return reference;
}

/** Locks `"Usage." + attributeName` on `resource` with a HARD/EQUALTO metric constraint. */
function lockUsageAttribute(file: IfcFile, resource: EntityInstance, attributeName: string): void {
	const reference = createReference(file, `Usage.${attributeName}`);
	const metric = createMetric(file, "Lock", "HARD", "EQUALTO", reference);
	const objective = createObjective(file, "Locks", [metric]);
	associateConstraint(file, [resource], objective);
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.resource.editResourceTime (%s)", (schema) => {
	test("editing ScheduleWork converts a string duration and writes it", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const labour = addResource(file, { ifcClass: "IfcLaborResource" });
		const time = addResourceTime(file, { resource: labour });

		editResourceTime(file, { resourceTime: time, attributes: { ScheduleWork: "PT16H" } });

		expect(time.get("ScheduleWork")).toBe("PT16H");
	});

	test("a ScheduleWork value takes priority over an explicitly-passed ScheduleFinish", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const labour = addResource(file, { ifcClass: "IfcLaborResource" });
		const time = addResourceTime(file, { resource: labour });

		editResourceTime(file, {
			resourceTime: time,
			attributes: { ScheduleWork: "PT16H", ScheduleFinish: "2024-01-01T00:00:00" },
		});

		expect(time.get("ScheduleWork")).toBe("PT16H");
		expect(time.get("ScheduleFinish")).toBeNull();
	});

	test("a hard-constrained attribute is skipped entirely", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const labour = addResource(file, { ifcClass: "IfcLaborResource" });
		const time = addResourceTime(file, { resource: labour });
		lockUsageAttribute(file, labour, "ScheduleWork");

		editResourceTime(file, { resourceTime: time, attributes: { ScheduleWork: "PT16H" } });

		expect(time.get("ScheduleWork")).toBeNull();
	});

	// See `../../../src/api/resource/editResourceTime.ts`'s own header comment: real
	// Python literally checks `"RemainingTime"`, not the actual
	// `IfcResourceTime.RemainingWork` attribute name -- so a plain already-valid
	// `IfcDuration` string still works (no conversion needed either way), but this pin
	// exists to document/lock in the exact, disclosed quirk being ported.
	test("RemainingWork is written as a plain string, NOT run through the duration converter (disclosed quirk)", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const labour = addResource(file, { ifcClass: "IfcLaborResource" });
		const time = addResourceTime(file, { resource: labour });

		editResourceTime(file, { resourceTime: time, attributes: { RemainingWork: "P2D" } });

		expect(time.get("RemainingWork")).toBe("P2D");
	});

	// `api.sequence.calculateTaskDuration` is now wired up (was a disclosed blocker
	// until `api.sequence` landed in full -- see `TODOS.md`). `ScheduleWork` is set
	// BEFORE locking it (the lock only prevents further writes, not reads) so the
	// later `ScheduleUsage` edit's duration recalculation has a real value to read:
	// 4 days of work at 2x usage -> a 2-day task duration (matches
	// `calculateTaskDuration.ts`'s own `Math.ceil(scheduleSeconds / secondsPerWorkday
	// / scheduleUsage)`, with the default 8-hour workday since no `IfcWorkSchedule` is
	// set up here).
	test("editing ScheduleUsage under a hard ScheduleWork constraint, with an assigned task, calculates the task's duration", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const labour = addResource(file, { ifcClass: "IfcLaborResource" });
		const time = addResourceTime(file, { resource: labour });

		editResourceTime(file, { resourceTime: time, attributes: { ScheduleWork: "P4D" } });
		lockUsageAttribute(file, labour, "ScheduleWork");

		const task = file.createEntity("IfcTask");
		const assignsToProcess = file.createEntity("IfcRelAssignsToProcess");
		assignsToProcess.set("RelatedObjects", [labour]);
		assignsToProcess.set("RelatingProcess", task);

		editResourceTime(file, { resourceTime: time, attributes: { ScheduleUsage: 2.0 } });

		expect(time.get("ScheduleUsage")).toBe(2.0);
		const taskTime = task.get("TaskTime") as EntityInstance | null;
		expect(taskTime).not.toBeNull();
		expect((taskTime as EntityInstance).get("ScheduleDuration")).toBe("P2D");
	});

	test("editing ScheduleUsage with no assigned task does not throw", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const labour = addResource(file, { ifcClass: "IfcLaborResource" });
		const time = addResourceTime(file, { resource: labour });
		lockUsageAttribute(file, labour, "ScheduleWork");

		editResourceTime(file, { resourceTime: time, attributes: { ScheduleUsage: 2.0 } });

		expect(time.get("ScheduleUsage")).toBe(2.0);
	});
});
