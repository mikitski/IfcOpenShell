// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_wall_representation.py` (src/ifcopenshell-python,
// 145 lines) -- only imports `ifcopenshell.util.element` (`copy`, already landed),
// `ifcopenshell.util.unit` (`calculate_unit_scale`, already landed), and this same
// project's freshly-landed `util/data.ts` (`Clipping`, see that file's own header
// comment). Fully self-contained: no `ShapeBuilder`/geometry-kernel dependency at all --
// confirmed by reading the whole real Python file, it builds `IfcExtrudedAreaSolid`/
// `IfcArbitraryClosedProfileDef` directly via plain `file.create_entity` calls.
//
// *** Real Python implements this with an internal `Usecase` class -- flattened into a
// single function here, matching this project's own established convention (confirmed
// against `./index.ts`'s own header comment and sibling already-landed files, e.g.
// `./addAxisRepresentation.ts`'s own identical flattening) ***
//
// Builds a rectangular (length x thickness) profile extruded to `height`, wrapped in an
// `IfcShapeRepresentation`. Optionally slopes the extrusion along the local X axis
// (`x_angle`), offsets the profile's origin, and/or applies a chain of `booleans`/
// `clippings` on top of the raw extrusion.
//
// *** Entity classes verified against the generated `.d.ts`s, not assumed ***
//
// `IfcShapeRepresentation(ContextOfItems, RepresentationIdentifier, RepresentationType,
// Items)`, `IfcExtrudedAreaSolid(SweptArea, Position, ExtrudedDirection, Depth)`,
// `IfcArbitraryClosedProfileDef(ProfileType, ProfileName, OuterCurve)`,
// `IfcAxis2Placement3D(Location, Axis, RefDirection)`, `IfcCartesianPoint(Coordinates)`,
// `IfcDirection(DirectionRatios)` -- all confirmed identical attribute order across
// `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` (`IfcExtrudedAreaSolid.Position` is `| null` on
// IFC4/IFC4X3 but required on IFC2X3 -- irrelevant here since this function always
// supplies a real `IfcAxis2Placement3D`, on every schema, matching real Python's own
// unconditional `self.file.createIfcAxis2Placement3D(...)` call). `IfcPolyline(Points:
// IfcCartesianPoint[])` (IFC2X3) vs. `IfcIndexedPolyCurve(Points: IfcCartesianPointList,
// Segments, SelfIntersect)` + `IfcCartesianPointList2D(CoordList: number[][])` (IFC4+,
// the latter two absent entirely on IFC2X3) -- exactly the real schema-level backing for
// `if self.file.schema == "IFC2X3"`, matching `./addAxisRepresentation.ts`'s own already-
// verified identical finding for this exact curve-class branch. `IfcIndexedPolyCurve` is
// called with all 3 positional args (`Points`, `null`, `false`), matching real Python's
// own `self.file.createIfcIndexedPolyCurve(..., None, False)` exactly (unlike
// `add_slab_representation.py`'s own sibling call, which omits the trailing 2 args --
// see `./addSlabRepresentation.ts`'s own header comment for that real, disclosed
// divergence between the two files).
//
// *** `apply_booleans`/`apply_clippings`'s own `while ... .pop()` reverse-order (LIFO)
// consumption -- a real, easy-to-get-backwards detail, verified not assumed ***
//
// Both loops repeatedly `.pop()` from the END of their respective list, feeding each
// popped entry's own result back in as the NEXT iteration's `first_operand` -- i.e. the
// LAST item in `booleans`/`clippings` is applied FIRST (innermost / closest to the raw
// extrusion), and the FIRST item ends up as the outermost/final result. Ported below with
// `Array.prototype.pop()` for the identical LIFO order (not `.shift()`, which would be
// FIFO and wrong).
//
// *** Two real, disclosed `booleans`/`clippings` ALIASING quirks, preserved verbatim ***
//
// 1. `booleans`: `self.settings["booleans"] = booleans if booleans is not None else []`
//    assigns the SAME list object the caller passed in (when not `None`) -- no copy.
//    `apply_booleans`'s own `.pop()` therefore genuinely, visibly DRAINS the caller's own
//    list as a side effect (an empty list remains in the caller's hands after this
//    function returns). This port's public `AddWallRepresentationSettings.booleans` field
//    is still declared `readonly` (matching this codebase's own established
//    settings-array convention, e.g. `./addBoolean.ts`'s own `secondItems`), but the
//    SAME underlying array reference is cast back to mutable internally and genuinely
//    drained via `.pop()` -- not defensively cloned -- to preserve this exact real,
//    surprising aliasing behavior for any caller relying on (or tripped up by) it.
// 2. `clippings`: by contrast, `self.clippings = [Clipping.parse(c) for c in
//    self.settings["clippings"]]` is a list COMPREHENSION -- a genuinely NEW list, never
//    aliasing the caller's own `clippings` array. `apply_clippings`'s own `.pop()` therefore
//    never touches the caller's original array. Ported below via `.map(...)`, which
//    likewise always allocates a fresh array -- no cast-to-mutable trick needed here,
//    unlike `booleans` above.
//
// *** `IfcShapeRepresentation`'s own `RepresentationType` ("Clipping" vs. "SweptSolid")
// is decided BEFORE any popping happens ***
//
// Real Python evaluates `"Clipping" if self.clippings or self.settings["booleans"] else
// "SweptSolid"` as one positional argument to `createIfcShapeRepresentation(...)`,
// evaluated (per normal Python left-to-right argument evaluation) strictly BEFORE the
// NEXT positional argument, `[self.create_item()]` -- i.e. before `create_item` ever pops
// anything off either list. Ported below by computing `representationType` up front, from
// the still-full `clippings`/`booleans` arrays, before calling `createItem()`.
//
// Real Python quirk, preserved verbatim: `thickness *= 1 / cos(x_angle)` runs
// UNCONDITIONALLY (even when `x_angle` is `0`, where `1 / cos(0) === 1` is a no-op
// multiply -- harmless, but genuinely always executed, not skipped by an `if x_angle`
// guard the way the `extrusion_direction`/`depth` computations below it are).

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { Clipping, type ClippingRawData } from "../../util/data";
import * as elementUtil from "../../util/element";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface AddWallRepresentationSettings {
	/**
	 * The `IfcGeometricRepresentationContext` for the representation, only
	 * Model/Body/MODEL_VIEW type of representations are currently supported.
	 */
	context: EntityInstance;
	/** The length of the wall in meters. Defaults to `1.0`. */
	length?: number;
	/** The height of the wall in meters. Defaults to `3.0`. */
	height?: number;
	/** Defaults to `"POSITIVE"`. */
	directionSense?: "POSITIVE" | "NEGATIVE";
	/** The base offset distance of the wall from the origin. Defaults to `0.0`. */
	offset?: number;
	/** The thickness of the wall in meters. Defaults to `0.2`. */
	thickness?: number;
	/** The slope angle along the wall's X-axis, in radians. Defaults to `0.0`. */
	xAngle?: number;
	/**
	 * List of clipping definitions. Clippings can be `Clipping` objects, raw
	 * `{location, normal}`/`{matrix}` dicts (see `Clipping.parse`), or existing
	 * `IfcBooleanResult`s. Each clipping has a `normal` that points toward the removed
	 * material (the discarded side), not toward the kept material.
	 *
	 * Never aliased by this function -- the caller's own array is left untouched (see
	 * this file's header comment, quirk 2).
	 */
	clippings?: readonly ClippingRawData[];
	/**
	 * List of any existing `IfcBooleanResult`s.
	 *
	 * Genuinely DRAINED (emptied via repeated `.pop()`) by this function as a real,
	 * disclosed side effect -- see this file's header comment (quirk 1).
	 */
	booleans?: readonly EntityInstance[];
}

