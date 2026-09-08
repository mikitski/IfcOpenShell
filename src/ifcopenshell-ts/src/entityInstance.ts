// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/entity_instance.py`'s `entity_instance_mixin`
// (src/ifcopenshell-python) -- planning/ifcopenshell-ts/research/01-python-core-and-lowlevel.md
// SS1/SS2.3. The *foundation* `EntityInstance` chunk (planning/ifcopenshell-ts/20-roadmap.md
// Phase 2) built `identity()`/`isA()`/`equals()`, explicit `.get()`/`.set()` as the
// primitive attribute-access escape hatch (implementing the real forward/inverse/
// category-dispatch branching logic `__getattr__`/`__setattr__` use), `getInfo()`, and
// the `walk()` tree-transform helper -- all of that logic is UNCHANGED by this chunk.
// This chunk (planning/ifcopenshell-ts/10-architecture.md SS6) adds: every
// `EntityInstance` is now constructed as a `Proxy` wrapping itself (see
// `ENTITY_INSTANCE_PROXY_HANDLER`/the constructor below), whose `get`/`set` traps
// consult `attributeCache.ts`'s attribute-metadata cache to resolve a `wall.Name`-style
// dynamic property access to a forward-attribute index or an inverse-attribute lookup
// *without* the native `get_attribute_category`/`get_argument_index` calls `.get()`/
// `.set()` themselves still do on every call -- the Proxy is the fast, cached path;
// `.get()`/`.set()` remain the always-correct, uncached escape hatch (needed by Phase
// 5's `selector.py` port for dynamically-computed attribute names, and used directly
// by the Proxy itself as the fallback for a cache miss, so an unknown attribute name
// gets exactly `.get()`'s own error, not a silently different one).
//
// Explicitly out of scope for this chunk (see the task brief this was built from):
// - The EXPRESS derived-attribute (`calc_<Type>_<name>`) rule-compilation fallback
//   `__getattr__` falls through to for non-forward/non-inverse attribute names
//   (research/01 SS2.3: "not relevant to a base TS port"). `.get()` throws instead,
//   and the Proxy (falling back to `.get()` on a cache miss) inherits that behavior.
// - `compare()`/`__lt__`/`__le__`/`__gt__`/`__ge__` EXPRESS-style ordering and
//   `__dir__` -- not part of this chunk's explicit method list.
// - Attribute values on non-entity (simple/defined-type, e.g. a standalone
//   `IfcLabel`) instances -- Python's SWIG binding special-cases the pseudo-attribute
//   name `"wrappedValue"` (attribute index 0) for these (`IfcParseWrapper.i`'s
//   `%extend express::base`); this project's N-API shim
//   (`src/wrappergen/shim/attribute_value_shim.cpp`'s `entity_declaration_of`)
//   doesn't yet support that case and throws for it -- a real, disclosed primitive-
//   layer gap surfaced while building the foundation chunk, not silently worked around
//   here. `.get()`/`.set()`/`.getInfo()` therefore only support entity-typed instances;
//   the Proxy's cache resolves to `EMPTY_CLASS_ATTRIBUTE_CACHE` for these (see
//   `_resolveTypeInfo`), so every property access on one falls back to `.get()`/`.set()`
//   unchanged.
// - Also out of scope, explicitly per this chunk's own brief (a genuine primitive gap
//   found while building the attribute-metadata cache, not assumed a new primitive
//   should be added to close): a bulk *forward-vs-derived* split -- see
//   `attributeCache.ts`'s header comment for the full reasoning.

import { AttributeCategory, EMPTY_CLASS_ATTRIBUTE_CACHE, getClassAttributeMeta } from "./attributeCache";
import type { AttributeMeta, ClassAttributeCache } from "./attributeCache";
import type { IfcFile } from "./file";
import type { IfcopenshellAttributeValueVariantT, entity as NativeEntity } from "./native/ifcopenshell_native";
import {
	declaration as NativeDeclarationCtor,
	entity_instance as NativeEntityInstance,
} from "./native/ifcopenshell_native";
import { native } from "./native/native_loader";
import { settings } from "./settings";

export { AttributeCategory } from "./attributeCache";

function structurallyEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((v, i) => structurallyEqual(v, b[i]));
	}
	if (a && b && typeof a === "object" && typeof b === "object") {
		const aKeys = Object.keys(a as Record<string, unknown>);
		const bKeys = Object.keys(b as Record<string, unknown>);
		if (aKeys.length !== bKeys.length) return false;
		return aKeys.every((key) =>
			structurallyEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
		);
	}
	return false;
}

/**
 * TS port of `entity_instance_mixin` (`ifcopenshell/entity_instance.py`). Wraps a
 * native `entity_instance` (`express::base`) handle.
 *
 * Unlike Python's SWIG binding -- which grafts this mixin directly onto the native
 * class via multiple inheritance, so `self.file`/`self.identity()` are native-object
 * properties -- the N-API primitive layer mints a fresh JS wrapper on every accessor
 * call and exposes no "which file owns this entity" primitive at all
 * (research/07-fresh-wrapper-per-access.md; the native `entity_instance` class has no
 * `.file()`/`.file_pointer()` accessor, only `file.file_pointer()` on the *file*
 * side). This class therefore threads the owning `IfcFile` through explicitly at
 * construction time instead -- every `EntityInstance` is minted by an `IfcFile`
 * method (or by another `EntityInstance` reading one of its own entity-typed
 * attributes, which always belongs to the same file), so the owner is always known
 * at the point of construction. `file` is `undefined` only for entity instances
 * constructed directly from a bare native handle with no known owner (a legitimate,
 * if unusual, escape hatch -- equality/`.get()`/`.set()` involving `this.file` degrade
 * gracefully, matching Python's own `self.file` being `None` for a detached instance).
 */
export class EntityInstance {
	/** @internal */ readonly _handle: unknown;
	readonly file: IfcFile | undefined;

	/**
	 * @internal Lazily populated by `_resolveTypeInfo()`; backs the attribute Proxy's
	 * cached name -> index/category lookup (10-architecture.md SS6). Resolving an
	 * instance's own declared type is itself a native call
	 * (`declaration()`/`declaration().schema()`/`declaration().as_entity()`) -- caching
	 * it here means that cost is paid at most once per `EntityInstance` object's
	 * lifetime, not once per attribute access, on top of the per-(schema,class)
	 * caching `attributeCache.ts` already does.
	 */
	private _typeInfo?: {
		readonly schemaIdentifier: string;
		readonly className: string;
		readonly cache: ClassAttributeCache;
	};

	constructor(handle: unknown, file?: IfcFile) {
		this._handle = handle;
		this.file = file;
		// Every `EntityInstance` is minted as a `Proxy` wrapping itself -- decided over
		// a separate factory function so every construction site (`IfcFile.byId`/
		// `.byType`/`.createEntity`/etc., and `wrapValue`'s own recursive minting of
		// entity-typed attribute *values*) automatically gets `wall.Name`-style dynamic
		// property access with zero call-site changes, matching how deeply entity
		// instances get minted (not just at `IfcFile` boundaries) per the task brief's
		// own guidance. A JS class constructor that `return`s an object overrides the
		// default `this` -- `new EntityInstance(...)` therefore returns the `Proxy`, not
		// the raw instance; `instanceof EntityInstance` still holds through it (a
		// `Proxy`'s default, un-overridden `getPrototypeOf` trap delegates to the
		// target, per spec -- verified with an explicit test, not assumed, see
		// `test/entityInstance.test.ts`).
		// biome-ignore lint/correctness/noConstructorReturn: intentional -- this is the mechanism by which every `EntityInstance` becomes a `Proxy`, see the comment above.
		return new Proxy(this, ENTITY_INSTANCE_PROXY_HANDLER);
	}

	private get native(): NativeEntityInstance {
		return new NativeEntityInstance(this._handle);
	}

