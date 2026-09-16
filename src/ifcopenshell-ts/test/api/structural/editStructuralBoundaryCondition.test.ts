// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_structural_boundary_condition.py` (confirmed:
// no `test_edit_structural_boundary_condition.py` under `test/api/structural/`). This
// suite is written directly from the real source's own behavior/docstring, including
// a dedicated pin for the disclosed, pre-existing `attribute_kind_of` primitive-layer
// gap that blocks the `"IfcBoolean"`/generic-measure-class branches -- see
// `../../../src/api/structural/editStructuralBoundaryCondition.ts`'s own header
// comment (and `TODOS.md`'s "UPDATE" for this chunk) for the full disclosure. The
// comment on each blocked assertion records the real, unblocked behavior to restore
// once that gap closes (matching `editPset.test.ts`'s/`editSurfaceStyle.test.ts`'s
// own established precedent).

import { describe, expect, test } from "vitest";
import { addStructuralBoundaryCondition } from "../../../src/api/structural/addStructuralBoundaryCondition";
import { editStructuralBoundaryCondition } from "../../../src/api/structural/editStructuralBoundaryCondition";
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

	test("an 'IfcBoolean'-typed attribute is BLOCKED by the disclosed primitive-layer gap", () => {
		const file = createTestFile(schema);
		const condition = addStructuralBoundaryCondition(file, {});

		// Real, unblocked Python behavior once the gap closes:
		// `condition.get("TranslationalStiffnessX")` would be a fresh `IfcBoolean(true)`
		// wrapping instance.
		expect(() =>
			editStructuralBoundaryCondition(file, {
				condition,
				attributes: { TranslationalStiffnessX: { type: "IfcBoolean", value: true } },
			}),
		).toThrow();
	});

	test("a generic measure-class attribute is BLOCKED by the same gap", () => {
		const file = createTestFile(schema);
		const condition = addStructuralBoundaryCondition(file, {});

		// Real, unblocked Python behavior once the gap closes:
		// `condition.get("TranslationalStiffnessX")` would be a fresh
		// `IfcLinearStiffnessMeasure(1000.0)` wrapping instance.
		expect(() =>
			editStructuralBoundaryCondition(file, {
				condition,
				attributes: { TranslationalStiffnessX: { type: "IfcLinearStiffnessMeasure", value: 1000.0 } },
			}),
		).toThrow();
	});
});
