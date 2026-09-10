// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/schema.py` (src/ifcopenshell-python, 695
// lines) -- planning/ifcopenshell-ts/research/03-python-util-inventory.md's own
// "schema.py" entry, next in Phase 3's `util` Tier A sequencing after `util.element`
// (now fully ported across 3 chunks). **This chunk ports lines 1-314 only** (everything
// up to, but NOT including, `class Migrator:`) -- the query/reflection functions and
// `BatchReassignClass`. `Migrator` itself (~380 lines, a JSON-data-file-driven
// cross-schema migration engine) is architecturally distinct and large enough to
// warrant its own separate, later chunk, matching `util.element`'s own established
// "split large modules" precedent. `_enum_value_outside_target` (a `Migrator`-only
// private helper -- verified its one and only call site is inside `Migrator.migrate`,
// `schema.py` line ~633, no other caller anywhere in the file) is also NOT ported here
// for the same reason.
//
// Ported in this chunk: `getFallbackSchema`, `getDeclaration`, `isA`, `getSupertypes`,
// `getSubtypes`, `geometryClassesIntroducedAfter`, `ifc4OnlyGeometryClasses`,
// `reassignClass`, `BatchReassignClass`.
//
// Naming note (flagged per this chunk's own task brief): Python's `schema.is_a(decl,
// ifc_class)` operates on a *schema declaration* object, not an `entity_instance` --
// semantically different from (and easily confusable with) this project's own
// `EntityInstance.isA()` (Phase 2). Kept as a free function `isA(declaration,
// ifcClass)` in this module's own namespace (imported as `schema.isA` via the `util`
// barrel, mirroring Python's `ifcopenshell.util.schema.is_a`), never re-exported bare
// where it could shadow `EntityInstance.isA` -- callers disambiguate by import path,
// same as Python callers disambiguate by `ifcopenshell.util.schema.is_a` vs.
// `entity_instance.is_a`.
//
// *** Real, disclosed primitive-layer gap found while porting `getSubtypes`: ***
// `entity::subtypes()` is a real C++ accessor (`src/ifcparse/schema.h`: `const
// std::vector<const entity*>& subtypes() const`) but has NO N-API binding anywhere --
// confirmed via both the TS `entity` class (only `is_abstract`/`attributes`/
// `inverse_attributes`/`all_attributes`/`all_inverse_attributes`/`attribute_by_index`/
// `attribute_count`/`supertype`/`as_entity`, no `subtypes`) and the C API header (no
// `ifcopenshell_entity_subtypes` symbol exists in
// `ifcopenshell_native_c_api.h`). Worked around without a new primitive (per this
// chunk's own instructions to prefer a workaround over adding native surface):
// `subtypesOf` below reconstructs the direct-subtype relationship by scanning every
// entity declaration in the owning schema (`schema_definition.declarations()`,
// already bound) and grouping by `.supertype()`. Verified this produces the *same
// relative order* `entity::subtypes()` itself would: the real C++ `subtypes()` vectors
// are populated by the generated schema `.cpp` files (e.g.
// `src/ifcparse/schemas/Ifc4x3_rc4-schema.cpp`'s `set_subtypes({...})` calls) in
// strictly ascending `index_in_schema` order, and `schema_definition::declarations()`
// is itself already sorted by `index_in_schema` (`declaration_by_index_sort`,
// `src/ifcparse/schema.h`) -- so grouping while iterating `declarations()` in order
// naturally preserves the identical relative ordering, confirmed by reading the actual
// generated schema source, not assumed.

