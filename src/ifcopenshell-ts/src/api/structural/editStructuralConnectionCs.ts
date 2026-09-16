// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/edit_structural_connection_cs.py`
// (src/ifcopenshell-python, 48 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment).
//
// --- The `numpy`/`shape_builder` import is NOT a blocker -- confirmed, not assumed ---
//
// Real Python imports `VectorType`/`ifc_safe_vector_type` from
// `ifcopenshell.util.shape_builder`. Read that real source directly
// (`ifcopenshell/util/shape_builder.py`): `ifc_safe_vector_type` is a trivial helper
// (`np.array(v, dtype="d").tolist()`) that just converts every number in a plain
// `(x, y, z)`-shaped tuple to a plain float -- no real numpy matrix/vector math. This
// project already has a direct TS port of exactly this helper --
// `../../util/shapeBuilder.ts`'s own `ifcSafeVectorType`/`VectorType` (landed in an
// earlier chunk, doc comment: "Convert vector / sequence of vectors to a plain
// (possibly nested) float array that's safe to save as an IFC attribute value") --
// reused here directly rather than reinvented, exactly the same helper real Python
// calls, not a new one.
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcCartesianPoint`: `Coordinates` only (index 0), an array of floats -- matches
// real Python's `file.createIfcCartesianPoint((0.0, 0.0, 0.0))` shortcut, ported as
// the direct `file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0])` equivalent (no
// `createIfcCartesianPoint`-style generated shortcut exists in this port, matching
// `../context/addContext.ts`'s own established convention for the same class).
// `IfcAxis2Placement3D`: `Location`/`Axis`/`RefDirection`, identical order across all
// 3 schemas -- matches real Python's `file.createIfcAxis2Placement3D(point, None,
// None)`, ported as `file.createEntity("IfcAxis2Placement3D", point, null, null)`.
// `IfcDirection`: `DirectionRatios` only (index 0), an array of floats.
//
// Real Python's two removal guards (`if (current_axis := ccs.Axis) and
// file.get_total_inverses(current_axis) == 1`) BOTH short-circuit on a falsy/`None`
// existing value before ever calling `get_total_inverses` -- unlike
// `./editStructuralItemAxis.ts`'s own sibling function, which has no such truthy
// pre-check (see that file's own header comment for the resulting, disclosed
// asymmetric crash-on-unset-attribute quirk). Ported verbatim: this function is safe
// to call even on a structural item whose `ConditionCoordinateSystem`/`Axis`/
// `RefDirection` have never been set before.
//
// --- Real schema divergence: `ConditionCoordinateSystem` doesn't exist on IFC2X3 ---
//
// Confirmed against `ifc2x3.d.ts`: `IfcStructuralPointConnection` (and every other
// `IfcStructuralConnection` subtype) has no `ConditionCoordinateSystem` attribute at
// all there -- IFC4 added it. Real Python's own unguarded
// `structural_item.ConditionCoordinateSystem` attribute access would raise the same
// `AttributeError` on IFC2X3 -- this function is IFC4+-only in practice, matching real
// Python exactly (no IFC2X3-specific branch exists in real Python either).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type VectorType, ifcSafeVectorType } from "../../util/shapeBuilder";
import { wrapUsecase } from "../hooks";

export interface EditStructuralConnectionCsSettings {
	/** The `IfcStructuralItem` you want to modify. */
	structuralItem: EntityInstance;
	/**
	 * The unit Z axis vector defined as a list of 3 floats. Python default:
	 * `(0.0, 0.0, 1.0)`.
	 */
	axis?: VectorType;
	/**
	 * The unit X axis vector defined as a list of 3 floats. Python default:
	 * `(1.0, 0.0, 0.0)`.
	 */
	refDirection?: VectorType;
}

function editStructuralConnectionCsUsecase(file: IfcFile, settings: EditStructuralConnectionCsSettings): void {
	const { structuralItem } = settings;
	const axis = settings.axis ?? [0.0, 0.0, 1.0];
	const refDirection = settings.refDirection ?? [1.0, 0.0, 0.0];

	if (!structuralItem.get("ConditionCoordinateSystem")) {
		const point = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
		const ccs = file.createEntity("IfcAxis2Placement3D", point, null, null);
		structuralItem.set("ConditionCoordinateSystem", ccs);
	}

	const ccs = structuralItem.get("ConditionCoordinateSystem") as EntityInstance;
	const currentAxis = ccs.get("Axis") as EntityInstance | null;
	if (currentAxis && file.getTotalInverses(currentAxis) === 1) {
		file.remove(currentAxis);
	}
	ccs.set("Axis", file.createEntity("IfcDirection", ifcSafeVectorType(axis)));

	const prevRefDirection = ccs.get("RefDirection") as EntityInstance | null;
	if (prevRefDirection && file.getTotalInverses(prevRefDirection) === 1) {
		file.remove(prevRefDirection);
	}
	ccs.set("RefDirection", file.createEntity("IfcDirection", ifcSafeVectorType(refDirection)));
}

/**
 * Edits the coordinate system of a structural connection (Python:
 * `ifcopenshell.api.structural.edit_structural_connection_cs`).
 */
export const editStructuralConnectionCs = wrapUsecase(
	"structural.edit_structural_connection_cs",
	editStructuralConnectionCsUsecase,
);
