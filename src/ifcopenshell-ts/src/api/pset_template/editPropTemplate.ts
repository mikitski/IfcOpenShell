// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset_template/edit_prop_template.py` (src/ifcopenshell-
// python, 66 lines) -- part of this project's `api.pset_template` chunk (see
// `./index.ts`'s own header comment). Mostly a plain attribute-setter loop (matching
// `../classification/editClassification.ts`'s established shape), but with one special
// case: an `"Enumerators"` key in `attributes` isn't a plain attribute value -- it's a
// list of RAW values (e.g. `["FOO", "BAR"]`) that need wrapping into typed IFC value
// entities (e.g. `IfcLabel("FOO")`) and an `IfcPropertyEnumeration` container before
// they can be assigned to `prop_template.Enumerators`.
//
// --- The `Enumerators` special case, ported verbatim ---
//
// Real Python: `if enum_values := attributes.get("Enumerators", None):` -- the walrus
// only enters this branch if the VALUE is truthy, not merely if the KEY is present.
// Passing `attributes={"Enumerators": []}` (an empty list -- falsy) SKIPS this whole
// block entirely, leaving `prop_template.Enumerators` untouched (not cleared to
// `None`/empty) -- ported verbatim via `enumValuesRaw && enumValuesRaw.length > 0`, not
// "fixed" to also handle the empty-list-means-clear case. Inside the block:
// `prop_name`/`primary_measure_type` each resolve via a `x or y or z` OR-chain
// (`attributes.get("Name", None) or getattr(prop_template, "Name", None) or "Unnamed"`)
// -- Python's `or` treats an empty string as falsy too, so an explicitly-passed empty
// `Name`/`PrimaryMeasureType` falls through to the next fallback exactly like `None`
// would, not treated as "explicitly cleared". Ported via `firstTruthy` below, matching
// that exact falsy-skips-forward semantics (not a plain `??` null-coalescing chain,
// which would treat `""` as a valid, non-skipped value).
//
// If `prop_template.Enumerators` already exists, it's mutated in place (`Name`/
// `EnumerationValues` overwritten) rather than replaced with a new
// `IfcPropertyEnumeration` -- so an enumeration shared by more than one property
// template (via `file.get_inverse`, not exercised here) would have ALL its sharers'
// enumerators overwritten together, matching real Python's own unguarded shared-mutation
// shape (no copy-on-write check the way `../owner/updateOwnerHistory.ts`'s own
// `OwnerHistory` handling has) -- not something this port introduces.
//
// --- Real, disclosed Python quirk: the CALLER's own `attributes` dict is mutated in
//     place (`del attributes["Enumerators"]`), unlike `../library/editLibrary.ts`'s own
//     `attributes.copy()` precedent for a structurally similar "strip one special key
//     before the generic loop" situation ---
//
// Confirmed by reading the real source directly: there is no `.copy()` anywhere in
// `edit_prop_template.py` -- `del attributes["Enumerators"]` deletes the key from
// whatever dict object the CALLER passed in, a real, visible side effect on the
// caller's own object. This port deliberately does NOT reproduce that side effect on
// the caller's TS object (mutating a caller-supplied object out from under it is
// surprising and not this project's convention elsewhere) -- a shallow copy is taken
// first, so `settings.attributes` itself is left untouched by this function, while the
// FUNCTIONAL behavior (an `"Enumerators"` key present in `attributes` is always
// excluded from the generic setattr loop below, handled or not) is preserved exactly.
//
// No `update_owner_history` call -- `IfcSimplePropertyTemplate` is an `IfcRoot`
// subtype with `OwnerHistory`, but real Python's own `edit_prop_template.py` never
// touches it (matching `./editPsetTemplate.ts`'s identical omission).
//
// --- BLOCKED: `file.create_entity(primary_measure_type, v)` needs a standalone,
//     freshly-populated simple/defined-type instance -- a real, already-disclosed
//     primitive-layer gap, NOT specific to this file (see `TODOS.md`'s matching entry,
//     "6th independent confirmation") ---
//
// `EntityInstance.setByIndex` (called by `IfcFile.createEntity(type, ...args)`'s own
// initial-attribute-assignment loop) always calls the native `attribute_kind_of`
// primitive first, which unconditionally throws `"Attribute access is only supported
// on entity instances"` for ANY non-entity (simple/defined-type) target instance --
// confirmed empirically against this exact worktree's own built native addon
// (`file.createEntity("IfcLabel", "hello")` throws), matching `../pset/editPset.ts`'s/
// `../style/editSurfaceStyle.ts`'s/`../owner/addApplication.ts`'s own independent
// confirmations of the identical gate. So `enum_values.map((v) => file.createEntity(
// primary_measure_type, v))` below throws the moment `Enumerators` is a non-empty
// list -- this is NOT proactively guarded against (no custom `try`/`catch` wrapping
// with a friendlier message): the native throw IS the loud, clear, descriptive error,
// matching `editPset.ts`'s/`editSurfaceStyle.ts`'s own established "let the native
// call fail naturally at the exact point it's needed" precedent, not a new pattern
// introduced here. Every other part of this function (the generic attribute-setter
// loop, and reaching this exact point after resolving `propName`/`primaryMeasureType`
// completely correctly) is fully functional and gets real, passing test coverage --
// only the `Enumerators` special case itself is blocked. `editPropTemplate.test.ts`
// pins this CURRENT, disclosed, blocked behavior (matching `editPset.test.ts`'s own
// established precedent), with a comment recording the real Python assertion
// (`test_editing_an_enumeration`) to restore once this gap closes.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/**
 * Python's `x or y or z` OR-chain -- returns the first truthy argument, or `undefined`
 * if all are falsy. See this file's header comment: falsy includes `""`/`0`/`null`/
 * `undefined`, not just `null`/`undefined` the way `??` chaining would treat it.
 */
