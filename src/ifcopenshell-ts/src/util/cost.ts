// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/cost.py` (src/ifcopenshell-python, 441
// lines, ~19 functions + `class CostValueUnserialiser`) -- computing/aggregating
// `IfcCostSchedule`/`IfcCostItem`/`IfcCostValue` cost values, serialising/
// deserialising the `CostValue`/`AppliedValue` formula mini-language, and various
// cost-item/cost-schedule graph-traversal queries.
//
// Ported in full: `getPrimitiveAppliedValue`, `getTotalQuantity`,
// `calculateAppliedValue`, `sumChildRootElements`, `serialiseCostValue`/
// `serialiseCostValueInner` (Python's `_serialise_cost_value`)/`serialiseAppliedValue`,
// `getAssignedRateCostItem`, `unserialiseCostValue`/`CostValueUnserialiser`,
// `getCostItemsForProduct`, `getRootCostItems`, `getAllNestedCostItems`/
// `getNestedCostItems`, `getScheduleCostItems`, `getCostAssignmentsByType`,
// `getCostItemAssignments`, `getCostValues`, `getCostScheduleTypes`,
// `getProductQuantityNames`, `getCostSchedule`, `getCostRate`.
//
// *** The formula mini-language's grammar (Python's `CostValueUnserialiser.parse`
// embeds a `lark.Lark(...)` grammar literal) ***: hand-rolled below as a small
// recursive-descent parser (`CostValueUnserialiser` class, `parseFormula`/
// `parseOperand`/`tryConsumeNumber`/`consumeWord`), matching `selector.ts`'s
// established "no new npm dependency, the real grammar is small enough to hand-roll"
// precedent (this grammar is even smaller than any of `selector.ts`'s three: five
// EBNF productions plus four single-character operator literals):
//
//   formula: operand (operator operand)*
//   operand: value | category "(" formula ")"
//   value: NUMBER?
//   category: WORD?
//   operator: "+" | "/" | "*" | "-"
//
// (`WORD` = one-or-more ASCII letters, `NUMBER` = a plain unsigned int/decimal/
// exponent literal, `%ignore WS` between tokens -- reproduced faithfully from the
// embedded grammar text, `symbol_arithmetic_operators`/`arithmetic_operator_symbols`
// at the top of `cost.py` reused directly for the operator-symbol <-> `ArithmeticOperator`-
// name mapping). **Disclosed limitation**: this sandbox has no network access, so the
// real `lark` package could not be installed to empirically fuzz-test the hand-rolled
// parser against the genuine grammar (unlike, say, a native-primitive investigation,
// which this port always does against real source/binaries) -- correctness here rests
// on careful manual grammar-semantics tracing (documented per-branch below) plus this
// chunk's own round-trip tests (`serialiseCostValue` -> `unserialiseCostValue` ->
// re-`serialiseCostValue`, matching every shape `_serialise_cost_value` can actually
// produce), not an independent oracle. Two genuine, faithfully-*preserved* grammar
// quirks (not bugs in this port -- traced directly against Python's own
// `get_formula`/`get_operand` transform logic, not assumed):
//
// 1. **"Last operator wins" for a formula with 3+ operands.** `formula: operand
//    (operator operand)*` flattens every operand at one nesting level into a single
//    `Components` list, but `get_formula` OVERWRITES `results["ArithmeticOperator"]`
//    on every `operator` child it sees -- a formula mixing operators at the same level
//    (e.g. `"5+3-2"`, which `serialise_cost_value` itself never actually emits, since
//    every `_serialise_cost_value` call site only ever joins components with ONE
//    `cost_value.ArithmeticOperator`) ends up with `ArithmeticOperator` set to the
//    *last* operator seen (`"SUBTRACT"` for that example), silently discarding that the
//    first operand pair used `"+"`. Reproduced exactly (see `parseFormula` below); a
//    dedicated test in `test/util/cost.test.ts` exercises this directly, bug-compatible.
// 2. **Category-wrapping a category-only operand silently drops the inner category.**
//    `get_operand`'s category branch does `if formula.get("Components"): ... else:
//    data["AppliedValue"] = formula["AppliedValue"]` -- for a doubly-nested category
//    with no arithmetic in between (e.g. `"SUM(SUM(500))"`), the inner formula is
//    itself a singular category-operand (`{"Category": "*", "AppliedValue": 500.0}`,
//    no `"Components"` key), so the outer branch takes the `else` path and copies over
//    only `formula["AppliedValue"]`, silently discarding the inner `"Category"` key.
//    Reproduced exactly in `finishCategoryOperand` below (keyed off `.Components`
//    alone, matching Python's `formula.get("Components")` check byte-for-byte) --
//    not independently tested (`serialise_cost_value` never actually emits this shape
//    either, for the same "one `ArithmeticOperator` per `_serialise_cost_value` call"
//    reason as quirk 1 above; this is purely a parser-input edge case).
//
// *** Real, disclosed discrepancy vs. this chunk's own task brief: `unserialiseCostValue`
// does NOT mutate `costValue` ***. The brief asserted `unserialise_cost_value(formula,
// cost_value)` "mutates cost_value ... writes into a cost value entity", but reading
// the real Python source (`cost.py` lines 178-189) shows `unserialise_cost_value` is a
// PURE function: it parses `formula` into a nested dict and calls the internal
// `map_element_to_result` helper, which only reads `element.Components` (to positionally
// pair pre-existing `IfcCostValue` sub-entities with the parsed dict's own `Components`
// entries) and attaches each matched entity as `result["ifc"]`/nested `["ifc"]` keys --
// zero `.AppliedValue = ...`/`.Category = ...`/`.set(...)` calls anywhere in the
// function. The actual attribute-writing mutation this chunk's brief was describing
// lives in `ifcopenshell.api.cost.edit_cost_value_formula`'s `Usecase.edit_cost_value`
// (confirmed by reading `api/cost/edit_cost_value_formula.py` directly, grepped as
// `unserialise_cost_value`'s only other caller in the whole `ifcopenshell-python` tree)
// -- squarely `ifcopenshell.api` territory (Tier C, Phase 6+, not yet ported, matching
// every other `api.*` boundary this project has already drawn, e.g. `util/selector.ts`'s
// `set_element_value` exclusion). `unserialiseCostValue` below is ported faithfully as
// the pure parser/mapper it actually is; no mutation logic was invented to satisfy the
// brief's (incorrect) premise. `test/util/cost.test.ts` still includes a real
// Transaction/undo-redo regression test covering the realistic end-to-end workflow
// (parse a formula, then apply the parsed result onto real `IfcCostValue` entities via
// the *existing* `EntityInstance.set()`/`IfcFile.createEntity()` -- exactly mirroring
// `edit_cost_value_formula`'s own `Usecase.edit_cost_value` logic, reproduced in the
// test file only as test-glue, not exported from this module) inside a transaction,
// proving that workflow's mutations undo/redo correctly -- satisfying the brief's
// underlying intent (real mutation + undo/redo coverage for this module's formula
// round-trip) without fabricating a mutating function this module's real Python
// source doesn't have.
//
// *** Real, disclosed primitive-layer-adjacent workaround: `getCostScheduleTypes` ***.
// Python's `get_cost_schedule_types` calls `ifcopenshell.util.attribute.get_enum_items
// (attribute)` on `IfcCostSchedule`'s `PredefinedType` attribute. `util/attribute.ts`'s
// `getEnumItems` is a real, already-disclosed primitive-layer gap that ALWAYS throws --
// `enumeration_type::enumeration_items()` (the C++ forward index -> name accessor) has
// NO N-API binding at all (confirmed against both the TS `enumeration_type` class and
// the generated C API header: only `lookup_enum_offset` (a *reverse* name -> index
// lookup) is bound), so there is no way to recover the actual list of enum item names
// straight from the loaded schema. This chunk substitutes the bundled doc-JSON's own
// per-entity `predefinedTypes` name -> description map instead (`util/doc.ts`'s
// `getDb(version).entities["IfcCostSchedule"].predefinedTypes`, the exact same bundled
// data `getPredefinedTypeDoc` below already reads for the description half of Python's
// own `get_predefined_type_doc(version, "IfcCostSchedule", enumeration)` call) --
// **verified empirically, not assumed, to be the exact same name set as the real
// schema enum**: cross-checked `data/doc/ifc4_entities.json`'s `IfcCostSchedule
// .predefined_types` keys (9 names: `BUDGET`/`COSTPLAN`/`ESTIMATE`/`NOTDEFINED`/
// `PRICEDBILLOFQUANTITIES`/`SCHEDULEOFRATES`/`TENDER`/`UNPRICEDBILLOFQUANTITIES`/
// `USERDEFINED`) directly against `src/ifcparse/schemas/Ifc4-schema.cpp`'s own
// generated `IfcCostScheduleTypeEnum` `enumeration_type` literal-string construction
// (`new enumeration_type(strings[297], 219, {strings[298..304], strings[8]
// /*USERDEFINED*/, strings[9] /*NOTDEFINED*/})`) -- an exact match, same 9 names. This
// reuses this project's own established "bundled generated-doc JSON substitutes for a
// missing native forward-enumeration primitive" pattern (`util/doc.ts`/`util/type.ts`/
// `util/pset.ts`'s own header comments), not a new kind of workaround.
//
// *** Two smaller, disclosed, faithfully-preserved Python-source quirks (not primitive
// gaps -- pure upstream-source-level findings, verified by reading the real source, not
// "fixed" here per this project's near-verbatim-port mandate) ***:
//
// 1. `getPrimitiveAppliedValue`'s `IfcMeasureWithUnit` branch returns
//    `appliedValue.get("ValueComponent")` with NO further unwrap -- Python's own source
//    (`return applied_value.ValueComponent`) does the exact same thing, with no
//    `.wrappedValue` call, even though `ValueComponent` is itself an `IfcValue`-SELECT-
//    typed attribute needing exactly that unwrap to become a real number (confirmed:
//    `util/unit.py`'s own equivalent read of the *identical* attribute, line 720, DOES
//    call `.wrappedValue`: `conversion_factor.ValueComponent.wrappedValue`). This looks
//    like a genuine, isolated upstream inconsistency in `cost.py` -- reproduced
//    byte-for-byte (not "corrected" to call `.getByIndex(0)`/`wrappedValueOf` like
//    `sumChildRootElements`'s own `UnitBasis.ValueComponent.wrappedValue` read below
//    correctly does), since this port's mandate is faithful translation, not silently
//    patching upstream Python bugs it happens to notice.
// 2. `serialiseAppliedValue`'s `String(appliedValue.getByIndex(0))` vs. Python's
//    `str(applied_value.wrappedValue)`: a whole-number `IfcMonetaryMeasure` (e.g.
//    `5000.0`) renders as `"5000"` here vs. Python's `"5000.0"` -- the same already-
//    tracked JS/Python `int`-vs-`float`-`str()`-rendering divergence `TODOS.md`'s
//    "`EntityInstance.getByIndex`/`wrapValue` collapse EXPRESS INTEGER vs. REAL into one
//    JS `number`" entry documents (also independently re-found and disclosed by
//    `util/selector.ts`'s own `pyStr`/`number()` finding #2) -- cross-referenced there,
//    not filed as a new entry, since it's the same root cause. Cosmetic only: this
//    port's own hand-rolled `NUMBER` grammar re-parses `"5000"` fine (plain `INT`), so
//    `serialiseCostValue` -> `unserialiseCostValue` round-trips to the identical numeric
//    value regardless -- only the exact serialised *string* differs from what real
//    Python would produce for a whole-number applied value.

