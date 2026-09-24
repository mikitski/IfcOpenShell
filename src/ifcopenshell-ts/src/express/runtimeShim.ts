// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-1 (planning/ifcopenshell-ts/70-express-rules-plan.md SS4): port of the
// ~148-line inline EXPRESS-runtime shim real Python re-declares at the top of EACH
// generated `ifcopenshell/express/rules/{IFC2X3,IFC4,IFC4X3}.py` file (`nvl`, `usedin`,
// `express_getitem`/`express_getattr`, `express_set`, `is_indeterminate`/`INDETERMINATE`,
// `is_entity`, `typeof`, `express_len`/`sizeof`/`hiindex`/`blength`, `loindex`, `range`,
// `EXPRESS_ONE_BASED_INDEXING`). Real Python has no standalone module for this at all --
// it's copy-pasted verbatim into every generated rules file by `rule_compiler.py`'s own
// codegen (never a shared import), so there is no single "real" file path to cite beyond
// "the first ~148 lines of any of the 3 generated rules files," all confirmed identical
// below.
//
// **Location choice**: real Python's own `ifcopenshell/express/` package (parser/
// codegen/rule_compiler/rules/) is the natural namespace to mirror -- this port already
// uses "one directory per real Python package" consistently (`util/` <-> `ifcopenshell/
// util/`, `api/` <-> `ifcopenshell/api/`). `ifcopenshell/express/__init__.py` itself is
// entirely EXPRESS-parser/schema-compiler bootstrap machinery this project's own
// `70-express-rules-plan.md` SS2 already decided NOT to port (we port the generated
// output, not the compiler) -- so this new `express/` directory has no `index.ts`
// counterpart file in real Python to mirror either, it's purely this port's own new
// shared-infrastructure home, chosen because Phase EX-2's `calc_*` functions and Phase
// EX-4's WHERE-rule classes (both ported per-schema, e.g. `express/rules/ifc4.ts`) will
// live alongside this shim under the same directory, matching where real Python's own
// `ifcopenshell/express/rules/*.py` live relative to the shim block they all embed.
//
// **Confirmed schema-agnostic** (re-verified directly against real Python source, not
// just trusted from the prior investigation this chunk's task brief cited): the first
// 148 lines (up through `INDETERMINATE = indeterminate_type()`) of
// `ifcopenshell/express/rules/IFC2X3.py` and `IFC4.py` are byte-identical (`diff` clean).
// `IFC4X3.py`'s own first 148 lines differ in exactly two places, both purely cosmetic,
// zero logic change: (1) tuple-unpacking style, `_, __, attr = ref_name.split('.')` vs.
// `(_, __, attr) = ref_name.split('.')`; (2) `usedin`'s loop reaches through one extra
// `.wrapped_data.` indirection (`inst.wrapped_data.file.get_inverse(...)` /
// `ref.wrapped_data.get_attribute_names()`) that Python's SWIG binding makes optional
// (both spellings resolve to the same underlying call). One TS port is genuinely
// correct for all 3 schemas -- nothing schema-specific was found anywhere in this block
// (the `enum_namespace` class immediately following `INDETERMINATE = ...` on line 150 IS
// schema-specific -- every schema re-exports its own enum members under it -- but that
// class is explicitly NOT part of the ported shim, see `70-express-rules-plan.md` SS3's
// own "mechanical, not hand-transcribed" callout; this port's existing schema
// introspection already makes a hand-written equivalent unnecessary).
//
// **Phase EX-0 finding (see this chunk's own PR description for the full investigation
// writeup)**: real Python's `get_feature("use_attribute_value_derived")`/
// `attribute_value_derived` mechanism (`src/ifcwrap/IfcParseWrapper.i` lines ~113-145,
// `1192`/`1295`/`1391`) is used EXCLUSIVELY by `ifcopenshell/validate.py` (Phase EX-3's
// scope, not this chunk's or Phase EX-2/EX-4's) to distinguish, AT THE RAW PARSED-FILE-
// TEXT level, a literal `*` from a literal `$` for one specific attribute slot on one
// specific instance -- a narrower, purely `validate()`-internal diagnostic than the task
// brief's framing suggested. It is NOT needed by `entity_instance.__getattr__`'s DERIVE
// dispatch (confirmed by reading `entity_instance.py` directly: the `else` branch at line
// 114 that calls `calc_{supertype}_{name}` never once touches `attribute_value_derived`/
// `get_feature`), nor by anything in this shim. The schema-level "is attribute X derived
// for THIS entity's own (sub)class, correctly accounting for a subtype override that
// makes an inherited DERIVE attribute directly stored" question -- the actual "case 3"
// this task brief asked about -- is fully and already answered by the already-exposed,
// already-used `entity_instance.get_attribute_category(name)` native primitive
// (`attributeCache.ts` already calls it): traced its C++ implementation
// (`src/wrappergen/shim/attribute_value_shim.cpp` lines 442-455) against real generated
// schema data (`src/ifcparse/schemas/Ifc4-schema.cpp`'s `entity::set_attributes(attrs,
// derived)` calls) and confirmed `entity::derived()` is populated by codegen at the FULL
// `all_attributes()` cumulative position count (own + all inherited), not just each
// entity's own newly-declared attributes -- so a subtype's `derived()` vector already
// carries its own, independently-resolved flag at an INHERITED attribute's position,
// correctly reflecting any override. No new primitive is needed for the schema-level
// question Phase EX-2/EX-4 actually need answered; this shim's own functions (below)
// never need the raw-file-text distinction either. The narrower `validate()`-only gap
// (telling a literal `*` apart from a literal `$` in already-parsed instance data) is
// scoped out here as a disclosed, narrow edge case for whoever eventually dispatches
// Phase EX-3 to assess against `validate()`'s own actual test coverage -- not a blocker
// for this chunk or for Phase EX-2's DERIVE computation.
//
// **A separate, load-bearing finding for Phase EX-2/EX-4 (disclosed here, not solved
// here -- out of this chunk's scope)**: real Python's `indeterminate_type` (`INDETERMINATE`,
// below) relies entirely on Python operator-overloading dunders (`__lt__`/`__add__`/
// `__mul__`/etc., all aliased to a single `bop` that returns `self`) so that ANY
// arithmetic/comparison expression touching an indeterminate operand anywhere in a
// generated formula silently "poisons" to INDETERMINATE rather than raising -- the
// generated code's own `assert (...) is not False` wrapper then treats that as "rule
// satisfied" (an indeterminate comparison is never Python's `False` singleton). TS/JS has
// no operator-overloading mechanism at all, so this specific propagation behavior cannot
// be ported as written -- Phase EX-2 (which evaluates real arithmetic/comparison
// expressions from the `calc_*` formulas) and Phase EX-4 (WHERE-rule boolean expressions)
// will need a different, explicit strategy (e.g. helper functions instead of raw
// operators, or representing indeterminate values so plain JS operators degrade to
// `NaN`/falsy in a way the caller must explicitly check). This shim's OWN functions (below)
// never invoke arithmetic/comparison operators ON an indeterminate value -- they only
// ever check `isIndeterminate(v)` by identity and pass the sentinel around -- so nothing
// here is blocked by this; it's flagged purely as a heads-up for whoever scopes EX-2.
//
// Real Python has no standalone test for this shim (always exercised indirectly through
// the generated rules it's inlined into) -- `test/express/runtimeShim.test.ts` is
// original, hand-rolled coverage of each function's documented/observed behavior, per
// this project's established convention for shim-layer code with no dedicated real test
// to port from (matching e.g. `fm.ts`/`profiler.ts`'s own precedent, `PROGRESS.md`'s
// "Niche `util` modules" row).

