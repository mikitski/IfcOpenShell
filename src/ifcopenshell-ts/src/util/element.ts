// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/element.py` (src/ifcopenshell-python) --
// planning/ifcopenshell-ts/research/03-python-util-inventory.md's "element.py" entry,
// "Porting priority suggestion" section (element.py is Tier A, do-first, ported ahead
// of everything else in `util` since most of it depends on this module). This is
// **chunk 3 of 3** (the final chunk) for `element.py` (2009 lines, ~67 functions -- too
// large for one PR, matching this project's own chunk-size discipline). Chunk 1 (below)
// ported the property-set/quantity-set and type/material/style query functions; chunk 2
// (below that) ported the spatial/structural-graph query functions; chunk 3 (this PR,
// appended at the end of the file) ports the structural-editing helpers. Once this
// lands, `element.py` is fully ported.
//
// Ported in chunk 1:
// - Psets/Qtos: get_pset, get_psets, get_property_definition, get_quantity,
//   get_quantities, get_property, get_properties, get_elements_by_pset, has_property.
// - Type/material/style: get_predefined_type, is_userdefined_type, get_type, get_types,
//   get_material, get_materials, get_material_layers, get_material_profiles, get_styles,
//   get_elements_by_material, get_elements_by_style, get_elements_by_representation.
//
// Ported in chunk 2 (spatial/structural-graph queries -- see that section's own header
// comment below for scope-inclusion notes on `get_controls`):
// - get_container, get_referenced_structures, get_structure_referenced_elements,
//   get_decomposition, get_grouped_by, get_groups, get_controls, get_parent,
//   get_filled_void, get_voided_element, get_adhered_element, get_aggregate, get_nest,
//   get_parts, get_contained, get_components, get_openings, has_openings.
//
// Ported in chunk 3 (structural-editing helpers -- see that section's own header
// comment, near the end of this file, for the full story: two genuine, disclosed
// primitive gaps found while building this chunk, both worked around without adding a
// new native primitive):
// - copy, copyDeep, removeDeep, removeDeep2, batchRemoveDeep2, unbatchRemoveDeep2,
//   replaceElement, replaceAttribute, plus the private helpers they depend on
//   (isSetAttribute/hasElementReference, matching Python's own `_is_set_attribute`/
//   `has_element_reference`).
//
// Explicitly NOT in this chunk's scope (see the task brief this was built from):
// `get_shape_aspects` (calls `ifcopenshell.util.representation`, a not-yet-ported Tier B
// module) and `get_referenced_elements` (see chunk 2's header comment below for why) --
// both remain unported; every other function in `element.py` is now ported across
// chunks 1-3.
//
// Two real, disclosed findings surfaced while building this chunk (both flagged in this
// chunk's PR description/final report, neither "fixed" by adding a new native primitive
// or porting an out-of-scope module -- per this chunk's own explicit instructions):
//
// 1. `get_styles` (IN this chunk's scope) transitively calls
//    `ifcopenshell.util.representation.get_representation(element, "Model", "Body",
//    "MODEL_VIEW")` -- a Tier B module (20-roadmap.md Phase 4), not yet ported. This
//    contradicts this chunk's own task brief, which asserted no in-scope function needs
//    `util.representation`. Rather than porting that module's general API (scope creep)
//    or silently dropping half of `get_styles`' behavior, `findBodyRepresentation` below
//    is a narrow, non-exported, disclosed local re-implementation of exactly the one
//    fixed-argument lookup `get_styles` needs -- not a stand-in for a real
//    `util.representation` port, which Phase 4 will still need to do properly.
//
// 2. CORRECTED 2026-09-10 (`ts/phase-3-element-nominal-unwrap-fix`; the paragraph below
//    is what this chunk originally believed, kept for the record -- see that PR's final
//    report for the full investigation): the N-API attribute-value shim does NOT
//    blanket-auto-unwrap `IfcValue`-typed attributes (`IfcPropertySingleValue
//    .NominalValue`/`IfcPropertyEnumeratedValue.EnumerationValues`/`IfcPropertyListValue
//    .ListValues`, all declared as the EXPRESS SELECT `IfcValue`). Whether
//    `.getByIndex(2)` comes back as an already-bare JS primitive or a wrapped
//    `EntityInstance` depends entirely on how the value was *written*, exactly like
//    Python's own SWIG binding: a bare `.set("NominalValue", <primitive>)` call
//    (`entityInstance.ts`'s `valueToVariant`) stores a raw scalar attribute with no type
//    info attached, so it reads back unwrapped -- this is what `element.test.ts`'s
//    fixture helpers use, which is why this chunk's own tests didn't catch the bug
//    below. A *properly-created* typed-instance value -- what real SPF text always
//    produces -- stores a real entity reference instead, which `entityInstance.ts`'s
//    `wrapValue` wraps in an `EntityInstance` on read, exactly like Python's nested
//    `entity_instance` wrapper requiring `.wrappedValue`. (Building such a value
//    directly in this port, for a test fixture, can't go through
//    `file.createEntity("IfcLabel", ...)` -- confirmed empirically while building this
//    fix's own tests: that throws, a real, pre-existing Phase 2 gap already disclosed in
//    `entityInstance.ts`'s own header comment -- attribute access, including
//    `.setByIndex`'s `attribute_kind_of` lookup, isn't supported on a standalone
//    non-entity/defined-type instance. `element.test.ts`'s `createTypedValue` helper
//    works around this the same way `test/native/primitives.test.ts` already does:
//    building the instance via the raw native layer directly, which has no such
//    restriction.) `getProperty`/`getProperties` originally read
//    `.getByIndex(2)` and used it directly as the final value -- correct only for the
//    bare-primitive case, silently wrong (returning a raw `EntityInstance` object
//    instead of its scalar) for the realistic typed-instance case. Fixed by this PR:
//    `unwrapSelectValue`/`selectValueType` (below) mirror Python's `v.wrappedValue`/
//    `v.is_a()` -- unwrap via `.getByIndex(0)` (a declared-type instance stores its
//    single value at attribute index 0) and read `.isA()` for the real EXPRESS type
//    name, both only when the raw value is actually an `EntityInstance`; a bare
//    primitive (or `null`) passes through unchanged with `value_type: null`, since
//    there's genuinely no type name to recover in that case. `getQuantity`/
//    `getQuantities` (`IfcPhysicalSimpleQuantity.XXXValue`, e.g. `LengthValue`) do NOT
//    have this bug: that attribute's declared type is a concrete defined type (e.g.
//    `IfcLengthMeasure`) directly, not the `IfcValue` SELECT, so P21/the core never
//    needs a type-tagging wrapper instance for it in the first place -- confirmed against
//    Python's own `get_quantity`/`get_quantities`, which read `quantity[3]` with no
//    `.wrappedValue` call either.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { AttributeCategory, EntityInstance } from "../entityInstance";
import { IfcFile } from "../file";
import * as guid from "../guid";
import { native } from "../native/native_loader";

/** Python: `MATERIAL_TYPE = Literal[...]` (module-level constant in element.py). */
export type MaterialType =
	| "IfcMaterial"
	| "IfcMaterialConstituentSet"
	| "IfcMaterialLayerSet"
	| "IfcMaterialLayerSetUsage"
	| "IfcMaterialProfileSet"
	| "IfcMaterialProfileSetUsage"
	| "IfcMaterialList";

/**
 * Python: `PrioritisedLayer = namedtuple("PrioritisedLayer", "priority material
 * thickness")`. TS has no direct namedtuple equivalent (a positionally-indexable,
 * named-field tuple); ported as a plain readonly object with the same field names --
 * `layer.priority`/`.material`/`.thickness`, not `layer[0]`/`[1]`/`[2]`.
 */
export interface PrioritisedLayer {
	readonly priority: number;
	readonly material: EntityInstance | null;
	readonly thickness: number | null;
}

/** Python: `PrioritisedProfile = namedtuple("PrioritisedProfile", "priority material profile")`. */
export interface PrioritisedProfile {
	readonly priority: number;
	readonly material: EntityInstance | null;
	readonly profile: EntityInstance | null;
}

// --- internal helpers (not exported -- pure translation aids, no Python counterpart) ---

/** Python's `x or []` / `getattr(el, name, ()) ` idiom for a possibly-`null` array attribute. */
function arr<T>(value: readonly T[] | null | undefined): readonly T[] {
	return value ?? [];
}

const MISSING: unique symbol = Symbol("ifcopenshell.util.element: attribute not declared on this class");

/**
 * Python's `getattr(element, name, <sentinel>)`, distinguishing "attribute not declared
 * on this class" (returns `MISSING`, mirroring Python's `AttributeError` -> default)
 * from "attribute declared but unset/empty" (returns whatever `.get()` returned, e.g.
 * `null` or `[]`) -- both `EntityInstance.get()` and Python's real `__getattr__` throw
 * only in the former case.
 */
function attrOrMissing(element: EntityInstance, name: string): unknown {
	try {
		return element.get(name);
	} catch {
		return MISSING;
	}
}

/** Python's `getattr(element, name, None)`. */
function attrOrNull(element: EntityInstance, name: string): unknown {
	const value = attrOrMissing(element, name);
	return value === MISSING ? null : value;
}

/**
 * Python's `v.wrappedValue` for a `NominalValue`/`EnumerationValues`-element/
 * `ListValues`-element read back via `.getByIndex(2)` -- see this file's header comment
 * (point 2) for the full story. Whether the raw value comes back as an already-bare JS
 * primitive or a wrapped `EntityInstance` depends entirely on how it was *written*, not
 * on anything this port controls: a bare `.set(name, <primitive>)`/`.setByIndex(...)`
 * call (`entityInstance.ts`'s `valueToVariant`) stores a raw scalar attribute with no
 * type info attached, which `wrapValue` then passes through unchanged on read; a
 * properly-created typed-instance value (what real SPF text and any
 * `ifcopenshell.api`-style write path produce -- see `element.test.ts`'s
 * `createTypedValue` helper for how this port itself builds one, since
 * `file.createEntity("IfcLabel", ...)` doesn't work for a standalone defined-type
 * instance, a separate pre-existing gap) stores an actual entity reference, which
 * `wrapValue` wraps in an `EntityInstance` on read. Only the latter case needs
 * unwrapping; the former is already the final scalar.
 */
function unwrapSelectValue(raw: unknown): unknown {
	return raw instanceof EntityInstance ? raw.getByIndex(0) : raw;
}

/**
 * Python's `v.is_a()` on a `NominalValue` value -- the wrapped value's real EXPRESS
 * type name (e.g. `"IfcLabel"`), recoverable only when `raw` is a real typed-instance
 * `EntityInstance` wrapper (see `unwrapSelectValue` above for when that is/isn't the
 * case). `null` for an already-bare primitive (or `null` itself) -- there is genuinely
 * no type name to recover in that case, not a limitation of this helper.
 */
function selectValueType(raw: unknown): string | null {
	return raw instanceof EntityInstance ? raw.isA() : null;
}

/**
 * Python's `getattr(element, name, ())` for a list/set-valued (forward or inverse)
 * attribute, always returning an array -- collapses "not declared on this class",
 * "declared but unset" (`null`), and "declared and empty" (`[]`) into the same `[]`,
 * matching every one of this module's own `getattr(x, name, ()) ` call sites (Python
 * truthiness of `()`/`None` is identical here, so the three-way distinction doesn't
 * matter for any of them -- only `[MISSING]`-vs-not matters for `IsDefinedBy`'s own
 * "is not None" check in `get_pset`/`get_psets`, which uses `attrOrMissing` directly).
 */
