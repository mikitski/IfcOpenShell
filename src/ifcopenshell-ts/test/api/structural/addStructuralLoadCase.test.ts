// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_structural_load_case.py` (confirmed: no
// `test_add_structural_load_case.py` under `test/api/structural/`). This suite is
// written directly from the real source's own behavior/docstring. `IfcStructuralLoadCase`
// doesn't exist on IFC2X3 at all (see `../../../src/api/structural/
// addStructuralLoadCase.ts`'s own header comment) -- real Python itself fails there
// too (a real, unguarded schema error), so this suite is gated to non-IFC2X3 schemas.

import { describe, expect, test } from "vitest";
import { addStructuralLoadCase } from "../../../src/api/structural/addStructuralLoadCase";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.structural.addStructuralLoadCase (%s)",
	(schema) => {
		test("defaults", () => {
			const file = createTestFile(schema);

			const loadCase = addStructuralLoadCase(file, {});

			expect(loadCase.isA("IfcStructuralLoadCase")).toBe(true);
			expect(loadCase.get("PredefinedType")).toBe("LOAD_CASE");
			expect(loadCase.get("Name")).toBe("Unnamed");
			expect(loadCase.get("ActionType")).toBe("NOTDEFINED");
			expect(loadCase.get("ActionSource")).toBe("NOTDEFINED");
		});

		test("custom name/actionType/actionSource", () => {
			const file = createTestFile(schema);

			const loadCase = addStructuralLoadCase(file, {
				name: "Dead Load",
				actionType: "PERMANENT_G",
				actionSource: "DEAD_LOAD_G",
			});

			expect(loadCase.get("Name")).toBe("Dead Load");
			expect(loadCase.get("ActionType")).toBe("PERMANENT_G");
			expect(loadCase.get("ActionSource")).toBe("DEAD_LOAD_G");
		});
	},
);

describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC2X3"))(
	"api.structural.addStructuralLoadCase real-schema-limitation regression (%s)",
	(schema) => {
		test("IfcStructuralLoadCase doesn't exist on IFC2X3 -- creation throws, matching real Python", () => {
			const file = createTestFile(schema);
			expect(() => addStructuralLoadCase(file, {})).toThrow();
		});
	},
);
