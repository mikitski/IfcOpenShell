// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/layer/test_unassign_layer.py` (src/ifcopenshell-python)
// -- both real Python test methods ported verbatim, plus:
// - a dedicated regression test pinning the real Python-source bug disclosed in
//   `../../../src/api/layer/unassignLayer.ts`'s header comment (calling
//   `unassign_layer` on a layer whose `AssignedItems` was never set crashes, in both
//   real Python and this port, rather than being treated as "nothing to unassign");
// - a test for the "not a full subset -> no-op" branch (real Python: `if not
//   items_set.issubset(assigned_items): return`, i.e. a partial-match unassign touches
//   nothing at all, not even the items that DO match);
// - new Transaction/undo-redo regression coverage (no Python counterpart).

import { describe, expect, test } from "vitest";
import { assignLayer } from "../../../src/api/layer/assignLayer";
import { unassignLayer } from "../../../src/api/layer/unassignLayer";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function identitySet(items: readonly EntityInstance[]): Set<number> {
	return new Set(items.map((item) => item.identity()));
}

describe.each(AVAILABLE_SCHEMAS)("api.layer.unassignLayer (%s)", (schema) => {
	test("test_unassign_layer_from_items", () => {
		const file = createTestFile(schema);
		const items = [
			file.createEntity("IfcExtrudedAreaSolid"),
			file.createEntity("IfcExtrudedAreaSolid"),
			file.createEntity("IfcExtrudedAreaSolid"),
		];
		const layer = file.createEntity("IfcPresentationLayerAssignment");
		assignLayer(file, { items, layer });

		unassignLayer(file, { items: items.slice(2), layer });

		const assignedItems = layer.get("AssignedItems") as EntityInstance[];
		expect(assignedItems.length).toBe(2);
		expect(identitySet(assignedItems)).toEqual(identitySet(items.slice(0, 2)));
	});

	test("test_remove_layer_if_all_items_are_unassigned", () => {
		const file = createTestFile(schema);
		const items = [
			file.createEntity("IfcExtrudedAreaSolid"),
			file.createEntity("IfcExtrudedAreaSolid"),
			file.createEntity("IfcExtrudedAreaSolid"),
		];
		const layer = file.createEntity("IfcPresentationLayerAssignment");
		assignLayer(file, { items, layer });

		unassignLayer(file, { items, layer });

		expect(file.byType("IfcPresentationLayerAssignment").length).toBe(0);
	});

	test("a partial-match unassign (not a full subset) is a no-op", () => {
		const file = createTestFile(schema);
		const assigned = file.createEntity("IfcExtrudedAreaSolid");
		const notAssigned = file.createEntity("IfcExtrudedAreaSolid");
		const layer = file.createEntity("IfcPresentationLayerAssignment");
		assignLayer(file, { items: [assigned], layer });

		unassignLayer(file, { items: [assigned, notAssigned], layer });

		const assignedItems = layer.get("AssignedItems") as EntityInstance[];
		expect(assignedItems.length).toBe(1);
		expect(assignedItems[0].equals(assigned)).toBe(true);
	});

	// --- Disclosed real-Python-source bug, reproduced verbatim (see
	// `unassignLayer.ts`'s header comment) ---
	test("crashes (matching real Python's TypeError) when called on a never-assigned layer", () => {
		const file = createTestFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const layer = file.createEntity("IfcPresentationLayerAssignment");

		expect(layer.get("AssignedItems")).toBeNull();
		expect(() => unassignLayer(file, { items: [item], layer })).toThrow();
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.layer.unassignLayer Transaction/undo-redo (%s)", (schema) => {
	test("undo restores AssignedItems after a partial unassign; redo reapplies it", () => {
		const file = createTestFile(schema);
		const items = [file.createEntity("IfcExtrudedAreaSolid"), file.createEntity("IfcExtrudedAreaSolid")];
		const layer = file.createEntity("IfcPresentationLayerAssignment");
		assignLayer(file, { items, layer });
		const layerId = layer.id();

		file.beginTransaction();
		unassignLayer(file, { items: items.slice(1), layer });
		file.endTransaction();

		expect((file.byId(layerId).get("AssignedItems") as EntityInstance[]).length).toBe(1);

		file.undo();
		expect((file.byId(layerId).get("AssignedItems") as EntityInstance[]).length).toBe(2);

		file.redo();
		expect((file.byId(layerId).get("AssignedItems") as EntityInstance[]).length).toBe(1);
	});

	test("undo restores the deleted layer after unassigning its last item; redo removes it again", () => {
		const file = createTestFile(schema);
		const item = file.createEntity("IfcExtrudedAreaSolid");
		const layer = file.createEntity("IfcPresentationLayerAssignment");
		assignLayer(file, { items: [item], layer });
		const layerId = layer.id();

		file.beginTransaction();
		unassignLayer(file, { items: [item], layer });
		file.endTransaction();

		expect(() => file.byId(layerId)).toThrow();

		file.undo();
		expect(file.byId(layerId).isA("IfcPresentationLayerAssignment")).toBe(true);
		expect((file.byId(layerId).get("AssignedItems") as EntityInstance[]).length).toBe(1);

		file.redo();
		expect(() => file.byId(layerId)).toThrow();
	});
});
