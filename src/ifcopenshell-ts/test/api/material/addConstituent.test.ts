// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `add_constituent.py` (no `test_add_constituent.py`
// counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new, exercising the
// real Python source's own disclosed behavior directly (see `../../../src/api/material
// /addConstituent.ts`'s own header comment): `IfcMaterialConstituent` doesn't exist on
// IFC2X3 at all, so every test here runs IFC4/IFC4X3 only; `Name` is always set at
// creation time (even `null`), unlike `./addProfile.test.ts`'s conditional
// `Material`/`Profile` handling -- `Material` here is a required, always-set
// parameter.

import { describe, expect, test } from "vitest";
import { addConstituent } from "../../../src/api/material/addConstituent";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.material.addConstituent (%s)", (schema) => {
	test("adds a constituent with a material and name", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet", name: "Window" });
		const aluminium = addMaterial(file, { name: "AL01", category: "aluminium" });

		const constituent = addConstituent(file, { constituentSet, material: aluminium, name: "Framing" });

		expect(constituent.isA("IfcMaterialConstituent")).toBe(true);
		expect(constituent.get("Name")).toBe("Framing");
		expect((constituent.get("Material") as EntityInstance).equals(aluminium)).toBe(true);
		expect((constituentSet.get("MaterialConstituents") as EntityInstance[]).map((c) => c.identity())).toEqual([
			constituent.identity(),
		]);
	});

	test("leaves Name unset when omitted", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
		const aluminium = addMaterial(file, { name: "AL01" });

		const constituent = addConstituent(file, { constituentSet, material: aluminium });

		expect(constituent.get("Name")).toBeNull();
	});

	test("appends subsequent constituents, preserving order", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet", name: "Window" });
		const aluminium = addMaterial(file, { name: "AL01", category: "aluminium" });
		const glass = addMaterial(file, { name: "GLZ01", category: "glass" });

		const framing = addConstituent(file, { constituentSet, material: aluminium, name: "Framing" });
		const glazing = addConstituent(file, { constituentSet, material: glass, name: "Glazing" });

		expect((constituentSet.get("MaterialConstituents") as EntityInstance[]).map((c) => c.identity())).toEqual([
			framing.identity(),
			glazing.identity(),
		]);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.addConstituent Transaction/undo-redo (%s)",
	(schema) => {
		test("undo removes the created constituent; redo recreates it", () => {
			const file = createTestFile(schema);
			const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
			const aluminium = addMaterial(file, { name: "AL01" });

			file.beginTransaction();
			addConstituent(file, { constituentSet, material: aluminium, name: "Framing" });
			file.endTransaction();

			expect(file.byType("IfcMaterialConstituent").length).toBe(1);

			file.undo();
			expect(file.byType("IfcMaterialConstituent").length).toBe(0);

			file.redo();
			expect(file.byType("IfcMaterialConstituent").length).toBe(1);
			expect(file.byType("IfcMaterialConstituent")[0].get("Name")).toBe("Framing");
		});
	},
);
