// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `unassign_lag_time.py` (confirmed by listing
// `test/api/sequence/` in src/ifcopenshell-python). Written directly from the real
// source/docstring. Uses a bare, manually-constructed `IfcRelSequence`/`IfcLagTime` pair
// (via `file.createEntity`, not `assignSequence`/`assignLagTime`) since `assignLagTime`
// itself is fully blocked by the already-tracked `TODOS.md` primitive-layer gap (see
// `../../../src/api/sequence/assignLagTime.ts`'s own header comment) -- this function's
// own logic (delete-if-sole-reference vs. null-out-if-shared) doesn't actually need a
// POPULATED `LagValue` to exercise, only a real `IfcLagTime` entity to reference.

import { describe, expect, test } from "vitest";
import { unassignLagTime } from "../../../src/api/sequence/unassignLagTime";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.sequence.unassignLagTime (%s)", (schema) => {
	test("deletes the IfcLagTime entirely when it's the sole reference", () => {
		const file = createTestFile(schema);
		const predecessor = file.createEntity("IfcTask");
		const successor = file.createEntity("IfcTask");
		const lagTime = file.createEntity("IfcLagTime");
		const relSequence = file.createEntity(
			"IfcRelSequence",
			null,
			null,
			null,
			null,
			predecessor,
			successor,
			lagTime,
			"FINISH_START",
		);

		unassignLagTime(file, { relSequence });

		expect(file.byType("IfcLagTime")).toHaveLength(0);
		expect(relSequence.get("TimeLag")).toBe(null);
	});

	test("throws when there is no TimeLag to unassign (no truthiness guard, matching real Python)", () => {
		const file = createTestFile(schema);
		const predecessor = file.createEntity("IfcTask");
		const successor = file.createEntity("IfcTask");
		const relSequence = file.createEntity(
			"IfcRelSequence",
			null,
			null,
			null,
			null,
			predecessor,
			successor,
			null,
			"FINISH_START",
		);
		expect(() => unassignLagTime(file, { relSequence })).toThrow();
	});
});
