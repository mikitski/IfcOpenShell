// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_profile.py` (confirmed: no
// `test_edit_profile.py` under `test/api/profile/`, matching
// `../structural/editStructuralConnectionCs.test.ts`'s own established precedent for
// the identical situation). This suite is written directly from the real source's
// own behavior/docstring: a plain generic attribute-setter loop, no validation, no
// special-casing of any attribute name.

import { describe, expect, test } from "vitest";
import { addParameterizedProfile } from "../../../src/api/profile/addParameterizedProfile";
import { editProfile } from "../../../src/api/profile/editProfile";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.profile.editProfile (%s)", (schema) => {
	test("sets each given attribute", () => {
		const file = createTestFile(schema);
		const circle = addParameterizedProfile(file, { ifcClass: "IfcCircleProfileDef" });

		editProfile(file, { profile: circle, attributes: { ProfileName: "1000mm Dia", Radius: 0.5 } });

		expect(circle.get("ProfileName")).toBe("1000mm Dia");
		expect(circle.get("Radius")).toBe(0.5);
	});

	test("an empty attributes dict is a no-op", () => {
		const file = createTestFile(schema);
		const circle = addParameterizedProfile(file, { ifcClass: "IfcCircleProfileDef" });

		editProfile(file, { profile: circle, attributes: {} });

		expect(circle.get("ProfileType")).toBe("AREA");
	});
});
