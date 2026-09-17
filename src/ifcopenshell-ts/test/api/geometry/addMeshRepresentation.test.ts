// This file was generated with the assistance of an AI coding tool.
//
// `test/api/geometry/test_add_mesh_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search) -- `add_mesh_representation
// .py` has no dedicated Python test file to port from, matching `add_wall_representation
// .py`'s own identical precedent (see `./addWallRepresentation.test.ts`'s own header
// comment). Every test below is therefore original coverage, written directly against
// `add_mesh_representation.py`'s real source / `../../../src/api/geometry/
// addMeshRepresentation.ts`'s own port.
//
// Run against `AVAILABLE_SCHEMAS`: the `force_faceted_brep`/`file.schema === "IFC2X3"`
// branch (`IfcFacetedBrep` vs. `IfcPolygonalFaceSet`) is genuinely schema-dependent, but
// `extractItemCoordinates` below abstracts over both entity shapes so every
// vertex-coordinate assertion still runs, unconditionally, on every schema -- not gated
// behind a hardcoded, ungated per-schema `describe` block (CI's own native build only
// registers IFC4 by default).

import { describe, expect, test } from "vitest";
import { addContext } from "../../../src/api/context/addContext";
import { addMeshRepresentation } from "../../../src/api/geometry/addMeshRepresentation";
import { createEntity } from "../../../src/api/root/createEntity";
import { assignUnit } from "../../../src/api/unit/assignUnit";
import type { EntityInstance } from "../../../src/entityInstance";
import type { IfcFile } from "../../../src/file";
import { AVAILABLE_SCHEMAS, type Schema, createTestFile } from "../../bootstrap";

/** Python: `model = add_context(...)` then `body = add_context(..., parent=model)` --
 * matching `./addWallRepresentation.test.ts`'s own identical fixture. */
function bodyContext(file: IfcFile): EntityInstance {
	createEntity(file, { ifcClass: "IfcProject" });
	const model = addContext(file, { contextType: "Model" });
	return addContext(file, {
		contextType: "Model",
		contextIdentifier: "Body",
		targetView: "MODEL_VIEW",
		parent: model,
	});
}

/** A single unit square, matching `test/util/shapeBuilder.test.ts`'s own identical
 * "mesh / facetedBrep / ... are fully functional" fixture. Face `[0,1,2,3]` visits
 * vertices in the same order they're given, so the extracted polygon below round-trips
 * the exact input vertex order. */
const SQUARE_VERTICES: readonly (readonly number[])[] = [
	[0, 0, 0],
	[1, 0, 0],
	[1, 1, 0],
	[0, 1, 0],
];
const SQUARE_FACES: readonly (readonly number[])[] = [[0, 1, 2, 3]];

/** Reads back one `IfcRepresentationItem`'s own vertex coordinates, in face-visit
 * order -- `IfcFacetedBrep` (IFC2X3) via its single face's own `IfcPolyLoop.Polygon`,
 * `IfcPolygonalFaceSet` (IFC4+) via its own `Coordinates.CoordList` directly. */
function extractItemCoordinates(item: EntityInstance, schema: Schema): number[][] {
	if (schema === "IFC2X3") {
		const outer = item.get("Outer") as EntityInstance;
		const face = (outer.get("CfsFaces") as EntityInstance[])[0];
		const bound = (face.get("Bounds") as EntityInstance[])[0].get("Bound") as EntityInstance;
		return (bound.get("Polygon") as EntityInstance[]).map((p) => p.get("Coordinates") as number[]);
	}
	return (item.get("Coordinates") as EntityInstance).get("CoordList") as number[][];
}

