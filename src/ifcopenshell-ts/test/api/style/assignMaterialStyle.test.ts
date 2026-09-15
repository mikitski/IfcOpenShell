// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/style/test_assign_material_style.py`
// (src/ifcopenshell-python -- `TestAssignMaterialStyleIFC2X3(test.bootstrap.IFC2X3)`'s
// `test_run`, also run under IFC4 via `TestAssignMaterialStyleIFC4(test.bootstrap.IFC4,
// TestAssignMaterialStyleIFC2X3)`). `TestAssignMaterialStyleIFC4`'s own IFC4-only
// `test_update_shape_aspect_representations_items_styles_if_material_is_part_of_matching
// _material_constituents` needs `ifcopenshell.util.element.get_shape_aspects`, which has
// no TS port of any kind yet (see `../../../src/api/style/assignMaterialStyle.ts`'s own
// header comment and `TODOS.md`) -- ported below as a "throws the disclosed blocked
// error" regression instead, matching `../material/setShapeAspectConstituents.test.ts`'s
// (pre-resolution) and `unassignMaterialStyle.test.ts`'s own established precedent for
// this exact situation. Also run on IFC4X3 for `test_run` (nothing in
// `assign_material_style.py` itself is IFC4X3-specific beyond the already-established
// `IfcPresentationStyleAssignment` removal, exercised here via
// `shouldUsePresentationStyleAssignment` never being set true on IFC4X3).

import { describe, expect, test } from "vitest";
import { addConstituent } from "../../../src/api/material/addConstituent";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { assignMaterialStyle } from "../../../src/api/style/assignMaterialStyle";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.style.assignMaterialStyle (%s)", (schema) => {
	test("run", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, {});
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const style = file.createEntity("IfcSurfaceStyle");

		assignMaterialStyle(file, { material, style, context });

		const hasRepresentation = material.get("HasRepresentation") as EntityInstance[];
		expect(hasRepresentation).toHaveLength(1);
		const definition = hasRepresentation[0];
		const representations = definition.get("Representations") as EntityInstance[];
		expect(representations).toHaveLength(1);
		const representation = representations[0];
		expect(representation.isA("IfcStyledRepresentation")).toBe(true);
		expect((representation.get("ContextOfItems") as EntityInstance).equals(context)).toBe(true);
		const items = representation.get("Items") as EntityInstance[];
		expect(items).toHaveLength(1);
		const item = items[0];
		expect(item.isA("IfcStyledItem")).toBe(true);
		let itemStyles = item.get("Styles") as EntityInstance[];
		if (schema !== "IFC2X3") {
			expect(itemStyles).toHaveLength(1);
			expect(itemStyles[0].equals(style)).toBe(true);
		} else {
			// IfcPresentationStyleAssignment
			expect(itemStyles).toHaveLength(1);
			expect(itemStyles[0].get("Styles") as EntityInstance[]).toHaveLength(1);
			expect((itemStyles[0].get("Styles") as EntityInstance[])[0].equals(style)).toBe(true);
		}

		const style2 = file.createEntity("IfcSurfaceStyle");
		assignMaterialStyle(file, { material, style: style2, context });

		// reuse existing elements and reassign the style
		expect((material.get("HasRepresentation") as EntityInstance[])[0].equals(definition)).toBe(true);
		expect((definition.get("Representations") as EntityInstance[])[0].equals(representation)).toBe(true);
		const reusedItems = representation.get("Items") as EntityInstance[];
		expect(reusedItems).toHaveLength(1);
		expect(reusedItems[0].equals(item)).toBe(true);
		itemStyles = reusedItems[0].get("Styles") as EntityInstance[];
		// See `../../../src/api/style/assignMaterialStyle.ts`'s own header comment for the
		// real, test-confirmed upstream bug this pins: the RAW, unwrapped `style2` ends up
		// here even on IFC2X3, where `IfcStyledItem.Styles` is otherwise always wrapped.
		expect(itemStyles).toHaveLength(1);
		expect(itemStyles[0].equals(style2)).toBe(true);
	});
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.style.assignMaterialStyle (%s) -- IFC4+ only (IfcMaterialConstituentSet)",
	(schema) => {
		test("throws when the material is part of a matching named material constituent used by a real element", () => {
			const file = createTestFile(schema);
			const element = file.createEntity("IfcWall");
			const productShape = file.createEntity("IfcProductDefinitionShape");
			element.set("Representation", productShape);
			const context = file.createEntity("IfcGeometricRepresentationContext");

			const representation = file.createEntity("IfcShapeRepresentation");
			const item = file.createEntity("IfcExtrudedAreaSolid");
			representation.set("Items", [item]);

			const name = "Concrete";
			const shapeAspect = file.createEntity("IfcShapeAspect");
			shapeAspect.set("ShapeRepresentations", [representation]);
			shapeAspect.set("Name", name);
			shapeAspect.set("PartOfProductDefinitionShape", productShape);

			const style = file.createEntity("IfcSurfaceStyle");
			const material = addMaterial(file, {});
			const materialSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
			const constituent = addConstituent(file, { constituentSet: materialSet, material });
			constituent.set("Name", name);
			assignMaterial(file, { products: [element], material: materialSet });

			expect(() => assignMaterialStyle(file, { material, style, context })).toThrow(/getShapeAspects/);
		});

		test("does not throw when the material has no named material constituent", () => {
			const file = createTestFile(schema);
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const material = addMaterial(file, {});
			const style = file.createEntity("IfcSurfaceStyle");

			expect(() => assignMaterialStyle(file, { material, style, context })).not.toThrow();
		});
	},
);
