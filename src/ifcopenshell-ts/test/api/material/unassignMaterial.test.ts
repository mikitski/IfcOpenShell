// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/material/test_unassign_material.py` (src/ifcopenshell-python
// -- `TestUnassignMaterialIFC2X3`/`TestUnassignMaterialIFC4`, IFC4 subclassing IFC2X3
// via multiple inheritance for the shared tests). Real Python's own test suite never
// exercises IFC4X3 at all -- this port additionally runs every IFC2X3+-shared test
// against IFC4X3 too (via `describe.each(AVAILABLE_SCHEMAS)`, already CI-safe per
// `../../bootstrap.ts`), matching `./assignMaterial.test.ts`'s own header comment's
// identical reasoning.
//
// `add_material` is NOT ported (a future `api.material` chunk) -- every real Python
// fixture that used it is rebuilt directly via `file.createEntity`/`withAttrs` instead.

import { describe, expect, test } from "vitest";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { unassignMaterial } from "../../../src/api/material/unassignMaterial";
import { assignType } from "../../../src/api/type/assignType";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { getMaterial } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

// --- Shared across IFC2X3/IFC4/IFC4X3 -- real Python: `TestUnassignMaterialIFC2X3` ---

describe.each(AVAILABLE_SCHEMAS)("api.material.unassignMaterial (%s)", (schema) => {
	test("unassigning a single material", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const material = withAttrs(file, "IfcMaterial", { Name: "CON01" });
		assignMaterial(file, { products: [element1, element2], material });

		unassignMaterial(file, { products: [element1, element2] });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
		expect(file.byType("IfcWall").length).toBe(2);
		expect(file.byType("IfcMaterial").length).toBe(1);
	});

	test("unassigning one of several elements sharing a material keeps the others associated", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const material = withAttrs(file, "IfcMaterial", { Name: "CON01" });
		assignMaterial(file, { products: [element1, element2], material });

		unassignMaterial(file, { products: [element2] });

		expect((element1.get("HasAssociations") as EntityInstance[]).length).toBeGreaterThan(0);
		expect((element2.get("HasAssociations") as EntityInstance[]).length).toBe(0);
		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
		expect(file.byType("IfcWall").length).toBe(2);
		expect(file.byType("IfcMaterial").length).toBe(1);
	});

	test("unassigning a layer set from a type", () => {
		const file = createTestFile(schema);
		const type1 = file.createEntity("IfcWallType");
		const type2 = file.createEntity("IfcWallType");
		assignMaterial(file, { products: [type1, type2], type: "IfcMaterialLayerSet" });

		unassignMaterial(file, { products: [type1, type2] });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
		expect(file.byType("IfcWallType").length).toBe(2);
		expect(file.byType("IfcMaterialLayerSet").length).toBe(1);
	});

	test("unassigning a layer set usage from an occurrence also removes the usage entity", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1, element2], relatingType: elementType });
		assignMaterial(file, { products: [elementType], type: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [element1, element2], type: "IfcMaterialLayerSetUsage" });

		unassignMaterial(file, { products: [element1, element2] });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
		expect((elementType.get("HasAssociations") as EntityInstance[]).length).toBeGreaterThan(0);
		expect(file.byType("IfcWallType").length).toBe(1);
		expect(file.byType("IfcWall").length).toBe(2);
		expect(file.byType("IfcMaterialLayerSet").length).toBe(1);
		expect(file.byType("IfcMaterialLayerSetUsage").length).toBe(0);
	});

	test("unassigning one occurrence's layer set usage does not remove another occurrence's own usage", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1, element2], relatingType: elementType });
		assignMaterial(file, { products: [elementType], type: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [element1], type: "IfcMaterialLayerSetUsage" });
		assignMaterial(file, { products: [element2], type: "IfcMaterialLayerSetUsage" });

		unassignMaterial(file, { products: [element1] });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(2);
		expect((elementType.get("HasAssociations") as EntityInstance[]).length).toBeGreaterThan(0);
		expect(file.byType("IfcWallType").length).toBe(1);
		expect(file.byType("IfcWall").length).toBe(2);
		expect(file.byType("IfcMaterialLayerSet").length).toBe(1);
		expect(file.byType("IfcMaterialLayerSetUsage").length).toBe(1);
	});

	// Real Python: `test_unassign_material_layer_set_usage_from_element_with_multiple_
	// invalid_usages` -- an intentionally-recreated invalid scenario (Revit-style
	// usage-reuse across occurrences), pinning `unassignMaterials`' `issubset`/
	// `relatedObjects` interaction described in `unassignMaterial.ts`'s own header
	// comment.
	test("unassigning one of two occurrences sharing an (invalid, Revit-style) usage keeps the usage for the other", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element], relatingType: elementType });
		assignType(file, { relatedObjects: [element2], relatingType: elementType });
		assignMaterial(file, { products: [elementType], type: "IfcMaterialLayerSet" });
		const rel = assignMaterial(file, { products: [element], type: "IfcMaterialLayerSetUsage" }) as EntityInstance;

		// In some invalid IFCs from Revit, usages are reused across occurrences --
		// recreate this invalid scenario, matching real Python exactly.
		rel.set("RelatedObjects", [...(rel.get("RelatedObjects") as EntityInstance[]), element2]);

		unassignMaterial(file, { products: [element] });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(2);
		for (const r of file.byType("IfcRelAssociatesMaterial")) {
			expect(r.get("RelatingMaterial")).not.toBeNull();
		}
		expect((elementType.get("HasAssociations") as EntityInstance[]).length).toBeGreaterThan(0);
		expect(file.byType("IfcWallType").length).toBe(1);
		expect(file.byType("IfcWall").length).toBe(2);
		expect(file.byType("IfcMaterialLayerSet").length).toBe(1);
		expect(file.byType("IfcMaterialLayerSetUsage").length).toBe(1);
		expect(getMaterial(element, false, false)).toBeNull();
		expect(getMaterial(element2, false, false)?.isA("IfcMaterialLayerSetUsage")).toBe(true);
	});

	test("unassigning an IfcMaterialList", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const material1 = withAttrs(file, "IfcMaterial", { Name: "CON01" });
		assignMaterial(file, { products: [element1, element2], type: "IfcMaterialList", material: material1 });
		const element3 = file.createEntity("IfcWall");
		const material3 = withAttrs(file, "IfcMaterial", { Name: "CON01" });
		assignMaterial(file, { products: [element3], type: "IfcMaterialList", material: material3 });

		unassignMaterial(file, { products: [element1, element2, element3] });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
		expect(file.byType("IfcMaterialList").length).toBe(2);
		expect(file.byType("IfcMaterial").length).toBe(2);
	});

	test("unassigning an empty products list is a no-op", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const material = withAttrs(file, "IfcMaterial", { Name: "CON01" });
		assignMaterial(file, { products: [element], material });

		unassignMaterial(file, { products: [] });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
	});

	test("unassigning a product with no material is a no-op", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");

		expect(() => unassignMaterial(file, { products: [element] })).not.toThrow();
		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
	});
});

