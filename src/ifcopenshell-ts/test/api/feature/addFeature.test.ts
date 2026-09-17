// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/feature/test_add_feature.py` (src/ifcopenshell-python).
//
// --- Real Python's own class-name-collision bug: the file's FIRST
// `TestAddFeature(test.bootstrap.IFC4X3)` is dead code, never actually run ---
//
// The real Python source file defines TWO top-level classes both literally named
// `TestAddFeature`:
//
// ```python
// class TestAddFeature(test.bootstrap.IFC4X3):
//     def test_adding_a_surface_feature(self):
//         ...
//         assert wall.HasSurfaceFeatures[0].RelatedSurfaceFeatures == (feature,)
//
// class TestAddFeature(test.bootstrap.IFC4):
//     def test_adding_an_opening(self): ...
//     def test_adding_a_projection(self): ...
//     def test_adding_a_surface_feature(self): ...  # a DIFFERENT body, IFC4-only
//     ...
// ```
//
// Python module execution binds the SECOND `class TestAddFeature: ...` statement over
// the first -- by the time `pytest` collects this module, only the second definition
// is reachable under that name at all; the first one (the IFC4X3-specific
// `HasSurfaceFeatures`/`RelatedSurfaceFeatures`/`IfcRelAdheresToElement` assertion) is
// silently discarded and NEVER executed by the real test suite, on any schema -- a
// genuine, disclosed bug in the real Python TEST file itself (not the production
// `add_feature.py` module, which is exercised correctly by every test that DOES run).
// Confirmed by direct inspection of the file, not assumed. This means real Python's
// own test suite has NEVER actually exercised `add_feature`'s real `IfcSurfaceFeature`
// + IFC4X3 + `IfcRelAdheresToElement` path at all.
//
// This port's own "adding a surface feature" tests below therefore only port what
// real Python ACTUALLY runs: the second class's IFC4-only body (`wall.IsDecomposedBy`,
// the `aggregate.assignObject` early-return path) plus the IFC2X3 override (a no-op).
// A genuinely NEW test (no Python counterpart, since none ever ran) is added
// separately at the bottom of this file to give the real, working IFC4X3
// `IfcRelAdheresToElement` path actual coverage in this port, gated to IFC4X3 only.

import { mat4 } from "gl-matrix";
import { describe, expect, test } from "vitest";
import { addFeature } from "../../../src/api/feature/addFeature";
import { editObjectPlacement } from "../../../src/api/geometry/editObjectPlacement";
import type { EntityInstance } from "../../../src/entityInstance";
import { getLocalPlacement } from "../../../src/util/placement";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

