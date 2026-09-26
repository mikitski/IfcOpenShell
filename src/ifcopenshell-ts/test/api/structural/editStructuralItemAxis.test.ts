// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_structural_item_axis.py` (confirmed: no
// `test_edit_structural_item_axis.py` under `test/api/structural/`). This suite is
// written directly from the real source's own behavior/docstring, including a
// dedicated pin for the disclosed crash-on-unset-`Axis` quirk (see
// `../../../src/api/structural/editStructuralItemAxis.ts`'s own header comment).
//
// The "freshly created item" crash test below happens to pass identically on ALL 3
// schemas (unset OR entirely-absent `Axis` both throw, just via a different message --
// see that test's own comment), but the two tests that need to manually pre-populate
// `Axis` in test setup (bypassing this function to arrange its "already set" precondition)
// are gated to non-IFC2X3: `IfcStructuralCurveMember.Axis` doesn't exist at all on
// IFC2X3 (confirmed against `ifc2x3.d.ts`) -- another real, confirmed IFC4+-only schema
// divergence, same shape as `./editStructuralConnectionCs.test.ts`'s own
// `ConditionCoordinateSystem` finding.

import { describe, expect, test } from "vitest";
import { createEntity } from "../../../src/api/root/createEntity";
import { editStructuralItemAxis } from "../../../src/api/structural/editStructuralItemAxis";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.editStructuralItemAxis (%s)", (schema) => {
	test("calling on a freshly created item (Axis unset, or absent entirely on IFC2X3) throws -- disclosed quirk, not a workaround target", () => {
		const file = createTestFile(schema);
		const member = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });

		expect(() => editStructuralItemAxis(file, { structuralItem: member })).toThrow();
	});
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.structural.editStructuralItemAxis, Axis already populated (%s)",
	(schema) => {
		test("replaces an already-populated, sole-referenced Axis", () => {
			const file = createTestFile(schema);
			const member = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });
			const initialAxis = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
			member.set("Axis", initialAxis);
			const initialAxisId = initialAxis.id();

			editStructuralItemAxis(file, { structuralItem: member, axis: [1.0, 0.0, 0.0] });

			expect((member.get("Axis") as EntityInstance).get("DirectionRatios")).toEqual([1.0, 0.0, 0.0]);
			// The old sole-referenced IfcDirection was removed.
			expect(() => file.byId(initialAxisId)).toThrow();
		});

		test("defaults to (0, 0, 1) when axis is omitted", () => {
			const file = createTestFile(schema);
			const member = createEntity(file, { ifcClass: "IfcStructuralCurveMember" });
			member.set("Axis", file.createEntity("IfcDirection", [1.0, 0.0, 0.0]));

			editStructuralItemAxis(file, { structuralItem: member });

			expect((member.get("Axis") as EntityInstance).get("DirectionRatios")).toEqual([0.0, 0.0, 1.0]);
		});
	},
);
