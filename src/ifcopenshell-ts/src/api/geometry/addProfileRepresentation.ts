// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_profile_representation.py` (src/ifcopenshell-
// python, 224 lines) -- `api.geometry` chunk 8 (25 of ~29 real files now landed, see
// `./index.ts`'s own header comment for the full cumulative list).
//
// *** A REAL, GENUINE, NEW CATEGORY OF BLOCKER -- read this before anything else below.
// Unlike every other `api.geometry` file landed so far, this one hits an actual
// GEOMETRY-KERNEL dependency, not a primitive-layer gap or an unported `util.*`
// function. ***
//
// Real Python imports `ifcopenshell.geom` and `ifcopenshell.util.shape`, and its own
// `get_x`/`get_y` methods' final `else` branch calls `ifcopenshell.geom.create_shape(
// settings, self.profile)` (a real OpenCASCADE-backed BRep/triangulation build) followed
// by `ifcopenshell.util.shape.get_x(shape)`/`get_y(shape)` (reading the resulting mesh's
// own bounding-box extent). This TS port has NO geometry-kernel binding of any kind --
// confirmed by grep across `src/ifcopenshell-ts/src` for `geom`/`create_shape`: the only
// hits are `util/shape.ts` (whose own header comment already discloses the identical,
// pre-existing "no `ifcopenshell.geom` binding of any kind" gap for its own 39
// kernel-dependent functions -- see `TODOS.md`/`PROGRESS.md`'s `util.shape` row),
// `util/placement.ts` (pure matrix math, no kernel call), and 2 unrelated call sites in
// `api/material/editProfileUsage.ts`/`api/boundary/assignConnectionGeometry.ts` (neither
// of which implements or binds a kernel either -- both are just other places the word
// "geometry" appears in a comment/identifier). This is a fundamentally different kind of
// gap from every other `api.geometry` blocker disclosed so far (all of which were either
// a primitive-layer `entity_instance` bug or a small, eventually-portable `util.*`
// function) -- a full OpenCASCADE-class geometry kernel is out of scope for this TS
// port's current architecture (a plain Node native addon with no BRep engine), matching
// this project's existing, identically-reasoned `util.shape`/`addSurfaceTextures`
// precedents for "not a backlog item, a real architectural boundary".
//
// *** Exactly which code paths need the kernel -- traced through every real branch,
// not assumed ***
//
// `get_point`'s own `elif` chain has exactly 9 real branches after the initial `if not
// self.cardinal_point` (falsy/`None` -> bare origin, no kernel call at all):
// "bottom left"/"bottom centre"/"bottom right"/"mid-depth left"/"mid-depth centre"/
// "mid-depth right"/"top left"/"top centre"/"top right". Of those 9, ONLY 8 call
// `get_x()`/`get_y()` at all -- "mid-depth centre" returns a bare origin too (no offset
// needed for the profile's own centre point). Every OTHER `CardinalPointString` value
// (`"geometric centroid"` and the 9 values after it, i.e. numeric 10-19) falls through
// to real Python's own unfinished, already-disclosed-upstream `# TODO other cardinal
// points` comment and its final, unconditional `return self.file.createIfcCartesianPoint
// ((0.0, 0.0, 0.0))` -- meaning cardinal points 10-19 NEVER call `get_x`/`get_y` in real
// Python EITHER, today, on any platform, kernel available or not. This is real Python's
// OWN limitation, not a TS-specific gap -- ported verbatim (these 10 values always
// resolve to the origin, same as `cardinalPoint` being falsy/`None`).
//
// `get_x`/`get_y` themselves each special-case exactly 10 concrete profile classes with
// a closed-form formula needing no kernel at all (`IfcAsymmetricIShapeProfileDef`,
// `IfcCShapeProfileDef`, `IfcCircleProfileDef`, `IfcEllipseProfileDef`,
// `IfcIShapeProfileDef`, `IfcLShapeProfileDef`, `IfcRectangleProfileDef`,
// `IfcTShapeProfileDef`, `IfcUShapeProfileDef`, `IfcZShapeProfileDef`) -- ALL 10 ported
// completely and faithfully below, verified attribute-by-attribute against all 3
// generated `.d.ts`s (see the next section for one real, disclosed, upstream-Python
// quirk found while doing so). Only profiles OUTSIDE this allowlist (arbitrary/composite/
// derived profiles, or any parameterized profile class not in this specific list --
// `IfcCraneRailFShapeProfileDef`/`IfcCraneRailAShapeProfileDef`, etc.) hit the real
// `else` branch and therefore the geometry kernel.
//
// So, concretely: the geometry-kernel-blocked path is reached if AND ONLY IF
// `cardinalPoint` resolves to one of the 8 values above AND `profile` is not one of the
// 10 allowlisted classes. Every other combination (any profile with `cardinalPoint`
// falsy/`null`/`"mid-depth centre"`/one of the 10 unimplemented "in line with ..."
// values; OR any `cardinalPoint` at all when `profile` IS one of the 10 allowlisted
// classes) is fully portable and ported for real below -- this file never throws
// proactively for an input that doesn't actually need the kernel.
//
// *** A real, disclosed, PRE-EXISTING upstream-Python bug (not a TS-port gap), found
// while verifying `IfcAsymmetricIShapeProfileDef` against the generated `.d.ts`s ***
//
// Real Python's `get_x`/`get_y` read `self.profile.OverallWidth`/`.OverallDepth` for an
// `IfcAsymmetricIShapeProfileDef`. `OverallDepth` is genuinely attribute-name-identical
// across all 3 schemas (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`), but
// `OverallWidth` is an IFC2X3-ONLY attribute name -- IFC4/IFC4X3's own real EXPRESS
// schema renamed it to `BottomFlangeWidth` decades ago (confirmed: `ifc4.d.ts`/
// `ifc4x3.d.ts`'s own `IfcAsymmetricIShapeProfileDef` interface has no `OverallWidth`
// member at all). So real Python's own `self.profile.OverallWidth` genuinely raises a
// real `AttributeError` for this exact profile class on IFC4/IFC4X3 TODAY, upstream,
// regardless of this port -- not a corner case this port introduces. Ported verbatim
// below via an unconditional `.get("OverallWidth")` call (this port's own equivalent
// "entity instance ... has no attribute 'OverallWidth'" throw on IFC4/IFC4X3, matching
// `entityInstance.ts`'s own `get()` error message shape) rather than silently working
// around a real, pre-existing Python-side schema inconsistency this port has no
// business "fixing" on its own.
//
// *** Everything else: fully portable, ported completely and faithfully ***
//
// Real Python implements this with an internal `Usecase` class -- flattened into plain
// functions here, matching every other recently-landed `api.geometry` file's own
// established convention. `apply_clippings`'s own `while ... .pop()` LIFO consumption
// (last clipping applied first/innermost) is identical to `addWallRepresentation.ts`'s/
// `addSlabRepresentation.ts`'s own already-verified pattern, reused verbatim below
// (`Array.prototype.pop()`, not `.shift()`). Real Python's own `self.clippings =
// [Clipping.parse(c) for c in clippings]` is a genuinely NEW list (a list
// comprehension) -- never aliases the caller's own `clippings` array, matching
// `addWallRepresentation.ts`'s own `clippings` field (NOT its `booleans` field, which
// this function has no equivalent of at all -- real Python's own
// `add_profile_representation` takes no `booleans` parameter, only `clippings`).
// `RepresentationType` ("Clipping" vs. "SweptSolid") is decided from the still-full
// `clippings` array before `createItem` ever pops anything, matching
// `addWallRepresentation.ts`'s own identical real-Python evaluation-order finding.
// `convert_si_to_unit` (`co / unit_scale`) is applied to `depth` unconditionally, but --
// disclosed above -- is NOT applied to the 10 allowlisted profiles' own closed-form
// `get_x`/`get_y` results (those read the profile's own already-project-unit-scaled
// attributes directly); it IS applied to the (here, unreachable-without-a-kernel)
// `else` branch's own kernel-derived SI result, matching real Python's own asymmetric
// `convert_si_to_unit` placement exactly (verified by reading the real source, not
// assumed uniform).
//
// The numeric-to-string `cardinalPoint` conversion (`CARDINAL_POINT_VALUES[cardinalPoint
// - 1]`) matches real Python's own 1-based `get_args(CardinalPointString)` indexing.
// Real Python's own `CardinalPointNumeric = Literal[1, ..., 19]` type hint already
// excludes `0`/negative integers, matching this port's identical `CardinalPointNumeric`
// union -- so real Python's own accidental negative-index wraparound behavior for an
// out-of-range integer (Python list indexing; e.g. `0` would wrap to the LAST array
// element) is a real, latent bug reachable only by bypassing both languages' own type
// hints, and is NOT reproduced here (a plain `array[n - 1]`, which yields `undefined`
// for `n <= 0` rather than wrapping) -- a deliberate, disclosed divergence, not an
// oversight.
//
// *** Entity classes verified against the generated `.d.ts`s, not assumed ***
//
// `IfcShapeRepresentation(ContextOfItems, RepresentationIdentifier, RepresentationType,
// Items)`, `IfcExtrudedAreaSolid(SweptArea, Position, ExtrudedDirection, Depth)`,
// `IfcAxis2Placement3D(Location, Axis, RefDirection)`, `IfcCartesianPoint(Coordinates)`,
// `IfcDirection(DirectionRatios)` -- all confirmed identical attribute order across all
// 3 generated `.d.ts`s (matching `addWallRepresentation.ts`'s own already-verified
// finding; `IfcExtrudedAreaSolid.Position`'s nullability difference is irrelevant here
// since this function always supplies a real `IfcAxis2Placement3D`, unconditionally, on
// every schema, matching real Python's own unconditional `self.file.
// createIfcAxis2Placement3D(...)` call). All 10 allowlisted profile classes'
// `Width`/`Depth`/`OverallWidth`/`OverallDepth`/`Radius`/`SemiAxis1`/`SemiAxis2`/
// `XDim`/`YDim`/`FlangeWidth`/`WebThickness` attributes verified present (with the one
// `OverallWidth`/IFC4+ exception disclosed above) and positioned identically to real
// Python's own attribute reads on every schema that declares them.
//
// See `TODOS.md`'s new entry for this chunk's full geometry-kernel blocker writeup, and
// `test/api/geometry/addProfileRepresentation.test.ts`'s own header comment for how the
// real Python test suite (which itself only ever exercises the blocked path, via a
// `ShapeBuilder`-built arbitrary profile) is adapted here.

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { Clipping, type ClippingRawData } from "../../util/data";
import * as elementUtil from "../../util/element";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

