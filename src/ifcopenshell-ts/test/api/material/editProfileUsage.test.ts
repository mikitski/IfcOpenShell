// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/material/test_edit_profile_usage.py`
// (src/ifcopenshell-python -- `TestEditProfileUsageIFC4(test.bootstrap.IFC4)`/
// `TestEditProfileUsageIFC4X3(test.bootstrap.IFC4X3, TestEditProfileUsageIFC4)`, so
// IFC4/IFC4X3 only -- `IfcMaterialProfileSetUsage` doesn't exist on IFC2X3 at all).
//
// Real Python's own `test_update_cardinal_point` calls `ifcopenshell.geom.create_shape`
// (transitively, via `edit_profile_usage`'s own `calculate_position`) and asserts a
// real geometric result (`representation.Items[0].Position.Location.Coordinates`
// shifting from `(0,0,0)` to `(-50,50,0)` for a 100x100mm square profile). This TS port
// has NO `ifcopenshell.geom` binding of any kind (see `../../../src/api/material
// /editProfileUsage.ts`'s own header comment and `TODOS.md`), so that real test is
// PINNED HERE AS A "THROWS" TEST instead of its real assertions, matching this
// project's established convention for a genuinely blocked geometry-kernel call (e.g.
// `../geometry/mapTypeRepresentations... ` -- see `TODOS.md`'s own precedent entries).
// The remaining tests below are new, covering every branch that DOESN'T need the
// geometry kernel: no-`CardinalPoint`-change no-ops, an unchanged-value no-op, and the
// real "no profile in the set at all" early-return (which itself needs no geometry, so
// it's a real, portable no-throw path).

import { describe, expect, test } from "vitest";
import { addMaterial } from "../../../src/api/material/addMaterial";
import { addMaterialSet } from "../../../src/api/material/addMaterialSet";
import { addProfile } from "../../../src/api/material/addProfile";
import { assignMaterial } from "../../../src/api/material/assignMaterial";
import { editProfileUsage } from "../../../src/api/material/editProfileUsage";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.material.editProfileUsage (%s)", (schema) => {
	// Adapted from real Python's own `test_update_cardinal_point` -- see this file's
	// header comment for why this is pinned as a "throws" test.
	test("throws when CardinalPoint actually changes and a profile is present (blocked: no geometry kernel)", () => {
		const file = createTestFile(schema);
		const materialSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "B1" });
		const steel = addMaterial(file, { name: "ST01", category: "steel" });
		const rectangle = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 100, 100);
		addProfile(file, { profileSet: materialSet, material: steel, profile: rectangle });
		const beam = file.createEntity("IfcBeam");
		const rel = assignMaterial(file, {
			products: [beam],
			material: materialSet,
			type: "IfcMaterialProfileSetUsage",
		}) as EntityInstance;
		const usage = rel.get("RelatingMaterial") as EntityInstance;
		expect(usage.get("CardinalPoint")).toBeNull();

		expect(() => editProfileUsage(file, { usage, attributes: { CardinalPoint: 1 } })).toThrow(/geometry-kernel/);

		// Unaffected: real Python's own order-of-operations runs `update_cardinal_point`
		// BEFORE the `attributes` setter loop, so the throw happens before `usage` is
		// mutated at all.
		expect(usage.get("CardinalPoint")).toBeNull();
	});

	test("does not throw and applies attributes when CardinalPoint is absent from attributes", () => {
		const file = createTestFile(schema);
		const materialSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "B1" });
		const steel = addMaterial(file, { name: "ST01", category: "steel" });
		const rectangle = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 100, 100);
		addProfile(file, { profileSet: materialSet, material: steel, profile: rectangle });
		const usage = file.createEntity("IfcMaterialProfileSetUsage", materialSet);

		editProfileUsage(file, { usage, attributes: { ReferenceExtent: 5 } });

		expect(usage.get("ReferenceExtent")).toBe(5);
	});

	test("does not throw when CardinalPoint is set to its own current value", () => {
		const file = createTestFile(schema);
		const materialSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet", name: "B1" });
		const steel = addMaterial(file, { name: "ST01", category: "steel" });
		const rectangle = file.createEntity("IfcRectangleProfileDef", "AREA", null, null, 100, 100);
		addProfile(file, { profileSet: materialSet, material: steel, profile: rectangle });
		const usage = file.createEntity("IfcMaterialProfileSetUsage", materialSet, 5);

		editProfileUsage(file, { usage, attributes: { CardinalPoint: 5 } });

		expect(usage.get("CardinalPoint")).toBe(5);
	});

	// Real Python: `update_cardinal_point` silently returns (no geometry kernel needed
	// at all) when the profile set has neither a `CompositeProfile` nor any
	// `MaterialProfiles` -- a real, fully portable early-return, not a stub.
	test("does not throw when the profile set has no profile at all", () => {
		const file = createTestFile(schema);
		const materialSet = addMaterialSet(file, { setType: "IfcMaterialProfileSet" });
		const usage = file.createEntity("IfcMaterialProfileSetUsage", materialSet);

		editProfileUsage(file, { usage, attributes: { CardinalPoint: 5 } });

		expect(usage.get("CardinalPoint")).toBe(5);
	});
});
