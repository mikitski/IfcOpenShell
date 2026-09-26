// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset/test_add_pset.py` (src/ifcopenshell-python). Real
// Python's fixtures use `ifcopenshell.api.material.add_material`/`ifcopenshell.api.
// profile.add_parameterized_profile` (neither module ported yet in this codebase) --
// substituted here with direct `file.createEntity("IfcMaterial"/"IfcCircleProfileDef", ...)`
// calls, matching this project's established "construct the precondition directly"
// substitution (e.g. `../group/assignGroup.test.ts`'s own `root.create_entity`
// substitution). Nothing in these assertions depends on either unported function's own
// bookkeeping -- only the resulting `IfcMaterial`/`IfcProfileDef` instance itself.
//
// Real Python's `TestAddPsetIFC2X3` overrides/adds 3 methods:
//   - `test_adding_a_pset_to_a_project`: identical body to the base class's own
//     `test_adding_a_pset_to_a_context` (both use `IfcProject`) -- genuinely redundant
//     with it (confirmed by reading both bodies: byte-for-byte identical except the
//     test name), since IFC2X3's `IfcProject` is itself an `IfcObject` subtype (no
//     `IfcContext` exists there at all -- confirmed directly against the generated
//     `ifc2x3.d.ts`, no such interface), so it's handled by `addPset`'s `IfcObject`
//     branch on IFC2X3 the exact same way `IfcContext` handles it on IFC4+. Not
//     separately ported here -- the base "to a context" test already runs across
//     `AVAILABLE_SCHEMAS`, IFC2X3 included, and exercises the identical code path.
//   - `test_adding_a_pset_subclass_to_a_profile`/`test_adding_a_material_subclass_to_a_profile`:
//     genuinely IFC2X3-specific (`ifc2x3_subclass` has no effect on IFC4+ -- real
//     Python's own docstring says so directly), ported below gated on IFC2X3
//     availability (point 6 of this chunk's own brief: CI's native build only
//     registers IFC4, so an ungated IFC2X3-only `describe`/`test` would either be
//     silently skipped by `AVAILABLE_SCHEMAS` filtering -- fine locally, but this file
//     uses a literal `IFC2X3`-only block, not `describe.each(AVAILABLE_SCHEMAS)`, so it
//     needs its own explicit `skipIf` gate to avoid hard-failing in CI).
//   - Note the SECOND one's own name: "material subclass to a **profile**" is real
//     Python's own test method name, but its body creates a MATERIAL pset (`ifc_class=
//     "IfcFuelProperties"`, a material-properties subclass) -- a real, if harmless,
//     copy-paste-looking naming quirk in the real Python source itself (confirmed by
//     reading the actual test body directly, not assumed), reproduced here under an
//     accurately-named test instead of copying the misleading name verbatim (the
//     BEHAVIOR under test -- material subclass creation -- is what's ported faithfully,
//     not the arguably-wrong label).
//
// Original coverage added beyond the real Python file: the by-name dedup/reuse checks
// for each of the 4 branches (`addPset` returning a pre-existing pset instead of
// creating a duplicate), and the unsupported-class `TypeError`.

