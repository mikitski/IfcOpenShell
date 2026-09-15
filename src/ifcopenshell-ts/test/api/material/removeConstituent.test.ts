// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `remove_constituent.py` (no
// `test_remove_constituent.py` counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new, exercising the
// real Python source's own disclosed behavior directly (see `../../../src/api/material
// /removeConstituent.ts`'s own header comment, and `./removeLayer.test.ts`'s identical
// shape for the sibling class): `IfcMaterialConstituent` doesn't exist on IFC2X3 at
// all, so every test here runs IFC4/IFC4X3 only.

import { describe, expect, test } from "vitest";
import { addConstituent } from "../../../src/api/material/addConstituent";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { removeConstituent } from "../../../src/api/material/removeConstituent";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.material.removeConstituent (%s)", (schema) => {
	test("removes the constituent from its constituent set", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
		const aluminium = addMaterial(file, { name: "AL01" });
		const glass = addMaterial(file, { name: "GLZ01" });
		const framing = addConstituent(file, { constituentSet, material: aluminium, name: "Framing" });
		const glazing = addConstituent(file, { constituentSet, material: glass, name: "Glazing" });

		removeConstituent(file, { constituent: glazing });

		expect(file.byType("IfcMaterialConstituent").length).toBe(1);
		expect((constituentSet.get("MaterialConstituents") as EntityInstance[]).map((c) => c.identity())).toEqual([
			framing.identity(),
		]);
	});

	test("does not remove the material by default", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
		const glass = addMaterial(file, { name: "GLZ01" });
		const glazing = addConstituent(file, { constituentSet, material: glass });

		removeConstituent(file, { constituent: glazing });

		expect(file.byType("IfcMaterial").length).toBe(1);
	});

	test("removes an orphaned material when shouldRemoveMaterial is true", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
		const glass = addMaterial(file, { name: "GLZ01" });
		const glazing = addConstituent(file, { constituentSet, material: glass });

		removeConstituent(file, { constituent: glazing, shouldRemoveMaterial: true });

		expect(file.byType("IfcMaterial").length).toBe(0);
	});

	test("keeps a material with other users even when shouldRemoveMaterial is true", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
		const glass = addMaterial(file, { name: "GLZ01" });
		addConstituent(file, { constituentSet, material: glass });
		const glazing2 = addConstituent(file, { constituentSet, material: glass });

		removeConstituent(file, { constituent: glazing2, shouldRemoveMaterial: true });

		expect(file.byType("IfcMaterial").length).toBe(1);
	});
});
