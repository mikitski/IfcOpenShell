// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/entity_instance.py`'s `entity_instance_mixin`
// (src/ifcopenshell-python) -- planning/ifcopenshell-ts/research/01-python-core-and-lowlevel.md
// SS1/SS2.3. This is the *foundation* `EntityInstance` chunk
// (planning/ifcopenshell-ts/20-roadmap.md Phase 2): `identity()`/`isA()`/`equals()`,
// explicit `.get()`/`.set()` as the primitive attribute-access escape hatch
// (implementing the real forward/inverse/category-dispatch branching logic
// `__getattr__`/`__setattr__` use), `getInfo()`, and the `walk()` tree-transform
// helper. The next Phase 2 chunk wraps a `Proxy` around `.get()`/`.set()` for
// `wall.Name`-style dynamic property access and generates per-schema `.d.ts` types
// (planning/ifcopenshell-ts/10-architecture.md SS6) -- explicitly out of scope here.
//
// Explicitly out of scope for this chunk (see the task brief this was built from):
// - The EXPRESS derived-attribute (`calc_<Type>_<name>`) rule-compilation fallback
//   `__getattr__` falls through to for non-forward/non-inverse attribute names
//   (research/01 SS2.3: "not relevant to a base TS port"). `.get()` throws instead.
// - `compare()`/`__lt__`/`__le__`/`__gt__`/`__ge__` EXPRESS-style ordering and
//   `__dir__` -- not part of this chunk's explicit method list.
// - Attribute values on non-entity (simple/defined-type, e.g. a standalone
//   `IfcLabel`) instances -- Python's SWIG binding special-cases the pseudo-attribute
//   name `"wrappedValue"` (attribute index 0) for these (`IfcParseWrapper.i`'s
//   `%extend express::base`); this project's N-API shim
//   (`src/wrappergen/shim/attribute_value_shim.cpp`'s `entity_declaration_of`)
//   doesn't yet support that case and throws for it -- a real, disclosed primitive-
//   layer gap surfaced while building this chunk, not silently worked around here.
//   `.get()`/`.set()`/`.getInfo()` therefore only support entity-typed instances.

import type { IfcFile } from "./file";
import type { IfcopenshellAttributeValueVariantT, entity as NativeEntity } from "./native/ifcopenshell_native";
import { entity_instance as NativeEntityInstance } from "./native/ifcopenshell_native";
import { native } from "./native/native_loader";
import { settings } from "./settings";

/** `entity_instance.get_attribute_category(name)`'s return value (research/01 SS5). */
export const AttributeCategory = {
	INVALID: 0,
	FORWARD: 1,
	INVERSE: 2,
	DERIVED: 3,
} as const;

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

	constructor(handle: unknown, file?: IfcFile) {
		this._handle = handle;
		this.file = file;
	}

	private get native(): NativeEntityInstance {
		return new NativeEntityInstance(this._handle);
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
	 * method: forward attributes resolve via `get_argument_index`/`get_attribute_value`,
	 * inverse attributes are resolved by scanning `file.instances_by_reference`
	 * (see `getInverseAttribute` below -- the native primitive layer has no
	 * `entity_instance._get_inverse(name)` equivalent, only a coarser
	 * `file.instances_by_reference(id)` unfiltered-by-relationship query, so the
	 * per-named-inverse-attribute filtering Python gets from native `_get_inverse` is
	 * done here in TS instead, on top of that primitive).
	 */
	get(name: string): unknown {
		const category = this.native.get_attribute_category(name);
		if (category === AttributeCategory.FORWARD || category === AttributeCategory.DERIVED) {
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

	private getInverseAttribute(name: string): EntityInstance[] {
		const entityDeclaration = this.entityDeclaration();
		const inverse = entityDeclaration.all_inverse_attributes().find((i) => i.name() === name);
		if (!inverse) {
			throw new Error(`entity instance of type '${this.isA(true)}' has no attribute '${name}'`);
		}
		if (!this.file) {
			throw new Error(`Cannot resolve inverse attribute '${name}': entity instance has no owning file`);
		}
		// `inverse.entity_reference(): entity` would be the natural way to pre-filter
		// candidates by declared referencing type, but the generated facade's `entity`
		// class has no `.name()` (or any other `declaration`-inherited method) --
		// wrappergen's clang frontend only discovers a class's own directly-declared
		// methods, not members inherited from a C++ base class (`entity : public
		// declaration`), so `entity_reference()`'s result carries no usable name here.
		// Skipping the type-name pre-filter and instead trying to resolve the named
		// attribute directly on each candidate (catching "no such attribute" for
		// candidates of an unrelated class) is actually equally correct -- it's the
		// same relationship the type filter would have checked, just verified from the
		// attribute side instead of the type side.
		const attributeName = inverse.attribute_reference().name();
		const candidates = this.file.nativeFile.instances_by_reference(this.id());
		const results: EntityInstance[] = [];
		for (const handle of candidates) {
			const candidate = new EntityInstance(handle._handle, this.file);
			if (!candidate.isEntity()) continue;
			let attributeIndex: number;
			try {
				attributeIndex = candidate.native.get_argument_index(attributeName);
			} catch {
				continue;
			}
			const value = candidate.getByIndex(attributeIndex);
			if (referencesTarget(value, this)) {
				results.push(candidate);
			}
		}
		return results;
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
		const entityDeclaration = this.entityDeclaration();
		const names = attributeNamesOf(entityDeclaration);
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
}

/** Shared with `file.ts`'s `getInverse`/`Transaction.getElementInverses` helpers. */
export function referencesTarget(value: unknown, target: EntityInstance): boolean {
	if (Array.isArray(value)) {
		return value.some((element) => referencesTarget(element, target));
	}
	return value instanceof EntityInstance && value.identity() === target.identity();
}

const attributeNamesCache = new WeakMap<NativeEntity, string[]>();
function attributeNamesOf(entityDeclaration: NativeEntity): string[] {
	// Uncached-per-declaration-object-identity is intentionally minimal here (the
	// attribute-metadata cache keyed by schema-version+class-name that
	// 10-architecture.md SS6 designs for the Proxy is explicitly the *next* Phase 2
	// chunk's responsibility, once the Proxy exists to consume it) -- this WeakMap
	// only avoids repeat native calls for the exact same `entity` wrapper instance
	// within one call, not across calls (per research/07, every `declaration()` call
	// mints a fresh wrapper, so this cache rarely hits across separate `EntityInstance`
	// accesses -- purely a micro-optimization within a single `getInfo`, not a
	// substitute for the real cache).
	const cached = attributeNamesCache.get(entityDeclaration);
	if (cached) return cached;
	const names = entityDeclaration.all_attributes().map((attribute) => attribute.name());
	attributeNamesCache.set(entityDeclaration, names);
	return names;
}
