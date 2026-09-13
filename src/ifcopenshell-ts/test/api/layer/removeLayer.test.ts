// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `remove_layer.py` (no `test_remove_layer.py`
// counterpart -- confirmed by directory listing). Tests below are new, matching
// `../context/removeContext.test.ts`'s style for a comparably-shaped single-call
// removal function -- including confirming that assigned representation items
// survive the layer's own removal, per this function's own docstring ("All
// representation items assigned to the layer will remain").

import { describe, expect, test } from "vitest";
import { assignLayer } from "../../../src/api/layer/assignLayer";
import { removeLayer } from "../../../src/api/layer/removeLayer";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.layer.removeLayer (%s)", (schema) => {
	test("removing a layer", () => {
		const file = createTestFile(schema);
		const layer = file.createEntity("IfcPresentationLayerAssignment", "AI-WALL");

		removeLayer(file, { layer });

		expect(file.byType("IfcPresentationLayerAssignment").length).toBe(0);
	});

	test("removing a layer leaves its assigned representation items intact", () => {
		const file = createTestFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const layer = file.createEntity("IfcPresentationLayerAssignment", "AI-WALL");
		assignLayer(file, { items: [item], layer });

		removeLayer(file, { layer });

		expect(file.byType("IfcPresentationLayerAssignment").length).toBe(0);
		expect(file.byType("IfcExtrudedAreaSolid").length).toBe(1);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.layer.removeLayer Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the removed layer; redo removes it again", () => {
		const file = createTestFile(schema);
		const layer = file.createEntity("IfcPresentationLayerAssignment", "AI-WALL");
		const id = layer.id();

		file.beginTransaction();
		removeLayer(file, { layer });
		file.endTransaction();

		expect(() => file.byId(id)).toThrow();

		file.undo();
		expect(file.byId(id).isA("IfcPresentationLayerAssignment")).toBe(true);
		expect(file.byId(id).get("Name")).toBe("AI-WALL");

		file.redo();
		expect(() => file.byId(id)).toThrow();
	});
});
