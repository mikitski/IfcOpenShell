// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_structural_connection_cs.py` (confirmed: no
// `test_edit_structural_connection_cs.py` under `test/api/structural/`). This suite
// is written directly from the real source's own behavior/docstring.
//
// Real, confirmed schema divergence: `IfcStructuralPointConnection.
// ConditionCoordinateSystem` doesn't exist on IFC2X3 at all (confirmed against
// `ifc2x3.d.ts`: `IfcStructuralPointConnection` there has no such attribute --
// IFC4 added it). Real Python's own unguarded `structural_item.ConditionCoordinateSystem`
// access would raise the same `AttributeError` on IFC2X3 -- this function is
// IFC4+-only in practice, matching real Python exactly (no IFC2X3-specific branch
// exists there either). Gated to non-IFC2X3 schemas accordingly.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { editStructuralConnectionCs } from "../../../src/api/structural/editStructuralConnectionCs";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((schema) => schema !== "IFC2X3"))(
	"api.structural.editStructuralConnectionCs (%s)",
	(schema) => {
		test("creates a ConditionCoordinateSystem from scratch with defaults", () => {
			const file = createTestFile(schema);
			const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });

			editStructuralConnectionCs(file, { structuralItem: connection });

			const ccs = connection.get("ConditionCoordinateSystem") as EntityInstance;
			expect(ccs).not.toBeNull();
			expect(ccs.isA("IfcAxis2Placement3D")).toBe(true);
			expect((ccs.get("Axis") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 0.0, 1.0]);
			expect((ccs.get("RefDirection") as EntityInstance).get("DirectionRatios")).toEqual([1.0, 0.0, 0.0]);
		});

		test("honours custom axis/refDirection vectors", () => {
			const file = createTestFile(schema);
			const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });

			editStructuralConnectionCs(file, { structuralItem: connection, axis: [0, 1, 0], refDirection: [0, 0, 1] });

			const ccs = connection.get("ConditionCoordinateSystem") as EntityInstance;
			expect((ccs.get("Axis") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 1.0, 0.0]);
			expect((ccs.get("RefDirection") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 0.0, 1.0]);
		});

		test("replacing an existing sole-referenced Axis/RefDirection removes the old ones", () => {
			const file = createTestFile(schema);
			const connection = createEntity(file, { ifcClass: "IfcStructuralPointConnection" });
			editStructuralConnectionCs(file, { structuralItem: connection });
			const ccs = connection.get("ConditionCoordinateSystem") as EntityInstance;
			const oldAxis = ccs.get("Axis") as EntityInstance;
			const oldRefDirection = ccs.get("RefDirection") as EntityInstance;
			const oldAxisId = oldAxis.id();
			const oldRefDirectionId = oldRefDirection.id();

			editStructuralConnectionCs(file, { structuralItem: connection, axis: [0, 1, 0], refDirection: [0, 0, 1] });

			// The old, now-orphaned IfcDirection instances were removed (sole reference).
			expect(() => file.byId(oldAxisId)).toThrow();
			expect(() => file.byId(oldRefDirectionId)).toThrow();
			// The ConditionCoordinateSystem itself is reused, not recreated.
			expect((connection.get("ConditionCoordinateSystem") as EntityInstance).equals(ccs)).toBe(true);
		});
	},
);
