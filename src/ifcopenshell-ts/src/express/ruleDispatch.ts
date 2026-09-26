// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-4 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md, "the large
// chunk"): the WHERE-rule registry, the direct analog of `dispatch.ts`'s own per-schema
// `calc_*` registry -- mirrors that module's own registration-map pattern as closely as
// makes sense, per this chunk's own task brief. Real Python's `rule_executor.run()`
// (`ifcopenshell/express/rule_executor.py` lines 116-123) dynamically `exec()`s the
// generated `rules/{schema}.py` module text and introspects its module-level names for
// anything carrying a `SCOPE` class attribute (`rules = list(filter(lambda x: hasattr(x,
// "SCOPE"), scope.values()))`) -- this port has no equivalent "load an arbitrary TS
// module by a computed schema-identifier string at runtime" mechanism, exactly the same
// gap `dispatch.ts`'s own header comment already disclosed and worked around for
// `calc_*` functions. The same fix applies here: each ported schema's WHERE-rule module
// (`whereRules/ifc2x3.ts`, and future `whereRules/ifc4.ts`/`whereRules/ifc4x3.ts`) calls
// `registerSchemaRules` at its own module top level (a side effect of importing it), and
// `whereRules/index.ts` statically imports every ported schema module for that side
// effect alone -- so "which rules exist for this schema" becomes a plain `Map` lookup,
// not a dynamic import/exec attempt.
//
// **Separate registry from `dispatch.ts`'s own `calc_*` one, deliberately** -- WHERE-
// rules and DERIVE (`calc_*`) functions are sourced from the exact same real Python file
// per schema (`ifcopenshell/express/rules/{schema}.py`), but they are semantically
// distinct (a DERIVE function COMPUTES an attribute's value; a WHERE-rule VALIDATES one
// or more attributes and throws on violation) and are consumed by entirely different
// mechanisms in this port: `calc_*` functions are looked up on-demand, per attribute
// name, from `entityInstance.ts`'s own `.get()` DERIVE-dispatch branch; WHERE-rules are
// looked up in bulk, per schema, by `ruleExecutor.ts`'s own 3-phase (file/type/entity)
// executor, which needs the FULL list of a schema's rules up front to build its own
// type-scope subtype-dispatch map (see that file's own header comment). A single merged
// registry would force every `calc_*` lookup to also filter out WHERE-rule entries (or
// vice-versa) for no benefit -- two small, purpose-built registries are simpler and
// exactly mirror the two distinct consumption shapes.
//
// **Naming**: `ruleDispatch.ts`/`ruleExecutor.ts` (this file is the registry, the
// sibling `ruleExecutor.ts` is the 3-phase engine that consumes it) -- kept as two
// files rather than folded together (the task brief offered either), since the
// registry's own dependency footprint is deliberately kept minimal (see below, mirrors
// `dispatch.ts`'s own stated rationale exactly), while the executor needs real value
// imports of `IfcFile`/`EntityInstance`/`util/schema.ts`/`validate.ts`'s
// `ValidationError` -- keeping them separate means every future per-schema WHERE-rule
// module (`whereRules/*.ts`, expected to be the single largest and most numerous set of
// files in this entire port, ~1,830 rules across 3 schemas) only ever needs to import
// this file, never the heavier executor.
//
// **Dependency footprint, deliberately minimal** (mirrors `dispatch.ts`'s own stated
// rationale): this module imports NOTHING from the rest of this package -- not even
// `EntityInstance`/`IfcFile` as types -- since `RuleDefinition['check']` is typed
// generically enough (`(target: unknown) => void`, widened from whichever of the 3 more
// specific per-scope shapes a given rule module actually uses -- TS's bivariant
// function-parameter checking allows a narrower-parameter function, e.g. `(self:
// EntityInstance) => void`, to satisfy this wider type with no cast needed at the
// registration call site) that this module never needs to reference either class at
// all, let alone construct or inspect one at runtime.

/** Python: `SCOPE = 'file' | 'type' | 'entity'` (a WHERE-rule class's own class attribute). */
export type RuleScope = "file" | "type" | "entity";

