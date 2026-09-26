// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_resource_quantity.py` (see
// `test/api/resource/` -- no `test_edit_resource_quantity.py`), only the docstring's
// own worked example. This suite is written directly from the real source's own
// (trivial) setattr-loop behavior.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { addResourceQuantity } from "../../../src/api/resource/addResourceQuantity";
import { editResourceQuantity } from "../../../src/api/resource/editResourceQuantity";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.resource.editResourceQuantity (%s)", (schema) => {
	test("editing the TimeValue of an IfcQuantityTime", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const labour = addResource(file, { ifcClass: "IfcLaborResource" });
		const quantity = addResourceQuantity(file, { resource: labour, ifcClass: "IfcQuantityTime" });

		editResourceQuantity(file, { physicalQuantity: quantity, attributes: { TimeValue: 8.0 } });

		expect(quantity.get("TimeValue")).toBe(8.0);
	});
});
