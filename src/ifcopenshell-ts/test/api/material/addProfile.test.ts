// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `add_profile.py` (no `test_add_profile.py`
// counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new, exercising the
// real Python source's own disclosed behavior directly (see `../../../src/api/material
// /addProfile.ts`'s own header comment): `IfcMaterialProfile` doesn't exist on IFC2X3
// at all, so every test here runs IFC4/IFC4X3 only; `Name` is always set at creation
// time (even `null`), while `Material`/`Profile` are each conditionally set
// afterward.

import { describe, expect, test } from "vitest";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { addProfile } from "../../../src/api/material/addProfile";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.material.addProfile (%s)", (schema) => {
	test("adds a profile item with material and profile", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const steel = addMaterial(file, { name: "ST01", category: "steel" });
		const hea100 = file.createEntity("IfcIShapeProfileDef", "AREA", "HEA100", null, 100, 96, 5, 8, 12);

		const profile = addProfile(file, { profileSet, material: steel, profile: hea100 });

		expect(profile.isA("IfcMaterialProfile")).toBe(true);
		expect((profile.get("Material") as EntityInstance).equals(steel)).toBe(true);
		expect((profile.get("Profile") as EntityInstance).equals(hea100)).toBe(true);
		expect((profileSet.get("MaterialProfiles") as EntityInstance[]).map((p) => p.identity())).toEqual([
			profile.identity(),
		]);
	});

	test("sets the profile item's Name when provided", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });

		const profile = addProfile(file, { profileSet, name: "B1" });

		expect(profile.get("Name")).toBe("B1");
	});

	test("material and profile are optional and left unset when omitted", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });

		const profile = addProfile(file, { profileSet });

		expect(profile.get("Name")).toBeNull();
		expect(profile.get("Material")).toBeNull();
		expect(profile.get("Profile")).toBeNull();
	});

	test("appends subsequent profile items, preserving order", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });

		const profile1 = addProfile(file, { profileSet, name: "P1" });
		const profile2 = addProfile(file, { profileSet, name: "P2" });

		expect((profileSet.get("MaterialProfiles") as EntityInstance[]).map((p) => p.identity())).toEqual([
			profile1.identity(),
			profile2.identity(),
		]);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.material.addProfile Transaction/undo-redo (%s)",
	(schema) => {
		test("undo removes the created profile; redo recreates it", () => {
			const file = createTestFile(schema);
			const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });

			file.beginTransaction();
			addProfile(file, { profileSet, name: "B1" });
			file.endTransaction();

			expect(file.byType("IfcMaterialProfile").length).toBe(1);

			file.undo();
			expect(file.byType("IfcMaterialProfile").length).toBe(0);

			file.redo();
			expect(file.byType("IfcMaterialProfile").length).toBe(1);
			expect(file.byType("IfcMaterialProfile")[0].get("Name")).toBe("B1");
		});
	},
);
