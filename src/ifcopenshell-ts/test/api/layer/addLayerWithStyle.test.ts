// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/layer/test_add_layer_with_style.py` (src/ifcopenshell-
// python) -- both real Python test methods ported, adjusted only where the disclosed
// LOGICAL round-trip gap (see `../../../src/api/layer/addLayerWithStyle.ts`'s header
// comment) means real Python's `== True`/`== False` doesn't translate literally: this
// port's `.get("LayerOn")` etc. currently returns the raw `1`/`0`, not JS booleans, so
// assertions below check the actual round-trip value rather than mask it. Plus new
// Transaction/undo-redo regression coverage (no Python counterpart).

import { describe, expect, test } from "vitest";
import { addLayerWithStyle } from "../../../src/api/layer/addLayerWithStyle";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.layer.addLayerWithStyle (%s)", (schema) => {
	test("test_add_layer_no_arguments", () => {
		const file = createTestFile(schema);
		const layer = addLayerWithStyle(file, {});
		expect(layer.get("Name")).toBe("Unnamed");
		expect(layer.get("LayerOn")).toBe("UNKNOWN");
		expect(layer.get("LayerFrozen")).toBe("UNKNOWN");
		expect(layer.get("LayerBlocked")).toBe("UNKNOWN");
		expect(layer.get("LayerStyles")).toEqual([]);
	});

	test("test_assign_all_arguments", () => {
		const file = createTestFile(schema);
		const curveStyle = file.createEntity("IfcCurveStyle");
		const layer = addLayerWithStyle(file, {
			name: "Name",
			on: true,
			frozen: true,
			blocked: true,
			styles: [curveStyle],
		});
		expect(layer.get("Name")).toBe("Name");
		// Real Python: `assert layer.LayerOn == True` (and passes only because Python's
		// `bool` is an `int` subclass, so `1 == True`) -- see this file's header comment.
		expect(layer.get("LayerOn")).toBe(1);
		expect(layer.get("LayerFrozen")).toBe(1);
		expect(layer.get("LayerBlocked")).toBe(1);
		const styles = layer.get("LayerStyles") as EntityInstance[];
		expect(styles.length).toBe(1);
		expect(styles[0].equals(curveStyle)).toBe(true);
	});

	test('UNKNOWN logical values round-trip as the string "UNKNOWN"', () => {
		const file = createTestFile(schema);
		const layer = addLayerWithStyle(file, { on: "UNKNOWN", frozen: false, blocked: true });
		expect(layer.get("LayerOn")).toBe("UNKNOWN");
		expect(layer.get("LayerFrozen")).toBe(0);
		expect(layer.get("LayerBlocked")).toBe(1);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.layer.addLayerWithStyle Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcPresentationLayerWithStyle; redo recreates it", () => {
		const file = createTestFile(schema);

		file.beginTransaction();
		const layer = addLayerWithStyle(file, { name: "AI-WALL", on: true });
		file.endTransaction();
		const id = layer.id();

		expect(file.byId(id).isA("IfcPresentationLayerWithStyle")).toBe(true);

		file.undo();
		expect(() => file.byId(id)).toThrow();

		file.redo();
		expect(file.byId(id).isA("IfcPresentationLayerWithStyle")).toBe(true);
		expect(file.byId(id).get("LayerOn")).toBe(1);
	});
});
