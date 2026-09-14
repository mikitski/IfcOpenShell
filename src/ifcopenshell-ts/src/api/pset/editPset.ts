// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset/edit_pset.py` (src/ifcopenshell-python, 490 lines) --
// chunk 3 of 3 for `api.pset` (see `./addPset.ts`/`./assignPset.ts`/`./unassignPset.ts`/
// `./unsharePset.ts` for chunk 1, `./addQto.ts`/`./editQto.ts` for chunk 2, `./removePset.ts`
// for the one file that landed even earlier as a direct dependency of `../group/
// removeGroup.ts`). Genuinely the largest/most intricate file in this whole `api`
// package. Edits an `IfcPropertySet`'s (or material's/profile's "extended properties")
// own `Name` and its individual properties (add/edit/remove), with type inference for
// plain values, an optional property-set TEMPLATE to drive that inference, and support
// for enumerated/list-valued/unit-wrapped/pre-built-entity property values.
//
// *** CRITICAL, THIRD INDEPENDENT CONFIRMATION of a real, pre-existing, already-
// disclosed primitive-layer gap -- read this before anything else below. Ported
// completely and faithfully anyway (correct the moment the gap closes), per this
// project's own established precedent for this exact situation, NOT silently worked
// around. ***
//
// Whenever this function needs to materialize a BRAND NEW, plain-JS-scalar-derived
// typed value (an `IfcLabel`/`IfcReal`/`IfcBoolean`/`IfcThermalTransmittanceMeasure`/
// etc. instance wrapping a string/number/boolean/`Date`) -- i.e. `cast_value_to_
// primary_measure_type`'s own probe-then-create technique, or the raw-array enum/list
// creation paths that call `file.create_entity(primaryMeasureType, val)` directly --
// it hits the EXACT SAME `entity_instance.ts`-level gap already independently
// confirmed twice elsewhere in this codebase: `util/migrator.ts`'s own header comment
// (finding 1) and, even more directly on point, `api/unit/addConversionBasedUnit.ts`'s
// entire function (READ THAT FILE'S HEADER COMMENT for the full empirical writeup --
// this file's own investigation reproduced the identical failure independently, not
// copied uncritically). `IfcFile.createEntity`/`EntityInstance.setByIndex` both
// unconditionally call the native `attribute_kind_of` primitive on the TARGET instance
// to disambiguate how to box a raw JS value -- and that primitive's shim throws
// `"Attribute access is only supported on entity instances"` for ANY non-entity
// (simple/defined-type) target, whether populated via positional `createEntity` args
// or via a separate `setByIndex` call on an already-created bare instance afterward.
// `castValueToPrimaryMeasureType` below hits this on its own very first line (the
// probe-instance creation, `file.createEntity(primaryMeasureType).attributeType(0)`,
// itself gated by the identical restriction `util/attribute.ts`'s own header comment
// independently confirms has "NO N-API binding at all" for the declaration-level
// equivalent either) -- so it never even reaches its own (otherwise correct, verified-
// against-the-real-Python-source) `type_fn` dispatch table in practice, today.
//
// Concretely, in THIS port, right now: creating a NEW property (or updating an
// EXISTING one) from a plain JS `string`/`number`/`boolean`/`Date` value throws this
// same pre-existing error -- for BOTH `IfcPropertySingleValue.NominalValue` and any
// `IfcPropertyEnumeratedValue`/`IfcPropertyListValue` raw-array value. This is NOT a
// narrow corner case: it blocks the majority of `edit_pset.py`'s own real Python test
// suite, which almost entirely exercises plain-value inputs (`"FireRating": "2HR"`-
// style calls). What remains FULLY FUNCTIONAL, unaffected by this gap (verified
// against this exact worktree's own built native addon, not assumed):
// - `name` (pset renaming) -- no value materialization involved at all.
// - Purging (`shouldPurge: true`) an EXISTING property to `null` -- `file.remove(prop)`
//   needs no new instance.
// - Clearing (`shouldPurge: false`) an EXISTING `IfcPropertySingleValue`'s own
//   `NominalValue` to `null`, or an `IfcPropertyEnumeratedValue`'s own
//   `EnumerationValues`/`EnumerationReference` to `null` -- setting a REAL entity's
//   (`prop`'s own) attribute to `null` doesn't need a new typed VALUE instance either
//   (the gate is on the instance being probed/populated, not on `prop` itself, which
//   IS a real multi-attribute entity).
// - Assigning an ALREADY-BUILT `entity_instance` value (constructed by the CALLER via
//   some other means -- e.g. a raw-native test helper identical to `editQto.test.ts`'s
//   own `createTypedValue`, or a value that already exists elsewhere in the file) to a
//   NEW property (`add_new_properties`'s `entity_instance` branch) or an EXISTING one
//   (`update_existing_prop_single_value`'s `entity_instance` branch) -- `prop.set(
//   "NominalValue", value)`/`file.createEntity("IfcPropertySingleValue", name, null,
//   value, unit)` both probe `attribute_kind_of` on the REAL entity being set
//   (`prop`/the new `IfcPropertySingleValue`), not on `value` itself, so an already-
//   constructed `value` (of whatever type) passes through untouched -- the SAME reason
//   a plain entity-to-entity reference (e.g. `pset.HasProperties = [...]`) works
//   everywhere else in this codebase.
// - A pre-built whole `IfcProperty` passed as a NEW property's value (`add_new_
//   properties`'s `value.is_a("IfcProperty")` full-passthrough branch) -- `value`
//   itself is simply appended, no new instance created at all.
// - Copying `EnumerationValues`/`EnumerationReference` from ANOTHER already-existing
//   `IfcPropertyEnumeratedValue` entity (`update_existing_prop_enum`'s entity_instance-
//   copy branch) -- copies references to EXISTING instances, creates nothing new
//   (except via `util.element.copyDeep`, itself a plain entity-copy, not a simple-type
//   materialization).
// - The shared-property safety check, the `NotImplementedError`-equivalent throw for
//   an unsupported existing property class, and `get_properties`/`assign_new_
//   properties`'s dispatch -- none of these ever materialize a new typed value.
//
// `test/api/pset/editPset.test.ts` is scoped accordingly: real Python test cases that
// need this port to materialize a new typed value from a plain scalar are ported as
// `expect(() => editPset(...)).toThrow(BLOCKED_ERROR)` assertions pinning this CURRENT,
// disclosed, blocked behavior (matching `addConversionBasedUnit.test.ts`'s own
// established precedent for the identical gap) -- each with a comment recording what
// the real, unblocked assertion should become the moment this foundational
// `entityInstance.ts` gap is closed -- while every UNBLOCKED code path listed above
// gets full, real, passing test coverage (using a `createTypedValue`-style helper to
// construct pre-built typed values where needed, exactly like `editQto.test.ts`
// already does for the identical reason).
//
// --- Overall shape (`Usecase.execute`, read directly) ---
//
// 1. `update_pset_name`: `pset.Name = name` if a new `name` was given (falsy/omitted ->
//    unchanged, matching a plain truthy check, so an explicit empty string doesn't rename
//    either -- same as `editQto.ts`).
// 2. `load_pset_template`: resolve `self.pset_template` -- either the caller-supplied
//    `pset_template`, or a built-in buildingSMART template looked up by the PSET'S OWN
//    (possibly just-renamed) `Name`. *** Unlike `editQto.ts`'s own confirmed
//    `pset_template`/`qto_template` attribute-name-mismatch bug, THIS file has NO such
//    bug: both branches of `load_pset_template` assign the SAME attribute,
//    `self.pset_template`, and `get_primary_measure_type` (the only reader) reads that
//    same attribute uniformly. Confirmed by reading both methods directly, not assumed
//    from the task brief's suspicion. A caller-supplied `psetTemplate` genuinely takes
//    effect for type inference in both real Python and this port -- see
//    `test_editing_a_custom_templated_pset` below, ported and passing. ***
// 3. `update_existing_properties`: for every EXISTING property in `get_properties()`
//    whose `Name` is a key in `properties`, either update it in place (removing the key
//    from the working map so step 4 doesn't also treat it as new) or, for a SHARED
//    property, skip it entirely (see the dedicated section below).
// 4. `add_new_properties`: for every REMAINING (non-consumed) `properties` entry, create
//    a brand new property.
// 5. `assign_new_properties(existing + new)`: reassigns the pset's OWN property list from
//    scratch to `existingProps ++ newProps`, unconditionally -- even a no-op call (no
//    `properties` at all, just a `name` change) still rewrites this list attribute with
//    the exact same objects, which means every `editPset` call records at least one
//    list-attribute `Transaction` edit, confirmed by this file's own undo/redo tests.
//
// --- `should_purge` (default `true`): a REAL, meaningful behavioral difference from
// `editQto.ts` (which ALWAYS purges a `None`/`null` quantity -- quantities may never be
// `null` in IFC) ---
//
// `_try_purge(prop)`: if `should_purge` is false, it's a complete no-op (returns `false`,
// touches neither the `properties` map nor the file) -- the CALLER then falls through to
// clearing the property's OWN value in place instead (`prop.NominalValue = None` /
// `prop.EnumerationValues = None`), leaving the property object itself alive in the pset.
// If `should_purge` is true, it deletes the map entry AND removes the property entity,
// returning `true` (caller returns immediately without touching the property further).
// Every one of `_try_purge`'s 4 real call sites (`update_existing_prop_single_value`'s
// `value is None` branch; `update_existing_prop_enum`'s empty-list branch AND its
// copy-another-enum-prop-with-no-EnumerationValues branch; `add_new_properties`'s own
// `value is None and should_purge` skip, which is really "don't even create a property
// object at all" rather than a `_try_purge` call, but is the analogous NEW-property
// half of this same "should_purge governs None handling" story) is ported below,
// each preserving this exact "purge outright vs. clear-in-place" branch.
//
// --- `IfcPropertySingleValue` vs `IfcPropertyEnumeratedValue`: two structurally
// different update paths, plus a deliberate `NotImplementedError` for anything else ---
//
// `update_existing_properties` dispatches purely on the EXISTING property's own class
// (`is_a("IfcPropertyEnumeratedValue")` / `is_a("IfcPropertySingleValue")`) -- any OTHER
// existing property class matching a `properties` key (`IfcPropertyListValue`/
// `IfcPropertyBoundedValue`/`IfcPropertyTableValue`/`IfcComplexProperty`, all real IFC
// property classes) raises `NotImplementedError(f"Updating '{prop.is_a()}' properties is
// not supported yet")`, per real Python's own TODO comment ("Add support for changing
// property types?... or maybe the user should just delete the property first?"). This is
// a REAL, DELIBERATE Python limitation, ported here as a genuine throw (`Updating 'X'
// properties is not supported yet`), not silently worked around or expanded to cover
// classes real Python itself doesn't -- a caller who needs to change e.g. an existing
// `IfcPropertyListValue`'s own values has to remove and recreate it (this file doesn't
// even expose a `removeProp`-style helper -- that's `api.pset.removePset`'s job, one
// level up, or direct `file.remove()`).
//
// `IfcComplexProperty` (the pset analogue of `edit_qto.py`'s
// `IfcPhysicalComplexQuantity`): NOT supported by `edit_pset.py` at all, for either
// updating an EXISTING one (falls into the `NotImplementedError` branch above, since it's
// neither `IfcPropertyEnumeratedValue` nor `IfcPropertySingleValue`) or creating a new
// one (`add_new_properties` has no nested-dict-value/complex-property branch anywhere --
// confirmed by reading the full function; a `dict` value there is ONLY ever the
// `unpack_unit_value` `{Unit, NominalValue}` wrapper, never a
// `{Discrimination, HasQuantities}`-style nested shape). This is a real, disclosed
// asymmetry vs. `editQto.ts`'s own genuine `IfcPhysicalComplexQuantity` recursion
// support -- property SETS simply don't have an `edit_pset`-level nested-property
// story the way quantity SETS do.
//
// --- Shared-property safety check: `get_total_inverses(prop) > 1` ---
//
// `update_existing_properties`: for a name-matching EXISTING property, if
// `self.file.get_total_inverses(prop) > 1` (i.e. more than one thing in the file
// references this exact property entity -- realistically, another pset that was made to
// share it, e.g. via the raw `pset2.HasProperties = pset1.HasProperties` aliasing
// `test_editing_a_shared_property` below constructs, matching real Python's own test),
// the property is `continue`d PAST entirely: it is NOT added to `existing_props` (so
// this pset's own property list will no longer reference it after `assign_new_properties`
// runs), and -- crucially -- its `properties` map entry is NOT deleted (none of
// `update_existing_prop_enum`/`update_existing_prop_single_value`, the only two places
// that ever call `del self.settings["properties"][name]`, ever ran for it). So the SAME
// name then gets reprocessed by `add_new_properties` as if it were a brand new property,
// which creates a FRESH property entity and appends it to `new_props`. Net effect,
// confirmed against `test_editing_a_shared_property`'s own assertions: the shared
// property entity itself is left completely untouched in the file (still referenced by
// whatever OTHER pset(s) still point at it, with its original value intact), while THIS
// pset's own property list gets a brand new, independent property entity carrying the
// new value under the same name -- exactly the "avoid affecting other psets" comment
// in the real Python source describes. Ported below as: skip the shared prop (don't push
// to `existingProps`, don't touch its `properties` map entry), let `addNewProperties`'s
// normal iteration pick the still-present map entry back up.
//
// --- Value type inference: `get_primary_measure_type` -- a DIFFERENT resolution order
// than `editQto.ts`'s `getCanonicalPropertyType`, read in full, not assumed identical ---
//
// 1. An explicit `old_value` (only ever passed by `update_existing_prop_single_value`,
//    as the EXISTING property's own current `NominalValue`) wins outright if truthy:
//    `old_value.is_a()`. This tier has NO equivalent in `editQto.ts` at all -- and the
//    reason is structural, not an oversight: an `IfcPhysicalSimpleQuantity` (e.g.
//    `IfcQuantityLength`) IS its own type -- updating it only ever mutates its own
//    `XXXValue` attribute in place via `setByIndex`, the wrapping entity's class itself
//    never changes, so "retain the existing type" falls out for free with no extra code.
//    An `IfcPropertySingleValue`, by contrast, wraps its value in a SEPARATE nested
//    simple-type entity (`NominalValue`) that gets fully torn down and RECREATED via
//    `file.create_entity(primary_measure_type, value)` on every single edit -- so
//    "retain the existing type" genuinely requires this explicit `old_value` tier to
//    avoid silently reclassifying e.g. an `IfcModulusOfElasticityMeasure` down to a
//    generic `IfcReal` the next time its value changes (see
//    `test_editing_properties_with_custom_units`/`test_editing_properties_with_an_explicit_type`
//    below).
// 2. Otherwise, if `self.pset_template` is set AND has a matching-by-`Name` property
//    template, that template's own `PrimaryMeasureType` wins (`or "IfcLabel"` if the
//    template declares no measure type at all) -- REGARDLESS of whether the actual
//    Python value even fits that measure type (a `bool` value against a
//    template-declared `IfcLengthMeasure` property just gets `float(True) == 1.0`'d in
//    via `cast_value_to_primary_measure_type` below, no validation).
// 3. Otherwise, an explicit `entity_instance` value's own `is_a()`.
// 4. Otherwise, a Python-type-based heuristic on the plain value itself: `str` ->
//    `IfcLabel`, `float` -> `IfcReal`, `bool` -> `IfcBoolean` (checked BEFORE `int`,
//    since Python `bool` is an `int` subclass), `int` -> `IfcInteger`,
//    `datetime.datetime` -> `IfcDateTime` (checked before `date`, since `datetime` is a
//    `date` subclass), `datetime.date` -> `IfcDate`.
//
// *** Disclosed, JS-representational limitation (same class of gap as `editQto.ts`'s own
// header comment): *** JS has one `number` type for both Python `int` and `float` --
// `Number.isInteger(value)` is used as the best-effort proxy (whole-number -> `IfcInteger`,
// fractional -> `IfcReal`), which correctly matches Python for a value with an actual
// fractional part but cannot distinguish an INTENDED Python `int` from an INTENDED
// Python `float` for a whole-number JS input (`42` is ambiguous between Python `42` and
// `42.0`). Real Python's own `test_adding_properties_without_a_template_with_autodetected_and_manual_data_types`
// exercises `"MyFloat": 42.0` expecting `IfcReal` -- this port's ported version below
// uses a genuinely fractional `42.5` instead (still `IfcReal`, still correctly
// distinguishable from the adjacent `"MyInteger": 42` -> `IfcInteger` case in the SAME
// test) specifically so the ported assertion is actually meaningful in JS, with a
// dedicated extra test pinning the disclosed whole-number ambiguity and its escape valve
// (pass an explicit `entity_instance`, e.g. `file.createEntity("IfcReal", 7)`, matching
// real Python's own documented "if more control is desired..." escape hatch, which both
// languages honor identically since it's tier 3, not tier 4).
//
// *** Disclosed JS/Python gap: no native "date without time" type. *** Python
// distinguishes `datetime.date` (date-only) from `datetime.datetime` (full timestamp);
// JS's built-in `Date` always carries a full timestamp. This port maps a `Date` value to
// `IfcDateTime` only (tier 4) -- there is no way for a caller to request the
// `IfcDate`-only inference via a plain `Date` object. A caller who needs `IfcDate`
// specifically should use tier 3 (an explicit `file.createEntity("IfcDate", "2024-01-01")`).
// Zero test coverage for either date-typed inference tier in real Python's own
// `test_edit_pset.py` (confirmed by reading the file in full) -- a minimal, original test
// below pins this port's own `Date` -> `IfcDateTime` behavior instead of leaving it
// completely unverified.
//
// --- `cast_value_to_primary_measure_type`: a genuine, confirmed Python quirk --
// reproduced verbatim, not "fixed" ---
//
// `type_str = self.file.create_entity(primary_measure_type).attribute_type(0)` --
// creates an entity of the RESOLVED measure type WITH NO ARGUMENTS, purely to read its
// own attribute-0 STEP kind (`"DOUBLE"`/`"STRING"`/`"BOOL"`/`"INT"`/`"LOGICAL"`/
// `"BINARY"`/`"AGGREGATE OF ..."`), then throws that probe instance away. Real Python's
// own `create_entity` immediately adds the new instance to the file with a real STEP id
// (confirmed via `file.py`'s own docstring example: `f.create_entity("IfcPerson")` ->
// `#1=IfcPerson(...)`) -- so this "probe" instance is NOT a transient, GC'd object; it
// becomes a genuine, permanent ORPHAN entity in the file, for every single plain
// (non-`entity_instance`) property value processed by EITHER
// `update_existing_prop_single_value` OR `add_new_properties`'s final scalar branch --
// i.e. the common case, not a rare corner. This port's `castValueToPrimaryMeasureType`
// reproduces this exactly (`file.createEntity(primaryMeasureType).attributeType(0)`,
// added public method -- see `entityInstance.ts`'s own `attributeType` doc comment): a
// real, disclosed inefficiency in real Python's own source, faithfully carried over
// rather than "fixed" by probing the schema declaration without materializing an
// instance (this project's fidelity mandate applies to observable quirks like a growing
// orphan-entity count, not just to values/exceptions). Pinned by a dedicated test below.
//
// `type_fn` dispatch table, and 3 further, narrower disclosed divergences (none tested
// by real Python's own suite -- confirmed by reading `test_edit_pset.py` in full, zero
// `IfcLogical`/`IfcBinary`/aggregate-measure-type-typed `properties` values anywhere):
// - `"LOGICAL" -> str`: Python `str(True) == "True"`; this port's `String(true) ===
//   "true"` (lowercase) -- a real, disclosed cosmetic-casing divergence, only reachable
//   via a `pset_template`/`old_value` resolving to an `IfcLogical`-shaped measure type.
// - `"BINARY" -> bytes`: this port has no byte-string primitive to faithfully mirror
//   Python's wildly value-type-dependent `bytes()` constructor -- best-effort raw
//   passthrough, matching `util/attribute.ts`'s own established "don't fabricate a
//   primitive the native layer doesn't expose" discipline.
// - The date/datetime short-circuit (`isinstance(value, (date, datetime))` ->
//   `value.isoformat()`) is checked BEFORE the two AGGREGATE branches' own `type_fn`
//   dispatch in real Python's `elif` chain position-wise but AFTER them in evaluation
//   order (the aggregate `elif`s come first syntactically) -- ported with the same
//   ordering (aggregate checks first, then the `Date` short-circuit, then the `type_fn`
//   switch), an inconsequential-in-practice ordering detail (no real template declares
//   a date-shaped aggregate) disclosed here for completeness rather than silently
//   reordered for convenience.
//
// --- `unpack_unit_value`: a `{Unit, NominalValue}` dict lets ANY value (single, list, or
// entity-instance) be paired with a custom `IfcUnit` -- and a REAL, disclosed quirk this
// enables ---
//
// `add_new_properties`'s very first check, `if value is None and self.settings[
// "should_purge"]: continue`, runs on the RAW (still possibly dict-wrapped) value,
// BEFORE `unpack_unit_value` ever unwraps it. So a caller-supplied
// `{"Unit": someUnit, "NominalValue": None}` is NOT `is None` itself (it's a dict) and
// is therefore NEVER skipped by this check, even when `should_purge` is `true` --
// it proceeds all the way through to `add_new_properties`'s final scalar branch, where
// `value is None` skips only the CAST step (`nominal_value = value` i.e. `None`), and an
// `IfcPropertySingleValue` with an explicit `NominalValue=None` (and the given `Unit`)
// is unconditionally created and appended -- REGARDLESS of `should_purge`. This is a
// real, surprising, undisclosed-by-Python's-own-docstring quirk (confirmed by reading
// `add_new_properties` line-by-line, not tested anywhere in `test_edit_pset.py`),
// reproduced verbatim below and pinned by a dedicated original test.
//
// --- Enumerated-value updates: 3 distinct, disclosed paths (`update_existing_prop_enum`) ---
//
// 1. A plain array of raw values: resolves a measure type from (in order) the prop's own
//    existing `EnumerationReference`, else its own existing `EnumerationValues`, else
//    `get_primary_measure_type` on the array's first element -- then creates each new
//    enum value via `file.create_entity(primaryMeasureType, val)` DIRECTLY, with NO cast
//    through `cast_value_to_primary_measure_type` at all (a real, disclosed asymmetry vs.
//    the single-value update path, confirmed by reading `update_existing_prop_enum` in
//    full: it never calls `cast_value_to_primary_measure_type` anywhere).
// 2. An `entity_instance` that `is_a("IfcPropertyEnumeratedValue")`: COPIES that other
//    prop's own `EnumerationValues`/`EnumerationReference` onto `prop` (deep-copying a
//    reference via `util.element.copyDeep` if `prop` doesn't have one yet, in-place
//    field-copying if it already does, or `removeDeep2`-ing `prop`'s own reference if the
//    source has none).
// 3. Anything else: `ValueError`/`Error` -- "not a valid value for enum property".
//
// *** Disclosed, explicit-throw edge case (JS array indexing differs from Python's) ***:
// path 1's empty-array + `should_purge=false` + "prop currently has neither an
// `EnumerationReference` nor `EnumerationValues`" combination (realistically: a prop
// already cleared-but-not-purged by a PRIOR `should_purge=false` edit, then edited again
// with another empty array) hits real Python's own `value[0]` on an empty list --
// `IndexError: list index out of range`, a genuine, if narrow, real Python bug. JS array
// indexing returns `undefined` instead of throwing for this, so this port adds an
// explicit `throw new RangeError("list index out of range")` at the equivalent point,
// to faithfully preserve Python's own crash rather than silently constructing a
// malformed enumeration property. Pinned by a dedicated original test.
//
// Creating a brand NEW enumerated/list-valued property (`add_new_properties`'s own
// `isinstance(value, (tuple, list))` branch), by contrast, REQUIRES a `pset_template`
// match (`P_LISTVALUE` -> `IfcPropertyListValue`; `P_ENUMERATEDVALUE` -> a fresh
// `IfcPropertyEnumeration` + `IfcPropertyEnumeratedValue` pair) -- there is no free-form
// "create a new enum/list prop with no template" path at all (matches real Python's
// `for...else: raise NotImplementedError(f"No template found for property '{name}'")`
// when no matching template entry exists by name, or `NotImplementedError(f"Template
// type '{pset_template.TemplateType}' is not supported yet")` when one exists but isn't
// one of those two types).
//
// --- `get_properties`/`assign_new_properties`: the SAME `HasProperties`/`Properties`/
// `ExtendedProperties` 3-way dispatch `../pset/addPset.ts`/`../pset/removePset.ts` already
// established (`IfcPropertySet` / material-or-profile-properties IFC4+ / IFC2X3
// `IfcExtendedMaterialProperties`) -- but with a genuine, disclosed ASYMMETRY between the
// two functions, confirmed by reading both directly: `get_properties` checks
// `hasattr(pset, "ExtendedProperties")` (true ONLY for `IfcExtendedMaterialProperties`,
// the sole IFC2X3 `IfcMaterialProperties` subclass with a dynamic properties list at
// all), while `assign_new_properties` instead checks `pset.is_a("IfcMaterialProperties")`
// (a SUBTYPE check, true for EVERY IFC2X3 material-properties subclass, including the
// fixed-named-field ones like `IfcMechanicalConcreteMaterialProperties` that have no
// `ExtendedProperties` attribute at all). In practice both cascades produce the same
// outcome for every pset this port's own `addPset` ever constructs (only
// `IfcExtendedMaterialProperties` is ever created for a "generic named properties"
// IFC2X3 material pset) -- this divergence is only live for a caller who hands
// `edit_pset`/`editPset` one of the OTHER, fixed-field IFC2X3 material-properties
// subclasses directly, where `get_properties` would already have thrown its own
// `TypeError` earlier in `update_existing_properties` (called unconditionally, even with
// zero `properties` to edit) before `assign_new_properties` is ever reached -- so this
// asymmetry, while real, is not independently observable in practice. Ported via a
// `tryGetAttr` helper that distinguishes "attribute name doesn't exist on this class at
// all" (throws) from "attribute exists but is currently `null`" (doesn't throw), since
// Python's own `getattr(x, name, ...) is not sentinel` check needs exactly that
// distinction (unlike `addPset.ts`/`removePset.ts`'s simpler `attrOrNull`, which
// deliberately collapses both cases -- fine for THEIR narrower "is this a real value or
// not" use, not for this cascade's "which attribute exists at all" dispatch).
//
// --- Positional attribute order, confirmed against all 3 generated `.d.ts`s directly ---
//
// `IfcPropertySingleValue`: `Name`(0)/`Description`(1, IFC2X3+IFC4)-or-`Specification`(1,
// IFC4X3)/`NominalValue`(2)/`Unit`(3) -- identical INDEX in all 3 schemas (only the
// attribute's NAME at index 1 differs on IFC4X3, and `edit_pset.py` never sets it either
// way -- always passed positionally as `null`/omitted). `IfcPropertyEnumeratedValue`:
// `Name`(0)/`Description-or-Specification`(1, skipped)/`EnumerationValues`(2)/
// `EnumerationReference`(3) -- same story. `IfcPropertyEnumeration`: `Name`(0)/
// `EnumerationValues`(1)/`Unit`(2) -- no `Description`/`Specification` attribute at all,
// identical across all 3 schemas. `IfcPropertyListValue`: `Name`(0)/
// `Description-or-Specification`(1, skipped)/`ListValues`(2)/`Unit`(3) -- same story. No
// DERIVE-attribute interleaving in any of the four, in any schema.

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { getTemplate } from "../../util/pset";
import { wrapUsecase } from "../hooks";

