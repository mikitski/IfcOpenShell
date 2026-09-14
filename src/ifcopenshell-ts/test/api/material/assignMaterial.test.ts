// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/material/test_assign_material.py` (src/ifcopenshell-python
// -- `TestAssignMaterialIFC2X3`/`TestAssignMaterialIFC4`, IFC4 subclassing IFC2X3 via
// multiple inheritance for the shared tests, with its own extra profile-set/
// constituent-set cases). Real Python's own test suite never exercises IFC4X3 at all
// (no `TestAssignMaterialIFC4X3` class exists) -- this port additionally runs every
// IFC2X3+-shared test against IFC4X3 too (via `describe.each(AVAILABLE_SCHEMAS)`,
// already CI-safe per `../../bootstrap.ts`), since `ifc4x3.d.ts` confirms identical
// attribute shapes to `ifc4.d.ts` for every entity this function constructs -- a
// reasonable superset of real Python's own coverage, not a deviation from it.
//
// `add_material`/`add_material_set`/`add_layer`/`add_profile`/`add_constituent` are
// NOT ported (future `api.material` chunks) -- every real Python fixture that used one
// of those is rebuilt directly via `file.createEntity`/`withAttrs` instead, matching
// this project's established substitution precedent (e.g.
// `../root/removeProduct.test.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
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

// --- Shared across IFC2X3/IFC4/IFC4X3 -- real Python: `TestAssignMaterialIFC2X3` ---

