// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_slab_representation.py` (src/ifcopenshell-python,
// 162 lines) -- only imports `ifcopenshell.util.element` (`copy`, already landed),
// `ifcopenshell.util.unit` (`calculate_unit_scale`, already landed), and this same
// project's freshly-landed `util/data.ts` (`Clipping`). Fully self-contained: no
// `ShapeBuilder`/geometry-kernel dependency -- confirmed by reading the whole real Python
// file, it builds `IfcExtrudedAreaSolid`/`IfcArbitraryClosedProfileDef` directly via
// plain `file.create_entity` calls, same as `./addWallRepresentation.ts`'s own sibling
// (landed alongside this file in the same chunk).
//
// *** Real Python implements this with an internal `Usecase` class -- flattened into a
// single function here, matching this project's own established convention (see
// `./addWallRepresentation.ts`'s/`./addAxisRepresentation.ts`'s own identical
// flattening) ***
//
// Builds either a default unit-square profile (a `size x size` square, `size =
// convert_si_to_unit(1)`) or, when `polyline` is given, an arbitrary closed polygon
// profile from those points -- extruded to `depth`, wrapped in an
// `IfcShapeRepresentation`. Despite superficially resembling `add_wall_representation`
// (shared `Clipping`/booleans-application pattern, shared `x_angle`/`direction_sense`/
// `offset` knobs), this is NOT structurally identical: `add_wall_representation` always
// builds a fixed rectangular profile from `length`/`thickness`, has no `polyline`
// parameter at all, and takes a `booleans` list IN ADDITION TO `clippings`; this file has
// a `polyline` parameter (a real, distinct code path, see below) and no `booleans`
// parameter whatsoever (only `clippings`).
//
// *** Entity classes verified against the generated `.d.ts`s, not assumed ***
//
// `IfcShapeRepresentation(ContextOfItems, RepresentationIdentifier, RepresentationType,
// Items)`, `IfcExtrudedAreaSolid(SweptArea, Position, ExtrudedDirection, Depth)`,
// `IfcArbitraryClosedProfileDef(ProfileType, ProfileName, OuterCurve)`,
// `IfcAxis2Placement3D(Location, Axis, RefDirection)`, `IfcCartesianPoint(Coordinates)`,
// `IfcDirection(DirectionRatios)` -- all confirmed identical attribute order across
// `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`, same as `./addWallRepresentation.ts`'s own
// identical verification. `IfcExtrudedAreaSolid.Position` is `| null` on IFC4/IFC4X3 but
// REQUIRED (non-null) on IFC2X3 -- this is exactly why real Python's own condition for
// building a real `Position` is `self.file.schema == "IFC2X3" or self.offset != 0` (a
// genuine schema-driven branch, unlike `add_wall_representation`'s unconditional
// `Position`, which never needs this check because it always builds one). `IfcPolyline`
// (IFC2X3) vs. `IfcIndexedPolyCurve` + `IfcCartesianPointList2D` (IFC4+, both absent on
// IFC2X3) -- same finding as `./addWallRepresentation.ts`/`./addAxisRepresentation.ts`.
//
// *** A real, disclosed divergence from `add_wall_representation`'s own
// `IfcIndexedPolyCurve` call: only 1 positional arg here, not 3 ***
//
// Real Python: `self.file.createIfcIndexedPolyCurve(self.file.createIfcCartesianPointList2D
// (points))` -- only `Points` is passed; `Segments`/`SelfIntersect` are left at their
// schema defaults (both `null`), UNLIKE `add_wall_representation.py`'s own sibling call,
// which explicitly passes `None, False` for those same two trailing args. Both are
// functionally equivalent for `SelfIntersect` only in the sense that omitting a trailing
// optional positional argument leaves it `null` -- but `add_wall_representation`
// explicitly sets `SelfIntersect` to `False` (a non-null value) while this file leaves it
// `null`, a real, disclosed, verbatim-preserved difference in the two real Python
// sources, not a porting inconsistency introduced here. Ported below via
// `file.createEntity("IfcIndexedPolyCurve", pointList)` with just the one arg, matching
// this project's own already-established "omit trailing optional args" precedent (e.g.
// `../profile/addArbitraryProfile.ts`'s identical single-arg `IfcIndexedPolyCurve` call).
//
// *** The `polyline` parameter: a real, distinct code path, genuinely different from
// `add_wall_representation`'s fixed-rectangle-profile path ***
//
// When `polyline` is provided (a list of raw `(x, y)` SI-unit tuples), `points` becomes
// `[(convert_si_to_unit(p[0]), convert_si_to_unit(p[1] * abs(1 / cos(x_angle)))) for p in
// polyline]` -- note only the Y (`p[1]`) component gets the `abs(1 / cos(x_angle))` slope
// correction, X (`p[0]`) does not. When `polyline` is falsy/absent, the DEFAULT unit
// square (`points = ((0,0),(size,0),(size,size),(0,size),(0,0))`, `size =
// convert_si_to_unit(1)`) is used instead, with NO slope correction applied to it at all
// (unlike the fixed rectangular profile in `add_wall_representation`, which always
// applies its own `thickness *= 1 / cos(x_angle)` correction regardless of any
// `polyline`-equivalent input). Ported below with the identical two-branch shape.
//
// *** `apply_clippings`'s own `while ... .pop()` reverse-order (LIFO) consumption --
// same real detail as `./addWallRepresentation.ts`'s own identical loop, verified there
// (not re-derived from scratch here) ***
//
// *** A real, disclosed ALIASING divergence from `add_wall_representation`'s own
// `clippings` handling ***
//
// Unlike `add_wall_representation.py`'s own `self.clippings = [Clipping.parse(c) for c in
// self.settings["clippings"]]` (a genuinely NEW list, see `./addWallRepresentation.ts`'s
// own header comment, quirk 2), THIS file's `execute` does `self.clippings = clippings`
// -- a DIRECT, un-mapped assignment of the SAME list object the caller passed in (when
// not `None`; the outer `add_slab_representation` free function only substitutes `[]`
// when `clippings is None`). `apply_clippings`'s own `.pop()` therefore genuinely,
// visibly DRAINS the caller's own `clippings` list here -- the OPPOSITE of
// `add_wall_representation`'s own non-aliasing behavior for the same-named parameter.
// Ported below the same way `./addWallRepresentation.ts` handles its own genuinely-
// aliased `booleans` parameter: the public `AddSlabRepresentationSettings.clippings`
// field is declared `readonly` (matching this codebase's convention), but the SAME
// underlying array reference is cast back to mutable internally and genuinely drained.
//
// *** A second real, disclosed quirk: `clippings` is NEVER run through `Clipping.parse`
// at all here, unlike `add_wall_representation` ***
//
// `add_wall_representation.py` maps every `clippings` entry through `Clipping.parse(c)`
// up front, so a raw `{location, normal}` (or `{matrix}`) dict is accepted (per its own
// docstring AND its own declared type hint, `Union[Clipping, dict[str, Any]]`).
// `add_slab_representation.py`'s own declared type hint is narrower --
// `Union[Clipping, ifcopenshell.entity_instance]` (dict NOT included) -- yet its own
// docstring still claims "Clippings can be `Clipping` objects or dictionaries of
// arguments for `Clipping.parse`", exactly like the wall function's docstring. This is a
// genuine, real docstring-vs-type-hint-vs-implementation inconsistency in the real Python
// source: `apply_clippings` here only ever checks `isinstance(clipping,
// ifcopenshell.entity_instance)`, and falls through to `clipping.apply(...)` (a `Clipping`
// -only method) for anything else -- so a caller who actually follows the docstring and
// passes a plain dict would hit a real `AttributeError: 'dict' object has no attribute
// 'apply'` at runtime, since `Clipping.parse` is never called to convert it first.
// PRESERVED verbatim below (not silently "fixed" to also accept dicts): this port's
// `AddSlabRepresentationSettings.clippings` field is typed to match the real (narrower)
// type hint, `ReadonlyArray<EntityInstance | Clipping>` -- a raw dict is a TS compile-time
// type error here, and a plain-JS caller bypassing that type would still hit the
// equivalent real runtime `TypeError` calling `.apply` on a non-`Clipping` object,
// matching real Python's own actual (not documented) behavior.

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import type { Clipping } from "../../util/data";
import * as elementUtil from "../../util/element";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface AddSlabRepresentationSettings {
	/**
	 * The `IfcGeometricRepresentationContext` for the representation, only
	 * Model/Body/MODEL_VIEW type of representations are currently supported.
	 */
	context: EntityInstance;
	/** The slab depth, in meters. Defaults to `0.2`. */
	depth?: number;
	/** Defaults to `"POSITIVE"`. */
	directionSense?: "POSITIVE" | "NEGATIVE";
	/** Defaults to `0.0`. */
	offset?: number;
	/** The slope angle along the slab's X-axis, in radians. Defaults to `0.0`. */
	xAngle?: number;
	/**
	 * List of planes that define clipping half space solids. Clippings can be
	 * `Clipping` objects or existing `IfcBooleanResult`s -- NOT raw dicts, despite the
	 * real Python docstring's claim (see this file's header comment for the real,
	 * disclosed docstring-vs-implementation inconsistency being preserved here).
	 *
	 * Genuinely DRAINED (emptied via repeated `.pop()`) by this function as a real,
	 * disclosed side effect -- see this file's header comment.
	 */
	clippings?: readonly (EntityInstance | Clipping)[];
	/** A list of raw `(x, y)` SI-unit coordinates. When omitted, a default unit-square
	 * profile is used instead -- see this file's header comment for the full two-branch
	 * behavior. */
	polyline?: readonly (readonly [number, number])[] | null;
}

