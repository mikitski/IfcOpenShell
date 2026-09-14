// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset/edit_qto.py` (src/ifcopenshell-python, 244 lines) --
// the genuinely complex counterpart to the trivial attribute-setter-loop `edit*.ts`
// files elsewhere in this project (`editObjective`/`editReference`/etc). Edits an
// `IfcElementQuantity`'s (or a nested `IfcPhysicalComplexQuantity`'s) own `Name`, and
// adds/edits/removes the individual quantities inside it, with type inference for
// plain numeric values and full support for nested `IfcPhysicalComplexQuantity`.
//
// --- Overall shape (`Usecase.execute`, read directly, not assumed) ---
//
// 1. `qtoIdx`: `5` (`IfcElementQuantity.Quantities`) normally, `2`
//    (`IfcPhysicalComplexQuantity.HasQuantities`) if `qto` is itself a complex
//    quantity -- confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`, IDENTICAL
//    attribute order in all 3 schemas for both classes (`IfcElementQuantity`:
//    `GlobalId`(0)/`OwnerHistory`(1)/`Name`(2)/`Description`(3)/
//    `MethodOfMeasurement`(4)/`Quantities`(5); `IfcPhysicalComplexQuantity`:
//    `Name`(0)/`Description`(1)/`HasQuantities`(2)/`Discrimination`(3)/`Quality`(4)/
//    `Usage`(5) -- no DERIVE-attribute interleaving in either).
// 2. Update `qto.Name` if a new `name` was given.
// 3. Resolve a `qtoTemplate` (see the dedicated section below -- this is where a real,
//    confirmed Python bug lives).
// 4. For every EXISTING quantity in `qto[qtoIdx]`: if its `Name` is a key in
//    `properties`, update/remove it in place (see "existing quantities" below) and
//    remove that key from the working `properties` map so step 5 doesn't also treat it
//    as new.
// 5. For every REMAINING entry in `properties` (not `null`): create a new quantity
//    (or, for a `dict`/`ComplexQuantityValue`, a new nested `IfcPhysicalComplexQuantity`
//    -- recursing through this same, exported, listener-wrapped `editQto` to populate
//    ITS `HasQuantities`, exactly matching real Python's own
//    `ifcopenshell.api.pset.edit_qto(self.file, qto=complex_qto, properties=value[
//    "HasQuantities"])` recursive call).
// 6. Append the newly-created quantities to `qto[qtoIdx]`'s CURRENT value (read AFTER
//    step 4's removals -- native `IfcFile.remove()` already detaches a removed entity
//    from any list attribute referencing it, the same core C++ `file::removeEntity`
//    engine real Python's own `self.file.remove(prop)` uses, so no extra list-filtering
//    is needed here to exclude just-removed quantities).
//
// --- "None quantities are always purged" -- real Python's own docstring, verified in
// the source: `update_existing_property`'s FIRST check is `if value is None:
// self.file.remove(prop)`, unconditionally, before any `is_a` branching -- a `None`
// purges an existing quantity whether it's simple OR complex. `add_new_properties`
// simply `continue`s past a `None` entry (nothing to purge, since it was never a real
// quantity in the first place). No `edit_pset`-style "just clear the value but keep the
// property" option exists for quantities at all, matching the docstring's own "It is
// not allowed to have None quantities in IFC."
//
// --- Nested `IfcPhysicalComplexQuantity` handling -- read closely, not assumed a
// simple loop suffices ---
//
// A `properties` VALUE (not the whole `properties` argument) can itself be a nested
// object shaped `{ Discrimination, HasQuantities: {...} }` (`ComplexQuantityValue`
// below; Python: a `dict`). Two distinct code paths handle this, both by RECURSING
// through the exported `editQto` (matching `../context/removeContext.ts`'s own
// established "recurse through the wrapped export so nested listener firing matches
// real Python" precedent, not this plain module-private usecase function):
//
// - Editing an EXISTING complex quantity (`update_existing_property`): `Discrimination`
//   is updated via Python's `value.get("Discrimination", prop.Discrimination)` --
//   OPTIONAL here, falling back to the prop's CURRENT value if omitted -- then
//   `edit_qto(file, qto=prop, properties=value["HasQuantities"])` recurses to update the
//   nested quantities in place (`prop`'s own `qtoIdx` inside that recursive call
//   resolves to `2`, since `prop.is_a("IfcPhysicalComplexQuantity")` is true).
// - Creating a NEW complex quantity (`add_new_properties`): `Discrimination` is instead
//   Python `value["Discrimination"]` -- a REQUIRED dict key here (a bare `KeyError` if
//   missing), asymmetric with the optional-with-fallback read on the update path above.
//   A fresh, empty `IfcPhysicalComplexQuantity(Name, Description=None, HasQuantities=
//   None, Discrimination)` is created, THEN `edit_qto(file, qto=complex_qto, properties=
//   value["HasQuantities"])` recurses to populate `HasQuantities` (that recursive call's
//   own step 6 does the actual list-population -- the outer `create_entity` call never
//   passes `HasQuantities` directly).
//
// This recursion is genuinely unbounded in depth (an `IfcPhysicalComplexQuantity`'s own
// `HasQuantities` can itself contain further complex quantities) -- matches real
// Python's own recursive-by-construction shape exactly, no depth limit in either.
//
// --- Type inference for plain numeric `properties` values -- `get_canonical_property_
// type`/`infer_property_type`, read in full ---
//
// Resolution order for a plain (non-`entity_instance`, non-dict) value:
// 1. An explicit `entity_instance` value (e.g. `file.createEntity("IfcAreaMeasure", 21)`)
//    always wins: its OWN declared type name (`Ifc`/`Measure` substrings stripped --
//    Python's `str.replace` strips ALL occurrences, not just a prefix/suffix, ported
//    below via `replaceAll` for the same reason) becomes the quantity class suffix, with
//    2 real, hard-coded IFC-naming-inconsistency corrections: `Numeric` -> `Number`
//    (`IfcNumericMeasure` -> `IfcQuantityNumber`) and `Mass` -> `Weight`
//    (`IfcMassMeasure` -> `IfcQuantityWeight`).
// 2. Otherwise, if a `qtoTemplate` was resolved (see the bug section below) AND it has a
//    matching-by-`Name` property template, that template's own `TemplateType` (e.g.
//    `"Q_LENGTH"`) determines the type (`slice(2)` strips the `"Q_"` prefix).
// 3. Otherwise, `inferPropertyType` (`FLOAT_TYPE_KEYWORDS`): keyword-matches the
//    property NAME against 5 categories (Area/Volume/Weight/Length/Time), defaulting to
//    `Length` for an unmatched Python `float`, or `Count` unconditionally for a Python
//    `int` (name keywords are NOT even consulted for an `int` -- confirmed directly:
//    `infer_property_type`'s `elif isinstance(value, int): return "Count"` branch has no
//    keyword loop at all, unlike the `float` branch immediately above it). Python's own
//    comment: "Only undetected type is IfcQuantityNumber (IFC4X3), not sure when it's
//    appropriate" -- `IfcQuantityNumber` (IFC4X3-only, confirmed absent from
//    `ifc2x3.d.ts`/`ifc4.d.ts`) is never inferred, only reachable via an explicit
//    `entity_instance` (path 1) or an explicit `qtoTemplate` entry (path 2).
//
// *** Disclosed, JS-representational limitation in step 3's int-vs-float distinction ***
// -- the exact same class of gap `util/migrator.ts`'s own header comment (bullet 2)
// already discloses for `IfcCountMeasure`/`IfcQuantityCount` retyping: Python
// distinguishes an `int`-typed value (`12`) from a `float`-typed one (`12.0`) at the
// OBJECT-TYPE level; JS has one `number` type for both, and `12`/`12.0` are the exact
// same IEEE-754 value. This port uses `Number.isInteger(value)` as the best-effort
// proxy -- correctly matching Python's behavior for any value with an actual
// fractional part (unambiguously the `float` branch in both languages), but for a
// WHOLE-NUMBER value this port cannot tell whether the caller "meant" a Python `int`
// (real Python: unconditionally `Count`, matching this port) or a Python `float` (real
// Python: keyword-matched, e.g. `"NetVolume": 7.0` -> `Volume`; this port: also
// `Count`, since `Number.isInteger(7)` is `true`) -- a real, narrow divergence for
// exactly this one input shape, not silently hidden. A caller who needs a guaranteed
// non-`Count` type for a whole-number quantity should use path 1 (pass an explicit
// `file.createEntity("IfcVolumeMeasure", 7)` instead of a bare `7`) or path 2 (a
// `qtoTemplate` entry) -- both already take priority over this heuristic, exactly
// matching real Python's own documented "if more control is desired... specify IFC
// data objects directly" escape valve.
//
// --- *** A genuine, confirmed bug in real Python's `edit_qto.py` itself -- reproduced
// as a disclosed graceful degradation, not a crash *** ---
//
// `load_qto_template`:
//     if self.settings["pset_template"]:
//         self.pset_template = self.settings["pset_template"]
//     else:
//         self.psetqto = ifcopenshell.util.pset.get_template(self.file.schema_identifier)
//         self.qto_template = self.psetqto.get_by_name(self.settings["qto"].Name)
//
// `get_canonical_property_type` (the ONLY reader of either attribute) checks `if self.
// qto_template:` -- never `self.pset_template`. So when a caller supplies an explicit
// `pset_template` (real Python's own documented use case -- see `edit_qto.py`'s own
// docstring "Company Standard" example, `properties={"OverhangLength": 42.3}`), `self.
// qto_template` is NEVER assigned in that code path (Python's bare class-level
// annotations `file: ...`/`settings: ...` create no actual attributes -- there is no
// other default anywhere in the class). The first plain (non-`entity_instance`,
// non-dict) property value hitting `get_canonical_property_type` then raises `
// AttributeError: 'Usecase' object has no attribute 'qto_template'` -- meaning real
// Python's OWN documented `pset_template` docstring example, as written, crashes.
// Confirmed by reading the full 244-line source directly (not assumed from the
// docstring alone), and cross-checked against `test_edit_qto.py` in full: that test
// file never exercises `pset_template` at all, so this bug is real but has apparently
// gone unexercised by the project's own test suite.
//
// A JS class field left unassigned simply reads as `undefined` (no `AttributeError`
// equivalent) -- this port cannot reproduce Python's literal crash without deliberately
// throwing a new error Python itself doesn't raise as a first-class, catchable
// exception type at this exact call site (Python's `AttributeError` IS a distinct,
// catchable type there, unlike, say, `add_pset.py`'s `TypeError` which this project's
// `../root/createEntity.ts` and others already disclose can't be perfectly mirrored
// either). Rather than inventing a new throw Python doesn't cleanly offer as a
// documented, catchable contract, this port degrades gracefully to Python's evident
// INTENT for this code path instead: `resolveQtoTemplate` below returns `null` whenever
// an explicit `psetTemplate` setting is supplied, so `getCanonicalPropertyType` simply
// falls through to `inferPropertyType` -- exactly as if no `psetTemplate` had been
// passed at all. Net effect, disclosed plainly: a caller-supplied `psetTemplate` has NO
// influence on type inference in this port, matching real Python's evident intent (the
// custom template affecting inference) being just as ineffective there too -- but
// arrived at via a silent no-op instead of Python's own crash. A caller who needs
// guaranteed template-driven typing should pass an explicit `entity_instance` value
// instead (path 1 above), which is unaffected by this bug in both Python and this port.

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getTemplate } from "../../util/pset";
import { wrapUsecase } from "../hooks";