describe.each(AVAILABLE_SCHEMAS)("api.material.assignMaterial (%s)", (schema) => {
	test("assigning a single IfcMaterial to elements", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const material = withAttrs(file, "IfcMaterial", { Name: "CON01" });

		assignMaterial(file, { products: [element1, element2], type: "IfcMaterial", material });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
		expect(getMaterial(element1)?.equals(material)).toBe(true);
		expect(getMaterial(element2)?.equals(material)).toBe(true);
	});

	test("assigning IfcMaterial without providing one creates a fresh material", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");

		assignMaterial(file, { products: [element], type: "IfcMaterial", material: null });

		expect(getMaterial(element)).not.toBeNull();
	});

	test("assigning a single IfcMaterial to types", () => {
		const file = createTestFile(schema);
		const type1 = file.createEntity("IfcWallType");
		const type2 = file.createEntity("IfcWallType");
		const material = withAttrs(file, "IfcMaterial", { Name: "CON01" });

		assignMaterial(file, { products: [type1, type2], type: "IfcMaterial", material });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
		expect(getMaterial(type1)?.equals(material)).toBe(true);
		expect(getMaterial(type2)?.equals(material)).toBe(true);
	});

	test("assigning a fresh IfcMaterialLayerSet to types", () => {
		const file = createTestFile(schema);
		const type1 = file.createEntity("IfcWallType");
		const type2 = file.createEntity("IfcWallType");

		assignMaterial(file, { products: [type1, type2], type: "IfcMaterialLayerSet" });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
		const materialSet = getMaterial(type1) as EntityInstance;
		expect(materialSet.isA("IfcMaterialLayerSet")).toBe(true);
		expect((materialSet.get("MaterialLayers") as EntityInstance[] | null) ?? []).toHaveLength(0);
		expect(getMaterial(type2)?.equals(materialSet)).toBe(true);
	});

	test("assigning a layer set to a type, then a layer set usage to its occurrences", () => {
		const file = createTestFile(schema);
		const elementType = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1, element2], relatingType: elementType });

		assignMaterial(file, { products: [elementType], type: "IfcMaterialLayerSet" });
		assignMaterial(file, { products: [element1, element2], type: "IfcMaterialLayerSetUsage" });

		const materialSet = getMaterial(elementType);
		const usage1 = getMaterial(element1, false, false) as EntityInstance;
		expect(usage1.isA("IfcMaterialLayerSetUsage")).toBe(true);
		expect((usage1.get("ForLayerSet") as EntityInstance).equals(materialSet as EntityInstance)).toBe(true);
		expect(getMaterial(element2, false, false)?.equals(usage1)).toBe(true);
	});

	test("layer set usage differs across different types (each type keeps its own set/usage)", () => {
		const file = createTestFile(schema);
		const elementType1 = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1], relatingType: elementType1 });
		assignMaterial(file, { products: [elementType1], type: "IfcMaterialLayerSet" });

		const elementType2 = file.createEntity("IfcWallType");
		const element2 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element2], relatingType: elementType2 });
		assignMaterial(file, { products: [elementType2], type: "IfcMaterialLayerSet" });

		assignMaterial(file, { products: [element1, element2], type: "IfcMaterialLayerSetUsage" });

		const materialSet1 = getMaterial(elementType1);
		const usage1 = getMaterial(element1, false, false) as EntityInstance;
		expect(usage1.isA("IfcMaterialLayerSetUsage")).toBe(true);
		expect((usage1.get("ForLayerSet") as EntityInstance).equals(materialSet1 as EntityInstance)).toBe(true);

		const materialSet2 = getMaterial(elementType2);
		const usage2 = getMaterial(element2, false, false) as EntityInstance;
		expect(usage2.isA("IfcMaterialLayerSetUsage")).toBe(true);
		expect((usage2.get("ForLayerSet") as EntityInstance).equals(materialSet2 as EntityInstance)).toBe(true);
		expect(usage2.equals(usage1)).toBe(false);
	});

	// Real Python: `test_assign_element_layer_set_usage_is_different_for_different_
	// layer_set_directions` -- also the concrete regression test for this file's own
	// header comment's quirk 3 (`assignMaterial.ts`'s dead "type -> material set"
	// cache): both elements are type-less, so real Python's own dead cache would (if it
	// were ever "fixed") wrongly make them share one `IfcMaterialLayerSet` -- this pins
	// the actual, faithfully-ported behavior of two DISTINCT sets instead.
	test("layer set usage differs by direction for type-less occurrences (AXIS2 vs AXIS3)", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall"); // AXIS2
		const element2 = file.createEntity("IfcSlab"); // AXIS3

		assignMaterial(file, { products: [element1, element2], type: "IfcMaterialLayerSetUsage" });

		const usage1 = getMaterial(element1, false, false) as EntityInstance;
		expect(usage1.isA("IfcMaterialLayerSetUsage")).toBe(true);
		const materialSet1 = usage1.get("ForLayerSet") as EntityInstance;
		expect(materialSet1.isA("IfcMaterialLayerSet")).toBe(true);
		expect(usage1.get("LayerSetDirection")).toBe("AXIS2");

		const usage2 = getMaterial(element2, false, false) as EntityInstance;
		expect(usage2.isA("IfcMaterialLayerSetUsage")).toBe(true);
		const materialSet2 = usage2.get("ForLayerSet") as EntityInstance;
		expect(materialSet2.isA("IfcMaterialLayerSet")).toBe(true);
		expect(usage2.get("LayerSetDirection")).toBe("AXIS3");

		expect(materialSet1.equals(materialSet2)).toBe(false);
		expect(usage1.equals(usage2)).toBe(false);
	});

	test("assigning an IfcMaterialList", () => {
		const file = createTestFile(schema);
		const element1 = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const material = withAttrs(file, "IfcMaterial", { Name: "CON01" });

		assignMaterial(file, { products: [element1, element2], type: "IfcMaterialList", material });

		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
		const materialList = getMaterial(element1) as EntityInstance;
		expect(materialList.isA("IfcMaterialList")).toBe(true);
		expect((materialList.get("Materials") as EntityInstance[])[0].equals(material)).toBe(true);
		expect(getMaterial(element2)?.equals(materialList)).toBe(true);
	});

	test("assigning a layer set usage with an explicitly provided material set", () => {
		const file = createTestFile(schema);
		const elementType1 = file.createEntity("IfcWallType");
		const element1 = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [element1], relatingType: elementType1 });
		assignMaterial(file, { products: [elementType1], type: "IfcMaterialLayerSet" });

		const providedMaterialSet = file.createEntity("IfcMaterialLayerSet");
		assignMaterial(file, {
			products: [element1],
			material: providedMaterialSet,
			type: "IfcMaterialLayerSetUsage",
		});

		expect(getMaterial(element1, true, true)?.equals(providedMaterialSet)).toBe(true);
	});

	test("providing a material set class that doesn't match the Usage type throws", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		// `IfcMaterialList` exists on all 3 schemas (unlike `IfcMaterialConstituentSet`/
		// `IfcMaterialProfileSet`, IFC4+ only) -- picked purely so this test runs
		// identically across `describe.each(AVAILABLE_SCHEMAS)`.
		const wrongSet = file.createEntity("IfcMaterialList");

		expect(() =>
			assignMaterial(file, { products: [element], material: wrongSet, type: "IfcMaterialLayerSetUsage" }),
		).toThrow(/cannot be assiged as a IfcMaterialLayerSetUsage/);
	});

	test("assigning to an empty products list is a no-op returning null", () => {
		const file = createTestFile(schema);
		expect(assignMaterial(file, { products: [] })).toBeNull();
		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(0);
	});

	// Real Python: `execute()`'s own "we always reassign material, even if it might be
	// assigned before" comment -- assigning again reassigns rather than accumulating.
	test("reassigning a material replaces the previous association", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const material1 = withAttrs(file, "IfcMaterial", { Name: "CON01" });
		const material2 = withAttrs(file, "IfcMaterial", { Name: "CON02" });

		assignMaterial(file, { products: [element], material: material1 });
		assignMaterial(file, { products: [element], material: material2 });

		expect(getMaterial(element)?.equals(material2)).toBe(true);
		expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
	});
});