	/**
	 * @internal Resolves (and caches, per-instance) this entity's own schema
	 * identifier, class name, and cached attribute metadata -- the Proxy trap's entry
	 * point into `attributeCache.ts`. Non-entity (simple/defined-type) instances
	 * resolve to `EMPTY_CLASS_ATTRIBUTE_CACHE`: every property access on one is
	 * therefore a cache miss, falling back to `.get()`/`.set()` unchanged (matching
	 * this class's pre-existing "entity-typed instances only" scope for attribute
	 * access, see this file's header comment).
	 */
	_resolveTypeInfo(): {
		readonly schemaIdentifier: string;
		readonly className: string;
		readonly cache: ClassAttributeCache;
	} {
		if (!this._typeInfo) {
			const declaration = this.native.declaration();
			const className = declaration.name();
			const schemaIdentifier = declaration.schema().name();
			const entityDeclaration = declaration.as_entity();
			const cache =
				entityDeclaration === null
					? EMPTY_CLASS_ATTRIBUTE_CACHE
					: getClassAttributeMeta(schemaIdentifier, className, entityDeclaration, this.native);
			this._typeInfo = { schemaIdentifier, className, cache };
		}
		return this._typeInfo;
	}

	/** Cross-file-unique runtime id (distinct from the STEP `id()`). */
	identity(): number {
		return this.native.identity();
	}

	/** The STEP numerical identifier, or 0 for a value not (yet) added to a file. */
	id(): number {
		return this.native.id();
	}

	isA(): string;
	isA(withSchema: boolean): string;
	isA(type: string): boolean;
	isA(arg?: string | boolean): string | boolean {
		if (typeof arg === "string") {
			return this.native.is_a(arg);
		}
		const declaration = this.native.declaration();
		const name = declaration.name();
		if (arg) {
			return `${declaration.schema().name()}.${name}`;
		}
		return name;
	}

	/** Tests whether the instance is an entity type as opposed to a simple data type. */
	isEntity(): boolean {
		return this.native.declaration().as_entity() !== null;
	}

	private entityDeclaration(): NativeEntity {
		const declaration = this.native.declaration().as_entity();
		if (declaration === null) {
			throw new Error(`'${this.isA()}' is not an entity type`);
		}
		return declaration;
	}

	/** Number of forward attributes (1 for a non-entity/simple-type instance). */
	attributeCount(): number {
		const declaration = this.native.declaration().as_entity();
		return declaration === null ? 1 : declaration.attribute_count();
	}

	// --- explicit .get()/.set() primitive escape hatch (entity_instance_mixin's
	// __getattr__/__setattr__ and __getitem__/__setitem__ ported to explicit methods,
	// designed so a future Proxy can wrap them directly -- 10-architecture.md SS6) ---

	/**
	 * Index-based attribute access (`entity_instance_mixin.__getitem__`). Forward
	 * attributes only, matching Python's `element[index]`.
	 */
	getByIndex(index: number): unknown {
		const count = this.attributeCount();
		if (index < 0 || index >= count) {
			throw new RangeError(`Attribute index ${index} out of range for instance of type ${this.isA()}`);
		}
		return this.wrapValue(this.native.get_attribute_value(index));
	}

	/**
	 * Index-based attribute assignment (`entity_instance_mixin.__setitem__`), recording
	 * a transaction edit before writing, matching Python.
	 */
	setByIndex(index: number, value: unknown): void {
		if (this.file?.transaction) {
			this.file.transaction.storeEdit(this, index, value);
		}
		const declaredKind = this.native.attribute_kind_of(index);
		this.native.set_attribute_value(index, this.valueToVariant(value, declaredKind));
	}

	/**
	 * `entity_instance_mixin.__getattr__`'s branching logic, ported to an explicit
	 * method: forward attributes resolve via `get_argument_index`/`get_attribute_value`;
	 * inverse attributes resolve via `getInverseAttribute` below, which delegates to
	 * the native `file.get_inverse(instanceId, declaration, attributeIndex)` primitive
	 * -- see that method's own extended comment for the full story (this chunk's fix
	 * for a real, `/code-review`-found bug in an earlier version of this method that
	 * matched inverse candidates by attribute name alone, unscoped by declared type).
	 */
	get(name: string): unknown {
		const category = this.native.get_attribute_category(name);
		if (category === AttributeCategory.FORWARD) {
			const index = this.native.get_argument_index(name);
			return this.getByIndex(index);
		}
		if (category === AttributeCategory.INVERSE) {
			const values = this.getInverseAttribute(name);
			if (settings.unpackNonAggregateInverses) {
				const inverse = this.entityDeclaration()
					.all_inverse_attributes()
					.find((i) => i.name() === name);
				if (inverse && inverse.bound1() === -1 && inverse.bound2() === -1) {
					return values.length ? values[0] : null;
				}
			}
			return values;
		}
		// EXPRESS derived-attribute (calc_<Type>_<name>) rule execution is explicitly
		// out of scope for this chunk (research/01 SS2.3) -- no fallback, just error.
		throw new Error(`entity instance of type '${this.isA(true)}' has no attribute '${name}'`);
	}

