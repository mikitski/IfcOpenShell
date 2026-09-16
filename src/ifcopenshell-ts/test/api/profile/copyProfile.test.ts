// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/profile/test_copy_profile.py` (src/ifcopenshell-python).
// Both real Python test methods (`test_copy_profile`/`test_copy_profile_with_pset`)
// are ported below. Real Python has `TestCopyProfileIFC2X3`/`TestCopyProfileIFC4`
// only (no explicit `IFC4X3` test class) -- broadened here to
// `describe.each(AVAILABLE_SCHEMAS)` since nothing in `copyProfile.ts`'s own logic is
// schema-version-specific beyond the `IfcProfileProperties` shape difference the real
// Python test itself doesn't even touch (`add_pset`'s own IFC2X3 handling is already
// exercised elsewhere, e.g. `../pset/addPset.test.ts`), matching
// `../pset/removePset.test.ts`'s own established precedent for broadening beyond real
// Python's own narrower test-class coverage.

import { describe, expect, test } from "vitest";
import { addParameterizedProfile } from "../../../src/api/profile/addParameterizedProfile";
import { copyProfile } from "../../../src/api/profile/copyProfile";
import { addPset } from "../../../src/api/pset/addPset";
import type { EntityInstance } from "../../../src/entityInstance";
import * as elementUtil from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Compares sets of `EntityInstance` by STEP id rather than by JS object identity --
 * matching `../../util/element.test.ts`'s own established `ids()` helper for the
 * identical situation (two `EntityInstance` wrapper objects can refer to the same
 * underlying entity without being the same JS object). */
function ids(instances: Iterable<EntityInstance>): number[] {
	return [...instances].map((i) => i.id()).sort((a, b) => a - b);
}

describe.each(AVAILABLE_SCHEMAS)("api.profile.copyProfile (%s)", (schema) => {
	test("copies a profile", () => {
		const file = createTestFile(schema);
		const profile = addParameterizedProfile(file, { ifcClass: "IfcRectangleProfileDef" });

		const newProfile = copyProfile(file, { profile });

		expect(newProfile.isA("IfcRectangleProfileDef")).toBe(true);
		expect(profile.equals(newProfile)).toBe(false);
		expect(file.byType("IfcRectangleProfileDef").length).toBe(2);
	});

	test("copies a profile with its psets", () => {
		const file = createTestFile(schema);
		const profile = addParameterizedProfile(file, { ifcClass: "IfcRectangleProfileDef" });
		const pset = addPset(file, { product: profile, name: "ProfilePset" });

		const newProfile = copyProfile(file, { profile });

		expect(file.byType("IfcRectangleProfileDef").length).toBe(2);
		const psets = file.byType("IfcProfileProperties");
		expect(psets.length).toBe(2);
		expect(ids(elementUtil.getElementsByPset(pset))).toEqual(ids([profile]));
		expect(ids(elementUtil.getElementsByPset(psets[1]))).toEqual(ids([newProfile]));
	});
});