import type { EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import { getDb, getPredefinedTypeDoc, getSchemaByName } from "./doc";
import { getComponents, getPsets } from "./element";
import { getUnitSymbol } from "./unit";

/** Python: `arithmetic_operator_symbols`. */
const arithmeticOperatorSymbols: Record<string, string> = {
	ADD: "+",
	DIVIDE: "/",
	MULTIPLY: "*",
	SUBTRACT: "-",
};

/** Python: `symbol_arithmetic_operators`. */
const symbolArithmeticOperators: Record<string, string> = {
	"+": "ADD",
	"/": "DIVIDE",
	"*": "MULTIPLY",
	"-": "SUBTRACT",
};

/** Python: `FILTER_BY_TYPE = Literal["PRODUCT", "RESOURCE", "PROCESS"]`. */
export type FilterByType = "PRODUCT" | "RESOURCE" | "PROCESS";

/**
 * The parsed-formula shape `CostValueUnserialiser`/`unserialiseCostValue` build and
 * return -- Python's own dict is untyped (`dict[str, Any]`), built up with different
 * subsets of these same four keys depending on which grammar branch matched (see this
 * file's header comment / `CostValueUnserialiser`'s own doc comments for exactly which
 * keys each branch populates), plus the optional `ifc` key `unserialiseCostValue`'s
 * `mapElementToResult` step attaches afterward.
 */
export interface CostValueFormula {
	AppliedValue?: number | null;
	Category?: string;
	ArithmeticOperator?: string;
	Components?: CostValueFormula[];
	/** Attached by `unserialiseCostValue`'s `mapElementToResult`, not by the parser itself. */
	ifc?: EntityInstance;
}

// --- internal helpers (not exported -- pure translation aids, no Python counterpart,
// matching `util/element.ts`/`util/system.ts`'s own established local-helper
// precedent) ---

/** Python's `x or []` idiom for a possibly-`null` array attribute. */
function attrList(element: EntityInstance, name: string): EntityInstance[] {
	return (element.get(name) as EntityInstance[] | null) ?? [];
}

/**
 * Python's `x.wrappedValue` for a defined-type-wrapped scalar -- see
 * `util/geolocation.ts`'s/`util/element.ts`'s own identical helper's doc comment for
 * why this goes through `.getByIndex(0)` (a standalone declared-type instance stores
 * its single value at attribute index 0) rather than `.get("wrappedValue")` (the N-API
 * attribute-value shim doesn't support that pseudo-attribute name).
 */
function wrappedValueOf(value: unknown): unknown {
	return value !== null && typeof value === "object" && "getByIndex" in value
		? (value as EntityInstance).getByIndex(0)
		: value;
}

// --- value/quantity computation ---

/** Python: `get_primitive_applied_value(applied_value) -> float`. */
export function getPrimitiveAppliedValue(appliedValue: EntityInstance | number | null | undefined): number {
	if (!appliedValue) return 0.0;
	if (typeof appliedValue === "number") return appliedValue;
	if (!appliedValue.isEntity()) {
		// A simple/defined-type instance (e.g. a standalone `IfcMonetaryMeasure`) --
		// Python's `hasattr(applied_value, "wrappedValue") and isinstance(applied_value
		// .wrappedValue, float)`.
		const wrapped = appliedValue.getByIndex(0);
		if (typeof wrapped === "number") return wrapped;
	}
	if (appliedValue.isA("IfcMeasureWithUnit")) {
		// See this file's header comment, disclosed quirk 1: Python doesn't unwrap
		// `.wrappedValue` here either -- reproduced faithfully, not "fixed".
		return appliedValue.get("ValueComponent") as number;
	}
	throw new Error(`Applied value ${String(appliedValue)} not implemented`);
}

/** Python: `get_total_quantity(root_element) -> Union[float, None]`. */
export function getTotalQuantity(rootElement: EntityInstance): number | null {
	if (rootElement.isA("IfcCostItem")) {
		// Different output for no quantities and zero quantities, as they have
		// different meaning in IFC.
		const quantities = attrList(rootElement, "CostQuantities");
		if (quantities.length === 0) return null;
		return quantities.reduce((sum, q) => sum + (q.getByIndex(3) as number), 0);
	}
	if (rootElement.isA("IfcConstructionResource")) {
		const quantity = rootElement.get("BaseQuantity") as EntityInstance | null;
		return quantity ? (quantity.getByIndex(3) as number) : 1.0;
	}
	return null;
}

/** Python: `calculate_applied_value(root_element, cost_value, category_filter=None) -> float`. */
export function calculateAppliedValue(
	rootElement: EntityInstance,
	costValue: EntityInstance,
	categoryFilter?: string | null,
): number {
	const arithmeticOperator = costValue.get("ArithmeticOperator") as string | null;
	const components = attrList(costValue, "Components");
	if (arithmeticOperator && components.length > 0) {
		const componentValues = components.map((component) =>
			calculateAppliedValue(rootElement, component, categoryFilter),
		);
		if (arithmeticOperator === "ADD") {
			return componentValues.reduce((a, b) => a + b, 0);
		}
		let result = componentValues.shift() as number;
		if (arithmeticOperator === "DIVIDE") {
			for (const value of componentValues) {
				// Python: `try: result /= value; except ZeroDivisionError: pass` -- JS
				// division by zero produces Infinity/-Infinity/NaN instead of throwing,
				// so this explicitly skips the division (leaving `result` unchanged) to
				// match Python's actual behavior, rather than silently propagating a
				// non-finite value.
				if (value === 0) continue;
				result /= value;
			}
		} else if (arithmeticOperator === "MULTIPLY") {
			for (const value of componentValues) result *= value;
		} else if (arithmeticOperator === "SUBTRACT") {
			for (const value of componentValues) result -= value;
		}
		return result;
	}
	const category = costValue.get("Category") as string | null;
	if (category === null) {
		return getPrimitiveAppliedValue(costValue.get("AppliedValue") as EntityInstance | number | null);
	}
	const isNestedBy = attrList(rootElement, "IsNestedBy");
	if (category === "*") {
		return isNestedBy.length > 0
			? sumChildRootElements(rootElement)
			: getPrimitiveAppliedValue(costValue.get("AppliedValue") as EntityInstance | number | null);
	}
	if (category) {
		return isNestedBy.length > 0
			? sumChildRootElements(rootElement, category)
			: getPrimitiveAppliedValue(costValue.get("AppliedValue") as EntityInstance | number | null);
	}
	// `category` is a falsy-but-not-null string (i.e. `""`) -- matches Python's own
	// `elif cost_value.Category:` falling through to the trailing `return 0.0` for
	// exactly this case (an empty-but-set `Category` string).
	return 0.0;
}

/** Python: `sum_child_root_elements(root_element, category_filter=None) -> float`. */
export function sumChildRootElements(rootElement: EntityInstance, categoryFilter?: string | null): number {
	let result = 0.0;
	for (const rel of attrList(rootElement, "IsNestedBy")) {
		for (const childRootElement of attrList(rel, "RelatedObjects")) {
			const assignedRate = getAssignedRateCostItem(childRootElement);
			const newChildRootElement = assignedRate ?? childRootElement;
			let values: EntityInstance[];
			if (rootElement.isA("IfcCostItem")) {
				values = attrList(newChildRootElement, "CostValues");
			} else if (rootElement.isA("IfcConstructionResource")) {
				values = attrList(childRootElement, "BaseCosts");
			} else {
				throw new Error(`Assertion failed: unexpected root element type '${rootElement.isA()}'`);
			}
			for (const childCostValue of values) {
				if (categoryFilter && (childCostValue.get("Category") as string | null) !== categoryFilter) continue;
				const childAppliedValue = calculateAppliedValue(newChildRootElement, childCostValue);
				const rawQuantity = getTotalQuantity(childRootElement);
				const childQuantity = rawQuantity === null ? 1.0 : rawQuantity;
				const unitBasis = childCostValue.get("UnitBasis") as EntityInstance | null;
				if (unitBasis) {
					const valueComponent = wrappedValueOf(unitBasis.get("ValueComponent")) as number;
					result += (childQuantity / valueComponent) * childAppliedValue;
				} else {
					result += childQuantity * childAppliedValue;
				}
			}
		}
	}
	return result;
}

// --- serialisation ---

/** Python: `serialise_cost_value(cost_value) -> str`. */
export function serialiseCostValue(costValue: EntityInstance): string {
	const result = serialiseCostValueInner(costValue);
	if (result && result[0] === "(" && result[result.length - 1] === ")") {
		return result.slice(1, -1);
	}
	return result;
}

/**
 * Python: `get_assigned_rate_cost_item(cost_item) -> entity_instance`. Python's own
 * comment: "same as in tool. Maybe just create one?" -- kept verbatim below.
 */
export function getAssignedRateCostItem(costItem: EntityInstance): EntityInstance | null {
	// same as in tool. Maybe just create one?
	for (const assignment of attrList(costItem, "HasAssignments")) {
		const relatingControl = assignment.get("RelatingControl") as EntityInstance | null;
		if (relatingControl?.isA() === "IfcCostItem") return relatingControl;
	}
	return null;
}

/** Python: `_serialise_cost_value(cost_value) -> str`. */
export function serialiseCostValueInner(costValue: EntityInstance): string {
	let value = "";
	const arithmeticOperator = costValue.get("ArithmeticOperator") as string | null;
	const components = attrList(costValue, "Components");
	if (arithmeticOperator && components.length > 0) {
		const operator = arithmeticOperatorSymbols[arithmeticOperator];
		value = components.map((component) => serialiseCostValueInner(component)).join(operator);
	} else {
		const appliedValue = costValue.get("AppliedValue") as EntityInstance | number | null;
		if (appliedValue !== null && appliedValue !== undefined) {
			value = serialiseAppliedValue(appliedValue as EntityInstance);
		}
	}

	let category = "";
	const rawCategory = costValue.get("Category") as string | null;
	if (rawCategory === "*") {
		category = "SUM";
	} else if (rawCategory) {
		category = rawCategory;
	}

	if (!category && !value) value = "0";

	if (category) return `${category}(${value})`;
	if (components.length > 0) return `(${value})`;
	return value;
}

/** Python: `serialise_applied_value(applied_value) -> str`. */
export function serialiseAppliedValue(appliedValue: EntityInstance): string {
	if (appliedValue.isA("IfcMonetaryMeasure")) {
		// See this file's header comment, disclosed quirk 2, for the JS/Python
		// whole-number-`str()`-rendering divergence this `String(...)` call carries.
		return String(appliedValue.getByIndex(0));
	}
	return "?";
}

// --- formula-language parser (unserialise) ---

/**
 * Hand-rolled recursive-descent port of `class CostValueUnserialiser`'s embedded lark
 * grammar -- see this file's header comment for the grammar text and the two
 * faithfully-preserved quirks found while tracing it. One instance's `parse()` is not
 * safe to call re-entrantly (`pos`/`input` are shared mutable scan state), matching
 * `selector.ts`'s own hand-rolled parsers' single-pass-per-call shape.
 */
export class CostValueUnserialiser {
	private input = "";
	private pos = 0;

	/** Python: `CostValueUnserialiser.parse(formula) -> dict`. */
	parse(formula: string): CostValueFormula {
		this.input = formula;
		this.pos = 0;
		const result = this.parseFormula();
		this.skipWs();
		if (this.pos < this.input.length) {
			// Python's `lark.Lark(...).parse(formula)` would raise a
			// `lark.exceptions.UnexpectedInput` for trailing input that doesn't fit the
			// grammar. This port doesn't attempt to replicate lark's exact exception
			// type/message -- `unserialise_cost_value`'s one real caller
			// (`ifcopenshell.api.cost.edit_cost_value_formula`'s `Usecase.execute`)
			// already wraps the whole parse in a bare `try/except`, so only "throws
			// something descriptive for malformed input" matters here.
			throw new Error(`unserialise_cost_value: unexpected input at position ${this.pos} in ${JSON.stringify(formula)}`);
		}
		return result;
	}

	/**
	 * `formula: operand (operator operand)*`. Python's `get_formula`: a single-operand
	 * formula returns that operand's own dict directly (not wrapped); 2+ operands build
	 * `{"Components": [...], "ArithmeticOperator": ...}` -- see this file's header
	 * comment, quirk 1, for the "last operator wins" behavior this reproduces exactly
	 * (`arithmeticOperator` is reassigned, never accumulated, on every operator seen).
	 */
	private parseFormula(): CostValueFormula {
		const operands: CostValueFormula[] = [this.parseOperand()];
		let arithmeticOperator: string | undefined;
		for (;;) {
			const operator = this.tryConsumeOperator();
			if (operator === null) break;
			arithmeticOperator = operator;
			operands.push(this.parseOperand());
		}
		if (operands.length === 1) return operands[0];
		return { Components: operands, ArithmeticOperator: arithmeticOperator };
	}

	/**
	 * `operand: value | category "(" formula ")"`. Disambiguated the same way lark's
	 * grammar structurally forces: a leading ASCII letter starts a `category` name
	 * (which must then be followed by `"("`); a leading `"("` directly is the same
	 * `category "(" formula ")"` production with an empty (zero-length) `category`
	 * match (`category: WORD?`, i.e. optional) -- this is exactly how a plain
	 * parenthesised sub-formula with no leading category name (e.g. `"(5+3)"`, what
	 * `_serialise_cost_value` emits for an uncategorised `Components` group) parses.
	 * Anything else (a digit, `"."`, or immediately an operator/`")"`/end-of-input)
	 * is the `value` production (`value: NUMBER?`, also optional -- an operand with no
	 * digits at all yields `AppliedValue: null`, matching Python's `float(value) if
	 * value else None`).
	 */
	private parseOperand(): CostValueFormula {
		this.skipWs();
		const c = this.input[this.pos];
		if (c !== undefined && /[A-Za-z]/.test(c)) {
			const category = this.consumeWord();
			return this.finishCategoryOperand(category);
		}
		if (c === "(") {
			return this.finishCategoryOperand(undefined);
		}
		const numberValue = this.tryConsumeNumber();
		return { AppliedValue: numberValue };
	}

	/**
	 * The shared `"(" formula ")"` tail of the `operand: category "(" formula ")"`
	 * production, given the already-consumed (possibly empty/`undefined`) category
	 * name. Python's `get_operand`'s category branch.
	 */
	private finishCategoryOperand(categoryRaw: string | undefined): CostValueFormula {
		this.skipWs();
		if (this.input[this.pos] !== "(") {
			throw new Error(`unserialise_cost_value: expected "(" at position ${this.pos} in ${JSON.stringify(this.input)}`);
		}
		this.pos++;
		const inner = this.parseFormula();
		this.skipWs();
		if (this.input[this.pos] !== ")") {
			throw new Error(`unserialise_cost_value: expected ")" at position ${this.pos} in ${JSON.stringify(this.input)}`);
		}
		this.pos++;

		const data: CostValueFormula = {};
		if (categoryRaw) {
			data.Category = categoryRaw.toLowerCase() === "sum" ? "*" : categoryRaw;
		}
		// See this file's header comment, quirk 2: only `inner.Components` is checked
		// here (matching Python's `formula.get("Components")` exactly) -- a doubly-
		// nested category-only `inner` (itself `{Category, AppliedValue}`, no
		// `Components` key) silently loses its own `Category` in the `else` branch
		// below, faithfully.
		if (inner.Components) {
			data.Components = inner.Components;
			data.ArithmeticOperator = inner.ArithmeticOperator;
		} else {
			data.AppliedValue = inner.AppliedValue ?? null;
		}
		return data;
	}

	private tryConsumeOperator(): string | null {
		this.skipWs();
		const c = this.input[this.pos];
		if (c === "+" || c === "-" || c === "*" || c === "/") {
			this.pos++;
			return symbolArithmeticOperators[c];
		}
		return null;
	}

	private consumeWord(): string {
		const start = this.pos;
		while (this.pos < this.input.length && /[A-Za-z]/.test(this.input[this.pos])) this.pos++;
		return this.input.slice(start, this.pos);
	}

	/**
	 * `NUMBER: FLOAT | INT` (embedded `common.lark` terminals, reproduced from the
	 * grammar text): `INT` (`DIGIT+`), `DECIMAL` (`INT "." INT? | "." INT`), an
	 * optional `("e"|"E") ["+"|"-"] INT` exponent suffix on either. Returns `null`
	 * (Python: `None`) when no digits match at all -- `value: NUMBER?` is optional.
	 */
	private tryConsumeNumber(): number | null {
		const isDigit = (ch: string | undefined) => ch !== undefined && ch >= "0" && ch <= "9";
		const start = this.pos;
		let i = this.pos;
		let sawIntDigits = false;
		while (isDigit(this.input[i])) {
			i++;
			sawIntDigits = true;
		}
		let sawDecimal = false;
		if (this.input[i] === ".") {
			const dotPos = i;
			i++;
			let sawFracDigits = false;
			while (isDigit(this.input[i])) {
				i++;
				sawFracDigits = true;
			}
			if (sawIntDigits || sawFracDigits) {
				sawDecimal = true;
			} else {
				i = dotPos; // Lone "." with no digits on either side -- not a NUMBER at all.
			}
		}
		if (!sawIntDigits && !sawDecimal) {
			this.pos = start;
			return null;
		}
		if (this.input[i] === "e" || this.input[i] === "E") {
			let j = i + 1;
			if (this.input[j] === "+" || this.input[j] === "-") j++;
			const expDigitsStart = j;
			while (isDigit(this.input[j])) j++;
			if (j > expDigitsStart) i = j; // Only consume the exponent if it has digits.
		}
		const text = this.input.slice(start, i);
		this.pos = i;
		return Number(text);
	}

	private skipWs(): void {
		while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) this.pos++;
	}
}