/** A raw, directly-usable property value (as opposed to a list, or a unit-wrapper dict). */
export type PropertyPrimitive = string | number | boolean | Date | EntityInstance;

/**
 * Python: a `dict` value shaped `{"Unit": ..., "NominalValue": ...}` -- pairs an
 * arbitrary custom `IfcUnit` with an otherwise-plain (or list) value. See this file's
 * header comment's `unpack_unit_value` section for a real, disclosed quirk this shape
 * enables (a unit-wrapped `null` bypasses the `should_purge` skip check for NEW
 * properties).
 */
export interface UnitWrappedPropertyValue {
	Unit: EntityInstance;
	NominalValue: PropertyPrimitive | readonly PropertyPrimitive[] | null;
}

/**
 * Python: `properties: Optional[dict[str, Any]]`. See this file's header comment for the
 * full breakdown of every value shape this port actually handles: a plain primitive
 * (auto-typed), an explicit `entity_instance` (either a wrapped simple value, or a whole
 * pre-built `IfcProperty` to assign as-is), an array (enum update, or template-driven
 * list/enum creation), a `{Unit, NominalValue}` wrapper, or `null` (purge or clear,
 * depending on `shouldPurge`).
 */
export type PropertyValue = PropertyPrimitive | readonly PropertyPrimitive[] | UnitWrappedPropertyValue | null;