function attrList(element: EntityInstance, name: string): EntityInstance[] {
	const value = attrOrNull(element, name);
	return value === null ? [] : (value as EntityInstance[]);
}

/**
 * Python's `del data[key]`. This module's several `getInfo()`-then-`del` translations
 * (mirroring `del data["Unit"]`/`del data["HasProperties"]`/etc.) need the key genuinely
 * absent afterward (matching Python dict semantics), not merely set to `undefined` --
 * `delete` is the correct, intentional choice here, not an oversight.
 */
function deleteKey(obj: Record<string, unknown>, key: string): void {
	delete obj[key];
}

/** Python's `a == b` for two (possibly-`null`) `entity_instance`s -- see `EntityInstance.equals`. */
function entityEquals(a: EntityInstance | null | undefined, b: EntityInstance | null | undefined): boolean {
	if (!a || !b) return a === b;
	return a.equals(b);
}

/**
 * Python's `definition.attribute_name(i)` for a real forward attribute index `i`
 * (`entity_instance_mixin` exposes this via SWIG; this chunk's TS `EntityInstance` has
 * no direct equivalent method, so this resolves it via the same attribute-metadata
 * cache backing the attribute `Proxy` (`entityInstance.ts`/`attributeCache.ts`,
 * Phase 2) -- `_resolveTypeInfo()` is the same cache lookup the Proxy's own `get`/`set`
 * traps use, not a new primitive.
 */
function attributeNameAt(entity: EntityInstance, index: number): string {
	const meta = entity
		._resolveTypeInfo()
		.cache.list.find((m) => m.category === AttributeCategory.FORWARD && m.index === index);
	if (!meta) {
		throw new Error(`No forward attribute at index ${index} for instance of type '${entity.isA()}'`);
	}
	return meta.name;
}

/**
 * Python's `results = set()` / `elements.update(...)` idiom, but keyed by
 * `EntityInstance.identity()` rather than relying on JS `Set`'s reference-equality
 * membership test -- the N-API primitive layer mints a fresh wrapper object on every
 * accessor call (`research/07-fresh-wrapper-per-access.md`, already the reason
 * `file.ts`'s own `getInverse`/`dedupeByIdentity` exists), so two wrappers of the
 * literal same underlying instance are never `===`; a plain `Set<EntityInstance>`
 * accumulator would silently fail to dedupe the way Python's real `set()` (hashing by
 * identity) does. Not exported -- an internal implementation detail of this module's
 * several `set()`-returning functions, converted to a real `Set<EntityInstance>` (this
 * project's established convention for a Python `set()`-returning function, matching
 * `IfcFile.getInverse`'s own default-`allowDuplicate=false` return shape) only at the
 * end via `toSet()`.
 *
 * `add`/`update` tolerate a `null`/`undefined` member: a real Python `set()` happily
 * accepts `None` as a member (e.g. `getElementsByPset`, chunk 1, calling
 * `elements.add(pset.get("ProfileDefinition"))`/`.add(pset.get("Material"))` against an
 * `IfcProfileProperties`/`IfcMaterialProperties` whose mandatory attribute hasn't been
 * set yet -- an edge case, but not one Python itself guards against). `Set<EntityInstance>`
 * has no `null` member to match that with, so this silently drops the null instead of
 * crashing on `instance.identity()` -- a disclosed, narrow divergence (found during this
 * chunk's `/code-review` pass; fixed here, in the shared helper, rather than chunk 1's
 * `getElementsByPset` itself, since every `set()`-returning function in this module --
 * chunk 2's included -- goes through this same class).
 */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}

	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}

	/**
	 * Added in chunk 3 (`removeDeep2`'s `do_not_delete`/`subgraph_set`/`to_delete`
	 * membership tests -- Python's `subelement not in do_not_delete`/`e in to_delete`
	 * idiom, which for a real Python `set()` is a hash-by-identity lookup, exactly what
	 * this class already backs every other `set()`-returning function in this module
	 * with). Not used by any chunk 1/2 function -- both were add-only.
	 */
	has(instance: EntityInstance | null | undefined): boolean {
		if (!instance) return false;
		return this.byIdentity.has(instance.identity());
	}

	/** Added in chunk 3 (`removeDeep2`'s deletion loop: `to_delete.remove(subelement)`). */
	delete(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.delete(instance.identity());
	}

	toSet(): Set<EntityInstance> {
		return new Set(this.byIdentity.values());
	}
}

// --- Psets / Qtos ---

/**
 * Python: `get_pset(element, name, prop=None, psets_only=False, qtos_only=False,
 * should_inherit=True, verbose=False)`.
 *
 * Retrieve a single property set or single property. If `shouldInherit` is true, the
 * pset "id" only refers to the ID of the occurrence, not the type's pset.
 */
export function getPset(
	element: EntityInstance,
	name: string,
	prop: string | null = null,
	psetsOnly = false,
	qtosOnly = false,
	shouldInherit = true,
	verbose = false,
): unknown {
	let pset: EntityInstance | null = null;
	let typePset: Record<string, unknown> | null = null;
	const ifcFile = element.file as IfcFile;
	const isIfc2x3 = ifcFile.schema === "IFC2X3";

	if (element.isA("IfcTypeObject")) {
		for (const definition of attrList(element, "HasPropertySets")) {
			if ((definition.get("Name") as string | null) === name) {
				pset = definition;
				break;
			}
		}
	} else {
		const isIfc2x3Material = isIfc2x3 && element.isA("IfcMaterial");
		const isProfile = element.isA("IfcProfileDef");
		if (isIfc2x3Material || element.isA("IfcMaterialDefinition") || isProfile) {
			if (isIfc2x3Material) {
				// Support extended props as they do have a name.
				for (const definition of ifcFile.byType("IfcExtendedMaterialProperties")) {
					if (
						entityEquals(definition.get("Material") as EntityInstance | null, element) &&
						(definition.get("Name") as string | null) === name
					) {
						pset = definition;
						break;
					}
				}
			} else if (isIfc2x3 && isProfile) {
				// Don't support them as they don't have a name.
			} else {
				// IfcProfileDef or IfcMaterialDefinition, IFC4+.
				for (const definition of attrList(element, "HasProperties")) {
					if ((definition.get("Name") as string | null) === name) {
						pset = definition;
						break;
					}
				}
			}
		} else {
			const isDefinedBy = attrOrMissing(element, "IsDefinedBy");
			if (isDefinedBy !== MISSING) {
				// other IfcObjectDefinition
				if (shouldInherit) {
					const elementType = getType(element);
					if (elementType) {
						typePset = getPset(elementType, name, prop, false, false, false, verbose) as Record<string, unknown> | null;
					}
				}
				for (const relationship of isDefinedBy as EntityInstance[]) {
					if (relationship.isA("IfcRelDefinesByProperties")) {
						const relatingPropertyDefinition = relationship.get("RelatingPropertyDefinition");
						// IfcPropertySetDefinitionSet is a defined type wrapping a list of
						// property set definitions -- Python unpacks it via `.wrappedValue`.
						// The N-API shim auto-unwraps a SELECT-typed attribute set this way
						// directly to a plain JS array (confirmed empirically against the
						// built addon), so a plain `Array.isArray` check does the same job
						// here without needing `.wrappedValue` (which, per this file's header
						// comment, isn't supported for non-entity/defined-type instances
						// anyway).
						const definitions: EntityInstance[] = Array.isArray(relatingPropertyDefinition)
							? (relatingPropertyDefinition as EntityInstance[])
							: [relatingPropertyDefinition as EntityInstance];
						pset = definitions.find((d) => (d.get("Name") as string | null) === name) ?? null;
						if (pset) break;
					}
				}
			}
		}
	}

	if (pset) {
		if (
			psetsOnly &&
			!pset.isA("IfcPropertySet") &&
			!pset.isA("IfcPreDefinedPropertySet") &&
			!(isIfc2x3 && pset.isA("IfcExtendedMaterialProperties"))
		) {
			pset = null;
		} else if (qtosOnly && !pset.isA("IfcElementQuantity")) {
			pset = null;
		}
	}

	if (typePset !== null && !prop) {
		if (psetsOnly || qtosOnly) {
			const typePsetElement = ifcFile.byId(typePset.id as number);
			if (psetsOnly && !typePsetElement.isA("IfcPropertySet") && !typePsetElement.isA("IfcPreDefinedPropertySet")) {
				typePset = null;
			} else if (qtosOnly && !typePsetElement.isA("IfcElementQuantity")) {
				typePset = null;
			}
		}
	}

	if (pset === null && typePset === null) return null;

	if (!prop) {
		if (typePset) {
			const occurrencePset = getPropertyDefinition(pset, null, verbose) as Record<string, unknown> | null;
			if (occurrencePset) {
				Object.assign(typePset, occurrencePset);
			}
			return typePset;
		}
		return getPropertyDefinition(pset, null, verbose);
	}

	const value = getPropertyDefinition(pset, prop, verbose);
	if (value === null && typePset !== null) return typePset;
	return value;
}

/**
 * Python: `get_psets(element, psets_only=False, qtos_only=False, should_inherit=True,
 * verbose=False)`.
 *
 * Retrieve property sets, their related properties' names & values and ids.
 */
export function getPsets(
	element: EntityInstance,
	psetsOnly = false,
	qtosOnly = false,
	shouldInherit = true,
	verbose = false,
): Record<string, Record<string, unknown>> {
	const ifcFile = element.file as IfcFile;
	const isIfc2x3 = ifcFile.schema === "IFC2X3";
	let psets: Record<string, Record<string, unknown>> = {};

	function addDefinition(definition: EntityInstance): void {
		const name = definition.get("Name") as string;
		const existing = psets[name] ?? {};
		Object.assign(existing, getPropertyDefinition(definition, null, verbose) as Record<string, unknown>);
		psets[name] = existing;
	}

	if (element.isA("IfcTypeObject")) {
		for (const definition of attrList(element, "HasPropertySets")) {
			if (psetsOnly && !definition.isA("IfcPropertySet") && !definition.isA("IfcPreDefinedPropertySet")) continue;
			if (qtosOnly && !definition.isA("IfcElementQuantity")) continue;
			addDefinition(definition);
		}
	} else {
		const isIfc2x3Material = isIfc2x3 && element.isA("IfcMaterial");
		// NOTE: doesn't account for IFC2X3 missing HasProperties -- matches Python's own comment.
		if (isIfc2x3Material || element.isA("IfcMaterialDefinition") || element.isA("IfcProfileDef")) {
			let definitions: EntityInstance[];
			if (isIfc2x3) {
				definitions = isIfc2x3Material
					? ifcFile
							.byType("IfcExtendedMaterialProperties")
							.filter((d) => entityEquals(d.get("Material") as EntityInstance | null, element))
					: []; // Ignoring profiles as they don't have names.
			} else {
				definitions = attrList(element, "HasProperties");
			}
			for (const definition of definitions) {
				if (qtosOnly) continue;
				addDefinition(definition);
			}
		} else {
			const isDefinedBy = attrOrMissing(element, "IsDefinedBy");
			if (isDefinedBy !== MISSING) {
				// other IfcObjectDefinition
				if (shouldInherit) {
					const elementType = getType(element);
					if (elementType) {
						psets = getPsets(elementType, psetsOnly, qtosOnly, false, verbose);
					}
				}
				for (const relationship of isDefinedBy as EntityInstance[]) {
					if (relationship.isA("IfcRelDefinesByProperties")) {
						const relatingPropertyDefinition = relationship.get("RelatingPropertyDefinition");
						const definitions: EntityInstance[] = Array.isArray(relatingPropertyDefinition)
							? (relatingPropertyDefinition as EntityInstance[])
							: [relatingPropertyDefinition as EntityInstance];
						for (const definition of definitions) {
							if (psetsOnly && !definition.isA("IfcPropertySet") && !definition.isA("IfcPreDefinedPropertySet"))
								continue;
							if (qtosOnly && !definition.isA("IfcElementQuantity")) continue;
							addDefinition(definition);
						}
					}
				}
			}
		}
	}
	return psets;
}

