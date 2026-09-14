// This file was generated with the assistance of an AI coding tool.
//
// TS test coverage for `mapRepresentation` (Python: `ifcopenshell.api.geometry.
// map_representation`) -- see `../../../src/api/geometry/mapRepresentation.ts`'s own
// header comment. **No real Python test file exists for this function** (confirmed by
// searching `src/ifcopenshell-python/test/api/geometry/` directly -- there is no
// `test_map_representation.py`, unlike every other `api.geometry` function this project
// has ported so far). This chunk's own coverage is written directly against the real
// Python source instead (`map_representation.py`, 64 lines): the two `get_mapping_source`
// branches (reuse an existing `IfcRepresentationMap` inverse vs. create a fresh one),
// the returned `IfcShapeRepresentation`'s copied `ContextOfItems`/
// `RepresentationIdentifier` and fixed `RepresentationType`, and Transaction/undo-redo.

import { describe, expect, test } from "vitest";
import { mapRepresentation } from "../../../src/api/geometry/mapRepresentation";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.geometry.mapRepresentation (%s)", (schema) => {
	test("creates a fresh IfcRepresentationMap when none exists yet", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const representation = file.createEntity("IfcShapeRepresentation", context, "Body", "SweptSolid", []);

		const mapped = mapRepresentation(file, { representation });

		expect(mapped.get("RepresentationType")).toBe("MappedRepresentation");
		expect((mapped.get("ContextOfItems") as EntityInstance).equals(context)).toBe(true);
		expect(mapped.get("RepresentationIdentifier")).toBe("Body");

		const items = mapped.get("Items") as EntityInstance[];
		expect(items).toHaveLength(1);
		const mappedItem = items[0] as EntityInstance;
		expect(mappedItem.isA("IfcMappedItem")).toBe(true);

		const mappingSource = mappedItem.get("MappingSource") as EntityInstance;
		expect(mappingSource.isA("IfcRepresentationMap")).toBe(true);
		expect((mappingSource.get("MappedRepresentation") as EntityInstance).equals(representation)).toBe(true);

		expect(file.byType("IfcRepresentationMap")).toHaveLength(1);
	});

	test("reuses an existing IfcRepresentationMap already pointing at the representation", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const representation = file.createEntity("IfcShapeRepresentation", context, null, null, []);
		const existingMap = file.createEntity(
			"IfcRepresentationMap",
			file.createEntity("IfcAxis2Placement3D"),
			representation,
		);

		const mapped = mapRepresentation(file, { representation });

		const items = mapped.get("Items") as EntityInstance[];
		const mappingSource = items[0]?.get("MappingSource") as EntityInstance;
		expect(mappingSource.equals(existingMap)).toBe(true);
		// No second IfcRepresentationMap was created.
		expect(file.byType("IfcRepresentationMap")).toHaveLength(1);
	});

	test("mapping the same representation twice creates two independent wrapper representations, sharing the same reused map", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const representation = file.createEntity("IfcShapeRepresentation", context, null, null, []);

		const mapped1 = mapRepresentation(file, { representation });
		const mapped2 = mapRepresentation(file, { representation });

		expect(mapped1.id()).not.toBe(mapped2.id());
		const source1 = (mapped1.get("Items") as EntityInstance[])[0]?.get("MappingSource") as EntityInstance;
		const source2 = (mapped2.get("Items") as EntityInstance[])[0]?.get("MappingSource") as EntityInstance;
		expect(source1.equals(source2)).toBe(true);
		expect(file.byType("IfcRepresentationMap")).toHaveLength(1);
	});
});

// --- Transaction/undo-redo regression coverage ---

describe.each(AVAILABLE_SCHEMAS)("api.geometry.mapRepresentation Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcMappedItem/IfcShapeRepresentation/IfcRepresentationMap; redo re-creates them", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationContext");
		const representation = file.createEntity("IfcShapeRepresentation", context, null, null, []);
		const totalBefore = [...file].length;

		file.beginTransaction();
		const mapped = mapRepresentation(file, { representation });
		file.endTransaction();
		const mappedId = mapped.id();

		expect([...file].length).toBeGreaterThan(totalBefore);
		expect(file.byType("IfcRepresentationMap")).toHaveLength(1);

		file.undo();
		expect([...file].length).toBe(totalBefore);
		expect(() => file.byId(mappedId)).toThrow();

		file.redo();
		expect([...file].length).toBeGreaterThan(totalBefore);
		expect(file.byId(mappedId).get("RepresentationType")).toBe("MappedRepresentation");
	});
});