import { EntityInstance } from "../entityInstance";
import type { declaration as NativeDeclaration, entity as NativeEntity } from "../native/ifcopenshell_native";
import { declaration as NativeDeclarationCtor } from "../native/ifcopenshell_native";

/**
 * Python: `EXPRESS_ONE_BASED_INDEXING = 1`. EXPRESS aggregates (LIST/ARRAY/SET/BAG) are
 * 1-based; generated call sites always subtract this constant before calling
 * `expressGetItem` (e.g. `express_getitem(self, 1 - EXPRESS_ONE_BASED_INDEXING, ...)`),
 * so `expressGetItem` itself operates on a plain 0-based index -- confirmed by reading
 * every real `express_getitem(...)` call site in `IFC2X3.py` (all subtract this constant
 * inline, never index raw). JS arrays are already 0-based, so this maps through with no
 * further adjustment needed at this shim's own level -- only re-exported here because
 * Phase EX-2/EX-4's ported formula bodies will reference it literally, same as the real
 * generated Python does.
 */
export const EXPRESS_ONE_BASED_INDEXING = 1;

/**
 * Python: `class indeterminate_type` / `INDETERMINATE = indeterminate_type()`.
 *
 * Ported here as a unique sentinel VALUE, not a class with operator-overload dunders --
 * see this file's header comment for why the dunder-based poison-propagation behavior
 * (`bop`/`__lt__`/`__add__`/... all returning `self`) is a Phase EX-2/EX-4 concern, not
 * reproducible via a plain sentinel, and not needed by anything in this shim itself.
 * `isIndeterminate` below is the only thing this shim's own functions need: identity
 * against this one singleton (or `null`/`undefined`, this port's own `$`/NIL
 * representation -- see `isIndeterminate`'s own doc comment).
 */
export const INDETERMINATE: unique symbol = Symbol("EXPRESS_INDETERMINATE");

/** The type of the `INDETERMINATE` sentinel value. */
export type Indeterminate = typeof INDETERMINATE;

/**
 * Python: `def is_indeterminate(v): return v is None or type(v).__name__ ==
 * 'indeterminate_type'`.
 *
 * Python's `None` is this port's `null`/`undefined` (this port's own attribute-read path
 * already collapses an absent/`$` attribute to `null`, and a bare `undefined` is treated
 * identically here as a disclosed, harmless widening -- nothing in this shim
 * distinguishes the two). Identity against the single `INDETERMINATE` singleton is exact
 * (not a `typeof`/tag-name check like Python's, which only works because Python allows
 * runtime type introspection by class name) -- safe because this module never
 * constructs a second, distinct "indeterminate" value anywhere.
 */
export function isIndeterminate(value: unknown): value is Indeterminate | null | undefined {
	return value === null || value === undefined || value === INDETERMINATE;
}

/**
 * Python: `def nvl(v, default): return v if not is_indeterminate(v) else default`.
 * ("null value" -- SQL-style coalesce, but against EXPRESS's indeterminate rather than
 * SQL NULL.)
 */
export function nvl<T, D>(value: T, defaultValue: D): T | D {
	return isIndeterminate(value) ? defaultValue : value;
}

/**
 * Python:
 * ```python
 * def exists(v):
 *     if callable(v):
 *         try:
 *             return v() is not None
 *         except IndexError as e:
 *             return False
 *     else:
 *         return not is_indeterminate(v)
 * ```
 *
 * The `callable(v)` branch supports the generated rules' own lazy-evaluation idiom
 * (`exists(lambda: express_getitem(...))`) -- deferring evaluation specifically so a
 * would-be `IndexError` from evaluating the inner expression can be caught and treated
 * as "does not exist" rather than propagating. Ported catching `RangeError` (this
 * project's closest analog to an out-of-bounds access failure) as the disclosed
 * substitute for Python's `IndexError` -- in practice this catch is unreachable for the
 * realistic `exists(() => expressGetItem(...))` call shape, since `expressGetItem` never
 * throws (it already catches its own out-of-range case internally, matching Python's own
 * `express_getitem`), but is kept for structural fidelity and to guard any other
 * lazy-thunk shape a generated formula might use.
 */