/**
 * Python: `get_property_definition(definition, prop=None, verbose=False)`.
 *
 * If `prop` is not provided, returns a dict of all available properties; otherwise
 * returns the value of the specified `prop`.
 */
export function getPropertyDefinition(
	definition: EntityInstance | null,
	prop: string | null = null,
	verbose = false,
): unknown {
	if (!definition) return null;

	const ifcClass = definition.isA();

	if (prop) {
		if (ifcClass === "IfcElementQuantity") {
			return getQuantity(attrList(definition, "Quantities"), prop, verbose);
		}
		if (ifcClass === "IfcPropertySet") {
			return getProperty(attrList(definition, "HasProperties"), prop, verbose);
		}
		if (ifcClass === "IfcMaterialProperties" || ifcClass === "IfcProfileProperties") {
			// IfcExtendedProperties
			return getProperty(attrList(definition, "Properties"), prop, verbose);
		}
		if (ifcClass === "IfcExtendedMaterialProperties") {
			// IFC2X3.
			return getProperty(attrList(definition, "ExtendedProperties"), prop, verbose);
		}
		// Entity introduced in IFC4 (definition.is_a('IfcPreDefinedPropertySet')).
		const count = definition.attributeCount();
		for (let i = 4; i < count; i++) {
			if (attributeNameAt(definition, i) === prop) {
				const v = definition.getByIndex(i);
				if (v !== null) return v;
			}
		}
		return null;
	}

	const props: Record<string, unknown> = {};
	if (ifcClass === "IfcElementQuantity") {
		// 5 IfcElementQuantity.Quantities
		Object.assign(props, getQuantities(attrList(definition, "Quantities"), verbose));
	} else if (ifcClass === "IfcPropertySet") {
		// 4 IfcPropertySet.HasProperties
		Object.assign(props, getProperties(attrList(definition, "HasProperties"), verbose));
	} else if (ifcClass === "IfcMaterialProperties" || ifcClass === "IfcProfileProperties") {
		// 2 IfcExtendedProperties.Properties
		Object.assign(props, getProperties(attrList(definition, "Properties"), verbose));
	} else if (ifcClass === "IfcExtendedMaterialProperties") {
		// 1 IfcExtendedMaterialProperties.ExtendedProperties
		Object.assign(props, getProperties(attrList(definition, "ExtendedProperties"), verbose));
	} else {
		// Entity introduced in IFC4 (definition.is_a('IfcPreDefinedPropertySet')).
		const count = definition.attributeCount();
		for (let i = 4; i < count; i++) {
			const v = definition.getByIndex(i);
			if (v !== null) props[attributeNameAt(definition, i)] = v;
		}
	}
	props.id = definition.id();
	return props;
}

/** Python: `get_quantity(quantities, name, verbose=False)`. */
export function getQuantity(quantities: readonly EntityInstance[] | null, name: string, verbose = false): unknown {
	for (const quantity of arr(quantities)) {
		// 0 IfcPhysicalQuantity.Name
		if ((quantity.getByIndex(0) as string | null) !== name) continue;
		let result: unknown;
		if (quantity.isA("IfcPhysicalSimpleQuantity")) {
			// 3 IfcPhysicalSimpleQuantity.XXXValue
			result = quantity.getByIndex(3);
		} else if (quantity.isA("IfcPhysicalComplexQuantity")) {
			const data: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(quantity.getInfo())) {
				if (v !== null && k !== "Name") data[k] = v;
			}
			data.properties = getQuantities(attrList(quantity, "HasQuantities"), verbose);
			deleteKey(data, "HasQuantities");
			result = data;
		} else {
			throw new Error(`Unexpected quantity type: '${quantity.isA()}'`);
		}
		if (verbose) {
			result = { id: quantity.id(), class: quantity.isA(), value: result };
		}
		return result;
	}
	return null;
}

/** Python: `get_quantities(quantities, verbose=False)`. */
export function getQuantities(quantities: readonly EntityInstance[] | null, verbose = false): Record<string, unknown> {
	const results: Record<string, unknown> = {};
	for (const quantity of arr(quantities)) {
		// 0 IfcPhysicalQuantity.Name
		const quantityName = quantity.getByIndex(0) as string;
		if (quantity.isA("IfcPhysicalSimpleQuantity")) {
			// 3 IfcPhysicalSimpleQuantity.XXXValue
			const value = quantity.getByIndex(3);
			results[quantityName] = verbose ? { id: quantity.id(), class: quantity.isA(), value } : value;
		} else if (quantity.isA("IfcPhysicalComplexQuantity")) {
			const data: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(quantity.getInfo())) {
				if (v !== null && k !== "Name") data[k] = v;
			}
			data.properties = getQuantities(attrList(quantity, "HasQuantities"), verbose);
			deleteKey(data, "HasQuantities");
			// Python literally reads `data["class"]` here, not `data["type"]` -- a
			// pre-existing bug in the Python source (get_info()'s key is "type"/"class"
			// is never actually set on `data`), unexercised by Python's own test suite
			// (test_element.py has no verbose+nested-IfcPhysicalComplexQuantity test).
			// Reproduced verbatim rather than "fixed": `data.class` here is always
			// `undefined` (TS silently yields `undefined` for a missing key; Python would
			// raise `KeyError` if this branch were ever actually exercised). Disclosed in
			// this chunk's final report, not silently patched over.
			results[quantityName] = verbose ? { id: data.id, class: data.class, value: data } : data;
		}
	}
	return results;
}

/** Python: `get_property(properties, name, verbose=False)`. */
export function getProperty(properties: readonly EntityInstance[] | null, name: string, verbose = false): unknown {
	for (const prop of arr(properties)) {
		if ((prop.get("Name") as string | null) !== name) continue;
		let isSingleValue = false;
		let singleValueType: string | null = null;
		let result: unknown;
		if (prop.isA("IfcPropertySingleValue")) {
			// 2 IfcPropertySingleValue.NominalValue -- unwrap a real typed-instance
			// wrapper (Python's `v.wrappedValue`) and recover its EXPRESS type name
			// (Python's `v.is_a()`); see `unwrapSelectValue`/`selectValueType` above and
			// this file's header comment (point 2) for when that is/isn't possible.
			const rawValue = prop.getByIndex(2);
			singleValueType = selectValueType(rawValue);
			result = unwrapSelectValue(rawValue);
			isSingleValue = true;
		} else if (prop.isA("IfcPropertyEnumeratedValue")) {
			// 2 IfcPropertyEnumeratedValue.EnumerationValues
			const rawValues = prop.getByIndex(2) as unknown[] | null;
			result = rawValues ? rawValues.map(unwrapSelectValue) : rawValues;
		} else if (prop.isA("IfcPropertyListValue")) {
			// 2 IfcPropertyListValue.ListValues
			const rawValues = prop.getByIndex(2) as unknown[] | null;
			result = rawValues ? rawValues.map(unwrapSelectValue) : rawValues;
		} else if (prop.isA("IfcPropertyBoundedValue")) {
			const data = prop.getInfo();
			deleteKey(data, "Unit");
			result = data;
		} else if (prop.isA("IfcPropertyTableValue")) {
			result = prop.getInfo();
		} else if (prop.isA("IfcComplexProperty")) {
			const data: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(prop.getInfo())) {
				if (v !== null && k !== "Name") data[k] = v;
			}
			data.properties = getProperties(attrList(prop, "HasProperties"), verbose);
			deleteKey(data, "HasProperties");
			result = data;
		} else {
			throw new Error(`Unexpected property type: '${prop.isA()}'`);
		}
		if (verbose) {
			const verboseResult: Record<string, unknown> = { id: prop.id(), class: prop.isA(), value: result };
			// `null` when `singleValueType` couldn't be recovered (an already-bare
			// primitive `NominalValue` -- see `selectValueType` above), matching
			// Python's own `result_type = v.is_a() if v else None`.
			if (isSingleValue) verboseResult.value_type = singleValueType;
			result = verboseResult;
		}
		return result;
	}
	return null;
}

/** Python: `get_properties(properties, verbose=False)`. */
export function getProperties(properties: readonly EntityInstance[] | null, verbose = false): Record<string, unknown> {
	const results: Record<string, unknown> = {};
	for (const prop of arr(properties)) {
		const ifcClass = prop.isA();
		const propName = prop.getByIndex(0) as string; // 0 IfcProperty.Name
		if (ifcClass === "IfcPropertySingleValue") {
			// 2 IfcPropertySingleValue.NominalValue -- unwrap a real typed-instance
			// wrapper and recover its EXPRESS type name where possible; see
			// `unwrapSelectValue`/`selectValueType` above and this file's header comment
			// (point 2).
			const rawValue = prop.getByIndex(2);
			const value = unwrapSelectValue(rawValue);
			results[propName] = verbose
				? { id: prop.id(), class: prop.isA(), value, value_type: selectValueType(rawValue) }
				: value;
		} else if (ifcClass === "IfcPropertyEnumeratedValue" || ifcClass === "IfcPropertyListValue") {
			// 2 IfcPropertyEnumeratedValue.EnumerationValues / IfcPropertyListValue.ListValues
			const rawValues = prop.getByIndex(2) as unknown[] | null;
			const value = rawValues ? rawValues.map(unwrapSelectValue) : rawValues;
			results[propName] = verbose ? { id: prop.id(), class: prop.isA(), value } : value;
		} else if (ifcClass === "IfcPropertyBoundedValue") {
			const data = prop.getInfo();
			deleteKey(data, "Unit");
			results[propName] = verbose ? { id: data.id, class: data.type, value: data } : data;
		} else if (ifcClass === "IfcPropertyTableValue") {
			const data = prop.getInfo();
			results[propName] = verbose ? { id: data.id, class: data.type, value: data } : data;
		} else if (ifcClass === "IfcComplexProperty") {
			const data: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(prop.getInfo())) {
				if (v !== null && k !== "Name") data[k] = v;
			}
			data.properties = getProperties(attrList(prop, "HasProperties"), verbose);
			deleteKey(data, "HasProperties");
			results[propName] = verbose ? { id: data.id, class: data.type, value: data } : data;
		}
	}
	return results;
}

