// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/unit/edit_named_unit.py` (src/ifcopenshell-python, 55
// lines). Named units include SI units, conversion based units (imperial units), and
// context dependent units -- i.e. any `IfcNamedUnit` subtype.
//
// One real branch, ported verbatim: editing the `"Dimensions"` key is special-cased.
// `unit.Dimensions` is fetched; if it has more than one inverse reference
// (`file.get_total_inverses(dimensions) > 1`, i.e. shared with another unit), a brand
// new `IfcDimensionalExponents` is created and assigned wholesale (copy-on-write, so
// the shared original isn't mutated out from under the other unit); otherwise the
// existing `IfcDimensionalExponents` instance is mutated in place, index by index
// (`dimensions[i] = exponent` in Python, `dimensions.setByIndex(i, exponent)` here).
//
// `IfcDimensionalExponents` is a genuine ENTITY (not a bare simple/defined-type
// value like `IfcReal` -- see `addConversionBasedUnit.ts`'s own disclosed gap): its 7
// `*Exponent` attributes are ordinary forward `INTEGER` attributes on a real entity
// instance, confirmed empirically (`attributeCount()` reports 7, matching
// `src/generated/ifc4.d.ts`'s `IfcDimensionalExponents` interface exactly, and
// `setByIndex` on one succeeds -- unaffected by the entity-only `attribute_kind_of`
// gate `addConversionBasedUnit.ts` hits for `IfcReal`). This branch works, unblocked.
//
// This function is meant to be called on `IfcSIUnit`/`IfcConversionBasedUnit`/
// `IfcConversionBasedUnitWithOffset`/`IfcContextDependentUnit` -- but only the latter
// two have `Dimensions` as a real, explicit, gettable/settable attribute
// (`addSiUnit.ts`'s header comment: `IfcSIUnit` re-declares `Dimensions` as `DERIVE`,
// so `.get("Dimensions")`/`.set("Dimensions", ...)` on an `IfcSIUnit` instance throws
// "has no attribute" -- the same, already-disclosed, project-wide derived-attribute
// gap `entityInstance.ts`'s own header comment documents, not a new one). Real
// Python's own `test_edit_named_unit.py::test_edit_si_unit` never exercises the
// `"Dimensions"` key against an `IfcSIUnit` either -- only `UnitType`/`Prefix`/`Name`
// -- so this isn't a gap this chunk's own test coverage needs to route around; ported
// here purely for completeness/disclosure.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditNamedUnitSettings {
	/** The `IfcNamedUnit` entity you want to edit. */
	unit: EntityInstance;
	/**
	 * A dictionary of attribute names and values (Python: `dict[str, Any]`). A
	 * `"Dimensions"` value is a 7-tuple of integer exponents (see this file's header
	 * comment for the special handling this key gets).
	 */
	attributes: Record<string, unknown>;
}

function editNamedUnitUsecase(file: IfcFile, settings: EditNamedUnitSettings): void {
	const { unit } = settings;
	for (const [name, value] of Object.entries(settings.attributes)) {
		if (name === "Dimensions") {
			const dimensions = unit.get("Dimensions") as EntityInstance;
			const exponents = value as readonly number[];
			if (file.getTotalInverses(dimensions) > 1) {
				unit.set("Dimensions", file.createEntity("IfcDimensionalExponents", ...exponents));
			} else {
				exponents.forEach((exponent, i) => {
					dimensions.setByIndex(i, exponent);
				});
			}
			continue;
		}
		unit.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcNamedUnit` (Python: `ifcopenshell.api.unit.edit_named_unit`).
 *
 * Named units include SI units, conversion based units (imperial units), and context
 * dependent units.
 *
 * For more information about the attributes and data types of an `IfcNamedUnit`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * // Boxes of things
 * const unit = api.unit.addContextDependentUnit(model, { name: "BOXES" });
 *
 * // Uh, crates? Boxes? Whatever.
 * api.unit.editNamedUnit(model, { unit, attributes: { Name: "CRATES" } });
 * ```
 */
export const editNamedUnit = wrapUsecase("unit.edit_named_unit", editNamedUnitUsecase);