export function exists(value: unknown): boolean {
	if (typeof value === "function") {
		try {
			const result = (value as () => unknown)();
			return result !== null && result !== undefined;
		} catch (error) {
			if (error instanceof RangeError) return false;
			throw error;
		}
	}
	return !isIndeterminate(value);
}

/**
 * Python:
 * ```python
 * def is_entity(inst):
 *     if isinstance(inst, ifcopenshell.entity_instance):
 *         schema_name = inst.is_a(True).split('.')[0].lower()
 *         decl = ifcopenshell.ifcopenshell_wrapper.schema_by_name(schema_name).declaration_by_name(inst.is_a())
 *         return isinstance(decl, ifcopenshell.ifcopenshell_wrapper.entity)
 *     return False
 * ```
 *
 * Disclosed simplification using an already-exposed primitive: real Python re-derives
 * `inst`'s own declaration from scratch via a `schema_by_name`/`declaration_by_name`
 * round trip through its *name*, purely because that's the uniform idiom the generated
 * code already uses everywhere else in this file. This port's `EntityInstance` already
 * has a direct, primitive-backed `isEntity()` method (`declaration().as_entity() !==
 * null`) that answers the exact same question without any string round trip -- verified
 * semantically identical, not just superficially similar (both ultimately ask "is this
 * instance's own runtime declaration an `entity` as opposed to a defined/simple type").
 */
export function isEntity(instance: unknown): boolean {
	return instance instanceof EntityInstance && instance.isEntity();
}

function toIndexableSequence(value: unknown): ArrayLike<unknown> {
	if (typeof value === "string" || Array.isArray(value)) return value;
	if (value instanceof Set) return Array.from(value);
	if (value instanceof ExpressSet) return value.toArray();
	throw new TypeError(`express runtime shim: value is not a sequence/aggregate: ${String(value)}`);
}

/**
 * Python:
 * ```python
 * def express_len(v):
 *     if isinstance(v, ifcopenshell.entity_instance) and (not is_entity(v)):
 *         v = v[0]
 *     elif is_indeterminate(v):
 *         return INDETERMINATE
 *     return len(v)
 * ```
 *
 * Aliased in real Python as `sizeof`/`hiindex`/`blength` (re-exported identically
 * below). The `v = v[0]` unwrap handles a standalone defined-type `entity_instance`
 * (e.g. a bare `IfcLabel`) whose real underlying value sits at pseudo-attribute index 0
 * ("wrappedValue"). `entityInstance.ts`'s own header comment discloses that `.get()`/
 * `.set()`/`.getInfo()` "only support entity-typed instances" (the *named*-attribute
 * path, which needs an entity declaration to resolve a name to an index) -- but that
 * restriction does NOT extend to plain index-based `getByIndex`, verified empirically
 * against a real standalone-defined-type fixture (`test/express/runtimeShim.test.ts`,
 * built via the same `createTypedValue` native-layer workaround `test/util/unit.test.ts`
 * already established) before writing this comment, not assumed from the named-path
 * gap: `getByIndex` only calls `attributeCount()` (which already has a non-entity
 * fallback of `1`) and the unconditionally-available `get_attribute_value(index)` --
 * neither needs an entity declaration. This unwrap branch therefore works correctly for
 * a real standalone defined-type value on this port today.
 */
export function expressLen(value: unknown): number | Indeterminate {
	let resolved: unknown = value;
	if (resolved instanceof EntityInstance && !isEntity(resolved)) {
		resolved = resolved.getByIndex(0) as unknown;
	} else if (isIndeterminate(resolved)) {
		return INDETERMINATE;
	}
	return toIndexableSequence(resolved).length;
}

export const sizeof = expressLen;
export const hiIndex = expressLen;
export const bLength = expressLen;

/**
 * Python: `loindex = lambda x: 1`. EXPRESS's low index of any aggregate is always 1 (its
 * one-based-indexing convention) -- the argument is accepted for call-site symmetry with
 * `hiIndex`/`sizeof` but genuinely never consulted, matching Python's own `lambda x: 1`
 * verbatim (not derived from `EXPRESS_ONE_BASED_INDEXING` -- kept as its own literal for
 * the same reason Python hard-codes `1` here rather than referencing the constant).
 */
export function loIndex(_aggregate: unknown): number {
	return 1;
}

/**
 * Python:
 * ```python
 * old_range = range
 * def range(*args):
 *     if any(map(is_indeterminate, args)):
 *         return
 *     yield from old_range(*args)
 * ```
 *
 * Shadows Python's builtin `range` so an indeterminate bound silently yields nothing
 * (an empty generator) instead of raising `TypeError` from comparing/iterating an
 * indeterminate value. Ported as an eagerly-materialized array (this shim's other
 * generator-based function, `usedIn`, is likewise realized as a plain array/`list()` on
 * the Python side) implementing Python's own 1-3-argument `range(stop)`/
 * `range(start, stop)`/`range(start, stop, step)` forms.
 */
export function expressRange(...args: Array<number | Indeterminate | null | undefined>): number[] {
	if (args.some((argument) => isIndeterminate(argument))) return [];
	const numericArgs = args as number[];
	let start = 0;
	let stop = 0;
	let step = 1;
	if (numericArgs.length === 1) {
		[stop] = numericArgs;
	} else if (numericArgs.length === 2) {
		[start, stop] = numericArgs;
	} else if (numericArgs.length === 3) {
		[start, stop, step] = numericArgs;
	} else {
		throw new RangeError(`range expected 1 to 3 arguments, got ${numericArgs.length}`);
	}
	if (step === 0) throw new RangeError("range() step argument must not be zero");
	const result: number[] = [];
	if (step > 0) {
		for (let i = start; i < stop; i += step) result.push(i);
	} else {
		for (let i = start; i > stop; i += step) result.push(i);
	}
	return result;
}