/**
 * Python: `FLOAT_TYPE_KEYWORDS` -- keyword table `inferPropertyType` uses to guess a
 * quantity's category from its NAME, for a fractional value with no template match.
 */
const FLOAT_TYPE_KEYWORDS: ReadonlyArray<readonly [string, readonly string[]]> = [
	["Area", ["area"]],
	["Volume", ["volume"]],
	["Weight", ["weight", "mass"]],
	["Length", ["length", "width", "height", "depth", "distance"]],
	["Time", ["time", "duration"]],
];

/** Python: a nested `dict` value for a complex quantity's own sub-quantities. */
export interface ComplexQuantityValue {
	/**
	 * Required when CREATING a new complex quantity (Python: `value["Discrimination"]`,
	 * a bare `KeyError` if missing); optional (falls back to the existing value) when
	 * EDITING an existing one (Python: `value.get("Discrimination", prop.Discrimination)`)
	 * -- see this file's header comment for this real, disclosed asymmetry.
	 */
	Discrimination?: string;
	HasQuantities: Record<string, QuantityValue>;
}

/** Python: `PROP_VALUE_TYPE = Union[entity_instance, float, int, dict[str, "PROP_VALUE_TYPE"]]`. */
export type QuantityValue = EntityInstance | number | ComplexQuantityValue | null;