/** Python: `get_elements_by_pset(pset) -> set[entity_instance]`. */
export function getElementsByPset(pset: EntityInstance): Set<EntityInstance> {
	const isIfc2x3 = (pset.file as IfcFile).schema === "IFC2X3";
	const elements = new EntityInstanceSet();
	if (pset.isA("IfcPropertySet") || pset.isA("IfcPreDefinedPropertySet") || pset.isA("IfcElementQuantity")) {
		const rels = attrList(pset, isIfc2x3 ? "PropertyDefinitionOf" : "DefinesOccurrence");
		for (const rel of rels) {
			elements.update(attrList(rel, "RelatedObjects"));
		}
		for (const elementType of attrList(pset, "DefinesType")) {
			elements.add(elementType);
		}
	} else if (pset.isA("IfcProfileProperties")) {
		elements.add(pset.get("ProfileDefinition") as EntityInstance);
	} else if (pset.isA("IfcMaterialProperties")) {
		elements.add(pset.get("Material") as EntityInstance);
	} else {
		throw new Error(`Unexpected pset type: '${pset.isA()}'.`);
	}
	return elements.toSet();
}

/** Python: `has_property(product, property_name) -> bool`. */
export function hasProperty(product: EntityInstance, propertyName: string): boolean {
	if (!propertyName) return true;
	const qtos = getPsets(product, false, true);
	return Object.values(qtos).some((quantities) => propertyName in quantities);
}

// --- Type / material / style ---

/**
 * Python: `get_predefined_type(element) -> Union[str, None]`.
 *
 * Retrieves the PredefinedType attribute of an element. If the predefined type is user
 * defined, the custom type is returned instead. Predefined types from the associated
 * type element are considered first.
 */
export function getPredefinedType(element: EntityInstance): string | null {
	const elementType = getType(element);
	if (elementType) {
		let predefinedType = attrOrNull(elementType, "PredefinedType") as string | null;
		if (predefinedType === "USERDEFINED" || !predefinedType) {
			const elementTypeAttr = attrOrMissing(elementType, "ElementType");
			predefinedType =
				elementTypeAttr === MISSING
					? (attrOrNull(elementType, "ProcessType") as string | null)
					: (elementTypeAttr as string | null);
		}
		if (predefinedType && predefinedType !== "NOTDEFINED") {
			return predefinedType;
		}
	}

	let predefinedType = attrOrNull(element, "PredefinedType") as string | null;
	if (predefinedType === "USERDEFINED" || !predefinedType) {
		predefinedType = attrOrNull(element, "ObjectType") as string | null;
	}
	return predefinedType;
}

/** Python: `is_userdefined_type(element) -> bool`. */
export function isUserdefinedType(element: EntityInstance): boolean {
	const elementType = getType(element);
	if (elementType) {
		let predefinedType = attrOrNull(elementType, "PredefinedType") as string | null;
		if (predefinedType === "USERDEFINED") {
			return true;
		}
		if (!predefinedType) {
			const elementTypeAttr = attrOrMissing(elementType, "ElementType");
			predefinedType =
				elementTypeAttr === MISSING
					? (attrOrNull(elementType, "ProcessType") as string | null)
					: (elementTypeAttr as string | null);
			if (predefinedType) return true;
		}
		if (predefinedType && predefinedType !== "NOTDEFINED") {
			return false;
		}
	}

	const predefinedType = attrOrNull(element, "PredefinedType") as string | null;
	if (predefinedType === "USERDEFINED") {
		return true;
	}
	if (!predefinedType) {
		return Boolean(attrOrNull(element, "ObjectType"));
	}
	return false;
}

/**
 * Python: `get_type(element) -> Union[entity_instance, None]`.
 *
 * Retrieves the construction type element of an element occurrence. Note:
 * `getType(typeElement)` returns `typeElement` itself.
 */
export function getType(element: EntityInstance): EntityInstance | null {
	if (element.isA("IfcTypeObject")) return element;

	const schema = (element.file as IfcFile).schema;
	if (schema !== "IFC2X3") {
		const isTypedBy = attrList(element, "IsTypedBy");
		if (isTypedBy.length > 0) {
			return isTypedBy[0].get("RelatingType") as EntityInstance;
		}
		return null;
	}

	// IFC2X3
	for (const relationship of attrList(element, "IsDefinedBy")) {
		if (relationship.isA("IfcRelDefinesByType")) {
			return relationship.get("RelatingType") as EntityInstance;
		}
	}
	return null;
}

/** Python: `get_types(type) -> list[entity_instance]`. */
export function getTypes(type: EntityInstance): EntityInstance[] {
	const schema = (type.file as IfcFile).schema;
	if (schema === "IFC2X3") {
		const objectTypeOf = attrList(type, "ObjectTypeOf");
		if (objectTypeOf.length > 0) {
			return attrList(objectTypeOf[0], "RelatedObjects");
		}
	} else {
		const types = attrList(type, "Types");
		if (types.length > 0) {
			return attrList(types[0], "RelatedObjects");
		}
	}
	return [];
}

/**
 * Python: `get_material(element, should_skip_usage=False, should_inherit=True) ->
 * Union[entity_instance, None]`.
 *
 * Gets the material of the element -- a single material, material set (layered,
 * profiled, or constituent), or a material set usage.
 */
export function getMaterial(
	element: EntityInstance,
	shouldSkipUsage = false,
	shouldInherit = true,
): EntityInstance | null {
	for (const relationship of attrList(element, "HasAssociations")) {
		if (relationship.isA("IfcRelAssociatesMaterial")) {
			if (shouldSkipUsage) {
				const relatingMaterial = relationship.get("RelatingMaterial") as EntityInstance;
				if (relatingMaterial.isA("IfcMaterialLayerSetUsage")) {
					return relatingMaterial.get("ForLayerSet") as EntityInstance;
				}
				if (relatingMaterial.isA("IfcMaterialProfileSetUsage")) {
					return relatingMaterial.get("ForProfileSet") as EntityInstance;
				}
			}
			return relationship.get("RelatingMaterial") as EntityInstance;
		}
	}
	if (shouldInherit) {
		const relatingType = getType(element);
		if (
			relatingType !== null &&
			!relatingType.equals(element) &&
			attrList(relatingType, "HasAssociations").length > 0
		) {
			return getMaterial(relatingType, shouldSkipUsage);
		}
	}
	return null;
}

/**
 * Python: `get_materials(element, should_inherit=True) -> list[entity_instance]`.
 *
 * Gets individual materials of an element. If the element has a material set, the
 * individual materials of that set are returned as a list.
 */
export function getMaterials(element: EntityInstance, shouldInherit = true): EntityInstance[] {
	const material = getMaterial(element, true, shouldInherit);
	if (!material) return [];
	if (material.isA("IfcMaterial")) return [material];
	if (material.isA("IfcMaterialLayerSet")) {
		return attrList(material, "MaterialLayers").map((l) => l.get("Material") as EntityInstance);
	}
	if (material.isA("IfcMaterialProfileSet")) {
		return attrList(material, "MaterialProfiles").map((p) => p.get("Material") as EntityInstance);
	}
	if (material.isA("IfcMaterialConstituentSet")) {
		return attrList(material, "MaterialConstituents").map((c) => c.get("Material") as EntityInstance);
	}
	if (material.isA("IfcMaterialList")) {
		return [...attrList(material, "Materials")];
	}
	throw new Error(`Unexpected material type: '${material.isA()}'`);
}

/**
 * Python: `get_material_layers(element) -> list[PrioritisedLayer]`.
 *
 * Retrieves all material layers assigned to an element.
 */
export function getMaterialLayers(element: EntityInstance): PrioritisedLayer[] {
	const material = getMaterial(element, true);
	if (!material || !material.isA("IfcMaterialLayerSet")) return [];
	return attrList(material, "MaterialLayers").map((layer) => ({
		priority: (attrOrNull(layer, "Priority") as number | null) ?? 0,
		material: layer.get("Material") as EntityInstance | null,
		thickness: layer.get("LayerThickness") as number | null,
	}));
}

/**
 * Python: `get_material_profiles(element) -> list[PrioritisedProfile]`.
 *
 * Retrieves all material profiles assigned to an element.
 */
export function getMaterialProfiles(element: EntityInstance): PrioritisedProfile[] {
	const material = getMaterial(element, true);
	if (!material || !material.isA("IfcMaterialProfileSet")) return [];
	return attrList(material, "MaterialProfiles").map((materialProfile) => ({
		priority: (attrOrNull(materialProfile, "Priority") as number | null) ?? 0,
		material: materialProfile.get("Material") as EntityInstance | null,
		profile: materialProfile.get("Profile") as EntityInstance | null,
	}));
}

/**
 * Narrow, disclosed, non-exported stand-in for exactly
 * `ifcopenshell.util.representation.get_representation(element, "Model", "Body",
 * "MODEL_VIEW")` -- the one fixed-argument call `get_styles` (below) makes. See this
 * file's header comment: `util.representation` is a not-yet-ported Tier B module;
 * porting its general `get_representation`/`get_representations_iter`/
 * `is_representation_of_context` surface is out of scope for this chunk. This inlines
 * only the "Model"/"Body"/"MODEL_VIEW" lookup, not a general-purpose port.
 */
function findBodyRepresentation(element: EntityInstance): EntityInstance | null {
	let representations: readonly EntityInstance[] = [];
	if (element.isA("IfcProduct")) {
		const representation = element.get("Representation") as EntityInstance | null;
		if (representation) representations = attrList(representation, "Representations");
	} else if (element.isA("IfcTypeProduct")) {
		representations = attrList(element, "RepresentationMaps").map(
			(representationMap) => representationMap.get("MappedRepresentation") as EntityInstance,
		);
	}
	for (const representation of representations) {
		const context = representation.get("ContextOfItems") as EntityInstance | null;
		if (
			context?.isA("IfcGeometricRepresentationSubContext") &&
			context.get("TargetView") === "MODEL_VIEW" &&
			context.get("ContextIdentifier") === "Body" &&
			context.get("ContextType") === "Model"
		) {
			return representation;
		}
	}
	return null;
}

/**
 * Python: `get_styles(element) -> list[entity_instance]`.
 *
 * Retrieves the styles used in an element's representation -- from the material or the
 * body representation. See this file's header comment for the `util.representation`
 * dependency finding.
 */
export function getStyles(element: EntityInstance): EntityInstance[] {
	const styles: EntityInstance[] = [];

	for (const material of getMaterials(element)) {
		for (const materialDefinitionRepresentation of attrList(material, "HasRepresentation")) {
			for (const representation of attrList(materialDefinitionRepresentation, "Representations")) {
				for (const item of attrList(representation, "Items")) {
					for (const style of attrList(item, "Styles")) {
						if (style.isA("IfcSurfaceStyle")) styles.push(style);
					}
				}
			}
		}
	}

	const body = findBodyRepresentation(element);
	if (!body) return styles;

	const queue: EntityInstance[] = [...attrList(body, "Items")];
	while (queue.length > 0) {
		const item = queue.pop() as EntityInstance;
		if (item.isA("IfcMappedItem")) {
			const mappingSource = item.get("MappingSource") as EntityInstance;
			const mappedRepresentation = mappingSource.get("MappedRepresentation") as EntityInstance;
			queue.push(...attrList(mappedRepresentation, "Items"));
		}
		if (item.isA("IfcBooleanResult")) {
			queue.push(item.get("FirstOperand") as EntityInstance);
			queue.push(item.get("SecondOperand") as EntityInstance);
		}
		const styledByItem = attrList(item, "StyledByItem");
		if (styledByItem.length > 0) {
			for (const style of attrList(styledByItem[0], "Styles")) {
				if (style.isA("IfcSurfaceStyle")) styles.push(style);
			}
		}
	}
	return styles;
}

