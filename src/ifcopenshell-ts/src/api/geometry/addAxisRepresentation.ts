// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_axis_representation.py` (src/ifcopenshell-python,
// 111 lines) -- only imports `ifcopenshell.util.unit` (`calculate_unit_scale`, already
// landed), fully self-contained, no blockers.
//
// *** Real Python implements this with an internal `Usecase` class -- flattened into a
// single function here, matching this project's own established convention ***
//
// Real Python's `add_axis_representation` is a thin free function that constructs a
// `Usecase()` instance, assigns `.file`/`.settings`, and calls `.execute()` -- an older
// code-style pattern used by some of this codebase's earlier `api.geometry` files.
// Reading `../geometry/index.ts` and its sibling already-landed files (`editObjectPlacement
// .ts`/`addBoolean.ts`/`addShapeAspect.ts`/etc.) confirms this project's own established
// convention for every RECENTLY-landed `api.geometry` file is to flatten such a `Usecase`
// class into one plain function taking `(file, settings)` directly -- no class introduced
// here either, matching that convention rather than reproducing the class shape.
//
// Adds a new axis representation: certain objects (walls, beams, columns) are typically
// "axis-based" and can be represented abstractly by a single line, either 2D (walls) or
// 3D (beams/columns). Builds an `IfcShapeRepresentation` wrapping either a plain
// `IfcPolyline` (IFC2X3) or an `IfcIndexedPolyCurve` (IFC4+, over an
// `IfcCartesianPointList2D`/`IfcCartesianPointList3D` depending on whether the axis
// points are 2D or 3D).
//
// *** Entity classes verified against the generated `.d.ts`s, not assumed ***
//
// `IfcShapeRepresentation(ContextOfItems, RepresentationIdentifier, RepresentationType,
// Items)` -- identical attribute order across all 3 schemas. `IfcCartesianPoint
// (Coordinates: number[])` -- identical across all 3 schemas, one positional arg (a 2-
// or 3-number array) either way. `IfcPolyline(Points: IfcCartesianPoint[])` -- identical
// across all 3 schemas (used for the IFC2X3 branch). `IfcIndexedPolyCurve(Points:
// IfcCartesianPointList, Segments: unknown[] | null, SelfIntersect: boolean | null)` and
// `IfcCartesianPointList2D`/`IfcCartesianPointList3D` (both just `{CoordList: number[][]}`
// on IFC4, with an extra optional `TagList: string[] | null` on IFC4X3) do NOT exist at
// all on IFC2X3 (confirmed directly: no `.d.ts` interface for any of the three) --
// exactly the real schema-level backing for real Python's own `if self.file.schema ==
// "IFC2X3"` branch, not an assumption. Passing only 1 positional arg to
// `IfcCartesianPointList2D`/`3D` (omitting IFC4X3's own optional trailing `TagList`) and
// only 1 arg to `IfcIndexedPolyCurve`'s own `Points`-plus-2-more-args call (real Python
// passes all 3: `Points`, `None`, `False`) match `util/shapeBuilder.ts`'s own
// already-established identical partial/full positional-call precedent for these exact
// 2 entity classes.
//
// Two real Python-source quirks, preserved verbatim:
// 1. `self.settings["axis"] = axis or []` -- a falsy `axis` (e.g. an empty array) silently
//    degrades to an empty list, then the VERY NEXT line (`len(self.settings["axis"][0])`)
//    throws a real, unguarded `IndexError` reading index 0 of that now-empty list. Ported
//    below with the identical two-step shape (no early, friendlier guard added).
// 2. `axis`'s own declared Python type hint is `tuple[COORD, COORD]` (exactly 2
//    coordinates) and the docstring frames it that way too ("a list of two
//    coordinates"), but the actual implementation never enforces exactly 2 -- it only
//    ever reads `axis[0]` (for the 2D/3D check) and iterates over the WHOLE `axis`
//    sequence to build `points`/`curve`, so a caller passing 3+ points would work exactly
//    as if it were a generic polyline/indexed-poly-curve builder, not rejected. Preserved
//    verbatim (no `axis.length !== 2` guard added), though this port's own public TS
//    settings type still declares `readonly [Coord, Coord]` (matching the *intended*,
//    documented 2-point contract) rather than `readonly Coord[]` -- TS callers are
//    steered toward the documented usage at compile time, while the runtime body below
//    still genuinely iterates the whole array, preserving the real (looser) behavior for
//    any caller that bypasses the type (e.g. plain JS).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

/** A 2D or 3D coordinate -- Python's `COORD = Union[tuple[float, float], tuple[float,
 * float, float]]`. */
