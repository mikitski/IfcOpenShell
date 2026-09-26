// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `remove_structural_load_case.py` (confirmed: no
// `test_remove_structural_load_case.py` under `test/api/structural/`). This suite is
// written directly from the real source's own behavior/docstring, including a
// dedicated pin for the disclosed missing-`if history:`-guard bug -- see
// `../../../src/api/structural/removeStructuralLoadCase.ts`'s own header comment.
// Gated to non-IFC2X3 schemas since `IfcStructuralLoadCase` doesn't exist there (see
// `../../../src/api/structural/addStructuralLoadCase.ts`'s own header comment).

import { describe, expect, test } from "vitest";
import { addStructuralLoadCase } from "../../../src/api/structural/addStructuralLoadCase";
import { removeStructuralLoadCase } from "../../../src/api/structural/removeStructuralLoadCase";
import { AVAILABLE_SCHEMAS, createTestFile, stripOwnerBootstrap } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.structural.removeStructuralLoadCase (%s)",
	(schema) => {
		test("removing a structural load case (real OwnerHistory present -- the createTestFile default)", () => {
			const file = createTestFile(schema);
			const loadCase = addStructuralLoadCase(file, {});
			expect(loadCase.get("OwnerHistory")).not.toBeNull();

			removeStructuralLoadCase(file, { loadCase });

			expect(file.byType("IfcStructuralLoadCase").length).toBe(0);
		});

		test("DISCLOSED BUG: removing a load case with no OwnerHistory (owner chain stripped before creation) throws, unlike every sibling remove function", () => {
			const file = createTestFile(schema);
			// Stripping the owner/application chain BEFORE creating the load case makes
			// `createOwnerHistory` return `null` for it (`getUser`/`getApplication` find
			// nothing), reproducing the real, disclosed scenario where
			// `IfcStructuralLoadCase.OwnerHistory` is `null` at removal time.
			stripOwnerBootstrap(file);
			const loadCase = addStructuralLoadCase(file, {});
			expect(loadCase.get("OwnerHistory")).toBeNull();

			expect(() => removeStructuralLoadCase(file, { loadCase })).toThrow();
		});
	},
);
