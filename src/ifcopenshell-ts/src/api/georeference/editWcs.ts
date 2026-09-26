// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/georeference/edit_wcs.py` (src/ifcopenshell-python, 97 lines)
// -- part of this project's brand-new `api.georeference` module (see `./index.ts`'s own
// header comment). Edits the World Coordinate System (`IfcGeometricRepresentationContext
// .WorldCoordinateSystem`) for every top-level context in the file to a translation and
// (Z-axis) rotation.
//
// --- What this computes (read in full before porting, per this chunk's own task
// brief) ---
//
// Given an `(x, y, z)` translation and a `rotation` (decimal degrees, anticlockwise,
// about Z), this builds a NEW placement -- `IfcAxis2Placement3D`/`IfcAxis2Placement2D`
// depending on the context's own `CoordinateSpaceDimension` -- whose origin is the
// translation (converted from SI to project units, unless `isSi: false`) and whose X
// axis direction is `(cos(rotation), sin(rotation))` (identity `(1, 0)` when `rotation`
// is close to zero, avoiding a `cos(0)`/`sin(0)` floating-point round-trip). The 3D case
// keeps the Z axis fixed at `(0, 0, 1)` (`rotation` only ever affects X/Y -- a Z-axis
// rotation, i.e. a top-down plan-view rotation, matching the docstring's "top down plan
// view" framing exactly). Every context's OLD `WorldCoordinateSystem` is then replaced
// with this new placement, and purged if nothing else references it.
//
// --- `numpy`/`shape_builder` import: NOT a blocker (this chunk's own task brief flagged
// this correctly) -- confirmed by reading the full source, not assumed ---
//
// `np.isclose(rotation, 0)` and `np.allclose((x, y, z), (0, 0, 0))` are the only two real
// numpy operations in this file -- both simple scalar/vector approximate-equality
// checks, ported below as a small local `allClose` helper reproducing numpy's own
// default tolerance formula (`abs(a - b) <= atol + rtol * abs(b)`, `rtol=1e-5`/
// `atol=1e-8`) applied elementwise -- the SAME formula (independently duplicated, per
// this project's established "small per-module private helpers" convention)
// `../boundary/assignConnectionGeometry.ts`'s own `allClose` already uses for the
// identical numpy semantics. `builder.create_axis2_placement_3d(...)` (`ShapeBuilder`)
// is likewise NOT a full-class dependency -- `../geometry/editObjectPlacement.ts`
// already ported exactly this one method as a small local helper
// (`createAxis2Placement3d`); duplicated here verbatim (three `create_entity` calls --
// `IfcCartesianPoint`/`IfcDirection` (Axis)/`IfcDirection` (RefDirection) -- wrapped in
// an `IfcAxis2Placement3D`), matching that file's own established "duplicate this one
// tiny helper per module rather than share it" precedent (the SAME reasoning `allClose`
// itself already sets: neither helper is a general-purpose, actively-maintained shared
// abstraction worth the coupling cost of a cross-module import for a 3-line body).
//
// --- Two deliberate floating-point-avoidance quirks, preserved verbatim (not
// "simplified away") ---
//
// 1. `if np.isclose(rotation, 0): xaxis_x, xaxis_y = 1.0, 0.0 else: cos(radians(
//    rotation)), sin(radians(rotation))` -- an explicit exact-`(1, 0)` shortcut for a
//    near-zero rotation, rather than relying on `cos(0.0)`/`sin(0.0)` to land on exactly
//    `1.0`/`0.0` (which they do in IEEE-754 double precision for an EXACT `0.0`, but this
//    guards against a rotation that's merely close-to-zero, e.g. floating-point noise
//    from an upstream computation, landing on a suspiciously-almost-`(1, 0)` pair with
//    tiny non-zero error instead of the clean identity).
// 2. `if np.allclose((x, y, z), (0, 0, 0)): x = y = z = 0.0` -- the identical "snap
//    near-zero to exact zero" idea applied to the translation, independently of unit
//    conversion (this check runs BEFORE the SI/project-units division below, on the
//    caller's own raw `x`/`y`/`z` inputs).
//
// --- Direct entity-to-entity reassignment: no native inverse-index-bug workaround
// needed here, unlike `./editTrueNorth.ts` ---
//
// `context.WorldCoordinateSystem = placement` (Python) assigns a BRAND NEW placement
// directly over the old one -- never routing through an explicit `null` intermediate --
// so this is the SAME "direct reassignment correctly unregisters the old reference and
// registers the new one" shape `../geometry/editObjectPlacement.ts`'s own header comment
// already verified is unaffected by the disclosed native inverse-index bug (unlike a
// `.set(name, null)` clear, which IS affected -- see `./editTrueNorth.ts`'s own header
// comment for that contrasting case in this very same module). `file.getTotalInverses(
// oldWcs) === 0` (checked AFTER the reassignment) therefore reads correctly, and
// `removeDeep2` is called unconditionally, matching real Python's own unconditional
// (not gated on a prior existence check) call.
//
// --- Schema divergence: none for the entities touched ---
//
// `IfcGeometricRepresentationContext.WorldCoordinateSystem`/`CoordinateSpaceDimension`,
// `IfcAxis2Placement3D`/`IfcAxis2Placement2D`, `IfcCartesianPoint`/`IfcDirection` are all
// identical in shape across `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` (confirmed directly)
// -- this function runs unmodified against every schema.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";

