// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/structural/edit_structural_boundary_condition.py`
// (src/ifcopenshell-python, 53 lines) -- part of this project's brand-new
// `api.structural` chunk (see `./index.ts`'s own header comment). Unlike every other
// `edit_*` function in this module (plain `setattr` loop), this one's `attributes`
// dict is itself `{name: {type, value}}`-shaped -- each `IfcBoundaryCondition`
// stiffness attribute (`TranslationalStiffnessX`/etc.) is a SELECT type (confirmed
// against the generated `.d.ts`s: `unknown | null`, since the `.d.ts` generator can't
// flatten a SELECT into a concrete TS type), so the caller must say which concrete
// wrapped class (`"IfcBoolean"`, or a real measure class like
// `"IfcLinearStiffnessMeasure"`) each raw value should be boxed as -- or `"string"`/
// `"null"` for `Name`, which takes the raw value directly with no boxing at all.
//
// *** SEVENTH INDEPENDENT CONFIRMATION of a real, pre-existing, already-disclosed
// primitive-layer gap -- read this before anything else below. Ported completely and
// faithfully anyway (correct the moment the gap closes), per this project's own
// established precedent for this exact situation (see `TODOS.md`'s
// "`EntityInstance.setByIndex`/`IfcFile.createEntity` cannot write an initial value
// into a freshly created simple/defined-type instance" entry and its 6 prior
// "UPDATE"s), NOT silently worked around. ***
//
// Every branch of this function OTHER than `"string"`/`"null"` needs to build a
// freestanding, valued simple/defined-type instance -- `file.create_entity("IfcBoolean",
// data["value"])`, or `file.create_entity(data["type"], data["value"])` for any other
// measure class -- the exact same shape as `../unit/addConversionBasedUnit.ts`'s own
// `IfcMeasureWithUnit.ValueComponent` construction (READ THAT FILE'S HEADER COMMENT for
// the full empirical writeup: `file.createEntity("IfcReal", 0.3048)` throws immediately
// against this exact worktree's own built native addon, because `IfcFile.createEntity`/
// `EntityInstance.setByIndex` unconditionally call the native `attribute_kind_of`
// primitive on the TARGET instance to disambiguate the JS value's IFC kind, and that
// primitive's shim throws `"Attribute access is only supported on entity instances"`
// for ANY non-entity (simple/defined-type) target). Ported faithfully anyway: the
// `"string"`/`"null"` branch (a plain `.set()` with the raw value, never touching
// `createEntity`) is fully functional; the `"IfcBoolean"`/generic-class branches throw
// this same pre-existing error at the exact point real Python would materialize the
// value, with no proactive guard -- matching `editPset.ts`'s/`editSurfaceStyle.ts`'s
// own "let the native call fail naturally" precedent rather than introducing a new
// pattern. `test/api/structural/editStructuralBoundaryCondition.test.ts` pins this
// CURRENT, disclosed, blocked behavior with a dedicated test, and `TODOS.md`'s existing
// entry was updated with this as a further confirmed instance, not a new entry.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface StructuralBoundaryConditionAttributeValue {
	/**
	 * `"string"`/`"null"` take `value` directly with no boxing; any other value is
	 * treated as an IFC class name (e.g. `"IfcBoolean"`, or a real measure class like
	 * `"IfcLinearStiffnessMeasure"`) that `value` gets wrapped into via
	 * `file.createEntity(type, value)`.
	 */
	type: "string" | "null" | (string & {});
	value: unknown;
}

export interface EditStructuralBoundaryConditionSettings {
	/** The `IfcBoundaryCondition` entity you want to edit. */
	condition: EntityInstance;
	/** A dictionary of attribute names and `{type, value}` descriptors. */
	attributes: Record<string, StructuralBoundaryConditionAttributeValue>;
}

function editStructuralBoundaryConditionUsecase(
	file: IfcFile,
	settings: EditStructuralBoundaryConditionSettings,
): void {
	for (const [name, data] of Object.entries(settings.attributes)) {
		let value: unknown;
		if (data.type === "string" || data.type === "null") {
			value = data.value;
		} else if (data.type === "IfcBoolean") {
			// See this file's header comment -- blocked by the pre-existing
			// `attribute_kind_of` primitive-layer gap, thrown here, not proactively.
			value = file.createEntity("IfcBoolean", data.value);
		} else {
			// See this file's header comment -- blocked by the same gap for any other
			// measure class.
			value = file.createEntity(data.type, data.value);
		}
		settings.condition.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcBoundaryCondition` (Python:
 * `ifcopenshell.api.structural.edit_structural_boundary_condition`).
 *
 * For more information about the attributes and data types of an
 * `IfcBoundaryCondition`, consult the IFC documentation.
 */
export const editStructuralBoundaryCondition = wrapUsecase(
	"structural.edit_structural_boundary_condition",
	editStructuralBoundaryConditionUsecase,
);