	/**
	 * `entity_instance_mixin.__setattr__`'s branching logic, ported to an explicit
	 * method: resolves the forward attribute index by name and delegates to
	 * `setByIndex`.
	 */
	set(name: string, value: unknown): void {
		let index: number;
		try {
			index = this.native.get_argument_index(name);
		} catch {
			throw new Error(`entity instance of type '${this.isA(true)}' has no attribute '${name}'`);
		}
		this.setByIndex(index, value);
	}

	/**
	 * @internal Loosened from `private` (unchanged behavior otherwise) so the module-
	 * level Proxy handler below can call it directly with a pre-resolved `meta` (from
	 * `attributeCache.ts`'s `AttributeMeta`), skipping the schema walk this method
	 * still does itself when called without one -- e.g. from `.get()` above, which is
	 * deliberately left untouched (this chunk doesn't change `.get()`/`.set()`'s own
	 * dispatch logic, only this internal helper's own implementation, and only to fix
	 * a genuine bug found by `/code-review` while building on top of it, see below).
	 *
	 * Resolves via the native `file.get_inverse(instanceId, declaration,
	 * attributeIndex)` primitive -- correctly scoped to candidates whose *declared
	 * type* is-a the inverse attribute's `entity_reference()` (via the native
	 * `visit_subtypes` C++ already implements, `src/ifcparse/parse.cpp`), at the
	 * specific `attributeIndex` the inverse attribute's `attribute_reference()`
	 * occupies on that type. An earlier version of this method instead scanned every
	 * entity referencing `this` (`file.instances_by_reference`, unscoped by type) and
	 * matched candidates purely by attribute *name* -- `/code-review` found, and a
	 * real repro against the built addon confirmed, that this is unsound: EXPRESS
	 * attribute names like "RelatedObjects" are independently declared on multiple,
	 * unrelated sibling entities (`IfcRelAggregates`, `IfcRelDefinesByProperties`,
	 * `IfcRelAssociatesMaterial`, ...), so a narrowly-scoped inverse attribute like
	 * `IfcObject.IsDefinedBy` (which should only ever resolve `IfcRelDefinesByType`/
	 * `IfcRelDefinesByProperties` instances) incorrectly also matched an unrelated
	 * `IfcRelAggregates` that merely happened to reference `this` via its own,
	 * differently-scoped "RelatedObjects" attribute.
	 *
	 * The non-obvious part: `declaration` argument. `inverse_attribute.entity_reference()`
	 * returns an `entity`-typed native handle, not a `declaration`-typed one --
	 * `file.get_inverse`'s N-API binding expects the latter. `entity` is a C++
	 * `entity : public declaration` (single, non-virtual inheritance -- confirmed by
	 * reading `src/ifcparse/schema.h`), and both classes' generated C-API wrapper
	 * structs are `{ T* value; }` (a single pointer field, confirmed by reading
	 * `ifcopenshell_native_c_api.cpp`) -- so an `entity*`'s address, reinterpreted as
	 * a `declaration*`, is the *same, valid* pointer (a standard-layout upcast is a
	 * pointer-value no-op for a non-virtual sole base). Constructing a `declaration`
	 * wrapper directly around an `entity` handle's `_handle` is therefore safe, not
	 * just convenient -- verified empirically against the real, built addon (not just
	 * reasoned about), not merely assumed: `new NativeDeclaration(entityHandle).name()`
	 * correctly returns the entity's own name, and `file.get_inverse` using it
	 * correctly excludes the unrelated `IfcRelAggregates` from the repro above. No new
	 * native primitive was added for this -- reusing an already-exposed one via this
	 * (disclosed, deliberately-commented) handle reinterpretation.
	 */
	getInverseAttribute(name: string, meta?: AttributeMeta): EntityInstance[] {
		let entityReferenceHandle = meta?.entityReferenceHandle;
		let referenceAttributeIndex = meta?.referenceAttributeIndex;
		if (entityReferenceHandle === undefined || referenceAttributeIndex === undefined) {
			const entityDeclaration = this.entityDeclaration();
			const inverse = entityDeclaration.all_inverse_attributes().find((i) => i.name() === name);
			if (!inverse) {
				throw new Error(`entity instance of type '${this.isA(true)}' has no attribute '${name}'`);
			}
			const entityReference = inverse.entity_reference();
			const attributeReference = inverse.attribute_reference();
			entityReferenceHandle = entityReference._handle;
			referenceAttributeIndex = entityReference
				.all_attributes()
				.findIndex((attribute) => attribute.name() === attributeReference.name());
		}
		if (!this.file) {
			throw new Error(`Cannot resolve inverse attribute '${name}': entity instance has no owning file`);
		}
		const declaration = new NativeDeclarationCtor(entityReferenceHandle);
		const handles = this.file.nativeFile.get_inverse(this.id(), declaration, referenceAttributeIndex);
		return handles.map((handle) => new EntityInstance(handle._handle, this.file));
	}