/** `np.isclose`/`np.allclose` with numpy's own default `rtol=1e-5`/`atol=1e-8` -- see
 * this file's own header comment for why this is duplicated rather than imported from
 * `../boundary/assignConnectionGeometry.ts`'s own identical helper. */
function allClose(a: readonly number[], b: readonly number[]): boolean {
	return a.every((v, i) => Math.abs(v - b[i]) <= 1e-8 + 1e-5 * Math.abs(b[i]));
}

/** Python's `ShapeBuilder.create_axis2_placement_3d` -- see this file's header comment
 * for why only this one method is duplicated here, as a small local helper, matching
 * `../geometry/editObjectPlacement.ts`'s own identical `createAxis2Placement3d`. */
function createAxis2Placement3d(
	file: IfcFile,
	position: readonly [number, number, number],
	zAxis: readonly [number, number, number],
	xAxis: readonly [number, number, number],
): EntityInstance {
	return file.createEntity(
		"IfcAxis2Placement3D",
		file.createEntity("IfcCartesianPoint", [position[0], position[1], position[2]]),
		file.createEntity("IfcDirection", [zAxis[0], zAxis[1], zAxis[2]]),
		file.createEntity("IfcDirection", [xAxis[0], xAxis[1], xAxis[2]]),
	);
}

export interface EditWcsSettings {
	/** The X translation of the WCS. Defaults to `0.0`. */
	x?: number;
	/** The Y translation of the WCS. Defaults to `0.0`. */
	y?: number;
	/** The Z translation of the WCS. Defaults to `0.0`. */
	z?: number;
	/**
	 * The rotation around the Z axis (i.e. top down plan view) in decimal degrees of the
	 * WCS. Anticlockwise is positive. Defaults to `0.0`.
	 */
	rotation?: number;
	/** Whether `x`/`y`/`z` are given in SI units (`true`, the default) or project units. */
	isSi?: boolean;
}

function editWcsUsecase(file: IfcFile, settings: EditWcsSettings = {}): void {
	let x = settings.x ?? 0.0;
	let y = settings.y ?? 0.0;
	let z = settings.z ?? 0.0;
	const rotation = settings.rotation ?? 0.0;
	const isSi = settings.isSi ?? true;

	const unitScale = calculateUnitScale(file);

	let xaxisX: number;
	let xaxisY: number;
	if (allClose([rotation], [0])) {
		xaxisX = 1.0;
		xaxisY = 0.0;
	} else {
		const rotationRad = (rotation * Math.PI) / 180;
		xaxisX = Math.cos(rotationRad);
		xaxisY = Math.sin(rotationRad);
	}
	if (allClose([x, y, z], [0, 0, 0])) {
		x = y = z = 0.0;
	}

	for (const context of file.byType("IfcGeometricRepresentationContext", false)) {
		const oldWcs = context.get("WorldCoordinateSystem") as EntityInstance;
		const dimension = context.get("CoordinateSpaceDimension") as number;

		let placement: EntityInstance;
		if (dimension === 3) {
			const xyz: [number, number, number] = isSi ? [x / unitScale, y / unitScale, z / unitScale] : [x, y, z];
			placement = createAxis2Placement3d(file, xyz, [0.0, 0.0, 1.0], [xaxisX, xaxisY, 0.0]);
		} else if (dimension === 2) {
			const point = isSi
				? file.createEntity("IfcCartesianPoint", [x / unitScale, y / unitScale])
				: file.createEntity("IfcCartesianPoint", [x, y]);
			placement = file.createEntity("IfcAxis2Placement2D", point, file.createEntity("IfcDirection", [xaxisX, xaxisY]));
		} else {
			throw new Error(
				`editWcs: unexpected CoordinateSpaceDimension '${dimension}' on context #${context.id()} (expected 2 or 3)`,
			);
		}

		context.set("WorldCoordinateSystem", placement);
		if (file.getTotalInverses(oldWcs) === 0) {
			elementUtil.removeDeep2(file, oldWcs);
		}
	}
}

/**
 * Edits the WCS for all geometric contexts to a translation and rotation (Python:
 * `ifcopenshell.api.georeference.edit_wcs`).
 *
 * Typically, a project's local engineering origin `(0, 0, 0)` has a coordinate operation
 * (e.g. map conversion) to a projected CRS. If a WCS is provided, the coordinate
 * operation is relative to the WCS, not the local engineering origin.
 *
 * For example, if an `IfcSite` has a placement at `(10, 0, 0)` and a map conversion of
 * `(50, 0, 0)`, its local XYZ is at `(10, 0, 0)` with an ENH (Easting, Northing, Height)
 * of `(60, 0, 0)`. If the WCS is then set to `(15, 0, 0)`, the `IfcSite`'s local XYZ is
 * still at `(10, 0, 0)` but its ENH is now at `(45, 0, 0)`.
 *
 * It's recommended to leave the WCS at `(0, 0, 0)`. Please :)
 *
 * @example
 * ```ts
 * // This is the simplest scenario, resetting the WCS to (0, 0, 0) with no rotation
 * // (recommended).
 * api.georeference.editWcs(model, {});
 * ```
 */
export const editWcs = wrapUsecase("georeference.edit_wcs", editWcsUsecase);
