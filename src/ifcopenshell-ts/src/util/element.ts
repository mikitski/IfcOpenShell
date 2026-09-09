// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/element.py` (src/ifcopenshell-python) --
// planning/ifcopenshell-ts/research/03-python-util-inventory.md's "element.py" entry,
// "Porting priority suggestion" section (element.py is Tier A, do-first, ported ahead
// of everything else in `util` since most of it depends on this module). This is
// **chunk 1 of 3** for `element.py` (2009 lines, ~67 functions -- too large for one
// PR, matching this project's own chunk-size discipline): the property-set/quantity-set
// and type/material/style query functions. Chunk 2 (this same file, appended below)
// covers the spatial/structural-graph query functions. Chunk 3 (structural-editing
// helpers: `copy`/`remove_deep`/`replace_element`) is a separate, later PR against this
// same file -- not touched here.
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
// Explicitly NOT in this chunk's scope (see the task brief this was built from):
// `get_shape_aspects` (calls `ifcopenshell.util.representation`, a not-yet-ported Tier B
// module), `get_referenced_elements` (see chunk 2's header comment below for why), and
// everything else in `element.py` not listed above (structural-editing helpers) --
// future chunks.
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
// 2. The N-API attribute-value shim (`wrappergen/shim/attribute_value_shim.*`) auto-
//    unwraps `IfcValue`-typed attributes (e.g. `IfcPropertySingleValue.NominalValue`,
//    declared as `IfcLabel`/`IfcText`/`IfcInteger`/...) directly to a raw JS
//    string/number/boolean, unlike Python's SWIG binding, which returns a nested
//    `entity_instance` wrapper requiring `.wrappedValue` to unwrap (confirmed
//    empirically against the built addon, not assumed). This is convenient -- it means
//    `get_property`/`get_properties`/`get_quantity`/`get_quantities` never need a
//    `.wrappedValue` call at all in this port -- but it also means the exact EXPRESS
//    type name of the wrapped value (e.g. "IfcLabel") is lost at the shim layer, which
//    Python's verbose `get_property`/`get_properties` output surfaces as `"value_type"`.
//    This chunk always returns `value_type: null` for that key (see `getProperty`/
//    `getProperties` below) rather than fabricate a value -- a real, disclosed primitive-
//    layer limitation, not something this chunk should fix (would need a new native
//    primitive, out of scope here).

import { AttributeCategory, type EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";

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
		let result: unknown;
		if (prop.isA("IfcPropertySingleValue")) {
			// 2 IfcPropertySingleValue.NominalValue -- see this file's header comment on
			// why `.wrappedValue` isn't needed (and `value_type` can't be recovered).
			result = prop.getByIndex(2);
			isSingleValue = true;
		} else if (prop.isA("IfcPropertyEnumeratedValue")) {
			// 2 IfcPropertyEnumeratedValue.EnumerationValues
			result = prop.getByIndex(2);
		} else if (prop.isA("IfcPropertyListValue")) {
			// 2 IfcPropertyListValue.ListValues
			result = prop.getByIndex(2);
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
			// See this file's header comment: the EXPRESS type name of a `NominalValue`
			// can't be recovered from the N-API shim's already-unwrapped raw JS value.
			if (isSingleValue) verboseResult.value_type = null;
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
			// 2 IfcPropertySingleValue.NominalValue
			const value = prop.getByIndex(2);
			// See this file's header comment: `value_type` can't be recovered.
			results[propName] = verbose ? { id: prop.id(), class: prop.isA(), value, value_type: null } : value;
		} else if (ifcClass === "IfcPropertyEnumeratedValue" || ifcClass === "IfcPropertyListValue") {
			// 2 IfcPropertyEnumeratedValue.EnumerationValues / IfcPropertyListValue.ListValues
			const value = prop.getByIndex(2);
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
