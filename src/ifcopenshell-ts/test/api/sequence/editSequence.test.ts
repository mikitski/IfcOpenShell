// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_sequence.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). Written directly from the real
// source/docstring.

import { describe, expect, test } from "vitest";
import { addTask } from "../../../src/api/sequence/addTask";
import { addTaskTime } from "../../../src/api/sequence/addTaskTime";
import { assignSequence } from "../../../src/api/sequence/assignSequence";
import { editSequence } from "../../../src/api/sequence/editSequence";
import { editTaskTime } from "../../../src/api/sequence/editTaskTime";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.editSequence (%s)", (schema) => {
	test("editing SequenceType", () => {
		const file = createTestFile(schema);
		const zone1 = addTask(file, {});
		const zone2 = addTask(file, {});
		const sequence = assignSequence(file, { relatingProcess: zone1, relatedProcess: zone2 });
		editSequence(file, { relSequence: sequence, attributes: { SequenceType: "START_START" } });
		expect(sequence.get("SequenceType")).toBe("START_START");
	});

	test("editing an unrelated attribute does not cascade (no TaskTime, so cascade is a harmless no-op)", () => {
		const file = createTestFile(schema);
		const zone1 = addTask(file, {});
		const zone2 = addTask(file, {});
		const sequence = assignSequence(file, { relatingProcess: zone1, relatedProcess: zone2 });
		editSequence(file, { relSequence: sequence, attributes: { Name: "Zone transition" } });
		expect(sequence.get("Name")).toBe("Zone transition");
		expect(sequence.get("SequenceType")).toBe("FINISH_START");
	});

	test("editing SequenceType re-cascades the schedule from RelatedProcess with the NEW type", () => {
		const file = createTestFile(schema);
		const zone1 = addTask(file, {});
		const zone1Time = addTaskTime(file, { task: zone1 });
		editTaskTime(file, {
			taskTime: zone1Time,
			attributes: { ScheduleStart: "2000-01-01T09:00:00", ScheduleDuration: "P1D" },
		});
		const zone2 = addTask(file, {});
		const zone2Time = addTaskTime(file, { task: zone2 });
		editTaskTime(file, {
			taskTime: zone2Time,
			attributes: { ScheduleStart: "2000-01-01T09:00:00", ScheduleDuration: "P1D" },
		});

		// FINISH_START (the default): assignSequence's own cascade pushes zone2 to start
		// the day after zone1 finishes.
		const sequence = assignSequence(file, { relatingProcess: zone1, relatedProcess: zone2 });
		expect((zone2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-02T09:00:00");

		// Changing to START_START re-cascades with the NEW type: zone2 now starts
		// alongside zone1 instead.
		editSequence(file, { relSequence: sequence, attributes: { SequenceType: "START_START" } });
		expect((zone2.get("TaskTime") as EntityInstance).get("ScheduleStart")).toBe("2000-01-01T09:00:00");
	});
});