// --- IFC4/IFC4X3-only: `IfcMaterialProfileSet`/`IfcMaterialConstituentSet` don't
// exist on IFC2X3 at all. Real Python: `TestUnassignMaterialIFC4`'s own extra tests. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.unassignMaterial (%s) -- IFC4+ only",
	(schema) => {
		test("unassigning a profile set from a type", () => {
			const file = createTestFile(schema);
			const type1 = file.createEntity("IfcWallType");
			assignMaterial(file, { products: [type1], type: "IfcMaterialProfileSet" });
			const type2 = file.createEntity("IfcWallType");
			assignMaterial(file, { products: [type2], type: "IfcMaterialProfileSet" });

			unassignMaterial(file, { products: [type1, type2] });

			expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
			expect(file.byType("IfcWallType").length).toBe(2);
			expect(file.byType("IfcMaterialProfileSet").length).toBe(2);
		});

		test("unassigning a profile set usage from an occurrence", () => {
			const file = createTestFile(schema);
			const elementType = file.createEntity("IfcWallType");
			const element1 = file.createEntity("IfcWall");
			const element2 = file.createEntity("IfcWall");
			assignType(file, { relatedObjects: [element1, element2], relatingType: elementType });
			assignMaterial(file, { products: [elementType], type: "IfcMaterialProfileSet" });
			assignMaterial(file, { products: [element1, element2], type: "IfcMaterialProfileSetUsage" });

			unassignMaterial(file, { products: [element1, element2] });

			expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
			expect((elementType.get("HasAssociations") as EntityInstance[]).length).toBeGreaterThan(0);
			expect(file.byType("IfcWallType").length).toBe(1);
			expect(file.byType("IfcWall").length).toBe(2);
			expect(file.byType("IfcMaterialProfileSet").length).toBe(1);
			expect(file.byType("IfcMaterialProfileSetUsage").length).toBe(0);
		});

		test("unassigning a constituent set from a type", () => {
			const file = createTestFile(schema);
			const type1 = file.createEntity("IfcWallType");
			const type2 = file.createEntity("IfcWallType");
			assignMaterial(file, { products: [type1, type2], type: "IfcMaterialConstituentSet" });
			const type3 = file.createEntity("IfcWallType");
			assignMaterial(file, { products: [type3], type: "IfcMaterialConstituentSet" });

			unassignMaterial(file, { products: [type1, type2, type3] });

			expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
			expect(file.byType("IfcWallType").length).toBe(3);
			expect(file.byType("IfcMaterialConstituentSet").length).toBe(2);
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.material.unassignMaterial Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the unassigned material; redo removes it again", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const material = withAttrs(file, "IfcMaterial", { Name: "CON01" });
		assignMaterial(file, { products: [element], material });

		file.beginTransaction();
		unassignMaterial(file, { products: [element] });
		file.endTransaction();

		expect(getMaterial(element)).toBeNull();

		file.undo();
		expect(getMaterial(element)?.equals(material)).toBe(true);

		file.redo();
		expect(getMaterial(element)).toBeNull();
	});
});