import { describe, expect, test } from "vitest";
import { addPset } from "../../../src/api/pset/addPset";
import type { EntityInstance } from "../../../src/entityInstance";
import { getPsets } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.pset.addPset (%s)", (schema) => {
	test("adding a pset to an object", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, { product: element, name: "Pset_WallCommon" });
		expect(pset.isA("IfcPropertySet")).toBe(true);
		expect("Pset_WallCommon" in getPsets(element)).toBe(true);
	});

	test("adding a pset to a type object", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const pset = addPset(file, { product: element, name: "Pset_WallCommon" });
		expect(pset.isA("IfcPropertySet")).toBe(true);
		expect("Pset_WallCommon" in getPsets(element)).toBe(true);
	});

	test("adding a pset to a material", () => {
		const file = createTestFile(schema);
		const material = file.createEntity("IfcMaterial", "Concrete");
		const pset = addPset(file, { product: material, name: "Pset_MaterialCommon" });
		expect(pset.isA("IfcMaterialProperties")).toBe(true);
		if (schema === "IFC2X3") {
			expect(pset.isA()).toBe("IfcExtendedMaterialProperties");
		}
		expect(pset.get("Name")).toBe("Pset_MaterialCommon");
		expect((pset.get("Material") as EntityInstance).equals(material)).toBe(true);
	});

	test("adding a pset to a profile", () => {
		const file = createTestFile(schema);
		const profile = file.createEntity("IfcCircleProfileDef", "AREA", null, null, 1);
		const pset = addPset(file, { product: profile, name: "Pset_ProfileMechanical" });
		expect(pset.isA("IfcProfileProperties")).toBe(true);
		if (schema === "IFC2X3") {
			expect(pset.isA()).toBe("IfcGeneralProfileProperties");
		} else {
			expect(pset.get("Name")).toBe("Pset_ProfileMechanical");
		}
		expect((pset.get("ProfileDefinition") as EntityInstance).equals(profile)).toBe(true);
	});

	test("adding a pset to a context", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcProject");
		const pset = addPset(file, { product: element, name: "Custom_Pset" });
		expect(pset.isA("IfcPropertySet")).toBe(true);
		expect("Custom_Pset" in getPsets(element)).toBe(true);
	});

	// --- Original coverage: dedup/reuse-by-name ---

	test("returns the existing pset for an object if one with this name already exists", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, { product: element, name: "Pset_WallCommon" });
		const pset2 = addPset(file, { product: element, name: "Pset_WallCommon" });
		expect(pset2.equals(pset)).toBe(true);
		expect(file.byType("IfcPropertySet").length).toBe(1);
	});

	test("returns the existing pset for a type if one with this name already exists", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWallType");
		const pset = addPset(file, { product: element, name: "Pset_WallCommon" });
		const pset2 = addPset(file, { product: element, name: "Pset_WallCommon" });
		expect(pset2.equals(pset)).toBe(true);
		expect(file.byType("IfcPropertySet").length).toBe(1);
	});

	test("returns the existing pset for a material if one with this name already exists (IFC4+ only distinguishing case)", () => {
		const file = createTestFile(schema);
		const material = file.createEntity("IfcMaterial", "Concrete");
		const pset = addPset(file, { product: material, name: "Pset_MaterialCommon" });
		const pset2 = addPset(file, { product: material, name: "Pset_MaterialCommon" });
		expect(pset2.equals(pset)).toBe(true);
	});

	test("throws for an unsupported product class", () => {
		const file = createTestFile(schema);
		const point = file.createEntity("IfcCartesianPoint", [0, 0, 0]);
		expect(() => addPset(file, { product: point, name: "X" })).toThrow(TypeError);
	});
});

// --- IFC2X3-specific `ifc2x3_subclass` coverage (point 6 of this chunk's own brief:
// CI's native build only registers IFC4, so this whole block is gated) ---

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.pset.addPset ifc2x3Subclass (IFC2X3)", () => {
	test("adding a pset subclass to a profile", () => {
		const file = createTestFile("IFC2X3");
		const profile = file.createEntity("IfcCircleProfileDef", "AREA", null, null, 1);
		const pset = addPset(file, {
			product: profile,
			name: "Pset_ProfileMechanical",
			ifc2x3Subclass: "IfcStructuralSteelProfileProperties",
		});
		expect(pset.isA()).toBe("IfcStructuralSteelProfileProperties");
	});

	test("adding a material subclass (real Python's own test is misleadingly named 'to a profile')", () => {
		const file = createTestFile("IFC2X3");
		const material = file.createEntity("IfcMaterial", "Concrete");
		const pset = addPset(file, {
			product: material,
			name: "Pset_MaterialCommon",
			ifc2x3Subclass: "IfcFuelProperties",
		});
		expect(pset.isA()).toBe("IfcFuelProperties");
		// IfcFuelProperties has no Name attribute at all -- Name is only set for the
		// default IfcExtendedMaterialProperties subclass.
		expect(() => pset.get("Name")).toThrow();
	});

	test("dedup-by-name is skipped entirely for profile properties (no Name to compare against)", () => {
		const file = createTestFile("IFC2X3");
		const profile = file.createEntity("IfcCircleProfileDef", "AREA", null, null, 1);
		const pset = addPset(file, { product: profile, name: "Pset_ProfileMechanical" });
		const pset2 = addPset(file, { product: profile, name: "Pset_ProfileMechanical" });
		// Unlike the object/type/material branches, IFC2X3 profile properties always
		// create a brand new instance -- real Python's own comment: "we cannot identify
		// them" (no Name attribute to dedup against).
		expect(pset2.equals(pset)).toBe(false);
		expect(file.byType("IfcGeneralProfileProperties").length).toBe(2);
	});
});
