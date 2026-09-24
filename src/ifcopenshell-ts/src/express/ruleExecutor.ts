// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-4 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md, "the large
// chunk" -- WHERE-rule classes + `rule_executor.py`): near-verbatim port of real
// Python's `run(f, logger)` (`ifcopenshell/express/rule_executor.py`, 306 lines, read in
// full before writing this) -- the 3-phase (file/type/entity) WHERE-rule execution
// engine. `ruleDispatch.ts` (this file's sibling) is the registry half; see that file's
// own header comment for why they're kept separate.
//
// **What this file deliberately does NOT port**, per this chunk's own task brief (each
// confirmed directly against the real source, not assumed):
// - `reverse_compile()` (lines 11-33) and the `error` dataclass's own `__str__`
//   formatting (lines 36-52) -- a text-reversal hack decompiling a compiled Python
//   source line back into pseudo-EXPRESS syntax for a nicer failure message. Confirmed
//   pure message-formatting, never affects pass/fail logic. `toViolation` below builds
//   its own, TS-native message instead (see its own doc comment).
// - `fix_type()` (lines 55-67) -- confirmed a no-op by real Python's own comment
//   (`# We don't do this anymore`); not ported, matching the task brief exactly (no
//   transformation applied to a type-scope rule's value before calling `check`).
// - `ast`/`_pytest.assertion.rewrite`/`compile`/`exec()`-based dynamic module loading
//   (lines 100-121) -- has no TS equivalent and needs none; each schema's WHERE-rules
//   are hand-ported, real TS functions, statically registered via `ruleDispatch.ts`'s
//   `registerSchemaRules` (mirrors `dispatch.ts`'s own `calc_*` registration pattern),
//   not dynamically `exec()`'d from generated source text.
// - The duck-typed `logger` parameter and its `set_state`/`set_instance` JSON-logger
//   branches (lines 73-89, 125-127, 146-147, 256-257) -- this chunk's own task brief
//   locks a TS-native violation-list return shape instead (`executeRules(f):
//   ValidationError[]`), matching `validate.ts`'s own already-locked design for exactly
//   this reason (both are meant to unify in a future Phase EX-5).
//
// **The two global settings** (`ifcopenshell.settings.unpack_non_aggregate_inverses`/
// `compare_instances_by_value`, real source lines 90-97, 280-281): both are ALREADY
// FULLY IMPLEMENTED in this port (`settings.ts`, `EntityInstance.equals()`) -- toggled
// `true` for the whole `executeRules` call and restored in a `finally` block below,
// exactly mirroring real Python's own shape. Confirmed (`settings.ts`'s own doc
// comments, `entityInstance.ts`'s `.equals()`) that `compareInstancesByValue` is
// consulted automatically by `EntityInstance.equals()`/`.notEquals()` -- a ported rule
// body must call `.equals()` (or `runtimeShim.ts`'s own `triEq`/`triNe`, which delegate
// to it) explicitly wherever real Python source uses `==`/`!=` on a value that might be
// an `EntityInstance`; TS has no operator overloading, so there is no automatic `===`
// equivalent (see `runtimeShim.ts`'s own new Tri-logic section for the full writeup).
//
// **Violation shape**: reuses `validate.ts`'s own `ValidationError` class (message +
// optional `attribute`) unchanged, per this chunk's own task brief ("structurally
// compatible... for eventual Phase EX-5 unification") -- `toViolation` below builds one
// from whatever plain `Error` a rule's own `check` function threw (see `ruleDispatch.ts`'s
// own `RuleDefinition.check` doc comment: every ported rule throws a hand-written,
// human-readable plain `Error`, not a `ValidationError` itself, keeping `whereRules/*.ts`
// files free of any dependency on `validate.ts`).
//
// **Real Python's own `RecursionError` vs. generic `Exception` distinction** (lines
// 131-144, 187-202, 263-278): a `RecursionError` is logged via `logger.info` (NOT
// treated as a violation -- it means the rule genuinely could not be evaluated, e.g. a
// pathological self-referential structure, not that it failed), while any other
// exception becomes a reported violation. This port's closest analog to an
// unbounded-recursion failure is a JS `RangeError` ("Maximum call stack size
// exceeded") -- caught and silently skipped (not reported as a violation) below,
// matching the `.info`-not-`.error` treatment; every other thrown value becomes a
// violation, matching Python's generic `except Exception`.
//
// **The `instance=inst` closure-capture quirk in real Python's own `check()` closure**
// (lines 220, 234): both recursive calls pass `instance=inst`, referencing `inst` from
// the ENCLOSING `for inst in f:` loop (line 236) -- NOT the `instance` PARAMETER of the
// currently-executing `check()` call. Investigated directly: this is unobservable in
// practice, not a bug worth preserving byte-for-byte. `check()`'s own recursion (into
// aggregate elements, or unwrapping a non-entity `entity_instance`) always completes
// synchronously within a single top-level `for inst in f:` iteration before the next
// iteration reassigns `inst` -- so at every point any nested `check()` call actually
// uses `inst`, it is already equal to whatever `instance` would have been forwarded
// as. `checkValue` below simply threads its own `instance` parameter through
// recursive calls normally, which is exactly what real Python's own accidental
// closure-capture already, unavoidably, computes -- a disclosed, behavior-neutral
// simplification, not a divergence.

