// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_mesh_representation.py` (src/ifcopenshell-python,
// 134 lines) -- only imports `ifcopenshell.util.unit` (already landed) and
// `ifcopenshell.util.shape_builder`'s `ShapeBuilder`/`SequenceOfVectors`/`VectorType`.
// Unlike other recently-landed `api.geometry` files, this one genuinely needs the FULL
// `ShapeBuilder` CLASS (already fully ported at `../../util/shapeBuilder.ts`) --
// specifically its `facetedBrep`/`polygonalFaceSet` methods, both already fully
// functional (real entity classes, not defined types -- see that file's own header
// comment). Instantiated as `new ShapeBuilder(file)`, matching that class's own
// `constructor(public readonly file: IfcFile) {}`.
//
// *** Real Python implements this with an internal `Usecase` class -- flattened into a
// single function here, matching this project's own established convention (confirmed
// against `./index.ts`'s own header comment and sibling already-landed files, e.g.
// `./addWallRepresentation.ts`'s own identical flattening) ***
//
// *** The 4 real `assert` preconditions -- ported as explicit thrown errors, matching
// this project's established Python-assert-porting idiom (see e.g.
// `util/shapeBuilder.ts`'s own `mepBendShape`/`mepTransitionCalculate` "Python: assert
// ..." throw messages) ***
//
// `assert faces is not None` / `assert len(faces) != 0` / `assert len(vertices) != 0` /
// `assert len(faces) == len(vertices)` -- all 4 checked up front, in the same order, each
// as its own `if (!...) throw new Error(...)`, with a message echoing the real Python
// assert's own condition/message.
//
// *** The vertex-array construction: `unit_scale` divides ALL vertices, unconditionally
// -- not an SI-vs-project-units special case, verified against the docstring ***
//
// `np_vertices = np.array(vertices, dtype=np.float64) * (1 / unit_scale)`: this runs
// UNCONDITIONALLY, regardless of whether `unit_scale` was explicitly passed in or
// defaulted via `calculate_unit_scale(file)`. Per the docstring: `vertices` are assumed
// to be in SI units when `unit_scale` is omitted (`unit_scale` then equals
// `calculate_unit_scale(file)`, i.e. "project units per 1 SI meter", so multiplying SI
// vertices by `1 / unit_scale` converts them TO project units, which is what every
// `IfcCartesianPoint` written into the file must be in) -- when `unit_scale` IS given
// explicitly, it plays the exact same role (the caller's own vertex unit, expressed as
// "project units per 1 vertex-unit"). Both cases go through the identical
// `* (1 / unit_scale)` division; there is no separate branch. Ported below as one
// unconditional scale, matching real Python exactly. `coordinate_offset`, when given, is
// added AFTER that scale (`np_vertices += coordinate_offset`, real numpy broadcasting --
// the SAME 3-element offset is added to every vertex of every item), in project units,
// matching the docstring ("Optionally apply a vector offset to all coordinates. In
// project units.").
//
// *** `force_faceted_brep`/`file.schema === "IFC2X3"`: verified `RepresentationType`
// strings against the real source, not assumed ***
//
// `create_faceted_brep`'s own `IfcShapeRepresentation` uses `"Brep"` (matching
// `ShapeBuilder.facetedBrep`'s own `IfcFacetedBrep` item type); `create_polygonal_face_
// set`'s own uses `"Tessellation"` (correctly spelled, NOT `util/shapeBuilder.ts`'s own
// disclosed `"Tesselation"` typo in an unrelated method, `mepTransitionShape` -- verified
// by reading this exact source's own 2 `create_entity("IfcShapeRepresentation", ...)`
// calls directly, not assumed from that unrelated finding). `IfcShapeRepresentation`'s
// `RepresentationIdentifier` argument is `context.ContextIdentifier` in both branches,
// matching `./addWallRepresentation.ts`'s own identical convention.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type SequenceOfVectors, ShapeBuilder, type VectorType } from "../../util/shapeBuilder";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface AddMeshRepresentationSettings {
	/** The `IfcGeometricRepresentationContext` for the representation. */
	context: EntityInstance;
	/**
	 * A list of coordinates, where `verticesN = [(0., 0., 0.), (1., 1., 1.), (x, y, z),
	 * ...]`. One sublist per separate `IfcRepresentationItem` to add.
	 */
	vertices: readonly SequenceOfVectors[];
	/**
	 * A list of polygons, represented by vertex indices, where `facesN = [(0, 1, 2), (5,
	 * 4, 2, 3), (v1, v2, v3, ... vN), ...]`. One sublist per separate
	 * `IfcRepresentationItem` to add (must be the same length as `vertices`, index-aligned).
	 *
	 * Currently required -- an `edges`-only representation (without `faces`) is not
	 * supported (real Python's own `# TODO: Support edges without faces.`).
	 */
	faces: readonly (readonly (readonly number[])[])[];
	/**
	 * Accepted for real-Python-source parity, but genuinely UNUSED -- real Python's own
	 * `Usecase` never reads its `edges` setting at all (see this file's header comment
	 * and real Python's own `# TODO: Support edges without faces.`). A list of edges,
	 * represented by vertex index pairs, where `edgesN = [(0, 1), (1, 2), (v1, v2), ...]`.
	 */
	edges?: readonly (readonly [number, number])[][];
	/** Optionally apply a vector offset to all coordinates, in project units. */
	coordinateOffset?: VectorType;
	/**
	 * Scale factor for `vertices` units. If omitted, it is assumed that `vertices` are in
	 * SI units (`ifcopenshell.util.unit.calculateUnitScale(file)` is used). See this
	 * file's header comment: `vertices` coords are always divided by `unitScale`,
	 * regardless of whether it was passed explicitly or defaulted.
	 */
	unitScale?: number;
	/** Force using `IfcFacetedBrep`s instead of `IfcPolygonalFaceSet`s. */
	forceFacetedBrep?: boolean;
}

