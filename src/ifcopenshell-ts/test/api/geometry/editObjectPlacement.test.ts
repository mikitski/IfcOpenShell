// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/geometry/test_edit_object_placement.py`
// (src/ifcopenshell-python, `TestEditObjectPlacement`/`TestEditObjectPlacementIFC2X3`).
// Every real Python test method in the shared base class is ported below, run against
// `AVAILABLE_SCHEMAS` (real Python only ever exercises this against IFC4/IFC2X3, via
// its own two concrete test classes -- nothing here is schema-specific, so running it
// against every locally-available schema, matching this project's established
// precedent for schema-agnostic fixtures, is strictly more coverage, not a divergence).
// `TestEditObjectPlacementIFC2X3`'s own one IFC2X3-ONLY extra test
// (`test_changing_placements_relative_to_a_distribution_element` -- functionally a near
// duplicate of the shared `test_changing_placements_relative_to_a_nest_parent`, just
// re-run explicitly under the IFC2X3 subclass for extra emphasis on the dedicated
// `IfcRelConnectsPortToElement` mechanism) is ported gated on
// `AVAILABLE_SCHEMAS.includes("IFC2X3")` -- CI's native build only registers IFC4 by
// default (`SCHEMA_VERSIONS=4`), so this never silently fails to run there, matching
// this project's own established "no hardcoded, ungated per-schema `describe` block"
// discipline (several past PRs hit real CI failures from exactly that mistake).
//
// Real Python's own fixtures lean on 2 sibling `api.*` functions this codebase hasn't
// ported yet: `api.feature.add_feature`/`add_filling` (an entirely unstarted module,
// per `planning/ifcopenshell-ts/PROGRESS.md`). Every test needing them builds the
// `IfcRelVoidsElement`/`IfcRelFillsElement`/`IfcRelProjectsElement` relationship
// directly via `file.createEntity`/`withAttrs` instead, matching
// `test/api/root/copyClass.test.ts`'s own identical, already-established substitution
// for the exact same two relationship classes (`api.feature` is one of that file's own
// disclosed substitutions too).
//
// Numeric assertions use `expectClose` (`toBeCloseTo`, matching
// `test/util/placement.test.ts`'s own identical helper) rather than bitwise `toEqual`
// -- every matrix here is either a pure identity/translation (exact under floating
// point regardless) or a value that has round-tripped through `a2p`'s own
// normalize/cross-product path (`getRelativePlacement`) at least once, which is exact
// to within ordinary double-precision rounding, not bit-exact by construction. This is
// deliberate, precise numeric verification (positions AND, where relevant, rotations),
// not a loosened "doesn't throw" check -- per this chunk's own task brief's explicit
// instruction, given the matrix-math nature of this file.

import { mat4 } from "gl-matrix";
import { beforeEach, describe, expect, test } from "vitest";
import { assignObject } from "../../../src/api/aggregate/assignObject";
import { editObjectPlacement } from "../../../src/api/geometry/editObjectPlacement";
import { ownerSettings } from "../../../src/api/owner/settings";
import { assignContainer } from "../../../src/api/spatial/assignContainer";
import { addPort } from "../../../src/api/system/addPort";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import * as guid from "../../../src/guid";
import { type MatrixType, getLocalPlacement } from "../../../src/util/placement";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

/** See `test/api/root/copyClass.test.ts`'s identical `withAttrs` helper's own doc comment. */
function withAttrs(file: IfcFile, type: string, attrs: Record<string, unknown> = {}): EntityInstance {
	const entity = file.createEntity(type);
	for (const [name, value] of Object.entries(attrs)) {
		entity.set(name, value);
	}
	return entity;
}

/** See `test/util/placement.test.ts`'s identical `expectClose` helper's own doc comment. */
function expectClose(actual: readonly number[], expected: readonly number[], precision = 9): void {
	expect(actual.length).toBe(expected.length);
	for (let i = 0; i < actual.length; i++) {
		expect(actual[i]).toBeCloseTo(expected[i], precision);
	}
}

/** A pure translation matrix, matching every real Python test fixture in this file
 * (`numpy.eye(4)` with `[:3, 3]` overwritten) -- `mat4.fromTranslation` produces the
 * exact same 4x4 result (identity rotation, translation in the flat-index 12/13/14
 * column). */
