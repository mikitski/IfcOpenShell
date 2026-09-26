// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_assign_representation.py`
// (src/ifcopenshell-python, `TestAssignRepresentation`/`TestAssignRepresentationIFC2X3`/
// `TestAssignRepresentationIFC4X3`). Every real Python test is ported below, run against
// every schema this build has registered (`AVAILABLE_SCHEMAS`, see `../../bootstrap.ts`'s
// own header comment for why CI's IFC4-only native build gates this).
//
// Real Python's own last test (`test_assigning_to_an_instance_with_a_geometric_profile_
// layer_based_type_only_adds_it_to_the_instance`) builds its fixture via
// `ifcopenshell.api.material.add_material_set` -- not ported yet (only
// `assignMaterial`/`unassignMaterial`/`copyMaterial` have landed so far, see
// `../../../src/api/material/index.ts`). Reproduced here instead via
// `assignMaterial(file, { products: [...], type: "IfcMaterialLayerSet" | "IfcMaterialProfileSet" })`
// directly (already fully ported), which real `add_material_set` +
// `assign_material` together boil down to for a brand new, unshared set -- the
// resulting fixture (a fresh `IfcMaterialLayerSet`/`IfcMaterialProfileSet` associated to
// `walltype`) is identical either way; only the construction path differs. Real
// Python's own `material_set_types` tuple skips `IfcMaterialProfileSet` on IFC2X3 (the
// class doesn't exist in that schema) -- reproduced with the same schema check.
//
// Entity comparisons throughout use `.equals()`/`.id()` rather than reference/deep
// equality, matching this project's established convention (`.get()` returns a fresh
// wrapper object per access, not a stable per-pointer identity -- see
// `removeRepresentation.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { assignRepresentation } from "../../../src/api/geometry/assignRepresentation";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { assignType } from "../../../src/api/type/assignType";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function representationsOf(product: EntityInstance): EntityInstance[] {
	const definition = product.get("Representation") as EntityInstance | null;
	if (!definition) return [];
	return (definition.get("Representations") as EntityInstance[] | null) ?? [];
}

