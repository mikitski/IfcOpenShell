// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/material/test_remove_material_set.py`
// (src/ifcopenshell-python -- `TestRemoveMaterialSetIFC2X3(test.bootstrap.IFC2X3)` /
// `TestRemoveMaterialSetIFC4(test.bootstrap.IFC4, TestRemoveMaterialSetIFC2X3)`, real
// Python's own multiple-inheritance shape: every base-class test runs on both IFC2X3
// and IFC4). This port additionally runs the shared tests against IFC4X3 too (via
// `describe.each(AVAILABLE_SCHEMAS)`, already CI-safe per `../../bootstrap.ts`),
// matching `./assignMaterial.test.ts`'s/`./copyMaterial.test.ts`'s own established
// precedent.
//
// `api.type.assignType` is already ported -- `test_removing_a_material_set_with_usages`
// uses the real function. `api.pset.addPset` is already ported too, but its sibling
// `api.pset.editPset` has its OWN real, pre-existing, disclosed gap, entirely unrelated
// to this chunk: materializing a NEW typed value from a plain scalar
// (`../pset/editPset.ts`'s own header comment) -- so
// `test_removing_a_material_set_with_properties`'s property is attached directly via
// the same `createTypedValue` workaround `editPset.test.ts`/`./copyMaterial.test.ts`
// themselves already established, bypassing the unrelated blocked `editPset` call
// entirely rather than hitting that gap here.

import { describe, expect, test } from "vitest";
import { addLayer } from "../../../src/api/material/addLayer";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { removeMaterialSet } from "../../../src/api/material/removeMaterialSet";
import { addPset } from "../../../src/api/pset/addPset";
import { assignType } from "../../../src/api/type/assignType";
import { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { entity_instance as NativeEntityInstance } from "../../../src/native/ifcopenshell_native";
import { native } from "../../../src/native/native_loader";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Constructs a standalone, correctly-typed defined-type value (e.g. `IfcLabel("bar")`), bypassing `editPset`'s own disclosed value-materialization gap -- identical technique to `../pset/editPset.test.ts`'s/`./copyMaterial.test.ts`'s own `createTypedValue`. */
function createTypedValue(file: IfcFile, className: string, value: string): EntityInstance {
	const declaration = file.nativeFile.schema().declaration_by_name_with_name(className);
	const handle = file.nativeFile.create_with_declaration_instance_id(declaration, -1);
	new NativeEntityInstance(handle._handle).set_attribute_value(0, { kind: native.STRING, string_value: value });
	return new EntityInstance(handle._handle, file);
}

describe.each(AVAILABLE_SCHEMAS)("api.material.removeMaterialSet (%s)", (schema) => {
	test("removing a material set", () => {
		const file = createTestFile(schema);
		const material = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });

		removeMaterialSet(file, { material });

		expect(file.byType("IfcMaterialLayerSet").length).toBe(0);
	});

	test("removing a material set with associations", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const material = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [wall], material });

		removeMaterialSet(file, { material });

		expect(file.byType("IfcMaterialLayerSet").length).toBe(0);
		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
	});

	test("removing a material set with set items but preserving materials", () => {
		const file = createTestFile(schema);
		const material = addMaterial(file, {});
		const materialSet = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		addLayer(file, { layerSet: materialSet, material });

		removeMaterialSet(file, { material: materialSet });

		expect(file.byType("IfcMaterialLayerSet").length).toBe(0);
		expect(file.byType("IfcMaterialLayer").length).toBe(0);
		expect(file.byType("IfcMaterial").length).toBe(1);
	});

	test("removing a material set with usages", () => {
		const file = createTestFile(schema);
		const material = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
		const elementType = file.createEntity("IfcWallType");
		const element = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element], relatingType: elementType });
		assignMaterial(file, { products: [elementType], material });
		assignMaterial(file, { products: [element], material, type: "IfcMaterialLayerSetUsage" });

		removeMaterialSet(file, { material });

		expect(file.byType("IfcMaterialLayerSet").length).toBe(0);
		expect(file.byType("IfcMaterialLayerSetUsage").length).toBe(0);
	});
});

// --- IFC2X3 doesn't support adding a pset to `IfcMaterialLayerSet` (real Python's own
// `TestRemoveMaterialSetIFC4` class comment) -- IFC4+ only. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.removeMaterialSet (%s) -- IFC4+ only",
	(schema) => {
		test("removing a material set with properties", () => {
			const file = createTestFile(schema);
			const material = addMaterialSet(file, { setType: "IfcMaterialLayerSet" });
			const pset = addPset(file, { product: material, name: "Foo_Bar" });
			const prop = file.createEntity(
				"IfcPropertySingleValue",
				"Foo",
				null,
				createTypedValue(file, "IfcLabel", "Bar"),
				null,
			);
			pset.set("Properties", [prop]);
			expect((material.get("HasProperties") as EntityInstance[]).length).toBe(1);

			removeMaterialSet(file, { material });

			expect(file.byType("IfcMaterialProperties").length).toBe(0);
			expect(file.byType("IfcPropertySingleValue").length).toBe(0);
		});
	},
);
