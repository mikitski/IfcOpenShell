// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cost/assign_cost_item_quantity.py` (src/ifcopenshell-
// python, 300 lines) -- BY FAR the largest and most complex file in this project's
// brand-new `api.cost` chunk (see `./index.ts`'s own header comment). Parametrically
// links a cost item's quantity to a product, in one of three modes:
//
// 1. Neither `propName` nor `formula` given: just `api.control.assignControl`s every
//    product to `costItem`, then recalculates a single auto-`IfcQuantityCount` (the
//    same "bold assumption" auto-count logic `./addCostItemQuantity.ts`'s module-level
//    function and `./unassignCostItemQuantity.ts`'s own internal copy both have --
//    THIS function's own copy has yet ANOTHER disclosed variant: it excludes
//    `IfcConstructionResource` related objects from the count, unlike either of those
//    two, which don't -- three near-identical-but-subtly-different count
//    implementations across this module, all ported verbatim, none reconciled).
// 2. `propName` given (no `formula`): for each product, finds an existing
//    `IfcElementQuantity` qto on that product whose `Quantities` includes a simple
//    quantity named (case-insensitively) `propName`, and adds THAT SAME quantity
//    entity (not a copy) into `costItem.CostQuantities` -- a genuine parametric link:
//    editing the product's own qto value later is reflected in the cost item too.
// 3. `formula` given: evaluates a small arithmetic expression over the product's own
//    Pset/Qto properties (see the "ast/operator" section below) and writes the result
//    into a NEW (or, for a single-product call, REUSED) quantity of `ifcClass`, tagged
//    with `Formula` for later re-matching.
//
// ============================================================================
// *** THE `ast`/`operator` QUESTION: investigated, NOT a blocker -- a small,
// hand-rolled recursive-descent arithmetic parser/evaluator is ported instead ***
// ============================================================================
//
// Real Python's `formula` branch uses `ast.parse(formula, mode="eval")` plus two tiny
// `ast.NodeVisitor` subclasses read directly from the source (lines 654-707 of the real
// file, reproduced here in full for the record):
//
//   OPERATORS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
//                ast.Div: operator.truediv, ast.Pow: operator.pow, ast.USub: operator.neg}
//   class VariableExtractor(ast.NodeVisitor):
//       def visit_Name(self, node): self.variables.add(node.id)
//       def visit_Attribute(self, node): self.variables.add(build_full_name(node))
//   class FormulaEvaluator(ast.NodeVisitor):
//       def visit_BinOp(self, node): return OPERATORS[type(node.op)](self.visit(node.left), self.visit(node.right))
//       def visit_Name(self, node): return self.values[node.id]
//       def visit_Attribute(self, node): return self.values[build_full_name(node)]
//       def visit_Constant(self, node): return node.value
//       def generic_visit(self, node): raise ValueError(f"Operation not permitted: {type(node).__name__}")
//
// Despite going through Python's REAL, general-purpose expression grammar
// (`ast.parse`), the actual SUPPORTED node set is tiny and closed: `BinOp` (the 4
// operators `FormulaEvaluator` can actually reach: `+ - * /` and `**`), `Name`,
// `Attribute` (dotted names, one or more levels, via `build_full_name`'s own `while
// isinstance(node, ast.Attribute)` loop), and `Constant` (a bare number literal) --
// `generic_visit`'s own `raise ValueError` is the REAL enforcement mechanism: any other
// syntactically-valid Python expression (a function call, a comparison, a boolean op, a
// string literal, a list/dict/f-string, a lambda, ...) parses FINE under `ast.parse`
// but then raises `ValueError: Operation not permitted: <NodeType>` the moment
// `FormulaEvaluator.visit` reaches it (NOT at parse time).
//
// --- REAL, NEWLY-DISCOVERED UPSTREAM BUG: unary minus is DEAD CODE in real Python --
//     `FormulaEvaluator` has no `visit_UnaryOp`, so a formula with a literal unary
//     minus ANYWHERE always crashes at evaluate time, it never actually negates ---
//
// `OPERATORS` includes `ast.USub: operator.neg`, and this file's own earlier drafts
// (and its own header comment, before this was found) assumed that meant unary minus
// (`"-5"`, `"A.qty * -1"`) was a genuinely supported, evaluated operation. It is NOT,
// confirmed empirically (`ast.dump(ast.parse("A.qty * -1", mode="eval").body)` ->
// `BinOp(left=Attribute(...), op=Mult(), right=UnaryOp(op=USub(), operand=Constant
// (value=1)))`) and by re-reading `ast.NodeVisitor.visit`'s own dispatch mechanism
// (`getattr(self, "visit_" + node.__class__.__name__, self.generic_visit)`):
// `FormulaEvaluator` defines exactly `visit_BinOp`/`visit_Name`/`visit_Attribute`/
// `visit_Constant` -- there is no `visit_UnaryOp` anywhere in the class. A `UnaryOp`
// node (what `-x` actually parses to -- NOT a negative `Constant`; Python's own
// constant folding does not apply to a general expression parsed via `mode="eval"`)
// therefore ALWAYS falls through to `generic_visit`, which raises `ValueError:
// Operation not permitted: UnaryOp`. And critically, `OPERATORS[ast.USub]` is never
// actually reachable either way: `visit_BinOp` only ever looks up `OPERATORS[type(
// node.op)]` for a `BinOp`'s own `.op`, which is always `Add`/`Sub`/`Mult`/`Div`/`Pow`
// -- `USub` only ever appears as a `UnaryOp`'s `.op`, a node type with no visitor at
// all. So `ast.USub: operator.neg` in the real `OPERATORS` dict is dead code: a real,
// undiscovered bug in upstream `ifcopenshell-python` (not something this port
// introduces) -- ANY formula containing a literal unary minus anywhere crashes with
// `ValueError`, it does not correctly negate.
//
// This port's parser still PARSES a leading `-` (`parseFactor`'s own `'-' factor`
// production below) -- matching real Python's `ast.parse` itself succeeding for such
// input (the bug is in evaluation, not parsing). But `evaluateFormulaNode` deliberately
// does NOT compute the negation: encountering a `{kind: "unary", ...}` node throws
// (mirroring `generic_visit`'s own raise for `UnaryOp`, at the same, later point real
// Python's own bug fires, not silently "fixed" to actually negate). This is the
// OPPOSITE direction from this file's own "PARSE-time rejection" divergence documented
// below (things rejected EARLIER than Python) -- this is a case rejected at the SAME
// point Python does, reproducing a real bug rather than correcting it, per this
// project's own "preserve every real quirk/bug verbatim" mandate.
// `assignCostItemQuantity.test.ts` pins this with a dedicated regression test.
//
// This project already has an established precedent for exactly this situation --
// `util/cost.ts`'s own header comment, porting `ifcopenshell.util.cost`'s separate
// (Lark-grammar-based) cost-value formula mini-language: "no new npm dependency, the
// real grammar is small enough to hand-roll." The SAME reasoning applies here, even
// more strongly -- this grammar is smaller still (5 binary operators + dotted names +
// number literals -- unary minus PARSES but always throws at evaluate time, per the
// disclosed dead-`USub` bug above; no `SUM(...)`/category-wrapping concept at all,
// unlike `util.cost`'s own mini-language). A hand-rolled recursive-descent
// tokenizer/parser/evaluator (`parseFormula`/`extractFormulaVariables`/
// `evaluateFormulaNode` below) is ported instead of either (a) declaring a blocker, or
// (b) reaching for a real JS expression-evaluation library or `new Function(...)`/
// `eval()` (which would accept a vastly LARGER, unsafe language than real Python's own
// `generic_visit`-gated subset actually allows -- a worse fidelity match, not a better
// one, and a real code-injection surface this project has no reason to introduce).
//
// --- Disclosed, deliberate divergence: PARSE-time rejection, not Python's
//     parse-then-evaluate-time rejection ---
//
// Because this hand-rolled grammar only ever recognizes the 5 arithmetic operators,
// dotted names, number literals, and parentheses, a `formula` string containing
// anything else (e.g. `"foo(bar)"`, `"a == b"`, `"'text'"`) fails to PARSE at all here
// (a thrown `SyntaxError`), whereas real Python's `ast.parse` would happily parse such
// syntactically-valid Python and only fail once `FormulaEvaluator.visit` reaches the
// disallowed node (a thrown `ValueError`, with real Python's own distinct message
// naming the exact AST node type). Both ultimately THROW for the same class of
// disallowed input -- the observable "this formula is rejected" behavior matches --
// but the exact exception type/message and the exact MOMENT (parse vs. evaluate) it's
// raised differ. Disclosed here, not silently assumed identical.
//
// --- Grouping parentheses: supported, even though undocumented/unused in any real
//     Python docstring example ---
//
// `ast.parse` accepts arbitrary Python expression syntax, parentheses included (pure
// grouping, no distinct AST node of their own) -- this hand-rolled parser accepts them
// too (`parseAtom`'s `"("`/`")"` case) for the same reason, even though no real Python
// docstring example or test actually exercises grouping.
//
// --- Python's own `str.split(".")` full-Attribute-chain support (`a.b.c`, not just
//     `a.b`) -- matched, even though only ever used for `Pset.Property` (one dot) in
//     practice ---
//
// `build_full_name`'s own `while isinstance(node, ast.Attribute)` loop supports
// arbitrarily deep dotted chains, not just one level -- this parser's `parseAtom`
// mirrors that generality (`NAME ('.' NAME)*`), even though every real docstring
// example and this port's own tests only ever use exactly one dot
// (`"Pset_ConcreteElementGeneral.ReinforcementVolumeRatio"`).
//
// ============================================================================
// Everything else in this file, verbatim
// ============================================================================
//
// --- "Todo improve it": the quantity-reuse scan has NO `break`, matching real Python's
//     `continue` -- the LAST matching quantity wins, not the first ---
//
// `for quantity in self.quantities: if quantity.Formula == formula and len(products) ==
// 1: new_quantity = quantity; ifc_class = quantity.is_a(); continue` -- real Python's
// own inline `# Todo improve it` comment flags this itself. Since `self.quantities` is a
// `set()` (unordered in general, though this port's `EntityInstanceSet` is insertion-
// ordered), if MULTIPLE existing quantities happen to share the exact same `Formula`
// string, the loop keeps scanning and the LAST one encountered wins, silently
// overwriting `newQuantity`/`ifcClass` from any earlier match. Ported verbatim (no
// early exit added).
//
// --- Auto-recompute happens even for `propName`/`formula`-less calls: reuses
//     `./addCostItemQuantity.ts` when no quantity exists yet ---
//
// `Usecase.update_cost_item_count` (called only when NEITHER `propName` nor `formula`
// is given) calls the real, already-landed module-level `add_cost_item_quantity` if
// `cost_item.CostQuantities` is currently empty -- reused directly here too, not
// reimplemented.
//
// --- `IfcSpatialElement`-except-`IfcSpace` products are silently skipped entirely,
//     not even `assignControl`-ed ---
//
// `if product.is_a("IfcSpatialElement") and not product.is_a("IfcSpace"): continue` --
// ported as the first check inside the product loop, before `assignControl` is ever
// called for that product.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getPset, getPsets } from "../../util/element";
import { assignControl } from "../control/assignControl";
import { wrapUsecase } from "../hooks";
import { addCostItemQuantity } from "./addCostItemQuantity";