describe.each(AVAILABLE_SCHEMAS)("api.feature.addFeature (%s)", (schema) => {
	test("adding an opening", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		addFeature(file, { feature: opening, element: wall });
		const hasOpenings = wall.get("HasOpenings") as EntityInstance[];
		expect(hasOpenings.length).toBe(1);
		expect((hasOpenings[0].get("RelatedOpeningElement") as EntityInstance).equals(opening)).toBe(true);
	});

	test("adding a projection", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const projection = file.createEntity("IfcProjectionElement");
		addFeature(file, { feature: projection, element: wall });
		const hasProjections = wall.get("HasProjections") as EntityInstance[];
		expect(hasProjections.length).toBe(1);
		expect((hasProjections[0].get("RelatedFeatureElement") as EntityInstance).equals(projection)).toBe(true);
	});

	test("adding an opening twice", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		addFeature(file, { feature: opening, element: wall });
		addFeature(file, { feature: opening, element: wall });
		const hasOpenings = wall.get("HasOpenings") as EntityInstance[];
		expect(hasOpenings.length).toBe(1);
		expect((hasOpenings[0].get("RelatedOpeningElement") as EntityInstance).equals(opening)).toBe(true);
	});

	test("adding an opening which is already voiding another element", () => {
		const file = createTestFile(schema);
		const slab = file.createEntity("IfcSlab");
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		addFeature(file, { feature: opening, element: slab });
		addFeature(file, { feature: opening, element: wall });
		expect((slab.get("HasOpenings") as EntityInstance[]).length).toBe(0);
		const wallOpenings = wall.get("HasOpenings") as EntityInstance[];
		expect(wallOpenings.length).toBe(1);
		expect((wallOpenings[0].get("RelatedOpeningElement") as EntityInstance).equals(opening)).toBe(true);
	});

	test("assigning an opening does not shift object placements", () => {
		// `createTestFile` already pre-populates an `IfcProject` + `IfcUnitAssignment` --
		// real Python's own `ifcopenshell.api.root.create_entity(..., "IfcProject")`/
		// `ifcopenshell.api.unit.assign_unit` steps are unnecessary here, matching this
		// project's established `createTestFile` fixture precedent.
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		const matrix1 = mat4.fromTranslation(mat4.create(), [1, 1, 1]);
		editObjectPlacement(file, { product: wall, matrix: mat4.clone(matrix1), isSi: false });
		editObjectPlacement(file, { product: opening, matrix: mat4.clone(matrix1), isSi: false });

		addFeature(file, { feature: opening, element: wall });

		const openingPlacement = opening.get("ObjectPlacement") as EntityInstance;
		const relTo = openingPlacement.get("PlacementRelTo") as EntityInstance;
		const placesObject = relTo.get("PlacesObject") as EntityInstance[];
		expect(placesObject[0]?.equals(wall)).toBe(true);
		const actual = getLocalPlacement(openingPlacement);
		for (let i = 0; i < 16; i++) {
			expect(actual[i]).toBeCloseTo(matrix1[i], 9);
		}
	});

	test("not updating placement if placement is not relative", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");
		const placement = file.createEntity("IfcGridPlacement");
		opening.set("ObjectPlacement", placement);

		addFeature(file, { feature: opening, element: wall });

		expect((opening.get("ObjectPlacement") as EntityInstance).equals(placement)).toBe(true);
	});
});

// "adding a surface feature" -- see this file's header comment for why real Python
// only ever actually runs this against an IFC4-schema file (the IFC4X3-specific class
// body is dead code, shadowed by a same-named class; the IFC2X3 override is a no-op
// since `IfcSurfaceFeature` doesn't exist on that schema at all).
describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC4"))(
	"api.feature.addFeature -- surface feature (%s)",
	(schema) => {
		test("adding a surface feature (IFC4: aggregation, not IfcRelAdheresToElement)", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");
			const feature = file.createEntity("IfcSurfaceFeature");
			addFeature(file, { feature, element: wall });
			const isDecomposedBy = wall.get("IsDecomposedBy") as EntityInstance[];
			expect(isDecomposedBy.length).toBe(1);
			const relatedObjects = isDecomposedBy[0].get("RelatedObjects") as EntityInstance[];
			expect(relatedObjects.length).toBe(1);
			expect(relatedObjects[0].equals(feature)).toBe(true);
		});
	},
);

// IFC2X3's own override: `IfcSurfaceFeature` doesn't exist on that schema, so real
// Python's `TestAddFeatureIFC2X3` overrides `test_adding_a_surface_feature` to a
// no-op `pass` -- nothing to port beyond confirming the class itself doesn't exist,
// already covered by `test/util/*` schema-inventory checks elsewhere; no dedicated
// test needed here.

