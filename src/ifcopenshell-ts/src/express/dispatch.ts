// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-2, first chunk (planning/ifcopenshell-ts/70-express-rules-plan.md §4): the
// schema-scoped DERIVE (`calc_*`) dispatch mechanism `EntityInstance.get()`
// (`entityInstance.ts`) calls for an attribute whose `get_attribute_category()` is
// `DERIVED`. Mirrors real Python's `entity_instance_mixin.__getattr__` DERIVE-dispatch
// branch (`ifcopenshell/entity_instance.py`, the `else:` clause): resolve the
// per-schema generated rules module (real Python:
// `importlib.import_module(f"ifcopenshell.express.rules.{schema_name}")`), then walk
// `self`'s own supertype chain from most-derived to least (real Python's own
// `yield_supertypes()` closure) looking for a `calc_{sty}_{name}` function, returning
// the first match's result -- exactly Python's `for sty in yield_supertypes(): if fn :=
// getattr(rules, f"calc_{sty}_{name}", None): return fn(self)`.
//
// **Static vs. dynamic registration, disclosed.** Real Python resolves the rules module
// per-schema *dynamically* (`importlib.import_module`), because Python modules are
// looked up by string name against `sys.path` at call time. This port has no
// equivalent "load an arbitrary TS module by a computed schema-identifier string at
// runtime" mechanism, and shouldn't grow one just for this -- every other per-schema
// difference in this port (e.g. `util/unit.ts`'s IFC2X3-vs-IFC4+ branches) is resolved
// by ordinary static imports, not dynamic module loading. Each ported schema's rules
// module (`rules/ifc2x3.ts`, and future `rules/ifc4.ts`/`rules/ifc4x3.ts`) instead
// calls `registerSchemaCalcFunctions` at its own module top level (a side effect of
// importing it), and `rules/index.ts` statically imports every ported schema module for
// that side effect alone -- so "does a `calc_*` function exist for this schema" becomes
// a plain `Map` lookup, not a dynamic import attempt. A schema with zero ported
// functions (IFC4/IFC4X3, until their own future chunks land) simply has no registry
// entry at all, and every lookup for it falls through to `DERIVE_NOT_FOUND` --
// **exactly the same observable behavior as before this chunk**
// (`entityInstance.ts`'s `.get()` throwing "has no attribute") for every attribute this
// chunk doesn't touch, matching this chunk's own task brief: unported functions "behave
// exactly as they did BEFORE this chunk."
//
// **Registry key shape**: `"<EntityName>.<AttributeName>"` (e.g. `"IfcAxis1Placement.Z"`),
// matching the two components real Python's own `calc_{sty}_{name}` function-name
// convention encodes (`sty` = the exact declaration name at whichever supertype level
// the function is declared for, `name` = the derived attribute's own name) -- both
// components are read directly off the schema's own declaration names, so casing
// always matches the generated Python's own `calc_IfcXxx_Yyy` naming exactly (no
// case-folding needed anywhere in this module).
//
// **Dependency footprint, deliberately minimal.** This module only imports native
// schema-introspection bindings (no value dependency on `entityInstance.ts`/`file.ts`/
// `template.ts`) -- `EntityInstance` is referenced as a type only. `entityInstance.ts`
// itself statically imports this module (for `.get()`'s DERIVE branch), so keeping
// this module's own runtime dependency graph as small as possible avoids adding any
// new module-cycle risk to the single most central class in this port. The tiny
// `entity` -> `declaration` pointer-reinterpret trick below is therefore duplicated
// locally rather than imported from `util/schema.ts`'s own `entityName`/`getSupertypes`
// (which themselves already pull in `template.ts`/`file.ts`/`entityInstance.ts` as real
// value dependencies) -- matching this project's established precedent for this exact
// 2-line trick (`runtimeShim.ts`'s own `entityDeclarationName`, `util/schema.ts`'s
// `entityName`, `util/element.ts`'s own copy all independently duplicate it rather than
// cross-import one canonical helper).

import type { EntityInstance } from "../entityInstance";
import type { entity as NativeEntity } from "../native/ifcopenshell_native";
import { declaration as NativeDeclarationCtor } from "../native/ifcopenshell_native";

/** A single ported `calc_{EntityName}_{AttributeName}` DERIVE formula -- `fn(self)` in real Python. */
export type CalcFunction = (self: EntityInstance) => unknown;

