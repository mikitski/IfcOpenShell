// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_add_application.py` (src/ifcopenshell-python).
// Both the base `TestAddApplication`/`TestAddApplicationIFC2X3` case (IFC2X3/IFC4) and
// `TestAddApplicationIFC4X3`'s own override (the `IfcActor`+"PEnum_AddressType"-pset
// path) are ported below and pass.

import { describe, expect, test } from "vitest";
import { addApplication } from "../../../src/api/owner/addApplication";
import type { EntityInstance } from "../../../src/entityInstance";
import { getPep440Version } from "../../../src/template";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

// Matches `addApplication.ts`'s own private `DEFAULT_VERSION` constant -- see that
// file's header comment for why this port has no standalone "ifcopenshell.version"
// module to import instead.
const DEFAULT_VERSION = getPep440Version("0.9.0");

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC4X3"))("api.owner.addApplication (%s)", (schema) => {
	test("adding the IfcOpenShell application", () => {
		const file = createTestFile(schema);
		const application = addApplication(file, {});
		const developer = application.get("ApplicationDeveloper") as EntityInstance;
		expect(application.get("Version")).toBe(DEFAULT_VERSION);
		expect(application.get("ApplicationFullName")).toBe("IfcOpenShell");
		expect(application.get("ApplicationIdentifier")).toBe("IfcOpenShell");
		expect(developer.isA("IfcOrganization")).toBe(true);
		// 0: Identification (IFC4+) / Id (IFC2X3).
		expect(developer.getByIndex(0)).toBe("IfcOpenShell");
		expect(developer.get("Name")).toBe("IfcOpenShell");
		expect(developer.get("Description")).toBe(
			"IfcOpenShell is an open source software library that helps users and software developers to work with IFC data.",
		);
		const roles = developer.get("Roles") as EntityInstance[];
		expect(roles[0].get("Role")).toBe("USERDEFINED");
		expect(roles[0].get("UserDefinedRole")).toBe("CONTRIBUTOR");
		const addresses = developer.get("Addresses") as EntityInstance[];
		expect(addresses[0].isA("IfcTelecomAddress")).toBe(true);
		expect(addresses[0].get("Purpose")).toBe("USERDEFINED");
		expect(addresses[0].get("UserDefinedPurpose")).toBe("WEBPAGE");
		expect(addresses[0].get("WWWHomePageURL")).toBe("https://ifcopenshell.org");
	});

	test("adding an application with an explicit developer (works on every schema, including IFC4X3)", () => {
		const file = createTestFile(schema);
		const developer = file.createEntity("IfcOrganization", null, "Acme");
		const application = addApplication(file, {
			applicationDeveloper: developer,
			version: "1.0",
			applicationFullName: "My App",
			applicationIdentifier: "MyApp",
		});
		expect((application.get("ApplicationDeveloper") as EntityInstance).equals(developer)).toBe(true);
		expect(application.get("Version")).toBe("1.0");
		expect(application.get("ApplicationFullName")).toBe("My App");
		expect(application.get("ApplicationIdentifier")).toBe("MyApp");
	});
});

// --- IFC4X3 ---

// `describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))` -- CI's native build only
// registers IFC4 (`-DSCHEMA_VERSIONS=4`, a long-established, tracked gap -- see
// `test/util/doc.test.ts`'s own identical, already-established precedent for this exact
// guard), so this block must be schema-availability-gated like every other IFC4X3-only
// `describe` in this project; it only happens to run locally when IFC4X3 is registered.
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4X3"))("api.owner.addApplication (IFC4X3)", () => {
	test("adding an application with an explicit developer still works", () => {
		const file = createTestFile("IFC4X3");
		const developer = file.createEntity("IfcOrganization", null, "Acme");
		const application = addApplication(file, { applicationDeveloper: developer });
		expect((application.get("ApplicationDeveloper") as EntityInstance).equals(developer)).toBe(true);
	});

	// Matches real Python's `TestAddApplicationIFC4X3.test_adding_the_ifcopenshell
	// _application` override: `IfcTelecomAddress` is deprecated on IFC4X3, so the
	// default organisation has no `Addresses` at all -- instead it's wrapped in an
	// `IfcActor` carrying a "PEnum_AddressType" property set.
	test("adding the default IfcOpenShell application", () => {
		const file = createTestFile("IFC4X3");
		const application = addApplication(file, {});
		const developer = application.get("ApplicationDeveloper") as EntityInstance;
		expect(application.get("Version")).toBe(DEFAULT_VERSION);
		expect(application.get("ApplicationFullName")).toBe("IfcOpenShell");
		expect(application.get("ApplicationIdentifier")).toBe("IfcOpenShell");
		expect(developer.isA("IfcOrganization")).toBe(true);
		expect(developer.getByIndex(0)).toBe("IfcOpenShell");
		expect(developer.get("Name")).toBe("IfcOpenShell");
		expect(developer.get("Description")).toBe(
			"IfcOpenShell is an open source software library that helps users and software developers to work with IFC data.",
		);
		const roles = developer.get("Roles") as EntityInstance[];
		expect(roles[0].get("Role")).toBe("USERDEFINED");
		expect(roles[0].get("UserDefinedRole")).toBe("CONTRIBUTOR");
		expect(developer.get("Addresses")).toBeNull();

		const actors = file.byType("IfcActor");
		expect(actors.length).toBeGreaterThan(0);
		const actor = actors[0];
		expect((actor.get("TheActor") as EntityInstance).equals(developer)).toBe(true);
		const rel = file.byType("IfcRelDefinesByProperties")[0];
		expect((rel.get("RelatedObjects") as EntityInstance[])[0].equals(actor)).toBe(true);
		const propertySet = rel.get("RelatingPropertyDefinition") as EntityInstance;
		expect(propertySet.get("Name")).toBe("PEnum_AddressType");
		const properties = propertySet.get("HasProperties") as EntityInstance[];
		const byName = new Map(properties.map((p) => [p.get("Name") as string, p]));
		expect((byName.get("Purpose")?.get("NominalValue") as EntityInstance).getByIndex(0)).toBe("OTHER");
		expect((byName.get("UserDefinedPurpose")?.get("NominalValue") as EntityInstance).getByIndex(0)).toBe("WEBPAGE");
		expect((byName.get("WWWHomePageURL")?.get("NominalValue") as EntityInstance).getByIndex(0)).toBe(
			"https://ifcopenshell.org",
		);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC4X3"))(
	"api.owner.addApplication Transaction/undo-redo (%s)",
	(schema) => {
		test("undo removes the created IfcApplication (and its default developer); redo recreates them", () => {
			const file = createTestFile(schema);

			file.beginTransaction();
			const application = addApplication(file, {});
			file.endTransaction();
			const applicationId = application.id();

			file.undo();
			expect(() => file.byId(applicationId)).toThrow();

			file.redo();
			expect(file.byId(applicationId).isA("IfcApplication")).toBe(true);
			expect(file.byId(applicationId).get("ApplicationFullName")).toBe("IfcOpenShell");
		});
	},
);