/**
 * One ported WHERE-rule class (Python: a bare class with `SCOPE`/`TYPE_NAME`/
 * `RULE_NAME` class attributes and a single `__call__` static method, e.g.
 * `IfcAxis1Placement_WR1`). `typeName` is `undefined` for `SCOPE = "file"` rules (real
 * Python's own file-scope rule classes have no `TYPE_NAME` attribute at all -- verified
 * directly against `rule_executor.py` lines 128-144, which never reads `TYPE_NAME` for
 * the file-scope loop).
 *
 * `check`'s own parameter type varies by `scope` (a `RuleScope: "file"` rule's `check`
 * receives the whole `IfcFile`; `"entity"` receives a single `EntityInstance`; `"type"`
 * receives the raw, already-unwrapped attribute VALUE the rule's `TYPE_NAME` was
 * declared for -- a plain `string`/`number`/`boolean`/array, never an `EntityInstance`
 * wrapper, matching real Python's own `R()(fix_type(value))`, `rule_executor.py` line
 * 186) -- widened to `any` here (deliberately NOT `unknown`: this project's `tsconfig.
 * json` has `strict: true`, so a plain function-typed property is checked
 * contravariantly on its parameter -- a `(self: EntityInstance) => void` is NOT
 * assignable to `(target: unknown) => void` under that check, but `any` is bivariant
 * regardless of `strictFunctionTypes`, so it IS assignable either direction -- verified
 * directly against this project's own `tsconfig.json`, not assumed) so this one
 * interface covers all three shapes uniformly: a per-schema rules module writes each
 * `check` with its own specific, narrower parameter type (see `whereRules/ifc2x3.ts`)
 * and satisfies this wider `RuleDefinition['check']` type with no cast needed.
 *
 * `check` throws a plain `Error` (message-only, human-readable, hand-written per rule --
 * per this chunk's own task brief, NOT `validate.ts`'s own `ValidationError` class
 * directly, keeping this registry's own dependency footprint free of `validate.ts` too)
 * on violation, mirroring real Python's bare `assert (...) is not False` -- see
 * `runtimeShim.ts`'s own `assertWhereRule` helper, which every ported rule's `check`
 * body is expected to call at its own single, final assertion point.
 */
export interface RuleDefinition {
	readonly scope: RuleScope;
	readonly typeName: string | undefined;
	readonly ruleName: string;
	// biome-ignore lint/suspicious/noExplicitAny: deliberate -- see this interface's own doc comment on `check`.
	readonly check: (target: any) => void;
}

// schemaIdentifier (e.g. "IFC2X3", exactly `declaration.schema().name()` -- see
// `dispatch.ts`'s own header comment on why this port keys by the *exact* registered
// identifier, not the coarser normalized `IfcFile.schema`) -> "<TypeName>.<RuleName>"
// (or bare "<RuleName>" for a file-scope rule, which has no `typeName`) -> rule.
const schemaRuleRegistries = new Map<string, Map<string, RuleDefinition>>();

function ruleKey(rule: RuleDefinition): string {
	return rule.typeName !== undefined ? `${rule.typeName}.${rule.ruleName}` : rule.ruleName;
}

/**
 * Registers one schema's worth of WHERE-rules, merged into whatever is already
 * registered for the same `schemaIdentifier` -- see `dispatch.ts`'s own
 * `registerSchemaCalcFunctions` doc comment for why this is a plain additive merge
 * (a later chunk adding more of the same schema's rules, or a second module
 * contributing to the same schema, never silently replaces an earlier chunk's entries
 * wholesale; re-registering the exact same `<TypeName>.<RuleName>` key does still
 * overwrite that one entry, matching a plain `Map.set` -- there is no expectation two
 * different chunks would ever port the same rule class twice).
 */
export function registerSchemaRules(schemaIdentifier: string, rules: readonly RuleDefinition[]): void {
	let registry = schemaRuleRegistries.get(schemaIdentifier);
	if (!registry) {
		registry = new Map();
		schemaRuleRegistries.set(schemaIdentifier, registry);
	}
	for (const rule of rules) {
		registry.set(ruleKey(rule), rule);
	}
}

/**
 * All WHERE-rules registered for `schemaIdentifier`, in no particular guaranteed order
 * (`ruleExecutor.ts`'s own 3-phase executor groups/filters this list by `scope` itself,
 * exactly mirroring real Python's own `rules = list(filter(...))` -> per-scope filtering
 * shape, `rule_executor.py` lines 123-278). Returns an empty array for a schema with no
 * registered rules yet (e.g. IFC4/IFC4X3, until their own future chunks land) --
 * matching `dispatch.ts`'s own "a schema with zero ported functions simply has no
 * registry entry at all" precedent, never a thrown error.
 */
export function getSchemaRules(schemaIdentifier: string): RuleDefinition[] {
	const registry = schemaRuleRegistries.get(schemaIdentifier);
	return registry ? [...registry.values()] : [];
}

/** Test-only escape hatch, matching `dispatch.ts`'s own `_clearSchemaCalcRegistryForTests` precedent. */
export function _clearSchemaRuleRegistryForTests(): void {
	schemaRuleRegistries.clear();
}
