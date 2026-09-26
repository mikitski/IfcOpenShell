// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/style/test_unassign_material_style.py`
// (src/ifcopenshell-python -- `TestUnassignMaterialStyleIFC2X3(test.bootstrap.IFC2X3)`'s
// `test_run` (also inherited/run under `TestUnassignMaterialStyleIFC4`), plus
// `TestUnassignMaterialStyleIFC4`'s own IFC4-only
// `test_update_shape_aspect_representaitons_items_styles_if_material_is_part_of_matching
// _material_constituents` (needs `IfcMaterialConstituentSet`, added in IFC4).
//
// `api.style.assignMaterialStyle`/`.assignRepresentationStyles` (both chunk 2
// functions, see `../../../src/api/style/index.ts`'s own header comment) are NOT
// ported -- `test_run`'s fixture is built directly, reproducing the exact
// `IfcStyledItem`/`IfcStyledRepresentation`/`IfcMaterialDefinitionRepresentation` shape
// `assign_material_style`'s own `create_new_definition_representation`/
// `create_styled_representation`/`create_styled_item` would produce for a material with
// no prior style (including the real IFC2X3-vs-IFC4+ difference:
// `IfcStyledItem.Styles` must be wrapped in an `IfcPresentationStyleAssignment` on
// IFC2X3), identical technique to `../material/removeMaterial.test.ts`'s own
// `styleForStyledItem` precedent.
//
// The second real test is deliberately NOT ported to its real, full-success assertion
// (`assert len(item.StyledByItem) == 0`) -- reaching that requires
// `util.element.getShapeAspects`, which has no TS port of any kind yet (see
// `../../../src/api/style/unassignMaterialStyle.ts`'s own header comment and
// `TODOS.md`). Instead, a minimal, equivalent fixture (built entirely from already-
// ported `api.material` functions, no `assign_material_style`/`assign_representation
// _styles` needed to trigger this code path at all) asserts the disclosed blocked
// error is thrown at exactly this point -- matching
// `../material/setShapeAspectConstituents.test.ts`'s own established "throws the
// disclosed blocked error" precedent for a genuinely unported dependency.

import { describe, expect, test } from "vitest";
import { addConstituent } from "../../../src/api/material/addConstituent";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { unassignMaterialStyle } from "../../../src/api/style/unassignMaterialStyle";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

/** See this file's own header comment -- IFC2X3's `IfcStyledItem.Styles` must be wrapped in an `IfcPresentationStyleAssignment`, matching real `assign_material_style.py`'s own schema branch. */
function styleForStyledItem(file: IfcFile, schema: Schema, style: EntityInstance): EntityInstance {
	return schema === "IFC2X3" ? file.createEntity("IfcPresentationStyleAssignment", [style]) : style;
}

/** Reproduces `assign_material_style`'s own `create_new_definition_representation` shape for a material with no prior style. Returns the created `IfcStyledItem`. */
function assignFirstMaterialStyle(
	file: IfcFile,
	schema: Schema,
	material: EntityInstance,
	style: EntityInstance,
	context: EntityInstance,
): EntityInstance {
	const styledItem = file.createEntity("IfcStyledItem", null, [styleForStyledItem(file, schema, style)], null);
	const styledRepresentation = file.createEntity(
		"IfcStyledRepresentation",
		context,
		context.get("ContextIdentifier"),
		null,
		[styledItem],
	);
	file.createEntity("IfcMaterialDefinitionRepresentation", null, null, [styledRepresentation], material);
	return styledItem;
}

describe.each(AVAILABLE_SCHEMAS)("api.style.unassignMaterialStyle (%s)", (schema) => {
	test("unassigns a style from a material", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, {});
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const style = file.createEntity("IfcSurfaceStyle");
		const item = assignFirstMaterialStyle(file, schema, material, style, context);

		// unassign 1 style
		const style2 = file.createEntity("IfcSurfaceStyle");
		item.set("Styles", [...(item.get("Styles") as EntityInstance[]), style2]);
		unassignMaterialStyle(file, { material, style: style2, context });
		if (schema !== "IFC2X3") {
			const remaining = item.get("Styles") as EntityInstance[];
			expect(remaining).toHaveLength(1);
			expect(remaining[0].equals(style)).toBe(true);
		} else {
			const remaining = item.get("Styles") as EntityInstance[];
			expect(remaining).toHaveLength(1);
			expect((remaining[0].get("Styles") as EntityInstance[])[0].equals(style)).toBe(true);
		}

		// unassign last style
		unassignMaterialStyle(file, { material, style, context });
		expect(file.byType("IfcMaterialDefinitionRepresentation").length).toBe(0);
		expect(file.byType("IfcStyledRepresentation").length).toBe(0);
		expect(file.byType("IfcStyledItem").length).toBe(0);
	});
});

// --- `IfcMaterialConstituentSet` added in IFC4 -- IFC4+ only. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.style.unassignMaterialStyle (%s) -- IFC4+ only",
	(schema) => {
		test("throws when the material is part of a matching named material constituent used by a real element", () => {
			const file = createTestFile(schema);
			const element = file.createEntity("IfcWall");
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const style = file.createEntity("IfcSurfaceStyle");

			const name = "Concrete";
			const material = addMaterial(file, {});
			const materialSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
			const constituent = addConstituent(file, { constituentSet: materialSet, material });
			constituent.set("Name", name);
			assignMaterial(file, { products: [element], material: materialSet });

			expect(() => unassignMaterialStyle(file, { material, style, context })).toThrow(/getShapeAspects/);
		});

		test("does not throw when the material has no named material constituent", () => {
			const file = createTestFile(schema);
			const element = file.createEntity("IfcWall");
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const material = addMaterial(file, {});
			const style = file.createEntity("IfcSurfaceStyle");
			assignMaterial(file, { products: [element], material });

			expect(() => unassignMaterialStyle(file, { material, style, context })).not.toThrow();
		});
	},
);