function convertSiToUnit(co: number, unitScale: number): number {
	return co / unitScale;
}

function applyClippings(
	file: IfcFile,
	clippings: (EntityInstance | Clipping)[],
	firstOperandIn: EntityInstance,
	unitScale: number,
): EntityInstance {
	let firstOperand = firstOperandIn;
	// LIFO -- see this file's header comment (and `./addWallRepresentation.ts`'s own
	// identical loop, verified there).
	while (clippings.length) {
		// biome-ignore lint/style/noNonNullAssertion: `clippings.length` just checked.
		const clipping = clippings.pop()!;
		if (clipping instanceof EntityInstance) {
			const newOperand = elementUtil.copy(file, clipping);
			newOperand.set("FirstOperand", firstOperand);
			firstOperand = newOperand;
		} else {
			firstOperand = clipping.apply(file, firstOperand, unitScale);
		}
	}
	return firstOperand;
}

function createItem(
	file: IfcFile,
	depth: number,
	directionSense: "POSITIVE" | "NEGATIVE",
	offset: number,
	xAngle: number,
	clippings: (EntityInstance | Clipping)[],
	polyline: readonly (readonly [number, number])[] | null | undefined,
	unitScale: number,
): EntityInstance {
	const size = convertSiToUnit(1, unitScale);
	let points: readonly (readonly [number, number])[] = [
		[0.0, 0.0],
		[size, 0.0],
		[size, size],
		[0.0, size],
		[0.0, 0.0],
	];
	if (polyline) {
		points = polyline.map((p): [number, number] => [
			convertSiToUnit(p[0], unitScale),
			convertSiToUnit(p[1] * Math.abs(1 / Math.cos(xAngle)), unitScale),
		]);
	}

	let curve: EntityInstance;
	if (file.schema === "IFC2X3") {
		curve = file.createEntity(
			"IfcPolyline",
			points.map((p) => file.createEntity("IfcCartesianPoint", [p[0], p[1]])),
		);
	} else {
		// Only `Points` is passed here (unlike `./addWallRepresentation.ts`'s own sibling
		// call, which also passes `null, false`) -- see this file's header comment for the
		// real, disclosed divergence.
		curve = file.createEntity(
			"IfcIndexedPolyCurve",
			file.createEntity(
				"IfcCartesianPointList2D",
				points.map((p) => [p[0], p[1]]),
			),
		);
	}

	let directionRatios: [number, number, number];
	if (xAngle) {
		directionRatios = [0.0, Math.sin(xAngle), Math.cos(xAngle)];
	} else {
		directionRatios = [0.0, 0.0, 1.0];
	}

	// Offset direction doesn't change if direction_sense is negative (real Python's own
	// comment, verbatim).
	const offsetDirection = directionRatios;
	let extrusionDirectionRatios = directionRatios;
	if (directionSense === "NEGATIVE") {
		extrusionDirectionRatios = [-directionRatios[0], -directionRatios[1], -directionRatios[2]];
	}
	const extrusionDirection = file.createEntity("IfcDirection", extrusionDirectionRatios);

	const perpendicularOffset = convertSiToUnit(offset, unitScale) * Math.abs(1 / Math.cos(xAngle));
	const perpendicularDepth = convertSiToUnit(depth, unitScale) * Math.abs(1 / Math.cos(xAngle));
	let position: EntityInstance | null = null;
	// Default position for IFC2X3 where .Position is not optional (real Python's own
	// comment, verbatim).
	if (file.schema === "IFC2X3" || offset !== 0) {
		const positionVector: [number, number, number] = [
			offsetDirection[0] * perpendicularOffset,
			offsetDirection[1] * perpendicularOffset,
			offsetDirection[2] * perpendicularOffset,
		];
		position = file.createEntity(
			"IfcAxis2Placement3D",
			file.createEntity("IfcCartesianPoint", positionVector),
			file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
			file.createEntity("IfcDirection", [1.0, 0.0, 0.0]),
		);
	}

	const extrusion: EntityInstance = file.createEntity(
		"IfcExtrudedAreaSolid",
		file.createEntity("IfcArbitraryClosedProfileDef", "AREA", null, curve),
		position,
		extrusionDirection,
		perpendicularDepth,
	);

	if (clippings.length) {
		return applyClippings(file, clippings, extrusion, unitScale);
	}
	return extrusion;
}