import { AttributeCategory, EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import type {
	attribute as NativeAttribute,
	declaration as NativeDeclaration,
	entity as NativeEntity,
	schema_definition as NativeSchemaDefinition,
} from "../native/ifcopenshell_native";
import { declaration as NativeDeclarationCtor } from "../native/ifcopenshell_native";
import * as template from "../template";
import { getPrimitiveType } from "./attribute";

/** Python: `IFC_SCHEMA = Literal["IFC2X3", "IFC4", "IFC4X3"]`. */
export type IFC_SCHEMA = "IFC2X3" | "IFC4" | "IFC4X3";

/**
 * Python: `get_fallback_schema(version: str) -> IFC_SCHEMA`.
 *
 * Fallback to the schema version this project has docs/mapping for. Needed to support
 * IFC versions like `IFC4X3_RC1`, `IFC4X1`, etc. Order matters: `IFC4X3` must be
 * checked before the plain `IFC4` prefix (an `IFC4X3...` string also starts with
 * `"IFC4"`), matching Python's own `elif` ordering exactly.
 */
export function getFallbackSchema(version: string): IFC_SCHEMA {
	if (version.startsWith("IFC4X3")) return "IFC4X3";
	if (version.startsWith("IFC4")) return "IFC4";
	if (version.startsWith("IFC2X3")) return "IFC2X3";
	throw new Error(`Unexpected schema version: ${version}.`);
}

/**
 * Python: `get_declaration(element: entity_instance) -> declaration`.
 *
 * Trivial attribute-access one-liner in Python (`return element.declaration`) -- this
 * chunk found `EntityInstance` had no *public* equivalent (it already resolved
 * `this.native.declaration()` internally in several places, per that method's own doc
 * comment) and added one (`entityInstance.ts`'s `EntityInstance.declaration()`, a
 * one-line, disclosed addition wrapping the already-bound native primitive). This is a
 * thin wrapper around that.
 */
export function getDeclaration(element: EntityInstance): NativeDeclaration {
	return element.declaration();
}

/**
 * Python: `is_a(declaration: ifcopenshell_wrapper.declaration, ifc_class: str) ->
 * bool`. Python calls the SWIG-internal `declaration._is(ifc_class)`; the TS
 * primitive layer's equivalent method is named `is__with_name` (confirmed against
 * `native/ifcopenshell_native.ts`'s `declaration` class), not `_is`/`is`.
 */
export function isA(declaration: NativeDeclaration, ifcClass: string): boolean {
	return declaration.is__with_name(ifcClass);
}

/**
 * Python: `get_supertypes(declaration: entity) -> list[entity]`.
 *
 * Walks `.supertype()` repeatedly until `None`/`null`, in order from parent to
 * grandparent. Fully structural, no primitive gap.
 */
export function getSupertypes(declaration: NativeEntity): NativeEntity[] {
	const results: NativeEntity[] = [];
	let cursor = declaration.supertype();
	while (cursor !== null) {
		results.push(cursor);
		cursor = cursor.supertype();
	}
	return results;
}

/**
 * `entity : public declaration` is single, non-virtual inheritance in the C++ core,
 * and both generated C-API wrapper structs are a single pointer field -- the same
 * verified, disclosed "reinterpret an `entity` handle as a `declaration` handle"
 * technique `entityInstance.ts`'s `getInverseAttribute` already established and
 * documented in full (see that method's own doc comment for the complete
 * justification). Reused here, not re-derived, to reach `entity.schema()` (only
 * exposed on the `declaration` class) from a bare `entity` handle.
 */
function entitySchema(entity: NativeEntity): NativeSchemaDefinition {
	return new NativeDeclarationCtor(entity._handle).schema();
}

/**
 * `entity`'s TS class (unlike the real C++ `entity : public declaration`) does not
 * itself expose `.name()` -- only the `declaration` class does. Same verified,
 * disclosed pointer-reinterpret technique as `entitySchema` above (and
 * `entityInstance.ts`'s `getInverseAttribute`) to reach it from a bare `entity`
 * handle.
 */
function entityName(entity: NativeEntity): string {
	return new NativeDeclarationCtor(entity._handle).name();
}

/**
 * Python: `get_subtypes(declaration: entity) -> list[entity]`.
 *
 * Get a flat list of subtype declarations, recursively. Abstract classes are skipped.
 *
 * Inconsistently (Python's own docstring's word), the declaration itself is also added
 * to this list -- Python's docstring says "This should be fixed [to] exclude the
 * declaration itself," but per this project's verbatim-translation mandate, this
 * documented-as-slightly-odd behavior is ported faithfully, not silently "fixed."
 *
 * See this file's header comment for the real, disclosed `entity::subtypes()`
 * primitive gap and the schema-scan workaround (`directSubtypesOf` below) used instead
 * of a new native primitive.
 */
export function getSubtypes(declaration: NativeEntity): NativeEntity[] {
	const childrenByName = directSubtypesOf(entitySchema(declaration));

	function getClasses(decl: NativeEntity): NativeEntity[] {
		const results: NativeEntity[] = [];
		if (!decl.is_abstract()) {
			results.push(decl);
		}
		for (const subtype of childrenByName.get(entityName(decl)) ?? []) {
			results.push(...getClasses(subtype));
		}
		return results;
	}

	return getClasses(declaration);
}

/** @internal Grouping helper backing `getSubtypes`'s workaround -- see this file's
 * header comment. Not memoized (unlike Python's implicit reliance on the native
 * `subtypes()` vector being pre-computed once at schema-load time): this chunk
 * recomputes it on every `getSubtypes` call, since a `schema_definition` handle isn't
 * itself a stable cache key across the `template.create()`-based schema access this
 * module also needs (see `getSchemaDefinition` below) -- an accepted, small,
 * per-call cost (one linear scan of the schema's entities), not a correctness issue.
 */
function directSubtypesOf(schema: NativeSchemaDefinition): Map<string, NativeEntity[]> {
	const children = new Map<string, NativeEntity[]>();
	for (const declaration of schema.declarations()) {
		const entity = declaration.as_entity();
		if (entity === null) continue;
		const supertype = entity.supertype();
		if (supertype === null) continue;
		const supertypeName = entityName(supertype);
		const siblings = children.get(supertypeName);
		if (siblings) {
			siblings.push(entity);
		} else {
			children.set(supertypeName, [entity]);
		}
	}
	return children;
}

// --- `geometryClassesIntroducedAfter`/`ifc4OnlyGeometryClasses` schema access ---
//
// Both need a `schema_definition` for an arbitrary `IFC_SCHEMA` name, independent of
// any already-open `IfcFile` -- unlike `util/element.ts` chunk 3's own schema access
// (which reaches `element.file`'s already-bound `nativeFile.schema()`, sidestepping
// this entirely), there is no element/file in scope here. Investigated: there is no
// free-standing `schema_by_name`/`schema_registry`-instance-obtaining primitive on
// this surface either (`schema_registry_get` needs a `schema_registry` *handle*, and
// nothing constructs/returns one) -- confirmed via the C API header, not assumed. The
// only available route is `template.create()` (already used elsewhere in this
// project, e.g. `test/bootstrap.ts`'s `createTestFile`, for exactly this "get a real
// file for schema X" need), reading `.nativeFile.schema()` off the resulting file.
// Cached per schema (module-level, process-lifetime) since this is a real, if small,
// cost (building + parsing a template SPF file) -- mirroring the spirit of Python's
// own `@functools.cache` on `geometry_classes_introduced_after` itself.

const SCHEMA_TEMPLATE_IDENTIFIER: Record<IFC_SCHEMA, string> = {
	IFC2X3: "IFC2X3",
	IFC4: "IFC4",
	IFC4X3: "IFC4X3_ADD2",
};

const schemaFileCache = new Map<IFC_SCHEMA, IfcFile>();

function getSchemaDefinition(schema: IFC_SCHEMA): NativeSchemaDefinition {
	let file = schemaFileCache.get(schema);
	if (!file) {
		file = template.create({ schemaIdentifier: SCHEMA_TEMPLATE_IDENTIFIER[schema] });
		schemaFileCache.set(schema, file);
	}
	return file.nativeFile.schema();
}

function schemaEntities(schema: NativeSchemaDefinition): NativeEntity[] {
	const results: NativeEntity[] = [];
	for (const declaration of schema.declarations()) {
		const entity = declaration.as_entity();
		if (entity !== null) results.push(entity);
	}
	return results;
}

/**
 * Python: `@functools.cache def geometry_classes_introduced_after(target_schema,
 * source_schema="IFC4") -> frozenset[str]`.
 *
 * `IfcRepresentationItem` subclasses present in `source_schema` but missing in
 * `target_schema`. Memoized per (source, target) pair via a `Map` keyed by a joined
 * string (this module's own "memoize by argument tuple" idiom -- no established
 * precedent for this existed yet in `util/element.ts`'s own helpers to reuse). Returns
 * the *same* `Set` object on repeated calls with the same arguments, matching
 * Python's `@functools.cache` identity guarantee (`test_schema.py`'s own
 * `test_result_is_cached_frozenset` pins exactly this: `first is second`).
 */
export function geometryClassesIntroducedAfter(
	targetSchema: IFC_SCHEMA,
	sourceSchema: IFC_SCHEMA = "IFC4",
): ReadonlySet<string> {
	const cacheKey = `${targetSchema}|${sourceSchema}`;
	const cached = geometryClassesCache.get(cacheKey);
	if (cached) return cached;

	const source = schemaEntities(getSchemaDefinition(sourceSchema));
	const target = schemaEntities(getSchemaDefinition(targetSchema));
	const targetNames = new Set(target.map((e) => entityName(e)));
	const result = new Set<string>();
	for (const decl of source) {
		const declName = entityName(decl);
		if (targetNames.has(declName)) continue;
		let cursor: NativeEntity | null = decl;
		while (cursor !== null) {
			if (entityName(cursor) === "IfcRepresentationItem") {
				result.add(declName);
				break;
			}
			cursor = cursor.supertype();
		}
	}
	geometryClassesCache.set(cacheKey, result);
	return result;
}

const geometryClassesCache = new Map<string, ReadonlySet<string>>();

/**
 * Python: `ifc4_only_geometry_classes() -> frozenset[str]`.
 *
 * Backwards-compatible alias for the IFC4 -> IFC2X3 geometry-gap set. Calls through
 * `geometryClassesIntroducedAfter` with the same fixed arguments, so it shares that
 * function's own cache entry -- repeated calls return the identical `Set` object too.
 */
export function ifc4OnlyGeometryClasses(): ReadonlySet<string> {
	return geometryClassesIntroducedAfter("IFC2X3", "IFC4");
}

// --- `reassignClass` ---

/** Python's `if old_attribute:` truthiness guard in `reassign_class` (see that
 * function's own doc comment below) -- Python truthiness treats `None`, `False`, `0`,
 * `""`, and empty containers (`[]`/`()`/`{}`) as falsy. Ported as closely as JS's
 * different truthiness rules allow: JS already treats `null`/`undefined`/`false`/
 * `0`/`""`/`NaN` as falsy identically to Python, but (unlike Python) treats an empty
 * JS array as *truthy* -- special-cased here to match Python's actual behavior for an
 * empty aggregate attribute value, a small, disclosed divergence from plain JS
 * truthiness (not from Python).
 */
function isPythonFalsy(value: unknown): boolean {
	if (Array.isArray(value)) return value.length === 0;
	return !value;
}

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
 * Whether `value` is a legal item of `attribute`'s enumeration -- `reassignClass`'s
 * own, fully-working substitute for `util/attribute.ts`'s `getEnumItems` (which
 * genuinely cannot answer this in general, see that function's own doc comment for
 * the real, disclosed primitive gap). `enumeration_type.lookup_enum_offset(value)` --
 * a real, working *reverse* (name -> index) lookup that throws for an unknown name --
 * answers exactly this single-value membership question without needing the full
 * item list at all.
 */