/** A plain 3-component vector (Python: `VECTOR_3D = tuple[float, float, float]`). */
export type Vec3 = readonly [number, number, number];

/** Python: `CardinalPointNumeric = Literal[1, 2, ..., 19]`. */
export type CardinalPointNumeric = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19;

/** Python: `CardinalPointString`. */
export type CardinalPointString =
	| "bottom left"
	| "bottom centre"
	| "bottom right"
	| "mid-depth left"
	| "mid-depth centre"
	| "mid-depth right"
	| "top left"
	| "top centre"
	| "top right"
	| "geometric centroid"
	| "bottom in line with the geometric centroid"
	| "left in line with the geometric centroid"
	| "right in line with the geometric centroid"
	| "top in line with the geometric centroid"
	| "shear centre"
	| "bottom in line with the shear centre"
	| "left in line with the shear centre"
	| "right in line with the shear centre"
	| "top in line with the shear centre";

/**
 * Python: `CARDINAL_POINT_VALUES: tuple[CardinalPointString, ...] = get_args(
 * CardinalPointString)` -- 1-based lookup table for the numeric `CardinalPoint` form.
 */
export const CARDINAL_POINT_VALUES: readonly CardinalPointString[] = [
	"bottom left",
	"bottom centre",
	"bottom right",
	"mid-depth left",
	"mid-depth centre",
	"mid-depth right",
	"top left",
	"top centre",
	"top right",
	"geometric centroid",
	"bottom in line with the geometric centroid",
	"left in line with the geometric centroid",
	"right in line with the geometric centroid",
	"top in line with the geometric centroid",
	"shear centre",
	"bottom in line with the shear centre",
	"left in line with the shear centre",
	"right in line with the shear centre",
	"top in line with the shear centre",
] as const;

