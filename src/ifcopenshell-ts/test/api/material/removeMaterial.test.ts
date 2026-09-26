// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/material/test_remove_material.py` (src/ifcopenshell-python
// -- `TestRemoveMaterialIFC2X3(test.bootstrap.IFC2X3)` /
// `TestRemoveMaterialIFC4(test.bootstrap.IFC4, TestRemoveMaterialIFC2X3)`, real
// Python's own multiple-inheritance shape: every base-class test runs on both IFC2X3
// and IFC4, plus `test_removing_material_in_profile`/`test_removing_material_in_
// constituent` which are IFC4-only since `IfcMaterialProfileSet`/
// `IfcMaterialConstituentSet` don't exist on IFC2X3). This port additionally runs the
// shared tests against IFC4X3 too (via `describe.each(AVAILABLE_SCHEMAS)`, already
// CI-safe per `../../bootstrap.ts`), matching `./assignMaterial.test.ts`'s/
// `./copyMaterial.test.ts`'s own established precedent.
//
// `api.pset.addPset` is already ported, but its sibling `api.pset.editPset` has its
// OWN real, pre-existing, disclosed gap, entirely unrelated to this chunk:
// materializing a NEW typed value from a plain scalar (`../pset/editPset.ts`'s own
// header comment) -- so `test_removing_a_material_with_properties`'s property is
// attached directly via the same `createTypedValue` workaround `editPset.test.ts`/
// `./copyMaterial.test.ts` themselves already established, bypassing the unrelated
// blocked `editPset` call entirely rather than hitting that gap here.
//
// `api.style.addStyle`/`.assignMaterialStyle` are NOT ported (no `api.style` module
// exists at all) -- `test_removing_a_material_with_a_style_definition`'s fixture is
// rebuilt directly, reproducing the exact entity shape `assign_material_style.py`'s
// own `create_new_definition_representation`/`create_styled_representation`/
// `create_styled_item` would produce, identical technique to `./copyMaterial.test.ts`'s
// own `test_copying_a_material_with_a_style_representation` (including the real
// IFC2X3-vs-IFC4+ difference: `IfcStyledItem.Styles` must be wrapped in an
// `IfcPresentationStyleAssignment` on IFC2X3, since `IfcSurfaceStyle` isn't a direct
// member of that attribute's IFC2X3 union type -- confirmed against `ifc2x3.d.ts`).

