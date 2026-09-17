// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cogo/edit_survey_point.py` (src/ifcopenshell-python, 40
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope. No dependency beyond `ifcopenshell` itself.
//
// Not a usecase: takes an `entity_instance` directly (no `file` parameter at all) --
// see `./addSurveyPoint.ts`'s own header comment for the same finding, applied here.
//
// --- BLOCKED by the pre-existing, already-disclosed `entityInstance.ts` EXPRESS
//     DERIVED-attribute gap: `.get("Dim")` always throws ---
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
// This TS port's `EntityInstance.get()` has NO DERIVED-category fallback at all -- a
// pre-existing, already-disclosed, cross-cutting `entityInstance.ts` gap (see
// `TODOS.md`'s "`.get("Dim")` unconditionally throws for any entity" family of
// entries, first surfaced by `util.representation.guessType`'s `Curve2D`/`Curve3D`/
// `Surface2D`/`Surface3D` branches and since hit by `util/shapeBuilder.ts`'s
// `.profile()`/`createSweptDiskSolid()` and several `api.geometry` files). This means
// `editSurveyPoint`'s very first statement -- reading `Items[0].Dim` -- throws on
// EVERY invocation, on every schema, today. Ported completely and faithfully anyway
// (both branches, `Coordinates = (x, y)` vs. `(x, y, z)`), matching this project's
// established "port everything, throw a clear loud error only at the exact point
// actually needed, never proactively guard around a foundational gap" discipline --
// NOT reimplemented as a narrow `Coordinates.length` shortcut, even though that would
// happen to produce the same numeric answer for this one entity class, since the
// task's own required process is to surface the real gap via the real (already
// clear) `.get()` error, not to quietly paper over it. See `TODOS.md`'s newly added
// entry (cross-referencing the existing family) for the full writeup.
//
// Note: `addSurveyPoint` (this module's own fixture-building sibling, and real
// Python's own test fixture builder) is ALSO blocked by this SAME foundational gap,
// via a DIFFERENT derived attribute (`IfcGeometricRepresentationSubContext
// .WorldCoordinateSystem`, not `Dim` -- see `addSurveyPoint.ts`'s own header
// comment), so `editSurveyPoint.test.ts` cannot reach `editSurveyPoint` via
// `addSurveyPoint` at all -- its own fixture is built with raw `file.createEntity(...)`
// calls instead, specifically to exercise THIS file's own `Dim` throw (not
// `addSurveyPoint`'s different, earlier one).

import type { EntityInstance } from "../../entityInstance";

/**
 * Edits the location of a previously defined survey point (Python:
 * `ifcopenshell.api.cogo.edit_survey_point`).
 *
 * BLOCKED today: this function's first statement reads a real EXPRESS DERIVED
 * attribute (`IfcCartesianPoint.Dim`) that this port's `EntityInstance.get()` cannot
 * resolve -- see this file's own header comment. Always throws.
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
