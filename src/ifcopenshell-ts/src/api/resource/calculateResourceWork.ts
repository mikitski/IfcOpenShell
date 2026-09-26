// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/calculate_resource_work.py` (src/ifcopenshell-
// python, 61 lines) -- part of this project's brand-new `api.resource` chunk (see
// `./index.ts`'s own header comment). An "unofficial parametric calculation" (real
// Python's own docstring wording) built entirely on already-landed dependencies:
// `util.constraint.isAttributeLocked`, `util.resource.getResourceRequiredWork`, and
// this module's own `./addResourceTime.ts`. No unported dependency of any kind.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { isAttributeLocked } from "../../util/constraint";
import { getResourceRequiredWork } from "../../util/resource";
import { wrapUsecase } from "../hooks";
import { addResourceTime } from "./addResourceTime";

export interface CalculateResourceWorkSettings {
	/** The `IfcConstructionResource` to calculate the work performed for. */
	resource: EntityInstance;
}

function calculateResourceWorkUsecase(file: IfcFile, settings: CalculateResourceWorkSettings): void {
	const { resource } = settings;
	if (isAttributeLocked(resource, "Usage.ScheduleWork")) return;

	const amountWorked = getResourceRequiredWork(resource);
	if (!amountWorked) return;

	if (!resource.get("Usage")) {
		addResourceTime(file, { resource });
	}
	(resource.get("Usage") as EntityInstance).set("ScheduleWork", amountWorked);
}

/**
 * Calculates the work that a resource is used for (Python: `ifcopenshell.api.resource.calculate_resource_work`).
 *
 * This is an unofficial parametric calculation that may be done on a resource based on
 * careful analysis of the relationships between the costing, scheduling, and resource
 * domains in IFC.
 *
 * A resource may store a productivity rate in a property set called
 * `EPset_Productivity`. This stores three properties:
 *
 * - `BaseQuantityConsumed` -- a duration that the resource is consumed for.
 * - `BaseQuantityProducedName` -- what quantity the resource can produce, such as area
 *   or volume.
 * - `BaseQuantityProducedValue` -- what value of that quantity the resource can produce
 *   during that duration.
 *
 * For example, a labour or equipment resource might produce 100m3 of `NetVolume` every
 * day (i.e. 8 hours are consumed).
 *
 * Then, if a resource is assigned to a construction task, and that construction task is
 * assigned to concrete slabs totalling 200m3, we can calculate that the resource
 * consumes 16 hours of work.
 *
 * This calculated work is stored against the resource as scheduled work under the
 * resource time data.
 */
export const calculateResourceWork = wrapUsecase("resource.calculate_resource_work", calculateResourceWorkUsecase);