function isEnumMember(attribute: NativeAttribute, value: string): boolean {
	const namedType = attribute.type_of_attribute().as_named_type();
	if (namedType === null) return false;
	const enumeration = namedType.declared_type().as_enumeration_type();
	if (enumeration === null) return false;
	try {
		enumeration.lookup_enum_offset(value);
		return true;
	} catch {
		return false;
	}
}

/** Builds a positional-args array (index-aligned to `entityDeclaration.all_attributes()`)
 * from a name-keyed value map, `null` for any attribute not present in `values` --
 * `IfcFile.createEntityWithIdAndAttributes`'s own positional-args contract. */
function positionalArgsFromValues(entityDeclaration: NativeEntity, values: Record<string, unknown>): unknown[] {
	return entityDeclaration.all_attributes().map((attribute) => {
		const value = values[attribute.name()];
		return value === undefined ? null : value;
	});
}

/**
 * Python: `reassign_class(ifc_file, element, new_class) -> entity_instance`.
 *
 * Attempts to change the class (entity name) of `element` to `new_class` by removing
 * `element` and recreating a similar instance of type `new_class` with the same STEP
 * id, preserving compatible attribute values and re-wiring every inverse reference
 * (including the tricky case where an inverse held `element` inside an aggregate
 * attribute -- the new element is appended in the same position). If creating the
 * new-class entity fails, falls back to best-effort recreating the *original* class
 * instead (matching Python's own `try`/`except` safety net), rather than leaving the
 * file in a partially-mutated state.
 *
 * Routes every mutation through the *existing* `IfcFile.remove`/
 * `createEntityWithIdAndAttributes`/`EntityInstance.setByIndex` (which already record
 * `Transaction` operations) -- no new transaction-integration code here, matching
 * `util/element.ts` chunk 3's established rule.
 *
 * `getPrimitiveType(attribute) === "enum"` classification (the only thing this
 * function branches on) is fully, correctly resolvable via `util/attribute.ts`'s
 * structural walk and is NOT affected by that module's own disclosed leaf-simple-type
 * gap (see its doc comment) -- entity/enum/select classification is unaffected by it.
 * One narrow, disclosed nuance: a raw EXPRESS `LOGICAL`-typed attribute (not a real
 * named `enumeration_type`) is, per Python's own string-parsing branch, *also*
 * classified as `"enum"` there -- this port's structural walk cannot currently tell a
 * bare `LOGICAL` apart from the other unclassifiable leaf kinds (the same gap), so it
 * falls into the "not enum" branch instead and is copied through unvalidated. This is
 * functionally safe regardless (a `LOGICAL`'s legal values are a fixed, tiny,
 * true/false/unknown set with no real "invalid enum value" failure mode to guard
 * against the way a real named enumeration has), just not label-identical to Python.
 */