	private wrapValue(raw: unknown): unknown {
		if (raw === null || raw === undefined) return null;
		if (Array.isArray(raw)) return raw.map((element) => this.wrapValue(element));
		if (typeof raw === "object") return new EntityInstance(raw, this.file);
		return raw;
	}

	/**
	 * Converts a raw JS value into the `{kind, ...}` shape `set_attribute_value`
	 * expects, using `declaredKind` (from `attribute_kind_of`) to disambiguate the
	 * cases JS's `typeof` can't (INTEGER vs. DOUBLE, STRING vs. ENUMERATION/BINARY) --
	 * exactly the resolution step `attribute_value_shim.h`'s own doc comment says this
	 * layer is expected to perform. For an aggregate ELEMENT (recursive call, no
	 * `declaredKind` known -- the primitive layer exposes no per-element schema
	 * lookup), this falls back to runtime-type inference (number -> DOUBLE, matching
	 * the common case of numeric IFC aggregates being measures/coordinates rather than
	 * integer lists) -- a disclosed, narrower rough edge matching this attribute-value
	 * boundary's own documented limitation, not a silent wrong answer.
	 */
	private valueToVariant(value: unknown, declaredKind?: number): IfcopenshellAttributeValueVariantT {
		// The `ATTRIBUTE_VALUE_KIND_*` constants (`native.NULL`, `native.BOOL`, ...) the
		// generated N-API extension exports as plain module-level numbers alongside its
		// per-primitive functions (see the tail of `ifcopenshell_native.cpp`'s `Init`).
		const kinds = native;
		if (value === null || value === undefined) {
			// None always means "unset," regardless of the attribute's declared type
			// (research/01 SS5).
			return { kind: kinds.NULL };
		}
		if (value instanceof EntityInstance) {
			return { kind: kinds.ENTITY_INSTANCE, entity_value: value._handle };
		}
		if (Array.isArray(value)) {
			return { kind: kinds.AGGREGATE, aggregate_value: value.map((element) => this.valueToVariant(element)) };
		}
		if (typeof value === "boolean") {
			if (declaredKind === kinds.LOGICAL) {
				return { kind: kinds.LOGICAL, logical_value: value ? 1 : 0 };
			}
			return { kind: kinds.BOOL, integer_value: value ? 1 : 0 };
		}
		if (typeof value === "number") {
			if (declaredKind === kinds.INTEGER) {
				return { kind: kinds.INTEGER, integer_value: value };
			}
			return { kind: kinds.DOUBLE, double_value: value };
		}
		if (typeof value === "string") {
			if (declaredKind === kinds.ENUMERATION) {
				return { kind: kinds.ENUMERATION, string_value: value };
			}
			if (declaredKind === kinds.BINARY) {
				return { kind: kinds.BINARY, string_value: value };
			}
			return { kind: kinds.STRING, string_value: value };
		}
		throw new Error(`Cannot convert JS value to an IFC attribute value: ${String(value)}`);
	}