/**
 * Python: `get_elements_by_material(ifc_file, material) -> set[entity_instance]`.
 *
 * Retrieves the elements related to a material -- including elements using the
 * material as part of a material set or set usage. `ifcFile` may be `null`, in which
 * case `material.file` is used (matches Python's own `if not ifc_file: ifc_file =
 * material.file`).
 */
export function getElementsByMaterial(ifcFile: IfcFile | null, material: EntityInstance): Set<EntityInstance> {
	const file = ifcFile ?? (material.file as IfcFile);
	const results = new EntityInstanceSet();
	for (const inverse of file.getInverse(material) as Set<EntityInstance>) {
		if (inverse.isA("IfcRelAssociatesMaterial")) {
			results.update(attrList(inverse, "RelatedObjects")); // See Revit bug #675
		} else if (inverse.isA("IfcMaterialLayer")) {
			for (const materialSet of attrList(inverse, "ToMaterialLayerSet")) {
				results.update(getElementsByMaterial(file, materialSet));
			}
		} else if (inverse.isA("IfcMaterialProfile")) {
			for (const materialSet of attrList(inverse, "ToMaterialProfileSet")) {
				results.update(getElementsByMaterial(file, materialSet));
			}
		} else if (inverse.isA("IfcMaterialConstituent")) {
			for (const materialSet of attrList(inverse, "ToMaterialConstituentSet")) {
				results.update(getElementsByMaterial(file, materialSet));
			}
		} else if (inverse.isA("IfcMaterialLayerSetUsage")) {
			results.update(getElementsByMaterial(file, inverse));
		} else if (inverse.isA("IfcMaterialProfileSetUsage")) {
			results.update(getElementsByMaterial(file, inverse));
		} else if (inverse.isA("IfcMaterialList")) {
			results.update(getElementsByMaterial(file, inverse));
		}
	}
	return results.toSet();
}

/**
 * Python: `get_elements_by_style(ifc_file, style) -> set[entity_instance]`.
 *
 * Retrieves the elements whose geometric representation uses a style.
 */
export function getElementsByStyle(ifcFile: IfcFile | null, style: EntityInstance): Set<EntityInstance> {
	const file = ifcFile ?? (style.file as IfcFile);
	const results = new EntityInstanceSet();
	const inverses: EntityInstance[] = [...(file.getInverse(style) as Set<EntityInstance>)];
	while (inverses.length > 0) {
		const inverse = inverses.pop() as EntityInstance;
		const inverseClass = inverse.isA();
		// IfcPresentationStyleAssignment for < IFC4X3.
		// IfcFillAreaStyleHatching->IfcFillAreaStyle only for IfcCurveStyle.
		// IfcFillAreaStyleTiles->IfcFillAreaStyle is not restricted to IfcCurveStyle.
		if (
			inverseClass === "IfcPresentationStyleAssignment" ||
			inverseClass === "IfcFillAreaStyleHatching" ||
			inverseClass === "IfcFillAreaStyle" ||
			inverseClass === "IfcFillAreaStyleTiles"
		) {
			inverses.push(...(file.getInverse(inverse) as Set<EntityInstance>));
			continue;
		}
		if (!inverse.isA("IfcStyledItem")) continue;
		const geometryItem = inverse.get("Item") as EntityInstance | null;
		if (geometryItem) {
			for (const inverse_ of file.getInverse(geometryItem) as Set<EntityInstance>) {
				if (inverse_.isA("IfcShapeRepresentation")) {
					results.update(getElementsByRepresentation(file, inverse_));
				}
			}
			// IfcFillAreaStyleTiles requires .Item to be set.
			inverses.push(...(file.getInverse(inverse) as Set<EntityInstance>));
		} else {
			const styledReps = [...(file.getInverse(inverse) as Set<EntityInstance>)].filter((i) =>
				i.isA("IfcStyledRepresentation"),
			);
			for (const styledRep of styledReps) {
				for (const materialDefRep of attrList(styledRep, "OfProductRepresentation")) {
					results.update(getElementsByMaterial(file, materialDefRep.get("RepresentedMaterial") as EntityInstance));
				}
			}
		}
	}
	return results.toSet();
}

/**
 * Python: `get_elements_by_representation(ifc_file, representation) ->
 * set[entity_instance]`.
 *
 * Gets all elements using a geometric representation.
 */
export function getElementsByRepresentation(
	ifcFile: IfcFile | null,
	representation: EntityInstance,
): Set<EntityInstance> {
	const file = ifcFile ?? (representation.file as IfcFile);
	const results = new EntityInstanceSet();
	for (const productRepresentation of attrList(representation, "OfProductRepresentation")) {
		results.update(attrList(productRepresentation, "ShapeOfProduct"));
	}
	for (const repMap of attrList(representation, "RepresentationMap")) {
		for (const inverse of file.getInverse(repMap) as Set<EntityInstance>) {
			if (inverse.isA("IfcTypeProduct")) {
				results.add(inverse);
			} else if (inverse.isA("IfcMappedItem")) {
				for (const rep of file.getInverse(inverse) as Set<EntityInstance>) {
					if (rep.isA("IfcShapeRepresentation")) {
						results.update(getElementsByRepresentation(file, rep));
					}
				}
			}
		}
	}
	return results.toSet();
}

// --- Spatial / structural-graph queries (chunk 2 of 3) ---
//
// Ported from `element.py` lines ~1061-1965: the container/decomposition/aggregation/
// nesting/grouping/void relationship-graph query functions. Uses the same internal
// helpers (`attrOrMissing`/`attrOrNull`/`attrList`/`entityEquals`/`EntityInstanceSet`)
// as chunk 1 above -- see that section's own doc comments for what each reconstructs
// and why (Python's `getattr(x, name, default)` three-way None/missing/empty semantics,
// and `set()`-returning functions' `Set<EntityInstance>` dedup-by-identity convention).
//
// A note on `getattr(..., default)` vs. direct attribute access: several Python
// functions here read `element`'s own top-level attribute with an explicit `getattr`
// default (e.g. `getattr(element, "ContainedInStructure", None)`), meaning the class
// might not declare that inverse at all and Python tolerates that by falling back to
// the default -- these are ported via `attrList`/`attrOrNull` below, matching chunk 1's
// own convention. A few (`get_structure_referenced_elements`'s `structure
// .ReferencesElements`, `get_groups`/`get_controls`'s `element.HasAssignments`) instead
// access the attribute directly with **no** default, meaning Python itself would raise
// `AttributeError` if called against an element whose class doesn't declare it -- these
// are ported via a direct `.get(...)` call (which throws the TS equivalent), not
// `attrList`, to preserve that same "wrong argument type raises" behavior rather than
// silently swallowing it into `[]`. Every relationship object's own *forward* attribute
// access (e.g. `rel.RelatedObjects`, `rel.RelatingStructure`) is likewise a direct
// `.get(...)` call throughout -- Python never defaults those either, since `rel` is
// always already known to be of the expected relationship class at that point.
//
// `get_controls` (Python: `Generator[entity_instance]`, via `HasAssignments` ->
// `IfcRelAssignsToControl`) is included in this chunk's scope: the task brief asked to
// check whether it belongs here, and it does -- it's the exact same
// `HasAssignments`-iteration-by-relationship-subtype shape as `get_groups` (which *is*
// explicitly in scope), just filtering `IfcRelAssignsToControl`/`RelatingControl`
// instead of `IfcRelAssignsToGroup`/`RelatingGroup`. `get_referenced_elements` (the
// task brief's other candidate) is NOT included: unlike everything else in this
// grouping, it isn't a decomposition/aggregation/containment/grouping graph walk --
// it's keyed off `REFERENCE_TYPES` (`IfcClassificationReference`/`IfcDocumentReference`/
// `IfcLibraryReference`/etc.), i.e. classification/document/library *association*
// relationships, which is squarely `util.classification`/`util.document` territory (both
// separate, not-yet-ported Phase 3 chunks per `PROGRESS.md`'s own module list) rather
// than this chunk's spatial/structural-graph domain. Porting it here would require
// either duplicating that REFERENCE_TYPES table now (scope creep, pre-empting those
// future chunks' own design decisions) or leaving it half-implemented; left for a later
// chunk instead.
//
// Both Python `Generator`-returning functions in this chunk's scope (`get_controls`,
// `get_openings`) are ported as plain eager `EntityInstance[]`-returning functions, not
// TS generator functions -- every other list/set-returning function in this module
// (chunk 1 included) already returns a concrete array/Set, and nothing in either
// Python function's own behavior (nor `has_openings`, `get_openings`'s only real
// caller within this module) depends on laziness for correctness, only for not walking
// more of the aggregate chain than necessary -- a performance nicety, not an observable
// behavior, and a real Python `list(get_controls(element))`/`next(get_openings(element)
// , False)` call site sees identical values either way. Disclosed here rather than
// silently diverging from the "match Python's return shape" rule chunk 1 established.

/**
 * Python: `get_container(element, should_get_direct=False, ifc_class=None) ->
 * Union[entity_instance, None]`.
 *
 * Retrieves the spatial structure container of an element.
 */
export function getContainer(
	element: EntityInstance,
	shouldGetDirect = false,
	ifcClass: string | null = null,
): EntityInstance | null {
	if (shouldGetDirect) {
		const containedInStructure = attrList(element, "ContainedInStructure");
		if (containedInStructure.length > 0) {
			const container = containedInStructure[0].get("RelatingStructure") as EntityInstance;
			if (!ifcClass) return container;
			if (container.isA(ifcClass)) return container;
		}
		return null;
	}

	const containedInStructure = attrList(element, "ContainedInStructure");
	if (containedInStructure.length > 0) {
		let container: EntityInstance | null = containedInStructure[0].get("RelatingStructure") as EntityInstance;
		if (!ifcClass) return container;
		while (container) {
			if (container.isA(ifcClass)) return container;
			container = getAggregate(container);
		}
		return null;
	}

	const parent = getParent(element);
	if (parent) {
		return getContainer(parent, shouldGetDirect, ifcClass);
	}
	return null;
}

/**
 * Python: `get_referenced_structures(element) -> list[entity_instance]`.
 *
 * Retrieves a list of referenced spatial elements. Typically useful for multistorey
 * elements, such as columns or facade elements, or elements that span multiple spaces
 * or in-between spaces, such as stairs, doors, etc.
 */
export function getReferencedStructures(element: EntityInstance): EntityInstance[] {
	return attrList(element, "ReferencedInStructures").map((r) => r.get("RelatingStructure") as EntityInstance);
}

/**
 * Python: `get_structure_referenced_elements(structure) -> set[entity_instance]`.
 *
 * Retrieves a set of elements referenced by a structure.
 */
export function getStructureReferencedElements(structure: EntityInstance): Set<EntityInstance> {
	const referenced = new EntityInstanceSet();
	for (const rel of structure.get("ReferencesElements") as EntityInstance[]) {
		referenced.update(rel.get("RelatedElements") as EntityInstance[]);
	}
	return referenced.toSet();
}