export interface EditPsetSettings {
	/** The `IfcPropertySet` (or material/profile properties) to edit. */
	pset: EntityInstance;
	/** A new name for the property set. If not specified, the name is not changed. */
	name?: string | null;
	/**
	 * A dictionary of properties. Keys that don't already exist are added; keys that do
	 * are edited. A `null` value purges the property (or, if `shouldPurge` is `false`,
	 * merely clears its value in place) -- see this file's header comment.
	 */
	properties?: Record<string, PropertyValue> | null;
	/**
	 * If provided, used to determine property data types. If not provided, the built-in
	 * buildingSMART templates are consulted by the pset's own `Name`. Unlike
	 * `editQto.ts`'s own confirmed `pset_template` bug, this setting genuinely takes
	 * effect here in both real Python and this port -- see this file's header comment.
	 */
	psetTemplate?: EntityInstance | null;
	/**
	 * If `false`, a property set to `null` is left in place with its value cleared
	 * rather than being removed outright. Defaults to `true` (matching `editQto`'s own
	 * always-purge behavior for quantities, though for properties this is a caller
	 * choice, not an IFC-schema requirement).
	 */
	shouldPurge?: boolean;
}

/** Python's `getattr(x, name, None)` -- collapses "attribute doesn't exist" and "exists but null" (fine where only the VALUE matters, not the distinction). */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

