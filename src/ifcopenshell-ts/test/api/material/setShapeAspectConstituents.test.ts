// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `set_shape_aspect_constituents.py` (no
// `test_set_shape_aspect_constituents.py` counterpart -- confirmed by directory
// listing of `src/ifcopenshell-python/test/api/material/`). Tests below are new,
// exercising the real Python source's own disclosed behavior directly (see
// `../../../src/api/material/setShapeAspectConstituents.ts`'s own header comment): the
// material-set creation/removal surgery (including the real, disclosed upstream bug
// that makes the "reuse an existing matching set" branch permanently unreachable), and
// the final style-assignment call site (thrown only when an item's shape aspect
// actually matches a named material AND that material has a real style).
// `IfcMaterialConstituentSet` doesn't exist on IFC2X3 at all, so every test here runs
// IFC4/IFC4X3 only.
//
// **UPDATE (`api.style` chunk 2, 2026-09-15):** the previously-disclosed
// `api.style.assignItemStyle` blocker is now resolved -- `setShapeAspectConstituents.ts`
// calls the real, landed `assignItemStyle`. The "throws the disclosed blocked error"
// regression test below is replaced with real assertions on the resulting
// `IfcStyledItem` (see `../style/assignItemStyle.test.ts` for that function's own,
// broader coverage -- this file only pins that `setShapeAspectConstituents` actually
// reaches and correctly invokes it).

import { describe, expect, test } from "vitest";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { setShapeAspectConstituents } from "../../../src/api/material/setShapeAspectConstituents";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getMaterial } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** See `test/util/representation.test.ts`'s identical local helper -- not exported from there, so duplicated here. */
function shapeRepresentation(
	file: IfcFile,
	contextOfItems: EntityInstance,
	items: readonly EntityInstance[],
): EntityInstance {
	const rep = file.createEntity("IfcShapeRepresentation");
	rep.set("ContextOfItems", contextOfItems);
	rep.set("Items", items);
	return rep;
}

