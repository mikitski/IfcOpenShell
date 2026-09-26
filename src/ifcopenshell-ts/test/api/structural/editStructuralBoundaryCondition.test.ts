// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_structural_boundary_condition.py` (confirmed:
// no `test_edit_structural_boundary_condition.py` under `test/api/structural/`). This
// suite is written directly from the real source's own behavior/docstring. The
// `"IfcBoolean"`/generic-measure-class branches now build their wrapped instance
// successfully on IFC4/IFC4X3 (the `attribute_kind_of` primitive-layer gate this file
// used to pin, `TODOS.md`'s "EntityInstance.setByIndex/IfcFile.createEntity ..." entry,
// was resolved 2026-09-23). IFC2X3 still throws for those same 2 tests, but for a
// genuinely unrelated reason: `IfcBoundaryNodeCondition.TranslationalStiffnessX` isn't
// declared on IFC2X3 at all.

import { describe, expect, test } from "vitest";
import { addStructuralBoundaryCondition } from "../../../src/api/structural/addStructuralBoundaryCondition";
import { editStructuralBoundaryCondition } from "../../../src/api/structural/editStructuralBoundaryCondition";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.editStructuralBoundaryCondition (%s)", (schema) => {
	test("a 'string' attribute is set directly, with no boxing", () => {
		const file = createTestFile(schema);
		const condition = addStructuralBoundaryCondition(file, {});

		editStructuralBoundaryCondition(file, {
			condition,
			attributes: { Name: { type: "string", value: "Fixed support" } },
		});

		expect(condition.get("Name")).toBe("Fixed support");
	});

	test("a 'null' attribute clears the value directly", () => {
		const file = createTestFile(schema);
		const condition = addStructuralBoundaryCondition(file, { name: "Fixed support" });

		editStructuralBoundaryCondition(file, { condition, attributes: { Name: { type: "null", value: null } } });

		expect(condition.get("Name")).toBeNull();
	});

	// IFC2X3 has no `TranslationalStiffnessX` attribute on `IfcBoundaryNodeCondition` at
	// all -- a genuine, unrelated, still-real schema-capability gap (confirmed
	// empirically: throws "has no attribute 'TranslationalStiffnessX'"), independent of
	// the now-resolved `attribute_kind_of` gate this file used to pin. IFC4/IFC4X3 now
	// correctly build the wrapped `IfcBoolean`/measure-class instance.
	test("an 'IfcBoolean'-typed attribute is boxed into a fresh IfcBoolean instance", () => {
		const file = createTestFile(schema);
		const condition = addStructuralBoundaryCondition(file, {});

		if (schema === "IFC2X3") {
			expect(() =>
				editStructuralBoundaryCondition(file, {
					condition,
					attributes: { TranslationalStiffnessX: { type: "IfcBoolean", value: true } },
				}),
			).toThrow();
			return;
		}

		editStructuralBoundaryCondition(file, {
			condition,
			attributes: { TranslationalStiffnessX: { type: "IfcBoolean", value: true } },
		});
		const value = condition.get("TranslationalStiffnessX") as EntityInstance;
		expect(value.isA("IfcBoolean")).toBe(true);
		expect(value.getByIndex(0)).toBe(true);
	});

	test("a generic measure-class attribute is boxed into a fresh instance of that class", () => {
		const file = createTestFile(schema);
		const condition = addStructuralBoundaryCondition(file, {});

		if (schema === "IFC2X3") {
			expect(() =>
				editStructuralBoundaryCondition(file, {
					condition,
					attributes: { TranslationalStiffnessX: { type: "IfcLinearStiffnessMeasure", value: 1000.0 } },
				}),
			).toThrow();
			return;
		}

		editStructuralBoundaryCondition(file, {
			condition,
			attributes: { TranslationalStiffnessX: { type: "IfcLinearStiffnessMeasure", value: 1000.0 } },
		});
		const value = condition.get("TranslationalStiffnessX") as EntityInstance;
		expect(value.isA("IfcLinearStiffnessMeasure")).toBe(true);
		expect(value.getByIndex(0)).toBe(1000.0);
	});
});