/** Python's `hasattr`-then-`getattr` pair -- unlike `attrOrNull` above, distinguishes "attribute doesn't exist at all" (`found: false`) from "exists but is currently `null`" (`found: true, value: null`), needed by `getProperties`/`assignNewProperties`'s dispatch below. */
function tryGetAttr(instance: EntityInstance, name: string): { found: boolean; value: unknown } {
	try {
		return { found: true, value: instance.get(name) };
	} catch {
		return { found: false, value: undefined };
	}
}

function isUnitWrappedValue(value: unknown): value is UnitWrappedPropertyValue {
	return (
		typeof value === "object" &&
		value !== null &&
		!(value instanceof EntityInstance) &&
		!(value instanceof Date) &&
		!Array.isArray(value) &&
		"NominalValue" in value
	);
}

/** Python (staticmethod): `Usecase.unpack_unit_value`. Returns `[Unit, NominalValue]`, `Unit` falling back to `null`. */
function unpackUnitValue(valueCandidate: PropertyValue): [EntityInstance | null, unknown] {
	if (valueCandidate === null || valueCandidate === undefined) return [null, null];
	if (isUnitWrappedValue(valueCandidate)) {
		return [valueCandidate.Unit, valueCandidate.NominalValue];
	}
	return [null, valueCandidate];
}