function convertSiToUnit(co: number, unitScale: number): number {
	return co / unitScale;
}

function applyBooleans(booleans: EntityInstance[], firstOperandIn: EntityInstance): EntityInstance {
	let firstOperand = firstOperandIn;
	// LIFO -- see this file's header comment. Matches `./removeBoolean.ts`'s own
	// established `while (queue.length) { const x = queue.pop()!; ... }` idiom for a
	// real Python `while ... .pop()` loop.
	while (booleans.length) {
		// biome-ignore lint/style/noNonNullAssertion: `booleans.length` just checked.
		const boolean = booleans.pop()!;
		boolean.set("FirstOperand", firstOperand);
		firstOperand = boolean;
	}
	return firstOperand;
}

function applyClippings(
	file: IfcFile,
	clippings: (EntityInstance | Clipping)[],
	firstOperandIn: EntityInstance,
	unitScale: number,
): EntityInstance {
	let firstOperand = firstOperandIn;
	// LIFO -- see this file's header comment.
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
	settings: Required<Omit<AddWallRepresentationSettings, "context" | "clippings" | "booleans">>,
	unitScale: number,
	clippings: (EntityInstance | Clipping)[],
	booleans: EntityInstance[],
): EntityInstance {
	const length = convertSiToUnit(settings.length, unitScale);
	let thickness = convertSiToUnit(settings.thickness, unitScale);
	// Unconditional -- see this file's header comment (a no-op multiply when `xAngle` is 0).
	thickness *= 1 / Math.cos(settings.xAngle);
	if (settings.directionSense === "NEGATIVE") {
		thickness *= -1;
	}
	const points: readonly [number, number][] = [
		[0.0, 0.0],
		[0.0, thickness],
		[length, thickness],
		[length, 0.0],
		[0.0, 0.0],
	];

	let curve: EntityInstance;
	if (file.schema === "IFC2X3") {
		curve = file.createEntity(
			"IfcPolyline",
			points.map((p) => file.createEntity("IfcCartesianPoint", [p[0], p[1]])),
		);
	} else {
		curve = file.createEntity(
			"IfcIndexedPolyCurve",
			file.createEntity(
				"IfcCartesianPointList2D",
				points.map((p) => [p[0], p[1]]),
			),
			null,
			false,
		);
	}

	let extrusionDirection: EntityInstance;
	if (settings.xAngle) {
		extrusionDirection = file.createEntity("IfcDirection", [0.0, Math.sin(settings.xAngle), Math.cos(settings.xAngle)]);
	} else {
		extrusionDirection = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
	}

	let extrusion: EntityInstance = file.createEntity(
		"IfcExtrudedAreaSolid",
		file.createEntity("IfcArbitraryClosedProfileDef", "AREA", null, curve),
		file.createEntity(
			"IfcAxis2Placement3D",
			file.createEntity("IfcCartesianPoint", [0.0, convertSiToUnit(settings.offset, unitScale), 0.0]),
			file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
			file.createEntity("IfcDirection", [1.0, 0.0, 0.0]),
		),
		extrusionDirection,
		convertSiToUnit(settings.height, unitScale) * Math.abs(1 / Math.cos(settings.xAngle)),
	);

	if (booleans.length) {
		extrusion = applyBooleans(booleans, extrusion);
	}
	if (clippings.length) {
		extrusion = applyClippings(file, clippings, extrusion, unitScale);
	}
	return extrusion;
}