function attributeNameAt(entity: EntityInstance, index: number): string {
	const entityDeclaration = entity.declaration().as_entity();
	if (entityDeclaration === null) {
		throw new Error(`No forward attribute at index ${index} for instance of type '${entity.isA()}'`);
	}
	const names = entityDeclaration.all_attributes().map((attribute) => attribute.name());
	if (index < 0 || index >= names.length) {
		throw new Error(`No forward attribute at index ${index} for instance of type '${entity.isA()}'`);
	}
	return names[index];
}

/**
 * Python:
 * ```python
 * def usedin(inst, ref_name):
 *     if inst is None:
 *         return []
 *     _, __, attr = ref_name.split('.')
 *     def filter():
 *         for ref, attr_idx in inst.file.get_inverse(inst, allow_duplicate=True, with_attribute_indices=True):
 *             if ref.get_attribute_names()[attr_idx].lower() == attr:
 *                 yield ref
 *     return list(filter())
 * ```
 *
 * `ref_name` is always a 3-part dot-separated string (`"Schema.Class.Attribute"`,
 * generated verbatim from the EXPRESS source) -- only the trailing `attr` component is
 * ever consulted at runtime, confirmed by the tuple-unpack itself (`_, __, attr =
 * ...split('.')`) discarding the schema/class parts unconditionally. `usedin`'s only
 * external dependency, `file.get_inverse(inst, allowDuplicate=true,
 * withAttributeIndices=true)`, is already implemented on this port's `IfcFile`
 * (`file.ts`) with both parameters supported -- re-verified directly against
 * `IfcFile.getInverse`'s own source (returns `Array<[EntityInstance, number]>` in
 * exactly this call shape) before relying on it here, not just trusted from the prior
 * investigation this chunk's task brief cited.
 *
 * Deliberately does NOT special-case `inst.file` being `undefined` (a detached instance
 * constructed from a bare native handle with no known owner, per `entityInstance.ts`'s
 * own header comment) -- real Python's `inst.file` being `None` here would itself raise
 * `AttributeError: 'NoneType' object has no attribute 'get_inverse'`; this port lets the
 * equivalent `TypeError` occur naturally for the same reason, rather than silently
 * returning `[]` for a case real Python never treats as `[]` either.
 */
export function usedIn(instance: EntityInstance | null | undefined, refName: string): EntityInstance[] {
	if (instance === null || instance === undefined) return [];
	const parts = refName.split(".");
	if (parts.length !== 3) {
		throw new Error(`usedin: expected "Schema.Class.Attribute", got "${refName}"`);
	}
	const attributeName = parts[2].toLowerCase();
	// biome-ignore lint/style/noNonNullAssertion: mirrors real Python's own unguarded `inst.file.get_inverse(...)` -- see doc comment above.
	const pairs = instance.file!.getInverse(instance, true, true) as Array<[EntityInstance, number]>;
	const results: EntityInstance[] = [];
	for (const [ref, attributeIndex] of pairs) {
		if (attributeNameAt(ref, attributeIndex).toLowerCase() === attributeName) {
			results.push(ref);
		}
	}
	return results;
}

function isCollectionLike(value: unknown): value is Iterable<unknown> {
	return Array.isArray(value) || value instanceof Set || value instanceof ExpressSet;
}

/**
 * Python: `class express_set(set): ...` -- a `set` subclass with EXPRESS-flavored
 * operator overloads (`__mul__`/`__rmul__` as intersection, `__add__`/`__radd__` as
 * union-with-scalar-coercion, `__getitem__` via `express_getitem`). Ported as a
 * dedicated class with named methods (`multiply`/`plus`/`getItem`) rather than
 * overloaded JS operators, since JS has none to overload (see this file's header
 * comment on the same limitation for `indeterminate_type`) -- `multiply`/`plus` are
 * this port's disclosed, equivalent-behavior substitutes for `*`/`+` on two
 * `express_set`s.
 *
 * Backed by a JS `Set` for genuine set semantics (dedup, `has`), iterated in insertion
 * order -- a disclosed, harmless divergence from Python's own hash-based `set` iteration
 * order (which is not insertion order for arbitrary hashable values); nothing in the
 * generated rules is documented to depend on `express_set`'s iteration order, so this is
 * a strict improvement (deterministic) rather than a behavior change relied upon
 * anywhere.
 */
export class ExpressSet<T = unknown> {
	private readonly items: Set<T>;

	constructor(iterable?: Iterable<T>) {
		this.items = new Set(iterable);
	}

	get size(): number {
		return this.items.size;
	}

	has(value: T): boolean {
		return this.items.has(value);
	}

	toArray(): T[] {
		return [...this.items];
	}

	[Symbol.iterator](): IterableIterator<T> {
		return this.items[Symbol.iterator]();
	}

	/** Python: `express_set.__mul__`/`__rmul__` -- `express_set(set(other) & self)`. */
	multiply(other: Iterable<T>): ExpressSet<T> {
		const otherItems = new Set(other);
		return new ExpressSet([...this.items].filter((value) => otherItems.has(value)));
	}

	/**
	 * Python: `express_set.__add__`/`__radd__`. `other` is coerced to a single-element
	 * list unless it's already list/tuple/set/`express_set`-like (Python's own
	 * `make_list` helper, ported as `isCollectionLike` above) -- the result is then
	 * re-deduplicated by the `express_set(...)` constructor either way (Python's
	 * `express_set` IS a `set` subclass, so constructing one from a list with
	 * duplicates -- as `list(self) + make_list(other)` may produce -- dedupes
	 * automatically; this class's own `Set`-backed constructor does the same).
	 */
	plus(other: T | Iterable<T>): ExpressSet<T> {
		const rhs = isCollectionLike(other) ? Array.from(other as Iterable<T>) : [other as T];
		return new ExpressSet([...this.items, ...rhs]);
	}

