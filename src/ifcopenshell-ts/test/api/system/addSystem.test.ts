// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/system/test_add_system.py` (src/ifcopenshell-python).
// `test_adding_a_system` is ported verbatim, including the IFC2X3-specific
// `IfcDistributionSystem` -> `IfcSystem` substitution assertion (see
// `../../../src/api/system/addSystem.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addSystem } from "../../../src/api/system/addSystem";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.system.addSystem (%s)", (schema) => {
	test("adding a system", () => {
		const file = createTestFile(schema);

		const system = addSystem(file, { ifcClass: "IfcSystem" });
		const system2 = addSystem(file, { ifcClass: "IfcDistributionSystem" });

		expect(system.isA("IfcSystem")).toBe(true);
		if (file.schema === "IFC2X3") {
			expect(system2.isA("IfcSystem")).toBe(true);
		} else {
			expect(system2.isA("IfcDistributionSystem")).toBe(true);
		}
	});

	test("defaults to IfcDistributionSystem (IfcSystem on IFC2X3)", () => {
		const file = createTestFile(schema);

		const system = addSystem(file, {});

		if (file.schema === "IFC2X3") {
			expect(system.isA()).toBe("IfcSystem");
		} else {
			expect(system.isA()).toBe("IfcDistributionSystem");
		}
		expect(system.get("Name")).toBe("Unnamed");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.system.addSystem Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created system; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const system = addSystem(file, { ifcClass: "IfcSystem" });
		file.endTransaction();
		const id = system.id();

		expect(file.byType("IfcSystem").length).toBe(1);

		file.undo();
		expect(() => file.byId(id)).toThrow();

		file.redo();
		expect(file.byId(id).isA("IfcSystem")).toBe(true);
	});
});
