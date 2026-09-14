// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/type/test_map_type_representation.py`
// (src/ifcopenshell-python). Real Python has 2 test methods:
//
//   - `test_doing_nothing_if_the_type_has_no_representation_maps`: a genuine, fully
//     portable no-op (real `map_type_representations.py`'s own early-return guard).
//     Ported below verbatim.
//   - `test_removing_existing_element_representations_and_mapping_type_representations`:
//     exercises real Python's *second* loop, which needs
//     `ifcopenshell.api.geometry.map_representation`/`.assign_representation` --
//     neither ported yet (see `../../../src/api/type/mapTypeRepresentations.ts`'s own
//     header comment for the full disclosure). NOT silently dropped: pinned below as
//     a dedicated "throws the disclosed blocked error" regression test instead,
//     matching this project's established `addConversionBasedUnit.test.ts`/
//     `editPset.test.ts` "pin the disclosed blocked behavior with a dedicated test"
//     precedent.
//
// No dedicated Transaction/undo-redo test in this file: `mapTypeRepresentations`
// currently has no successful mutating code path at all (it's either a real no-op, or
// throws before touching the file) -- the Transaction/undo-redo coverage this project
// requires for every *mutating* function is instead carried by `assignType.test.ts`'s
// own Transaction describe block, which exercises `assignType`'s real mutations
// (`IfcRelDefinesByType` create/reuse/merge, `PredefinedType`/`ObjectType` cleanup).

import { describe, expect, test } from "vitest";
import { mapTypeRepresentations } from "../../../src/api/type/mapTypeRepresentations";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

const BLOCKED_ERROR = /needs api\.geometry\.mapRepresentation\/api\.geometry\.assignRepresentation/;

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
});

describe.each(AVAILABLE_SCHEMAS)("api.type.mapTypeRepresentations (%s) -- disclosed, currently blocked", (schema) => {
	test("removing existing element representations and mapping type representations " +
		"(real Python: rep.RepresentationType === 'MappedRepresentation', " +
		"rep.Items[0].MappingSource === type.RepresentationMaps[0]) -- blocked on api.geometry.mapRepresentation/assignRepresentation", () => {
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
					file.createEntity("IfcAxis2Placement3D"),
					withAttrs(file, "IfcShapeRepresentation", { ContextOfItems: context }),
				),
			],
		});
		file.createEntity("IfcRelDefinesByType", guid.new(), null, null, null, [element], type);

		expect(() => mapTypeRepresentations(file, { relatedObject: element, relatingType: type })).toThrow(BLOCKED_ERROR);
	});
});