/**
 * Python-type-based heuristic tier (the last of `get_primary_measure_type`'s 4 tiers --
 * see header comment). Exported standalone (mirroring `editQto.ts`'s own
 * `inferPropertyType` precedent) so this pure logic remains directly, thoroughly
 * testable independent of this file's own disclosed, currently-blocking primitive-layer
 * gap (see header comment's top section) -- `getPrimaryMeasureType`/this function never
 * themselves call `file.createEntity`, so neither is affected by that gap at all; only
 * the LATER step of actually materializing the resolved type as a real value is.
 */
export function inferPrimaryMeasureType(newValue: EntityInstance | string | number | boolean | Date): string {
	if (newValue instanceof EntityInstance) return newValue.isA();
	if (typeof newValue === "string") return "IfcLabel";
	if (typeof newValue === "boolean") return "IfcBoolean";
	if (typeof newValue === "number") {
		// Disclosed JS int/float representational gap -- see header comment.
		return Number.isInteger(newValue) ? "IfcInteger" : "IfcReal";
	}
	// newValue instanceof Date
	return "IfcDateTime";
}

/**
 * Python: `Usecase.get_primary_measure_type`. See header comment for the full 4-tier
 * resolution order (a different shape than `editQto.ts`'s `getCanonicalPropertyType`).
 * Exported for the same reason as `inferPrimaryMeasureType` above -- pure logic, no
 * `file.createEntity` call, fully testable independent of the disclosed gap.
 */