export interface EditQtoSettings {
	/** The `IfcElementQuantity` or `IfcPhysicalComplexQuantity` to edit. */
	qto: EntityInstance;
	/** A new name for the quantity set. If not specified, the name is not changed. */
	name?: string | null;
	/**
	 * A dictionary of quantities. Keys are quantity names; a `null` value always purges
	 * the quantity (quantities may never be `null` in IFC, unlike `editPset`'s properties).
	 */
	properties?: Record<string, QuantityValue> | null;
	/**
	 * If provided, used to determine quantity data types -- see this file's header
	 * comment's disclosed-bug section: due to a confirmed bug in real Python's own
	 * `edit_qto.py`, this setting has NO effect on type inference in either
	 * implementation (this port silently no-ops; real Python crashes).
	 */
	psetTemplate?: EntityInstance | null;
}

/**
 * Python's `x.wrappedValue if isinstance(x, entity_instance) else x`, plus the implicit
 * `float()`/`int()` conversion Python performs alongside it. Throws for anything else
 * (e.g. a `ComplexQuantityValue` reaching here, which real Python's own `float(dict)`
 * would likewise raise a `TypeError` for -- see this file's header comment's "existing
 * simple quantity fed a dict value" case, disclosed there via `updateExistingProperty`'s
 * own comment).
 */
