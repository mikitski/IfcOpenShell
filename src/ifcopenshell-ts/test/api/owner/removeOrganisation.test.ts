// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_remove_organisation.py` (src/ifcopenshell-
// python) -- every real Python test method ported, matching `./removePerson.test.ts`'s
// own structure (base class methods run against all 3 schemas; the `IfcResourceLevel
// Relationship` methods IFC4+ only).

import { describe, expect, test } from "vitest";
import { removeOrganisation } from "../../../src/api/owner/removeOrganisation";
import { AVAILABLE_SCHEMAS, createTestFile, stripProjectBootstrap } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeOrganisation (%s)", (schema) => {
	test("removing an organisation", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const organisation = file.createEntity("IfcOrganization");
		removeOrganisation(file, { organisation });
		expect(file.byType("IfcOrganization").length).toBe(0);
	});

	test("removing roles and addresses only used by the organisation", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const role = file.createEntity("IfcActorRole");
		const address = file.createEntity("IfcPostalAddress");
		const organisation = file.createEntity("IfcOrganization");
		organisation.set("Roles", [role]);
		organisation.set("Addresses", [address]);
		removeOrganisation(file, { organisation });
		expect(file.byType("IfcOrganization").length).toBe(0);
		expect(file.byType("IfcActorRole").length).toBe(0);
		expect(file.byType("IfcPostalAddress").length).toBe(0);
	});

	test("not removing roles and addresses used elsewhere", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const role = file.createEntity("IfcActorRole");
		const address = file.createEntity("IfcPostalAddress");
		const organisation = file.createEntity("IfcOrganization");
		const organisation2 = file.createEntity("IfcOrganization");
		organisation.set("Roles", [role]);
		organisation.set("Addresses", [address]);
		organisation2.set("Roles", [role]);
		organisation2.set("Addresses", [address]);
		removeOrganisation(file, { organisation });
		expect(file.byType("IfcOrganization").length).toBe(1);
		expect(file.byType("IfcActorRole").length).toBe(1);
		expect(file.byType("IfcPostalAddress").length).toBe(1);
	});

	test("deleting organisation relationships as the relating organisation", () => {
		const file = createTestFile(schema);
		const organisation = file.createEntity("IfcOrganization");
		// IfcOrganizationRelationship: Name(0), Description(1), RelatingOrganization(2),
		// RelatedOrganizations(3).
		file.createEntity("IfcOrganizationRelationship", null, null, organisation);
		removeOrganisation(file, { organisation });
		expect(file.byType("IfcOrganizationRelationship").length).toBe(0);
	});

	test("deleting organisation relationships as the related organisation", () => {
		const file = createTestFile(schema);
		const organisation = file.createEntity("IfcOrganization");
		const rel = file.createEntity("IfcOrganizationRelationship");
		rel.set("RelatedOrganizations", [organisation]);
		removeOrganisation(file, { organisation });
		expect(file.byType("IfcOrganizationRelationship").length).toBe(0);
	});

	test("deleting person and organisations", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const organisation = file.createEntity("IfcOrganization");
		const rel = file.createEntity("IfcPersonAndOrganization");
		rel.set("TheOrganization", organisation);
		removeOrganisation(file, { organisation });
		expect(file.byType("IfcPersonAndOrganization").length).toBe(0);
	});

	test("deleting actors", () => {
		const file = createTestFile(schema);
		const organisation = file.createEntity("IfcOrganization");
		// IfcActor: GlobalId(0), OwnerHistory(1), Name(2), Description(3),
		// ObjectType(4), TheActor(5).
		file.createEntity("IfcActor", "0Ce2vf6uv6XPJQROnZOtcp", null, null, null, null, organisation);
		removeOrganisation(file, { organisation });
		expect(file.byType("IfcActor").length).toBe(0);
	});

	test("ensuring document information should not be left in an invalid set cardinality", () => {
		const file = createTestFile(schema);
		const organisation = file.createEntity("IfcOrganization");
		const documentInformation = file.createEntity("IfcDocumentInformation");
		documentInformation.set("Editors", [organisation]);
		removeOrganisation(file, { organisation });
		expect(documentInformation.get("Editors")).toBeNull();
	});

	test("deleting an application", () => {
		const file = createTestFile(schema);
		stripProjectBootstrap(file);
		const organisation = file.createEntity("IfcOrganization");
		const application = file.createEntity("IfcApplication");
		application.set("ApplicationDeveloper", organisation);
		removeOrganisation(file, { organisation });
		expect(file.byType("IfcApplication").length).toBe(0);
	});
});

// --- Real-Python `TestRemoveOrganisationIFC4`-only methods (IFC4+-only `IfcResourceLevelRelationship` subtypes) ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.owner.removeOrganisation IFC4+ resource relationships (%s)",
	(schema) => {
		test("deleting resource approval relationships", () => {
			const file = createTestFile(schema);
			const organisation = file.createEntity("IfcOrganization");
			const rel = file.createEntity("IfcResourceApprovalRelationship");
			rel.set("RelatedResourceObjects", [organisation]);
			removeOrganisation(file, { organisation });
			expect(file.byType("IfcResourceApprovalRelationship").length).toBe(0);
		});

		test("deleting resource constraint relationships", () => {
			const file = createTestFile(schema);
			const organisation = file.createEntity("IfcOrganization");
			const rel = file.createEntity("IfcResourceConstraintRelationship");
			rel.set("RelatedResourceObjects", [organisation]);
			removeOrganisation(file, { organisation });
			expect(file.byType("IfcResourceConstraintRelationship").length).toBe(0);
		});

		test("deleting external reference relationships", () => {
			const file = createTestFile(schema);
			const organisation = file.createEntity("IfcOrganization");
			const rel = file.createEntity("IfcExternalReferenceRelationship");
			rel.set("RelatedResourceObjects", [organisation]);
			removeOrganisation(file, { organisation });
			expect(file.byType("IfcExternalReferenceRelationship").length).toBe(0);
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeOrganisation Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a fully-removed organisation and its role; redo removes them again", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole");
		const organisation = file.createEntity("IfcOrganization");
		organisation.set("Roles", [role]);
		const organisationId = organisation.id();

		file.beginTransaction();
		removeOrganisation(file, { organisation });
		file.endTransaction();

		expect(() => file.byId(organisationId)).toThrow();
		expect(file.byType("IfcActorRole").length).toBe(0);

		file.undo();
		expect(file.byId(organisationId).isA("IfcOrganization")).toBe(true);
		expect(file.byType("IfcActorRole").length).toBe(1);

		file.redo();
		expect(() => file.byId(organisationId)).toThrow();
		expect(file.byType("IfcActorRole").length).toBe(0);
	});
});