/**
 * Python: `unserialise_cost_value(formula, cost_value) -> dict[str, Any]`. See this
 * file's header comment for the disclosed finding that this function is a PURE
 * parser/mapper -- it does NOT mutate `costValue` (contrary to this chunk's own task
 * brief's premise, corrected after reading the real source).
 */
export function unserialiseCostValue(formula: string, costValue: EntityInstance): CostValueFormula {
	const unserialiser = new CostValueUnserialiser();
	const result = unserialiser.parse(formula);
	mapElementToResult(costValue, result);
	return result;
}

/** Python: the nested `map_element_to_result` closure inside `unserialise_cost_value`. */
function mapElementToResult(element: EntityInstance, result: CostValueFormula): void {
	result.ifc = element;
	const components = result.Components ?? [];
	const elementComponents = attrList(element, "Components");
	for (let i = 0; i < components.length; i++) {
		if (elementComponents.length > 0 && i < elementComponents.length) {
			mapElementToResult(elementComponents[i], components[i]);
		}
	}
}

// --- cost-item / cost-schedule graph queries ---

/** Python: `get_cost_items_for_product(product) -> list[entity_instance]`. */
export function getCostItemsForProduct(product: EntityInstance): EntityInstance[] {
	const costItems: EntityInstance[] = [];
	for (const assignment of attrList(product, "HasAssignments")) {
		if (assignment.isA("IfcRelAssignsToControl")) {
			const control = assignment.get("RelatingControl") as EntityInstance | null;
			if (control?.isA("IfcCostItem")) costItems.push(control);
		}
	}
	return costItems;
}

