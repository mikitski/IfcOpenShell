// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/boundary/test_edit_attributes.py`'s `TestEditAttributes`/
// `TestEditAttributesIFC2X3` (real Python runs the same body against both IFC4 and
// IFC2X3, via multiple inheritance, EXCEPT `test_sets_all_enum_variants`, which
// `TestEditAttributesIFC2X3` overrides with a narrower `internal_or_external` value
// set -- IFC2X3's own `IfcInternalOrExternalEnum` only declares `INTERNAL`/
// `EXTERNAL`/`NOTDEFINED`, missing IFC4+'s `EXTERNAL_EARTH`/`EXTERNAL_WATER`/
// `EXTERNAL_FIRE`). The first 4 real test methods (`test_sets_relating_space_and_
// building_element`/`test_defaults_enums_to_notdefined`/`test_sets_physical_or_
// virtual`/`test_sets_internal_or_external`) have no schema divergence at all and run
// against every `AVAILABLE_SCHEMAS` entry; `test_sets_all_enum_variants` is ported as
// its own describe block, gated per-schema to reproduce the exact real value set for
// each.

import { describe, expect, test } from "vitest";
import { editAttributes } from "../../../src/api/boundary/editAttributes";
import { createEntity } from "../../../src/api/root/createEntity";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

function setupBoundary(file: IfcFile): { boundary: EntityInstance; space: EntityInstance; wall: EntityInstance } {
	const space = createEntity(file, { ifcClass: "IfcSpace" });
	const wall = createEntity(file, { ifcClass: "IfcWall" });
	const boundary = createEntity(file, { ifcClass: "IfcRelSpaceBoundary" });
	return { boundary, space, wall };
}

describe.each(AVAILABLE_SCHEMAS)("api.boundary.editAttributes (%s)", (schema) => {
	test("sets relating space and building element", () => {
		const file = createTestFile(schema);
		const { boundary, space, wall } = setupBoundary(file);
		editAttributes(file, { entity: boundary, relatingSpace: space, relatedBuildingElement: wall });
		expect((boundary.get("RelatingSpace") as EntityInstance).equals(space)).toBe(true);
		expect((boundary.get("RelatedBuildingElement") as EntityInstance).equals(wall)).toBe(true);
	});

	test("defaults enums to NOTDEFINED", () => {
		const file = createTestFile(schema);
		const { boundary, space, wall } = setupBoundary(file);
		editAttributes(file, { entity: boundary, relatingSpace: space, relatedBuildingElement: wall });
		expect(boundary.get("PhysicalOrVirtualBoundary")).toBe("NOTDEFINED");
		expect(boundary.get("InternalOrExternalBoundary")).toBe("NOTDEFINED");
	});

	test("sets physical or virtual", () => {
		const file = createTestFile(schema);
		const { boundary, space, wall } = setupBoundary(file);
		editAttributes(file, {
			entity: boundary,
			relatingSpace: space,
			relatedBuildingElement: wall,
			physicalOrVirtual: "PHYSICAL",
		});
		expect(boundary.get("PhysicalOrVirtualBoundary")).toBe("PHYSICAL");
	});

	test("sets internal or external", () => {
		const file = createTestFile(schema);
		const { boundary, space, wall } = setupBoundary(file);
		editAttributes(file, {
			entity: boundary,
			relatingSpace: space,
			relatedBuildingElement: wall,
			internalOrExternal: "EXTERNAL",
		});
		expect(boundary.get("InternalOrExternalBoundary")).toBe("EXTERNAL");
	});
});

// `test_sets_all_enum_variants` -- ported as its own block since IFC2X3's real value
// set genuinely differs (see this file's own header comment).
describe.each(AVAILABLE_SCHEMAS.filter((s) => s !== "IFC2X3"))(
	"api.boundary.editAttributes sets all enum variants (%s)",
	(schema) => {
		test("every PhysicalOrVirtualBoundary/InternalOrExternalBoundary value round-trips", () => {
			const file = createTestFile(schema);
			const { boundary, space, wall } = setupBoundary(file);

			for (const value of ["PHYSICAL", "VIRTUAL", "NOTDEFINED"]) {
				editAttributes(file, {
					entity: boundary,
					relatingSpace: space,
					relatedBuildingElement: wall,
					physicalOrVirtual: value,
				});
				expect(boundary.get("PhysicalOrVirtualBoundary")).toBe(value);
			}

			for (const value of ["INTERNAL", "EXTERNAL", "EXTERNAL_EARTH", "EXTERNAL_WATER", "EXTERNAL_FIRE", "NOTDEFINED"]) {
				editAttributes(file, {
					entity: boundary,
					relatingSpace: space,
					relatedBuildingElement: wall,
					internalOrExternal: value,
				});
				expect(boundary.get("InternalOrExternalBoundary")).toBe(value);
			}
		});
	},
);

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))(
	"api.boundary.editAttributes sets all enum variants (IFC2X3)",
	() => {
		test("every PhysicalOrVirtualBoundary value, and IFC2X3's own narrower InternalOrExternalBoundary set, round-trips", () => {
			const file = createTestFile("IFC2X3");
			const { boundary, space, wall } = setupBoundary(file);

			for (const value of ["PHYSICAL", "VIRTUAL", "NOTDEFINED"]) {
				editAttributes(file, {
					entity: boundary,
					relatingSpace: space,
					relatedBuildingElement: wall,
					physicalOrVirtual: value,
				});
				expect(boundary.get("PhysicalOrVirtualBoundary")).toBe(value);
			}

			// IFC2X3 only has INTERNAL, EXTERNAL, NOTDEFINED.
			for (const value of ["INTERNAL", "EXTERNAL", "NOTDEFINED"]) {
				editAttributes(file, {
					entity: boundary,
					relatingSpace: space,
					relatedBuildingElement: wall,
					internalOrExternal: value,
				});
				expect(boundary.get("InternalOrExternalBoundary")).toBe(value);
			}
		});
	},
);