function createFacetedBrep(
	file: IfcFile,
	builder: ShapeBuilder,
	context: EntityInstance,
	vertices: readonly SequenceOfVectors[],
	faces: readonly (readonly (readonly number[])[])[],
): EntityInstance {
	const items = vertices.map((v, i) => builder.facetedBrep(v, faces[i]));
	return file.createEntity(
		"IfcShapeRepresentation",
		context,
		context.get("ContextIdentifier") as string | null,
		"Brep",
		items,
	);
}

function createPolygonalFaceSet(
	file: IfcFile,
	builder: ShapeBuilder,
	context: EntityInstance,
	vertices: readonly SequenceOfVectors[],
	faces: readonly (readonly (readonly number[])[])[],
): EntityInstance {
	const items = vertices.map((v, i) => builder.polygonalFaceSet(v, faces[i]));
	return file.createEntity(
		"IfcShapeRepresentation",
		context,
		context.get("ContextIdentifier") as string | null,
		"Tessellation",
		items,
	);
}

function addMeshRepresentationUsecase(file: IfcFile, settings: AddMeshRepresentationSettings): EntityInstance {
	const { context, vertices, faces, coordinateOffset, forceFacetedBrep = false } = settings;

	// The 4 real `assert` preconditions, in Python's own order -- see this file's header
	// comment.
	if (faces === undefined || faces === null) {
		throw new Error(
			"addMeshRepresentation: currently 'faces' argument is not optional (Python: assert faces is not None).",
		);
	}
	if (faces.length === 0) {
		throw new Error("addMeshRepresentation: 'faces' must not be empty (Python: assert len(faces) != 0).");
	}
	if (vertices.length === 0) {
		throw new Error("addMeshRepresentation: 'vertices' must not be empty (Python: assert len(vertices) != 0).");
	}
	if (faces.length !== vertices.length) {
		throw new Error(
			"addMeshRepresentation: 'faces' and 'vertices' must be the same length (Python: assert len(faces) == len(vertices)).",
		);
	}

	const builder = new ShapeBuilder(file);

	// Real Python: `if unit_scale is None: unit_scale = calculate_unit_scale(file)`.
	const unitScale = settings.unitScale ?? calculateUnitScale(file);

	// Real Python: `np_vertices = np.array(vertices, dtype=np.float64) * (1 / unit_scale)`
	// -- unconditional for every vertex of every item, see this file's header comment.
	// `coordinate_offset`, when given, is added AFTER the scale (also unconditional,
	// broadcast to every vertex).
	const scale = 1 / unitScale;
	const scaledVertices: SequenceOfVectors[] = vertices.map((item) =>
		item.map((vertex) => {
			const scaledVertex = vertex.map((coord) => coord * scale);
			if (coordinateOffset != null) {
				return scaledVertex.map((coord, axis) => coord + coordinateOffset[axis]);
			}
			return scaledVertex;
		}),
	);

	// Python: `Usecase.create_mesh_representation`.
	if (forceFacetedBrep || file.schema === "IFC2X3") {
		return createFacetedBrep(file, builder, context, scaledVertices, faces);
	}
	return createPolygonalFaceSet(file, builder, context, scaledVertices, faces);
}

/**
 * Adds a mesh representation (Python: `ifcopenshell.api.geometry.add_mesh_representation`).
 *
 * Vertices and faces are given in the form of `[item1, item2, item3, ...]`. Each `itemN`
 * is a sublist representing data for a separate `IfcRepresentationItem` to add.
 *
 * `edges` is accepted (for real-Python-source parity) but currently unused -- see this
 * file's header comment.
 *
 * @param settings.context The `IfcGeometricRepresentationContext` for the representation.
 * @param settings.vertices A list of coordinates.
 * @param settings.faces A list of polygons, represented by vertex indices.
 * @param settings.coordinateOffset Optionally apply a vector offset to all coordinates,
 * in project units.
 * @param settings.unitScale Scale factor for `vertices` units. If omitted, `vertices` are
 * assumed to be in SI units. `vertices` coords are always divided by `unitScale`.
 * @param settings.forceFacetedBrep Force using `IfcFacetedBrep`s instead of
 * `IfcPolygonalFaceSet`s.
 * @returns The new `IfcShapeRepresentation`.
 */
export const addMeshRepresentation = wrapUsecase("geometry.add_mesh_representation", addMeshRepresentationUsecase);