/** Python: `get_root_cost_items(cost_schedule) -> list[entity_instance]`. */
export function getRootCostItems(costSchedule: EntityInstance): EntityInstance[] {
	const results: EntityInstance[] = [];
	for (const rel of attrList(costSchedule, "Controls")) {
		for (const relatedObject of attrList(rel, "RelatedObjects")) {
			if (relatedObject.isA("IfcCostItem")) results.push(relatedObject);
		}
	}
	return results;
}

/** Python: `get_all_nested_cost_items(cost_item) -> Generator[entity_instance]`. */
export function* getAllNestedCostItems(costItem: EntityInstance): Generator<EntityInstance> {
	for (const nested of getNestedCostItems(costItem)) {
		yield nested;
		yield* getAllNestedCostItems(nested);
	}
}

/** Python: `get_nested_cost_items(cost_item, is_deep=False) -> list[entity_instance]`. */
export function getNestedCostItems(costItem: EntityInstance, isDeep = false): EntityInstance[] {
	if (isDeep) return Array.from(getAllNestedCostItems(costItem));
	return getComponents(costItem);
}

/**
 * Python: `get_schedule_cost_items(cost_schedule) -> Generator[entity_instance]`. Get
 * all cost schedule cost items, including the nested ones.
 */
export function* getScheduleCostItems(costSchedule: EntityInstance): Generator<EntityInstance> {
	for (const costItem of getRootCostItems(costSchedule)) {
		yield costItem;
		yield* getAllNestedCostItems(costItem);
	}
}