function translationMatrix(x: number, y: number, z: number): MatrixType {
	return mat4.fromTranslation(mat4.create(), [x, y, z]);
}

/** `ifcopenshell.util.placement.get_local_placement(product.ObjectPlacement)` as a
 * plain 3-tuple translation, for terse assertions against a `translationMatrix(...)`
 * expectation. */
function worldTranslation(product: EntityInstance): [number, number, number] {
	const m = getLocalPlacement(product.get("ObjectPlacement") as EntityInstance);
	return [m[12], m[13], m[14]];
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.editObjectPlacement (%s)", (schema) => {
	test("test_attemping_to_edit_the_placement_of_an_invalid_element", () => {
		const file = createTestFile(schema);
		const project = file.createEntity("IfcProject");
		const result = editObjectPlacement(file, { product: project });
		expect(result).toBeUndefined();
	});

	test("test_setting_an_object_placement", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcWall");
		const matrix = translationMatrix(1, 2, 3);

		editObjectPlacement(file, { product: element, matrix: mat4.clone(matrix), isSi: false });

		expectClose(worldTranslation(element), [1, 2, 3]);
	});

	test("test_setting_an_object_placement_using_si_units", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file); // default length unit: millimetres (unit_scale 0.001)
		const element = file.createEntity("IfcWall");
		const matrix = translationMatrix(1, 2, 3); // SI (metres)

		editObjectPlacement(file, { product: element, matrix, isSi: true });

		// Persisted in project units (millimetres).
		expectClose(worldTranslation(element), [1000, 2000, 3000]);
	});

	test("test_changing_an_object_placement", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcWall");

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 2, 3), isSi: false });
		const createdIds = file.traverse(element.get("ObjectPlacement") as EntityInstance).map((e) => e.id());

		editObjectPlacement(file, { product: element, matrix: translationMatrix(4, 5, 6), isSi: false });

		expectClose(worldTranslation(element), [4, 5, 6]);
		for (const id of createdIds) {
			expect(() => file.byId(id)).toThrow();
		}
	});

	test("test_changing_an_object_placement_used_by_other_products", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 2, 3), isSi: false });
		element2.set("ObjectPlacement", element.get("ObjectPlacement"));

		editObjectPlacement(file, { product: element, matrix: translationMatrix(4, 5, 6), isSi: false });

		expectClose(worldTranslation(element), [4, 5, 6]);
		expect((element.get("ObjectPlacement") as EntityInstance).equals(element2.get("ObjectPlacement"))).toBe(false);
	});

	test("test_changing_an_object_placement_partially_used_by_other_products", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 2, 3), isSi: false });
		element2.set(
			"ObjectPlacement",
			file.createEntity(
				"IfcLocalPlacement",
				null,
				(element.get("ObjectPlacement") as EntityInstance).get("RelativePlacement"),
			),
		);

		editObjectPlacement(file, { product: element, matrix: translationMatrix(4, 5, 6), isSi: false });

		expectClose(worldTranslation(element), [4, 5, 6]);
		expectClose(worldTranslation(element2), [1, 2, 3]);
	});

	test("test_changing_an_object_placement_shared_by_its_parent", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 2, 3), isSi: false });
		subelement.set("ObjectPlacement", element.get("ObjectPlacement"));

		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(4, 5, 6), isSi: false });

		const subelementPlacement = subelement.get("ObjectPlacement") as EntityInstance;
		const subelementRelTo = subelementPlacement.get("PlacementRelTo") as EntityInstance | null;
		expect(subelementRelTo === null || !subelementRelTo.equals(subelementPlacement)).toBe(true);
		expectClose(worldTranslation(subelement), [4, 5, 6]);
		expect((element.get("ObjectPlacement") as EntityInstance).equals(subelementPlacement)).toBe(false);
	});

	test("test_changing_placements_relative_to_a_spatial_container", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });

		expectClose(worldTranslation(element), [1, 1, 1]);
		expectClose(worldTranslation(subelement), [1, 2, 3]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});

	test("test_changing_placements_relative_to_an_aggregate", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcElementAssembly");
		const subelement = file.createEntity("IfcBeam");
		assignObject(file, { products: [subelement], relatingObject: element });

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });

		expectClose(worldTranslation(element), [1, 1, 1]);
		expectClose(worldTranslation(subelement), [1, 2, 3]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});

	test("test_changing_placements_relative_to_a_nest_parent", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcFlowSegment");
		const subelement = addPort(file, { element });

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });

		expectClose(worldTranslation(element), [1, 1, 1]);
		expectClose(worldTranslation(subelement), [1, 2, 3]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});

	test("test_changing_placements_relative_to_a_voided_element", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const site = file.createEntity("IfcSite");
		const element = file.createEntity("IfcWall");
		const subelement = file.createEntity("IfcOpeningElement");
		assignContainer(file, { products: [element], relatingStructure: site });
		// Substitutes the still-unported `api.feature.add_feature` -- see this file's
		// header comment.
		withAttrs(file, "IfcRelVoidsElement", { RelatingBuildingElement: element, RelatedOpeningElement: subelement });

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });

		expectClose(worldTranslation(element), [1, 1, 1]);
		expectClose(worldTranslation(subelement), [1, 2, 3]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});

	test("test_changing_placements_relative_to_an_opening", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const site = file.createEntity("IfcSite");
		const wall = file.createEntity("IfcWall");
		const element = file.createEntity("IfcOpeningElement");
		const subelement = file.createEntity("IfcDoor");
		assignContainer(file, { products: [wall], relatingStructure: site });
		assignContainer(file, { products: [subelement], relatingStructure: site });
		// Substitutes the still-unported `api.feature.add_feature`/`add_filling` -- see
		// this file's header comment.
		withAttrs(file, "IfcRelVoidsElement", { RelatingBuildingElement: wall, RelatedOpeningElement: element });
		withAttrs(file, "IfcRelFillsElement", { RelatingOpeningElement: element, RelatedBuildingElement: subelement });

		editObjectPlacement(file, { product: site, matrix: mat4.create(), isSi: false });
		editObjectPlacement(file, { product: wall, matrix: mat4.create(), isSi: false });
		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });

		expectClose(worldTranslation(element), [1, 1, 1]);
		expectClose(worldTranslation(subelement), [1, 2, 3]);
		expect((site.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo")).toBeFalsy();
		expect(
			((wall.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				site.get("ObjectPlacement"),
			),
		).toBe(true);
		expect(
			((element.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				wall.get("ObjectPlacement"),
			),
		).toBe(true);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});

	test("test_changing_placements_relative_to_a_projected_element", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcWall");
		const subelement = file.createEntity("IfcProjectionElement");
		withAttrs(file, "IfcRelProjectsElement", {
			GlobalId: guid.new(),
			RelatingElement: element,
			RelatedFeatureElement: subelement,
		});

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });

		expectClose(worldTranslation(element), [1, 1, 1]);
		expectClose(worldTranslation(subelement), [1, 2, 3]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});

	test("test_changing_placements_without_affecting_children", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });
		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 2, 3), isSi: false });

		expectClose(worldTranslation(element), [1, 2, 3]);
		expectClose(worldTranslation(subelement), [1, 2, 3]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});

	test("test_changing_placements_with_affecting_children", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });
		editObjectPlacement(file, {
			product: element,
			matrix: translationMatrix(1, 2, 3),
			isSi: false,
			shouldTransformChildren: true,
		});

		expectClose(worldTranslation(element), [1, 2, 3]);
		expectClose(worldTranslation(subelement), [1, 3, 5]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});

	test("test_changing_placements_with_children_using_non_si_units", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcBuilding");
		const subelement = file.createEntity("IfcWall");
		assignContainer(file, { products: [subelement], relatingStructure: element });

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1000, 1000, 1000), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1000, 2000, 3000), isSi: false });
		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: true });

		expectClose(worldTranslation(element), [1000, 1000, 1000]);
		expectClose(worldTranslation(subelement), [1000, 2000, 3000]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});

	test("test_changing_placements_always_affecting_child_ports_as_a_special_case", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcFlowSegment");
		const subelement = addPort(file, { element });

		const previousPlacement = editObjectPlacement(file, {
			product: element,
			matrix: translationMatrix(1, 1, 1),
			isSi: false,
		}) as EntityInstance;
		const previousPlacementId = previousPlacement.id();
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });
		editObjectPlacement(file, {
			product: element,
			matrix: translationMatrix(1, 2, 3),
			isSi: false,
			shouldTransformChildren: false,
		});

		expectClose(worldTranslation(element), [1, 2, 3]);
		expectClose(worldTranslation(subelement), [1, 3, 5]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
		// Old placement should be removed to avoid orphaned entities.
		expect(() => file.byId(previousPlacementId)).toThrow();
	});

	test("test_changing_placements_always_affecting_child_features_but_not_subchildren_as_a_special_case", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcWall");
		const subelement = file.createEntity("IfcOpeningElement");
		const subsubelement = file.createEntity("IfcDoor");
		withAttrs(file, "IfcRelVoidsElement", { RelatingBuildingElement: element, RelatedOpeningElement: subelement });
		withAttrs(file, "IfcRelFillsElement", {
			RelatingOpeningElement: subelement,
			RelatedBuildingElement: subsubelement,
		});

		const previousPlacement = editObjectPlacement(file, {
			product: element,
			matrix: translationMatrix(1, 1, 1),
			isSi: false,
		}) as EntityInstance;
		const previousPlacementId = previousPlacement.id();
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });
		editObjectPlacement(file, { product: subsubelement, matrix: translationMatrix(7, 8, 9), isSi: false });
		editObjectPlacement(file, {
			product: element,
			matrix: translationMatrix(1, 2, 3),
			isSi: false,
			shouldTransformChildren: false,
		});

		expectClose(worldTranslation(element), [1, 2, 3]);
		expectClose(worldTranslation(subelement), [1, 3, 5]);
		expectClose(worldTranslation(subsubelement), [7, 8, 9]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
		expect(
			((subsubelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				subelement.get("ObjectPlacement"),
			),
		).toBe(true);
		// Old placement should be removed to avoid orphaned entities.
		expect(() => file.byId(previousPlacementId)).toThrow();
	});

	test("test_changing_placements_without_affecting_children_doesnt_affect_subchildren", () => {
		const file = createTestFile(schema);
		file.createEntity("IfcProject");
		assignUnit(file);
		const building = file.createEntity("IfcBuilding");
		const storey = file.createEntity("IfcBuildingStorey");
		assignObject(file, { products: [storey], relatingObject: building });
		const wall = file.createEntity("IfcWall");
		assignContainer(file, { products: [wall], relatingStructure: storey });

		const buildingPlacementId = (
			editObjectPlacement(file, {
				product: building,
				matrix: translationMatrix(1, 1, 1),
				isSi: false,
			}) as EntityInstance
		).id();
		const storeyPlacementId = (
			editObjectPlacement(file, { product: storey, matrix: translationMatrix(1, 1, 1), isSi: false }) as EntityInstance
		).id();
		const wallPlacementId = (
			editObjectPlacement(file, { product: wall, matrix: translationMatrix(1, 1, 1), isSi: false }) as EntityInstance
		).id();

		editObjectPlacement(file, { product: building, matrix: translationMatrix(1, 2, 3), isSi: false });

		// The product and its children have their placement rebuilt.
		expect(() => file.byId(buildingPlacementId)).toThrow();
		expect(() => file.byId(storeyPlacementId)).toThrow();
		// Subchildren are unaffected.
		expect(() => file.byId(wallPlacementId)).not.toThrow();
		expectClose(worldTranslation(wall), [1, 1, 1]);
	});
});

// See this file's own header comment: the one Python test unique to
// `TestEditObjectPlacementIFC2X3` (not inherited from the shared base class).
describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("api.geometry.editObjectPlacement (IFC2X3-only)", () => {
	test("test_changing_placements_relative_to_a_distribution_element", () => {
		const file = createTestFile("IFC2X3");
		file.createEntity("IfcProject");
		assignUnit(file);
		const element = file.createEntity("IfcFlowSegment");
		const subelement = addPort(file, { element });

		editObjectPlacement(file, { product: element, matrix: translationMatrix(1, 1, 1), isSi: false });
		editObjectPlacement(file, { product: subelement, matrix: translationMatrix(1, 2, 3), isSi: false });

		expectClose(worldTranslation(element), [1, 1, 1]);
		expectClose(worldTranslation(subelement), [1, 2, 3]);
		expect(
			((subelement.get("ObjectPlacement") as EntityInstance).get("PlacementRelTo") as EntityInstance).equals(
				element.get("ObjectPlacement"),
			),
		).toBe(true);
	});
});
