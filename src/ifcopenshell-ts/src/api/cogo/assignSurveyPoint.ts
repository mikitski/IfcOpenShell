// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cogo/assign_survey_point.py` (src/ifcopenshell-python, 38
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope. No dependency beyond `ifcopenshell` itself (confirmed by reading the real
// source completely) -- a single, direct attribute reassignment, ported verbatim,
// no blocker of any kind.
//
// Not a usecase: takes an `entity_instance` directly (no `file` parameter at all),
// confirming it's a plain function, never routed through `ifcopenshell.api.run` --
// see `./addSurveyPoint.ts`'s own header comment for the same finding.
//
// UNBLOCKED (unlike `addSurveyPoint`/`editSurveyPoint`, its 2 module siblings): this
// function never reads `Dim` or `WorldCoordinateSystem` -- the 2 already-disclosed
// EXPRESS DERIVED-attribute gap consequences those 2 files each hit (see their own
// header comments) -- it's a single, direct, already-forward-attribute reassignment.
// Real Python's own test fixture builds its precondition via `add_survey_point`,
// which IS blocked in this port -- `assignSurveyPoint.test.ts` therefore builds its
// own fixture with raw `file.createEntity(...)` calls instead (reproducing the exact
// `IfcAnnotation`/`IfcProductDefinitionShape`/`IfcShapeRepresentation` shape
// `addSurveyPoint` itself would produce, minus the blocked `ObjectPlacement`/
// `PredefinedType` fields this function never reads), so this function's own real
// behavior gets a genuine passing test, not a "throws" pin -- see that file's own
// header comment.

import type { EntityInstance } from "../../entityInstance";

/**
 * Assigns a coordinate point to a survey point annotation (Python:
 * `ifcopenshell.api.cogo.assign_survey_point`).
 *
 * @param annotation The survey point annotation (an `IfcAnnotation`, as returned by
 *   `addSurveyPoint`).
 * @param surveyPoint The new coordinate point (an `IfcCartesianPoint`).
 *
 * @example
 * ```ts
 * const annotation = addSurveyPoint(file, file.createEntity("IfcCartesianPoint", [4000.0, 3500.0]));
 * assignSurveyPoint(annotation, file.createEntity("IfcCartesianPoint", [4000.0, 3500.0, 100.0]));
 * ```
 */
export function assignSurveyPoint(annotation: EntityInstance, surveyPoint: EntityInstance): void {
	const representation = annotation.get("Representation") as EntityInstance;
	const shapeRepresentation = (representation.get("Representations") as EntityInstance[])[0];
	shapeRepresentation.set("Items", [surveyPoint]);
}