export type Coord = readonly [number, number] | readonly [number, number, number];

export interface AddAxisRepresentationSettings {
	/**
	 * The `IfcGeometricRepresentationContext` the representation is part of. Must be
	 * either Model/Axis/GRAPH_VIEW (3D) or Plan/Axis/GRAPH_VIEW (2D).
	 */
	context: EntityInstance;
	/**
	 * The axis, as a list of two coordinates (SI units), the coordinates being either 2
	 * or 3 float coordinates depending on whether the axis is 2D or 3D. The order
	 * matters: for walls, the start must be at the minimum local X ordinate and the end
	 * at the maximum local X ordinate; for beams/columns, the start is at the minimum
	 * local Z ordinate and the end at the maximum local Z ordinate.
	 */
	axis: readonly [Coord, Coord];
}

/** Python's `Usecase.convert_si_to_unit` -- recurses into nested tuples/lists (here,
 * just one level: a `Coord`'s own 2 or 3 numbers), dividing every leaf number by
 * `unitScale`. */
function convertSiToUnit(co: number | readonly number[], unitScale: number): number | number[] {
	if (Array.isArray(co)) {
		return co.map((o) => convertSiToUnit(o, unitScale) as number);
	}
	return (co as number) / unitScale;
}

function addAxisRepresentationUsecase(file: IfcFile, settings: AddAxisRepresentationSettings): EntityInstance {
	const { context } = settings;
	// Python: `self.settings["axis"] = axis or []` -- see this file's header comment
	// (quirk 1). Under this port's own declared TS type `axis` is always a genuine
	// 2-tuple, so this fallback is unreachable from a well-typed TS caller, but is
	// preserved for parity with a plain-JS caller bypassing the type.
	const axis: readonly Coord[] = (settings.axis as readonly Coord[] | null | undefined) || [];
	const unitScale = calculateUnitScale(file);

	// Real, unguarded `IndexError`-equivalent if `axis` ended up empty -- preserved
	// verbatim, not proactively guarded (see this file's header comment).
	const is2d = axis[0].length === 2;
	const points = axis.map((p) => convertSiToUnit(p, unitScale) as number[]);

	let curve: EntityInstance;
	if (file.schema === "IFC2X3") {
		curve = file.createEntity(
			"IfcPolyline",
			points.map((p) => file.createEntity("IfcCartesianPoint", p)),
		);
	} else if (is2d) {
		curve = file.createEntity("IfcIndexedPolyCurve", file.createEntity("IfcCartesianPointList2D", points), null, false);
	} else {
		curve = file.createEntity("IfcIndexedPolyCurve", file.createEntity("IfcCartesianPointList3D", points), null, false);
	}

	return file.createEntity(
		"IfcShapeRepresentation",
		context,
		context.get("ContextIdentifier"),
		is2d ? "Curve2D" : "Curve3D",
		[curve],
	);
}

/**
 * Adds a new axis representation (Python:
 * `ifcopenshell.api.geometry.add_axis_representation`).
 *
 * Certain objects are typically "axis-based", such as walls, beams, and columns. This
 * means you can represent them abstractly by simply drawing a single line either in 2D
 * (such as for walls) or 3D (for beams and columns). Humans can understand this
 * axis-based representation as being a simplification of a layered extrusion or a
 * profile that is being extruded along that axis and joined to other elements.
 *
 * Using an axis-based representation makes it easy for users and computers to analyse
 * connectivity and spatial relationships, as well as makes it easy to parametrically
 * edit these objects by simply stretching the start or end of the axis.
 *
 * For now, only simple straight line axes are supported, represented by a start and end
 * coordinate. The order is important: for walls, the start must be at the minimum local
 * X ordinate and the end at the maximum local X ordinate; for beams and columns, the
 * start is at the minimum local Z ordinate and the end at the maximum local Z ordinate.
 * This start and end is then used to determine any parametric junctions with other
 * elements.
 *
 * Using an axis representation is optional, but highly recommended for "standard"
 * representations of walls, beams, columns, and other structural members. A rule of
 * thumb is that if you can draw it as a line on paper, you can probably represent it
 * using an axis.
 *
 * @returns The newly created `IfcShapeRepresentation` entity.
 *
 * @example
 * ```ts
 * const context = util.representation.getContext(model, "Plan", "Axis", "GRAPH_VIEW");
 * const axis = api.geometry.addAxisRepresentation(model, {
 *   context,
 *   axis: [[0.0, 0.0], [1.0, 0.0]],
 * });
 * ```
 */
export const addAxisRepresentation = wrapUsecase("geometry.add_axis_representation", addAxisRepresentationUsecase);