/**
 * Python: `get_cost_assignments_by_type(cost_item, filter_by_type=None) -> list[entity_instance]`.
 *
 * `filter_by_type` only remaps the three `FILTER_BY_TYPE` literal values
 * (`"PRODUCT"`/`"RESOURCE"`/`"PROCESS"`) to a real IFC class name -- Python's own type
 * hint restricts the *declared* parameter type to just those three, but doesn't
 * enforce it at runtime (a plain `str` parameter), so any OTHER non-`None` value is
 * used AS-IS, directly, as the `is_a(filter_by_type)` class-name filter. `filterByType`
 * here is equally just a compile-time-only type restriction (TS has no runtime enum
 * enforcement either) -- a caller that bypasses it (plain JS, or a dynamically built
 * string) must see the same fallthrough-to-literal behavior Python has, not silently
 * "no filter" (`/code-review`-found bug in an earlier version of this function: falling
 * through left `ifcClassFilter` at its initial `null`, which `!ifcClassFilter` then
 * treated as "unfiltered", the exact opposite of Python's near-total narrowing for an
 * unrecognised filter value).
 */
export function getCostAssignmentsByType(
	costItem: EntityInstance,
	filterByType?: FilterByType | string | null,
): EntityInstance[] {
	let ifcClassFilter: string | null = null;
	if (filterByType != null) {
		if (filterByType === "PRODUCT") ifcClassFilter = "IfcElement";
		else if (filterByType === "RESOURCE") ifcClassFilter = "IfcResource";
		else if (filterByType === "PROCESS") ifcClassFilter = "IfcProcess";
		else ifcClassFilter = filterByType;
	}
	const results: EntityInstance[] = [];
	for (const rel of attrList(costItem, "Controls")) {
		for (const relatedObject of attrList(rel, "RelatedObjects")) {
			if (!ifcClassFilter || relatedObject.isA(ifcClassFilter)) results.push(relatedObject);
		}
	}
	return results;
}

