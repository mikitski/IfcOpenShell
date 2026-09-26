// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_structural_boundary_condition.py` (confirmed:
// no `test_add_structural_boundary_condition.py` under `test/api/structural/`). This
// suite is written directly from the real source's own behavior/docstring, including
// the point/curve/surface -> node/edge/face dispatch and the unreachable `assert
// False` branch (ported as a thrown `Error`, see `../../../src/api/structural/
// addStructuralBoundaryCondition.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { addStructuralBoundaryCondition } from "../../../src/api/structural/addStructuralBoundaryCondition";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.addStructuralBoundaryCondition (%s)", (schema) => {
	test("an orphaned condition defaults to IfcBoundaryNodeCondition", () => {
		const file = createTestFile(schema);

		const condition = addStructuralBoundaryCondition(file, { name: "Fixed" });

		expect(condition.isA("IfcBoundaryNodeCondition")).toBe(true);
		expect(condition.get("Name")).toBe("Fixed");
	});

	test("an orphaned condition honours a custom ifcClass", () => {
		const file = createTestFile(schema);

		const condition = addStructuralBoundaryCondition(file, { ifcClass: "IfcBoundaryEdgeCondition" });

		expect(condition.isA("IfcBoundaryEdgeCondition")).toBe(true);
	});

	test("a point connection gets a node condition", () => {
		const file = createTestFile(schema);
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });

		const condition = addStructuralBoundaryCondition(file, { connection });

		expect(condition.isA("IfcBoundaryNodeCondition")).toBe(true);
		expect((connection.get("AppliedCondition") as EntityInstance).equals(condition)).toBe(true);
	});

	test("a curve connection gets an edge condition", () => {
		const file = createTestFile(schema);
		const connection = createEntity(file, { ifcClass: "IfcStructuralCurveConnection" });

		const condition = addStructuralBoundaryCondition(file, { connection });

		expect(condition.isA("IfcBoundaryEdgeCondition")).toBe(true);
	});

	test("a surface connection gets a face condition", () => {
		const file = createTestFile(schema);
		const connection = createEntity(file, { ifcClass: "IfcStructuralSurfaceConnection" });

		const condition = addStructuralBoundaryCondition(file, { connection });

		expect(condition.isA("IfcBoundaryFaceCondition")).toBe(true);
	});

	test("an IfcRelConnectsStructuralMember's RelatedStructuralConnection picks the boundary class, but AppliedCondition is set on the rel itself", () => {
		const file = createTestFile(schema);
		const member = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });
		const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });
		const rel = createEntity(file, { ifcClass: "IfcRelConnectsStructuralMember" });
		rel.set("RelatingStructuralMember", member);
		rel.set("RelatedStructuralConnection", connection);

		const condition = addStructuralBoundaryCondition(file, { connection: rel });

		// The boundary class is derived from the unwrapped `RelatedStructuralConnection`...
		expect(condition.isA("IfcBoundaryNodeCondition")).toBe(true);
		// ...but real Python's own `connection.AppliedCondition = condition` assigns to
		// the ORIGINAL `connection` argument (the rel here), not the unwrapped
		// `related_connection` -- ported verbatim, not "fixed" to target the unwrapped
		// connection instead.
		expect((rel.get("AppliedCondition") as EntityInstance).equals(condition)).toBe(true);
		expect(connection.get("AppliedCondition")).toBeNull();
	});

	test("an unrecognised connection class throws (Python: assert False)", () => {
		const file = createTestFile(schema);
		const connection = createEntity(file, { ifcClass: "IfcStructuralConnection" });

		expect(() => addStructuralBoundaryCondition(file, { connection })).toThrow();
	});
});