/**
 * Python: `get_decomposition(element, is_recursive=True) -> set[entity_instance]`.
 *
 * Retrieves all subelements of an element based on the spatial decomposition
 * hierarchy. This includes all subspaces and elements contained in subspaces, parts of
 * an aggregate, all openings, all fills of any openings, and any surface features
 * adhering to an element (IFC4.3 and above).
 */
export function getDecomposition(element: EntityInstance, isRecursive = true): Set<EntityInstance> {
	const queue: EntityInstance[] = [element];
	const results = new EntityInstanceSet();
	while (queue.length > 0) {
		const current = queue.pop() as EntityInstance;
		for (const rel of attrList(current, "ContainsElements")) {
			const related = rel.get("RelatedElements") as EntityInstance[];
			queue.push(...related);
			results.update(related);
		}
		for (const rel of attrList(current, "IsDecomposedBy")) {
			const related = rel.get("RelatedObjects") as EntityInstance[];
			queue.push(...related);
			results.update(related);
		}
		for (const rel of attrList(current, "HasOpenings")) {
			const related = rel.get("RelatedOpeningElement") as EntityInstance;
			queue.push(related);
			results.add(related);
		}
		for (const rel of attrList(current, "HasFillings")) {
			const related = rel.get("RelatedBuildingElement") as EntityInstance;
			queue.push(related);
			results.add(related);
		}
		for (const rel of attrList(current, "IsNestedBy")) {
			const related = rel.get("RelatedObjects") as EntityInstance[];
			queue.push(...related);
			results.update(related);
		}
		for (const rel of attrList(current, "HasSurfaceFeatures")) {
			const related = rel.get("RelatedSurfaceFeatures") as EntityInstance[];
			queue.push(...related);
			results.update(related);
		}
		if (!isRecursive) break;
	}
	return results.toSet();
}

/**
 * Python: `get_grouped_by(element, is_recursive=True) -> list[entity_instance]`.
 *
 * Retrieves all subelements of an element based on the group.
 */
export function getGroupedBy(element: EntityInstance, isRecursive = true): EntityInstance[] {
	const queue: EntityInstance[] = [element];
	const results: EntityInstance[] = [];
	while (queue.length > 0) {
		const current = queue.pop() as EntityInstance;
		for (const rel of attrList(current, "IsGroupedBy")) {
			const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
			queue.push(...relatedObjects);
			results.push(...relatedObjects);
		}
		if (!isRecursive) break;
	}
	return results;
}

/**
 * Python: `get_groups(element) -> list[entity_instance]`.
 *
 * Retrieves the groups (`IfcGroup`) an element is assigned to.
 */
export function getGroups(element: EntityInstance): EntityInstance[] {
	const groups: EntityInstance[] = [];
	for (const rel of element.get("HasAssignments") as EntityInstance[]) {
		if (rel.isA("IfcRelAssignsToGroup")) {
			groups.push(rel.get("RelatingGroup") as EntityInstance);
		}
	}
	return groups;
}

/**
 * Python: `get_controls(element) -> Generator[entity_instance]`.
 *
 * Retrieves the controls (`IfcControl`) assigned to an element. See this section's
 * header comment for why this is included in this chunk's scope, and why it's ported
 * as an eager `EntityInstance[]` rather than a lazy generator.
 */
export function getControls(element: EntityInstance): EntityInstance[] {
	const controls: EntityInstance[] = [];
	for (const rel of element.get("HasAssignments") as EntityInstance[]) {
		if (rel.isA("IfcRelAssignsToControl")) {
			controls.push(rel.get("RelatingControl") as EntityInstance);
		}
	}
	return controls;
}

/**
 * Python: `get_parent(element, ifc_class=None) -> Union[entity_instance, None]`.
 *
 * Retrieves the parent in the spatial hierarchy: spatial containment, aggregation,
 * nesting, filling, voiding, or adherence (IFC4.3 and above) -- whichever applies.
 */
export function getParent(element: EntityInstance, ifcClass: string | null = null): EntityInstance | null {
	const parent: EntityInstance | null =
		getContainer(element, true) ??
		getAggregate(element) ??
		getNest(element) ??
		getFilledVoid(element) ??
		getVoidedElement(element) ??
		getAdheredElement(element);

	if (!ifcClass) return parent;

	let current = parent;
	while (current) {
		if (current.isA(ifcClass)) return current;
		current = getParent(current);
	}
	return null;
}

/**
 * Python: `get_filled_void(element) -> Union[entity_instance, None]`.
 *
 * If the element is filling a void, get the void (e.g. a window/door filling an
 * opening inside a wall).
 */
export function getFilledVoid(element: EntityInstance): EntityInstance | null {
	const rel = attrList(element, "FillsVoids");
	if (rel.length > 0) {
		return rel[0].get("RelatingOpeningElement") as EntityInstance;
	}
	return null;
}

/**
 * Python: `get_voided_element(element) -> Union[entity_instance, None]`.
 *
 * For an opening, get the building element that the opening is voiding.
 */
export function getVoidedElement(element: EntityInstance): EntityInstance | null {
	const rel = attrList(element, "VoidsElements");
	if (rel.length > 0) {
		return rel[0].get("RelatingBuildingElement") as EntityInstance;
	}
	return null;
}

/**
 * Python: `get_adhered_element(element) -> Union[entity_instance, None]`.
 *
 * If the element is a surface feature (IFC4.3 `IfcSurfaceFeature`), get the host
 * element it adheres to via `IfcRelAdheresToElement`.
 */
export function getAdheredElement(element: EntityInstance): EntityInstance | null {
	const rel = attrList(element, "AdheresToElement");
	if (rel.length > 0) {
		return rel[0].get("RelatingElement") as EntityInstance;
	}
	return null;
}

/**
 * Python: `get_aggregate(element) -> Union[entity_instance, None]`.
 *
 * Retrieves the aggregate parent of an element.
 */
export function getAggregate(element: EntityInstance): EntityInstance | null {
	const decomposes = attrList(element, "Decomposes");
	if (decomposes.length === 0) return null;
	const isIfc2x3 = (element.file as IfcFile).schema === "IFC2X3";
	const rel = decomposes[0];
	if (isIfc2x3 && !rel.isA("IfcRelAggregates")) {
		// In IFC2X3, Decomposes is used for both aggregates and nests, but only for 1 at
		// a time.
		return null;
	}
	return rel.get("RelatingObject") as EntityInstance;
}

/**
 * Python: `get_nest(element) -> Union[entity_instance, None]`.
 *
 * Retrieves the nest parent of an element.
 */
export function getNest(element: EntityInstance): EntityInstance | null {
	const isIfc2x3 = (element.file as IfcFile).schema === "IFC2X3";
	if (isIfc2x3) {
		const decomposes = attrList(element, "Decomposes");
		if (decomposes.length === 0) return null;
		if (decomposes[0].isA("IfcRelNests")) {
			return decomposes[0].get("RelatingObject") as EntityInstance;
		}
		return null;
	}
	const nests = attrList(element, "Nests");
	if (nests.length > 0) {
		return nests[0].get("RelatingObject") as EntityInstance;
	}
	return null;
}

/**
 * Python: `get_parts(element) -> list[entity_instance]`.
 *
 * Retrieves the parts of an element that have an aggregation relationship.
 */
export function getParts(element: EntityInstance): EntityInstance[] {
	const objects: EntityInstance[] = [];
	const isNotIfc2x3 = (element.file as IfcFile).schema !== "IFC2X3";
	for (const rel of attrList(element, "IsDecomposedBy")) {
		if (isNotIfc2x3 || rel.isA("IfcRelAggregates")) {
			objects.push(...(rel.get("RelatedObjects") as EntityInstance[]));
		}
	}
	return objects;
}

/**
 * Python: `get_contained(element) -> list[entity_instance]`.
 *
 * Retrieves the contained elements of a spatial element.
 */
export function getContained(element: EntityInstance): EntityInstance[] {
	const objects: EntityInstance[] = [];
	for (const rel of attrList(element, "ContainsElements")) {
		objects.push(...(rel.get("RelatedElements") as EntityInstance[]));
	}
	return objects;
}

/**
 * Python: `get_components(element, include_ports=False) -> list[entity_instance]`.
 *
 * Retrieves the components of an element that have a nest relationship. For nested
 * ports, see `ifcopenshell.util.system` (not yet ported).
 */
export function getComponents(element: EntityInstance, includePorts = false): EntityInstance[] {
	const objects: EntityInstance[] = [];
	const isIfc2x3 = (element.file as IfcFile).schema === "IFC2X3";
	if (isIfc2x3) {
		for (const rel of attrList(element, "IsDecomposedBy")) {
			if (rel.isA("IfcRelNests")) {
				objects.push(...(rel.get("RelatedObjects") as EntityInstance[]));
			}
		}
	} else {
		for (const rel of attrList(element, "IsNestedBy")) {
			objects.push(...(rel.get("RelatedObjects") as EntityInstance[]));
		}
	}
	if (includePorts) return objects;
	return objects.filter((e) => !e.isA("IfcPort"));
}

/**
 * Python: `get_openings(element) -> Generator[entity_instance, None, None]`.
 *
 * Get element openings as `IfcRelVoidsElement` (not the `IfcOpeningElement` itself --
 * use `.get("RelatedOpeningElement")` on each result to get that). See this section's
 * header comment for why this is ported as an eager `EntityInstance[]` rather than a
 * lazy generator.
 */
export function getOpenings(element: EntityInstance): EntityInstance[] {
	const openings: EntityInstance[] = [...attrList(element, "HasOpenings")];
	const aggregate = getAggregate(element);
	if (aggregate) {
		openings.push(...getOpenings(aggregate));
	}
	return openings;
}

/**
 * Python: `has_openings(element) -> bool`.
 *
 * Check if the element has openings.
 */
export function hasOpenings(element: EntityInstance): boolean {
	return getOpenings(element).length > 0;
}