function wrappedNumericValueOf(value: EntityInstance | number | ComplexQuantityValue): number {
	if (typeof value === "number") return value;
	if (value instanceof EntityInstance) return value.getByIndex(0) as number;
	throw new TypeError("float() argument must be a string or a real number, not a complex-quantity object");
}

function isComplexValue(value: QuantityValue): value is ComplexQuantityValue {
	return value !== null && typeof value === "object" && !(value instanceof EntityInstance);
}

/** Python: `infer_property_type(name, value) -> str`. See header comment for the disclosed int-vs-float limitation. */
export function inferPropertyType(name: string, value: number): string {
	const nameLower = name.toLowerCase();
	if (!Number.isInteger(value)) {
		for (const [category, keywords] of FLOAT_TYPE_KEYWORDS) {
			if (keywords.some((keyword) => nameLower.includes(keyword))) return category;
		}
		return "Length";
	}
	return "Count";
}

/** Python: `Usecase.get_canonical_property_type`. */
function getCanonicalPropertyType(
	name: string,
	value: EntityInstance | number,
	qtoTemplate: EntityInstance | null,
): string {
	if (value instanceof EntityInstance) {
		let result = value.isA().replaceAll("Ifc", "").replaceAll("Measure", "");
		if (result === "Numeric") result = "Number";
		else if (result === "Mass") result = "Weight";
		return result;
	}
	if (qtoTemplate) {
		for (const propTemplate of (qtoTemplate.get("HasPropertyTemplates") as EntityInstance[] | null) ?? []) {
			if (propTemplate.get("Name") !== name) continue;
			const templateType = propTemplate.get("TemplateType") as string;
			const stripped = templateType.slice(2).toLowerCase();
			return stripped.charAt(0).toUpperCase() + stripped.slice(1);
		}
	}
	return inferPropertyType(name, value);
}

/**
 * Python: `Usecase.load_qto_template`. See this file's header comment's disclosed-bug
 * section: a caller-supplied `psetTemplate` intentionally results in `null` here (real
 * Python would instead crash with `AttributeError` the moment a plain numeric property
 * value needs type inference).
 */
function resolveQtoTemplate(
	file: IfcFile,
	qtoName: string,
	psetTemplate: EntityInstance | null | undefined,
): EntityInstance | null {
	if (psetTemplate) return null;
	return getTemplate(file.schemaIdentifier).getByName(qtoName);
}

function updateExistingProperty(file: IfcFile, prop: EntityInstance, properties: Map<string, QuantityValue>): void {
	const name = prop.get("Name") as string;
	if (!properties.has(name)) return;
	const value = properties.get(name) ?? null;

	if (value === null) {
		file.remove(prop);
	} else if (prop.isA("IfcPhysicalComplexQuantity") && isComplexValue(value)) {
		prop.set("Discrimination", value.Discrimination ?? prop.get("Discrimination"));
		// Recurses through the wrapped, exported `editQto` below (not a plain internal
		// helper) -- matching real Python's own recursive
		// `ifcopenshell.api.pset.edit_qto(self.file, qto=prop, properties=value[
		// "HasQuantities"])` call, so pre/post-listeners genuinely fire for the nested
		// edit too (see `../context/removeContext.ts`'s own identical precedent).
		editQto(file, { qto: prop, properties: value.HasQuantities });
	} else if (prop.isA("IfcPhysicalSimpleQuantity")) {
		const numeric = wrappedNumericValueOf(value);
		// IfcPhysicalSimpleQuantity: Name(0), Description(1), Unit(2), XXXValue(3) --
		// identical index in all 3 schemas (Formula(4), IFC4+ only, unused here).
		if (file.schema === "IFC4X3" && prop.isA("IfcQuantityCount")) {
			prop.setByIndex(3, Math.trunc(numeric));
		} else {
			prop.setByIndex(3, numeric);
		}
	}
	// Unconditional, matching real Python's own `del` sitting OUTSIDE the if/elif chain:
	// even the "complex quantity fed a non-dict value" case (none of the 3 branches
	// above match) silently consumes the key here with no mutation at all -- a real,
	// disclosed Python quirk, not a bug introduced by this port.
	properties.delete(name);
}