/** Python: `CardinalPoint = Union[CardinalPointNumeric, CardinalPointString]`. */
export type CardinalPoint = CardinalPointNumeric | CardinalPointString;

/** The 8 `cardinalPoint` values that need `getX`/`getY` -- see this file's header comment. */
const KERNEL_DEPENDENT_CARDINAL_POINTS =
	"'bottom left'/'bottom centre'/'bottom right'/'mid-depth left'/'mid-depth right'/'top left'/'top centre'/'top right'";

export interface AddProfileRepresentationSettings {
	/**
	 * The `IfcGeometricRepresentationContext` for the representation, only
	 * Model/Body/MODEL_VIEW type of representations are currently supported.
	 */
	context: EntityInstance;
	/** The `IfcProfileDef` to extrude. */
	profile: EntityInstance;
	/** The depth of the extrusion in meters. Defaults to `1.0`. */
	depth?: number;
	/**
	 * The cardinal point of the profile. Defaults to `5` (`"mid-depth centre"`) -- pass
	 * `null` explicitly for a bare, unoffset origin point instead.
	 */
	cardinalPoint?: CardinalPoint | null;
	/**
	 * A list of planes that define clipping half space solids. Clippings can be
	 * `Clipping` objects, raw `{location, normal}`/`{matrix}` dicts (see
	 * `Clipping.parse`), or existing `IfcBooleanResult`s. Never aliased by this
	 * function -- the caller's own array is left untouched.
	 */
	clippings?: readonly ClippingRawData[];
	/**
	 * A tuple of two vectors that define the placement of the profile. The first
	 * vector is the Z axis, the second vector is the X axis. Defaults to `[null, null]`
	 * (`(0, 0, 1)`/`(1, 0, 0)`).
	 */
	placementZxAxes?: readonly [Vec3 | null, Vec3 | null];
}

