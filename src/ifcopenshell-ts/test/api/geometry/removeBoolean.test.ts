// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_remove_boolean.py` (src/ifcopenshell-
// python, `TestRemoveBoolean`/`TestRemoveBooleanIFC2X3`), run against every schema
// this build has registered (`AVAILABLE_SCHEMAS`, see `../../bootstrap.ts`'s own
// header comment).
//
// **Fixture adaptation, disclosed**: the real Python tests build their fixtures via
// `ifcopenshell.util.shape_builder.ShapeBuilder` (`.sphere()`/`.block()`/
// `.get_representation()`) and `ifcopenshell.api.geometry.add_boolean` -- NEITHER is
// ported yet (only free-function helpers exist in `util/shapeBuilder.ts` so far, no
// `ShapeBuilder` class; `add_boolean` itself remains unported, out of this chunk's own
// 8-file scope). Rather than skip these tests, each fixture is built manually via raw
// `file.createEntity` calls that reach the EXACT SAME end-state `add_boolean`/
// `ShapeBuilder` would produce (verified by hand-tracing `add_boolean.py`'s own source,
// not guessed): a chain of `IfcBooleanResult`s wrapping simple `IfcBlock` operands,
// with the outermost boolean set directly as an `IfcShapeRepresentation`'s sole
// `Items` entry. `remove_boolean` itself never inspects the operands' concrete classes
// (any `IfcCsgPrimitive3D` subtype works identically) -- `IfcBlock` was picked as the
// simplest 4-attribute class, confirmed identical across all 3 schemas' generated
// `.d.ts`s.

import { describe, expect, test } from "vitest";
import { removeBoolean } from "../../../src/api/geometry/removeBoolean";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** A minimal, valid `IfcBlock` (an `IfcCsgPrimitive3D`) -- see this file's header
 * comment for why the exact operand class doesn't matter to `remove_boolean` itself. */
function block(file: IfcFile): EntityInstance {
	const position = file.createEntity("IfcAxis2Placement3D", file.createEntity("IfcCartesianPoint", [0, 0, 0]));
	return file.createEntity("IfcBlock", position, 1, 1, 1);
}

function bodyRepresentation(file: IfcFile, items: readonly EntityInstance[]): EntityInstance {
	return file.createEntity("IfcShapeRepresentation", null, "Body", "CSG", items);
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.removeBoolean (%s)", (schema) => {
	test("removing a single top-level boolean", () => {
		const file = createTestFile(schema);
		const first = block(file);
		const second = block(file);
		const boolean = file.createEntity("IfcBooleanResult", "DIFFERENCE", first, second);
		const rep = bodyRepresentation(file, [boolean]);

		removeBoolean(file, { item: boolean });

		const items = rep.get("Items") as EntityInstance[];
		expect(items.map((i) => i.id()).sort()).toEqual([first.id(), second.id()].sort());
		expect(file.byType("IfcBooleanResult")).toHaveLength(0);
	});

	test("removing a top-level nested boolean", () => {
		const file = createTestFile(schema);
		const first = block(file);
		const second1 = block(file);
		const second2 = block(file);
		// Matches what `add_boolean(file, first, [second1, second2])` would build: a
		// chain `boolean2(boolean1(first, second1), second2)`, with only the OUTERMOST
		// boolean (`boolean2`) ever placed into the representation's own `Items`.
		const boolean1 = file.createEntity("IfcBooleanResult", "DIFFERENCE", first, second1);
		const boolean2 = file.createEntity("IfcBooleanResult", "DIFFERENCE", boolean1, second2);
		const rep = bodyRepresentation(file, [boolean2]);

		removeBoolean(file, { item: second2 });

		const items = rep.get("Items") as EntityInstance[];
		expect(items).toHaveLength(2);
		expect(items.some((i) => i.equals(second2))).toBe(true);
		const remaining = file.byType("IfcBooleanResult");
		expect(remaining).toHaveLength(1);
		const remainingBoolean = remaining[0] as EntityInstance;
		expect(items.some((i) => i.equals(remainingBoolean))).toBe(true);
		expect((remainingBoolean.get("FirstOperand") as EntityInstance).equals(first)).toBe(true);
		expect((remainingBoolean.get("SecondOperand") as EntityInstance).equals(second1)).toBe(true);
	});

	test("removing a nested boolean", () => {
		const file = createTestFile(schema);
		const first = block(file);
		const second1 = block(file);
		const second2 = block(file);
		const boolean1 = file.createEntity("IfcBooleanResult", "DIFFERENCE", first, second1);
		const boolean2 = file.createEntity("IfcBooleanResult", "DIFFERENCE", boolean1, second2);
		const rep = bodyRepresentation(file, [boolean2]);

		removeBoolean(file, { item: second1 });

		const items = rep.get("Items") as EntityInstance[];
		expect(items).toHaveLength(2);
		expect(items.some((i) => i.equals(second1))).toBe(true);
		const remaining = file.byType("IfcBooleanResult");
		expect(remaining).toHaveLength(1);
		const remainingBoolean = remaining[0] as EntityInstance;
		expect(items.some((i) => i.equals(remainingBoolean))).toBe(true);
		expect((remainingBoolean.get("FirstOperand") as EntityInstance).equals(first)).toBe(true);
		expect((remainingBoolean.get("SecondOperand") as EntityInstance).equals(second2)).toBe(true);
	});
});
