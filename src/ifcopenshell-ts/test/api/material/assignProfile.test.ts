// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `assign_profile.py` (no `test_assign_profile.py`
// counterpart -- confirmed by directory listing of `src/ifcopenshell-python/test/api/
// material/`). Tests below are new, exercising the real Python source's own disclosed
// behavior directly (see `../../../src/api/material/assignProfile.ts`'s own header
// comment): swapping `IfcMaterialProfile.Profile`, propagating that swap onto a real
// occurrence's body representation `IfcSweptAreaSolid.SweptArea` via its
// `IfcMaterialProfileSetUsage`, and removing the old profile once nothing else
// references it. `IfcMaterialProfile` doesn't exist on IFC2X3 at all, so every test
// here runs IFC4/IFC4X3 only (the real source's own IFC2X3 dispatch branch is real,
// disclosed DEAD code -- see that file's header comment -- so it isn't exercised here
// either).

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { assignRepresentation } from "../../../src/api/geometry/assignRepresentation";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { addProfile } from "../../../src/api/material/addProfile";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { assignProfile } from "../../../src/api/material/assignProfile";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Builds a minimal single-extrusion "Model"/"Body"/"MODEL_VIEW" body representation for `product`, using `profile` as its `IfcSweptAreaSolid.SweptArea`. */
function addBodyRepresentation(
	file: ReturnType<typeof createTestFile>,
	body: EntityInstance,
	product: EntityInstance,
	profile: EntityInstance,
): EntityInstance {
	const direction = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
	const solid = file.createEntity("IfcExtrudedAreaSolid", profile, null, direction, 1000);
	const representation = file.createEntity("IfcShapeRepresentation", body, "Body", "SweptSolid", [solid]);
	assignRepresentation(file, { product, representation });
	return representation;
}

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.material.assignProfile (%s)", (schema) => {
	test("swaps the Profile of the material profile item", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "B1" });
		const steel = addMaterial(file, { name: "ST01", category: "steel" });
		const hea100 = file.createEntity("IfcRectangleProfileDef", "AREA", "HEA100", null, 100, 96);
		const profileItem = addProfile(file, { profileSet, material: steel, profile: hea100 });

		const hea200 = file.createEntity("IfcRectangleProfileDef", "AREA", "HEA200", null, 200, 190);
		assignProfile(file, { materialProfile: profileItem, profile: hea200 });

		expect((profileItem.get("Profile") as EntityInstance).equals(hea200)).toBe(true);
	});

	test("propagates the new profile onto an occurrence's body representation extrusion", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const modelContext = addContext(file, { contextType: "Model" });
		const body = addContext(file, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: modelContext,
		});

		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "B1" });
		const steel = addMaterial(file, { name: "ST01", category: "steel" });
		const hea100 = file.createEntity("IfcRectangleProfileDef", "AREA", "HEA100", null, 100, 96);
		const profileItem = addProfile(file, { profileSet, material: steel, profile: hea100 });

		const beam = file.createEntity("IfcBeam");
		assignMaterial(file, { products: [beam], material: profileSet, type: "IfcMaterialProfileSetUsage" });
		const representation = addBodyRepresentation(file, body, beam, hea100);

		const hea200 = file.createEntity("IfcRectangleProfileDef", "AREA", "HEA200", null, 200, 190);
		assignProfile(file, { materialProfile: profileItem, profile: hea200 });

		const solid = (representation.get("Items") as EntityInstance[])[0];
		expect((solid.get("SweptArea") as EntityInstance).equals(hea200)).toBe(true);
	});

	test("removes the old profile once nothing else references it", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const modelContext = addContext(file, { contextType: "Model" });
		const body = addContext(file, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: modelContext,
		});

		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "B1" });
		const steel = addMaterial(file, { name: "ST01", category: "steel" });
		const hea100 = file.createEntity("IfcRectangleProfileDef", "AREA", "HEA100", null, 100, 96);
		const profileItem = addProfile(file, { profileSet, material: steel, profile: hea100 });

		const beam = file.createEntity("IfcBeam");
		assignMaterial(file, { products: [beam], material: profileSet, type: "IfcMaterialProfileSetUsage" });
		addBodyRepresentation(file, body, beam, hea100);

		expect(file.byType("IfcRectangleProfileDef").map((p) => p.identity())).toContain(hea100.identity());

		const hea200 = file.createEntity("IfcRectangleProfileDef", "AREA", "HEA200", null, 200, 190);
		assignProfile(file, { materialProfile: profileItem, profile: hea200 });

		expect(file.byType("IfcRectangleProfileDef").map((p) => p.identity())).not.toContain(hea100.identity());
	});

	test("keeps the old profile when something else still references it", () => {
		const file = createTestFile(schema);
		const profileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "B1" });
		const steel = addMaterial(file, { name: "ST01", category: "steel" });
		const hea100 = file.createEntity("IfcRectangleProfileDef", "AREA", "HEA100", null, 100, 96);
		const profileItem = addProfile(file, { profileSet, material: steel, profile: hea100 });
		// A second, independent reference to hea100.
		const otherProfileSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "B2" });
		addProfile(file, { profileSet: otherProfileSet, material: steel, profile: hea100 });

		const hea200 = file.createEntity("IfcRectangleProfileDef", "AREA", "HEA200", null, 200, 190);
		assignProfile(file, { materialProfile: profileItem, profile: hea200 });

		expect(file.byType("IfcRectangleProfileDef").map((p) => p.identity())).toContain(hea100.identity());
	});
});