// ============================================================================
// Hand-rolled arithmetic formula parser/evaluator -- see this file's header comment
// for the full "ast/operator" investigation and decision. Local to this file only
// (not exported, not shared with `util/cost.ts`'s own, DIFFERENT formula
// mini-language -- the two are unrelated grammars that happen to both be called
// "formula" in their respective real Python source files).
// ============================================================================

type FormulaNode =
	| { readonly kind: "num"; readonly value: number }
	| { readonly kind: "name"; readonly name: string }
	| { readonly kind: "unary"; readonly operand: FormulaNode }
	| {
			readonly kind: "binop";
			readonly op: "+" | "-" | "*" | "/" | "**";
			readonly left: FormulaNode;
			readonly right: FormulaNode;
	  };

interface FormulaToken {
	readonly type: "num" | "name" | "op" | "eof";
	readonly value: string;
}

/** Tokenizes a formula string into numbers, dotted-name-capable identifiers, the 5
 * supported operators (`+ - * / **`), parentheses, and `.` -- see this file's header
 * comment for the exact, deliberately restricted grammar this mirrors. */
function tokenizeFormula(input: string): FormulaToken[] {
	const tokens: FormulaToken[] = [];
	let i = 0;
	while (i < input.length) {
		const ch = input[i];
		if (/\s/.test(ch)) {
			i++;
			continue;
		}
		if (/[0-9]/.test(ch)) {
			let j = i;
			while (j < input.length && /[0-9]/.test(input[j])) j++;
			if (input[j] === "." && /[0-9]/.test(input[j + 1] ?? "")) {
				j++;
				while (j < input.length && /[0-9]/.test(input[j])) j++;
			}
			if (input[j] === "e" || input[j] === "E") {
				let k = j + 1;
				if (input[k] === "+" || input[k] === "-") k++;
				if (/[0-9]/.test(input[k] ?? "")) {
					j = k;
					while (j < input.length && /[0-9]/.test(input[j])) j++;
				}
			}
			tokens.push({ type: "num", value: input.slice(i, j) });
			i = j;
			continue;
		}
		if (/[A-Za-z_]/.test(ch)) {
			let j = i + 1;
			while (j < input.length && /[A-Za-z0-9_]/.test(input[j])) j++;
			tokens.push({ type: "name", value: input.slice(i, j) });
			i = j;
			continue;
		}
		if (ch === "*" && input[i + 1] === "*") {
			tokens.push({ type: "op", value: "**" });
			i += 2;
			continue;
		}
		if ("+-*/().".includes(ch)) {
			tokens.push({ type: "op", value: ch });
			i++;
			continue;
		}
		throw new SyntaxError(`assignCostItemQuantity: unexpected character '${ch}' in formula '${input}'.`);
	}
	tokens.push({ type: "eof", value: "" });
	return tokens;
}

