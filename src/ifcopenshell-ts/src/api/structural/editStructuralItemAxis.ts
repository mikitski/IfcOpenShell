// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/edit_structural_item_axis.py`
// (src/ifcopenshell-python, 36 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). See
// `./editStructuralConnectionCs.ts`'s own header comment for why the `numpy`/
// `shape_builder` import is not a blocker -- `ifcSafeVectorType`/`VectorType`
// (`../../util/shapeBuilder.ts`) is reused directly here too.
//
// --- A real, disclosed, verbatim-preserved crash-on-unset-`Axis` quirk ---
//
// Unlike `./editStructuralConnectionCs.ts` (whose two removal guards are
// `if (current and get_total_inverses(current) == 1)`, short-circuiting BEFORE ever
// calling `get_total_inverses` on a falsy/`None` value), this function's single guard
// is `if file.get_total_inverses(axis_dir := structural_item.Axis) == 1:` -- calling
// `get_total_inverses` UNCONDITIONALLY on whatever `structural_item.Axis` currently
// is, with no truthy pre-check at all. `IfcStructuralCurveMember`/
// `IfcStructuralCurveConnection.Axis` is a mandatory EXPRESS attribute (confirmed
// against the generated `.d.ts`s: `Axis: IfcDirection`, no `| null`), but -- like any
// EXPRESS attribute -- is simply unset (`null`) on a freshly created instance until
// something actually assigns it (`api.root.createEntity` never touches `Axis`). So
// calling this function on a structural item whose `Axis` has never been set crashes:
// real Python's own native `get_total_inverses` binding requires a real
// `entity_instance` argument (confirmed: the identical native primitive
// `../../file.ts`'s own `getTotalInverses` delegates to,
// `this.nativeFile.get_total_inverses(inst.id())`, throws a plain JS `TypeError` --
// `Cannot read properties of null (reading 'id')` -- when `inst` is `null`; Python's
// own SWIG/pybind binding for the same native call rejects a `None` argument with an
// analogous `TypeError` too, for the same "no such overload" reason). Ported verbatim,
// NOT "fixed" with an added truthy guard that would diverge from real Python's own
// asymmetric behavior here: this function can only be used to REPLACE an
// already-populated `Axis`, never to populate one for the first time -- confirmed by
// this file's own dedicated regression test
// (`test/api/structural/editStructuralItemAxis.test.ts`).
//
// --- Real schema divergence: `Axis` doesn't exist on IFC2X3 either ---
//
// Confirmed against `ifc2x3.d.ts`: `IfcStructuralCurveMember`/
// `IfcStructuralCurveConnection` have no `Axis` attribute at all there -- IFC4 added
// it. So on IFC2X3 this function crashes for a DIFFERENT reason than the quirk above
// (a "no such attribute" error, not a `get_total_inverses(null)` `TypeError`) --
// either way, this function is IFC4+-only in practice, matching real Python exactly.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type VectorType, ifcSafeVectorType } from "../../util/shapeBuilder";
import { wrapUsecase } from "../hooks";

export interface EditStructuralItemAxisSettings {
	/** The `IfcStructuralItem` you want to modify. */
	structuralItem: EntityInstance;
	/**
	 * The unit Z axis vector defined as a list of 3 floats. Python default:
	 * `(0.0, 0.0, 1.0)`.
	 */
	axis?: VectorType;
}

function editStructuralItemAxisUsecase(file: IfcFile, settings: EditStructuralItemAxisSettings): void {
	const { structuralItem } = settings;
	const axis = settings.axis ?? [0.0, 0.0, 1.0];

	// Python: `if file.get_total_inverses(axis_dir := structural_item.Axis) == 1:` --
	// no truthy pre-check, ported verbatim (see this file's own header comment for the
	// resulting crash-on-unset-`Axis` quirk this preserves).
	const axisDir = structuralItem.get("Axis") as EntityInstance;
	if (file.getTotalInverses(axisDir) === 1) {
		file.remove(axisDir);
	}
	structuralItem.set("Axis", file.createEntity("IfcDirection", ifcSafeVectorType(axis)));
}

/**
 * Edits the coordinate system of a structural connection (Python:
 * `ifcopenshell.api.structural.edit_structural_item_axis`).
 */
export const editStructuralItemAxis = wrapUsecase(
	"structural.edit_structural_item_axis",
	editStructuralItemAxisUsecase,
);