// --- IFC4/IFC4X3-only: `IfcMaterialProfileSet`/`IfcMaterialConstituentSet` don't
// exist on IFC2X3 at all. Real Python: `TestAssignMaterialIFC4`'s own extra tests. ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.assignMaterial (%s) -- IFC4+ only",
	(schema) => {
		// This file's own header comment, quirk 2: a dispatch-order edge case with no
		// direct real Python test counterpart (not reached by any of
		// `test_assign_material.py`'s own scenarios), but real, load-bearing dispatch
		// logic -- pinned here so it can't silently regress. `IfcMaterialConstituentSet`
		// doesn't exist on IFC2X3 at all, so this test is IFC4+-only, unlike the rest of
		// this file's dispatch/reuse coverage.
		test("a non-IfcMaterial `material` under a mismatched, non-Usage `type` bypasses the type-specific branch entirely", () => {
			const file = createTestFile(schema);
			const element = file.createEntity("IfcWall");
			// A pre-built layer set, reused directly as `RelatingMaterial` -- NOT wrapped in
			// a fresh `IfcMaterialConstituentSet`, despite `type: "IfcMaterialConstituentSet"`.
			const preBuiltSet = file.createEntity("IfcMaterialLayerSet");

			const rel = assignMaterial(file, {
				products: [element],
				type: "IfcMaterialConstituentSet",
				material: preBuiltSet,
			}) as EntityInstance;

			expect(file.byType("IfcMaterialConstituentSet").length).toBe(0);
			expect((rel.get("RelatingMaterial") as EntityInstance).equals(preBuiltSet)).toBe(true);
		});

		test("assigning a fresh IfcMaterialProfileSet to types", () => {
			const file = createTestFile(schema);
			const type1 = file.createEntity("IfcWallType");
			const type2 = file.createEntity("IfcWallType");

			assignMaterial(file, { products: [type1, type2], type: "IfcMaterialProfileSet" });

			expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
			const materialSet = getMaterial(type1) as EntityInstance;
			expect(materialSet.isA("IfcMaterialProfileSet")).toBe(true);
			expect((materialSet.get("MaterialProfiles") as EntityInstance[] | null) ?? []).toHaveLength(0);
			expect(getMaterial(type2)?.equals(materialSet)).toBe(true);
		});

		test("assigning a profile set to a type, then a profile set usage to its occurrences", () => {
			const file = createTestFile(schema);
			const elementType = file.createEntity("IfcWallType");
			const element1 = file.createEntity("IfcWall");
			const element2 = file.createEntity("IfcWall");
			assignType(file, { relatedObjects: [element1, element2], relatingType: elementType });

			assignMaterial(file, { products: [elementType], type: "IfcMaterialProfileSet" });
			assignMaterial(file, { products: [element1, element2], type: "IfcMaterialProfileSetUsage" });

			const materialSet = (elementType.get("HasAssociations") as EntityInstance[])[0].get(
				"RelatingMaterial",
			) as EntityInstance;
			const usage1 = (element1.get("HasAssociations") as EntityInstance[])[0].get("RelatingMaterial") as EntityInstance;
			expect(usage1.isA("IfcMaterialProfileSetUsage")).toBe(true);
			expect((usage1.get("ForProfileSet") as EntityInstance).equals(materialSet)).toBe(true);
			expect(getMaterial(element2, false, false)?.equals(usage1)).toBe(true);
		});

		test("profile set usage differs across different types", () => {
			const file = createTestFile(schema);
			const elementType1 = file.createEntity("IfcWallType");
			const element1 = file.createEntity("IfcWall");
			assignType(file, { relatedObjects: [element1], relatingType: elementType1 });
			assignMaterial(file, { products: [elementType1], type: "IfcMaterialProfileSet" });

			const elementType2 = file.createEntity("IfcWallType");
			const element2 = file.createEntity("IfcWall");
			assignType(file, { relatedObjects: [element2], relatingType: elementType2 });
			assignMaterial(file, { products: [elementType2], type: "IfcMaterialProfileSet" });

			assignMaterial(file, { products: [element1, element2], type: "IfcMaterialProfileSetUsage" });

			const materialSet1 = getMaterial(elementType1);
			const usage1 = getMaterial(element1, false, false) as EntityInstance;
			expect(usage1.isA("IfcMaterialProfileSetUsage")).toBe(true);
			expect((usage1.get("ForProfileSet") as EntityInstance).equals(materialSet1 as EntityInstance)).toBe(true);

			const materialSet2 = getMaterial(elementType2);
			const usage2 = getMaterial(element2, false, false) as EntityInstance;
			expect(usage2.isA("IfcMaterialProfileSetUsage")).toBe(true);
			expect((usage2.get("ForProfileSet") as EntityInstance).equals(materialSet2 as EntityInstance)).toBe(true);
			expect(usage2.equals(usage1)).toBe(false);
		});

		test("assigning a fresh IfcMaterialConstituentSet to types", () => {
			const file = createTestFile(schema);
			const type1 = file.createEntity("IfcWallType");
			const type2 = file.createEntity("IfcWallType");

			assignMaterial(file, { products: [type1, type2], type: "IfcMaterialConstituentSet" });

			expect(file.byType("IfcRelAssociatesMaterial").length).toBe(1);
			const materialSet = getMaterial(type1) as EntityInstance;
			expect(materialSet.isA("IfcMaterialConstituentSet")).toBe(true);
			expect((materialSet.get("MaterialConstituents") as EntityInstance[] | null) ?? []).toHaveLength(0);
			expect(getMaterial(type2)?.equals(materialSet)).toBe(true);
		});

		test("assigning a profile set usage with an explicitly provided material set", () => {
			const file = createTestFile(schema);
			const elementType1 = file.createEntity("IfcWallType");
			const element1 = file.createEntity("IfcWall");
			assignType(file, { relatedObjects: [element1], relatingType: elementType1 });
			assignMaterial(file, { products: [elementType1], type: "IfcMaterialProfileSet" });

			const providedMaterialSet = file.createEntity("IfcMaterialProfileSet");
			assignMaterial(file, {
				products: [element1],
				material: providedMaterialSet,
				type: "IfcMaterialProfileSetUsage",
			});

			expect(getMaterial(element1, true, true)?.equals(providedMaterialSet)).toBe(true);
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.material.assignMaterial Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the pre-assignment state; redo re-applies the association", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const material = withAttrs(file, "IfcMaterial", { Name: "CON01" });

		file.beginTransaction();
		assignMaterial(file, { products: [element], material });
		file.endTransaction();

		expect(getMaterial(element)?.equals(material)).toBe(true);

		file.undo();
		expect(getMaterial(element)).toBeNull();

		file.redo();
		expect(getMaterial(element)?.equals(material)).toBe(true);
	});
});
