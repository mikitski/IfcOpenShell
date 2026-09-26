// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/clip_solid.py` (src/ifcopenshell-python, 87 lines)
// -- a thin wrapper around `util/data.ts`'s already-landed `Clipping.apply` (see
// `../../util/data.ts`'s own header comment) for a single solid `item`, plus an optional
// `element` parameter that registers the resulting `IfcBooleanClippingResult` in the
// element's own `BBIM_Boolean` property set (a JSON-encoded array of entity STEP ids),
// via already-landed `api.pset.addPset`/`editPset`/`util.element.getPset`.
//
// *** The `element` branch is a REAL, ALREADY-DISCLOSED, ALREADY-TRACKED blocker --
// verified directly against this exact worktree's own built native addon before writing
// this file, not assumed from the brief alone ***
//
// `TODOS.md`'s "`EntityInstance.setByIndex`/`IfcFile.createEntity` cannot write an
// initial value into a freshly created simple/defined-type instance" entry already
// documents that materializing a brand-new typed value (e.g. an `IfcLabel`) from a raw
// JS scalar throws `"Attribute access is only supported on entity instances"` -- and
// `api/pset/editPset.ts`'s own header comment already confirms this blocks BOTH creating
// a NEW property from a plain scalar AND updating an EXISTING one, since both paths route
// through `castValueToPrimaryMeasureType`. This function's own `editPset(file, {pset,
// properties: {Data: JSON.stringify(data)}})` call always passes a plain JS `string`
// (never an already-built `entity_instance`) for `Data`, on EVERY call -- whether `pset`
// was just created by `addPset` (a brand-new property, the "new" path) or already existed
// from an earlier `clip_solid`/`clip_solid_bounded` call (an existing property being
// overwritten with a new JSON string, the "existing" path) -- so BOTH branches of the
// `element` parameter hit this exact gate, not just the first-call case. Ported
// completely and faithfully anyway, per this project's established discipline: the
// `unit_scale`/`Clipping.apply`/pset-lookup-or-creation logic all run to full completion,
// and the function throws naturally at the exact blocked `editPset` call, with NO
// proactive guard added -- `test/api/geometry/clipSolid.test.ts` pins this CURRENT,
// disclosed, blocked behavior for both `element`-provided test cases (matching
// `editPset.test.ts`'s own established "pin the blocked behavior" precedent), each with a
// comment recording the real, unblocked assertion (`test_element_registers_result_in_
// bbim_boolean`/`test_element_appends_to_existing_bbim_boolean`) to restore once this gap
// closes. `test_no_element_does_not_create_pset` (the `element`-omitted case) is fully
// functional and ported with its real assertion, since it never reaches `editPset` at
// all. See `TODOS.md`'s updated entry for this chunk's own confirmation.
//
// `IfcBooleanClippingResult`/`IfcHalfSpaceSolid`/`IfcPlane` are all verified identical
// across every schema (see `util/data.ts`'s own header comment) -- this function's own
// `Clipping.apply` call therefore works unmodified on IFC2X3 too, matching real Python's
// own `TestClipSolidIFC2X3` test subclass.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { Clipping, type Vec3 } from "../../util/data";
import * as elementUtil from "../../util/element";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";
import { addPset } from "../pset/addPset";
import { editPset } from "../pset/editPset";

export interface ClipSolidSettings {
	/** The solid to clip (`IfcSweptAreaSolid`, `IfcSweptDiskSolid`, or
	 * `IfcBooleanClippingResult`). */
	item: EntityInstance;
	/** A point on the clipping plane in the representation's local coordinate system
	 * (SI units). */
	location: Vec3;
	/**
	 * Plane normal pointing toward the material to be **removed** (the discarded side),
	 * not toward the kept material. For a slope clip the normal points upward into the
	 * removed wedge above the slope line. For a side mitre the normal points outward away
	 * from the wall body.
	 */
	normal: Vec3;
	/**
	 * If provided, the resulting `IfcBooleanClippingResult` is registered in the
	 * element's `BBIM_Boolean` property set so that `regenerateWallRepresentation` (not
	 * yet ported) preserves it during regeneration. **Currently always throws** -- see
	 * this file's own header comment.
	 */
	element?: EntityInstance | null;
}

function clipSolidUsecase(file: IfcFile, settings: ClipSolidSettings): EntityInstance {
	const { item, location, normal, element } = settings;

	const unitScale = calculateUnitScale(file);
	const clipping = new Clipping({ location, normal });
	const result = clipping.apply(file, item, unitScale);

	if (element != null) {
		const psetData = elementUtil.getPset(element, "BBIM_Boolean") as Record<string, unknown> | null;
		let pset: EntityInstance;
		let data: number[];
		if (psetData) {
			pset = file.byId(psetData.id as number);
			const existing = JSON.parse(psetData.Data as string) as number[];
			data = [...new Set([...existing, result.id()])];
		} else {
			pset = addPset(file, { product: element, name: "BBIM_Boolean" });
			data = [result.id()];
		}
		// Currently always throws here -- see this file's own header comment.
		editPset(file, { pset, properties: { Data: JSON.stringify(data) } });
	}

	return result;
}

/**
 * Clips a solid with a half-space plane, returning an `IfcBooleanClippingResult`
 * (Python: `ifcopenshell.api.geometry.clip_solid`).
 *
 * Convenience wrapper around `util.data.Clipping` for use with any solid. This is the
 * same convention used by the `clippings` parameter of `addWallRepresentation` (not yet
 * ported).
 *
 * After clipping, set the parent `IfcShapeRepresentation`'s `RepresentationType` to
 * `"Clipping"`.
 *
 * @example
 * ```ts
 * // Trim an extruded solid to a lean-to slope (removed material is above the slope).
 * const bcr = api.geometry.clipSolid(model, {
 *   item: extrusion,
 *   location: [0.0, 0.0, 3.26],
 *   normal: [0.419, 0.0, 0.908], // points UP toward removed material
 * });
 * ```
 */
export const clipSolid = wrapUsecase("geometry.clip_solid", clipSolidUsecase);