/**
 * Python: `get_cost_item_assignments(cost_item, filter_by_type=None, is_deep=False)
 * -> list[entity_instance]`.
 */
export function getCostItemAssignments(
	costItem: EntityInstance,
	filterByType?: FilterByType | string | null,
	isDeep = false,
): EntityInstance[] {
	if (!isDeep) return getCostAssignmentsByType(costItem, filterByType);
	const currentAssignments = getCostAssignmentsByType(costItem, filterByType);
	const nestedAssignments: EntityInstance[] = [];
	for (const nestedCostItem of getAllNestedCostItems(costItem)) {
		nestedAssignments.push(...getCostAssignmentsByType(nestedCostItem, filterByType));
	}
	return [...currentAssignments, ...nestedAssignments];
}

/** Python: the `unit_data` sub-dict `get_cost_values` builds per cost value. */
export interface CostValueUnitData {
	valueComponent: number | null;
	unitComponent: number | null;
	unitSymbol: string;
}

/** Python: one row of `get_cost_values`'s returned `list[dict[str, str]]`. */
export interface CostValueInfo {
	id: number;
	label: string;
	name: string | null;
	category: string | null;
	appliedValue: number | null;
	unitData: CostValueUnitData;
}

/** Python: `get_cost_values(cost_item) -> list[dict[str, str]]`. */
export function getCostValues(costItem: EntityInstance): CostValueInfo[] {
	const results: CostValueInfo[] = [];
	for (const costValue of attrList(costItem, "CostValues")) {
		const label = `${calculateAppliedValue(costItem, costValue).toFixed(2)} = ${serialiseCostValue(costValue)}`;
		const unitData: CostValueUnitData = { valueComponent: null, unitComponent: null, unitSymbol: "" };
		const unitBasis = costValue.get("UnitBasis") as EntityInstance | null;
		if (unitBasis) {
			const info = unitBasis.getInfo();
			unitData.valueComponent = wrappedValueOf(info.ValueComponent) as number;
			unitData.unitComponent = (info.UnitComponent as EntityInstance).id();
			unitData.unitSymbol = getUnitSymbol(unitBasis.get("UnitComponent") as EntityInstance);
		}
		const appliedValueRaw = costValue.get("AppliedValue") as EntityInstance | number | null;
		results.push({
			id: costValue.id(),
			label,
			name: costValue.get("Name") as string | null,
			category: costValue.get("Category") as string | null,
			appliedValue: appliedValueRaw ? getPrimitiveAppliedValue(appliedValueRaw) : null,
			unitData,
		});
	}
	return results;
}

