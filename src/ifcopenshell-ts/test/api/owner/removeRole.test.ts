// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_remove_role.py` (src/ifcopenshell-python) --
// every real Python test method ported: the base `TestRemoveRoleIFC2X3` class's 4
// methods run against all 3 schemas below (real Python only runs them against IFC2X3
// there, but nothing about these 4 cases is schema-specific); the 3
// `TestRemoveRoleIFC4`-only methods (IFC4+-only `IfcResourceLevelRelationship`
// subtypes) run against IFC4/IFC4X3 only, matching real Python's own IFC2X3 exclusion.

import { describe, expect, test } from "vitest";
import { removeRole } from "../../../src/api/owner/removeRole";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeRole (%s)", (schema) => {
	test("removing a role", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole");
		removeRole(file, { role });
		expect(file.byType("IfcActorRole").length).toBe(0);
	});

	test("ensuring organisation cardinality is valid", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole");
		const organisation = file.createEntity("IfcOrganization");
		organisation.set("Roles", [role]);
		removeRole(file, { role });
		expect(organisation.get("Roles")).toBeNull();
	});

	test("ensuring person cardinality is valid", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole");
		const person = file.createEntity("IfcPerson");
		person.set("Roles", [role]);
		removeRole(file, { role });
		expect(person.get("Roles")).toBeNull();
	});

	test("ensuring person and organisation cardinality is valid", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole");
		const personAndOrganisation = file.createEntity("IfcPersonAndOrganization");
		personAndOrganisation.set("Roles", [role]);
		removeRole(file, { role });
		expect(personAndOrganisation.get("Roles")).toBeNull();
	});

	test("not touching a person/organisation with other roles too", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole");
		const otherRole = file.createEntity("IfcActorRole");
		const person = file.createEntity("IfcPerson");
		person.set("Roles", [role, otherRole]);
		removeRole(file, { role });
		expect((person.get("Roles") as unknown[]).length).toBe(1);
	});
});

// --- Real-Python `TestRemoveRoleIFC4`-only methods (IFC4+-only `IfcResourceLevelRelationship` subtypes) ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.owner.removeRole IFC4+ resource relationships (%s)",
	(schema) => {
		test("deleting resource approval relationships", () => {
			const file = createTestFile(schema);
			const role = file.createEntity("IfcActorRole");
			const rel = file.createEntity("IfcResourceApprovalRelationship");
			rel.set("RelatedResourceObjects", [role]);
			removeRole(file, { role });
			expect(file.byType("IfcResourceApprovalRelationship").length).toBe(0);
		});

		test("deleting resource constraint relationships", () => {
			const file = createTestFile(schema);
			const role = file.createEntity("IfcActorRole");
			const rel = file.createEntity("IfcResourceConstraintRelationship");
			rel.set("RelatedResourceObjects", [role]);
			removeRole(file, { role });
			expect(file.byType("IfcResourceConstraintRelationship").length).toBe(0);
		});

		test("deleting external reference relationships", () => {
			const file = createTestFile(schema);
			const role = file.createEntity("IfcActorRole");
			const rel = file.createEntity("IfcExternalReferenceRelationship");
			rel.set("RelatedResourceObjects", [role]);
			removeRole(file, { role });
			expect(file.byType("IfcExternalReferenceRelationship").length).toBe(0);
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.owner.removeRole Transaction/undo-redo (%s)", (schema) => {
	test("undo restores a removed role and its organisation's Roles attribute; redo removes it again", () => {
		const file = createTestFile(schema);
		const role = file.createEntity("IfcActorRole");
		const organisation = file.createEntity("IfcOrganization");
		organisation.set("Roles", [role]);
		const roleId = role.id();

		file.beginTransaction();
		removeRole(file, { role });
		file.endTransaction();

		expect(() => file.byId(roleId)).toThrow();
		expect(organisation.get("Roles")).toBeNull();

		file.undo();
		expect(file.byId(roleId).isA("IfcActorRole")).toBe(true);
		expect((organisation.get("Roles") as unknown[]).length).toBe(1);

		file.redo();
		expect(() => file.byId(roleId)).toThrow();
		expect(organisation.get("Roles")).toBeNull();
	});
});
