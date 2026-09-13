// This file was generated with the assistance of an AI coding tool.
//
// No Python test file exists for `edit_layer.py` (this real Python source has no
// `test/api/layer/test_edit_layer.py` counterpart at all -- confirmed by directory
// listing). Tests below are new, matching `../context/editContext.test.ts`'s identical
// shape for the identically-shaped `edit_context`/`edit_layer` pattern.

import { describe, expect, test } from "vitest";
import { editLayer } from "../../../src/api/layer/editLayer";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.layer.editLayer (%s)", (schema) => {
	test("editing a layer's attributes", () => {
		const file = createTestFile(schema);
		const layer = file.createEntity("IfcPresentationLayerAssignment", "Name");
		editLayer(file, {
			layer,
			attributes: { Description: "All walls, based on the AIA standard.", Identifier: "AI-WALL" },
		});
		expect(layer.get("Description")).toBe("All walls, based on the AIA standard.");
		expect(layer.get("Identifier")).toBe("AI-WALL");
		expect(layer.get("Name")).toBe("Name");
	});

	test("editing an IfcPresentationLayerWithStyle's own attributes too", () => {
		const file = createTestFile(schema);
		const layer = file.createEntity(
			"IfcPresentationLayerWithStyle",
			"Name",
			null,
			null,
			null,
			"UNKNOWN",
			"UNKNOWN",
			"UNKNOWN",
			[],
		);
		editLayer(file, { layer, attributes: { LayerOn: true } });
		expect(layer.get("LayerOn")).toBe(1);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.layer.editLayer Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous attribute values; redo reapplies the edit", () => {
		const file = createTestFile(schema);
		const layer = file.createEntity("IfcPresentationLayerAssignment", "Old");

		file.beginTransaction();
		editLayer(file, { layer, attributes: { Name: "New", Description: "Updated" } });
		file.endTransaction();

		expect(layer.get("Name")).toBe("New");
		expect(layer.get("Description")).toBe("Updated");

		file.undo();
		expect(layer.get("Name")).toBe("Old");
		expect(layer.get("Description")).toBeNull();

		file.redo();
		expect(layer.get("Name")).toBe("New");
		expect(layer.get("Description")).toBe("Updated");
	});
});