export function reassignClass(ifcFile: IfcFile | null, element: EntityInstance, newClass: string): EntityInstance {
	if (element.isA() === newClass) {
		return element;
	}

	const file = ifcFile ?? (element.file as IfcFile);

	let declaration: NativeDeclaration;
	try {
		declaration = file.nativeFile.schema().declaration_by_name_with_name(newClass);
	} catch {
		throw new Error(
			`Class of ${element.isA()}#${element.id()} could not be changed to ${newClass} as the class does not exist in schema ${file.schemaIdentifier}.`,
		);
	}
	const newEntityDeclaration = declaration.as_entity();
	if (newEntityDeclaration === null) {
		throw new Error(
			`Class of ${element.isA()}#${element.id()} could not be changed to ${newClass} as the class does not exist in schema ${file.schemaIdentifier}.`,
		);
	}

	const info = element.getInfo();

	const newAttributes: Record<string, unknown> = {};
	for (const attribute of newEntityDeclaration.all_attributes()) {
		const name = attribute.name();
		const oldValue = info[name];
		if (isPythonFalsy(oldValue)) continue;
		if (getPrimitiveType(attribute) === "enum") {
			if (isEnumMember(attribute, oldValue as string)) {
				newAttributes[name] = oldValue;
			}
		} else {
			newAttributes[name] = oldValue;
		}
	}

	const inversePairs = file.getInverse(element, true, true) as Array<[EntityInstance, number]>;
	file.remove(element);

	let newElement: EntityInstance;
	try {
		newElement = file.createEntityWithIdAndAttributes(
			newClass,
			info.id as number,
			positionalArgsFromValues(newEntityDeclaration, newAttributes),
		);
	} catch {
		console.log(`Class of ${element.isA()}#${info.id} could not be changed to ${newClass}`);
		const oldClass = info.type as string;
		const oldEntityDeclaration = file.nativeFile.schema().declaration_by_name_with_name(oldClass).as_entity();
		if (oldEntityDeclaration === null) {
			throw new Error(`Could not recreate original class ${oldClass} while recovering from a failed reassignClass`);
		}
		return file.createEntityWithIdAndAttributes(
			oldClass,
			info.id as number,
			positionalArgsFromValues(oldEntityDeclaration, info),
		);
	}

	for (const [inverse, index] of inversePairs) {
		const current = inverse.getByIndex(index);
		if (current === null) {
			inverse.setByIndex(index, newElement);
		} else if (Array.isArray(current)) {
			inverse.setByIndex(index, [...current, newElement]);
		}
	}

	return newElement;
}

