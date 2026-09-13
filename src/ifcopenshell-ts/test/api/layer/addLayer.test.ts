// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/layer/test_add_layer.py` (src/ifcopenshell-python) --
// both real Python test methods ported verbatim, plus new Transaction/undo-redo
// regression coverage (no Python counterpart).

import { describe, expect, test } from "vitest";
import { addLayer } from "../../../src/api/layer/addLayer";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.layer.addLayer (%s)", (schema) => {
	test("test_add_layer_no_arguments", () => {
		const file = createTestFile(schema);
		const layer = addLayer(file, {});
		expect(layer.get("Name")).toBe("Unnamed");
	});

	test("test_assign_additional_items", () => {
		const file = createTestFile(schema);
		const layer = addLayer(file, { name: "Name" });
		expect(layer.get("Name")).toBe("Name");
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.layer.addLayer Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcPresentationLayerAssignment; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const layer = addLayer(file, { name: "AI-WALL" });
		file.endTransaction();
		const id = layer.id();

		expect(file.byId(id).isA("IfcPresentationLayerAssignment")).toBe(true);

		file.undo();
		expect(() => file.byId(id)).toThrow();

		file.redo();
		expect(file.byId(id).isA("IfcPresentationLayerAssignment")).toBe(true);
		expect(file.byId(id).get("Name")).toBe("AI-WALL");
	});
});
