// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_resource.py` (see `test/api/resource/` -- no
// `test_add_resource.py`), only the docstring's own worked example (and its use as a
// fixture throughout the OTHER real Python test files in this module, e.g.
// `test_assign_resource.py`/`test_add_resource_quantity.py`). This suite is written
// directly from the real source's own behavior.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { addResource } from "../../../src/api/resource/addResource";
import type { EntityInstance } from "../../../src/entityInstance";
import { getNest } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))("api.resource.addResource (%s)", (schema) => {
	test("adding a root-level resource declares it against the file's IfcContext", () => {
		// `createTestFile` (`template.create`) already pre-populates a default
		// `IfcProject` (matching real Python's own `ifcopenshell.template.create`) --
		// that's the `IfcContext` `addResource` actually declares against
		// (`file.byType("IfcContext")[0]`), so this reads the project already in the
		// file rather than creating (and asserting against) a second, inert one.
		const file = createTestFile(schema);
		const project = file.byType("IfcContext")[0];

		const crew = addResource(file, { ifcClass: "IfcCrewResource" });

		expect(crew.isA("IfcCrewResource")).toBe(true);
		expect(crew.get("Name")).toBe("Unnamed");
		expect(crew.get("PredefinedType")).toBe("NOTDEFINED");
		const declares = project.get("Declares") as EntityInstance[];
		expect(declares.length).toBe(1);
	});

	test("adding a child resource nests it under parentResource instead of declaring it", () => {
		const file = createTestFile(schema);
		const project = file.byType("IfcContext")[0];
		const crew = addResource(file, { ifcClass: "IfcCrewResource" });

		const labour = addResource(file, { parentResource: crew, ifcClass: "IfcLaborResource", name: "Riggers" });

		expect(labour.isA("IfcLaborResource")).toBe(true);
		expect(labour.get("Name")).toBe("Riggers");
		expect(getNest(labour)?.equals(crew)).toBe(true);
		// Only the crew itself is declared at the project level, not its children.
		const declares = project.get("Declares") as EntityInstance[];
		expect(declares.length).toBe(1);
	});

	test("a custom predefinedType is stored", () => {
		const file = createTestFile(schema);

		const equipment = addResource(file, {
			ifcClass: "IfcConstructionEquipmentResource",
			predefinedType: "USERDEFINED",
		});

		expect(equipment.get("PredefinedType")).toBe("USERDEFINED");
	});
});

// IFC2X3 has no `IfcRelDeclares`/`assign_declaration` -- real Python's own `elif
// file.schema != "IFC2X3":` leaves a root-level IFC2X3 resource entirely undeclared,
// with no error raised (see `../../../src/api/resource/addResource.ts`'s own header
// comment).
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))(
	"api.resource.addResource IFC2X3 (root-level resource left undeclared)",
	() => {
		test("does not throw, and leaves the resource undeclared", () => {
			const file = createTestFile("IFC2X3");

			// Should not throw, despite there being no IfcContext/IfcRelDeclares on IFC2X3.
			const crew = addResource(file, { ifcClass: "IfcCrewResource" });

			expect(crew.isA("IfcCrewResource")).toBe(true);
		});
	},
);
