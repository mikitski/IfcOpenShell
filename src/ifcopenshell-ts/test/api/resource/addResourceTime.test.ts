// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_resource_time.py` (see `test/api/resource/` --
// no `test_add_resource_time.py`), only the docstring's own worked example. This suite
// is written directly from the real source's own behavior. `IfcResourceTime` is
// IFC4+-only (see `../../../src/api/resource/addResourceTime.ts`'s own header
// comment), so this is gated off IFC2X3.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { addResourceTime } from "../../../src/api/resource/addResourceTime";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.resource.addResourceTime (%s)", (schema) => {
	test("adding a resource time assigns it as Usage", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const labour = addResource(file, { ifcClass: "IfcLaborResource" });

		const time = addResourceTime(file, { resource: labour });

		expect(time.isA("IfcResourceTime")).toBe(true);
		expect((labour.get("Usage") as EntityInstance).equals(time)).toBe(true);
	});
});

// See `../../../src/api/resource/addResourceTime.ts`'s own header comment: real Python
// has no schema guard against calling this on IFC2X3, and neither does this port --
// `file.createEntity("IfcResourceTime")` throws naturally there.
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))(
	"api.resource.addResourceTime IFC2X3 (unregistered class throw)",
	() => {
		test("throws on IFC2X3 -- IfcResourceTime doesn't exist in that schema", () => {
			const file = createTestFile("IFC2X3");
			const labour = file.createEntity("IfcLaborResource");

			expect(() => addResourceTime(file, { resource: labour })).toThrow();
		});
	},
);
