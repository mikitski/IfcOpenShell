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
import {
	aggregation_type as NativeAggregationType,
	declaration as NativeDeclaration,
	entity as NativeEntity,
	enumeration_type as NativeEnumerationType,
	named_type as NativeNamedType,
	parameter_type as NativeParameterType,
	select_type as NativeSelectType,
	simple_type as NativeSimpleType,
	type_declaration as NativeTypeDeclaration,
} from "../native/ifcopenshell_native";
import { settings } from "../settings";
import { directSubtypesOfTypeDeclarations, entityName } from "../util/schema";
import { ValidationError, getEntityAttributes } from "../validate";
import { type RuleDefinition, getSchemaRules } from "./ruleDispatch";

// --- attribute-type classification -- a small, local duplicate of `validate.ts`'s own
// `classifyAny`/`classifyParameterType`/`classifyDeclaration`/`declarationName`
// (module-private there, so not importable), following this port's established
// precedent (`runtimeShim.ts`'s own `entityDeclarationName`, `util/schema.ts`'s
// `entityName`, `util/element.ts`'s own copy) of duplicating a small reinterpret-cast
// helper locally rather than growing a new cross-module coupling for it. See
// `validate.ts`'s own header comment (finding 1) for the full, independently-verified
// justification of why this dispatch is needed at all (no SWIG-style dynamic
// downcasting on this port's native layer). ---

type AttributeTypeLike =
	| InstanceType<typeof NativeParameterType>
	| InstanceType<typeof NativeDeclaration>
	| InstanceType<typeof NativeSimpleType>
	| InstanceType<typeof NativeNamedType>
	| InstanceType<typeof NativeAggregationType>
	| InstanceType<typeof NativeTypeDeclaration>
	| InstanceType<typeof NativeSelectType>
	| InstanceType<typeof NativeEnumerationType>
	| InstanceType<typeof NativeEntity>;

type ClassifiedAttributeType =
	| { readonly kind: "simple"; readonly node: InstanceType<typeof NativeSimpleType> }
	| { readonly kind: "named"; readonly node: InstanceType<typeof NativeNamedType> }
	| { readonly kind: "aggregation"; readonly node: InstanceType<typeof NativeAggregationType> }
	| { readonly kind: "typeDeclaration"; readonly node: InstanceType<typeof NativeTypeDeclaration> }
	| { readonly kind: "select"; readonly node: InstanceType<typeof NativeSelectType> }
	| { readonly kind: "enumeration"; readonly node: InstanceType<typeof NativeEnumerationType> }
	| { readonly kind: "entity"; readonly node: InstanceType<typeof NativeEntity> };

function classifyDeclaration(decl: InstanceType<typeof NativeDeclaration>): ClassifiedAttributeType {
	const entity = decl.as_entity();
	if (entity !== null) return { kind: "entity", node: entity };
	const typeDeclaration = decl.as_type_declaration();
	if (typeDeclaration !== null) return { kind: "typeDeclaration", node: typeDeclaration };
	const select = decl.as_select_type();
	if (select !== null) return { kind: "select", node: select };
	const enumeration = decl.as_enumeration_type();
	if (enumeration !== null) return { kind: "enumeration", node: enumeration };
	throw new Error("ruleExecutor: declaration is none of entity/type_declaration/select_type/enumeration_type");
}

function classifyParameterType(pt: InstanceType<typeof NativeParameterType>): ClassifiedAttributeType {
	const simple = pt.as_simple_type();
	if (simple !== null) return { kind: "simple", node: simple };
	const named = pt.as_named_type();
	if (named !== null) return { kind: "named", node: named };
	const aggregation = pt.as_aggregation_type();
	if (aggregation !== null) return { kind: "aggregation", node: aggregation };
	throw new Error("ruleExecutor: parameter_type is none of simple_type/named_type/aggregation_type");
}

function classifyAny(node: AttributeTypeLike): ClassifiedAttributeType {
	if (node instanceof NativeSimpleType) return { kind: "simple", node };
	if (node instanceof NativeNamedType) return { kind: "named", node };
	if (node instanceof NativeAggregationType) return { kind: "aggregation", node };
	if (node instanceof NativeTypeDeclaration) return { kind: "typeDeclaration", node };
	if (node instanceof NativeSelectType) return { kind: "select", node };
	if (node instanceof NativeEnumerationType) return { kind: "enumeration", node };
	if (node instanceof NativeEntity) return { kind: "entity", node };
	if (node instanceof NativeDeclaration) return classifyDeclaration(node);
	if (node instanceof NativeParameterType) return classifyParameterType(node);
	throw new Error("ruleExecutor: unrecognized attribute-type node");
}

/**
 * `entity`/`select_type`/`type_declaration`/`enumeration_type` have no `.name()` of
 * their own on this port's generated facade -- see `validate.ts`'s own header comment
 * (finding 4) for the full, independently-verified justification (a safe pointer-
 * reinterpret: all four are real, single, non-virtual `: public declaration` C++
 * subclasses).
 */
function declarationName(node: { readonly _handle: unknown }): string {
	return new NativeDeclaration(node._handle).name();
}

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
	return new ValidationError(`${instanceText}Rule ${ruleId} violated:\n    ${message}`, rule.typeName);
}

/**
 * Python: `except RecursionError as e: logger.info(str(e))` vs. `except Exception as e:
 * ...` (`rule_executor.py`, all 3 phases) -- see this file's own header comment for why
 * a JS `RangeError` (this platform's own unbounded-recursion failure mode) is treated
 * the same way: silently skipped, not reported as a violation.
 */
function isRecursionFailure(error: unknown): boolean {
	return error instanceof RangeError;
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

		// Python: `check(value, type, instance)` closure (lines 179-234).
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
		for (const rule of rules) {
			if (rule.scope !== "entity") continue;
			// biome-ignore lint/style/noNonNullAssertion: a `SCOPE: "entity"` `RuleDefinition` always carries a `typeName`, same as the type-scope loop above.
			for (const inst of f.byType(rule.typeName!)) {
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