describe.each(AVAILABLE_SCHEMAS)("api.geometry.addMeshRepresentation (%s)", (schema) => {
	test("builds an IfcPolygonalFaceSet on IFC4+, an IfcFacetedBrep on IFC2X3", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addMeshRepresentation(file, {
			context: body,
			vertices: [SQUARE_VERTICES],
			faces: [SQUARE_FACES],
		});

		expect(rep.isA("IfcShapeRepresentation")).toBe(true);
		expect((rep.get("ContextOfItems") as EntityInstance).equals(body)).toBe(true);
		expect(rep.get("RepresentationIdentifier")).toBe(body.get("ContextIdentifier"));
		const items = rep.get("Items") as EntityInstance[];
		expect(items.length).toBe(1);

		if (schema === "IFC2X3") {
			expect(rep.get("RepresentationType")).toBe("Brep");
			expect(items[0].isA("IfcFacetedBrep")).toBe(true);
		} else {
			expect(rep.get("RepresentationType")).toBe("Tessellation");
			expect(items[0].isA("IfcPolygonalFaceSet")).toBe(true);
		}
		expect(extractItemCoordinates(items[0], schema)).toEqual(SQUARE_VERTICES);

		file.dispose();
	});

	test("force_faceted_brep forces IfcFacetedBrep even on IFC4+", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addMeshRepresentation(file, {
			context: body,
			vertices: [SQUARE_VERTICES],
			faces: [SQUARE_FACES],
			forceFacetedBrep: true,
		});

		expect(rep.get("RepresentationType")).toBe("Brep");
		expect((rep.get("Items") as EntityInstance[])[0].isA("IfcFacetedBrep")).toBe(true);

		file.dispose();
	});

	test("multiple items -- one IfcRepresentationItem per vertices/faces entry", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		const secondSquare = SQUARE_VERTICES.map((v) => [v[0] + 5, v[1], v[2]]);

		const rep = addMeshRepresentation(file, {
			context: body,
			vertices: [SQUARE_VERTICES, secondSquare],
			faces: [SQUARE_FACES, SQUARE_FACES],
		});

		const items = rep.get("Items") as EntityInstance[];
		expect(items.length).toBe(2);
		expect(extractItemCoordinates(items[1], schema)).toEqual(secondSquare);

		file.dispose();
	});

	test("unit_scale (default calculateUnitScale) divides all vertex coordinates, unconditionally", () => {
		const file = createTestFile(schema);
		createEntity(file, { ifcClass: "IfcProject" });
		assignUnit(file); // default length unit: millimetres (unit_scale 0.001).
		const model = addContext(file, { contextType: "Model" });
		const body = addContext(file, {
			contextType: "Model",
			contextIdentifier: "Body",
			targetView: "MODEL_VIEW",
			parent: model,
		});

		// Vertices given in SI (metres, `unitScale` omitted) -- must be converted to
		// project units (millimetres) via `* (1 / unitScale)` = `* 1000`.
		const rep = addMeshRepresentation(file, {
			context: body,
			vertices: [SQUARE_VERTICES],
			faces: [SQUARE_FACES],
		});

		const item = (rep.get("Items") as EntityInstance[])[0];
		expect(extractItemCoordinates(item, schema)).toEqual([
			[0, 0, 0],
			[1000, 0, 0],
			[1000, 1000, 0],
			[0, 1000, 0],
		]);

		file.dispose();
	});

	test("unit_scale explicit override also divides all vertex coordinates", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addMeshRepresentation(file, {
			context: body,
			vertices: [SQUARE_VERTICES],
			faces: [SQUARE_FACES],
			unitScale: 2.0,
		});

		const item = (rep.get("Items") as EntityInstance[])[0];
		expect(extractItemCoordinates(item, schema)).toEqual([
			[0, 0, 0],
			[0.5, 0, 0],
			[0.5, 0.5, 0],
			[0, 0.5, 0],
		]);

		file.dispose();
	});

	test("coordinateOffset is applied AFTER the unit_scale division, to every vertex", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);

		const rep = addMeshRepresentation(file, {
			context: body,
			vertices: [SQUARE_VERTICES],
			faces: [SQUARE_FACES],
			unitScale: 2.0,
			coordinateOffset: [10, 20, 30],
		});

		const item = (rep.get("Items") as EntityInstance[])[0];
		expect(extractItemCoordinates(item, schema)).toEqual([
			[10, 20, 30],
			[10.5, 20, 30],
			[10.5, 20.5, 30],
			[10, 20.5, 30],
		]);

		file.dispose();
	});

	test("throws when faces is missing (Python: assert faces is not None)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		expect(() =>
			addMeshRepresentation(file, {
				context: body,
				vertices: [SQUARE_VERTICES],
				faces: undefined as unknown as (readonly number[])[][],
			}),
		).toThrow(/'faces' argument is not optional/);
		file.dispose();
	});

	test("throws when faces is empty (Python: assert len(faces) != 0)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		expect(() => addMeshRepresentation(file, { context: body, vertices: [SQUARE_VERTICES], faces: [] })).toThrow(
			/'faces' must not be empty/,
		);
		file.dispose();
	});

	test("throws when vertices is empty (Python: assert len(vertices) != 0)", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		expect(() => addMeshRepresentation(file, { context: body, vertices: [], faces: [SQUARE_FACES] })).toThrow(
			/'vertices' must not be empty/,
		);
		file.dispose();
	});

	test("throws when faces/vertices lengths differ (Python: assert len(faces) == len(vertices))", () => {
		const file = createTestFile(schema);
		const body = bodyContext(file);
		expect(() =>
			addMeshRepresentation(file, {
				context: body,
				vertices: [SQUARE_VERTICES, SQUARE_VERTICES],
				faces: [SQUARE_FACES],
			}),
		).toThrow(/same length/);
		file.dispose();
	});
});