/** Recursive-descent parser matching Python's own arithmetic-expression precedence
 * (`arith_expr` -> `term` -> `factor` -> `power` -> `atom_expr`), restricted to the
 * exact operator/node subset real Python's `FormulaEvaluator`/`OPERATORS` actually
 * support -- see this file's header comment. */
class FormulaParser {
	private pos = 0;
	constructor(private readonly tokens: readonly FormulaToken[]) {}

	private peek(): FormulaToken {
		return this.tokens[this.pos];
	}
	private next(): FormulaToken {
		return this.tokens[this.pos++];
	}
	private isOp(value: string): boolean {
		const t = this.peek();
		return t.type === "op" && t.value === value;
	}

	parse(): FormulaNode {
		const node = this.parseExpr();
		if (this.peek().type !== "eof") {
			throw new SyntaxError("assignCostItemQuantity: unexpected trailing input in formula.");
		}
		return node;
	}

	/** `arith_expr: term (('+'|'-') term)*`. */
	private parseExpr(): FormulaNode {
		let node = this.parseTerm();
		while (this.isOp("+") || this.isOp("-")) {
			const op = this.next().value as "+" | "-";
			node = { kind: "binop", op, left: node, right: this.parseTerm() };
		}
		return node;
	}

	/** `term: factor (('*'|'/') factor)*`. */
	private parseTerm(): FormulaNode {
		let node = this.parseFactor();
		while (this.isOp("*") || this.isOp("/")) {
			const op = this.next().value as "*" | "/";
			node = { kind: "binop", op, left: node, right: this.parseFactor() };
		}
		return node;
	}