function mappingSourceOf(representation: EntityInstance): EntityInstance {
	const items = representation.get("Items") as EntityInstance[];
	return items[0]?.get("MappingSource") as EntityInstance;
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.assignRepresentation (%s)", (schema) => {
	test("assigning to a product", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const rep = file.createEntity("IfcShapeRepresentation");

		assignRepresentation(file, { product: wall, representation: rep });

		const representations = representationsOf(wall);
		expect(representations).toHaveLength(1);
		expect(representations[0]?.equals(rep)).toBe(true);
	});

	test("assigning to a product with existing representations", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const rep = file.createEntity("IfcShapeRepresentation");
		const rep2 = file.createEntity("IfcShapeRepresentation");

		assignRepresentation(file, { product: wall, representation: rep });
		assignRepresentation(file, { product: wall, representation: rep2 });

		const representations = representationsOf(wall);
		expect(representations.map((r) => r.id())).toEqual([rep.id(), rep2.id()]);
	});

	test("assigning to a type product", () => {
		const file = createTestFile(schema);
		const wallType = file.createEntity("IfcWallType");
		const rep = file.createEntity("IfcShapeRepresentation");
		const rep2 = file.createEntity("IfcShapeRepresentation");

		assignRepresentation(file, { product: wallType, representation: rep });
		assignRepresentation(file, { product: wallType, representation: rep2 });

		const maps = wallType.get("RepresentationMaps") as EntityInstance[];
		expect((maps[0]?.get("MappedRepresentation") as EntityInstance).equals(rep)).toBe(true);
		expect((maps[1]?.get("MappedRepresentation") as EntityInstance).equals(rep2)).toBe(true);
	});

	test("assigning to a type will map representations to instances", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const wallType = file.createEntity("IfcWallType");
		assignType(file, { relatedObjects: [wall], relatingType: wallType });
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const rep = file.createEntity("IfcShapeRepresentation", context);
		const rep2 = file.createEntity("IfcShapeRepresentation", context);

		assignRepresentation(file, { product: wallType, representation: rep });
		assignRepresentation(file, { product: wallType, representation: rep2 });

		const representations = representationsOf(wall);
		const maps = wallType.get("RepresentationMaps") as EntityInstance[];

		expect(representations[0]?.get("RepresentationType")).toBe("MappedRepresentation");
		expect(
			(mappingSourceOf(representations[0] as EntityInstance).get("MappedRepresentation") as EntityInstance).equals(rep),
		).toBe(true);
		expect(mappingSourceOf(representations[0] as EntityInstance).equals(maps[0] as EntityInstance)).toBe(true);

		expect(representations[1]?.get("RepresentationType")).toBe("MappedRepresentation");
		expect(
			(mappingSourceOf(representations[1] as EntityInstance).get("MappedRepresentation") as EntityInstance).equals(
				rep2,
			),
		).toBe(true);
		expect(mappingSourceOf(representations[1] as EntityInstance).equals(maps[1] as EntityInstance)).toBe(true);
	});

	test("assigning to an instance with a geometric type adds it to both the instance and type", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const rep = file.createEntity("IfcShapeRepresentation", context);
		const rep2 = file.createEntity("IfcShapeRepresentation", context);

		const wallType = file.createEntity("IfcWallType");
		assignRepresentation(file, { product: wallType, representation: rep });

		const wall = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [wall], relatingType: wallType });

		assignRepresentation(file, { product: wall, representation: rep2 });

		const representations = representationsOf(wall);
		const maps = wallType.get("RepresentationMaps") as EntityInstance[];

		expect(representations[0]?.get("RepresentationType")).toBe("MappedRepresentation");
		expect(
			(mappingSourceOf(representations[0] as EntityInstance).get("MappedRepresentation") as EntityInstance).equals(rep),
		).toBe(true);
		expect((maps[0]?.get("MappedRepresentation") as EntityInstance).equals(rep)).toBe(true);

		expect(representations[1]?.get("RepresentationType")).toBe("MappedRepresentation");
		expect(
			(mappingSourceOf(representations[1] as EntityInstance).get("MappedRepresentation") as EntityInstance).equals(
				rep2,
			),
		).toBe(true);
		expect((maps[1]?.get("MappedRepresentation") as EntityInstance).equals(rep2)).toBe(true);
	});

	test("assigning to an instance with a nongeometric type only adds it to the instance", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const rep = file.createEntity("IfcShapeRepresentation", context);
		const wallType = file.createEntity("IfcWallType");
		const wall = file.createEntity("IfcWall");
		assignType(file, { relatedObjects: [wall], relatingType: wallType });

		assignRepresentation(file, { product: wall, representation: rep });

		const representations = representationsOf(wall);
		expect(representations[0]?.get("RepresentationType")).not.toBe("MappedRepresentation");
		expect(representations[0]?.equals(rep)).toBe(true);
		expect((wallType.get("RepresentationMaps") as EntityInstance[] | null) ?? []).toHaveLength(0);
	});

	test("assigning to an instance with a geometric profile/layer based type only adds it to the instance", () => {
		const materialSetTypes: Array<"IfcMaterialLayerSet" | "IfcMaterialProfileSet"> =
			schema === "IFC2X3" ? ["IfcMaterialLayerSet"] : ["IfcMaterialLayerSet", "IfcMaterialProfileSet"];

		for (const materialSetType of materialSetTypes) {
			const file = createTestFile(schema);
			const context = file.createEntity("IfcGeometricRepresentationContext");
			const rep = file.createEntity("IfcShapeRepresentation", context);
			const rep2 = file.createEntity("IfcShapeRepresentation", context);

			const wallType = file.createEntity("IfcWallType");
			assignRepresentation(file, { product: wallType, representation: rep });
			assignMaterial(file, { products: [wallType], type: materialSetType });

			const wall = file.createEntity("IfcWall");
			assignType(file, { relatedObjects: [wall], relatingType: wallType, shouldMapRepresentations: false });

			assignRepresentation(file, { product: wall, representation: rep2 });

			const representations = representationsOf(wall);
			expect(representations).toHaveLength(1);
			expect(representations[0]?.get("RepresentationType")).not.toBe("MappedRepresentation");
			expect(representations[0]?.equals(rep2)).toBe(true);

			const maps = wallType.get("RepresentationMaps") as EntityInstance[];
			expect(maps).toHaveLength(1);
			expect((maps[0]?.get("MappedRepresentation") as EntityInstance).equals(rep)).toBe(true);
		}
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.geometry.assignRepresentation Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the product's prior representation state; redo re-applies it", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const rep = file.createEntity("IfcShapeRepresentation");
		const wallId = wall.id();

		file.beginTransaction();
		assignRepresentation(file, { product: wall, representation: rep });
		file.endTransaction();

		expect(representationsOf(file.byId(wallId))).toHaveLength(1);

		file.undo();
		expect(file.byId(wallId).get("Representation")).toBeNull();

		file.redo();
		expect(representationsOf(file.byId(wallId))).toHaveLength(1);
	});

	test("undo restores a type's RepresentationMaps and the cascade onto its occurrences", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const wallType = file.createEntity("IfcWallType");
		assignType(file, { relatedObjects: [wall], relatingType: wallType });
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const rep = file.createEntity("IfcShapeRepresentation", context);
		const wallId = wall.id();
		const wallTypeId = wallType.id();

		file.beginTransaction();
		assignRepresentation(file, { product: wallType, representation: rep });
		file.endTransaction();

		expect(representationsOf(file.byId(wallId))).toHaveLength(1);
		expect((file.byId(wallTypeId).get("RepresentationMaps") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect(representationsOf(file.byId(wallId))).toHaveLength(0);
		expect((file.byId(wallTypeId).get("RepresentationMaps") as EntityInstance[] | null) ?? []).toHaveLength(0);

		file.redo();
		expect(representationsOf(file.byId(wallId))).toHaveLength(1);
		expect((file.byId(wallTypeId).get("RepresentationMaps") as EntityInstance[]).length).toBe(1);
	});
});
