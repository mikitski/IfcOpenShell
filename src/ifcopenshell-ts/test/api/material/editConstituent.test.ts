// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_constituent.py` (no `test_edit_constituent.py`
// counterpart -- confirmed by directory listing of `src/ifcopenshell-python/test/api/
// material/`). Tests below are new, exercising the real Python source's own disclosed
// behavior directly (see `../../../src/api/material/editConstituent.ts`'s own header
// comment): `attributes` are applied via a plain setter loop, and -- unlike
// `./editLayer.test.ts`'s guarded `Material` swap -- `Material` is set UNCONDITIONALLY
// here, even when omitted (a real, disclosed Python quirk). `IfcMaterialConstituent`
// doesn't exist on IFC2X3 at all, so every test here runs IFC4/IFC4X3 only.

import { describe, expect, test } from "vitest";
import { addConstituent } from "../../../src/api/material/addConstituent";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { editConstituent } from "../../../src/api/material/editConstituent";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.material.editConstituent (%s)", (schema) => {
	test("edits attributes on the constituent", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet", name: "Window" });
		const aluminium1 = addMaterial(file, { name: "AL01", category: "aluminium" });
		const framing = addConstituent(file, { constituentSet, material: aluminium1 });

		editConstituent(file, { constituent: framing, attributes: { Name: "Framing" }, material: aluminium1 });

		expect(framing.get("Name")).toBe("Framing");
	});

	test("swaps the Material when provided", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet", name: "Window" });
		const aluminium1 = addMaterial(file, { name: "AL01", category: "aluminium" });
		const aluminium2 = addMaterial(file, { name: "AL02", category: "aluminium" });
		const framing = addConstituent(file, { constituentSet, material: aluminium1 });

		editConstituent(file, { constituent: framing, attributes: { Name: "Framing" }, material: aluminium2 });

		expect((framing.get("Material") as EntityInstance).equals(aluminium2)).toBe(true);
	});

	// See `../../../src/api/material/editConstituent.ts`'s own header comment: real
	// Python sets `Material` UNCONDITIONALLY, even when the caller didn't pass one.
	test("sets Material to null when omitted, matching real Python's unconditional assignment", () => {
		const file = createTestFile(schema);
		const constituentSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet", name: "Window" });
		const glass = addMaterial(file, { name: "GLZ01", category: "glass" });
		const glazing = addConstituent(file, { constituentSet, material: glass });

		editConstituent(file, { constituent: glazing, attributes: { Name: "Glazing" } });

		expect(glazing.get("Name")).toBe("Glazing");
		expect(glazing.get("Material")).toBeNull();
	});
});
