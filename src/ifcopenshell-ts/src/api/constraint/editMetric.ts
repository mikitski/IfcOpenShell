// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/constraint/edit_metric.py` (src/ifcopenshell-python, 45
// lines) -- a trivial attribute-setter loop, matching `../classification/
// editClassification.ts`/`../group/editGroup.ts`/etc.'s identical shape verbatim (same
// underlying Python pattern: `for name, value in attributes.items(): setattr(metric,
// name, value)`). No `update_owner_history` call -- `IfcMetric` isn't even an `IfcRoot`
// subtype (see `./addMetric.ts`'s header comment), so it has no `OwnerHistory` to
// update in the first place.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditMetricSettings {
	/** The `IfcMetric` you want to edit. */
	metric: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editMetricUsecase(_file: IfcFile, settings: EditMetricSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.metric.set(name, value);
	}
}

/**
 * Edit the attributes of a metric (Python: `ifcopenshell.api.constraint.edit_metric`).
 *
 * For more information about the attributes and data types of an `IfcMetric`, consult
 * the IFC documentation.
 *
 * @example
 * ```ts
 * const objective = api.constraint.addObjective(model, {});
 * const metric = api.constraint.addMetric(model, { objective });
 * api.constraint.editMetric(model, { metric, attributes: { ConstraintGrade: "HARD" } });
 * ```
 */
export const editMetric = wrapUsecase("constraint.edit_metric", editMetricUsecase);
