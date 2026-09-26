// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/edit_cost_value.py` (src/ifcopenshell-python, 64
// lines) -- part of this project's brand-new `api.cost` chunk (see `./index.ts`'s own
// header comment). A per-attribute `setattr` loop like `./editCostItem.ts`'s, but with
// two special-cased attribute names:
//
// - `AppliedValue` (when not `null`/`undefined`/falsy... actually: Python's own guard
//   is `value is not None`, so a falsy-but-non-`None` value like `0` STILL gets
//   wrapped): wrapped into a real `IfcMonetaryMeasure` via `file.createIfcMonetaryMeasure
//   (value)` -- this port's equivalent, per `../structural/editStructuralConnectionCs
//   .ts`'s own established convention for a real Python `createIfcXxx(...)` shortcut
//   with no dedicated TS shortcut method: `file.createEntity("IfcMonetaryMeasure",
//   value)`.
// - `UnitBasis`: replaces the whole `IfcMeasureWithUnit` wrapper entity. If a new value
//   is supplied (`{ValueComponent, UnitComponent}`), a fresh `<UnitType>Measure`-typed
//   simple instance is built via the already-landed `util.unit.getUnitMeasureClass`,
//   then wrapped in a new `IfcMeasureWithUnit`. Either way, any PREVIOUS `UnitBasis`
//   entity is deep-purged via `util.element.removeDeep2` -- called BEFORE the final
//   `setattr` that actually replaces/clears the attribute (ported in that exact order,
//   matching real Python's own `if old_unit_basis: remove_deep2(...)` placement, which
//   runs while `cost_value.UnitBasis` STILL forward-references the old entity). This
//   is the same "remove while still referenced" call shape `../pset/editPset.ts`'s own
//   `EnumerationReference`-replacement branch already establishes as precedent in this
//   codebase (line ~695 of that file) -- `removeDeep2`'s own `alsoConsider`-less default
//   call requires the target to have ZERO live forward references to actually delete
//   anything (see `util/element.ts`'s own `removeDeep2` doc comment), so this call is a
//   likely no-op in practice (the old `UnitBasis` stays orphaned in the file rather
//   than being purged) -- ported byte-for-byte anyway, not "fixed" with an
//   `alsoConsider` workaround, matching this project's near-verbatim-port mandate and
//   the identical precedent already accepted in `editPset.ts`. Neither of the real
//   Python tests for this function (`test_edit_cost_value.py`) actually asserts the old
//   entity was purged from the file (only that the NEW `UnitBasis` differs by id), so
//   this doesn't affect observable, test-covered behavior either way.
//
// --- BLOCKED (disclosed, confirmed empirically): BOTH special-cased branches above
//     hit the already 6-times-confirmed `TODOS.md` primitive-layer gap
//     ("EntityInstance.setByIndex/IfcFile.createEntity cannot write an initial value
//     into a freshly created simple/defined-type instance") ---
//
// `file.createEntity("IfcMonetaryMeasure", value)` (the `AppliedValue` branch) and
// `file.createEntity(measureClass, unitBasis.ValueComponent)` (the `UnitBasis` branch)
// both construct a BRAND-NEW simple/defined-type instance WITH an initial positional
// value -- confirmed empirically against this exact worktree's own built native addon
// (this chunk's own `editCostValue.test.ts` hit this directly while writing tests, not
// assumed): `IfcFile.createEntityImpl`'s own initial-attribute-assignment loop calls
// `EntityInstance.setByIndex`, which calls the native `attribute_kind_of` primitive on
// the freshly-created (non-`IfcRoot`, non-entity -- a simple/defined-type) target
// instance itself, and that primitive unconditionally throws `"Attribute access is
// only supported on entity instances"` for such a target, populated or not. This is
// the SAME gate `TODOS.md`'s entry already documents 6 times over (`util.migrator`,
// `util.cost`'s own undo/redo replay path, `api.owner.addApplication`, `api.pset
// .editPset`, `api.style.editSurfaceStyle`, `api.pset_template.editPropTemplate`) --
// this chunk is (at least) a SEVENTH confirmed instance, added as a further `UPDATE`
// to that SAME entry in `TODOS.md`, not a new one. Ported completely and faithfully
// anyway, throwing only at the exact point a standalone typed value would need to be
// built -- every OTHER attribute (a plain string/number/entity assignment needing no
// wrapping) works completely correctly today. `editCostValue.test.ts` pins this
// CURRENT, disclosed, blocked behavior with dedicated tests for both branches (matching
// `editPset.test.ts`'s own established precedent), not silently skipped -- each with a
// comment recording the real, unblocked assertion to restore once this gap closes.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { getUnitMeasureClass } from "../../util/unit";
import { wrapUsecase } from "../hooks";

export interface EditCostValueSettings {
	/** The `IfcCostValue` entity you want to edit. */
	costValue: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editCostValueUsecase(file: IfcFile, settings: EditCostValueSettings): void {
	const { costValue } = settings;

	for (const [name, rawValue] of Object.entries(settings.attributes)) {
		let value: unknown = rawValue;

		if (name === "AppliedValue" && value !== null && value !== undefined) {
			// TODO: support all applied value select types (Python's own inline TODO).
			value = file.createEntity("IfcMonetaryMeasure", value);
		} else if (name === "UnitBasis") {
			const oldUnitBasis = costValue.get("UnitBasis") as EntityInstance | null;
			if (value) {
				const unitBasis = value as { ValueComponent: number; UnitComponent: EntityInstance };
				const measureClass = getUnitMeasureClass(unitBasis.UnitComponent.get("UnitType") as string);
				const valueComponent = file.createEntity(measureClass, unitBasis.ValueComponent);
				value = file.createEntity("IfcMeasureWithUnit", valueComponent, unitBasis.UnitComponent);
			}
			if (oldUnitBasis) elementUtil.removeDeep2(file, oldUnitBasis);
		}
		costValue.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcCostValue` (Python: `ifcopenshell.api.cost.edit_cost_value`).
 *
 * For more information about the attributes and data types of an `IfcCostValue`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 *
 * // This cost item will have a total cost of 42.
 * const value = api.cost.addCostValue(model, { parent: item });
 * api.cost.editCostValue(model, { costValue: value, attributes: { AppliedValue: 42.0 } });
 * ```
 */
export const editCostValue = wrapUsecase("cost.edit_cost_value", editCostValueUsecase);
