// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `remove_profile.py` (no `test_remove_profile.py`
// counterpart -- confirmed by directory listing of
// `src/ifcopenshell-python/test/api/material/`). Tests below are new, exercising the
// real Python source's own disclosed behavior directly (see `../../../src/api/material
// /removeProfile.ts`'s own header comment): `IfcMaterialProfile` doesn't exist on
// IFC2X3 at all, so every test here runs IFC4/IFC4X3 only. Covers the
// `shouldRemoveMaterial`/`shouldRemoveProfileDef` independent opt-in flags (both
// default `false`, i.e. the profile item is removed but its `Material`/`Profile`
// forward-attribute values are left alone by default) and the by-identity dedup of
// `for attribute in profile:` (a profile item referencing the SAME material via two
// distinct forward attributes would only be counted once -- not exercised by
// `IfcMaterialProfile` itself, which has only one entity-typed attribute per kind, but
// the underlying `Map<number, EntityInstance>` keyed by `identity()` is what
// `removeProfile.ts`'s own header comment describes).

import { describe, expect, test } from "vitest";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { addProfile } from "../../../src/api/material/addProfile";
import { removeProfile } from "../../../src/api/material/removeProfile";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.material.removeProfile (%s)", (schema) => {
	function makeHea100(file: ReturnType<typeof createTestFile>): EntityInstance {
		return file.createEntity("IfcIShapeProfileDef", "AREA", "HEA100", null, 100, 96, 5, 8, 12);
	}

	test("removes the profile item from its profile set", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const steel = addMaterial(file, { name: "ST01" });
		const hea100 = makeHea100(file);
		const mainProfile = addProfile(file, { profileSet, material: steel, profile: hea100 });
		const weldedSquare = file.createEntity("IfcIShapeProfileDef", "AREA", "WELD", null, 25, 25, 5, 5, 3);
		const weldProfile = addProfile(file, { profileSet, material: steel, profile: weldedSquare });

		removeProfile(file, { profile: weldProfile });

		expect(file.byType("IfcMaterialProfile").length).toBe(1);
		expect((profileSet.get("MaterialProfiles") as EntityInstance[]).map((p) => p.identity())).toEqual([
			mainProfile.identity(),
		]);
	});

	test("does not remove the material or profile def by default", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const steel = addMaterial(file, { name: "ST01" });
		const hea100 = makeHea100(file);
		const profile = addProfile(file, { profileSet, material: steel, profile: hea100 });

		removeProfile(file, { profile });

		expect(file.byType("IfcMaterial").length).toBe(1);
		expect(file.byType("IfcIShapeProfileDef").length).toBe(1);
	});

	test("removes an orphaned material when shouldRemoveMaterial is true", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const steel = addMaterial(file, { name: "ST01" });
		const hea100 = makeHea100(file);
		const profile = addProfile(file, { profileSet, material: steel, profile: hea100 });

		removeProfile(file, { profile, shouldRemoveMaterial: true });

		expect(file.byType("IfcMaterial").length).toBe(0);
		// The profile def is left alone -- a separate, independent flag.
		expect(file.byType("IfcIShapeProfileDef").length).toBe(1);
	});

	test("removes an orphaned profile def when shouldRemoveProfileDef is true", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const steel = addMaterial(file, { name: "ST01" });
		const hea100 = makeHea100(file);
		const profile = addProfile(file, { profileSet, material: steel, profile: hea100 });

		removeProfile(file, { profile, shouldRemoveProfileDef: true });

		expect(file.byType("IfcIShapeProfileDef").length).toBe(0);
		// The material is left alone -- a separate, independent flag.
		expect(file.byType("IfcMaterial").length).toBe(1);
	});

	test("keeps a material with other users even when shouldRemoveMaterial is true", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const steel = addMaterial(file, { name: "ST01" });
		addProfile(file, { profileSet, material: steel });
		const profile2 = addProfile(file, { profileSet, material: steel });

		removeProfile(file, { profile: profile2, shouldRemoveMaterial: true });

		expect(file.byType("IfcMaterial").length).toBe(1);
	});

	test("material and profile may both be unset (no subelements to consider)", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const profile = addProfile(file, { profileSet });

		expect(() => removeProfile(file, { profile })).not.toThrow();
		expect(file.byType("IfcMaterialProfile").length).toBe(0);
	});
});