export function getPrimaryMeasureType(
	psetTemplate: EntityInstance | null,
	name: string,
	oldValue: EntityInstance | null,
	newValue: unknown,
): string | null {
	if (oldValue) return oldValue.isA();

	if (psetTemplate) {
		for (const propTemplate of (psetTemplate.get("HasPropertyTemplates") as EntityInstance[] | null) ?? []) {
			if ((propTemplate.get("Name") as string | null) !== name) continue;
			return (propTemplate.get("PrimaryMeasureType") as string | null) || "IfcLabel";
		}
	}

	if (newValue === null || newValue === undefined) return null;
	if (
		newValue instanceof EntityInstance ||
		typeof newValue === "string" ||
		typeof newValue === "boolean" ||
		typeof newValue === "number" ||
		newValue instanceof Date
	) {
		return inferPrimaryMeasureType(newValue);
	}
	return null;
}

function castPythonInt(value: unknown): number {
	if (typeof value === "boolean") return value ? 1 : 0;
	if (typeof value === "number") return Math.trunc(value);
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!/^[+-]?\d+$/.test(trimmed)) {
			throw new Error(`invalid literal for int() with base 10: '${value}'`);
		}
		return Number.parseInt(trimmed, 10);
	}
	throw new TypeError("int() argument must be a string, a bytes-like object or a real number");
}

function castPythonFloat(value: unknown): number {
	if (typeof value === "boolean") return value ? 1 : 0;
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const trimmed = value.trim();
		const parsed = Number(trimmed);
		if (trimmed === "" || Number.isNaN(parsed)) {
			throw new Error(`could not convert string to float: '${value}'`);
		}
		return parsed;
	}
	throw new TypeError("float() argument must be a string or a real number");
}

function castPythonStr(value: unknown): string {
	// Python: `str(True) == "True"` -- see header comment's disclosed `"LOGICAL"` casing
	// divergence (`String(true) === "true"`).
	if (typeof value === "boolean") return value ? "True" : "False";
	return String(value);
}

/** Python: `Usecase.cast_value_to_primary_measure_type`. See header comment for the disclosed orphan-probe-entity quirk this reproduces verbatim, plus 3 further narrow divergences. */
function castValueToPrimaryMeasureType(file: IfcFile, value: unknown, primaryMeasureType: string): unknown {
	// Reproduces real Python's own throwaway-probe-entity technique -- and its side
	// effect, a genuine permanent orphan left in the file. See header comment.
	const typeStr = file.createEntity(primaryMeasureType).attributeType(0);

	if (typeStr === "AGGREGATE OF DOUBLE") {
		return (value as unknown[]).map((item) => castPythonFloat(item));
	}
	if (typeStr === "AGGREGATE OF INT") {
		return (value as unknown[]).map((item) => castPythonInt(item));
	}
	if (value instanceof Date) {
		return value.toISOString();
	}

	switch (typeStr) {
		case "AGGREGATE OF ENTITY INSTANCE":
			// Python: `list(value)`. Untested by real Python's own suite -- best-effort only.
			if (Array.isArray(value)) return [...value];
			if (typeof value === "string") return value.split("");
			throw new TypeError(`'${typeof value}' object is not iterable`);
		case "BINARY":
			// Python: `bytes(value)`. No faithful equivalent primitive exists in this port --
			// see header comment. Best-effort raw passthrough.
			return value;
		case "LOGICAL":
			return castPythonStr(value);
		case "BOOL":
			return Boolean(value);
		case "INT":
			return castPythonInt(value);
		case "DOUBLE":
			return castPythonFloat(value);
		case "STRING":
			return castPythonStr(value);
		default:
			// Python: `KeyError` for an unmapped `type_str` (not expected to occur for any
			// real `primary_measure_type`, since that's always a wrapped-simple-value class).
			throw new Error(`'${typeStr}'`);
	}
}

/** Python: `Usecase._try_purge`. See header comment for the full `should_purge` semantics. */
function tryPurge(
	file: IfcFile,
	prop: EntityInstance,
	properties: Map<string, PropertyValue>,
	shouldPurge: boolean,
): boolean {
	if (!shouldPurge) return false;
	properties.delete(prop.get("Name") as string);
	file.remove(prop);
	return true;
}

/** Python: `Usecase.update_existing_prop_single_value`. */
function updateExistingPropSingleValue(
	file: IfcFile,
	psetTemplate: EntityInstance | null,
	prop: EntityInstance,
	properties: Map<string, PropertyValue>,
	shouldPurge: boolean,
): EntityInstance | null {
	const name = prop.get("Name") as string;
	const [unit, value] = unpackUnitValue(properties.get(name) ?? null);

	if (value === null) {
		if (tryPurge(file, prop, properties, shouldPurge)) return null;
		prop.set("NominalValue", null);
	} else if (value instanceof EntityInstance) {
		prop.set("NominalValue", value);
	} else {
		const oldValue = prop.get("NominalValue") as EntityInstance | null;
		const primaryMeasureType = getPrimaryMeasureType(psetTemplate, name, oldValue, value);
		const casted = castValueToPrimaryMeasureType(file, value, primaryMeasureType as string);
		prop.set("NominalValue", file.createEntity(primaryMeasureType as string, casted));
	}
	if (unit) prop.set("Unit", unit);
	properties.delete(name);
	return prop;
}

