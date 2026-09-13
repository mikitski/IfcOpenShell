// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/layer/test_assign_layer.py` (src/ifcopenshell-python) --
// both real Python test methods ported verbatim, plus new Transaction/undo-redo
// regression coverage (no Python counterpart).

import { describe, expect, test } from "vitest";
import { assignLayer } from "../../../src/api/layer/assignLayer";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

/** Python's `set(...) == set(...)` for `EntityInstance` arrays -- compares by identity, order-independent. */
function identitySet(items: readonly EntityInstance[]): Set<number> {
	return new Set(items.map((item) => item.identity()));
}

describe.each(AVAILABLE_SCHEMAS)("api.layer.assignLayer (%s)", (schema) => {
	test("test_assign_layer_to_items", () => {
		const file = createTestFile(schema);
		const items = [file.createEntity("IfcExtrudedAreaSolid"), file.createEntity("IfcExtrudedAreaSolid")];
		const layer = file.createEntity("IfcPresentationLayerAssignment");

		assignLayer(file, { items, layer });

		const assignedItems = layer.get("AssignedItems") as EntityInstance[];
		expect(assignedItems.length).toBe(2);
		expect(identitySet(assignedItems)).toEqual(identitySet(items));
	});

	test("test_assign_additional_items", () => {
		const file = createTestFile(schema);
		const items = [
			file.createEntity("IfcExtrudedAreaSolid"),
			file.createEntity("IfcExtrudedAreaSolid"),
			file.createEntity("IfcExtrudedAreaSolid"),
			file.createEntity("IfcExtrudedAreaSolid"),
		];
		const layer = file.createEntity("IfcPresentationLayerAssignment");

		assignLayer(file, { items: items.slice(0, 2), layer });
		assignLayer(file, { items: items.slice(2), layer });

		const assignedItems = layer.get("AssignedItems") as EntityInstance[];
		expect(assignedItems.length).toBe(4);
		expect(identitySet(assignedItems)).toEqual(identitySet(items));
	});

	test("re-assigning already-assigned items is a no-op", () => {
		const file = createTestFile(schema);
		const items = [file.createEntity("IfcExtrudedAreaSolid")];
		const layer = file.createEntity("IfcPresentationLayerAssignment");

		assignLayer(file, { items, layer });
		assignLayer(file, { items, layer });

		expect((layer.get("AssignedItems") as EntityInstance[]).length).toBe(1);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.layer.assignLayer Transaction/undo-redo (%s)", (schema) => {
	test("undo restores the previous AssignedItems; redo reapplies the assignment", () => {
		const file = createTestFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const layer = file.createEntity("IfcPresentationLayerAssignment");

		file.beginTransaction();
		assignLayer(file, { items: [item], layer });
		file.endTransaction();

		expect((layer.get("AssignedItems") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect(layer.get("AssignedItems")).toBeNull();

		file.redo();
		const assignedItems = layer.get("AssignedItems") as EntityInstance[];
		expect(assignedItems.length).toBe(1);
		expect(assignedItems[0].equals(item)).toBe(true);
	});
});