/** Python: one entry of `get_cost_schedule_types`'s returned `list[dict[str, str]]`. */
export interface CostScheduleTypeInfo {
	name: string;
	description: string | undefined;
}

/**
 * Python: `get_cost_schedule_types(file) -> list[dict[str, str]]`. See this file's
 * header comment for the disclosed `getEnumItems`-gap workaround this substitutes
 * (the bundled doc-JSON's own `predefinedTypes` map, verified equivalent to the real
 * schema enum).
 */
export function getCostScheduleTypes(file: IfcFile): CostScheduleTypeInfo[] {
	const version = file.schemaIdentifier;
	const schema = getSchemaByName(version);
	const results: CostScheduleTypeInfo[] = [];
	const declaration = schema.declaration_by_name_with_name("IfcCostSchedule").as_entity();
	if (!declaration) {
		throw new Error("getCostScheduleTypes: 'IfcCostSchedule' is not declared in this schema");
	}
	for (const attribute of declaration.attributes()) {
		if (attribute.name() === "PredefinedType") {
			const predefinedTypes = getDb(version)?.entities.IfcCostSchedule?.predefinedTypes ?? {};
			for (const enumeration of Object.keys(predefinedTypes)) {
				results.push({
					name: enumeration,
					description: getPredefinedTypeDoc(version, "IfcCostSchedule", enumeration),
				});
			}
			break;
		}
	}
	return results;
}

