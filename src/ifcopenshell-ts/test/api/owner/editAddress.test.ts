// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_edit_address.py` (src/ifcopenshell-python) --
// both real Python test methods ported, including the `MessagingIDs` IFC4+-only
// attribute (real Python: `if self.file.schema != "IFC2X3": attributes["MessagingIDs"]
// = [...]`) -- a plain conditional inside the test body, not a schema-availability
// gate, since `IfcTelecomAddress.MessagingIDs` genuinely doesn't exist on IFC2X3 at
// all (confirmed against `ifc2x3.d.ts`, which has no such attribute for this class).

import { describe, expect, test } from "vitest";
import { editAddress } from "../../../src/api/owner/editAddress";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.editAddress (%s)", (schema) => {
	test("editing a postal address", () => {
		const file = createTestFile(schema);
		const address = file.createEntity("IfcPostalAddress");
		editAddress(file, {
			address,
			attributes: {
				Purpose: "OFFICE",
				Description: "Description",
				UserDefinedPurpose: "UserDefinedPurpose",
				InternalLocation: "InternalLocation",
				AddressLines: ["Address", "Lines"],
				PostalBox: "PostalBox",
				Town: "Town",
				Region: "Region",
				PostalCode: "PostalCode",
				Country: "Country",
			},
		});
		expect(address.get("Purpose")).toBe("OFFICE");
		expect(address.get("Description")).toBe("Description");
		expect(address.get("UserDefinedPurpose")).toBe("UserDefinedPurpose");
		expect(address.get("InternalLocation")).toBe("InternalLocation");
		expect(address.get("AddressLines")).toEqual(["Address", "Lines"]);
		expect(address.get("PostalBox")).toBe("PostalBox");
		expect(address.get("Town")).toBe("Town");
		expect(address.get("Region")).toBe("Region");
		expect(address.get("PostalCode")).toBe("PostalCode");
		expect(address.get("Country")).toBe("Country");
	});

	test("editing a telecom address", () => {
		const file = createTestFile(schema);
		const address = file.createEntity("IfcTelecomAddress");
		const attributes: Record<string, unknown> = {
			Purpose: "OFFICE",
			Description: "Description",
			UserDefinedPurpose: "UserDefinedPurpose",
			TelephoneNumbers: ["Telephone", "Numbers"],
			FacsimileNumbers: ["Facsimile", "Numbers"],
			PagerNumber: "PagerNumber",
			ElectronicMailAddresses: ["Electronic", "Mail", "Addresses"],
			WWWHomePageURL: "WWWHomePageURL",
		};
		if (file.schema !== "IFC2X3") {
			attributes.MessagingIDs = ["Messaging", "IDs"];
		}

		editAddress(file, { address, attributes });

		expect(address.get("Purpose")).toBe("OFFICE");
		expect(address.get("Description")).toBe("Description");
		expect(address.get("UserDefinedPurpose")).toBe("UserDefinedPurpose");
		expect(address.get("TelephoneNumbers")).toEqual(["Telephone", "Numbers"]);
		expect(address.get("FacsimileNumbers")).toEqual(["Facsimile", "Numbers"]);
		expect(address.get("PagerNumber")).toBe("PagerNumber");
		expect(address.get("ElectronicMailAddresses")).toEqual(["Electronic", "Mail", "Addresses"]);
		expect(address.get("WWWHomePageURL")).toBe("WWWHomePageURL");
		if (file.schema !== "IFC2X3") {
			expect(address.get("MessagingIDs")).toEqual(["Messaging", "IDs"]);
		}
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.editAddress Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous Town; redo re-applies the edit", () => {
		const file = createTestFile(schema);
		const address = file.createEntity("IfcPostalAddress", "OFFICE", null, null, null, null, null, "Before");

		file.beginTransaction();
		editAddress(file, { address, attributes: { Town: "After" } });
		file.endTransaction();

		expect(address.get("Town")).toBe("After");

		file.undo();
		expect(address.get("Town")).toBe("Before");

		file.redo();
		expect(address.get("Town")).toBe("After");
	});
});