/** Python: `Usecase.update_existing_prop_enum`. See header comment for the 3 distinct value paths and the disclosed empty-array `IndexError` edge case. */
function updateExistingPropEnum(
	file: IfcFile,
	psetTemplate: EntityInstance | null,
	prop: EntityInstance,
	properties: Map<string, PropertyValue>,
	shouldPurge: boolean,
): EntityInstance | null {
	const name = prop.get("Name") as string;
	const rawValue = properties.get(name) ?? null;
	const [unit, value] = unpackUnitValue(rawValue);

	if (Array.isArray(value)) {
		if (value.length === 0 && tryPurge(file, prop, properties, shouldPurge)) return null;

		let primaryMeasureType: string;
		const reference = prop.get("EnumerationReference") as EntityInstance | null;
		const existingEnumValues = prop.get("EnumerationValues") as EntityInstance[] | null;
		if (reference) {
			primaryMeasureType = (reference.get("EnumerationValues") as EntityInstance[])[0].isA();
		} else if (existingEnumValues?.length) {
			primaryMeasureType = existingEnumValues[0].isA();
		} else {
			if (value.length === 0) {
				// Python: `value[0]` -- a real `IndexError` here. See header comment.
				throw new RangeError("list index out of range");
			}
			const inferred = getPrimaryMeasureType(psetTemplate, name, null, value[0]);
			if (!inferred) {
				throw new Error(`Couldn't find primary measure type for the prop value: '${String(value[0])}'.`);
			}
			primaryMeasureType = inferred;
		}

		// No cast through `castValueToPrimaryMeasureType` here -- a real, disclosed
		// asymmetry vs. the single-value update path above. See header comment.
		const selVals = (value as unknown[]).map((val) => file.createEntity(primaryMeasureType, val));
		prop.set("EnumerationValues", selVals.length ? selVals : null);
	} else if (value instanceof EntityInstance && value.isA("IfcPropertyEnumeratedValue")) {
		const valueEnumValues = value.get("EnumerationValues") as EntityInstance[] | null;
		if (valueEnumValues === null && tryPurge(file, prop, properties, shouldPurge)) return null;
		prop.set("EnumerationValues", valueEnumValues);

		const valueReference = value.get("EnumerationReference") as EntityInstance | null;
		const propReference = prop.get("EnumerationReference") as EntityInstance | null;
		if (valueReference === null) {
			if (propReference) elementUtil.removeDeep2(file, propReference);
			prop.set("EnumerationReference", null);
		} else if (propReference === null) {
			prop.set("EnumerationReference", elementUtil.copyDeep(file, valueReference));
		} else {
			propReference.set("Name", valueReference.get("Name"));
			propReference.set("EnumerationValues", valueReference.get("EnumerationValues"));
			propReference.set("Unit", valueReference.get("Unit"));
		}
	} else {
		throw new Error(`Value "${String(rawValue)}" is not a valid value for enum property ${name}.`);
	}

	if (unit) prop.set("Unit", unit);
	properties.delete(name);
	return prop;
}

/**
 * Creates a NEW list-valued (`P_LISTVALUE`) or enumerated (`P_ENUMERATEDVALUE`) property
 * from a `pset_template` match -- the `isinstance(value, (tuple, list))` branch of
 * Python's `Usecase.add_new_properties`. Requires a template match by name; see header
 * comment.
 */
function createListOrEnumProperty(
	file: IfcFile,
	psetTemplate: EntityInstance | null,
	name: string,
	value: readonly unknown[],
	unit: EntityInstance | null,
): EntityInstance {
	const propTemplates = (psetTemplate as EntityInstance).get("HasPropertyTemplates") as EntityInstance[];
	for (const propTemplate of propTemplates) {
		if ((propTemplate.get("Name") as string | null) !== name) continue;

		const templateType = propTemplate.get("TemplateType") as string;
		if (templateType === "P_LISTVALUE") {
			const ifcClass = attrOrNull(propTemplate, "PrimaryMeasureType") as string | null;
			if (ifcClass === null) {
				throw new Error(`pset template '${propTemplate.get("Name")}' is missing PrimaryMeasureType`);
			}
			const listValues = value.map((v) => file.createEntity(ifcClass, v));
			// IfcPropertyListValue: Name(0), Description/Specification(1, skipped),
			// ListValues(2), Unit(3) -- identical index in all 3 schemas.
			return file.createEntity("IfcPropertyListValue", name, null, listValues, unit);
		}

		if (templateType === "P_ENUMERATEDVALUE") {
			const enumerators = propTemplate.get("Enumerators") as EntityInstance;
			// IfcPropertyEnumeration: Name(0), EnumerationValues(1), Unit(2) -- identical
			// index in all 3 schemas.
			const propEnum = file.createEntity("IfcPropertyEnumeration", name, enumerators.get("EnumerationValues"), unit);
			const primaryMeasureType = propTemplate.get("PrimaryMeasureType") as string;
			const enumerationValues = value.map((v) => file.createEntity(primaryMeasureType, v));
			// IfcPropertyEnumeratedValue: Name(0), Description/Specification(1, skipped),
			// EnumerationValues(2), EnumerationReference(3) -- identical index in all 3
			// schemas.
			return file.createEntity("IfcPropertyEnumeratedValue", name, null, enumerationValues, propEnum);
		}

		throw new Error(`Template type '${templateType}' is not supported yet`);
	}
	throw new Error(`No template found for property '${name}'`);
}