/** See `test/util/representation.test.ts`'s identical local helper -- not exported from there, so duplicated here. */
function productWithRepresentations(
	file: IfcFile,
	className: string,
	representations: readonly EntityInstance[],
): EntityInstance {
	const element = file.createEntity(className);
	const productShape = file.createEntity("IfcProductDefinitionShape");
	productShape.set("Representations", representations);
	element.set("Representation", productShape);
	return element;
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.setShapeAspectConstituents (%s)",
	(schema) => {
		test("creates a constituent set with named constituents and assigns it to the element", () => {
			const file = createTestFile(schema);
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const rep = shapeRepresentation(file, context, [item]);
			const element = productWithRepresentations(file, "IfcWindow", [rep]);
			const aluminium = addMaterial(file, { name: "AL01", category: "aluminium" });
			const glass = addMaterial(file, { name: "GLZ01", category: "glass" });

			setShapeAspectConstituents(file, { element, context, materials: { Framing: aluminium, Glazing: glass } });

			const material = getMaterial(element) as EntityInstance;
			expect(material.isA("IfcMaterialConstituentSet")).toBe(true);
			const constituents = material.get("MaterialConstituents") as EntityInstance[];
			expect(constituents.map((c) => c.get("Name"))).toEqual(["Framing", "Glazing"]);
			expect((constituents[0].get("Material") as EntityInstance).equals(aluminium)).toBe(true);
			expect((constituents[1].get("Material") as EntityInstance).equals(glass)).toBe(true);
		});

		// See this file's own header comment / `../../../src/api/material
		// /setShapeAspectConstituents.ts`'s own disclosed upstream bug: the "reuse an
		// existing matching set" branch is permanently unreachable, so calling this twice
		// with byte-for-byte identical `materials` still creates a brand new set each time.
		test("always creates a brand new material set, even when called twice with identical materials", () => {
			const file = createTestFile(schema);
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const rep = shapeRepresentation(file, context, [item]);
			const element = productWithRepresentations(file, "IfcWindow", [rep]);
			const aluminium = addMaterial(file, { name: "AL01", category: "aluminium" });

			setShapeAspectConstituents(file, { element, context, materials: { Framing: aluminium } });
			const firstSet = getMaterial(element) as EntityInstance;

			setShapeAspectConstituents(file, { element, context, materials: { Framing: aluminium } });
			const secondSet = getMaterial(element) as EntityInstance;

			expect(secondSet.equals(firstSet)).toBe(false);
			// The old, now-unused set was removed (not left dangling).
			expect(file.byType("IfcMaterialConstituentSet").length).toBe(1);
		});

		test("assigns the item style when a shape aspect name matches a material with a real style assigned", () => {
			const file = createTestFile(schema);
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const aluminium = addMaterial(file, { name: "AL01", category: "aluminium" });

			// Give `aluminium` a real style in `context` (matching
			// `test/util/representation.test.ts`'s own `getMaterialStyle` precedent).
			const style = file.createEntity("IfcSurfaceStyle");
			const styledItem = file.createEntity("IfcStyledItem");
			styledItem.set("Styles", [style]);
			const styledRep = shapeRepresentation(file, context, [styledItem]);
			const materialDefRep = file.createEntity("IfcMaterialDefinitionRepresentation");
			materialDefRep.set("RepresentedMaterial", aluminium);
			materialDefRep.set("Representations", [styledRep]);

			// `element`'s own main representation contains `item`, which is ALSO the sole
			// item of a second `aspectRep`, itself named by a "Framing" shape aspect --
			// matching `test/util/representation.test.ts`'s own `getItemShapeAspect`
			// precedent.
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const mainRep = shapeRepresentation(file, context, [item]);
			const element = productWithRepresentations(file, "IfcWindow", [mainRep]);
			const aspectRep = shapeRepresentation(file, context, [item]);
			const shapeAspect = file.createEntity("IfcShapeAspect");
			shapeAspect.set("ShapeRepresentations", [aspectRep]);
			shapeAspect.set("Name", "Framing");

			expect(() =>
				setShapeAspectConstituents(file, { element, context, materials: { Framing: aluminium } }),
			).not.toThrow();

			// The material-set creation surgery still ran to completion.
			const material = getMaterial(element);
			expect(material?.isA("IfcMaterialConstituentSet")).toBe(true);

			// `item` had no prior `StyledByItem` -- `assignItemStyle` creates a brand new
			// `IfcStyledItem` wrapping `aluminium`'s own style directly (neither IFC4 nor
			// IFC4X3 wrap a freshly-created item's style in an
			// `IfcPresentationStyleAssignment` -- only IFC2X3 does, and IFC2X3 is filtered
			// out of this `describe.each`, since `IfcMaterialConstituentSet` doesn't exist
			// there at all).
			const styledByItem = item.get("StyledByItem") as EntityInstance[];
			expect(styledByItem).toHaveLength(1);
			const assignedStyles = styledByItem[0].get("Styles") as EntityInstance[];
			expect(assignedStyles).toHaveLength(1);
			expect(assignedStyles[0].equals(style)).toBe(true);
		});

		test("does not throw when no shape aspect matches any material name", () => {
			const file = createTestFile(schema);
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const item = file.createEntity("IfcExtrudedAreaSolid");
			const mainRep = shapeRepresentation(file, context, [item]);
			const element = productWithRepresentations(file, "IfcWindow", [mainRep]);
			const aspectRep = shapeRepresentation(file, context, [item]);
			const shapeAspect = file.createEntity("IfcShapeAspect");
			shapeAspect.set("ShapeRepresentations", [aspectRep]);
			shapeAspect.set("Name", "SomethingElseEntirely");
			const aluminium = addMaterial(file, { name: "AL01", category: "aluminium" });

			expect(() =>
				setShapeAspectConstituents(file, { element, context, materials: { Framing: aluminium } }),
			).not.toThrow();
		});
	},
);