import { AttributeCategory, EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import { settings } from "../settings";
import { directSubtypesOfTypeDeclarations, entityName } from "../util/schema";
import {
	type AttributeTypeLike,
	type ClassifiedAttributeType,
	ValidationError,
	classifyAny,
	declarationName,
	getEntityAttributes,
} from "../validate";
import { type RuleDefinition, getSchemaRules } from "./ruleDispatch";

// --- attribute-type classification: reuses `validate.ts`'s own already-exported
// `classifyAny`/`declarationName`/`AttributeTypeLike` (see that file's own header
// comment for why they're exported, not duplicated -- a `/code-review` finding on this
// chunk's own first draft, which HAD duplicated a byte-for-byte local copy of this
// ~70-line classification cascade; fixed to import instead). ---

/**
 * Python: `type_name(ty)` (`rule_executor.py` lines 168-177) -- returns the type-scope
 * WHERE-rule lookup key for a resolved attribute type, or `undefined` for a
 * `simple_type`/`aggregation_type` (real Python's own implicit `return None`, ported
 * via TS's own `undefined`). `named_type` unwraps recursively (real Python:
 * `type_name(ty.declared_type())`); every other resolvable kind (`entity`/
 * `type_declaration`/`select`/`enumeration`) returns its own bare declaration name
 * UNWRAPPED NO FURTHER -- deliberately NOT the same as `unwrapForCheck` below, which
 * unwraps `type_declaration` too (a `type_declaration`'s own NAME is exactly what a
 * `SCOPE = "type"` rule's `TYPE_NAME` is keyed by, e.g. `"IfcPositiveLengthMeasure"`;
 * unwrapping past it here would look up the wrong, more-primitive name instead).
 */
function typeName(node: AttributeTypeLike): string | undefined {
	const classified = classifyAny(node);
	switch (classified.kind) {
		case "named":
			return typeName(classified.node.declared_type());
		case "aggregation":
		case "simple":
			return undefined;
		case "typeDeclaration":
		case "select":
		case "enumeration":
			return declarationName(classified.node);
		case "entity":
			return entityName(classified.node);
	}
}

/**
 * Python: `while isinstance(type, (named_type, type_declaration)): type =
 * type.declared_type()` (`rule_executor.py` lines 207-214) -- unconditionally unwraps
 * BOTH `named_type` and `type_declaration` (unlike `validate.ts`'s own `unwrap`, which
 * only conditionally unwraps `type_declaration` -- a different real Python function,
 * `assert_valid`'s own lines 257-265, with its own different unwrap condition; NOT
 * reused here, this is `check()`'s own distinct unwrap rule).
 */
function unwrapForCheck(node: AttributeTypeLike): ClassifiedAttributeType {
	let classified = classifyAny(node);
	for (;;) {
		if (classified.kind === "named") {
			classified = classifyAny(classified.node.declared_type());
			continue;
		}
		if (classified.kind === "typeDeclaration") {
			classified = classifyAny(classified.node.declared_type());
			continue;
		}
		return classified;
	}
}

/**
 * Builds this file's own TS-native violation from a plain `Error` a rule's `check`
 * threw -- see this file's own header comment for why real Python's own
 * `reverse_compile`/`error` dataclass formatting is deliberately not ported. Format
 * chosen to be self-describing without either of those: which rule, on which instance
 * (when known), and the rule's own hand-written violation message.
 */
function toViolation(rule: RuleDefinition, error: unknown, instance?: EntityInstance): ValidationError {
	const message = error instanceof Error ? error.message : String(error);
	const ruleId = rule.typeName !== undefined ? `${rule.typeName}.${rule.ruleName}` : rule.ruleName;
	const instanceText = instance ? `On instance:\n    ${instance.toString()}\n` : "";
	// `attribute` is deliberately left `undefined`, NOT `rule.typeName` -- `/code-review`
	// found that an earlier version of this function passed `rule.typeName` (an
	// EXPRESS entity/type NAME, e.g. `"IfcWall"`) as `ValidationError.attribute`, but
	// every other producer of a `ValidationError` (`validate.ts`) populates that field
	// with an actual ATTRIBUTE name (`attr.name()`, or a re-thrown `e.attribute`) --
	// confirmed by reading every `new ValidationError(...)` call site in that file.
	// Passing a type/entity name there would be a real, disclosed shape mismatch a
	// future Phase EX-5 unification (this file's own header comment already flags that
	// goal) would have to specifically work around; leaving it `undefined` here is
	// honest about what this file doesn't have (no single "attribute" a whole-rule
	// violation is about) rather than overloading the field with the wrong kind of value.
	return new ValidationError(`${instanceText}Rule ${ruleId} violated:\n    ${message}`);
}

/**
 * Python: `except RecursionError as e: logger.info(str(e))` vs. `except Exception as e:
 * ...` (`rule_executor.py`, all 3 phases) -- see this file's own header comment for why
 * a JS `RangeError` (this platform's own unbounded-recursion failure mode) is treated
 * the same way: silently skipped, not reported as a violation.
 *
 * **`/code-review`-found bug, fixed here**: a bare `error instanceof RangeError` is
 * WRONG -- this codebase uses `RangeError` pervasively as its own general translation
 * of Python's `IndexError`/`ValueError`-style "out of range" conditions (confirmed by
 * grepping every `throw new RangeError(...)` site: `entityInstance.ts`'s own
 * `getByIndex` -- called directly by this file's own `checkValue`, line ~348 --
 * `api/material/removeListItem.ts`, `api/pset/editPset.ts`, `util/date.ts`,
 * `util/unit.ts`, all throw a genuine, unrelated `RangeError` for a real out-of-range
 * bug, NOT a stack overflow). A bare `instanceof` check would silently swallow any of
 * those as if they were "rule could not be evaluated, skip quietly" -- masking a real
 * bug (or a real WHERE-rule violation) with zero diagnostic trace. Real V8 stack
 * overflows are always the exact message `"Maximum call stack size exceeded"`
 * (confirmed against this project's own Node runtime, matching `util/element.ts`'s own
 * documented precedent for this exact error shape) -- checked explicitly below, so an
 * unrelated `RangeError` correctly falls through to `toViolation` instead.
 */
function isRecursionFailure(error: unknown): boolean {
	return error instanceof RangeError && /call stack/i.test(error.message);
}

/**
 * Python: `rule_executor.run(f, logger)` (`ifcopenshell/express/rule_executor.py`, 306
 * lines) -- see this file's own header comment for the full real-source mapping and
 * every deliberate omission. Runs every WHERE-rule registered (via `ruleDispatch.ts`'s
 * `registerSchemaRules`) for `f`'s own schema, in real Python's own 3-phase order
 * (file-scope, then type-scope, then entity-scope -- `rule_executor.py` lines 128, 146,
 * 259), and returns every violation found (never throws on a single rule's own
 * failure, matching real Python's own per-rule `try/except` isolation).
 */
export function executeRules(f: IfcFile): ValidationError[] {
	const violations: ValidationError[] = [];

	// Python: lines 90-97, 280-281 -- see this file's own header comment.
	const origUnpack = settings.unpackNonAggregateInverses;
	const origCompare = settings.compareInstancesByValue;
	settings.unpackNonAggregateInverses = true;
	settings.compareInstancesByValue = true;

	try {
		const schema = f.nativeFile.schema();
		const schemaIdentifier = schema.name();
		const rules = getSchemaRules(schemaIdentifier);

		// --- file-scope rules (Python: lines 128-144) ---
		for (const rule of rules) {
			if (rule.scope !== "file") continue;
			try {
				rule.check(f);
			} catch (error) {
				if (isRecursionFailure(error)) continue;
				violations.push(toViolation(rule, error));
			}
		}

		// --- type-scope rules (Python: lines 146-254) ---
		//
		// Python: `subtypes` map construction (lines 149-156) -- ported via
		// `util/schema.ts`'s `directSubtypesOfTypeDeclarations` (this chunk's own new,
		// analogous helper to that file's already-established `directSubtypesOf`).
		const typeSubtypes = directSubtypesOfTypeDeclarations(schema);

		// Python: `D = collections.defaultdict(list)` + `visit(nm)` closure (lines
		// 157-166) -- groups every type-scope rule under its own `TYPE_NAME` AND every
		// (recursively) known subtype name, so a rule declared for a supertype also
		// fires for its subtypes' own values.
		const typeRulesByName = new Map<string, RuleDefinition[]>();
		for (const rule of rules) {
			if (rule.scope !== "type") continue;
			const visited = new Set<string>();
			const visit = (name: string): void => {
				if (visited.has(name)) return; // defensive cycle guard; real Python has no equivalent, but no real schema is expected to cycle here either.
				visited.add(name);
				const existing = typeRulesByName.get(name);
				if (existing) {
					existing.push(rule);
				} else {
					typeRulesByName.set(name, [rule]);
				}
				for (const sub of typeSubtypes.get(name) ?? []) visit(sub);
			};
			// biome-ignore lint/style/noNonNullAssertion: a `SCOPE: "type"` `RuleDefinition` always carries a `typeName` (see `ruleDispatch.ts`'s own doc comment) -- only file-scope rules omit it.
			visit(rule.typeName!);
		}

		// Python: `check(value, type, instance)` closure (lines 179-234). Calls
		// `typeName(type)` then, separately, `unwrapForCheck(type)` below -- each its own
		// `classifyAny` dispatch over the same starting node. `/code-review` flagged this
		// as two classification passes where one might do; left as two, deliberately: real
		// Python's own `type_name(ty)` (lines 168-177) and the inline `while isinstance(type,
		// (named_type, type_declaration))` unwrap (lines 207-214) are ALSO two separate
		// walks with two distinct unwrap conditions (`type_name` never unwraps
		// `type_declaration`; this unwrap always does -- see `typeName`'s own doc comment) --
		// merging them here would diverge from that real two-pass structure for a perf gain
		// that's negligible at this chunk's own scale (single-digit classification calls per
		// attribute, not a hot inner loop over millions of values).
		const checkValue = (value: unknown, type: AttributeTypeLike, instance: EntityInstance): void => {
			if (value === null || value === undefined) return;

			const name = typeName(type);
			if (name !== undefined) {
				const matchingRules = typeRulesByName.get(name);
				if (matchingRules) {
					for (const rule of matchingRules) {
						try {
							rule.check(value);
						} catch (error) {
							if (isRecursionFailure(error)) continue;
							violations.push(toViolation(rule, error, instance));
						}
					}
				}
			}

			const unwrapped = unwrapForCheck(type);

			if (Array.isArray(value)) {
				if (unwrapped.kind === "aggregation") {
					const elementType = unwrapped.node.type_of_element();
					for (const element of value) checkValue(element, elementType, instance);
				}
				// Python: `else: pass` (line 223) -- "let's hope a schema validation error
				// was reported for this case".
				return;
			}

			if (value instanceof EntityInstance) {
				const valueDeclaration = schema.declaration_by_name_with_name(value.isA());
				const valueClassified = classifyAny(valueDeclaration);
				if (valueClassified.kind === "entity") {
					// Python: "top level entity instances will be checked on their own" (line 231) -- pass.
					return;
				}
				// Python: "unpack the type instance" (line 234).
				checkValue(value.getByIndex(0), valueDeclaration, instance);
			}
		};

		// Python: `for inst in f: ... for i, (attr, val, is_derived) in enumerate(zip(
		// attrs, values, entity.derived())): ...` (lines 236-254).
		for (const inst of f) {
			const entityDeclaration = inst.declaration().as_entity();
			if (entityDeclaration === null) continue; // every real file iteration yields entity-typed instances only; defensive, matches no real Python branch.
			const [, attrs] = getEntityAttributes(schema, inst.isA());

			let values: unknown[];
			try {
				values = attrs.map((_attr, index) => inst.getByIndex(index));
			} catch (error) {
				// Python: `except Exception as e: logger.error(...)` (lines 241-245) -- a
				// whole instance whose forward attributes can't even be read is reported
				// once, not per-attribute (real Python's own `list(inst)` read is a single
				// bulk operation with one try/except around the whole thing).
				if (!isRecursionFailure(error)) {
					violations.push(
						new ValidationError(
							`For instance:\n    ${inst.toString()}\n${error instanceof Error ? error.message : String(error)}`,
						),
					);
				}
				continue;
			}

			for (let i = 0; i < attrs.length; i++) {
				if (inst.attributeCategory(attrs[i].name()) === AttributeCategory.DERIVED) continue;
				checkValue(values[i], attrs[i].type_of_attribute(), inst);
			}
		}

		// --- entity-scope rules (Python: lines 259-278) ---
		//
		// Python: `for R in [...]: for inst in f.by_type(R.TYPE_NAME): ...` -- real
		// Python re-queries `f.by_type(...)` once per rule too, with no cache, so this
		// loop's overall SHAPE matches real Python's own exactly. `/code-review` flagged
		// the resulting repeated native `by_type` query (plus `EntityInstance` rewrap
		// per matching handle) as wasteful once multiple entity-scope rules share the
		// same `TYPE_NAME` -- expected to become common as the registry grows toward
		// ~1,830 rules across 3 schemas -- so instances are cached per `TYPE_NAME` here
		// (a real, if minor, deliberate improvement beyond a literal transliteration),
		// mirroring the type-scope loop's own `typeRulesByName` caching pattern above.
		const instancesByTypeName = new Map<string, EntityInstance[]>();
		for (const rule of rules) {
			if (rule.scope !== "entity") continue;
			// biome-ignore lint/style/noNonNullAssertion: a `SCOPE: "entity"` `RuleDefinition` always carries a `typeName`, same as the type-scope loop above.
			const ruleTypeName = rule.typeName!;
			let instances = instancesByTypeName.get(ruleTypeName);
			if (!instances) {
				instances = f.byType(ruleTypeName);
				instancesByTypeName.set(ruleTypeName, instances);
			}
			for (const inst of instances) {
				try {
					rule.check(inst);
				} catch (error) {
					if (isRecursionFailure(error)) continue;
					violations.push(toViolation(rule, error, inst));
				}
			}
		}
	} finally {
		settings.unpackNonAggregateInverses = origUnpack;
		settings.compareInstancesByValue = origCompare;
	}

	return violations;
}