/** Python: `get_product_quantity_names(elements) -> list[str]`. */
export function getProductQuantityNames(elements: readonly EntityInstance[] | null | undefined): string[] {
	// Built as a plain array of per-element candidate-name sets, then intersected
	// afterward in a second pass -- functionally identical to Python's single-pass
	// `names = names.intersection(potential_names) if names else potential_names`, just
	// restructured to avoid a TS compiler quirk where reassigning a nullable `Set<T>`
	// across loop iterations (combined with a spread + `.filter()` on the right-hand
	// side) makes the compiler misinfer the `.filter()` callback's parameter as `never`.
	const perElementNames: Set<string>[] = [];
	for (const element of elements ?? []) {
		const potentialNames = new Set<string>();
		const qtos = getPsets(element, false, true);
		for (const quantities of Object.values(qtos)) {
			for (const key of Object.keys(quantities)) potentialNames.add(key);
		}
		perElementNames.push(potentialNames);
	}
	let names: Set<string> = perElementNames.length > 0 ? perElementNames[0] : new Set<string>();
	for (let i = 1; i < perElementNames.length; i++) {
		const potentialNames = perElementNames[i];
		names = new Set([...names].filter((n) => potentialNames.has(n)));
	}
	return [...names].filter((n) => n !== "id");
}

/**
 * Python: `get_cost_schedule(cost_item) -> entity_instance`. Returns the cost schedule
 * of a cost item.
 */
export function getCostSchedule(costItem: EntityInstance): EntityInstance | null {
	for (const rel of attrList(costItem, "HasAssignments")) {
		if (rel.isA("IfcRelAssignsToControl") && (rel.get("RelatingControl") as EntityInstance).isA("IfcCostSchedule")) {
			return rel.get("RelatingControl") as EntityInstance;
		}
	}
	for (const rel of attrList(costItem, "Nests")) {
		return getCostSchedule(rel.get("RelatingObject") as EntityInstance);
	}
	return null;
}

/**
 * Python: `get_cost_rate(file, cost_item) -> Optional[entity_instance]`. Returns the
 * cost rate of a cost item. There is no direct relationship between a cost item and a
 * cost rate in IFC, so this is inferred, based on the assumption that
 * `cost_rate.CostValues == cost_item.CostValues`.
 */
export function getCostRate(file: IfcFile, costItem: EntityInstance): EntityInstance | null {
	// Python: `get_cost_schedule(cost_item).PredefinedType` -- unguarded, matching
	// Python's own behavior of throwing if `cost_item` has no assigned schedule at all.
	if ((getCostSchedule(costItem) as EntityInstance).get("PredefinedType") === "SCHEDULEOFRATES") {
		return null; // Cost item is already a cost rate.
	}
	const costValues = attrList(costItem, "CostValues");
	if (costValues.length > 0) {
		const potentialRates = file.getInverse(costValues[0]) as Set<EntityInstance>;
		for (const potentialRate of potentialRates) {
			const schedule = getCostSchedule(potentialRate);
			if ((schedule as EntityInstance).get("PredefinedType") === "SCHEDULEOFRATES") {
				return potentialRate;
			}
		}
	}
	return null;
}
