// This file was generated with the assistance of an AI coding tool.
//
// No real Python test exists for `add_structural_load_group.py` (confirmed: no
// `test_add_structural_load_group.py` under `test/api/structural/`). This suite is
// written directly from the real source's own behavior/docstring.
// `IfcStructuralLoadGroup` exists identically on all 3 schemas (confirmed against the
// generated `.d.ts`s), so this suite is not gated by schema.

import { describe, expect, test } from "vitest";
import { addStructuralLoadGroup } from "../../../src/api/structural/addStructuralLoadGroup";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.structural.addStructuralLoadGroup (%s)", (schema) => {
	test("defaults", () => {
		const file = createTestFile(schema);

		const loadGroup = addStructuralLoadGroup(file, {});

		expect(loadGroup.isA("IfcStructuralLoadGroup")).toBe(true);
		expect(loadGroup.get("PredefinedType")).toBe("LOAD_GROUP");
		expect(loadGroup.get("Name")).toBe("Unnamed");
		expect(loadGroup.get("ActionType")).toBe("NOTDEFINED");
		expect(loadGroup.get("ActionSource")).toBe("NOTDEFINED");
	});

	test("custom name/actionType/actionSource", () => {
		const file = createTestFile(schema);

		const loadGroup = addStructuralLoadGroup(file, {
			name: "Live Loads",
			actionType: "VARIABLE_Q",
			actionSource: "LIVE_LOAD_Q",
		});

		expect(loadGroup.get("Name")).toBe("Live Loads");
		expect(loadGroup.get("ActionType")).toBe("VARIABLE_Q");
		expect(loadGroup.get("ActionSource")).toBe("LIVE_LOAD_Q");
	});
});
