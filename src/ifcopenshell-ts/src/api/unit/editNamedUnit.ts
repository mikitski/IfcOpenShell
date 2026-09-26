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
// two have `Dimensions` as a real, explicit, directly-STORED attribute
// (`addSiUnit.ts`'s header comment: `IfcSIUnit` re-declares `Dimensions` as `DERIVE`).
//
// **UPDATE (Phase EX-2's IFC2X3 chunk 5, `planning/ifcopenshell-ts/70-express-rules-
// plan.md` §4, `src/express/rules/ifc2x3.ts`): this paragraph's own prior claim --
// "`.get("Dimensions")`/`.set("Dimensions", ...)` on an `IfcSIUnit` instance throws
// 'has no attribute'" -- is now WRONG for IFC2X3 specifically**, once
// `calc_IfcSIUnit_Dimensions` landed and made IFC2X3 the first schema with a fully
// ported DERIVE-dispatch table (IFC4/IFC4X3 have no `rules/ifc4.ts`/`rules/ifc4x3.ts`
// module yet, so `.get("Dimensions")` on those schemas still throws exactly as
// before). Re-verified by direct reproduction (not assumed) that this branch does NOT
// silently corrupt or crash for an `IfcSIUnit` on IFC2X3, but it also does NOT
// actually edit anything real: `unit.get("Dimensions")` at line 54 now resolves via
// DERIVE dispatch to a FRESH `IfcDimensionalExponents` entity constructed in
// `rules/ifc2x3.ts`'s own private, never-cleared, per-process singleton scratch file
// (see that file's own "unbounded growth" doc comment) -- a real entity, but one that
// does NOT belong to `file` (this function's own `file` parameter) at all, and a NEW
// one is minted on every single `.get("Dimensions")` call (confirmed: calling it twice
// in a row returns 2 different instance ids). `file.getTotalInverses(dimensions)` at
// line 56 then looks up `file`'s OWN instance table using that foreign, scratch-file
// id number (`IfcFile.getTotalInverses` -- and real Python's own SWIG `get_total_
// inverses(const express::base&)`, `src/ifcwrap/IfcParseWrapper.i` -- both take only a
// raw `int` id, with no file-identity check at all, confirmed directly against both
// this port's binding and the real C++ source, `src/ifcparse/file.h`/`parse.cpp`) --
// so this is a genuine, PRE-EXISTING real-Python architectural hazard (the identical
// per-schema global scratch-model pattern this port's own `ifcDirection`/`ifcVector`
// helpers already document as ported faithfully, not a new one this port introduces),
// not something specific to this port. In every case actually reachable in this
// project's own test fixtures the scratch file's id happens not to collide with any
// real id in the (small) test file, so `getTotalInverses` reads back `0`
// (`<= 1`), taking the "mutate in place" branch -- which mutates the DISPOSABLE
// scratch instance itself (line 60), never `file`'s own data, so the edit is a silent
// no-op observable through the real unit's own attribute-read path (each subsequent
// `.get("Dimensions")` mints yet another fresh scratch instance with the ORIGINAL
// computed value, unaffected by the discarded mutation). A large enough real file (or
// a long-running process that has driven the scratch file's own id counter high
// enough) could instead see `getTotalInverses` return a WRONG, unrelated count for
// whatever real entity happens to share that numeric id -- deliberately NOT guarded
// against here, matching this project's "preserve a real, verbatim, upstream-shaped
// quirk rather than silently paper over it" convention, since real Python has the
// exact same latent hazard and (confirmed directly) never exercises this exact
// combination in its own test suite either (`test_edit_named_unit.py::
// test_edit_si_unit` still only covers `UnitType`/`Prefix`/`Name`, unchanged). See
// `test/api/unit/editNamedUnit.test.ts`'s own dedicated regression test for the
// current, pinned, silent-no-op behavior on IFC2X3, and the still-throws behavior on
// IFC4/IFC4X3 pending their own future EX-2 chunks.
//
// Real Python's own `test_edit_named_unit.py::test_edit_si_unit` never exercises the
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