	/** `factor: '-' factor | power` -- unary minus may nest at any depth. Parses
	 * successfully (matching real Python's own `ast.parse`), but `evaluateFormulaNode`
	 * always throws on the resulting `"unary"` node -- see this file's header comment's
	 * disclosed dead-`ast.USub` bug section. */
	private parseFactor(): FormulaNode {
		if (this.isOp("-")) {
			this.next();
			return { kind: "unary", operand: this.parseFactor() };
		}
		return this.parsePower();
	}

	/** `power: atom ('**' factor)?` -- right-associative; the exponent may itself carry
	 * a leading unary minus (`2**-2`), matching Python's own `power: atom_expr ['**'
	 * factor]` (the base itself may not carry a leading unary at this level -- that's
	 * `factor`'s own job, one level up). */
	private parsePower(): FormulaNode {
		const base = this.parseAtom();
		if (this.isOp("**")) {
			this.next();
			return { kind: "binop", op: "**", left: base, right: this.parseFactor() };
		}
		return base;
	}

	/** `atom: NUMBER | NAME ('.' NAME)* | '(' expr ')'`. */
	private parseAtom(): FormulaNode {
		const token = this.peek();
		if (token.type === "num") {
			this.next();
			return { kind: "num", value: Number(token.value) };
		}
		if (token.type === "name") {
			this.next();
			let name = token.value;
			while (this.isOp(".")) {
				this.next();
				const part = this.next();
				if (part.type !== "name") {
					throw new SyntaxError("assignCostItemQuantity: expected identifier after '.' in formula.");
				}
				name += `.${part.value}`;
			}
			return { kind: "name", name };
		}
		if (this.isOp("(")) {
			this.next();
			const node = this.parseExpr();
			if (!this.isOp(")")) throw new SyntaxError("assignCostItemQuantity: expected ')' in formula.");
			this.next();
			return node;
		}
		throw new SyntaxError("assignCostItemQuantity: unexpected token in formula.");
	}
}

