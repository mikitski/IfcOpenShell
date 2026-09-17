// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_add_shape_aspect.py` (src/ifcopenshell-
// python, `TestAddShapeAspect`/`TestAddShapeAspectIFC2X3`), run against every schema
// this build has registered (`AVAILABLE_SCHEMAS`, see `../../bootstrap.ts`'s own
// header comment). The real Python `TestAddShapeAspectIFC2X3` subclass overrides ONE
// test (`test_adding_a_type_shape_aspect`, replaced with `pass  # Not allowed`) --
// reproduced below as a schema-gated `test.skipIf` on that one case only (matching
// the real Python source's own disclosed IFC2X3 limitation: `IfcRepresentationMap`
// cannot receive an `IfcShapeAspect` on IFC2X3, per `../../../src/api/geometry/
// addShapeAspect.ts`'s own header comment), every other case runs identically on all
// 3 schemas.

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addShapeAspect } from "../../../src/api/geometry/addShapeAspect";
import { assignRepresentation } from "../../../src/api/geometry/assignRepresentation";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { ShapeBuilder } from "../../../src/util/shapeBuilder";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Python: `model = add_context(...)` then `body = add_context(..., parent=model)`. */
function modelContext(file: IfcFile): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	return addContext(file, { contextType: "Model" });
}