	/** Python: `express_set.__getitem__` -- `express_getitem(list(self), k, INDETERMINATE)`. */
	getItem(index: number): T | Indeterminate | null {
		return expressGetItem(this.toArray(), index, INDETERMINATE) as T | Indeterminate | null;
	}

	/**
	 * Python: `set.__eq__` -- `express_set` is a bare `set` subclass with no override of
	 * its own, so `==` between two `express_set`s (or an `express_set` and a plain Python
	 * `set`) is genuine `set` structural equality (same size, same members, order-
	 * independent) -- NOT object identity, which is all a bare JS `===` between two
	 * `ExpressSet` instances would ever give. No chunk needed this before Phase EX-4
	 * chunk 3 (`express/whereRules/ifc2x3.ts`), which is the first to port WHERE-rules
	 * comparing two `typeof(...)` results directly with `==` (e.g.
	 * `IfcPropertyBoundedValue_WR21`: `typeof(upperboundvalue) == typeof(lowerboundvalue)`)
	 * -- added here, as a method on this class, rather than a new `runtimeShim.ts`-level
	 * `triEq`-style free function, since `typeof()`'s own return type is always exactly
	 * this class (never a bare JS `Set`/array), matching this class's own existing
	 * `multiply`/`plus`/`getItem` precedent of hosting EXPRESS/Python set-operator
	 * equivalents as named methods.
	 */
	equals(other: Iterable<T>): boolean {
		const otherSet = other instanceof ExpressSet ? other : new ExpressSet(other);
		if (this.items.size !== otherSet.items.size) return false;
		for (const value of this.items) {
			if (!otherSet.items.has(value)) return false;
		}
		return true;
	}
}

/**
 * Python:
 * ```python
 * def express_getitem(aggr, idx, default):
 *     if aggr is None:
 *         return default
 *     if isinstance(aggr, ifcopenshell.entity_instance) and (not is_entity(aggr)):
 *         aggr = aggr[0]
 *     try:
 *         return aggr[idx]
 *     except IndexError as e:
 *         return None
 * ```
 *
 * Two easily-missed, real asymmetries preserved exactly (both pinned by dedicated
 * tests, see `test/express/runtimeShim.test.ts`):
 * 1. **`aggr` itself absent -> `default`, but an out-of-range `idx` -> `null`, NOT
 *    `default`** -- confirmed by re-reading the real source twice, not assumed
 *    symmetric. A generated formula that calls `express_getitem(agg, i, INDETERMINATE)`
 *    therefore gets `INDETERMINATE` for a missing aggregate but a bare `null` (Python's
 *    `None`) for a valid-but-empty/out-of-bounds one -- a real, if subtle, distinction
 *    the generated code's own callers are written to expect.
 * 2. **Negative indices wrap around** (Python's own `aggr[idx]` semantics for `idx < 0`
 *    resolve to `len(aggr) + idx`, e.g. `-1` is the last element) -- ported explicitly
 *    since JS's own `array[-1]` does NOT wrap around (returns `undefined`, not the last
 *    element) -- a genuine language-level difference this function bridges rather than
 *    silently inherits. In practice every real generated call site computes `idx` as
 *    `X - EXPRESS_ONE_BASED_INDEXING` for a 1-based `X`, which only goes negative for an
 *    invalid `X <= 0`, but this is ported faithfully regardless since real Python would
 *    also wrap around in that case, not raise.
 *
 * See `expressLen`'s own doc comment for why the shared `aggr[0]` standalone-defined-
 * type-`entity_instance` unwrap this function also performs works correctly on this
 * port (verified empirically, not assumed) despite `EntityInstance`'s *named*-attribute
 * path having a real, disclosed non-entity restriction elsewhere.
 */
export function expressGetItem<D>(aggr: unknown, idx: number, defaultValue: D): unknown {
	if (aggr === null || aggr === undefined) return defaultValue;
	let resolved: unknown = aggr;
	if (resolved instanceof EntityInstance && !isEntity(resolved)) {
		resolved = resolved.getByIndex(0) as unknown;
	}
	const sequence = toIndexableSequence(resolved);
	const length = sequence.length;
	let index = idx;
	if (index < 0) index += length;
	if (index < 0 || index >= length) return null;
	return sequence[index];
}

/**
 * Python:
 * ```python
 * def express_getattr(aggr, name, default):
 *     v = getattr(aggr, name, default)
 *     if v is None:
 *         return default
 *     else:
 *         return v
 * ```
 *
 * Ported for the realistic call shape this shim actually needs to support -- `aggr` is
 * either an `EntityInstance` (a real forward-attribute read, dispatched through this
 * port's own attribute Proxy), `INDETERMINATE` (poison-propagates: returned as-is,
 * matching Python's `indeterminate_type.__getattr__` returning `self` for any name), or
 * `null`/`undefined` (matches Python's `getattr(None, name, default)` falling back to
 * `default`, since `None` genuinely has no such attribute). Python's fully generic
 * `getattr(obj, name, default)` also accepts arbitrary non-entity Python objects (used
 * elsewhere only by the NOT-ported `enum_namespace`, per this file's header comment) --
 * out of scope here, and a plain non-`EntityInstance` object falls back to `defaultValue`
 * rather than attempting a bare property read, a disclosed, narrower-but-safe substitute
 * (nothing in this shim's own scope calls `expressGetAttr` on anything else).
 *
 * A `null`/`undefined` *value read back* from a real attribute (real Python's `None` for
 * a genuinely unset/`$` optional attribute) collapses to `defaultValue` too -- this is
 * NOT a bug, it's the documented real behavior: `express_getattr(self, 'OptionalAttr',
 * INDETERMINATE)` on an unset attribute intentionally returns `INDETERMINATE`, not
 * `null`, so downstream arithmetic/comparisons in the generated formula see the
 * "indeterminate" marker they're designed to check for, not a bare `null` they are not
 * designed to handle.
 */
