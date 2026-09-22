// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cogo/edit_survey_point.py` (src/ifcopenshell-python, 40
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope. No dependency beyond `ifcopenshell` itself.
//
// Not a usecase: takes an `entity_instance` directly (no `file` parameter at all) --
// see `./addSurveyPoint.ts`'s own header comment for the same finding, applied here.
//
// --- UPDATE (Phase EX-2's first chunk, planning/ifcopenshell-ts/
//     70-express-rules-plan.md): the DERIVED-attribute gap below is now closed FOR
//     `IfcCartesianPoint.Dim` SPECIFICALLY (IFC2X3 only so far) ---
//
// Real Python's FIRST line reads `annotation.Representation.Representations[0]
// .Items[0].Dim`. `IfcCartesianPoint.Dim` is a real EXPRESS DERIVED attribute
// (`DERIVE Dim : IfcDimensionCount := HIINDEX(Coordinates)`, confirmed by reading
// `ifcopenshell.express.rules.IFC4X3`'s own compiled
// `calc_IfcCartesianPoint_Dim(self): return hiindex(express_getattr(self,
// 'Coordinates', ...))` directly) -- computed by real Python's `entity_instance
// .__getattr__`'s DERIVED-category branch, which imports and calls into the
// schema's own compiled `ifcopenshell.express.rules.<schema>` module.
//
// This TS port's `EntityInstance.get()` previously had NO DERIVED-category fallback at
// all -- a pre-existing, disclosed, cross-cutting `entityInstance.ts` gap (`TODOS.md`'s
// "`.get("Dim")` unconditionally throws for any entity" family of entries, first
// surfaced by `util.representation.guessType`'s `Curve2D`/`Curve3D`/`Surface2D`/
// `Surface3D` branches). Phase EX-2's first chunk ported `calc_IfcCartesianPoint_Dim`
// (among 14 other `calc_*` DERIVE functions) and wired the dispatch mechanism into
// `EntityInstance.get()` (`src/express/dispatch.ts`/`src/express/rules/ifc2x3.ts`) --
// `Dim` now resolves correctly for any `IfcCartesianPoint` in an IFC2X3 file, so this
// function's own first statement (reading `Items[0].Dim`) now succeeds on IFC2X3.
// Still throws for IFC4/IFC4X3 until a future chunk ports the identical formula for
// those schemas too (same plan doc, IFC2X3-first sequencing) -- and several OTHER
// callers this gap's own `TODOS.md` entry lists (`util/shapeBuilder.ts`'s
// `.profile()`/`createSweptDiskSolid()`, several `api.geometry` files) may depend on
// `Dim`/other DERIVE attributes on entity types this chunk did NOT port (e.g. solids/
// curves/surfaces, not `IfcCartesianPoint`) and remain blocked -- this is a narrow,
// additive fix for this one function's own specific dependency, not a general claim
// that the whole gap family is closed.
//
// Note: `addSurveyPoint` (this module's own fixture-building sibling, and real
// Python's own test fixture builder) remains blocked by the SAME general kind of gap,
// via a DIFFERENT derived attribute this chunk does not port
// (`IfcGeometricRepresentationSubContext.WorldCoordinateSystem`, not `Dim` -- see
// `addSurveyPoint.ts`'s own header comment, unchanged), so `editSurveyPoint.test.ts`
// still cannot reach `editSurveyPoint` via `addSurveyPoint` -- its own fixture is still
// built with raw `file.createEntity(...)` calls instead.

import type { EntityInstance } from "../../entityInstance";

/**
 * Edits the location of a previously defined survey point (Python:
 * `ifcopenshell.api.cogo.edit_survey_point`).
 *
 * Works on IFC2X3 (`IfcCartesianPoint.Dim` is ported there, Phase EX-2's first chunk);
 * still throws on IFC4/IFC4X3 until a future chunk ports the same DERIVE formula for
 * those schemas too -- see this file's own header comment.
 *
 * @param annotation The survey point annotation (an `IfcAnnotation`, as returned by
 *   `addSurveyPoint`).
 * @param x The new X coordinate.
 * @param y The new Y coordinate.
 * @param z The new Z coordinate (only used if the existing point is 3D). Defaults to `0.0`.
 *
 * @example
 * ```ts
 * const annotation = addSurveyPoint(file, file.createEntity("IfcCartesianPoint", [4000.0, 3500.0]));
 * editSurveyPoint(annotation, 3500.0, 2000.0);
 * ```
 */
export function editSurveyPoint(annotation: EntityInstance, x: number, y: number, z = 0.0): void {
	const representation = annotation.get("Representation") as EntityInstance;
	const shapeRepresentation = (representation.get("Representations") as EntityInstance[])[0];
	const item = (shapeRepresentation.get("Items") as EntityInstance[])[0];

	if ((item.get("Dim") as number) === 2) {
		item.set("Coordinates", [x, y]);
	} else {
		item.set("Coordinates", [x, y, z]);
	}
}