// --- Structural editing helpers (chunk 3 of 3) ---
//
// Ported from `element.py` lines ~1590-1919: `copy`/`copy_deep`, `remove_deep`/
// `remove_deep2` (+ `batch_remove_deep2`/`unbatch_remove_deep2`), and
// `replace_element`/`replace_attribute`. Unlike chunks 1/2's pure query functions,
// every function here mutates the file -- each one is careful to call the *existing*
// `IfcFile`/`EntityInstance` mutation methods (`createEntity`, `.setByIndex`, `remove`,
// `batch`/`unbatch`) rather than reimplement any transaction-recording logic:
// `IfcFile.remove`/`createEntity` already call `Transaction.storeDelete`/`storeCreate`
// when a transaction is active (`file.ts`), and `EntityInstance.setByIndex` already
// calls `Transaction.storeEdit` -- every mutation below goes through one of those
// three, so undo/redo Just Works the same way it already does for any other mutation,
// with no new transaction-integration code written here at all (see
// `test/util/element.test.ts`'s dedicated undo/redo test against `removeDeep2` for
// proof, not just an assumption).
//
// Two genuine, disclosed primitive-layer gaps found while building this chunk (both
// worked around without adding a new native primitive, per this chunk's own
// instructions to flag rather than fill):
//
// 1. `_is_set_attribute`'s schema-introspection chain
//    (`schema_by_name`/`declaration_by_name`/`attribute_by_index`/`type_of_attribute`/
//    `as_aggregation_type`/`type_of_aggregation_string`) is *mostly* already exposed --
//    `entity.attribute_by_index`, `attribute.type_of_attribute`,
//    `parameter_type.as_aggregation_type` all exist as real primitives
//    (`native/ifcopenshell_native.ts`), and Python's `schema_by_name(schema_identifier)`
//    free-function lookup would turn out not to be necessary at all here even if the
//    chain were usable: the right per-file `schema_definition` is already directly
//    reachable off `element.file`'s own already-bound `nativeFile.schema()` (the same
//    thing `IfcFile`'s own private `resolveDeclaration` uses), sidestepping the
//    `schema_registry`/`schema_by_name` singleton-accessor question entirely. But the
//    *last* link in the chain -- `aggregation_type.type_of_aggregation_string()`
//    (Python's SWIG-only convenience wrapper, `src/ifcwrap/IfcParseWrapper.i` line
//    ~1042, around the real C++ `aggregation_type::type_of_aggregation()` accessor and
//    its `array_type`/`bag_type`/`list_type`/`set_type` enum, `src/ifcparse/schema.h`)
//    -- is genuinely missing: `native/ifcopenshell_native.ts`'s `aggregation_type`
//    class only exposes `bound1()`/`bound2()`/`type_of_element()`/
//    `as_aggregation_type()`, confirmed by reading both the generated `.ts` facade and
//    its C API header (`ifcopenshell_native_c_api.h`) directly, not assumed. There is
//    currently no way to distinguish a SET-typed aggregate attribute from a LIST/BAG
//    one anywhere on this primitive surface -- not even by resolving the declaration
//    and confirming the attribute is *some* kind of aggregate, since that alone can't
//    tell SET apart from LIST/BAG/ARRAY, so doing that much work would only pay a real
//    native-call cost for a result that never varies. `isSetAttribute` below therefore
//    doesn't attempt any schema lookup at all and just conservatively returns `false`
//    unconditionally -- see its own doc comment for why "never deduplicate" is the
//    safer of the two possible wrong answers here, and `replaceAttribute`'s doc comment
//    for the one concrete behavioral consequence (a real, disclosed divergence from
//    Python, not a silent one -- see `test/util/element.test.ts`'s dedicated test for
//    it).
//
// 2. `unbatch_remove_deep2`'s file-reload semantics need Python's `file.to_string()`/
//    `ifcopenshell.file.from_string(...)` pair. `from_string` already has a real,
//    already-used in-memory-buffer primitive (`native.file_new_with_data_data_size`,
//    the exact same one `template.ts`'s `create()` already builds a fresh file from --
//    no gap, no workaround needed there). `to_string()`, however, is genuinely
//    missing: Python's own `to_string()` is SWIG-only glue
//    (`src/ifcwrap/IfcParseWrapper.i`: `std::stringstream s; s << (*$self); return
//    s.str();`), never bound as an N-API primitive (confirmed by reading
//    `native/ifcopenshell_native.ts`'s `file` class, which has `write(path)` but
//    nothing buffer/string-returning). Worked around without a new primitive:
//    `IfcFile.write(path)` serializes via the *exact same* `operator<<`
//    (`helper_fn_atomic_write`'s `f << file_obj`, confirmed by reading
//    `src/ifcparse/parse.cpp`'s `operator<<(std::ostream&, const ifcopenshell::file&)`
//    -- the same one `to_string()` itself calls), so writing to a throwaway temp file
//    and reading it back is byte-identical to what a real `to_string()` primitive
//    would return, not an approximation. See `unbatchRemoveDeep2`'s own doc comment.
//    Node-only (uses `node:fs`/`node:os`/`node:path`), consistent with `file.ts`'s
//    `write`/`writeAsync` already being Node-only per that file's own header comment.

/**
 * Python: `copy(ifc_file, element) -> entity_instance`.
 *
 * Copy a single element. Any referenced elements are not copied. `GlobalId` is
 * regenerated.
 */
export function copy(ifcFile: IfcFile | null, element: EntityInstance): EntityInstance {
	const file = ifcFile ?? (element.file as IfcFile);
	const result = file.createEntity(element.isA());
	const count = element.attributeCount();
	for (let i = 0; i < count; i++) {
		const attribute = element.getByIndex(i);
		if (attribute === null) continue;
		if (attributeNameAt(result, i) === "GlobalId") {
			result.setByIndex(i, guid.new());
		} else {
			result.setByIndex(i, attribute);
		}
	}
	return result;
}

/**
 * Python: `copy_deep(ifc_file, element, exclude=None, exclude_callback=None,
 * copied_entities=None) -> entity_instance`.
 *
 * Recursively copy an element and all of its directly related subelements.
 * `GlobalId`s are regenerated.
 *
 * :param exclude: IFC class names whose instances are referenced as-is (not copied).
 * :param excludeCallback: called with a candidate sub-entity; returning `true` leaves
 *   it referenced as-is instead of copying it (matches Python's own docstring: "Returns
 *   True to exclude").
 * :param copiedEntities: reused across the whole recursive call tree so the same
 *   sub-entity reached via multiple paths is only ever copied once (keyed by the
 *   original entity's STEP id) -- normally left `null`/omitted by an external caller;
 *   this is how the function threads shared state through its own recursion.
 */
export function copyDeep(
	ifcFile: IfcFile | null,
	element: EntityInstance,
	exclude: readonly string[] | null = null,
	excludeCallback: ((entity: EntityInstance) => boolean) | null = null,
	copiedEntities: Map<number, EntityInstance> | null = null,
): EntityInstance {
	const file = ifcFile ?? (element.file as IfcFile);
	let copiedMap: Map<number, EntityInstance>;
	if (copiedEntities === null) {
		copiedMap = new Map();
	} else {
		copiedMap = copiedEntities;
		const existing = copiedMap.get(element.id());
		if (existing) return existing;
	}

	const result = file.createEntity(element.isA());
	if (element.id()) {
		copiedMap.set(element.id(), result);
	}

	const count = element.attributeCount();
	for (let i = 0; i < count; i++) {
		let attribute: unknown = element.getByIndex(i);
		if (attribute === null) continue;
		if (attribute instanceof EntityInstance) {
			if (exclude?.some((e) => attribute instanceof EntityInstance && attribute.isA(e))) {
				// excluded -- reference the original as-is, matches Python's `pass`.
			} else if (excludeCallback?.(attribute)) {
				// excluded -- ditto.
			} else {
				attribute = copyDeep(file, attribute, exclude, excludeCallback, copiedMap);
			}
		} else if (Array.isArray(attribute) && attribute.length > 0 && attribute[0] instanceof EntityInstance) {
			const first = attribute[0] as EntityInstance;
			if (exclude?.some((e) => first.isA(e))) {
				// excluded -- ditto.
			} else if (excludeCallback?.(first)) {
				// excluded -- ditto.
			} else {
				attribute = (attribute as EntityInstance[]).map((item) =>
					copyDeep(file, item, exclude, excludeCallback, copiedMap),
				);
			}
		}
		if (attributeNameAt(result, i) === "GlobalId") {
			result.setByIndex(i, guid.new());
		} else {
			result.setByIndex(i, attribute);
		}
	}
	return result;
}

/**
 * Python: `replace_element(element, replacement) -> None`.
 *
 * Walks every inverse of `element` (every entity that references it), replacing each
 * reference with `replacement` via `replaceAttribute`.
 */
export function replaceElement(element: EntityInstance, replacement: EntityInstance): void {
	const file = element.file as IfcFile;
	for (const inverse of file.getInverse(element) as Set<EntityInstance>) {
		replaceAttribute(inverse, element, replacement);
	}
}

/**
 * Python: `@functools.cache def _is_set_attribute(schema_identifier, ifc_class, index)
 * -> bool`.
 *
 * Whether forward attribute `index` of `ifcClass` (within `ifcFile`'s schema) is
 * declared as an EXPRESS `SET` (vs. `LIST`/`BAG`) -- `SET` aggregates may not contain
 * duplicate members, whereas `LIST`/`BAG` aggregates may, so only a `SET`-typed
 * attribute is safe for `replaceAttribute` to deduplicate.
 *
 * See this section's header comment (finding 1): the primitive layer has no way to
 * distinguish `SET` from `LIST`/`BAG`/`ARRAY` (the underlying C++
 * `aggregation_type::type_of_aggregation()` accessor was never bound as an N-API
 * primitive), so this always returns `false` -- never treating an attribute as
 * `SET`-typed is the conservative choice: at worst, `replaceAttribute` leaves behind a
 * duplicate a real `SET` would have silently absorbed (a value already present, now
 * present twice), which is recoverable/inspectable data, rather than the alternative of
 * incorrectly deduplicating a `LIST`/`BAG` attribute that legitimately contains
 * repeated values (irrecoverable data loss). A real, disclosed limitation -- not a
 * silent wrong answer.
 */
function isSetAttribute(_entity: EntityInstance, _index: number): boolean {
	// No `@functools.cache`-equivalent memoization here -- unlike Python's version,
	// this never actually consults the schema (see the doc comment above: there is
	// nothing left to look up once the primitive surface hits its gap), so there is no
	// per-(schema,class,index) native call to amortize. `entity`/`index` are accepted
	// (not just ignored positionally) to keep this function's shape a drop-in stand-in
	// for a real `_is_set_attribute` once the missing primitive exists.
	return false;
}

/**
 * Python: `has_element_reference(value, element) -> bool` (module-private helper, no
 * leading underscore in Python but grouped with `_is_set_attribute` as a "private
 * helper" per this chunk's own task brief -- kept non-exported here to match).
 *
 * Recursively checks whether `value` (possibly a nested list) contains a reference to
 * `element`.
 */
function hasElementReference(value: unknown, element: unknown): boolean {
	if (Array.isArray(value)) {
		return value.some((v) => hasElementReference(v, element));
	}
	return valuesEqual(value, element);
}

/** Python's `v == old`/`value == element` for two arbitrary (possibly non-entity) attribute values. */
function valuesEqual(a: unknown, b: unknown): boolean {
	if (a instanceof EntityInstance) return a.equals(b);
	if (b instanceof EntityInstance) return b.equals(a);
	return a === b;
}

/**
 * Python's `seen = set(); deduplicated = [v for v in new_value if v not in seen ...]`
 * idiom from `replace_attribute` -- order-preserving de-duplication, hashing an
 * `EntityInstance` by `.identity()` (matching this module's `EntityInstanceSet`
 * convention throughout) and everything else by raw value (`===`).
 *
 * A `/code-review` finding worth disclosing here: since `isSetAttribute` always
 * returns `false` (see its own doc comment), `replaceAttribute`'s call to this
 * function is currently unreachable in practice -- this logic has no direct test
 * coverage of its own today (only indirectly, once the missing primitive lands and
 * `isSetAttribute` starts returning real values). Kept as a straightforward,
 * self-contained, faithful port of Python's own dedup idiom rather than deferred,
 * so nothing else needs to change the day that primitive is filled in.
 */
function dedupePreservingOrder(values: readonly unknown[]): unknown[] {
	const seenIdentities = new Set<number>();
	const seenValues = new Set<unknown>();
	const result: unknown[] = [];
	for (const v of values) {
		if (v instanceof EntityInstance) {
			const id = v.identity();
			if (seenIdentities.has(id)) continue;
			seenIdentities.add(id);
		} else {
			if (seenValues.has(v)) continue;
			seenValues.add(v);
		}
		result.push(v);
	}
	return result;
}

