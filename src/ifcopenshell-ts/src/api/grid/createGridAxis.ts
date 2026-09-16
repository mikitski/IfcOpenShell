// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/grid/create_grid_axis.py` (src/ifcopenshell-python, 78
// lines) -- part of this project's brand-new `api.grid` module (see `./index.ts`'s own
// header comment). Trivial CRUD: creates an `IfcGridAxis` and appends it to one of the
// owning `IfcGrid`'s `UAxes`/`VAxes`/`WAxes` aggregate attributes.
//
// --- Positional entity construction, verified against all 3 generated `.d.ts`s ---
//
// `IfcGridAxis`: `AxisTag`(0, nullable `string`)/`AxisCurve`(1, mandatory `IfcCurve` in
// the EXPRESS schema, but deliberately left UNSET here)/`SameSense`(2, `boolean`) --
// identical order/shape in `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` (no schema
// divergence for this entity). Real Python's own `file.create_entity("IfcGridAxis",
// **{"AxisTag": axis_tag, "SameSense": same_sense})` uses keyword args, which silently
// skips the mandatory-but-not-yet-known `AxisCurve` (only populated later, by
// `createAxisCurve.ts`) -- this port's `createEntity` only takes *positional* args
// (`file.ts`'s own established convention, see `api/root/createEntity.ts`'s header
// comment for the precedent), so `AxisCurve`'s slot is passed explicitly as `null`
// (index 1) to reproduce the identical "leave this mandatory attribute unset" result --
// matching `api/geometry/editObjectPlacement.ts`'s own `file.createEntity
// ("IfcLocalPlacement", null, relativePlacement)` precedent for the same "skip a
// positional slot via an explicit `null`" technique.
//
// --- `getattr(grid, uvw_axes) or []`, ported with Python's real falsy-list semantics ---
//
// Python's `or []` treats BOTH an unset (`None`) attribute AND an already-set-but-empty
// list as falsy, resetting to a fresh `[]` either way (JS arrays, unlike Python lists,
// are always truthy -- a naive `axesRaw ? axesRaw : []` would treat a real, valid empty
// array as "keep it" rather than "still equivalent to starting fresh", though the two
// are behaviorally identical for the append that follows either way). This project's
// own `attrOrNull`/`nonEmpty`-style convention (see `api/geometry/editObjectPlacement.ts`'s
// header comment) is reused here via an explicit `.length > 0` check for the same
// reason: `UAxes`/`VAxes` are declared non-nullable (`IfcGridAxis[]`) but a freshly
// created `IfcGrid` (via `api.root.createEntity`, which never touches these attributes)
// reads back as `null` here regardless -- confirmed by this project's own established
// convention for exactly this attribute in `api/root/removeProduct.ts:233-235`
// (`(product.get("UAxes") as EntityInstance[] | null) ?? []`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface CreateGridAxisSettings {
	/** The `IfcGrid` you are adding the axis to. */
	grid: EntityInstance;
	/**
	 * The name of the axis, that would typically be labeled on drawings or described on
	 * site during coordination, such as A, B, C, 1, 2, 3, etc. Defaults to `"A"`.
	 */
	axisTag?: string;
	/**
	 * Determines whether the direction of the axis's line is reversed. `true` means the
	 * direction the geometry is defined in represents the direction of the axis. `false`
	 * means the direction is reversed. Leave as `true` if unsure. Defaults to `true`.
	 */
	sameSense?: boolean;
	/**
	 * Choose from `"UAxes"`, `"VAxes"` or `"WAxes"` depending on which set of axes the
	 * new axis you are adding should belong to. Defaults to `"UAxes"`.
	 */
	uvwAxes?: "UAxes" | "VAxes" | "WAxes";
}

function createGridAxisUsecase(file: IfcFile, settings: CreateGridAxisSettings): EntityInstance {
	const axisTag = settings.axisTag ?? "A";
	const sameSense = settings.sameSense ?? true;
	const uvwAxes = settings.uvwAxes ?? "UAxes";

	const element = file.createEntity("IfcGridAxis", axisTag, null, sameSense);

	const existing = settings.grid.get(uvwAxes) as EntityInstance[] | null;
	const axes = existing && existing.length > 0 ? [...existing] : [];
	axes.push(element);
	settings.grid.set(uvwAxes, axes);

	return element;
}

/**
 * Adds a new grid axis to a grid (Python: `ifcopenshell.api.grid.create_grid_axis`).
 *
 * An IFC grid will typically have a minimum of two axes which will be perpendicular to
 * one another. Grids may be rectangular (typically perpendicular lines), radial (where
 * one set of axes is a circle and the other is a line), or triangular (three sets of
 * axes, each at a different angle to one another).
 *
 * For a simple rectangular grid, the "UAxes" are a set of one or more horizontal axes,
 * which are typically labeled with the convention of A, B, C, etc. The "VAxes" is
 * another set of one or more vertical axes, typically labeled with the convention of 1,
 * 2, 3, etc. These axes are horizontal or vertical relative to project north.
 *
 * For a radial grid, the "UAxes" are straight lines, typically radiating from a central
 * point. The "VAxes" are circular perimeters, with the center of these circles being
 * the same central point.
 *
 * For a triangular grid, the UAxes, VAxes, and WAxes are all sets of one or more
 * straight lines.
 *
 * @returns The newly created `IfcGridAxis`.
 *
 * @example
 * ```ts
 * // A pretty standard rectangular grid, with only two axes.
 * const grid = api.root.createEntity(model, { ifcClass: "IfcGrid" });
 * const axisA = api.grid.createGridAxis(model, { axisTag: "A", uvwAxes: "UAxes", grid });
 * const axis1 = api.grid.createGridAxis(model, { axisTag: "1", uvwAxes: "VAxes", grid });
 * ```
 */
export const createGridAxis = wrapUsecase("grid.create_grid_axis", createGridAxisUsecase);