// schemaIdentifier (e.g. "IFC2X3", exactly `declaration.schema().name()` -- see
// `attributeCache.ts`'s own header comment on why this port keys by the *exact*
// registered identifier, not the coarser normalized `IfcFile.schema`) -> "<Entity>.<Attr>" -> fn.
const schemaRegistries = new Map<string, Map<string, CalcFunction>>();

/**
 * Registers one schema's worth of `calc_*` functions, merged into whatever is already
 * registered for the same `schemaIdentifier` -- so a later chunk adding more of the
 * same schema's functions (or a second module contributing to the same schema) is a
 * plain additive merge, never a silent wholesale replacement of an earlier chunk's
 * entries (re-registering the exact same key does still overwrite that one entry,
 * matching a plain `Map.set` -- there is no expectation two different chunks would
 * ever port the same `calc_*` function twice).
 */
export function registerSchemaCalcFunctions(
	schemaIdentifier: string,
	functions: Readonly<Record<string, CalcFunction>>,
): void {
	let registry = schemaRegistries.get(schemaIdentifier);
	if (!registry) {
		registry = new Map();
		schemaRegistries.set(schemaIdentifier, registry);
	}
	for (const [key, fn] of Object.entries(functions)) {
		registry.set(key, fn);
	}
}

/** Test-only escape hatch, matching `attributeCache.ts`'s own `_clearAttributeMetaCacheForTests` precedent. */
export function _clearSchemaCalcRegistryForTests(): void {
	schemaRegistries.clear();
}

/** See this file's header comment for why this 2-line trick is duplicated here rather than imported. */
function entityDeclarationName(entity: NativeEntity): string {
	return new NativeDeclarationCtor(entity._handle).name();
}

/**
 * Real Python's `yield_supertypes()` (a closure inside `__getattr__`): walks from
 * `self`'s own most-derived declared class up through `.supertype()` to the root,
 * yielding each declaration's own name. `self.is_a()` (Python, no schema prefix) is
 * always `self`'s own most-derived class -- exactly `instance.declaration().as_entity()`
 * here (this instance's own declaration, not re-derived via a schema-name/`is_a()`
 * string round trip), the same disclosed simplification `runtimeShim.ts`'s
 * `isEntity`/`typeOf` already use and justify in their own doc comments.
 */
function* yieldSupertypeNames(instance: EntityInstance): Generator<string> {
	let cursor: NativeEntity | null = instance.declaration().as_entity();
	while (cursor !== null) {
		yield entityDeclarationName(cursor);
		cursor = cursor.supertype();
	}
}

/**
 * Returned by `resolveDerivedAttribute` when no ported `calc_*` function exists for
 * `name` anywhere in `instance`'s supertype chain, for `instance`'s own schema. NOT
 * `undefined` -- a legitimately ported formula can itself return `undefined`/`null`/
 * `runtimeShim.INDETERMINATE` as its real, computed value (see `runtimeShim.ts`'s own
 * header comment on why an unset attribute can genuinely calculate to `INDETERMINATE`)
 * -- so "not found" needs its own distinct sentinel, not a value a real formula could
 * also legitimately produce.
 */
export const DERIVE_NOT_FOUND: unique symbol = Symbol("DERIVE_NOT_FOUND");

/**
 * Mirrors real Python's `for sty in yield_supertypes(): if fn := getattr(rules,
 * f"calc_{sty}_{name}", None): return fn(self)` -- the first matching supertype (most-
 * derived first) wins, exactly like Python's `getattr` walk (a subtype-declared
 * `calc_*` function, if one exists, always shadows an ancestor's, since the walk stops
 * at the first hit). Returns `DERIVE_NOT_FOUND` when nothing in the chain has a
 * registered function for `name`, for the schema `instance` belongs to -- callers
 * (`entityInstance.ts`) then fall back to their own pre-existing "no such attribute"
 * error, unchanged.
 */
export function resolveDerivedAttribute(instance: EntityInstance, name: string): unknown {
	const schemaIdentifier = instance.declaration().schema().name();
	const registry = schemaRegistries.get(schemaIdentifier);
	if (!registry) return DERIVE_NOT_FOUND;
	for (const sty of yieldSupertypeNames(instance)) {
		const fn = registry.get(`${sty}.${name}`);
		if (fn) return fn(instance);
	}
	return DERIVE_NOT_FOUND;
}
