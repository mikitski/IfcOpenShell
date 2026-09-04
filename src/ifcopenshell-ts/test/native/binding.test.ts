// This file was generated with the assistance of an AI coding tool.

import { describe, expect, test } from "vitest";
import { IfcFile } from "../../src/index";

// A minimal valid IFC-SPF template, per 20-roadmap.md Phase 0's exit
// criterion ("opens a trivial in-memory template file"). Shape matches
// src/ifcopenshell-python/test/fixtures/validate/pass-attr-count-ok.ifc.
const IFC4_TEMPLATE = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((''),'2;1');
FILE_NAME('','',(''),(''),'','','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
ENDSEC;
END-ISO-10303-21;
`;

describe("native smoke test (Phase 0)", () => {
	test("opens an in-memory template file, reads its schema, and closes it", () => {
		const file = new IfcFile(Buffer.from(IFC4_TEMPLATE, "utf-8"));

		expect(file.schemaIdentifier).toBe("IFC4");

		file.close();
		expect(() => file.schemaIdentifier).toThrow();
	});

	test("rejects non-Buffer input", () => {
		// @ts-expect-error - exercising the native addon's runtime type check
		expect(() => new IfcFile("not a buffer")).toThrow();
	});
});