/** Python: `Usecase.add_new_properties`. */
function addNewProperties(
	file: IfcFile,
	properties: Map<string, QuantityValue>,
	qtoTemplate: EntityInstance | null,
): EntityInstance[] {
	const created: EntityInstance[] = [];
	for (const [name, value] of properties) {
		if (value === null) continue;
		if (isComplexValue(value)) {
			if (value.Discrimination === undefined) {
				// Python: bare `value["Discrimination"]` -- a required key when CREATING a
				// new complex quantity (see header comment for the asymmetry with the
				// optional-on-update path above).
				throw new Error(`editQto: creating a new complex quantity "${name}" requires a "Discrimination" value`);
			}
			// IfcPhysicalComplexQuantity: Name(0), Description(1, skipped), HasQuantities(2,
			// populated below via the recursive editQto call, not passed here),
			// Discrimination(3).
			const complexQto = file.createEntity("IfcPhysicalComplexQuantity", name, null, null, value.Discrimination);
			created.push(complexQto);
			editQto(file, { qto: complexQto, properties: value.HasQuantities });
			continue;
		}
		const propertyType = getCanonicalPropertyType(name, value, qtoTemplate);
		const numeric = wrappedNumericValueOf(value);
		// IfcQuantityXXX: Name(0), Description(1, skipped), Unit(2, skipped), XXXValue(3).
		// No IFC4X3-`IfcQuantityCount`-as-integer coercion here -- see header comment:
		// real Python's own `add_new_properties` has no such special case, unlike
		// `update_existing_property` above (a genuine, disclosed asymmetry).
		created.push(file.createEntity(`IfcQuantity${propertyType}`, name, null, null, numeric));
	}
	return created;
}

function editQtoUsecase(file: IfcFile, settings: EditQtoSettings): void {
	const { qto, name, psetTemplate } = settings;
	const qtoIdx = qto.isA("IfcPhysicalComplexQuantity") ? 2 : 5;

	if (name) {
		qto.set("Name", name);
	}

	const qtoTemplate = resolveQtoTemplate(file, qto.get("Name") as string, psetTemplate);

	// Mutable working copy -- entries are deleted as existing quantities consume them,
	// matching Python's own `del self.settings["properties"][name]` mutation of the same
	// dict `add_new_properties` later iterates.
	const properties = new Map<string, QuantityValue>(Object.entries(settings.properties ?? {}));

	for (const prop of (qto.getByIndex(qtoIdx) as EntityInstance[] | null) ?? []) {
		updateExistingProperty(file, prop, properties);
	}

	const newProperties = addNewProperties(file, properties, qtoTemplate);

	// Read qto[qtoIdx] AFTER the updates above -- any quantity purged via `file.remove()`
	// is already gone from this list (native `remove_entity` detaches references),
	// matching real Python's identical read-after-mutate order.
	const existing = (qto.getByIndex(qtoIdx) as EntityInstance[] | null) ?? [];
	qto.setByIndex(qtoIdx, [...existing, ...newProperties]);
}

/**
 * Edits a quantity set and its quantities (Python: `ifcopenshell.api.pset.edit_qto`).
 *
 * At its simplest, this may be used to edit the name of a quantity set. It may also be
 * used to add, edit, or remove quantities.
 *
 * See `api.pset.addPset`/a future `api.pset.editPset` chunk for documentation on how
 * property sets work analogously. One major difference: quantities set to `null` are
 * ALWAYS purged -- it is not allowed to have `null` quantities in IFC.
 *
 * @example
 * ```ts
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 * const qto = api.pset.addQto(model, { product: wall, name: "Qto_WallBaseQuantities" });
 *
 * // No pset_template needed: it's a built-in buildingSMART template, so "Length"
 * // automatically becomes an IfcLengthMeasure and "NetVolume" an IfcVolumeMeasure.
 * api.pset.editQto(model, { qto, properties: { Length: 12, NetVolume: 7.2 } });
 *
 * // Setting to null deletes the quantity.
 * api.pset.editQto(model, { qto, properties: { Length: null } });
 *
 * // Nested complex quantities:
 * api.pset.editQto(model, {
 *   qto,
 *   properties: {
 *     FireResistance: {
 *       Discrimination: "COMPONENT",
 *       HasQuantities: { InsulationLength: 12.3 },
 *     },
 *   },
 * });
 * ```
 */
export const editQto = wrapUsecase("pset.edit_qto", editQtoUsecase);
