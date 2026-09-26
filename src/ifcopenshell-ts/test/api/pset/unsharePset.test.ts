// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/pset/test_unshare_pset.py` (src/ifcopenshell-python) --
// all 3 real Python test methods ported, adapted to construct `IfcWall`/`IfcWallType`
// fixtures directly and to use `./addPset.ts`'s own real, exported function for setup
// (real Python's fixtures already use `ifcopenshell.api.pset.add_pset` directly, so no
// substitution is even needed here -- unlike most other ported test files in this
// chunk). Real Python's `TestUnsharePsetIFC2X3` is a no-op subclass (`pass`).
//
// Original coverage added beyond the real Python file: the "no products provided" and
// "sole element" `Exception`-raising paths (real Python's own `test_unshare_pset.py`
// never exercises either, despite `unshare_pset.py`'s own source explicitly raising
// both).

import { describe, expect, test } from "vitest";
import { addPset } from "../../../src/api/pset/addPset";
import { unsharePset } from "../../../src/api/pset/unsharePset";
import type { EntityInstance } from "../../../src/entityInstance";
import { getElementsByPset } from "../../../src/util/element";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function idSet(instances: Iterable<EntityInstance>): Set<number> {
	return new Set([...instances].map((i) => i.id()));
}

describe.each(AVAILABLE_SCHEMAS)("api.pset.unsharePset (%s)", (schema) => {
	test("unshare pset for occurrence", () => {
		const file = createTestFile(schema);
		const elements = [file.createEntity("IfcWall"), file.createEntity("IfcWall"), file.createEntity("IfcWall")];

		const pset = addPset(file, { product: elements[0], name: "Foo" });
		const rel = file.byType("IfcRelDefinesByProperties")[0];
		rel.set("RelatedObjects", elements);

		const newPsets = unsharePset(file, { products: elements.slice(0, 2), pset });
		expect(newPsets.length).toBe(2);

		const psets = file.byType("IfcPropertySet");
		expect(psets.length).toBe(3);
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(3);

		const usedElements = new Set<number>();
		for (const p of psets) {
			const pElements = getElementsByPset(p);
			expect(pElements.size).toBe(1);
			for (const e of pElements) usedElements.add(e.id());
		}
		expect(usedElements).toEqual(idSet(elements));
	});

	test("unshare pset for type", () => {
		const file = createTestFile(schema);
		const elements = [
			file.createEntity("IfcWallType"),
			file.createEntity("IfcWallType"),
			file.createEntity("IfcWallType"),
		];

		const pset = addPset(file, { product: elements[0], name: "Foo" });
		elements[1].set("HasPropertySets", [pset]);
		elements[2].set("HasPropertySets", [pset]);

		const newPsets = unsharePset(file, { products: elements.slice(0, 2), pset });
		expect(newPsets.length).toBe(2);

		const psets = file.byType("IfcPropertySet");
		expect(psets.length).toBe(3);
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(0);

		const usedPsets = new Set<number>();
		for (const element of elements) {
			const elementPsets = element.get("HasPropertySets") as EntityInstance[];
			expect(elementPsets.length).toBe(1);
			usedPsets.add(elementPsets[0].id());
		}
		expect(usedPsets).toEqual(idSet(psets));
	});

	test("unshare pset for all pset elements", () => {
		const file = createTestFile(schema);
		const elements = [file.createEntity("IfcWall"), file.createEntity("IfcWall"), file.createEntity("IfcWall")];

		const pset = addPset(file, { product: elements[0], name: "Foo" });
		const psetId = pset.id();
		const rel = file.byType("IfcRelDefinesByProperties")[0];
		rel.set("RelatedObjects", elements);

		const newPsets = unsharePset(file, { products: elements, pset });
		// Original pset still exists and it's not orphaned.
		expect(() => file.byId(psetId)).not.toThrow();

		expect(newPsets.length).toBe(2);

		const psets = file.byType("IfcPropertySet");
		expect(psets.length).toBe(3);
		expect(file.byType("IfcRelDefinesByProperties").length).toBe(3);

		const usedElements = new Set<number>();
		for (const p of psets) {
			const pElements = getElementsByPset(p);
			expect(pElements.size).toBe(1);
			for (const e of pElements) usedElements.add(e.id());
		}
		expect(usedElements).toEqual(idSet(elements));
	});

	// --- Original coverage: the two `Exception`-raising paths ---

	test("throws when no products are provided", () => {
		const file = createTestFile(schema);
		const pset = file.createEntity("IfcPropertySet");
		expect(() => unsharePset(file, { products: [], pset })).toThrow("No products provided.");
	});

	test("throws when the sole provided product is the pset's only element", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const pset = addPset(file, { product: element, name: "Solo" });
		expect(() => unsharePset(file, { products: [element], pset })).toThrow(
			/is the only element to which pset is assigned/,
		);
	});
});

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.pset.unsharePset Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the copied psets and restores original sharing; redo recreates them", () => {
		const file = createTestFile(schema);
		const elements = [file.createEntity("IfcWall"), file.createEntity("IfcWall"), file.createEntity("IfcWall")];
		const pset = addPset(file, { product: elements[0], name: "Foo" });
		const rel = file.byType("IfcRelDefinesByProperties")[0];
		rel.set("RelatedObjects", elements);

		file.beginTransaction();
		const newPsets = unsharePset(file, { products: elements.slice(0, 2), pset });
		file.endTransaction();
		const newPsetIds = newPsets.map((p) => p.id());

		expect(file.byType("IfcPropertySet").length).toBe(3);

		file.undo();
		expect(file.byType("IfcPropertySet").length).toBe(1);
		for (const id of newPsetIds) {
			expect(() => file.byId(id)).toThrow();
		}
		expect(idSet(getElementsByPset(pset))).toEqual(idSet(elements));

		file.redo();
		expect(file.byType("IfcPropertySet").length).toBe(3);
		for (const id of newPsetIds) {
			expect(() => file.byId(id)).not.toThrow();
		}
	});
});