import { describe, expect, test } from "vitest";
import { addConstituent } from "../../../src/api/material/addConstituent";
import { addLayer } from "../../../src/api/material/addLayer";
import { addListItem } from "../../../src/api/material/addListItem";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { addProfile } from "../../../src/api/material/addProfile";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { removeMaterial } from "../../../src/api/material/removeMaterial";
import { addPset } from "../../../src/api/pset/addPset";
import { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { entity_instance as NativeEntityInstance } from "../../../src/native/ifcopenshell_native";
import { native } from "../../../src/native/native_loader";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";
import type { Schema } from "../../bootstrap";

function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

/** Constructs a standalone, correctly-typed defined-type value, bypassing `editPset`'s own disclosed value-materialization gap -- identical technique to `../pset/editPset.test.ts`'s/`./copyMaterial.test.ts`'s own `createTypedValue`. */
function createTypedValue(file: IfcFile, className: string, value: string): EntityInstance {
	const declaration = file.nativeFile.schema().declaration_by_name_with_name(className);
	const handle = file.nativeFile.create_with_declaration_instance_id(declaration, -1);
	new NativeEntityInstance(handle._handle).set_attribute_value(0, { kind: native.STRING, string_value: value });
	return new EntityInstance(handle._handle, file);
}

/** See this file's own header comment -- IFC2X3's `IfcStyledItem.Styles` must be wrapped in an `IfcPresentationStyleAssignment`, matching real `assign_material_style.py`'s own schema branch. */
function styleForStyledItem(file: IfcFile, schema: Schema, style: EntityInstance): EntityInstance {
	return schema === "IFC2X3" ? file.createEntity("IfcPresentationStyleAssignment", [style]) : style;
}

/** Real Python: `get_material_props` local helper inside `test_removing_a_material_with_properties`. */
function getMaterialProps(file: IfcFile, material: EntityInstance): EntityInstance[] {
	if (file.schema !== "IFC2X3") {
		return (material.get("HasProperties") as EntityInstance[] | null) ?? [];
	}
	return [...(file.getInverse(material) as Set<EntityInstance>)].filter((i) => i.isA("IfcMaterialProperties"));
}

describe.each(AVAILABLE_SCHEMAS)("api.material.removeMaterial (%s)", (schema) => {
	test("removing a material", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, {});

		removeMaterial(file, { material });

		expect(file.byType("IfcMaterial").length).toBe(0);
	});

	test("removing a material with associations", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const material = addMaterial(file, {});
		assignMaterial(file, { products: [wall], material });

		removeMaterial(file, { material });

		expect(file.byType("IfcMaterial").length).toBe(0);
		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
	});

	test("removing a material in a layer", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const material = addMaterial(file, {});
		const materialSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		addLayer(file, { layerSet: materialSet, material });
		assignMaterial(file, { products: [wall], material: materialSet });
		expect((file.byType("IfcMaterialLayerSet")[0].get("MaterialLayers") as EntityInstance[]).length).toBe(1);

		removeMaterial(file, { material });

		expect(file.byType("IfcMaterial").length).toBe(0);
		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
		expect((file.byType("IfcMaterialLayerSet")[0].get("MaterialLayers") as EntityInstance[]).length).toBe(0);
	});

	test("removing a material in a list", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const material = addMaterial(file, {});
		const materialSet = addMaterialSet(file, { setType: "IfcMaterialList" });
		addListItem(file, { materialList: materialSet, material });
		assignMaterial(file, { products: [wall], material: materialSet });
		expect((file.byType("IfcMaterialList")[0].get("Materials") as EntityInstance[]).length).toBe(1);

		removeMaterial(file, { material });

		expect(file.byType("IfcMaterial").length).toBe(0);
		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
		expect((file.byType("IfcMaterialList")[0].get("Materials") as EntityInstance[]).length).toBe(0);
	});

	test("removing a material with a style definition", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const context = withAttrs(file, "IfcGeometricRepresentationContext", { ContextType: "Model" });
		const material = addMaterial(file, {});
		const style = withAttrs(file, "IfcSurfaceStyle", { Side: "BOTH" });
		const styledItem = withAttrs(file, "IfcStyledItem", { Styles: [styleForStyledItem(file, schema, style)] });
		const styledRep = withAttrs(file, "IfcStyledRepresentation", { ContextOfItems: context, Items: [styledItem] });
		withAttrs(file, "IfcMaterialDefinitionRepresentation", {
			Representations: [styledRep],
			RepresentedMaterial: material,
		});
		expect(file.byType("IfcMaterialDefinitionRepresentation").length).toBe(1);
		expect(file.byType("IfcStyledRepresentation").length).toBe(1);
		expect(file.byType("IfcStyledItem").length).toBe(1);
		expect(file.byType("IfcSurfaceStyle").length).toBe(1);

		removeMaterial(file, { material });

		expect(file.byType("IfcMaterial").length).toBe(0);
		expect(file.byType("IfcMaterialDefinitionRepresentation").length).toBe(0);
		expect(file.byType("IfcStyledRepresentation").length).toBe(0);
		expect(file.byType("IfcStyledItem").length).toBe(0);
		expect(file.byType("IfcSurfaceStyle").length).toBe(1);
	});

	test("removing a material with properties", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, {});
		const pset = addPset(file, { product: material, name: "Foo_Bar" });
		const prop = file.createEntity(
			"IfcPropertySingleValue",
			"Foo",
			null,
			createTypedValue(file, schema === "IFC2X3" ? "IfcText" : "IfcLabel", "Bar"),
			null,
		);
		const propsAttribute = schema === "IFC2X3" ? "ExtendedProperties" : "Properties";
		pset.set(propsAttribute, [prop]);
		expect(getMaterialProps(file, material).length).toBeGreaterThan(0);

		removeMaterial(file, { material });

		expect(file.byType("IfcMaterialProperties").length).toBe(0);
		expect(file.byType("IfcPropertySingleValue").length).toBe(0);
	});
});

// --- `IfcMaterialProfileSet` added in IFC4 -- IFC4+ only. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.removeMaterial (%s) -- IFC4+ only",
	(schema) => {
		test("removing a material in a profile", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");
			const material = addMaterial(file, {});
			const materialSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
			addProfile(file, { profileSet: materialSet, material });
			assignMaterial(file, { products: [wall], material: materialSet });
			expect((file.byType("IfcMaterialProfileSet")[0].get("MaterialProfiles") as EntityInstance[]).length).toBe(1);

			removeMaterial(file, { material });

			expect(file.byType("IfcMaterial").length).toBe(0);
			expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
			expect((file.byType("IfcMaterialProfileSet")[0].get("MaterialProfiles") as EntityInstance[]).length).toBe(0);
		});

		test("removing a material in a constituent", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");
			const material = addMaterial(file, {});
			const materialSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
			addConstituent(file, { constituentSet: materialSet, material });
			assignMaterial(file, { products: [wall], material: materialSet });
			expect((file.byType("IfcMaterialConstituentSet")[0].get("MaterialConstituents") as EntityInstance[]).length).toBe(
				1,
			);

			removeMaterial(file, { material });

			expect(file.byType("IfcMaterial").length).toBe(0);
			expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
			expect(file.byType("IfcMaterialConstituentSet")[0].get("MaterialConstituents")).toBeNull();
		});
	},
);