function firstTruthy<T>(...values: readonly (T | null | undefined)[]): T | undefined {
	for (const value of values) {
		if (value) return value;
	}
	return undefined;
}

/**
 * Python's `del data[key]` -- matches `util/element.ts`'s/`util/classification.ts`'s
 * own `deleteKey` helper (not exported from either, so re-declared here); needs the
 * key genuinely absent afterward (Python dict semantics, so the generic setattr loop
 * below skips it entirely), not merely set to `undefined`.
 */
function deleteKey(obj: Record<string, unknown>, key: string): void {
	delete obj[key];
}

export interface EditPropTemplateSettings {
	/** The `IfcSimplePropertyTemplate` entity you want to edit. */
	propTemplate: EntityInstance;
	/**
	 * A dictionary of attribute names and values. An `"Enumerators"` key is treated
	 * specially -- see this file's header comment.
	 */
	attributes: Record<string, unknown>;
}

function editPropTemplateUsecase(file: IfcFile, settings: EditPropTemplateSettings): void {
	const { propTemplate } = settings;
	// Shallow copy -- see this file's header comment on why this port doesn't mutate
	// the caller's own `settings.attributes` object the way real Python does.
	const attributes = { ...settings.attributes };

	const enumValuesRaw = attributes.Enumerators as unknown[] | null | undefined;
	if (enumValuesRaw && enumValuesRaw.length > 0) {
		const propName =
			firstTruthy(attributes.Name as string | null | undefined, propTemplate.get("Name") as string | null) ?? "Unnamed";
		const primaryMeasureType =
			firstTruthy(
				attributes.PrimaryMeasureType as string | null | undefined,
				propTemplate.get("PrimaryMeasureType") as string | null,
			) ?? "IfcLabel";

		const enumValues = enumValuesRaw.map((value) => file.createEntity(primaryMeasureType, value));

		const existingEnumerators = propTemplate.get("Enumerators") as EntityInstance | null;
		if (existingEnumerators) {
			existingEnumerators.set("Name", propName);
			existingEnumerators.set("EnumerationValues", enumValues);
		} else {
			propTemplate.set("Enumerators", file.createEntity("IfcPropertyEnumeration", propName, enumValues));
		}
	}

	if ("Enumerators" in attributes) {
		deleteKey(attributes, "Enumerators");
	}

	for (const [name, value] of Object.entries(attributes)) {
		propTemplate.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcSimplePropertyTemplate` (Python:
 * `ifcopenshell.api.pset_template.edit_prop_template`).
 *
 * For more information about the attributes and data types of an
 * `IfcSimplePropertyTemplate`, consult the IFC documentation.
 *
 * See this file's own header comment for the `Enumerators` special case (raw values
 * are wrapped into typed IFC entities and an `IfcPropertyEnumeration`), two disclosed
 * real Python quirks around it, and a real, already-tracked primitive-layer gap that
 * currently blocks the `Enumerators` case specifically (every other attribute edit
 * works normally).
 *
 * @example
 * ```ts
 * const template = api.psetTemplate.addPsetTemplate(model, { name: "ABC_RiskFactors" });
 *
 * // Here's a property with just default values.
 * const prop = api.psetTemplate.addPropTemplate(model, { psetTemplate: template });
 *
 * // Let's edit it to give the actual values we need.
 * api.psetTemplate.editPropTemplate(model, {
 *   propTemplate: prop,
 *   attributes: { Name: "DemoA", PrimaryMeasureType: "IfcLengthMeasure" },
 * });
 * ```
 */
export const editPropTemplate = wrapUsecase("pset_template.edit_prop_template", editPropTemplateUsecase);
