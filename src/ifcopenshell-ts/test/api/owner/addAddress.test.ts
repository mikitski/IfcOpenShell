// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_add_address.py` (src/ifcopenshell-python) --
// both real Python test methods ported.

import { describe, expect, test } from "vitest";
import { addAddress } from "../../../src/api/owner/addAddress";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.addAddress (%s)", (schema) => {
	test("adding to a person", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const postal = addAddress(file, { assignedObject: person, ifcClass: "IfcPostalAddress" });
		const telecom = addAddress(file, { assignedObject: person, ifcClass: "IfcTelecomAddress" });
		expect(postal.isA("IfcPostalAddress")).toBe(true);
		expect(telecom.isA("IfcTelecomAddress")).toBe(true);
		expect(postal.get("Purpose")).toBe("OFFICE");
		expect(telecom.get("Purpose")).toBe("OFFICE");
		const addresses = person.get("Addresses") as EntityInstance[];
		expect(addresses.map((a) => a.id())).toEqual([postal.id(), telecom.id()]);
	});

	test("adding to an organisation", () => {
		const file = createTestFile(schema);
		const organisation = file.createEntity("IfcOrganization");
		const postal = addAddress(file, { assignedObject: organisation, ifcClass: "IfcPostalAddress" });
		const telecom = addAddress(file, { assignedObject: organisation, ifcClass: "IfcTelecomAddress" });
		expect(postal.isA("IfcPostalAddress")).toBe(true);
		expect(telecom.isA("IfcTelecomAddress")).toBe(true);
		expect(postal.get("Purpose")).toBe("OFFICE");
		expect(telecom.get("Purpose")).toBe("OFFICE");
		const addresses = organisation.get("Addresses") as EntityInstance[];
		expect(addresses.map((a) => a.id())).toEqual([postal.id(), telecom.id()]);
	});

	test("defaults to IfcPostalAddress when ifcClass is omitted", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		const address = addAddress(file, { assignedObject: person });
		expect(address.isA("IfcPostalAddress")).toBe(true);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.addAddress Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created address and un-assigns it; redo recreates both", () => {
		const file = createTestFile(schema);
		const organisation = file.createEntity("IfcOrganization");

		file.beginTransaction();
		const address = addAddress(file, { assignedObject: organisation, ifcClass: "IfcPostalAddress" });
		file.endTransaction();
		const addressId = address.id();

		expect((organisation.get("Addresses") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect(() => file.byId(addressId)).toThrow();
		expect(organisation.get("Addresses")).toBeNull();

		file.redo();
		expect(file.byId(addressId).isA("IfcPostalAddress")).toBe(true);
		expect((organisation.get("Addresses") as EntityInstance[]).length).toBe(1);
	});
});
