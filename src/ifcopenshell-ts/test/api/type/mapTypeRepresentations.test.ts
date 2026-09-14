// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/type/test_map_type_representation.py`
// (src/ifcopenshell-python). Real Python has 2 test methods, BOTH ported for real below
// now that `api.geometry.mapRepresentation`/`.assignRepresentation` have landed (see
// `../../../src/api/type/mapTypeRepresentations.ts`'s own header comment -- this
// replaces the previous "throws the disclosed blocked error" pin for
// `test_removing_existing_element_representations_and_mapping_type_representations`,
// which now passes for real):
//
//   - `test_doing_nothing_if_the_type_has_no_representation_maps`: real
//     `map_type_representations.py`'s own early-return guard.
//   - `test_removing_existing_element_representations_and_mapping_type_representations`:
//     exercises the real two-loop body -- strips the occurrence's existing
//     representation(s), then maps every one of the type's `RepresentationMaps` back
//     onto the occurrence via a fresh `IfcMappedItem`.
//
// No dedicated Transaction/undo-redo test in this file: this project's Transaction/
// undo-redo coverage for this exact mutation shape (unassign+remove, then
// map+assign) is carried by `assignType.test.ts`'s own Transaction describe block and
// this chunk's own `assignRepresentation.test.ts`/`mapRepresentation.test.ts`, which
// exercise the same underlying primitives directly.

import { describe, expect, test } from "vitest";
import { mapTypeRepresentations } from "../../../src/api/type/mapTypeRepresentations";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

describe.each(AVAILABLE_SCHEMAS)("api.type.mapTypeRepresentations (%s)", (schema) => {
	test("doing nothing if the type has no representation maps", () => {
		const file = createTestFile(schema);
		const element = file.createEntity("IfcWall");
		const type = file.createEntity("IfcWallType");
		const totalBefore = [...file].length;

		mapTypeRepresentations(file, { relatedObject: element, relatingType: type });

		expect([...file].length).toBe(totalBefore);
	});

	test("removing existing element representations and mapping type representations", () => {
		const file = createTestFile(schema);
		const context = file.createEntity("IfcGeometricRepresentationSubContext");
		const element = withAttrs(file, "IfcWall", {
			Representation: withAttrs(file, "IfcProductDefinitionShape", {
				Representations: [withAttrs(file, "IfcShapeRepresentation", { ContextOfItems: context })],
			}),
		});
		const type = withAttrs(file, "IfcWallType", {
			RepresentationMaps: [
				file.createEntity(
					"IfcRepresentationMap",
					null,
					withAttrs(file, "IfcShapeRepresentation", { ContextOfItems: context }),
				),
			],
		});
		file.createEntity("IfcRelDefinesByType", guid.new(), null, null, null, [element], type);

		mapTypeRepresentations(file, { relatedObject: element, relatingType: type });

		const rep = (element.get("Representation") as EntityInstance).get("Representations") as EntityInstance[];
		expect(rep[0]?.get("RepresentationType")).toBe("MappedRepresentation");
		const items = rep[0]?.get("Items") as EntityInstance[];
		const representationMaps = type.get("RepresentationMaps") as EntityInstance[];
		expect((items[0]?.get("MappingSource") as EntityInstance).equals(representationMaps[0] as EntityInstance)).toBe(
			true,
		);
		expect(file.byType("IfcShapeRepresentation")).toHaveLength(2);
	});
});
