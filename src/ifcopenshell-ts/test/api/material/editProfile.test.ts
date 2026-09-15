// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_profile.py` (no `test_edit_profile.py`
// counterpart -- confirmed by directory listing of `src/ifcopenshell-python/test/api/
// material/`). Tests below are new, exercising the real Python source's own disclosed
// behavior directly (see `../../../src/api/material/editProfile.ts`'s own header
// comment): `attributes` are applied via a plain setter loop, and `material`/
// `profileDef` are each independently guarded, matching `./editLayer.test.ts`'s own
// guarded-`Material`-swap precedent (not `./editConstituent.test.ts`'s unconditional
// one). `IfcMaterialProfile` doesn't exist on IFC2X3 at all, so every test here runs
// IFC4/IFC4X3 only.

import { describe, expect, test } from "vitest";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { addProfile } from "../../../src/api/material/addProfile";
import { editProfile } from "../../../src/api/material/editProfile";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.material.editProfile (%s)", (schema) => {
	test("swaps both Profile and Material when provided", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "B1" });
		const steel1 = addMaterial(file, { name: "ST01", category: "steel" });
		const steel2 = addMaterial(file, { name: "ST02", category: "steel" });
		const hea100 = file.createEntity("IfcIShapeProfileDef", "AREA", "HEA100", null, 100, 96, 5, 8, 12);
		const hea200 = file.createEntity("IfcIShapeProfileDef", "AREA", "HEA200", null, 200, 190, 6.5, 10, 18);
		const profileItem = addProfile(file, { profileSet, material: steel1, profile: hea100 });

		editProfile(file, { profile: profileItem, profileDef: hea200, material: steel2 });

		expect((profileItem.get("Profile") as EntityInstance).equals(hea200)).toBe(true);
		expect((profileItem.get("Material") as EntityInstance).equals(steel2)).toBe(true);
	});

	test("edits attributes independently of Material/Profile", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const profileItem = addProfile(file, { profileSet });

		editProfile(file, { profile: profileItem, attributes: { Name: "B1" } });

		expect(profileItem.get("Name")).toBe("B1");
		expect(profileItem.get("Material")).toBeNull();
		expect(profileItem.get("Profile")).toBeNull();
	});

	test("leaves Material/Profile unchanged when omitted", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const steel = addMaterial(file, { name: "ST01" });
		const hea100 = file.createEntity("IfcIShapeProfileDef", "AREA", "HEA100", null, 100, 96, 5, 8, 12);
		const profileItem = addProfile(file, { profileSet, material: steel, profile: hea100 });

		editProfile(file, { profile: profileItem, attributes: { Name: "B1" } });

		expect((profileItem.get("Material") as EntityInstance).equals(steel)).toBe(true);
		expect((profileItem.get("Profile") as EntityInstance).equals(hea100)).toBe(true);
	});
});