	// --- equality (entity_instance_mixin.__eq__/__ne__) ---

	/**
	 * `entity_instance_mixin.__eq__`, ported to an explicit method -- TS has no
	 * operator overloading, and per research/07-fresh-wrapper-per-access.md, `===` on
	 * two JS wrapper objects must never be used as an entity-identity check (N-API
	 * mints a fresh wrapper on every accessor call, so two wrappers of the literal
	 * same underlying instance are never `===`). Identity-first, then same-`isA`, then
	 * (cross-file, or `settings.compareInstancesByValue`, or a non-entity/simple-type
	 * instance) a deep `getInfo(recursive=true)` comparison.
	 */
	equals(other: unknown): boolean {
		if (!(other instanceof EntityInstance)) {
			return this.isEntity() ? false : this.getByIndex(0) === other;
		}
		if (this.identity() === other.identity()) {
			return true;
		}
		if (this.isA(true) !== other.isA(true)) {
			return false;
		}
		const crossFile = this.file?.filePointer() !== other.file?.filePointer();
		if (settings.compareInstancesByValue || crossFile || !this.isEntity()) {
			return structurallyEqual(this.getInfo(true, false), other.getInfo(true, false));
		}
		return false;
	}

	notEquals(other: unknown): boolean {
		return !this.equals(other);
	}

	// --- getInfo (entity_instance_mixin.get_info/get_info_py) ---

	/**
	 * Returns a dictionary of the entity's properties (Python's `get_info`/
	 * `get_info_py`). No real C++ `get_info_cpp` function exists to bind (it is
	 * SWIG/Python-specific glue building `PyObject*`s directly,
	 * `src/ifcwrap/IfcParseWrapper.i` -- investigated, not assumed; see this chunk's
	 * final report) -- this uses the already-bulk, per-instance
	 * `get_all_attribute_values()` primitive (one native call per instance, not one
	 * per attribute) and recurses into nested entity references in TS, exactly the
	 * fallback shape `attribute_value_shim.h`'s own doc comment anticipates for this
	 * chunk.
	 *
	 * Parameter order is `(recursive, includeIdentifier, ignore)` -- deliberately NOT
	 * the same order as Python's `get_info(include_identifier=True, recursive=False,
	 * ...)`. Both parameters are plain positional booleans with no compile-time way to
	 * flag a swapped call, so double-check call sites against this order specifically
	 * if porting Python code that calls `get_info(...)` positionally.
	 */
	getInfo(recursive = false, includeIdentifier = true, ignore: readonly string[] = []): Record<string, unknown> {
		const info: Record<string, unknown> = {};
		if (includeIdentifier) {
			info.id = this.id();
		}
		info.type = this.isA();
		if (!this.isEntity()) {
			return info;
		}
		// Sources attribute names from this chunk's attribute-metadata cache
		// (`_resolveTypeInfo`) instead of a fresh `entityDeclaration.all_attributes()`
		// walk per call -- the same one-bulk-call-per-(schema,class) cache the Proxy
		// trap consults, now with a second consumer. `list` is FORWARD entries followed
		// by INVERSE ones (`attributeCache.ts`'s `buildClassAttributeCache`), each
		// FORWARD entry's position among just the FORWARD entries equal to its own
		// `index` field, so filtering preserves the exact name-by-index ordering
		// `get_all_attribute_values()` returns values in.
		const names = this._resolveTypeInfo()
			.cache.list.filter((meta) => meta.category === AttributeCategory.FORWARD)
			.map((meta) => meta.name);
		const rawValues = this.native.get_all_attribute_values() as unknown[];
		for (let index = 0; index < rawValues.length; index++) {
			const name = names[index];
			if (ignore.includes(name)) continue;
			let value = this.wrapValue(rawValues[index]);
			if (recursive) {
				value = EntityInstance.walk(
					(v) => v instanceof EntityInstance,
					(v) => (v as EntityInstance).getInfo(true, includeIdentifier, ignore),
					value,
				);
			}
			info[name] = value;
		}
		return info;
	}