function addWallRepresentationUsecase(file: IfcFile, settings: AddWallRepresentationSettings): EntityInstance {
	const { context } = settings;
	const resolvedSettings = {
		length: settings.length ?? 1.0,
		height: settings.height ?? 3.0,
		directionSense: settings.directionSense ?? "POSITIVE",
		offset: settings.offset ?? 0.0,
		thickness: settings.thickness ?? 0.2,
		xAngle: settings.xAngle ?? 0.0,
	};

	const unitScale = calculateUnitScale(file);
	// New array, never aliasing the caller's own `clippings` -- see this file's header
	// comment (quirk 2).
	const clippings = (settings.clippings ?? []).map((c) => Clipping.parse(c));
	// The SAME array reference the caller passed (when provided), cast back to mutable --
	// genuinely drained by `.pop()` below, see this file's header comment (quirk 1).
	const booleans: EntityInstance[] = settings.booleans ? (settings.booleans as EntityInstance[]) : [];

	// Decided from the still-full arrays, BEFORE `createItem` pops anything -- see this
	// file's header comment.
	const representationType = clippings.length || booleans.length ? "Clipping" : "SweptSolid";

	return file.createEntity(
		"IfcShapeRepresentation",
		context,
		context.get("ContextIdentifier") as string | null,
		representationType,
		[createItem(file, resolvedSettings, unitScale, clippings, booleans)],
	);
}

/**
 * Adds a geometric representation for a wall (Python:
 * `ifcopenshell.api.geometry.add_wall_representation`).
 *
 * @param settings.context The `IfcGeometricRepresentationContext` for the representation,
 * only Model/Body/MODEL_VIEW type of representations are currently supported.
 * @param settings.length The length of the wall in meters.
 * @param settings.height The height of the wall in meters.
 * @param settings.offset The base offset distance of the wall from the origin.
 * @param settings.thickness The thickness of the wall in meters.
 * @param settings.xAngle The slope angle along the wall's X-axis, in radians.
 * @param settings.clippings List of clipping definitions. Clippings can be `Clipping`
 * objects or dictionaries of arguments for `Clipping.parse`. Each clipping has a
 * `normal` that points toward the removed material (the discarded side), not toward the
 * kept material; see `clipSolid` for details.
 * @param settings.booleans List of any existing `IfcBooleanResult`s. Genuinely drained
 * (see this file's header comment).
 * @returns The new `IfcShapeRepresentation`.
 */
export const addWallRepresentation = wrapUsecase("geometry.add_wall_representation", addWallRepresentationUsecase);