/** Python's `ast.parse(formula, mode="eval")`. */
function parseFormula(formula: string): FormulaNode {
	return new FormulaParser(tokenizeFormula(formula)).parse();
}

/** Python's `VariableExtractor` -- collects every dotted/bare variable name referenced
 * in the formula, deduplicated (a `Set`, matching Python's own `self.variables: set[str]`).
 * Unlike `FormulaEvaluator` below, `VariableExtractor` does NOT override `generic_visit`
 * -- real Python's default `ast.NodeVisitor.generic_visit` just recurses into every
 * child of an unhandled node type (a `UnaryOp` included), so a formula's variables are
 * still collected correctly even though `FormulaEvaluator` itself would later throw on
 * that same `UnaryOp` node (see this file's header comment) -- ported faithfully via
 * the identical unconditional recursion into `node.operand` below. */
function extractFormulaVariables(node: FormulaNode, out: Set<string> = new Set()): Set<string> {
	if (node.kind === "name") out.add(node.name);
	else if (node.kind === "unary") extractFormulaVariables(node.operand, out);
	else if (node.kind === "binop") {
		extractFormulaVariables(node.left, out);
		extractFormulaVariables(node.right, out);
	}
	return out;
}

/** Python's `OPERATORS` dict. */
const FORMULA_OPERATORS: Record<string, (a: number, b: number) => number> = {
	"+": (a, b) => a + b,
	"-": (a, b) => a - b,
	"*": (a, b) => a * b,
	"/": (a, b) => a / b,
	"**": (a, b) => a ** b,
};

/** Python's `FormulaEvaluator`. Throws (matching real Python's own `TypeError` for
 * `OPERATORS[...](None, ...)`) if a referenced variable's resolved value is `null` or
 * otherwise not a number -- real Python does NOT guard against this either (the
 * warning already printed by the caller doesn't stop evaluation from crashing). */
function evaluateFormulaNode(node: FormulaNode, values: Readonly<Record<string, number | null>>): number {
	if (node.kind === "num") return node.value;
	if (node.kind === "name") {
		const value = values[node.name];
		if (typeof value !== "number") {
			throw new TypeError(
				`assignCostItemQuantity: unsupported operand type for variable '${node.name}' (value: ${String(value)}).`,
			);
		}
		return value;
	}
	if (node.kind === "unary") {
		// See this file's header comment's disclosed dead-`ast.USub` bug: real Python's
		// `FormulaEvaluator` has no `visit_UnaryOp`, so a `UnaryOp` node ALWAYS falls
		// through to `generic_visit`'s own `raise ValueError("Operation not permitted:
		// UnaryOp")` -- it never actually negates. Ported verbatim: this branch throws
		// here too, rather than computing `-evaluateFormulaNode(node.operand, values)`
		// (a result real Python's own formula language never actually produces).
		throw new Error("assignCostItemQuantity: Operation not permitted: UnaryOp");
	}
	return FORMULA_OPERATORS[node.op](evaluateFormulaNode(node.left, values), evaluateFormulaNode(node.right, values));
}

