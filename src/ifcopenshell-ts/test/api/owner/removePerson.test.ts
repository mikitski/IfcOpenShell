// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_remove_person.py` (src/ifcopenshell-python) --
// every real Python test method ported: the base `TestRemovePersonIFC2X3` class's 7
// methods run against all 3 schemas below (real Python only runs them against IFC2X3/
// IFC4 via `TestRemovePersonIFC2X3`/`TestRemovePersonIFC4(test.bootstrap.IFC4,
// TestRemovePersonIFC2X3)` -- IFC4X3 is included here too, since nothing about these 7
// cases is schema-specific beyond what's already branched on inline); the 3
// `TestRemovePersonIFC4`-only methods (IFC4+-only `IfcResourceLevelRelationship`
// subtypes) run against IFC4/IFC4X3 only, matching real Python's own IFC2X3 exclusion.
//
// Positional attribute indices below are all confirmed directly against
// `src/generated/ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` (`IfcWorkControl.Creators`(7),
// `IfcInventory.ResponsiblePersons`(7), `IfcActor.TheActor`(5),
// `IfcDocumentInformation.Editors`(9) -- identical positions in all 3 schemas).

import { describe, expect, test } from "vitest";
import { removePerson } from "../../../src/api/owner/removePerson";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.removePerson (%s)", (schema) => {
	test("removing a person", () => {
		const file = createTestFile(schema);
		// `createTestFile`'s template pre-populates a default `IfcPerson` -- stripped so
		// the `.length` assertions below reflect only this test's own person (see
		// `stripProjectBootstrap`'s own doc comment in `../../bootstrap.ts`).
		stripProjectBootstrap(file);
		const person = file.createEntity("IfcPerson");
		removePerson(file, { person });
		expect(file.byType("IfcPerson").length).toBe(0);
	});

	test("removing roles and addresses only used by the person", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const role = file.createEntity("IfcActorRole");
		const address = file.createEntity("IfcPostalAddress");
		const person = file.createEntity("IfcPerson");
		person.set("Roles", [role]);
		person.set("Addresses", [address]);
		removePerson(file, { person });
		expect(file.byType("IfcPerson").length).toBe(0);
		expect(file.byType("IfcActorRole").length).toBe(0);
		expect(file.byType("IfcPostalAddress").length).toBe(0);
	});

	test("not removing roles and addresses used elsewhere", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const role = file.createEntity("IfcActorRole");
		const address = file.createEntity("IfcPostalAddress");
		const person = file.createEntity("IfcPerson");
		const person2 = file.createEntity("IfcPerson");
		person.set("Roles", [role]);
		person.set("Addresses", [address]);
		person2.set("Roles", [role]);
		person2.set("Addresses", [address]);
		removePerson(file, { person });
		expect(file.byType("IfcPerson").length).toBe(1);
		expect(file.byType("IfcActorRole").length).toBe(1);
		expect(file.byType("IfcPostalAddress").length).toBe(1);
	});

	test("ensuring work controls should not be left in an invalid set cardinality", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		// IfcWorkControl: Creators(7).
		const workControl = file.createEntity("IfcWorkControl", null, null, null, null, null, null, null, [person]);
		removePerson(file, { person });
		expect(workControl.get("Creators")).toBeNull();
	});

	test("ensuring inventory should not be left in an invalid set cardinality", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		// IfcInventory: ResponsiblePersons(7) -- same position in all 3 schemas.
		const inventory = file.createEntity("IfcInventory", null, null, null, null, null, null, null, [person]);
		const inventoryId = inventory.id();
		removePerson(file, { person });
		if (schema !== "IFC2X3") {
			expect(inventory.get("ResponsiblePersons")).toBeNull();
		} else {
			// In IFC2X3, ResponsiblePersons is mandatory -- the whole inventory is
			// removed instead of leaving it with an invalid empty SET.
			expect(() => file.byId(inventoryId)).toThrow();
		}
	});

	test("deleting person and organisations", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const person = file.createEntity("IfcPerson");
		file.createEntity("IfcPersonAndOrganization", person);
		removePerson(file, { person });
		expect(file.byType("IfcPersonAndOrganization").length).toBe(0);
	});

	test("deleting actors", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		// IfcActor: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
		// ObjectType(4), TheActor(5).
		file.createEntity("IfcActor", "0Ce2vf6uv6XPJQROnZOtcp", null, null, null, null, person);
		removePerson(file, { person });
		expect(file.byType("IfcActor").length).toBe(0);
	});

	test("ensuring document information should not be left in an invalid set cardinality", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		// IfcDocumentInformation: Editors(9).
		const documentInformation = file.createEntity(
			"IfcDocumentInformation",
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			[person],
		);
		removePerson(file, { person });
		expect(documentInformation.get("Editors")).toBeNull();
	});
});

// --- Real-Python `TestRemovePersonIFC4`-only methods (IFC4+-only `IfcResourceLevelRelationship` subtypes) ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.owner.removePerson IFC4+ resource relationships (%s)",
	(schema) => {
		test("deleting resource approval relationships", () => {
			const file = createTestFile(schema);
			const person = file.createEntity("IfcPerson");
			const rel = file.createEntity("IfcResourceApprovalRelationship");
			rel.set("RelatedResourceObjects", [person]);
			removePerson(file, { person });
			expect(file.byType("IfcResourceApprovalRelationship").length).toBe(0);
		});

		test("deleting resource constraint relationships", () => {
			const file = createTestFile(schema);
			const person = file.createEntity("IfcPerson");
			const rel = file.createEntity("IfcResourceConstraintRelationship");
			rel.set("RelatedResourceObjects", [person]);
			removePerson(file, { person });
			expect(file.byType("IfcResourceConstraintRelationship").length).toBe(0);
		});

		test("deleting external reference relationships", () => {
			const file = createTestFile(schema);
			const person = file.createEntity("IfcPerson");
			const rel = file.createEntity("IfcExternalReferenceRelationship");
			rel.set("RelatedResourceObjects", [person]);
			removePerson(file, { person });
			expect(file.byType("IfcExternalReferenceRelationship").length).toBe(0);
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.removePerson Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a fully-removed person and its role; redo removes them again", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole");
		const person = file.createEntity("IfcPerson");
		person.set("Roles", [role]);
		const personId = person.id();

		file.beginTransaction();
		removePerson(file, { person });
		file.endTransaction();

		expect(() => file.byId(personId)).toThrow();
		expect(file.byType("IfcActorRole").length).toBe(0);

		file.undo();
		expect(file.byId(personId).isA("IfcPerson")).toBe(true);
		expect(file.byType("IfcActorRole").length).toBe(1);

		file.redo();
		expect(() => file.byId(personId)).toThrow();
		expect(file.byType("IfcActorRole").length).toBe(0);
	});
});
