// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_resource.py` (see `test/api/resource/` -- no
// `test_edit_resource.py`), only the docstring's own worked example. This suite is
// written directly from the real source's own (trivial) setattr-loop behavior.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import { editResource } from "../../../src/api/resource/editResource";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.resource.editResource (%s)", (schema) => {
	test("editing the Name attribute", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const crew = addResource(file, { ifcClass: "IfcCrewResource" });

		editResource(file, { resource: crew, attributes: { Name: "Zone A Crew" } });

		expect(crew.get("Name")).toBe("Zone A Crew");
	});

	test("editing multiple attributes at once", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		const crew = addResource(file, { ifcClass: "IfcCrewResource" });

		editResource(file, { resource: crew, attributes: { Name: "Foo", Description: "Bar" } });

		expect(crew.get("Name")).toBe("Foo");
		expect(crew.get("Description")).toBe("Bar");
	});
});