// --- `BatchReassignClass` ---

function deepEqual(a: unknown, b: unknown): boolean {
	if (a instanceof EntityInstance && b instanceof EntityInstance) return a.equals(b);
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
	}
	return a === b;
}

interface InverseReplacements {
	readonly inverse: EntityInstance;
	/** attribute index -> (old element identity -> new element) */
	readonly byIndex: Map<number, Map<number, EntityInstance>>;
}

/**
 * Python: `class BatchReassignClass`.
 *
 * A stateful batch-reassignment helper: `reassign(element, newClass)` creates and
 * returns a fresh, empty `newClass` instance immediately, copying over only the
 * attributes whose *names* match between old and new class (via positional index
 * lookup) -- deliberately simpler/faster than `reassignClass`'s own attribute-
 * preservation logic (no enum-membership validation, no `util/attribute.ts` calls at
 * all), matching Python's own, different `reassign` implementation exactly. Every
 * *inverse* reference is recorded (not rewritten yet); `unbatch()` flushes all
 * pending replacements at once via `EntityInstance.walk` (already ported, reused
 * as-is) and deletes every originally-reassigned element; `purge()` resets state.
 *
 * Unlike Python's dicts (which key by `entity_instance.__hash__`, effectively
 * identity), this project's N-API primitive layer mints a fresh JS wrapper object on
 * every accessor call (`research/07-fresh-wrapper-per-access.md`) -- a plain
 * `Map<EntityInstance, ...>` would silently fail to find previously-stored entries.
 * `replacements`/`toDelete` are therefore keyed by `EntityInstance.identity()`
 * throughout, matching `util/element.ts`'s own `EntityInstanceSet` convention.
 */
