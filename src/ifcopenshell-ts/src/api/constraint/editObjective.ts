// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/constraint/edit_objective.py` (src/ifcopenshell-python, 45
// lines) -- a trivial attribute-setter loop, identical in shape to `./editMetric.ts`
// (see that file's header comment for the shared rationale). No `update_owner_history`
// call -- `IfcObjective` isn't an `IfcRoot` subtype either.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditObjectiveSettings {
	/** The `IfcObjective` you want to edit. */
	objective: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editObjectiveUsecase(_file: IfcFile, settings: EditObjectiveSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.objective.set(name, value);
	}
}

/**
 * Edit the attributes of an objective (Python:
 * `ifcopenshell.api.constraint.edit_objective`).
 *
 * For more information about the attributes and data types of an `IfcObjective`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const objective = api.constraint.addObjective(model, {});
 * api.constraint.editObjective(model, { objective, attributes: { ConstraintGrade: "HARD" } });
 * ```
 */
export const editObjective = wrapUsecase("constraint.edit_objective", editObjectiveUsecase);