export function expressGetAttr<D>(aggr: unknown, name: string, defaultValue: D): unknown {
	if (aggr === INDETERMINATE) return INDETERMINATE;
	if (aggr === null || aggr === undefined) return defaultValue;
	if (!(aggr instanceof EntityInstance)) return defaultValue;
	let value: unknown;
	try {
		value = (aggr as unknown as Record<string, unknown>)[name];
	} catch {
		return defaultValue;
	}
	return value === null || value === undefined ? defaultValue : value;
}

function entityDeclarationName(entity: NativeEntity): string {
	// Same verified, disclosed pointer-reinterpret technique `util/schema.ts`'s own
	// (non-exported) `entityName` uses -- `entity`'s TS class has no public `.name()`
	// (only `declaration` does), even though real Python's SWIG binding lets `.name()`
	// resolve on either via single-inheritance-with-shared-base dispatch. Duplicated
	// locally (this project's established precedent -- `util/schema.ts`/`util/element.ts`
	// already independently duplicate this exact 2-line trick) rather than imported, to
	// keep this new shared module free of a cross-module dependency for one tiny helper.
	return new NativeDeclarationCtor(entity._handle).name();
}

/**
 * Python:
 * ```python
 * def typeof(inst):
 *     if not inst:
 *         return express_set([])
 *     schema_name = inst.is_a(True).split('.')[0].lower()
 *     def inner():
 *         decl = ifcopenshell.ifcopenshell_wrapper.schema_by_name(schema_name).declaration_by_name(inst.is_a())
 *         while decl:
 *             yield '.'.join((schema_name, decl.name().lower()))
 *             if isinstance(decl, ifcopenshell.ifcopenshell_wrapper.entity):
 *                 decl = decl.supertype()
 *             else:
 *                 decl = decl.declared_type()
 *                 while isinstance(decl, ifcopenshell.ifcopenshell_wrapper.named_type):
 *                     decl = decl.declared_type()
 *                 if not isinstance(decl, ifcopenshell.ifcopenshell_wrapper.type_declaration):
 *                     break
 *     return express_set(inner())
 * ```
 *
 * Disclosed simplification using an already-exposed primitive: rather than
 * re-deriving `inst`'s own declaration from a `schema_by_name`/`declaration_by_name`
 * string round trip (needed in Python only because that's the uniform idiom the
 * generated code happens to use), this starts directly from `inst.declaration()` --
 * the exact same declaration `schema_by_name(...).declaration_by_name(inst.is_a())`
 * would resolve to, verified by construction (same schema, same class name), just
 * without the redundant re-lookup.
 *
 * The inner `while isinstance(decl, named_type): decl = decl.declared_type()` loop is
 * real Python's own defensive general form, but traced against the actual C++ class
 * hierarchy (`src/ifcparse/schema.h`): `named_type` extends ONLY `parameter_type`, never
 * `declaration` -- so `named_type.declared_type()`'s return value (a `declaration*`) can
 * never itself, dynamically, also be a `named_type` again. That inner `while` therefore
 * provably runs at most once per outer iteration in every real schema (confirmed by
 * reading the actual base-class declarations, not just observed empirically) -- ported
 * here as a single `if`-shaped resolution (`asNamed.declared_type()`), not a loop, since
 * a genuine second hop is unreachable given the real class hierarchy.
 *
 * If `inst`'s own first-resolved declaration is neither an `entity` nor (via the
 * `else` branch) a `type_declaration` -- i.e. it directly names a `select_type`/
 * `enumeration_type` -- real Python's `decl.declared_type()` would itself raise
 * `AttributeError` (`select_type`/`enumeration_type` define no such method); this port
 * throws an equivalent, disclosed `Error` at the same point rather than silently
 * returning a partial result, a real if narrow edge case neither this shim nor Phase
 * EX-2/EX-4 are expected to exercise in practice (a `typeof()` argument is always a real
 * `entity_instance` for an entity or a type-declaration-backed defined-type value, never
 * a bare select/enum declaration reference).
 */
export function typeOf(instance: EntityInstance | null | undefined): ExpressSet<string> {
	if (!instance) return new ExpressSet<string>();
	const startDeclaration = instance.declaration();
	const schemaName = startDeclaration.schema().name().toLowerCase();
	const names: string[] = [];

	const startEntity = startDeclaration.as_entity();
	if (startEntity !== null) {
		let cursor: NativeEntity | null = startEntity;
		while (cursor !== null) {
			names.push(`${schemaName}.${entityDeclarationName(cursor).toLowerCase()}`);
			cursor = cursor.supertype();
		}
	} else {
		let cursor: NativeDeclaration | null = startDeclaration;
		while (cursor !== null) {
			names.push(`${schemaName}.${cursor.name().toLowerCase()}`);
			const asTypeDeclaration = cursor.as_type_declaration();
			if (asTypeDeclaration === null) {
				throw new Error(
					`typeof: '${cursor.name()}' is neither an entity nor a type declaration -- real Python's generated typeof() would raise AttributeError here too (calling .declared_type() on a select_type/enumeration_type); see this function's own doc comment.`,
				);
			}
			const parameterType = asTypeDeclaration.declared_type();
			const asNamedType = parameterType.as_named_type();
			if (asNamedType === null) {
				break; // simple_type/aggregation_type -- terminal, matches Python's `not isinstance(decl, type_declaration): break`.
			}
			const resolved = asNamedType.declared_type();
			cursor = resolved.as_type_declaration() !== null ? resolved : null;
		}
	}
	return new ExpressSet(names);
}

