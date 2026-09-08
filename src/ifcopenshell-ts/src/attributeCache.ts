// This file was generated with the assistance of an AI coding tool.
//
// Attribute-metadata cache backing `EntityInstance`'s attribute `Proxy`
// (`entityInstance.ts`). `planning/ifcopenshell-ts/10-architecture.md` SS6
// ("Attribute access design"): unlike Python's in-process SWIG binding, an N-API call
// pays real per-crossing marshaling overhead -- since `entity_instance_mixin.__getattr__`/
// `__setattr__`'s TS translation (the Proxy `get`/`set` traps) runs on *every single
// attribute access*, the Proxy must not call the native `get_attribute_category`/
// `get_argument_index` primitives per access. This module instead populates a
// `Map<schemaIdentifier, Map<className, AttributeMeta[]>>`-shaped cache once per
// (schema, class) pair, via a bulk schema-introspection call
// (`entity.all_attributes()`/`all_inverse_attributes()`, already-existing primitives,
// no new native surface needed), and never evicts -- schema metadata for a compiled-in
// schema identifier is immutable for the life of the process, so a simple
// never-evicted module-level `Map` is correct; no TTL/eviction logic is warranted
// (`research/07-fresh-wrapper-per-access.md`'s own note: "the attribute-metadata cache
// ... is unaffected [by fresh-wrapper-per-access] -- it's keyed by schema/class name,
// not by instance identity").
//
// A second real bug, found by `/code-review` and fixed here (not just disclosed): the
// original version of this cache's inverse-attribute metadata carried only the
// *referencing* attribute's bare name (`attributeReferenceName`, e.g. "RelatedObjects"),
// which `EntityInstance.getInverseAttribute` used to match candidate instances by name
// alone -- but that name is independently declared on multiple, unrelated sibling
// EXPRESS entities (e.g. "RelatedObjects" appears on `IfcRelAggregates`,
// `IfcRelDefinesByProperties`, `IfcRelAssociatesMaterial`, and others that are not
// subtypes of each other), so a named inverse attribute like `IfcObject.IsDefinedBy`
// (whose declared `entity_reference` scopes it to `IfcRelDefinesByType`/
// `IfcRelDefinesByProperties` only) could incorrectly also match an unrelated
// `IfcRelAggregates` instance that merely happens to share the attribute name --
// confirmed with a real repro against the built addon (an `IfcWall` referenced by both
// an `IfcRelAggregates` and an `IfcRelDefinesByProperties` via their respective
// `RelatedObjects`: `wall.get("IsDefinedBy")` incorrectly returned both, not just the
// `IfcRelDefinesByProperties` one). Fixed by additionally caching each inverse
// attribute's `entityReferenceHandle`/`referenceAttributeIndex` (see `AttributeMeta`
// below) so `getInverseAttribute` can call the *already-exposed*, correctly type- and
// index-scoped `file.get_inverse(instanceId, declaration, attributeIndex)` primitive
// instead of the broad, unscoped `instances_by_reference` + name-probe it used before
// -- see `entityInstance.ts`'s `getInverseAttribute` for the fix itself and its own
// extended comment on the one non-obvious detail (safely reinterpreting an `entity`
// handle as a `declaration` handle for that call).
//
// A real, disclosed primitive-layer gap and how it's worked around: `all_attributes()`
// includes EXPRESS *derived*-attribute slots too (`entity::attributes_`/`derived_` are
// parallel vectors in `src/ifcparse/schema.h` -- a derived attribute still occupies a
// real index in the schema's attribute layout), but `entity` has no exposed
// `derived()` accessor (the C++ method exists, used internally by the shim's own
// `get_attribute_category`, but wrappergen never generated a binding for it -- nothing
// before this chunk needed a *bulk* forward-vs-derived split). An earlier version of
// this module blindly treated every `all_attributes()` entry as FORWARD; the
// differential test this file's design is built to satisfy
// (`test/attributeCache.test.ts`, `40-testing-strategy.md` SS5.5) caught this exact
// bug immediately (`IfcGeometricRepresentationSubContext.CoordinateSpaceDimension`:
// cache said FORWARD, ground truth said DERIVED) -- confirming the derived-slot
// mapping is real, not theoretical, in all three schema versions. Fixed without a new
// primitive: `buildClassAttributeCache` takes a `sampleInstance` (a real,
// already-live `entity_instance` of the class being cached, or a descendant --
// whichever instance's own property access is what triggered this cache population in
// the first place) and calls the existing per-name `get_attribute_category` primitive
// once per candidate name, but only ever during this one-time-per-class population,
// never per subsequent access -- still the exact optimization this cache exists for.
// A name whose category disagrees (DERIVED, not FORWARD) is excluded from the cache
// entirely; `EntityInstance.get()`/`.set()` (unchanged by this chunk) already throw
// "has no attribute" for both a derived name and a genuinely invalid one, and a cache
// miss falls back to them unchanged (see `entityInstance.ts`'s Proxy handler) -- so
// this exclusion reproduces `.get()`'s own existing behavior exactly, it doesn't add
// new behavior.

import type {
	attribute as NativeAttribute,
	entity as NativeEntity,
	entity_instance as NativeEntityInstance,
} from "./native/ifcopenshell_native";

/** `entity_instance.get_attribute_category(name)`'s return value (research/01 SS5). */
export const AttributeCategory = {
	INVALID: 0,
	FORWARD: 1,
	INVERSE: 2,
	DERIVED: 3,
} as const;

