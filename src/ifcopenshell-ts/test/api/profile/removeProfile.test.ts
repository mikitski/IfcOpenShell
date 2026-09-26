// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/profile/test_remove_profile.py` (src/ifcopenshell-python).
// Both real Python test methods (`test_removing_profile`/`test_removing_profile_with_pset`)
// are ported below, gated `describe.each(AVAILABLE_SCHEMAS)` (real Python:
// `TestRemoveProfileIFC2X3`/`TestRemoveProfileIFC4` -- broadened to include IFC4X3,
// matching `./copyProfile.test.ts`'s own established rationale for the identical
// situation).
//
// Original coverage beyond the real Python file: a dedicated IFC4+-only test
// exercising the `HasProperties`-inverse-attribute branch directly (real Python's own
// `test_removing_profile_with_pset` already exercises this indirectly through
// `add_pset`, but a direct assertion on the branch chosen -- `by_type` scan on IFC2X3
// vs. `HasProperties` on IFC4+ -- makes the schema divergence disclosed in
// `removeProfile.ts`'s own header comment independently verifiable).

import { describe, expect, test } from "vitest";
import { addParameterizedProfile } from "../../../src/api/profile/addParameterizedProfile";
import { removeProfile } from "../../../src/api/profile/removeProfile";
import { addPset } from "../../../src/api/pset/addPset";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.profile.removeProfile (%s)", (schema) => {
	test("removing a profile", () => {
		const file = createTestFile(schema);
		const profile = addParameterizedProfile(file, { ifcClass: "IfcRectangleProfileDef" });

		removeProfile(file, { profile });

		expect(file.byType("IfcRectangleProfileDef").length).toBe(0);
	});

	test("removing a profile with a pset", () => {
		const file = createTestFile(schema);
		const profile = addParameterizedProfile(file, { ifcClass: "IfcRectangleProfileDef" });
		addPset(file, { product: profile, name: "ProfilePset" });

		removeProfile(file, { profile });

		expect(file.byType("IfcRectangleProfileDef").length).toBe(0);
		expect(file.byType("IfcProfileProperties").length).toBe(0);
	});
});
