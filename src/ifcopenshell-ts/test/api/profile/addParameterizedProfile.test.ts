// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/profile/test_add_parameterized_profile.py`
// (src/ifcopenshell-python). Real Python's `TestAddParametrizedProfileIFC2X3` iterates
// every concrete subtype of `IfcParameterizedProfileDef` (via `util.schema.get_subtypes`,
// already ported: `../../../src/util/schema.ts`'s `getSubtypes`) and asserts that
// calling `add_parameterized_profile` for each one produces an instance of the right
// class with `ProfileType == "AREA"`. `TestAddParametrizedProfileIFC4`/`IFC4X3` both
// simply re-run the same body against their own schema (real Python: multiple
// inheritance from the IFC2X3 test class) -- ported here as a single
// `describe.each(AVAILABLE_SCHEMAS)` body, matching `../../bootstrap.ts`'s own
// established "reproduce Python's mixin trick with describe.each" convention.
//
// `getSubtypes(entity)` needs a native `entity` declaration handle, obtained the same
// way `../../util/schema.test.ts` already established:
// `file.nativeFile.schema().declaration_by_name_with_name(name).as_entity()`. Each
// returned subtype's own name is read via `entityName` (`../../../src/util/schema.ts`'s
// own exported pointer-reinterpret helper -- the native `entity` handle's TS class has
// no public `.name()` of its own), matching `../../util/schema.test.ts`'s own
// established convention for the identical situation.

import { describe, expect, test } from "vitest";
import { addParameterizedProfile } from "../../../src/api/profile/addParameterizedProfile";
import { entityName, getSubtypes } from "../../../src/util/schema";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.profile.addParameterizedProfile (%s)", (schema) => {
	test("creates every concrete IfcParameterizedProfileDef subtype with ProfileType AREA", () => {
		const file = createTestFile(schema);
		const entity = file.nativeFile.schema().declaration_by_name_with_name("IfcParameterizedProfileDef").as_entity();
		expect(entity).not.toBeNull();
		const subtypes = getSubtypes(entity as NonNullable<typeof entity>);
		expect(subtypes.length).toBeGreaterThan(0);

		for (const subtype of subtypes) {
			const name = entityName(subtype);
			const profile = addParameterizedProfile(file, { ifcClass: name });
			expect(profile.isA()).toBe(name);
			expect(profile.get("ProfileType")).toBe("AREA");
		}
	});
});
