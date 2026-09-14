// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_remove_person_and_organisation.py` (src/
// ifcopenshell-python) -- every real Python test method ported, matching
// `./removePerson.test.ts`'s own structure.

import { describe, expect, test } from "vitest";
import { removePersonAndOrganisation } from "../../../src/api/owner/removePersonAndOrganisation";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.removePersonAndOrganisation (%s)", (schema) => {
	test("removing", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const user = file.createEntity("IfcPersonAndOrganization");
		removePersonAndOrganisation(file, { personAndOrganisation: user });
		expect(file.byType("IfcPersonAndOrganization").length).toBe(0);
	});

	test("deleting actors", () => {
		const file = createTestFile(schema);
		const user = file.createEntity("IfcPersonAndOrganization");
		// IfcActor: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
		// ObjectType(4), TheActor(5).
		file.createEntity("IfcActor", "0Ce2vf6uv6XPJQROnZOtcp", null, null, null, null, user);
		removePersonAndOrganisation(file, { personAndOrganisation: user });
		expect(file.byType("IfcActor").length).toBe(0);
	});

	test("ensuring document information should not be left in an invalid set cardinality", () => {
		const file = createTestFile(schema);
		const user = file.createEntity("IfcPersonAndOrganization");
		const documentInformation = file.createEntity("IfcDocumentInformation");
		documentInformation.set("Editors", [user]);
		removePersonAndOrganisation(file, { personAndOrganisation: user });
		expect(documentInformation.get("Editors")).toBeNull();
	});

	test("deleting owner history", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const user = file.createEntity("IfcPersonAndOrganization");
		const ownerHistory = file.createEntity("IfcOwnerHistory");
		ownerHistory.set("OwningUser", user);
		removePersonAndOrganisation(file, { personAndOrganisation: user });
		expect(file.byType("IfcOwnerHistory").length).toBe(0);
	});
});

// --- Real-Python `TestRemovePersonAndOrganisationIFC4`-only methods (IFC4+-only `IfcResourceLevelRelationship` subtypes) ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.owner.removePersonAndOrganisation IFC4+ resource relationships (%s)",
	(schema) => {
		test("deleting resource approval relationships", () => {
			const file = createTestFile(schema);
			const user = file.createEntity("IfcPersonAndOrganization");
			const rel = file.createEntity("IfcResourceApprovalRelationship");
			rel.set("RelatedResourceObjects", [user]);
			removePersonAndOrganisation(file, { personAndOrganisation: user });
			expect(file.byType("IfcResourceApprovalRelationship").length).toBe(0);
		});

		test("deleting resource constraint relationships", () => {
			const file = createTestFile(schema);
			const user = file.createEntity("IfcPersonAndOrganization");
			const rel = file.createEntity("IfcResourceConstraintRelationship");
			rel.set("RelatedResourceObjects", [user]);
			removePersonAndOrganisation(file, { personAndOrganisation: user });
			expect(file.byType("IfcResourceConstraintRelationship").length).toBe(0);
		});

		test("deleting external reference relationships", () => {
			const file = createTestFile(schema);
			const user = file.createEntity("IfcPersonAndOrganization");
			const rel = file.createEntity("IfcExternalReferenceRelationship");
			rel.set("RelatedResourceObjects", [user]);
			removePersonAndOrganisation(file, { personAndOrganisation: user });
			expect(file.byType("IfcExternalReferenceRelationship").length).toBe(0);
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.removePersonAndOrganisation Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a fully-removed pairing and its owner history; redo removes them again", () => {
		const file = createTestFile(schema);
		const user = file.createEntity("IfcPersonAndOrganization");
		const ownerHistory = file.createEntity("IfcOwnerHistory");
		ownerHistory.set("OwningUser", user);
		const userId = user.id();
		const ownerHistoryId = ownerHistory.id();

		file.beginTransaction();
		removePersonAndOrganisation(file, { personAndOrganisation: user });
		file.endTransaction();

		expect(() => file.byId(userId)).toThrow();
		expect(() => file.byId(ownerHistoryId)).toThrow();

		file.undo();
		expect(file.byId(userId).isA("IfcPersonAndOrganization")).toBe(true);
		expect(file.byId(ownerHistoryId).isA("IfcOwnerHistory")).toBe(true);

		file.redo();
		expect(() => file.byId(userId)).toThrow();
		expect(() => file.byId(ownerHistoryId)).toThrow();
	});
});