function bodyContext(file: IfcFile): EntityInstance {
	const model = modelContext(file);
	return addContext(file, {
		contextType: "Model",
		contextIdentifier: "Body",
		targetView: "MODEL_VIEW",
		parent: model,
	});
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addShapeAspect (%s)", (schema) => {
	test("adding a shape aspect", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const item = builder.sphere();
		const rep = builder.getRepresentation(body, [item]);
		const element = createEntity(file, {});
		assignRepresentation(file, { product: element, representation: rep });

		const aspect = addShapeAspect(file, {
			name: "Foo",
			items: [item],
			representation: rep,
			partOfProduct: element.get("Representation") as EntityInstance,
		});
		expect(aspect.isA("IfcShapeAspect")).toBe(true);
		expect(
			(aspect.get("PartOfProductDefinitionShape") as EntityInstance).equals(
				element.get("Representation") as EntityInstance,
			),
		).toBe(true);
		expect(aspect.get("Name")).toBe("Foo");
		const shapeRepresentations = aspect.get("ShapeRepresentations") as EntityInstance[];
		expect(shapeRepresentations).toHaveLength(1);
		const aspectRep = shapeRepresentations[0] as EntityInstance;
		expect(aspectRep.equals(rep)).toBe(false);
		expect(
			(aspectRep.get("ContextOfItems") as EntityInstance).equals(rep.get("ContextOfItems") as EntityInstance),
		).toBe(true);
		expect(aspectRep.get("RepresentationIdentifier")).toBe(rep.get("RepresentationIdentifier"));
		expect(aspectRep.get("RepresentationType")).toBe(rep.get("RepresentationType"));
		expect((aspectRep.get("Items") as EntityInstance[]).map((i) => i.id())).toEqual([item.id()]);
	});

	test.skipIf(schema === "IFC2X3")("adding a type shape aspect", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const item = builder.sphere();
		const rep = builder.getRepresentation(body, [item]);
		const element = createEntity(file, { ifcClass: "IfcWallType" });
		assignRepresentation(file, { product: element, representation: rep });

		const representationMaps = element.get("RepresentationMaps") as EntityInstance[];
		const partOfProduct = representationMaps[0] as EntityInstance;
		const aspect = addShapeAspect(file, {
			name: "Foo",
			items: [item],
			representation: rep,
			partOfProduct,
		});
		expect(aspect.isA("IfcShapeAspect")).toBe(true);
		expect((aspect.get("PartOfProductDefinitionShape") as EntityInstance).equals(partOfProduct)).toBe(true);
		expect(aspect.get("Name")).toBe("Foo");
		const shapeRepresentations = aspect.get("ShapeRepresentations") as EntityInstance[];
		expect(shapeRepresentations).toHaveLength(1);
		const aspectRep = shapeRepresentations[0] as EntityInstance;
		expect(aspectRep.equals(rep)).toBe(false);
		expect(
			(aspectRep.get("ContextOfItems") as EntityInstance).equals(rep.get("ContextOfItems") as EntityInstance),
		).toBe(true);
		expect(aspectRep.get("RepresentationIdentifier")).toBe(rep.get("RepresentationIdentifier"));
		expect(aspectRep.get("RepresentationType")).toBe(rep.get("RepresentationType"));
		expect((aspectRep.get("Items") as EntityInstance[]).map((i) => i.id())).toEqual([item.id()]);
	});

	test("reusing an existing aspect", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const item = builder.sphere();
		const item2 = builder.sphere();
		const rep = builder.getRepresentation(body, [item, item2]);
		const element = createEntity(file, {});
		assignRepresentation(file, { product: element, representation: rep });
		const partOfProduct = element.get("Representation") as EntityInstance;

		const aspect = addShapeAspect(file, { name: "Foo", items: [item], representation: rep, partOfProduct });
		const aspect2 = addShapeAspect(file, { name: "Foo", items: [item2], representation: rep, partOfProduct });
		expect(aspect.equals(aspect2)).toBe(true);
		const shapeRepresentations = aspect.get("ShapeRepresentations") as EntityInstance[];
		expect(shapeRepresentations).toHaveLength(1);
		const aspectRepItems = (shapeRepresentations[0] as EntityInstance).get("Items") as EntityInstance[];
		expect(aspectRepItems.map((i) => i.id()).sort()).toEqual([item.id(), item2.id()].sort());
	});

	test("removing from previous aspects", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const builder = new ShapeBuilder(file);
		const item = builder.sphere();
		const item2 = builder.sphere();
		const rep = builder.getRepresentation(body, [item, item2]);
		const element = createEntity(file, {});
		assignRepresentation(file, { product: element, representation: rep });
		const partOfProduct = element.get("Representation") as EntityInstance;

		const aspect = addShapeAspect(file, {
			name: "Foo",
			items: [item, item2],
			representation: rep,
			partOfProduct,
		});
		const aspect2 = addShapeAspect(file, { name: "Bar", items: [item2], representation: rep, partOfProduct });
		expect(aspect.equals(aspect2)).toBe(false);
		expect(aspect.get("Name")).toBe("Foo");
		expect(
			((aspect.get("ShapeRepresentations") as EntityInstance[])[0] as EntityInstance).get("Items") as EntityInstance[],
		).toEqual([item]);
		expect(aspect2.get("Name")).toBe("Bar");
		expect(
			((aspect2.get("ShapeRepresentations") as EntityInstance[])[0] as EntityInstance).get("Items") as EntityInstance[],
		).toEqual([item2]);
	});

	test("takes context into account", () => {
		const file = createTestFile(schema);
		const model = modelContext(file);
		const body = addContext(file, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: model,
		});
		const box = addContext(file, {
			contextType: "Model",
			contextIdentifier: "Box",
			targetView: "MODEL_VIEW",
			parent: model,
		});
		const builder = new ShapeBuilder(file);
		const item = builder.sphere();
		const item2 = builder.sphere();
		const rep = builder.getRepresentation(body, [item, item2]);
		const rep2 = builder.getRepresentation(box, [item, item2]);
		const element = createEntity(file, {});
		assignRepresentation(file, { product: element, representation: rep });
		assignRepresentation(file, { product: element, representation: rep2 });
		const partOfProduct = element.get("Representation") as EntityInstance;

		const aspect = addShapeAspect(file, {
			name: "Foo",
			items: [item, item2],
			representation: rep,
			partOfProduct,
		});
		const aspect2 = addShapeAspect(file, { name: "Foo", items: [item2], representation: rep2, partOfProduct });
		expect(aspect.equals(aspect2)).toBe(true);
		expect(aspect.get("Name")).toBe("Foo");
		const shapeRepresentations = aspect.get("ShapeRepresentations") as EntityInstance[];
		expect(shapeRepresentations).toHaveLength(2);
		expect(
			((shapeRepresentations[0] as EntityInstance).get("ContextOfItems") as EntityInstance).equals(
				rep.get("ContextOfItems") as EntityInstance,
			),
		).toBe(true);
		expect(
			((shapeRepresentations[1] as EntityInstance).get("ContextOfItems") as EntityInstance).equals(
				rep2.get("ContextOfItems") as EntityInstance,
			),
		).toBe(true);
		const firstRepItems = (shapeRepresentations[0] as EntityInstance).get("Items") as EntityInstance[];
		expect(firstRepItems.map((i) => i.id()).sort()).toEqual([item.id(), item2.id()].sort());
		expect(((shapeRepresentations[1] as EntityInstance).get("Items") as EntityInstance[]).map((i) => i.id())).toEqual([
			item2.id(),
		]);
	});
});