// =============================================================================
// Phase EX-4 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md, "the large
// chunk" -- WHERE-rule classes + `rule_executor.py`): this shim's own header comment
// (above, "A separate, load-bearing finding for Phase EX-2/EX-4") already flagged that
// real Python's `indeterminate_type` dunder-based poison propagation (`__lt__`/`__eq__`/
// `__add__`/etc. all aliased to `bop`, returning `self`) has no JS operator-overloading
// equivalent, and that whichever phase first evaluates real comparison/boolean
// expressions from generated formula bodies would need an explicit strategy. This is
// that strategy, built while porting the first 70 IFC2X3 WHERE-rule classes
// (`express/whereRules/ifc2x3.ts`) -- confirmed empirically against real Python's own
// documented dunder behavior (re-read line-by-line above, not assumed) before writing
// any of the following:
//
// **Comparisons (`==`/`!=`/`<`/`<=`/`>`/`>=`) are order-independent poison-propagation**:
// `indeterminate_type`'s own reflected dunders (`__eq__`/`__lt__`/`__gt__`/...) are ALL
// aliased to the same `bop`, which returns `self` (`INDETERMINATE`) unconditionally --
// so `X <op> INDETERMINATE` and `INDETERMINATE <op> X` both resolve to `INDETERMINATE`
// regardless of `X` or which comparison operator is used (Python tries the left
// operand's own dunder first, gets `NotImplemented` since a plain `int`/`str` has no
// idea how to compare against an `indeterminate_type`, then falls back to the right
// operand's reflected dunder, which is `bop` either way). `triEq`/`triNe`/`triLt`/
// `triLe`/`triGt`/`triGe` below implement exactly this: check either operand for
// indeterminacy FIRST, unconditionally, before ever touching the actual values.
//
// `triEq`/`triNe` additionally dispatch to `EntityInstance.equals()`/`.notEquals()`
// when either operand is an `EntityInstance` -- **load-bearing, not optional**: real
// Python's own generated rules are compiled with EXPRESS `=`/`<>` emitted as Python
// `==`/`!=` (`rule_compiler.py`'s own `process_rel_op`, confirmed directly), which for
// two `entity_instance` operands dispatches to `entity_instance_mixin.__eq__` --
// itself gated on `ifcopenshell.settings.compare_instances_by_value` (`entity_
// instance.py` lines 211-226), the exact global flag this module's own executor
// (`ruleExecutor.ts`) toggles `true` for the whole rule-execution pass, matching real
// Python's own `rule_executor.run()` (lines 90-97). TS has no operator overloading, so
// a ported rule body comparing two values that MIGHT be `EntityInstance`s must call
// `triEq`/`triNe` (which delegate to `.equals()`, itself already `settings.
// compareInstancesByValue`-aware -- see `entityInstance.ts`) explicitly, never a bare
// `===`/`!==` -- a bare `===` would compare object identity only, silently reproducing
// NEITHER Python's default identity-comparison mode NOR its value-comparison mode once
// the setting is toggled on. Every ported WHERE-rule body in `express/whereRules/*.ts`
// is expected to follow this rule for any comparison whose operands could be entity
// instances (plain scalar comparisons -- numbers, strings, enum-name strings -- have no
// such requirement and may use `triLt`/`triGe`/`===`/`!==` freely, since a bare
// `===`/`!==` between two primitives is already correct either way).
//
// **`and`/`or` are Python short-circuit value-returning operators, NOT symmetric
// 3-valued (Kleene) logic** -- a genuinely easy mistake to make, and empirically
// verified here rather than assumed: Python's `a and b` returns `a` itself (unevaluated
// `b`) when `bool(a)` is falsy, else returns `b`; `a or b` returns `a` when truthy, else
// `b`. Since `indeterminate_type.__bool__` returns `False` (making it Python-falsy),
// `INDETERMINATE and X` ALWAYS returns `INDETERMINATE` itself (`X` never evaluated,
// REGARDLESS of what `X` actually is -- even if `X` would itself be `False`), while
// `False and INDETERMINATE` returns the definite `False` (short-circuits on the first,
// definite, falsy operand -- `INDETERMINATE` never evaluated). This is a real,
// order-dependent asymmetry, NOT the commutative "FALSE dominates" table standard
// 3-valued/SQL logic would predict. `pyAnd`/`pyOr` below reproduce this exactly via a
// lazy right-hand thunk (never evaluated when the left operand alone already
// determines the result) -- ported this way specifically so a chain like
// `pyOr(pyAnd(a, () => b), () => c)` mirrors the real Python source's own left-to-right
// operand evaluation and short-circuiting precisely, operand for operand.
//
// **`not` ALWAYS collapses to a definite boolean, losing indeterminacy entirely** --
// also verified directly: Python has no `__not__` dunder at all; `not x` is always
// `bool(x)` inverted, and `bool(INDETERMINATE)` is `False`, so `not INDETERMINATE` is
// the definite `True`, not indeterminate-propagating. This is a real, if easily-missed,
// verbatim Python quirk (`assert not readsAsIndeterminate is not False` will therefore
// often trivially pass, `True is not False`) -- ported faithfully as `pyNot` below
// (a plain boolean-returning function, deliberately NOT `Tri`-returning), not "fixed"
// into a poison-propagating `triNot` no real generated rule body would actually match.
//
// **The top-level `assert (...) is not False` idiom**: `assertWhereRule` below is the
// direct TS equivalent -- fails (throws) if and only if the final expression is the
// literal `false`; any other value (`true`, `INDETERMINATE`, or any other truthy
// non-boolean real Python's own generated formula might otherwise produce, e.g. a bare
// scalar/entity from a degenerate `and`/`or` chain) is treated as "rule satisfied",
// exactly mirroring Python's own identity check against the `False` singleton.
// =============================================================================

/** A value that may be `boolean` or genuinely indeterminate -- see this section's own header comment. */
export type Tri = boolean | Indeterminate;

/**
 * Python: `not x` on a value that may be `INDETERMINATE` -- see this section's own
 * header comment for why this deliberately collapses to a definite boolean rather than
 * propagating indeterminacy (a real, verbatim-preserved Python quirk: `indeterminate_
 * type` has no `__not__` override, so `not INDETERMINATE` is the definite `True`).
 */