	/**
	 * Generic recursive tree-transform helper (`entity_instance_mixin.walk`, a
	 * `@staticmethod` in Python). Direct port, pure logic.
	 */
	static walk(f: (value: unknown) => boolean, g: (value: unknown) => unknown, value: unknown): unknown {
		if (Array.isArray(value)) {
			return value.map((element) => EntityInstance.walk(f, g, element));
		}
		if (f(value)) {
			return g(value);
		}
		return value;
	}

	/**
	 * The "typed accessor helper" `10-architecture.md` SS6 describes: intersects this
	 * (already-Proxy'd) instance with a generated per-schema interface (see
	 * `tools/generate-dts.ts`/`src/generated/*.d.ts`) purely for the type checker's
	 * benefit -- a compile-time-only cast (`as unknown as this & T`), zero runtime
	 * cost, no new object created. The runtime object underneath is unchanged: the
	 * same class-agnostic `Proxy` every `EntityInstance` already is, per this file's
	 * header comment. Usage: `file.byId(id).as<generated.IfcWall>().Name` type-checks
	 * as `string | null`.
	 */
	as<T>(): this & T {
		return this as unknown as this & T;
	}
}

/** Shared with `file.ts`'s `getInverse`/`Transaction.getElementInverses` helpers. */
export function referencesTarget(value: unknown, target: EntityInstance): boolean {
	if (Array.isArray(value)) {
		return value.some((element) => referencesTarget(element, target));
	}
	return value instanceof EntityInstance && value.identity() === target.identity();
}

/**
 * The `Proxy` handler backing every `EntityInstance` (see the constructor above).
 * Module-level and stateless (no per-instance handler allocation) -- "one `Proxy`
 * handler implementation serves every entity, every schema version"
 * (`10-architecture.md` SS6).
 *
 * Dispatch order, both traps: a real class member (own property or anything on
 * `EntityInstance.prototype` -- methods, the `file` field, the internal `_handle`/
 * `_typeInfo`) always wins over attribute-cache resolution, checked via the `in`
 * operator (own + prototype chain) before ever consulting the cache -- getting this
 * backwards would make e.g. `wall.file`/`wall.isA()` themselves resolve as IFC
 * attribute lookups instead of the real class members they are. Symbols are passed
 * straight through for the same reason (an IFC attribute name is never a symbol).
 *
 * On a cache hit: resolves straight to `getByIndex`/`setByIndex`/`getInverseAttribute`
 * -- no native `get_attribute_category`/`get_argument_index` call, the whole point of
 * this chunk's cache. On a cache miss (including every access on a non-entity
 * instance, whose `_resolveTypeInfo()` always resolves to
 * `EMPTY_CLASS_ATTRIBUTE_CACHE`): falls back to the real `.get(name)`/`.set(name,
 * value)` methods unchanged, so an unknown attribute name fails exactly as loudly and
 * with exactly the same message as the uncached primitive escape hatch already does --
 * never a silent `undefined`.
 */
const ENTITY_INSTANCE_PROXY_HANDLER: ProxyHandler<EntityInstance> = {
	get(target, prop, receiver) {
		if (typeof prop === "symbol" || prop in target) {
			return Reflect.get(target, prop, receiver);
		}
		const meta = target._resolveTypeInfo().cache.byName.get(prop);
		if (meta === undefined) {
			return target.get(prop);
		}
		if (meta.category === AttributeCategory.FORWARD) {
			return target.getByIndex(meta.index);
		}
		const values = target.getInverseAttribute(prop, meta);
		if (settings.unpackNonAggregateInverses && meta.bound1 === -1 && meta.bound2 === -1) {
			return values.length ? values[0] : null;
		}
		return values;
	},
	set(target, prop, value, receiver) {
		if (typeof prop === "symbol" || prop in target) {
			return Reflect.set(target, prop, value, receiver);
		}
		const meta = target._resolveTypeInfo().cache.byName.get(prop);
		if (meta !== undefined && meta.category === AttributeCategory.FORWARD) {
			target.setByIndex(meta.index, value);
			return true;
		}
		// Cache miss, or an attempt to write an INVERSE attribute (never settable,
		// matching `.set()`'s own -- unchanged -- behavior, which only ever resolves a
		// *forward* index and throws otherwise): falls back to `.set()` for the exact
		// same error.
		target.set(prop, value);
		return true;
	},
};