/** Python: `Usecase.add_new_properties`. See header comment for the disclosed `null`+unit-wrapper quirk. */
function addNewProperties(
	file: IfcFile,
	psetTemplate: EntityInstance | null,
	properties: Map<string, PropertyValue>,
	shouldPurge: boolean,
): EntityInstance[] {
	const created: EntityInstance[] = [];
	for (const [name, rawValue] of properties) {
		// This check runs on the RAW value, BEFORE unwrapping a unit-wrapper dict -- see
		// header comment's disclosed quirk (`{Unit, NominalValue: null}` is NOT skipped
		// here even when `shouldPurge` is true, since it isn't itself strictly `null`).
		if (rawValue === null && shouldPurge) continue;
		const [unit, value] = unpackUnitValue(rawValue);

		if (value instanceof EntityInstance) {
			if (value.isA("IfcProperty")) {
				created.push(value);
			} else if (!value.isEntity()) {
				// IfcPropertySingleValue: Name(0), Description/Specification(1, skipped),
				// NominalValue(2), Unit(3).
				created.push(file.createEntity("IfcPropertySingleValue", name, null, value, unit));
			} else {
				throw new Error(`${value.isA()} cannot be assigned to the property set '${name}'`);
			}
		} else if (Array.isArray(value)) {
			if (value.length === 0) continue;
			created.push(createListOrEnumProperty(file, psetTemplate, name, value, unit));
		} else {
			const primaryMeasureType = getPrimaryMeasureType(psetTemplate, name, null, value);
			let nominalValue: unknown = null;
			if (value !== null) {
				const casted = castValueToPrimaryMeasureType(file, value, primaryMeasureType as string);
				nominalValue = file.createEntity(primaryMeasureType as string, casted);
			}
			created.push(file.createEntity("IfcPropertySingleValue", name, null, nominalValue, unit));
		}
	}
	return created;
}

/** Python: `Usecase.get_properties`. See header comment for the `hasattr`-cascade dispatch and its asymmetry with `assignNewProperties`. */
function getProperties(pset: EntityInstance): EntityInstance[] {
	let result = tryGetAttr(pset, "HasProperties");
	if (result.found) return (result.value as EntityInstance[] | null) ?? [];
	result = tryGetAttr(pset, "Properties");
	if (result.found) return (result.value as EntityInstance[] | null) ?? [];
	result = tryGetAttr(pset, "ExtendedProperties");
	if (result.found) return (result.value as EntityInstance[] | null) ?? [];
	throw new TypeError(`'${pset.isA()}' is not a valid pset`);
}

/** Python: `Usecase.assign_new_properties`. See header comment for the disclosed asymmetry with `getProperties`. */
function assignNewProperties(pset: EntityInstance, props: EntityInstance[]): void {
	if (tryGetAttr(pset, "HasProperties").found) {
		pset.set("HasProperties", props);
		return;
	}
	if (tryGetAttr(pset, "Properties").found) {
		pset.set("Properties", props);
		return;
	}
	if (pset.isA("IfcMaterialProperties")) {
		pset.set("ExtendedProperties", props);
	}
	// Python: no final `else`/`raise` here -- a silent no-op if none of the three match,
	// realistically unreachable since `getProperties` (called earlier, unconditionally)
	// would already have thrown for the same `pset`. See header comment.
}

function editPsetUsecase(file: IfcFile, settings: EditPsetSettings): void {
	const { pset, name } = settings;
	const shouldPurge = settings.shouldPurge ?? true;

	if (name) pset.set("Name", name);

	const psetTemplate =
		settings.psetTemplate ?? getTemplate(file.schemaIdentifier).getByName((pset.get("Name") as string | null) ?? "");

	// Mutable working copy -- entries are deleted as existing properties consume them,
	// matching Python's own `del self.settings["properties"][name]` mutation of the same
	// dict `add_new_properties` later iterates.
	const properties = new Map<string, PropertyValue>(Object.entries(settings.properties ?? {}));

	const existingProps: EntityInstance[] = [];
	for (const prop of getProperties(pset)) {
		const propName = prop.get("Name") as string;
		if (!properties.has(propName)) {
			existingProps.push(prop);
			continue;
		}

		if (file.getTotalInverses(prop) > 1) {
			// Shared property -- treated as a new property below instead, to avoid mutating
			// an entity some OTHER pset/product also references. See header comment.
			continue;
		}

		let updated: EntityInstance | null;
		if (prop.isA("IfcPropertyEnumeratedValue")) {
			updated = updateExistingPropEnum(file, psetTemplate, prop, properties, shouldPurge);
		} else if (prop.isA("IfcPropertySingleValue")) {
			updated = updateExistingPropSingleValue(file, psetTemplate, prop, properties, shouldPurge);
		} else {
			throw new Error(`Updating '${prop.isA()}' properties is not supported yet`);
		}
		if (updated) existingProps.push(updated);
	}

	const newProps = addNewProperties(file, psetTemplate, properties, shouldPurge);
	assignNewProperties(pset, [...existingProps, ...newProps]);
}

/**
 * Edits a property set and its properties (Python: `ifcopenshell.api.pset.edit_pset`).
 *
 * At its simplest usage, this may be used to edit the name of a property set. It may
 * also be used to add, edit, or remove properties, either arbitrarily or using a
 * property set template.
 *
 * A "None"/`null` value may specify a property to be deleted -- or, if `shouldPurge` is
 * `false`, merely cleared in place, keeping the property object itself. See this file's
 * header comment for the full set of disclosed Python quirks this port faithfully
 * reproduces (a shared property is never mutated in place; a unit-wrapped `null` value
 * bypasses the `shouldPurge` skip for new properties; an orphan probe entity is left in
 * the file for every plain-value property write; and more).
 *
 * **Currently blocked for plain (`string`/`number`/`boolean`/`Date`) property values**,
 * for both new and existing properties, by a real, pre-existing, already-disclosed
 * primitive-layer gap (see this file's own header comment's top section, and
 * `api/unit/addConversionBasedUnit.ts`'s identical, independently-confirmed situation):
 * this port cannot yet materialize a brand-new typed value (e.g. an `IfcLabel`) from a
 * raw JS scalar. Renaming a pset, purging/clearing an existing property, and assigning
 * an already-built `entity_instance` value (to a new or existing property) all remain
 * fully functional.
 *
 * @example
 * ```ts
 * const wallType = api.root.createEntity(model, { ifcClass: "IfcWallType" });
 * const pset = api.pset.addPset(model, { product: wallType, name: "Pset_WallCommon" });
 *
 * // No psetTemplate needed -- it's a built-in buildingSMART template.
 * api.pset.editPset(model, { pset, properties: { FireRating: "2HR", ThermalTransmittance: 42.3 } });
 *
 * // Setting to null deletes the property by default (shouldPurge defaults to true)...
 * api.pset.editPset(model, { pset, properties: { Combustible: null } });
 * // ...unless shouldPurge is explicitly false, which clears the value but keeps the property.
 * api.pset.editPset(model, { pset, properties: { Combustible: null }, shouldPurge: false });
 * ```
 */
export const editPset = wrapUsecase("pset.edit_pset", editPsetUsecase);