function addSlabRepresentationUsecase(file: IfcFile, settings: AddSlabRepresentationSettings): EntityInstance {
	const { context } = settings;
	const depth = settings.depth ?? 0.2;
	const directionSense = settings.directionSense ?? "POSITIVE";
	const offset = settings.offset ?? 0.0;
	const xAngle = settings.xAngle ?? 0.0;
	const polyline = settings.polyline;

	const unitScale = calculateUnitScale(file);
	// The SAME array reference the caller passed (when provided), cast back to mutable --
	// genuinely drained by `.pop()` below (unlike `./addWallRepresentation.ts`'s own
	// `clippings`, which is never aliased) -- see this file's header comment.
	const clippings: (EntityInstance | Clipping)[] = settings.clippings
		? (settings.clippings as (EntityInstance | Clipping)[])
		: [];

	return file.createEntity(
		"IfcShapeRepresentation",
		context,
		context.get("ContextIdentifier") as string | null,
		clippings.length ? "Clipping" : "SweptSolid",
		[createItem(file, depth, directionSense, offset, xAngle, clippings, polyline, unitScale)],
	);
}

/**
 * Adds a geometric representation for a slab (Python:
 * `ifcopenshell.api.geometry.add_slab_representation`).
 *
 * @param settings.context The `IfcGeometricRepresentationContext` for the representation,
 * only Model/Body/MODEL_VIEW type of representations are currently supported.
 * @param settings.depth The slab depth, in meters.
 * @param settings.xAngle The slope angle along the slab's X-axis, in radians.
 * @param settings.clippings List of planes that define clipping half space solids.
 * Clippings can be `Clipping` objects or existing `IfcBooleanResult`s (NOT raw dicts --
 * see this file's header comment for a real, disclosed docstring-vs-implementation
 * inconsistency in the real Python source, preserved here).
 * @returns The new `IfcShapeRepresentation`.
 *
 * @example
 * ```ts
 * const context = util.representation.getContext(model, "Model", "Body", "MODEL_VIEW");
 * const clippings = [new Clipping({ location: [0.0, 0.0, 0.1], normal: [0.0, 0.0, 1.0] })];
 * const representation = api.geometry.addSlabRepresentation(model, { context, depth: 0.2, clippings });
 * api.geometry.assignRepresentation(model, { product: element, representation });
 * ```
 */
export const addSlabRepresentation = wrapUsecase("geometry.add_slab_representation", addSlabRepresentationUsecase);