// ============================================================================
// The usecase itself
// ============================================================================

/** Local by-identity set, matching `../control/assignControl.ts`'s own established per-file precedent. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

/** Python's `get_value_from_pset(product, v) -> float | None`. */
function getValueFromPset(product: EntityInstance, variable: string): number | null {
	const [psetName, psetPropertyName] = variable.split(".");
	const pset = getPset(product, psetName) as Record<string, unknown> | null;
	const value = pset?.[psetPropertyName];
	return value === undefined || value === null ? null : (value as number);
}

/** Python's `get_value_from_qset(product, v) -> float | None`. */
function getValueFromQset(product: EntityInstance, variable: string): number | null {
	const qtos = getPsets(product, false, true);
	const quantities = Object.values(qtos)[0] ?? {};
	const value = quantities[variable];
	return value === undefined || value === null ? null : (value as number);
}

/** Python's `Usecase.add_quantity_from_qto`. */
function addQuantityFromQto(qto: EntityInstance, propName: string, quantities: EntityInstanceSet): void {
	if (!qto.isA("IfcElementQuantity")) return;
	for (const prop of qto.get("Quantities") as EntityInstance[]) {
		if (
			prop.isA("IfcPhysicalSimpleQuantity") &&
			(prop.get("Name") as string).toLowerCase() === propName.toLowerCase()
		) {
			quantities.add(prop);
		}
	}
}

/** Python's `Usecase.add_quantity_from_related_object`. */
function addQuantityFromRelatedObject(product: EntityInstance, propName: string, quantities: EntityInstanceSet): void {
	for (const relationship of product.get("IsDefinedBy") as EntityInstance[]) {
		if (relationship.isA("IfcRelDefinesByProperties")) {
			addQuantityFromQto(relationship.get("RelatingPropertyDefinition") as EntityInstance, propName, quantities);
		}
	}
}

/** Python's `Usecase.update_cost_item_count` -- NOT `./addCostItemQuantity.ts`'s own
 * module-level count, and NOT `./unassignCostItemQuantity.ts`'s own internal copy
 * either (see this file's header comment for the disclosed 3-way asymmetry: only THIS
 * one excludes `IfcConstructionResource` related objects from the count). */
function updateCostItemCount(file: IfcFile, costItem: EntityInstance): void {
	// This is a bold assumption -- real Python's own comment, ported verbatim.
	// https://forums.buildingsmart.org/t/how-does-a-cost-item-know-that-it-is-counting-a-controlled-product/3564
	if (!costItem.get("CostQuantities")) {
		addCostItemQuantity(file, { costItem, ifcClass: "IfcQuantityCount" });
	}
	const costQuantities = costItem.get("CostQuantities") as EntityInstance[];
	if (costQuantities.length === 1) {
		const quantity = costQuantities[0];
		if (quantity.isA("IfcQuantityCount")) {
			let count = 0;
			for (const rel of costItem.get("Controls") as EntityInstance[]) {
				for (const obj of rel.get("RelatedObjects") as EntityInstance[]) {
					if (!obj.isA("IfcConstructionResource")) count += 1;
				}
			}
			quantity.setByIndex(3, count);
		}
	}
}

export interface AssignCostItemQuantitySettings {
	/** The `IfcCostItem` to assign parametric quantities to. */
	costItem: EntityInstance;
	/** The `IfcObject`s to assign parametric quantities to. */
	products: readonly EntityInstance[];
	/**
	 * The name of the quantity. If this is not specified (and `formula` isn't either),
	 * then it is assumed that there is no calculated quantity, and the number of
	 * objects are counted instead. Python default: `""`.
	 */
	propName?: string;
	/** The string that contains the formula. Python default: `""`. */
	formula?: string;
	/**
	 * The quantity class of the calculated value if `formula` is specified. Python
	 * default: `"IfcQuantityLength"`.
	 */
	ifcClass?: string;
}