export function pyNot(value: Tri): boolean {
	return isIndeterminate(value) ? true : !value;
}

/**
 * Python: `a and b`, where `b` is a lazy thunk mirroring Python's own short-circuit
 * non-evaluation of the right operand whenever `a` alone is already falsy (`False` or
 * `INDETERMINATE`, see this section's own header comment for why this is NOT the same
 * as symmetric 3-valued-logic "FALSE dominates").
 */
export function pyAnd(a: Tri, b: () => Tri): Tri {
	return a === false || isIndeterminate(a) ? a : b();
}

/**
 * Python: `a or b`, where `b` is a lazy thunk mirroring Python's own short-circuit
 * non-evaluation of the right operand whenever `a` alone is already truthy (`a ===
 * true`; `INDETERMINATE`'s own falsiness means `INDETERMINATE or b` always evaluates
 * `b`, never short-circuiting on the left operand -- see this section's own header
 * comment).
 */
export function pyOr(a: Tri, b: () => Tri): Tri {
	return a === true ? a : b();
}

/**
 * Python: `a == b` / EXPRESS `=`, compiled to Python `==` (`rule_compiler.py`'s own
 * `process_rel_op`). See this section's own header comment for why either operand's
 * indeterminacy poisons the result regardless of order, and why an `EntityInstance`
 * operand must dispatch through `.equals()` (itself `settings.compareInstancesByValue`-
 * aware) rather than a bare `===`.
 */
export function triEq(a: unknown, b: unknown): Tri {
	if (isIndeterminate(a) || isIndeterminate(b)) return INDETERMINATE;
	if (a instanceof EntityInstance) return a.equals(b);
	if (b instanceof EntityInstance) return b.equals(a);
	return a === b;
}

/** Python: `a != b` / EXPRESS `<>`, compiled to Python `!=` -- see `triEq`'s own doc comment. */
export function triNe(a: unknown, b: unknown): Tri {
	const eq = triEq(a, b);
	return isIndeterminate(eq) ? INDETERMINATE : !eq;
}

function triCompare(a: unknown, b: unknown, compare: (x: number, y: number) => boolean): Tri {
	if (isIndeterminate(a) || isIndeterminate(b)) return INDETERMINATE;
	return compare(a as number, b as number);
}

/** Python: `a < b` -- see this section's own header comment on order-independent poison propagation. */
export function triLt(a: unknown, b: unknown): Tri {
	return triCompare(a, b, (x, y) => x < y);
}

/** Python: `a <= b` -- see `triLt`'s own doc comment. */
export function triLe(a: unknown, b: unknown): Tri {
	return triCompare(a, b, (x, y) => x <= y);
}

/** Python: `a > b` -- see `triLt`'s own doc comment. */
export function triGt(a: unknown, b: unknown): Tri {
	return triCompare(a, b, (x, y) => x > y);
}

/** Python: `a >= b` -- see `triLt`'s own doc comment. */
export function triGe(a: unknown, b: unknown): Tri {
	return triCompare(a, b, (x, y) => x >= y);
}

/**
 * Python: `a ^ b` (bitwise XOR, real Python's own idiom for chained "exactly one of N
 * conditions holds" checks on plain `bool`s, e.g. `IfcGridAxis_WR2`:
 * `(sizeof(partofu) == 1) ^ (sizeof(partofv) == 1) ^ (sizeof(partofw) == 1)`). Not
 * needed by any Phase EX-4 chunk 1/2 rule -- first real consumer is chunk 3's own
 * `IfcGridAxis_WR2`. `indeterminate_type` overloads `__xor__`/`__rxor__` the same way it
 * overloads every other dunder this section documents (aliased to `bop`, returning
 * `self`) -- ported the same order-independent-poison-propagation way as `triEq`/
 * `triLt`/etc. above, even though in practice every real call site's own operands
 * (`sizeof(...) == 1`-shaped `Tri`s) are never actually indeterminate (the aggregates
 * being sized are always-defined INVERSE `SET`s, never optional forward attributes) --
 * ported for structural fidelity/uniformity with this section's own established
 * discipline regardless.
 */
export function triXor(a: Tri, b: Tri): Tri {
	if (isIndeterminate(a) || isIndeterminate(b)) return INDETERMINATE;
	return (a as boolean) !== (b as boolean);
}

/**
 * Python: `a / b` where `a` may be `INDETERMINATE` (`indeterminate_type.__truediv__ =
 * bop` returns `self` rather than raising). A raw JS `(a as number) / b` on an
 * `INDETERMINATE` `a` would instead silently divide the `Symbol` sentinel-as-`NaN`
 * (worse, `Symbol / number` actually THROWS a `TypeError` in JS, unlike Python's own
 * graceful poison propagation) -- confirmed empirically before adding this, not
 * assumed. Needed by e.g. `IfcCShapeProfileDef_WR1..WR3`'s own `Depth / 2.0`/`Width /
 * 2.0` divisions in `whereRules/ifc2x3.ts`; only `a` (the generated rules' own division
 * operand that is ever a `express_getattr(...)` result) needs this guard in practice --
 * `b` is always a literal constant in every real call site found so far.
 */
export function triDiv(a: unknown, b: number): number | Indeterminate {
	return isIndeterminate(a) ? INDETERMINATE : (a as number) / b;
}

/**
 * Python: `assert (...) is not False` -- the idiom every generated WHERE-rule
 * `__call__` body ends with (`rule_compiler.py`'s own codegen always wraps a rule's
 * final boolean expression this way). Fails (throws) if and only if `value` is the
 * literal `false` -- see this section's own header comment for why any other value
 * (`true`, `INDETERMINATE`, or any other truthy value a degenerate `and`/`or` chain
 * might produce) means "rule satisfied," matching Python's own identity check against
 * the `False` singleton exactly.
 */
export function assertWhereRule(value: Tri, message: string): void {
	if (value === false) throw new Error(message);
}