/**
 * Python: `replace_attribute(element, old, new) -> None`.
 *
 * Walks every forward attribute of `element` (using the already-ported `walk()`
 * helper), replacing any reference to `old` with `new`. See `isSetAttribute`'s own doc
 * comment for a disclosed, genuine divergence from Python here: because the primitive
 * layer can't currently distinguish a `SET`-typed aggregate attribute from a `LIST`/
 * `BAG`-typed one, this never deduplicates a replaced aggregate member, even where a
 * real EXPRESS `SET` (e.g. `IfcRelAggregates.RelatedObjects`) would have. Concretely:
 * replacing `old` with `new` in a `SET` attribute that already contains `new` leaves a
 * duplicate `new` entry where Python's own `test_replacing_into_a_set_deduplicates_the
 * _survivor` shows it would have collapsed to one -- see
 * `test/util/element.test.ts`'s own dedicated test for this exact, disclosed case.
 */
export function replaceAttribute(element: EntityInstance, old: unknown, newValue: unknown): void {
	const count = element.attributeCount();
	for (let i = 0; i < count; i++) {
		const attributeValue = element.getByIndex(i);
		if (!hasElementReference(attributeValue, old)) continue;
		let replaced = EntityInstance.walk(
			(v) => valuesEqual(v, old),
			() => newValue,
			attributeValue,
		);
		if (Array.isArray(attributeValue) && hasElementReference(attributeValue, newValue) && isSetAttribute(element, i)) {
			replaced = dedupePreservingOrder(replaced as unknown[]);
		}
		element.setByIndex(i, replaced);
	}
}

/**
 * Python: `remove_deep(ifc_file, element) -> None`.
 *
 * Recursively purges a subgraph safely.
 *
 * **Do not use, use `removeDeep2` instead** -- this is the older, simpler algorithm,
 * kept only because Python still exports it (its own docstring says the same thing;
 * ported faithfully, not "fixed" or dropped, per this chunk's own instructions).
 */
export function removeDeep(ifcFile: IfcFile | null, element: EntityInstance): void {
	const file = ifcFile ?? (element.file as IfcFile);
	file.batch();
	const subgraph = file.traverse(element, null, true);
	const subgraphSet = new EntityInstanceSet();
	subgraphSet.update(subgraph);
	for (const ref of [...subgraph].reverse()) {
		const inverses = file.getInverse(ref) as Set<EntityInstance>;
		if (ref.id() && [...inverses].every((inv) => subgraphSet.has(inv))) {
			file.remove(ref);
		}
	}
	file.unbatch();
}

/**
 * Python: `batch_remove_deep2(ifc_file) -> None`.
 *
 * Enable batch removal after running `removeDeep2` using serialisation.
 *
 * See #944 and #3226. Removing elements in an IFC graph is slow, as a lot of mappings
 * need to be edited. In larger models (>100MB) and when removing many elements
 * (>10000), it is faster to serialise the IFC, remove elements using string
 * replacement, and then reload the modified serialised IFC.
 *
 * The trade-off is that extra memory will be used, and string replacement only works
 * with `removeDeep2` where the removed elements have no inverses. In addition,
 * transaction history will be lost, and any scripts using this method will have to
 * refetch elements from the reloaded IFC and cannot rely on existing variables in
 * memory.
 *
 * Example:
 * ```ts
 * const element1 = file.byId(123);
 * const element2 = file.byId(456);
 *
 * batchRemoveDeep2(file);
 * removeDeep2(file, element2);
 *
 * // Notice how we reload the model.
 * const reloaded = unbatchRemoveDeep2(file);
 *
 * console.log(element1); // Don't call element1!
 * ```
 */
export function batchRemoveDeep2(ifcFile: IfcFile): void {
	ifcFile.toDelete = new Set();
}

/**
 * Python: `unbatch_remove_deep2(ifc_file) -> file`.
 *
 * Finish removing elements batched from `removeDeep2` using string replacement. See
 * `batchRemoveDeep2`'s own doc comment for the full story, and this section's header
 * comment (finding 2) for how this ports Python's `file.to_string()`/
 * `ifcopenshell.file.from_string()` pair without a new native primitive.
 *
 * **Returns a newly loaded file with the batched elements removed. The caller must
 * discard the old `ifcFile` (and any `EntityInstance`s minted from it) and use the
 * returned file instead** -- ported faithfully from Python's own docstring warning,
 * which is easy to lose in translation and a real footgun if silently dropped.
 */
export function unbatchRemoveDeep2(ifcFile: IfcFile): IfcFile {
	const toDelete = ifcFile.toDelete;
	if (toDelete === null) {
		throw new Error("unbatchRemoveDeep2: ifcFile.toDelete is null -- call batchRemoveDeep2 first");
	}

	const tempPath = path.join(
		os.tmpdir(),
		`ifcopenshell-ts-unbatch-remove-deep2-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.ifc`,
	);
	let ifcString: string;
	try {
		ifcFile.write(tempPath);
		ifcString = fs.readFileSync(tempPath, "utf-8");
	} finally {
		try {
			fs.unlinkSync(tempPath);
		} catch {
			// Best-effort cleanup -- the temp file living in `os.tmpdir()` a little
			// longer isn't a correctness problem.
		}
	}

	const lines = ifcString.split("\n");
	const idsToDelete = [...toDelete].map((e) => e.id()).sort((a, b) => a - b);
	let cursor = 0;
	const result: string[] = [];
	for (const line of lines) {
		if (cursor >= idsToDelete.length) {
			result.push(line);
			continue;
		}
		if (line.startsWith(`#${idsToDelete[cursor]}=`)) {
			cursor++;
		} else {
			result.push(line);
		}
	}

	ifcFile.toDelete = null;
	const buffer = Buffer.from(result.join("\n"), "utf-8");
	const handle = native.file_new_with_data_data_size(buffer, buffer.length);
	return new IfcFile(handle);
}

/**
 * `target.push(...items)` (Python's `list.extend()`), but without spreading `items` as
 * individual call arguments -- V8 throws `RangeError: Maximum call stack size
 * exceeded` for `Function.prototype.apply`/spread-call argument lists past roughly
 * 120,000 elements (confirmed empirically against this project's own Node runtime, not
 * assumed), unlike Python's `list.extend()`, which has no such limit. `removeDeep2`
 * below is exactly the code path this matters for: its neighboring, faithfully-ported
 * `#3052` large-aggregate-list workaround comment describes real IFC models with
 * `IfcPolygonalFaceSet.Faces` referencing tens of thousands of
 * `IfcIndexedPolygonalFace` -- precisely the scale that would otherwise crash this
 * port outright (where Python only gets slow) instead of merely being slow. A
 * `/code-review` finding on this chunk, not a Python behavior to preserve -- Python
 * has no equivalent limit to port faithfully here, so a plain loop is the correct fix,
 * not a divergence.
 */
function pushAll<T>(target: T[], items: readonly T[]): void {
	for (const item of items) target.push(item);
}

/**
 * Python: `remove_deep2(ifc_file, element, also_consider=[], do_not_delete=set()) ->
 * None`.
 *
 * Recursively purges a subgraph safely, starting at an element.
 *
 * This should always be used instead of `removeDeep`. See #1812. The start element
 * must have no inverses. The subgraph to be purged is calculated using all forward
 * relationships determined by `traverse()`.
 *
 * The deletion process starts at `element` and traverses forward through the subgraph.
 * Each subelement is checked for any inverses outside the subgraph. If there are none
 * outside, it may be safely purged. If there are inverses that aren't part of this
 * subgraph, that subelement, and all of its subelements (i.e. that entire branch), will
 * not be deleted, as it is used elsewhere.
 *
 * For simple subgraphs, `traverse()` is sufficient to fully represent all related
 * subelements. When it isn't, `alsoConsider` may be used -- typically inverses further
 * down the subelement chain.
 *
 * Note that `removeDeep2` will _not_ remove elements in `alsoConsider`. Instead, it is
 * only used as a consideration for whether an element has all inverses fully contained
 * in the subgraph.
 *
 * `doNotDelete` contains elements that may be part of the subgraph but are protected
 * from deletion.
 *
 * :param alsoConsider: elements to also consider as part of a subgraph. Order could
 *   matter for performance -- elements that reference `element` directly should go
 *   first.
 * :param doNotDelete: elements to protect from deletion.
 */
export function removeDeep2(
	ifcFile: IfcFile | null,
	element: EntityInstance,
	alsoConsider: readonly EntityInstance[] = [],
	doNotDelete: Iterable<EntityInstance> = [],
): void {
	const file = ifcFile ?? (element.file as IfcFile);

	const totalInverses = file.getTotalInverses(element);
	if (totalInverses > 0) {
		const areInversesContained = (): boolean => {
			let alsoConsideredInverses = 0;
			for (const consideredElement of alsoConsider) {
				const traverse = file.traverse(consideredElement, 1);
				if (traverse.some((e) => e.equals(element))) {
					alsoConsideredInverses += 1;
					if (totalInverses === alsoConsideredInverses) return true;
				}
			}
			return false;
		};
		if (!areInversesContained()) return;
	}

	const doNotDeleteSet = new EntityInstanceSet();
	doNotDeleteSet.update(doNotDelete);

	const toDelete = new EntityInstanceSet();
	const subgraph: EntityInstance[] = file.traverse(element, null, true);
	pushAll(subgraph, alsoConsider);
	const subgraphSet = new EntityInstanceSet();
	subgraphSet.update(subgraph);

	const subelementQueue: EntityInstance[] = [element];
	const processedIds = new Set<number>();

	while (subelementQueue.length > 0) {
		const subelement = subelementQueue.shift() as EntityInstance;
		const subelementId = subelement.id();
		if (
			subelementId &&
			!processedIds.has(subelementId) &&
			!doNotDeleteSet.has(subelement) &&
			(file.getTotalInverses(subelement) < 2 ||
				[...(file.getInverse(subelement) as Set<EntityInstance>)].every((inv) => subgraphSet.has(inv)))
		) {
			toDelete.add(subelement);
			pushAll(subelementQueue, file.traverse(subelement, 1).slice(1));
			// See #3052 (Python's own comment, ported verbatim): IfcOpenShell is
			// extremely slow removing an element that has an inverse referencing it
			// through a big list (e.g. IfcPolygonalFaceSet.Faces with tens of
			// thousands of IfcIndexedPolygonalFace). Since `subelement` is already
			// confirmed for deletion, clear any large (>10, an arbitrary threshold)
			// list attribute on it now to sidestep that cost -- purely a performance
			// workaround, not an observable behavior change, since `subelement` is
			// being deleted regardless.
			const count = subelement.attributeCount();
			for (let i = 0; i < count; i++) {
				const attribute = subelement.getByIndex(i);
				if (Array.isArray(attribute) && attribute.length > 10) {
					subelement.setByIndex(i, []);
				}
			}
		}
		processedIds.add(subelementId);
	}

	const existingToDelete = file.toDelete;
	if (existingToDelete !== null) {
		const merged = new EntityInstanceSet();
		merged.update(existingToDelete);
		merged.update(toDelete.toSet());
		file.toDelete = merged.toSet();
		return;
	}

	// Delete elements from subgraph in reverse order to allow batching to work.
	for (const subelement of [...subgraph].reverse()) {
		if (!toDelete.has(subelement)) continue;
		toDelete.delete(subelement);
		file.remove(subelement);
	}
}