function convertSiToUnit(co: number, unitScale: number): number {
	return co / unitScale;
}

/** Throws the disclosed geometry-kernel blocker -- see this file's header comment. */
function kernelBlockedError(axis: "X" | "Y", profile: EntityInstance): Error {
	const shapeFn = axis === "X" ? "get_x" : "get_y";
	return new Error(
		`addProfileRepresentation: computing the bounding-box ${axis} extent of a '${profile.isA()}' profile (needed for the ${KERNEL_DEPENDENT_CARDINAL_POINTS} cardinalPoint values) needs a real geometry kernel (Python: ifcopenshell.geom.create_shape + ifcopenshell.util.shape.${shapeFn}), which this TS port doesn't have -- see TODOS.md.`,
	);
}

/**
 * Python: `Usecase.get_x` -- the profile's own bounding-box X extent. Not SI-converted
 * for the 10 allowlisted profile classes (their own attributes are already in project
 * units); see this file's header comment.
 */
function getX(profile: EntityInstance): number {
	if (profile.isA("IfcAsymmetricIShapeProfileDef")) {
		// Real Python-source bug on IFC4/IFC4X3, preserved verbatim -- see header comment.
		return profile.get("OverallWidth") as number;
	}
	if (profile.isA("IfcCShapeProfileDef")) return profile.get("Width") as number;
	if (profile.isA("IfcCircleProfileDef")) return (profile.get("Radius") as number) * 2;
	if (profile.isA("IfcEllipseProfileDef")) return (profile.get("SemiAxis1") as number) * 2;
	if (profile.isA("IfcIShapeProfileDef")) return profile.get("OverallWidth") as number;
	if (profile.isA("IfcLShapeProfileDef")) return profile.get("Width") as number;
	if (profile.isA("IfcRectangleProfileDef")) return profile.get("XDim") as number;
	if (profile.isA("IfcTShapeProfileDef")) return profile.get("FlangeWidth") as number;
	if (profile.isA("IfcUShapeProfileDef")) return profile.get("FlangeWidth") as number;
	if (profile.isA("IfcZShapeProfileDef")) {
		return (profile.get("FlangeWidth") as number) * 2 - (profile.get("WebThickness") as number);
	}
	throw kernelBlockedError("X", profile);
}

