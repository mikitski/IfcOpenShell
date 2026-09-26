// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/remove_unit.py` (src/ifcopenshell-python, 51 lines).
// Uses `util.unit.getUnitAssignment` (unlike `unassignUnit.ts`, which deliberately
// uses a raw `file.byType("IfcUnitAssignment")` query instead -- see that file's own
// header comment for the real, disclosed asymmetry already present in the Python
// source itself), so this function throws if the file has no `IfcProject` at all,
// matching `util/unit.ts`'s own `getUnitAssignment` doc comment (a malformed-file
// condition, not the same as "a real project with no units assigned yet").
//
// `unit in unit_assignment.Units` / `units.remove(unit)` are both identity-based
// membership operations in real Python (`entity_instance.__eq__` compares underlying
// STEP identity, not JS-wrapper `===`) -- ported here via `EntityInstance.identity()`
// comparisons, matching this project's established `EntityInstanceSet`-by-identity
// idiom. `list.remove(unit)` removes only the *first* matching occurrence; reproduced
// exactly (not simplified to "filter out every match") in case a caller ever manages
// to get the same unit listed twice (not expected in practice, but not assumed away
// either).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { getUnitAssignment } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface RemoveUnitSettings {
	/** The unit element to remove. */
	unit: EntityInstance;
}

function removeUnitUsecase(file: IfcFile, settings: RemoveUnitSettings): void {
	const { unit } = settings;
	const unitAssignment = getUnitAssignment(file);
	if (unitAssignment) {
		const units = (unitAssignment.get("Units") as EntityInstance[] | null) ?? [];
		const index = units.findIndex((u) => u.identity() === unit.identity());
		if (index !== -1) {
			const remaining = [...units.slice(0, index), ...units.slice(index + 1)];
			if (remaining.length > 0) {
				unitAssignment.set("Units", remaining);
			} else {
				file.remove(unitAssignment);
			}
		}
	}
	// TODO handle other possible unit inverses (Python's own comment, ported verbatim).
	elementUtil.removeDeep2(file, unit);
}

/**
 * Remove a unit (Python: `ifcopenshell.api.unit.remove_unit`).
 *
 * Be very careful when a unit is removed, as it may mean that previously defined
 * quantities in the model completely lose their meaning.
 *
 * @example
 * ```ts
 * // What?
 * const unit = api.unit.addContextDependentUnit(model, { name: "HANDFULS" });
 *
 * // Yeah maybe not.
 * api.unit.removeUnit(model, { unit });
 * ```
 */
export const removeUnit = wrapUsecase("unit.remove_unit", removeUnitUsecase);