// --- Genuinely new coverage (no real Python counterpart -- see this file's own
// header comment: real Python's test suite never actually exercises this path due to
// its own class-shadowing bug) -- the real, working IFC4X3 `IfcSurfaceFeature` +
// `IfcRelAdheresToElement` path. ---
describe.each(AVAILABLE_SCHEMAS.filter((s) => s === "IFC4X3"))(
	"api.feature.addFeature -- surface feature adheres-to-element (%s, new coverage)",
	(schema) => {
		test("adding a surface feature creates an IfcRelAdheresToElement", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");
			const feature = file.createEntity("IfcSurfaceFeature");
			addFeature(file, { feature, element: wall });
			const hasSurfaceFeatures = wall.get("HasSurfaceFeatures") as EntityInstance[];
			expect(hasSurfaceFeatures.length).toBe(1);
			const rel = hasSurfaceFeatures[0];
			expect(rel.isA("IfcRelAdheresToElement")).toBe(true);
			const related = rel.get("RelatedSurfaceFeatures") as EntityInstance[];
			expect(related.length).toBe(1);
			expect(related[0].equals(feature)).toBe(true);
		});

		test("re-adding the same surface feature to the same element is a no-op", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");
			const feature = file.createEntity("IfcSurfaceFeature");
			const rel1 = addFeature(file, { feature, element: wall });
			const rel2 = addFeature(file, { feature, element: wall });
			expect(rel1?.equals(rel2 as EntityInstance)).toBe(true);
			expect((wall.get("HasSurfaceFeatures") as EntityInstance[]).length).toBe(1);
		});

		test("moving a surface feature shared by other features to a new element removes it from the old rel", () => {
			const file = createTestFile(schema);
			const wall = file.createEntity("IfcWall");
			const slab = file.createEntity("IfcSlab");
			const feature1 = file.createEntity("IfcSurfaceFeature");
			const feature2 = file.createEntity("IfcSurfaceFeature");
			addFeature(file, { feature: feature1, element: wall });
			// Manually share `feature2` onto the same rel as `feature1` -- `addFeature`
			// itself has no way to add a SECOND feature onto an existing rel (each call
			// only ever handles its own `feature`), so this reaches into `wall`'s own
			// existing rel directly to construct the "more than one related feature"
			// precondition `addFeature`'s own `len(...) != 1` branch needs.
			const existingRel = (wall.get("HasSurfaceFeatures") as EntityInstance[])[0];
			existingRel.set("RelatedSurfaceFeatures", [feature1, feature2]);

			addFeature(file, { feature: feature2, element: slab });

			// `feature2` was removed from the old (wall) rel, which still exists for
			// `feature1` alone; a new rel now relates `feature2` to `slab`.
			const wallRel = (wall.get("HasSurfaceFeatures") as EntityInstance[])[0];
			const wallRelated = wallRel.get("RelatedSurfaceFeatures") as EntityInstance[];
			expect(wallRelated.length).toBe(1);
			expect(wallRelated[0].equals(feature1)).toBe(true);

			const slabRels = slab.get("HasSurfaceFeatures") as EntityInstance[];
			expect(slabRels.length).toBe(1);
			const slabRelated = slabRels[0].get("RelatedSurfaceFeatures") as EntityInstance[];
			expect(slabRelated.length).toBe(1);
			expect(slabRelated[0].equals(feature2)).toBe(true);
		});
	},
);

// --- Transaction/undo-redo regression coverage (no Python counterpart) ---

describe.each(AVAILABLE_SCHEMAS)("api.feature.addFeature Transaction/undo-redo (%s)", (schema) => {
	test("undo removes the created IfcRelVoidsElement; redo recreates it", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const opening = file.createEntity("IfcOpeningElement");

		file.beginTransaction();
		const rel = addFeature(file, { feature: opening, element: wall });
		file.endTransaction();
		const relId = (rel as EntityInstance).id();

		expect(file.byType("IfcRelVoidsElement").length).toBe(1);

		file.undo();
		expect(() => file.byId(relId)).toThrow();
		expect((wall.get("HasOpenings") as EntityInstance[]).length).toBe(0);

		file.redo();
		expect(file.byId(relId).isA("IfcRelVoidsElement")).toBe(true);
		expect((wall.get("HasOpenings") as EntityInstance[]).length).toBe(1);
	});
});