export class BatchReassignClass {
	readonly file: IfcFile;
	private replacements!: Map<number, InverseReplacements>;
	private toDelete!: Map<number, EntityInstance>;

	constructor(file: IfcFile) {
		this.file = file;
		this.purge();
	}

	reassign(element: EntityInstance, newClass: string): EntityInstance {
		let newElement: EntityInstance;
		try {
			newElement = this.file.createEntity(newClass);
		} catch {
			console.log(`Class of ${element.isA()}#${element.id()} could not be changed to ${newClass}`);
			return element;
		}

		const newAttributeNames = Array.from({ length: newElement.attributeCount() }, (_v, i) =>
			attributeNameAt(newElement, i),
		);
		const oldCount = element.attributeCount();
		for (let i = 0; i < oldCount; i++) {
			const targetIndex = newAttributeNames.indexOf(attributeNameAt(element, i));
			if (targetIndex === -1) continue;
			try {
				newElement.setByIndex(targetIndex, element.getByIndex(i));
			} catch {
				// Type-incompatible between old and new class at this name -- skip,
				// matching Python's own `except: continue`.
			}
		}

		for (const [inverse, index] of this.file.getInverse(element, true, true) as Array<[EntityInstance, number]>) {
			const inverseId = inverse.identity();
			let entry = this.replacements.get(inverseId);
			if (!entry) {
				entry = { inverse, byIndex: new Map() };
				this.replacements.set(inverseId, entry);
			}
			let byOldElement = entry.byIndex.get(index);
			if (!byOldElement) {
				byOldElement = new Map();
				entry.byIndex.set(index, byOldElement);
			}
			byOldElement.set(element.identity(), newElement);
		}

		this.toDelete.set(element.identity(), element);
		return newElement;
	}

	unbatch(): void {
		for (const { inverse, byIndex } of this.replacements.values()) {
			for (const [index, elementMap] of byIndex) {
				const value = inverse.getByIndex(index);
				const replaced = EntityInstance.walk(
					() => true,
					(v) => (v instanceof EntityInstance ? (elementMap.get(v.identity()) ?? v) : v),
					value,
				);
				if (!deepEqual(value, replaced)) {
					inverse.setByIndex(index, replaced);
				}
			}
		}

		for (const element of this.toDelete.values()) {
			this.file.remove(element);
		}
		this.purge();
	}

	purge(): void {
		this.replacements = new Map();
		this.toDelete = new Map();
	}
}