/** Python: `Usecase.get_y` -- the profile's own bounding-box Y extent. See `getX`. */
function getY(profile: EntityInstance): number {
	if (profile.isA("IfcAsymmetricIShapeProfileDef")) return profile.get("OverallDepth") as number;
	if (profile.isA("IfcCShapeProfileDef")) return profile.get("Depth") as number;
	if (profile.isA("IfcCircleProfileDef")) return (profile.get("Radius") as number) * 2;
	if (profile.isA("IfcEllipseProfileDef")) return (profile.get("SemiAxis2") as number) * 2;
	if (profile.isA("IfcIShapeProfileDef")) return profile.get("OverallDepth") as number;
	if (profile.isA("IfcLShapeProfileDef")) return profile.get("Depth") as number;
	if (profile.isA("IfcRectangleProfileDef")) return profile.get("YDim") as number;
	if (profile.isA("IfcTShapeProfileDef")) return profile.get("Depth") as number;
	if (profile.isA("IfcUShapeProfileDef")) return profile.get("Depth") as number;
	if (profile.isA("IfcZShapeProfileDef")) return profile.get("Depth") as number;
	throw kernelBlockedError("Y", profile);
}

/**
 * Python: `Usecase.get_point`. Only 8 of the 9 real `elif` branches (everything except
 * `"mid-depth centre"`) call `getX`/`getY` at all; cardinal points 10-19 (`"geometric
 * centroid"` and beyond) hit real Python's own unfinished `# TODO other cardinal
 * points` fallback and always resolve to the bare origin -- see this file's header
 * comment.
 */
function getPoint(profile: EntityInstance, cardinalPoint: CardinalPointString | null): Vec3 {
	if (!cardinalPoint) return [0.0, 0.0, 0.0];
	switch (cardinalPoint) {
		case "bottom left":
			return [-getX(profile) / 2, getY(profile) / 2, 0.0];
		case "bottom centre":
			return [0.0, getY(profile) / 2, 0.0];
		case "bottom right":
			return [getX(profile) / 2, getY(profile) / 2, 0.0];
		case "mid-depth left":
			return [-getX(profile) / 2, 0.0, 0.0];
		case "mid-depth centre":
			return [0.0, 0.0, 0.0];
		case "mid-depth right":
			return [getX(profile) / 2, 0.0, 0.0];
		case "top left":
			return [-getX(profile) / 2, -getY(profile) / 2, 0.0];
		case "top centre":
			return [0.0, -getY(profile) / 2, 0.0];
		case "top right":
			return [getX(profile) / 2, -getY(profile) / 2, 0.0];
		default:
			// "geometric centroid" and the 9 values after it -- real Python's own
			// not-yet-implemented fallback, ported verbatim (see header comment).
			return [0.0, 0.0, 0.0];
	}
}

/**
 * Python: `Usecase.apply_clippings` -- LIFO (`.pop()`) consumption, identical to
 * `addWallRepresentation.ts`'s/`addSlabRepresentation.ts`'s own already-verified pattern.
 */
