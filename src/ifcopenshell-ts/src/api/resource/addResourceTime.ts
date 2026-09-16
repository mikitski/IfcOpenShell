// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/add_resource_time.py` (src/ifcopenshell-python,
// 59 lines) -- part of this project's brand-new `api.resource` chunk (see
// `./index.ts`'s own header comment). Creates a bare `IfcResourceTime` and assigns it
// as `resource.Usage`. `IfcResourceTime` is IFC4+-only (absent from `ifc2x3.d.ts`
// entirely, confirmed by grep) -- real Python has no schema guard against calling this
// on IFC2X3, and neither does this port; `file.createEntity("IfcResourceTime")` throws
// naturally on IFC2X3 (an unregistered class name), matching real Python's own
// `entity_instance`-creation failure for the same reason. Not proactively guarded.
//
// Despite importing `ifcopenshell.util.date` at module level, real Python's own
// `add_resource_time` function body never actually calls anything from it -- confirmed
// by reading the whole 59-line source. This import is dead code in the real source
// (not reproduced here, since this port has no module-level side-effecting imports to
// preserve either way).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddResourceTimeSettings {
	/** The `IfcConstructionResource` to record time for. */
	resource: EntityInstance;
}

function addResourceTimeUsecase(file: IfcFile, settings: AddResourceTimeSettings): EntityInstance {
	const resourceTime = file.createEntity("IfcResourceTime");
	settings.resource.set("Usage", resourceTime);
	return resourceTime;
}

/**
 * Adds the time that a resource is used for (Python: `ifcopenshell.api.resource.add_resource_time`).
 *
 * For labour and equipment resources, the total duration that the resource is used for
 * may be stored. This may either be input manually or calculated parametrically. This
 * is known as the resource time, and may be used to calculate other parameters like
 * resource utilisation.
 *
 * @returns The newly created `IfcResourceTime`.
 *
 * @example
 * ```ts
 * const crew = api.resource.addResource(model, { ifcClass: "IfcCrewResource" });
 * const labour = api.resource.addResource(model, { parentResource: crew, ifcClass: "IfcLaborResource" });
 * // Let's imagine we've used the resource for 2 days.
 * const time = api.resource.addResourceTime(model, { resource: labour });
 * api.resource.editResourceTime(model, { resourceTime: time, attributes: { ScheduleWork: "PT16H" } });
 * ```
 */
export const addResourceTime = wrapUsecase("resource.add_resource_time", addResourceTimeUsecase);