function assignCostItemQuantityUsecase(file: IfcFile, settings: AssignCostItemQuantitySettings): void {
	const { costItem } = settings;
	const products = settings.products ?? [];
	const propName = settings.propName ?? "";
	const formula = settings.formula ?? "";
	let ifcClass = settings.ifcClass ?? "IfcQuantityLength";

	let quantities: EntityInstanceSet | undefined;
	if (propName || formula) {
		quantities = new EntityInstanceSet();
		quantities.update((costItem.get("CostQuantities") as EntityInstance[] | null) ?? []);
	}

	for (const product of products) {
		if (product.isA("IfcSpatialElement") && !product.isA("IfcSpace")) continue;

		assignControl(file, { relatingControl: costItem, relatedObjects: [product] });

		if (formula) {
			const tree = parseFormula(formula);
			const variables = extractFormulaVariables(tree);

			const values: Record<string, number | null> = {};
			for (const variable of variables) {
				const value = variable.includes(".")
					? getValueFromPset(product, variable)
					: getValueFromQset(product, variable);
				values[variable] = value;

				if (value === null) {
					console.warn(
						`WARNING: Variable '${variable}' in product '${String(product.get("Name"))}' is missing (None). Check Pset/Qset or property name.`,
					);
				} else if (value === 0) {
					console.warn(
						`WARNING: Variable '${variable}' in product '${String(product.get("Name"))}' has value 0. Verify if this is correct.`,
					);
				}
			}

			const result = evaluateFormulaNode(tree, values);

			// See this file's header comment: no early `break` -- the LAST match wins,
			// matching real Python's own "Todo improve it" `continue`.
			let newQuantity: EntityInstance | null = null;
			for (const quantity of (quantities as EntityInstanceSet).values()) {
				if (quantity.get("Formula") === formula && products.length === 1) {
					newQuantity = quantity;
					ifcClass = quantity.isA();
				}
			}
			if (newQuantity === null) {
				newQuantity = file.createEntity(ifcClass, "Unnamed");
				newQuantity.set("Formula", formula);
				(quantities as EntityInstanceSet).add(newQuantity);
			}
			newQuantity.setByIndex(3, result);
			continue;
		}

		if (propName) {
			const costQuantities = costItem.get("CostQuantities") as EntityInstance[] | null;
			if (costQuantities && costQuantities.length > 0) {
				const firstName = costQuantities[0].get("Name") as string;
				if (firstName.toLowerCase() !== propName.toLowerCase()) continue;
			}
			addQuantityFromRelatedObject(product, propName, quantities as EntityInstanceSet);
		}
	}

	if (propName || formula) {
		costItem.set("CostQuantities", (quantities as EntityInstanceSet).values());
	} else {
		updateCostItemCount(file, costItem);
	}
}

/**
 * Adds a cost item quantity that is parametrically connected to a product (Python:
 * `ifcopenshell.api.cost.assign_cost_item_quantity`).
 *
 * A cost item may have its subtotal calculated by multiplying a unit value by a
 * quantity associated with the cost item. That quantity may be either manually
 * specified or parametrically connected to a quantity on a product. This API function
 * lets you create that parametric connection.
 *
 * This API also automatically assigns a control relationship between the cost item and
 * the product, so it is not necessary to use `api.control.assignControl` separately.
 *
 * @example
 * ```ts
 * const schedule = api.cost.addCostSchedule(model);
 * const item = api.cost.addCostItem(model, { costSchedule: schedule });
 *
 * const value = api.cost.addCostValue(model, { parent: item });
 * api.cost.editCostValue(model, { costValue: value, attributes: { AppliedValue: 5.0 } });
 *
 * const slab = api.root.createEntity(model, { ifcClass: "IfcSlab" });
 * const qto = api.pset.addQto(model, { product: slab, name: "Qto_SlabBaseQuantities" });
 * api.pset.editQto(model, { qto, properties: { NetVolume: 42.0 } });
 *
 * api.cost.assignCostItemQuantity(model, { costItem: item, products: [slab], propName: "NetVolume" });
 *
 * // Or, using a formula over a product's own Pset/Qto properties.
 * api.cost.assignCostItemQuantity(model, {
 * 	costItem: item,
 * 	products: [wall],
 * 	formula: "Pset_ConcreteElementGeneral.ReinforcementVolumeRatio * NetVolume",
 * 	ifcClass: "IfcQuantityVolume",
 * });
 * ```
 */
export const assignCostItemQuantity = wrapUsecase("cost.assign_cost_item_quantity", assignCostItemQuantityUsecase);
