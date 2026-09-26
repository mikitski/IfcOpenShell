// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_add_boolean.py` (src/ifcopenshell-python,
// `TestAddBoolean`/`TestAddBooleanIFC2X3`), run against every schema this build has
// registered (`AVAILABLE_SCHEMAS`, see `../../bootstrap.ts`'s own header comment) --
// the real Python `TestAddBooleanIFC2X3` subclass runs the exact same test bodies
// against IFC2X3, so `describe.each(AVAILABLE_SCHEMAS)` reproduces that coverage
// directly rather than needing a separate IFC2X3-only `describe` block.
//
// Every fixture below uses `ShapeBuilder.sphere()`/`.block()`/`.getRepresentation()`
// (`../../../src/util/shapeBuilder.ts`, fully functional for these 2 primitives --
// see that file's own header comment) plus `api.root.createEntity`/
// `api.context.addContext`, matching the real Python fixtures line-for-line.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addBoolean } from "../../../src/api/geometry/addBoolean";
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

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addBoolean (%s)", (schema) => {
	test("adding a boolean from two top-level items", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const first = builder.sphere();
		const second = builder.block();
		const rep = builder.getRepresentation(body, [first, second]);

		const booleans = addBoolean(file, { firstItem: first, secondItems: [second] });
		expect(booleans).toHaveLength(1);
		const boolean = booleans[0] as EntityInstance;
		expect(boolean.isA("IfcBooleanResult")).toBe(true);
		expect((boolean.get("FirstOperand") as EntityInstance).equals(first)).toBe(true);
		expect((boolean.get("SecondOperand") as EntityInstance).equals(second)).toBe(true);
		expect(boolean.get("Operator")).toBe("DIFFERENCE");

		const items = rep.get("Items") as EntityInstance[];
		expect(items.map((i) => i.id()).sort()).toEqual([boolean.id(), second.id()].sort());
	});

	test("adding multiple booleans from three top-level items", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const first = builder.sphere();
		const second1 = builder.block();
		const second2 = builder.block();
		const rep = builder.getRepresentation(body, [first, second1, second2]);

		const booleans = addBoolean(file, { firstItem: first, secondItems: [second1, second2] });
		expect(booleans).toHaveLength(2);
		const finalBoolean = booleans[booleans.length - 1] as EntityInstance;
		const finalFirstOperand = finalBoolean.get("FirstOperand") as EntityInstance;
		expect(finalFirstOperand.isA("IfcBooleanResult")).toBe(true);
		expect((finalBoolean.get("SecondOperand") as EntityInstance).equals(second2)).toBe(true);
		expect(finalBoolean.get("Operator")).toBe("DIFFERENCE");
		expect((finalFirstOperand.get("FirstOperand") as EntityInstance).equals(first)).toBe(true);
		expect((finalFirstOperand.get("SecondOperand") as EntityInstance).equals(second1)).toBe(true);
		expect(finalFirstOperand.get("Operator")).toBe("DIFFERENCE");

		const items = rep.get("Items") as EntityInstance[];
		expect(items.map((i) => i.id()).sort()).toEqual([finalBoolean.id(), second1.id(), second2.id()].sort());
	});

	test("adding a boolean to an existing operand from a top-level item", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const first = builder.sphere();
		const second1 = builder.block();
		const second2 = builder.block();
		const rep = builder.getRepresentation(body, [first, second1]);
		addBoolean(file, { firstItem: first, secondItems: [second1] });
		// second1 stays in Items, add second2 as well.
		rep.set("Items", [...(rep.get("Items") as EntityInstance[]), second2]);

		const booleans = addBoolean(file, { firstItem: first, secondItems: [second2] });
		expect(booleans).toHaveLength(1);
		const finalBoolean = booleans[0] as EntityInstance;
		const finalFirstOperand = finalBoolean.get("FirstOperand") as EntityInstance;
		expect(finalFirstOperand.isA("IfcBooleanResult")).toBe(true);
		expect((finalBoolean.get("SecondOperand") as EntityInstance).equals(second2)).toBe(true);
		expect((finalFirstOperand.get("FirstOperand") as EntityInstance).equals(first)).toBe(true);
		expect((finalFirstOperand.get("SecondOperand") as EntityInstance).equals(second1)).toBe(true);

		const items = rep.get("Items") as EntityInstance[];
		expect(items.map((i) => i.id()).sort()).toEqual([finalBoolean.id(), second1.id(), second2.id()].sort());
	});

	test("adding a boolean to an existing operand from another operand", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const first1 = builder.sphere();
		const second1 = builder.block();
		const first2 = builder.sphere();
		const second2 = builder.block();
		const rep = builder.getRepresentation(body, [first1, first2, second1, second2]);
		addBoolean(file, { firstItem: first1, secondItems: [second1] });
		addBoolean(file, { firstItem: first2, secondItems: [second2] });
		const booleans = addBoolean(file, { firstItem: first1, secondItems: [second2] });

		expect(booleans).toHaveLength(1);
		expect(rep.get("Items") as EntityInstance[]).toHaveLength(4);

		expect(file.getTotalInverses(first1)).toBe(1);
		const result = [...(file.getInverse(first1) as Set<EntityInstance>)][0] as EntityInstance;
		expect((result.get("FirstOperand") as EntityInstance).equals(first1)).toBe(true);
		expect((result.get("SecondOperand") as EntityInstance).equals(second1)).toBe(true);
		const result2 = [...(file.getInverse(result) as Set<EntityInstance>)][0] as EntityInstance;
		expect((result2.get("FirstOperand") as EntityInstance).equals(result)).toBe(true);
		// Second2 is now used twice. Reusing is OK (albeit confusing), so long as things don't get recursive.
		expect((result2.get("SecondOperand") as EntityInstance).equals(second2)).toBe(true);

		expect(file.getTotalInverses(first2)).toBe(1);
		const result3 = [...(file.getInverse(first2) as Set<EntityInstance>)][0] as EntityInstance;
		expect((result3.get("FirstOperand") as EntityInstance).equals(first2)).toBe(true);
		expect((result3.get("SecondOperand") as EntityInstance).equals(second2)).toBe(true);
	});

	test("preventing recursive booleans", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const first = builder.sphere();
		const second = builder.block();
		const rep = builder.getRepresentation(body, [first, second]);
		addBoolean(file, { firstItem: first, secondItems: [second] });
		addBoolean(file, { firstItem: first, secondItems: [second] });

		const boolean = (file.byType("IfcBooleanResult") as EntityInstance[])[0] as EntityInstance;
		let items = rep.get("Items") as EntityInstance[];
		expect(items.map((i) => i.id()).sort()).toEqual([boolean.id(), second.id()].sort());
		expect((boolean.get("FirstOperand") as EntityInstance).equals(first)).toBe(true);
		expect((boolean.get("SecondOperand") as EntityInstance).equals(second)).toBe(true);

		addBoolean(file, { firstItem: second, secondItems: [second] });
		addBoolean(file, { firstItem: second, secondItems: [first] });

		items = rep.get("Items") as EntityInstance[];
		expect(items.map((i) => i.id()).sort()).toEqual([boolean.id(), second.id()].sort());
		expect((boolean.get("FirstOperand") as EntityInstance).equals(first)).toBe(true);
		expect((boolean.get("SecondOperand") as EntityInstance).equals(second)).toBe(true);
		expect(file.byType("IfcBooleanResult")).toHaveLength(1);
	});
});