export interface AttributeMeta {
	readonly name: string;
	readonly category: (typeof AttributeCategory)["FORWARD"] | (typeof AttributeCategory)["INVERSE"];
	/** Forward-attribute index (`EntityInstance.getByIndex`/`.setByIndex`); -1 for inverse attributes. */
	readonly index: number;
	/**
	 * Inverse attributes only: the *referencing* attribute's name on the related
	 * entity (`inverse_attribute.attribute_reference().name()`) -- kept for
	 * diagnostics/documentation; `getInverseAttribute` itself now resolves candidates
	 * via `entityReferenceHandle`/`referenceAttributeIndex` below, not this name (see
	 * this file's header comment for why name-matching alone is unsound).
	 */
	readonly attributeReferenceName?: string;
	/**
	 * Inverse attributes only: the raw native handle of
	 * `inverse_attribute.entity_reference()` (an `entity`-typed handle) -- passed to
	 * `file.get_inverse(instanceId, declaration, attributeIndex)` by
	 * `EntityInstance.getInverseAttribute`, which reinterprets it as a
	 * `declaration`-typed handle (safe -- see that method's own comment for why).
	 */
	readonly entityReferenceHandle?: unknown;
	/**
	 * Inverse attributes only: `attribute_reference()`'s index within
	 * `entity_reference().all_attributes()` -- the `attributeIndex` argument
	 * `file.get_inverse` needs, resolved once here instead of on every access.
	 */
	readonly referenceAttributeIndex?: number;
	/** Inverse attributes only: cardinality bounds, consulted by `settings.unpackNonAggregateInverses`. */
	readonly bound1?: number;
	readonly bound2?: number;
}

export interface ClassAttributeCache {
	readonly list: readonly AttributeMeta[];
	readonly byName: ReadonlyMap<string, AttributeMeta>;
}

export const EMPTY_CLASS_ATTRIBUTE_CACHE: ClassAttributeCache = { list: [], byName: new Map() };

// schemaIdentifier -> className -> per-class cache. Keyed by the *registered* schema
// identifier (`declaration.schema().name()`, e.g. "IFC4"/"IFC2X3"/"IFC4X3_ADD2" -- the
// same value `IfcFile.schemaIdentifier` exposes), not `IfcFile.schema`'s coarser
// normalized "IFC2X3"/"IFC4"/"IFC4X3" -- attribute layout doesn't differ across
// `_ADD`/`_TC` revisions of the same base schema in practice, but keying by the exact
// registered identifier is the conservative, always-correct choice and costs nothing
// (still one cache entry per process-registered schema, never more than a handful).
const schemaCache = new Map<string, Map<string, ClassAttributeCache>>();

function buildClassAttributeCache(
	entityDeclaration: NativeEntity,
	sampleInstance: NativeEntityInstance,
): ClassAttributeCache {
	const list: AttributeMeta[] = [];
	const byName = new Map<string, AttributeMeta>();
	const forward: NativeAttribute[] = entityDeclaration.all_attributes();
	for (let index = 0; index < forward.length; index++) {
		const name = forward[index].name();
		// Excludes EXPRESS *derived* attribute slots -- see this file's header comment.
		if (sampleInstance.get_attribute_category(name) !== AttributeCategory.FORWARD) continue;
		const meta: AttributeMeta = { name, category: AttributeCategory.FORWARD, index };
		list.push(meta);
		byName.set(meta.name, meta);
	}
	for (const inverse of entityDeclaration.all_inverse_attributes()) {
		const entityReference = inverse.entity_reference();
		const attributeReference = inverse.attribute_reference();
		const referenceAttributeIndex = entityReference
			.all_attributes()
			.findIndex((attribute) => attribute.name() === attributeReference.name());
		const meta: AttributeMeta = {
			name: inverse.name(),
			category: AttributeCategory.INVERSE,
			index: -1,
			attributeReferenceName: attributeReference.name(),
			entityReferenceHandle: entityReference._handle,
			referenceAttributeIndex,
			bound1: inverse.bound1(),
			bound2: inverse.bound2(),
		};
		list.push(meta);
		byName.set(meta.name, meta);
	}
	return { list, byName: byName as ReadonlyMap<string, AttributeMeta> };
}

/**
 * Returns (populating on first use) the cached attribute metadata for `className`
 * within `schemaIdentifier`. `entityDeclaration`/`sampleInstance` are only consulted
 * -- i.e. only cross into native primitives at all -- on a cache miss; `sampleInstance`
 * should be a real, already-live `entity_instance` of `className` or a descendant
 * (typically whichever instance's own property access triggered this call), used only
 * to exclude EXPRESS derived-attribute slots (see this file's header comment) -- never
 * read for its actual attribute *values*.
 */
export function getClassAttributeMeta(
	schemaIdentifier: string,
	className: string,
	entityDeclaration: NativeEntity,
	sampleInstance: NativeEntityInstance,
): ClassAttributeCache {
	let classes = schemaCache.get(schemaIdentifier);
	if (!classes) {
		classes = new Map();
		schemaCache.set(schemaIdentifier, classes);
	}
	let cached = classes.get(className);
	if (!cached) {
		cached = buildClassAttributeCache(entityDeclaration, sampleInstance);
		classes.set(className, cached);
	}
	return cached;
}

/** Test-only escape hatch: clears the cache so a test can force a clean population. */
export function _clearAttributeMetaCacheForTests(): void {
	schemaCache.clear();
}
