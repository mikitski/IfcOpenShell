// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_structural_boundary_condition.py`
// (confirmed: no `test_remove_structural_boundary_condition.py` under
// `test/api/structural/`). This suite is written directly from the real source's own
// behavior/docstring.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addStructuralBoundaryCondition } from "../../../src/api/structural/addStructuralBoundaryCondition";
import { removeStructuralBoundaryCondition } from "../../../src/api/structural/removeStructuralBoundaryCondition";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.removeStructuralBoundaryCondition (%s)", (schema) => {
	test("removing a condition from a connection (sole reference) purges it", () => {
		const file = createTestFile(schema);
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });
		const condition = addStructuralBoundaryCondition(file, { connection });

		removeStructuralBoundaryCondition(file, { connection });

		expect(connection.get("AppliedCondition")).toBeNull();
		expect(file.byType("IfcBoundaryNodeCondition").length).toBe(0);
		expect(() => file.byId(condition.id())).toThrow();
	});

	test("calling with a connection that has no condition is a no-op", () => {
		const file = createTestFile(schema);
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });

		expect(() => removeStructuralBoundaryCondition(file, { connection })).not.toThrow();
	});

	test("removing an orphaned boundary condition directly clears every real inverse's AppliedCondition", () => {
		const file = createTestFile(schema);
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });
		const condition = addStructuralBoundaryCondition(file, { connection });

		removeStructuralBoundaryCondition(file, { boundaryCondition: condition });

		expect(connection.get("AppliedCondition")).toBeNull();
		expect(() => file.byId(condition.id())).toThrow();
	});

	test("calling with neither connection nor boundaryCondition throws (Python: assert)", () => {
		const file = createTestFile(schema);
		expect(() => removeStructuralBoundaryCondition(file, {})).toThrow(
			"Either connection or boundary_condition must be provided.",
		);
	});
});
