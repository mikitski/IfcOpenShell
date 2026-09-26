// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_footprint_representation.py`
// (src/ifcopenshell-python, 34 lines) -- part of this chunk's 8-file `api.geometry`
// addition (see `./index.ts`'s own header comment for the full chunk scope). Verified
// directly: this file's only import (`ifcopenshell.util.unit`) is a real, disclosed
// DEAD import in the real Python source -- grepped the whole file body for `unit.` and
// found no reference at all, so nothing from `util/unit.ts` is needed here.
//
// Builds a simple `"GeometricCurveSet"`-typed `IfcShapeRepresentation` wrapping the
// given curves in one `IfcGeometricCurveSet` -- typically used for a FootPrint
// representation (e.g. a building's roof outline as seen from above), though this
// function itself never validates `context`'s own `ContextIdentifier`/`ContextType`
// against `"FootPrint"`/`"Plan"` -- it just reuses `context.ContextIdentifier` verbatim
// as the new representation's own `RepresentationIdentifier`, whatever that happens to
// be, matching real Python's unconditional `context.ContextIdentifier` read exactly.
//
// `IfcShapeRepresentation(ContextOfItems, RepresentationIdentifier, RepresentationType,
// Items)` and `IfcGeometricCurveSet(Elements)` -- both confirmed flat, non-DERIVE,
// identical across all 3 schemas' generated `.d.ts`s (`IfcShapeRepresentation`'s own
// layout already verified by `./mapRepresentation.ts`'s own header comment;
// `IfcGeometricCurveSet` is a single aggregate-of-`IfcCurve|IfcPoint|IfcSurface`
// attribute, `Elements`, on every schema).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddFootprintRepresentationSettings {
	/** An `IfcGeometricRepresentationContext` (or subcontext) the new representation is created under. */
	context: EntityInstance;
	/** A list of IFC curves (`IfcCurve`/`IfcPoint`/`IfcSurface`) to include in the curve set. */
	curves: readonly EntityInstance[];
}

function addFootprintRepresentationUsecase(
	file: IfcFile,
	settings: AddFootprintRepresentationSettings,
): EntityInstance {
	const { context, curves } = settings;
	return file.createEntity(
		"IfcShapeRepresentation",
		context,
		context.get("ContextIdentifier") as string | null,
		"GeometricCurveSet",
		[file.createEntity("IfcGeometricCurveSet", curves)],
	);
}

/**
 * Adds a footprint (curve-based) representation (Python:
 * `ifcopenshell.api.geometry.add_footprint_representation`).
 *
 * Wraps `curves` in a single `IfcGeometricCurveSet` and returns a new
 * `"GeometricCurveSet"`-typed `IfcShapeRepresentation` under `context`. Does not assign
 * the new representation to any product -- use `api.geometry.assignRepresentation` for
 * that.
 */
export const addFootprintRepresentation = wrapUsecase(
	"geometry.add_footprint_representation",
	addFootprintRepresentationUsecase,
);
