// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_remove_address.py` (src/ifcopenshell-python)
// -- every real Python test method ported.

import { describe, expect, test } from "vitest";
import { removeAddress } from "../../../src/api/owner/removeAddress";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeAddress (%s)", (schema) => {
	test("removing an address", () => {
		const file = createTestFile(schema);
		const postal = file.createEntity("IfcPostalAddress");
		const telecom = file.createEntity("IfcTelecomAddress");
		removeAddress(file, { address: postal });
		removeAddress(file, { address: telecom });
		expect(file.byType("IfcAddress").length).toBe(0);
	});

	test("ensuring organisation cardinality is valid", () => {
		const file = createTestFile(schema);
		const address = file.createEntity("IfcPostalAddress");
		const organisation = file.createEntity("IfcOrganization");
		organisation.set("Addresses", [address]);
		removeAddress(file, { address });
		expect(organisation.get("Addresses")).toBeNull();
	});

	test("ensuring person cardinality is valid", () => {
		const file = createTestFile(schema);
		const address = file.createEntity("IfcPostalAddress");
		const person = file.createEntity("IfcPerson");
		person.set("Addresses", [address]);
		removeAddress(file, { address });
		expect(person.get("Addresses")).toBeNull();
	});

	test("not touching a person/organisation with other addresses too", () => {
		const file = createTestFile(schema);
		const address = file.createEntity("IfcPostalAddress");
		const otherAddress = file.createEntity("IfcPostalAddress");
		const person = file.createEntity("IfcPerson");
		person.set("Addresses", [address, otherAddress]);
		removeAddress(file, { address });
		expect((person.get("Addresses") as unknown[]).length).toBe(1);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeAddress Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a removed address and its organisation's Addresses attribute; redo removes it again", () => {
		const file = createTestFile(schema);
		const address = file.createEntity("IfcPostalAddress");
		const organisation = file.createEntity("IfcOrganization");
		organisation.set("Addresses", [address]);
		const addressId = address.id();

		file.beginTransaction();
		removeAddress(file, { address });
		file.endTransaction();

		expect(() => file.byId(addressId)).toThrow();
		expect(organisation.get("Addresses")).toBeNull();

		file.undo();
		expect(file.byId(addressId).isA("IfcPostalAddress")).toBe(true);
		expect((organisation.get("Addresses") as unknown[]).length).toBe(1);

		file.redo();
		expect(() => file.byId(addressId)).toThrow();
		expect(organisation.get("Addresses")).toBeNull();
	});
});
