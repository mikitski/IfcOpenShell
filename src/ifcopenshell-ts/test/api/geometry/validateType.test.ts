// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_validate_type.py` (src/ifcopenshell-
// python, `TestValidateType`/`TestValidateTypeIFC2X3`).
//
// **Formerly a disclosed, PRE-EXISTING blocker, now CLOSED on ALL 3 SCHEMAS (reference-
// parity chunk 5 of 5)** (see `../../../src/api/geometry/validateType.ts`'s own header
// comment for the original story): `test_validating_a_non_csg_representation`/
// `test_failing_a_non_csg_representation` build a pure-curve (non-boolean) fixture via
// `ShapeBuilder.rectangle()`, which `validateType` feeds straight into `guessType` --
// and `guessType`'s `Curve2D` branch reads the EXPRESS DERIVED `.Dim` attribute. Phase
// EX-2 ported the full `calc_*` `Dim`-DERIVE family for all 3 schemas (IFC2X3 first,
// chunks 1+2; IFC4/IFC4X3 caught up in later, independent chunks -- see
// `TODOS.md`'s "`util.representation.guessType`'s `Curve2D`/... branches..." entry,
// "UPDATE 2"/`src/util/representation.ts`'s own header comment for the exact
// per-schema history), and TODOS.md's "`EntityInstance.setByIndex`/`IfcFile
// .createEntity` ..." entry's shared native gate (the `IfcLineIndex`/`IfcArcIndex`
// defined-type-creation blocker `ShapeBuilder.rectangle()` used to hit on IFC4/IFC4X3)
// was separately fixed 2026-09-23. Both gaps are independent, and BOTH are now
// resolved on IFC4/IFC4X3 too -- re-verified directly (not assumed) with a throwaway
// script against a fresh, from-scratch multi-schema native rebuild before updating
// these tests: `builder.rectangle()`/`guessType`/`validateType` all complete
// end-to-end, with IDENTICAL results, on IFC2X3, IFC4, AND IFC4X3 (`RepresentationType:
// "Curve2D"`/`validateType: true` for the first fixture; `RepresentationType: null`/
// `validateType: false` for the second) -- not a different thrown error on IFC4/IFC4X3,
// and not a flaky/partial result.
//
// The 5th real Python test (`test_failing_validation_on_unreconcilable_types`) is left
// completely UNTOUCHED by this update -- it is not one of the 4 `test.skipIf`'d cases
// this chunk was scoped to (it was never skipped at all, just hardcoded to IFC2X3 via
// `AVAILABLE_SCHEMAS.filter((s) => s === "IFC2X3")`, unrelated to either gap this
// update closes). Whether it would also now pass unmodified on IFC4/IFC4X3 was not
// investigated here -- widening its own schema coverage is a separate, independent
// change from flipping this chunk's own 4 assigned skips, out of this chunk's scope.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addBoolean } from "../../../src/api/geometry/addBoolean";
import { validateType } from "../../../src/api/geometry/validateType";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { ShapeBuilder } from "../../../src/util/shapeBuilder";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Python: `model = add_context(...)` then `body = add_context(..., parent=model)`. */
function bodyContext(file: IfcFile): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	const model = addContext(file, { contextType: "Model" });
	return addContext(file, {
		contextType: "Model",
		contextIdentifier: "Body",
		targetView: "MODEL_VIEW",
		parent: model,
	});
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.validateType (%s)", (schema) => {
	// Genuinely UNBLOCKED on ALL 3 SCHEMAS as of reference-parity chunk 5 of 5 (see this
	// file's own header comment) -- real Python's own `test_validating_a_non_csg
	// _representation` asserts `guess_type(...) == 'Curve2D'` and `validate_type(...)
	// is True`; re-verified directly against a fresh, from-scratch multi-schema native
	// rebuild (not assumed) that IFC4/IFC4X3 now produce the IDENTICAL result to IFC2X3
	// before writing this assertion.
	test("validating a non-CSG representation", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const rep = builder.getRepresentation(body, [builder.rectangle()]);
		expect(validateType(file, { representation: rep })).toBe(true);
		expect(rep.get("RepresentationType")).toBe("Curve2D");
	});

	// Real Python's own `test_failing_a_non_csg_representation` asserts
	// `guess_type(...) == 'Curve2D'` and `validate_type(...) is False` (the mixed
	// curve+block item list can't reconcile to one `RepresentationType`) -- same
	// now-genuinely-unblocked-on-all-3-schemas shape as the test above.
	test("failing a non-CSG representation", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const rep = builder.getRepresentation(body, [builder.rectangle(), builder.block()]);
		expect(validateType(file, { representation: rep })).toBe(false);
		expect(rep.get("RepresentationType")).toBeNull();
	});

	test("validating a correct representation", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const first = builder.sphere();
		const second = builder.block();
		const rep = builder.getRepresentation(body, [first, second]);

		addBoolean(file, { firstItem: first, secondItems: [second] });
		expect(validateType(file, { representation: rep })).toBe(true);
		expect(rep.get("RepresentationType")).toBe("CSG");
	});

	test("adding multiple booleans from three top-level items", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const first = builder.sphere();
		const second1 = builder.block();
		const second2 = builder.block();
		const second3 = builder.block();
		const rep = builder.getRepresentation(body, [first, second1, second2, second3]);

		const booleans = addBoolean(file, { firstItem: first, secondItems: [second1] });
		expect(booleans).toHaveLength(1);
		expect(rep.get("Items") as EntityInstance[]).toHaveLength(4);
		expect(validateType(file, { representation: rep })).toBe(true);
		const items = rep.get("Items") as EntityInstance[];
		expect(items).toHaveLength(1);
		expect(rep.get("RepresentationType")).toBe("CSG");
		expect((items[0] as EntityInstance).get("Operator")).toBe("UNION");
	});
});

// --- IFC2X3-only: `ShapeBuilder.rectangle()`'s own fixture-construction step throws
// on IFC4/IFC4X3 (see this file's own header comment) -- `validateType` itself never
// hits the disclosed `.Dim` gap for this fixture. ---
describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC2X3"))(
	"api.geometry.validateType (%s) -- unreconcilable types",
	(schema) => {
		test("failing validation on unreconcilable types", () => {
			const file = createTestFile(schema);
			const body = bodyContext(file);
			const builder = new ShapeBuilder(file);
			const first = builder.sphere();
			const second1 = builder.block();
			const second2 = builder.rectangle();
			const rep = builder.getRepresentation(body, [first, second1, second2]);

			const booleans = addBoolean(file, { firstItem: first, secondItems: [second1] });
			expect(booleans).toHaveLength(1);
			// boolean replaced first, but second1 stays in Items.
			expect(rep.get("Items") as EntityInstance[]).toHaveLength(3);
			expect(validateType(file, { representation: rep })).toBe(false);
			// validateType unioned second1 into the boolean.
			expect(rep.get("Items") as EntityInstance[]).toHaveLength(2);
			expect(rep.get("RepresentationType")).toBeNull();
		});
	},
);