function applyClippings(
	file: IfcFile,
	clippings: (EntityInstance | Clipping)[],
	firstOperandIn: EntityInstance,
	unitScale: number,
): EntityInstance {
	let firstOperand = firstOperandIn;
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

/** Python: `Usecase.create_item`. */
function createItem(
	file: IfcFile,
	profile: EntityInstance,
	cardinalPoint: CardinalPointString | null,
	depth: number,
	placementZxAxes: readonly [Vec3 | null, Vec3 | null],
	clippings: (EntityInstance | Clipping)[],
	unitScale: number,
): EntityInstance {
	const point = getPoint(profile, cardinalPoint);
	const placement = file.createEntity(
		"IfcAxis2Placement3D",
		file.createEntity("IfcCartesianPoint", point),
		file.createEntity("IfcDirection", placementZxAxes[0] ?? [0.0, 0.0, 1.0]),
		file.createEntity("IfcDirection", placementZxAxes[1] ?? [1.0, 0.0, 0.0]),
	);
	let extrusion: EntityInstance = file.createEntity(
		"IfcExtrudedAreaSolid",
		profile,
		placement,
		file.createEntity("IfcDirection", [0.0, 0.0, 1.0]),
		convertSiToUnit(depth, unitScale),
	);
	if (clippings.length) {
		extrusion = applyClippings(file, clippings, extrusion, unitScale);
	}
	return extrusion;
}

function resolveCardinalPoint(cardinalPoint: CardinalPoint | null): CardinalPointString | null {
	if (cardinalPoint === null) return null;
	if (typeof cardinalPoint === "number") {
		// 1-based, matching real Python's own `CARDINAL_POINT_VALUES[cardinal_point - 1]`
		// -- see header comment for the deliberate non-reproduction of Python's own
		// negative-index-wraparound edge case for an out-of-range (type-hint-violating)
		// integer.
		return CARDINAL_POINT_VALUES[cardinalPoint - 1];
	}
	return cardinalPoint;
}

function addProfileRepresentationUsecase(file: IfcFile, settings: AddProfileRepresentationSettings): EntityInstance {
	const { context, profile } = settings;
	const depth = settings.depth ?? 1.0;
	// Python: `cardinal_point: Union[CardinalPoint, None] = 5` (the public wrapper
	// function's own default) -- `undefined` (omitted) defaults to `5`
	// ("mid-depth centre"); an explicit `null` is preserved as the falsy/no-offset case.
	const rawCardinalPoint = settings.cardinalPoint === undefined ? 5 : settings.cardinalPoint;
	const cardinalPoint = resolveCardinalPoint(rawCardinalPoint);
	const placementZxAxes = settings.placementZxAxes ?? [null, null];
	// A genuinely NEW array (never aliases the caller's own `clippings`) -- matches
	// real Python's own list-comprehension `self.clippings = [Clipping.parse(c) for c
	// in clippings]`.
	const clippings = (settings.clippings ?? []).map((c) => Clipping.parse(c));
	const unitScale = calculateUnitScale(file);

	// Decided from the still-full `clippings` array, before `createItem` pops anything
	// -- matches `addWallRepresentation.ts`'s own identical real-Python
	// evaluation-order finding.
	const representationType = clippings.length ? "Clipping" : "SweptSolid";

	return file.createEntity(
		"IfcShapeRepresentation",
		context,
		context.get("ContextIdentifier") as string | null,
		representationType,
		[createItem(file, profile, cardinalPoint, depth, placementZxAxes, clippings, unitScale)],
	);
}

/**
 * Adds a profile (extruded solid) representation (Python:
 * `ifcopenshell.api.geometry.add_profile_representation`).
 *
 * @param settings.context The `IfcGeometricRepresentationContext` for the
 * representation, only Model/Body/MODEL_VIEW type of representations are currently
 * supported.
 * @param settings.profile The `IfcProfileDef` to extrude.
 * @param settings.depth The depth of the extrusion in meters.
 * @param settings.cardinalPoint The cardinal point of the profile. **Throws** when it
 * resolves to one of {@link KERNEL_DEPENDENT_CARDINAL_POINTS} and `profile` is not one
 * of the 10 profile classes this port can compute a closed-form bounding-box extent
 * for (`IfcAsymmetricIShapeProfileDef`/`IfcCShapeProfileDef`/`IfcCircleProfileDef`/
 * `IfcEllipseProfileDef`/`IfcIShapeProfileDef`/`IfcLShapeProfileDef`/
 * `IfcRectangleProfileDef`/`IfcTShapeProfileDef`/`IfcUShapeProfileDef`/
 * `IfcZShapeProfileDef`) -- see this file's own header comment and `TODOS.md`.
 * @param settings.clippings A list of planes that define clipping half space solids.
 * Planes are defined either by `Clipping` objects or by dictionaries of arguments for
 * `Clipping.parse`.
 * @param settings.placementZxAxes A tuple of two vectors that define the placement of
 * the profile. The first vector is the Z axis, the second vector is the X axis.
 * @returns The new `IfcShapeRepresentation`.
 */
export const addProfileRepresentation = wrapUsecase(
	"geometry.add_profile_representation",
	addProfileRepresentationUsecase,
);
