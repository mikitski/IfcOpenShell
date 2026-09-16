// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `edit_structural_load_case.py` (confirmed: no
// `test_edit_structural_load_case.py` under `test/api/structural/`). This suite is
// written directly from the real source's own behavior/docstring, gated to
// non-IFC2X3 schemas since `IfcStructuralLoadCase` doesn't exist there (see
// `../../../src/api/structural/addStructuralLoadCase.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addStructuralLoadCase } from "../../../src/api/structural/addStructuralLoadCase";
import { editStructuralLoadCase } from "../../../src/api/structural/editStructuralLoadCase";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((schema) => schema !== "IFC2X3"))(
	"api.structural.editStructuralLoadCase (%s)",
	(schema) => {
		test("editing attributes", () => {
			const file = createTestFile(schema);
			const loadCase = addStructuralLoadCase(file, {});

			editStructuralLoadCase(file, {
				loadCase,
				attributes: { Name: "Dead Load", ActionType: "PERMANENT_G" },
			});

			expect(loadCase.get("Name")).toBe("Dead Load");
			expect(loadCase.get("ActionType")).toBe("PERMANENT_G");
		});
	},
);
