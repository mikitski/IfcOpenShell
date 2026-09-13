// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/unassign_unit.py` (src/ifcopenshell-python, 55
// lines). Unlike `removeUnit.ts` (which uses `util.unit.get_unit_assignment`, and so
// throws if the file has no `IfcProject` at all -- see that util function's own
// header comment), this function deliberately queries `file.by_type("IfcUnitAssignment")`
// directly, matching Python's own `file.by_type("IfcUnitAssignment")` -- a real,
// disclosed asymmetry in the Python source itself (not introduced by this port): this
// function is a graceful, project-agnostic no-op when there's no unit assignment at
// all, never throwing even if there's also no `IfcProject`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Local by-identity set, matching `aggregate/unassignObject.ts`'s own precedent. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	subtract(other: EntityInstanceSet): void {
		for (const [id] of this.byIdentity) {
			if (other.byIdentity.has(id)) this.byIdentity.delete(id);
		}
	}
	get size(): number {
		return this.byIdentity.size;
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface UnassignUnitSettings {
	/** A list of units to unassign as project defaults. */
	units?: readonly EntityInstance[];
}

function unassignUnitUsecase(file: IfcFile, settings: UnassignUnitSettings = {}): void {
	const unitAssignments = file.byType("IfcUnitAssignment");
	if (unitAssignments.length === 0) return;
	const unitAssignment = unitAssignments[0];

	const unitsSet = new EntityInstanceSet();
	unitsSet.update((unitAssignment.get("Units") as EntityInstance[] | null) ?? []);
	const toRemove = new EntityInstanceSet();
	toRemove.update(settings.units ?? []);
	unitsSet.subtract(toRemove);

	if (unitsSet.size > 0) {
		unitAssignment.set("Units", unitsSet.values());
		return;
	}
	file.remove(unitAssignment);
}

/**
 * Unassigns units as default units for the project (Python: `ifcopenshell.api.unit.unassign_unit`).
 *
 * @example
 * ```ts
 * // You need a project before you can assign units.
 * api.root.createEntity(model, { ifcClass: "IfcProject" });
 *
 * // Millimeters and square meters
 * const length = api.unit.addSiUnit(model, { unitType: "LENGTHUNIT", prefix: "MILLI" });
 * const area = api.unit.addSiUnit(model, { unitType: "AREAUNIT" });
 *
 * // Make it our default units, if we are doing a metric building
 * api.unit.assignUnit(model, { units: [length, area] });
 *
 * // Actually, we don't need areas.
 * api.unit.unassignUnit(model, { units: [area] });
 * ```
 */
export const unassignUnit = wrapUsecase("unit.unassign_unit", unassignUnitUsecase);
