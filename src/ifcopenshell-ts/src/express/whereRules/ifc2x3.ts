// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-4 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md, "the large
// chunk" -- WHERE-rule classes + `rule_executor.py`): the first real batch of ported
// WHERE-rule classes -- ALL 24 `SCOPE = 'type'` rules and the FIRST 46 `SCOPE =
// 'entity'` rules in `src/ifcopenshell-python/ifcopenshell/express/rules/IFC2X3.py`, in
// real file order (lines 3588-4283, re-verified directly against that file, exact class
// name and line number cited above each rule below -- not trusted from the dispatching
// task brief's own citation alone). Registered under `"IFC2X3"`, this port's own
// confirmed-correct schema identifier for this schema (no `_ADD2`-style wrinkle, unlike
// IFC4X3, per `70-express-rules-plan.md`'s own established finding).
//
// **Deliberately EXCLUDES the 2 `SCOPE = 'file'` rules** for IFC2X3 (around real source
// lines 7366/7381, far later in the file) -- file-scope rules are a small, easily-
// scheduled-separately tail item (2 per schema, 6 total across all 3 schemas) per the
// phase plan; this chunk does not go out of file-order sequence to grab them early. A
// later chunk handles all 6 together. Flagged here explicitly so this is understood as
// deliberate, not forgotten.
//
// **Naming/directory choice**: kept in a NEW `whereRules/` directory, separate from
// Phase EX-2's existing `rules/` directory (`rules/ifc2x3.ts` etc., `calc_*` DERIVE
// functions only) -- even though both are sourced from the exact same real Python file
// per schema. They're registered into, and consumed by, entirely different mechanisms
// (`ruleDispatch.ts`'s own registry + `ruleExecutor.ts`'s 3-phase engine, vs.
// `dispatch.ts`'s registry + `entityInstance.ts`'s per-attribute DERIVE dispatch) --
// see `ruleDispatch.ts`'s own header comment for the full rationale. `whereRules/
// ifc2x3.ts` (this file) is expected to grow across many future chunks (368 total
// WHERE-rule classes for IFC2X3 alone, ~1,830 across all 3 schemas) exactly the way
// `rules/ifc2x3.ts` grew across Phase EX-2's own 5 chunks.
//
// **How to read a rule below**: `runtimeShim.ts`'s own new "Phase EX-4 chunk 1" section
// (`Tri`, `pyAnd`/`pyOr`/`pyNot`, `triEq`/`triNe`/`triLt`/`triLe`/`triGt`/`triGe`/
// `triDiv`, `assertWhereRule`) documents the general strategy every rule here uses to
// reproduce EXPRESS's 3-valued (true/false/indeterminate) logic and Python's own exact
// `and`/`or`/`not`/comparison short-circuit semantics -- read that section first, it
// explains WHY each rule is built the way it is. In short: an optional forward
// attribute is read via `expressGetAttr` (returns `INDETERMINATE`, not `null`, when
// unset -- exactly Python's own `express_getattr(self, name, INDETERMINATE)`), any
// comparison whose operands might be indeterminate or entity-instance-valued goes
// through `triEq`/`triNe`/`triLt`/etc. (never a bare `===`), `and`/`or` chains go
// through `pyAnd`/`pyOr` with a LAZY right-hand thunk (mirroring Python's own
// short-circuit non-evaluation of the not-yet-needed operand), and every rule's own
// final expression is passed to `assertWhereRule`, which throws (a plain, hand-written,
// human-readable `Error`) if and only if that expression is the literal `false` --
// matching `assert (...) is not False` exactly. A `SCOPE = 'type'` rule's own `self` is
// always the raw, already-non-null attribute VALUE (a plain string/number/array, never
// wrapped) -- `ruleExecutor.ts`'s own `checkValue` never invokes a type-scope rule for
// a `null`/`undefined` value (mirrors Python's own `if value is None: return`), so
// these 24 rules use plain JS comparisons directly, with no `Tri`/`expressGetAttr`
// machinery needed at all (there is nothing optional left to read once `self` itself is
// guaranteed present).
//
// **One shared, non-`calc_*`, non-WHERE-rule EXPRESS-library helper needed and ported
// here, disclosed per this chunk's own task brief**: `IfcCalendarDate_WR21` calls
// `IfcValidCalendarDate` (real source line 8043), which itself calls `IfcLeapYear`
// (line 7823). Neither is a `calc_*` DERIVE function (out of Phase EX-2's own scope) or
// a WHERE-rule class; both are ported below as `ifcValidCalendarDate`/`ifcLeapYear`.
// See their own doc comments for a genuinely subtle, faithfully-preserved real Python
// quirk found while porting them: a missing/indeterminate `DayComponent` makes
// `IfcValidCalendarDate` return a definite `False` (NOT "indeterminate, pass") due to
// how Python's chained comparison (`1 <= X <= 31`) and `if not (...)` interact when `X`
// is `INDETERMINATE` -- verified by tracing the exact dunder-based poison-propagation/
// `bool()`-coercion mechanics `runtimeShim.ts`'s own header comment documents, not
// assumed.
//
// **One reused dependency from Phase EX-2's own chunk 1, newly exported this chunk**:
// `IfcAxis2Placement3D_WR4`'s own real source body calls `IfcCrossProduct(axis,
// refdirection)` -- `express/rules/ifc2x3.ts`'s own already-ported, already-tested
// `ifcCrossProduct` (module-private there until this chunk) is reused as-is (now
// `export`ed, see that file's own updated doc comment) rather than re-derived. This
// transitively inherits that file's own already-disclosed, already-pinned real Python
// bug (`IfcFirstProjAxis`'s always-true tuple/list comparison) -- NOT rediscovered
// here, just inherited via reuse; no NEW real Python bugs were found in any of the 70
// rules ported directly in this file.
//
// **No other rule-file-local EXPRESS-library helper (beyond the two above) is called by
// any of these 70 rules** -- confirmed by reading every single body directly (see the
// per-rule comments below, each citing its own exact real-source line).

import type { EntityInstance } from "../../entityInstance";
import { type RuleDefinition, registerSchemaRules } from "../ruleDispatch";
import { ifcCrossProduct } from "../rules/ifc2x3";
import {
	EXPRESS_ONE_BASED_INDEXING,
	type ExpressSet,
	INDETERMINATE,
	type Tri,
	assertWhereRule,
	exists,
	expressGetAttr,
	expressGetItem,
	isIndeterminate,
	pyAnd,
	pyOr,
	triDiv,
	triEq,
	triGt,
	triLe,
	triLt,
	triNe,
	typeOf,
} from "../runtimeShim";

// biome-ignore lint/suspicious/noExplicitAny: mirrors `RuleDefinition['check']`'s own deliberate `any` -- see that field's doc comment (`ruleDispatch.ts`).
function typeRule(typeName: string, ruleName: string, check: (self: any) => void): RuleDefinition {
	return { scope: "type", typeName, ruleName, check };
}

function entityRule(typeName: string, ruleName: string, check: (self: EntityInstance) => void): RuleDefinition {
	return { scope: "entity", typeName, ruleName, check };
}

/**
 * Python: `typeof(inst)` where `inst` may be `INDETERMINATE` (an unset optional
 * attribute read via `expressGetAttr`) -- `runtimeShim.ts`'s own `typeOf` only special-
 * cases `null`/`undefined`/falsy JS values as "no instance" (matching its own, narrower
 * documented contract), but the `INDETERMINATE` sentinel is a `Symbol` (always
 * JS-truthy) and would otherwise reach `instance.declaration()` and throw. Real Python
 * handles this for free (`if not inst:` is `bool(INDETERMINATE)` = `False`, since
 * `indeterminate_type.__bool__` returns `False`) -- this wrapper reproduces exactly
 * that one extra case before delegating.
 */
function typeOfAttr(value: unknown): ExpressSet<string> {
	return isIndeterminate(value) ? typeOf(null) : typeOf(value as EntityInstance);
}

/**
 * Shared shape repeated verbatim (modulo entity/attribute names) across
 * `IfcActorRole_WR1`, `IfcAirTerminalBoxType_WR1`, `IfcAirTerminalType_WR1`,
 * `IfcAirToAirHeatRecoveryType_WR1`, `IfcBoilerType_WR1`,
 * `IfcCableCarrierFittingType_WR1` -- Python: `X != USERDEFINED or (X == USERDEFINED
 * and exists(Y))`. Factored into one local helper since the 6 real classes are
 * otherwise byte-identical modulo the entity/attribute names -- each still gets its own
 * `entityRule(...)` registration below, citing its own real line number, matching this
 * project's "one registration per real class" discipline even when bodies are shared.
 * (`IfcAddress_WR1` uses the same core shape but wraps it in an additional `not
 * exists(purpose) or (...)`, ported separately below rather than reusing this helper.)
 */
function userDefinedOrHasAttribute(self: EntityInstance, enumAttrName: string, otherAttrName: string): Tri {
	const value = expressGetAttr(self, enumAttrName, INDETERMINATE);
	return pyOr(triNe(value, "USERDEFINED"), () =>
		pyAnd(triEq(value, "USERDEFINED"), () => exists(expressGetAttr(self, otherAttrName, INDETERMINATE))),
	);
}

/**
 * Python: `IfcLeapYear(year)` (`IFC2X3.py` line 7823):
 * ```python
 * def IfcLeapYear(year):
 *     if year % 4 == 0 and year % 100 != 0 or year % 400 == 0:
 *         return True
 *     else:
 *         return False
 * ```
 * `year` (an `IfcCalendarDate.YearComponent` read) could in principle be
 * `INDETERMINATE` if that mandatory attribute were somehow unset -- see
 * `ifcValidCalendarDate`'s own doc comment for why a definite `false` (not
 * indeterminate propagation) is the faithful behavior here too.
 */
function ifcLeapYear(year: unknown): boolean {
	if (isIndeterminate(year)) return false;
	const y = year as number;
	return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * Python: `IfcValidCalendarDate(date)` (`IFC2X3.py` line 8043):
 * ```python
 * def IfcValidCalendarDate(date):
 *     if not 1 <= express_getattr(date, 'DayComponent', INDETERMINATE) <= 31:
 *         return False
 *     if express_getattr(date, 'MonthComponent', INDETERMINATE) == 4: ... (30)
 *     elif ... == 6: ... (30)
 *     elif ... == 9: ... (30)
 *     elif ... == 11: ... (30)
 *     elif ... == 2:
 *         if IfcLeapYear(express_getattr(date, 'YearComponent', INDETERMINATE)):
 *             return 1 <= express_getattr(date, 'DayComponent', INDETERMINATE) <= 29
 *         else:
 *             return 1 <= express_getattr(date, 'DayComponent', INDETERMINATE) <= 28
 *     else:
 *         return True
 * ```
 *
 * **A genuinely subtle, faithfully-preserved real Python quirk**: if `DayComponent`
 * were `INDETERMINATE`, Python's chained comparison `1 <= X <= 31` desugars to `(1 <=
 * X) and (X <= 31)`; `1 <= INDETERMINATE` resolves (via `indeterminate_type`'s own
 * reflected `__ge__ = bop`) to `INDETERMINATE` itself, and `INDETERMINATE and (X <=
 * 31)` short-circuits (Python `and`, `bool(INDETERMINATE)` is `False`) to
 * `INDETERMINATE` WITHOUT evaluating the second half. The surrounding `if not (...)`
 * then calls `bool()` on that `INDETERMINATE` (`not` always coerces to a definite
 * boolean, see `runtimeShim.ts`'s own header comment) -- `not INDETERMINATE` is the
 * definite `True` -- so the function returns a definite `False` for a missing/
 * indeterminate `DayComponent`, NOT "indeterminate, rule passes". `inRange` below
 * reproduces this exact real outcome (a definite `false` for an indeterminate operand),
 * traced through the same dunder/coercion mechanics, not assumed symmetric with the
 * rest of this module's own Tri-logic (which would otherwise propagate indeterminacy
 * upward instead of collapsing it).
 *
 * A similarly-traced `MonthComponent`/(for `MonthComponent == 2`)
 * `YearComponent` being `INDETERMINATE` instead falls through every `elif` (each
 * `== N` comparison resolves to `INDETERMINATE`, which is falsy in an `if`/`elif`
 * context) all the way to the final `else: return True` -- ported below via `triEq(...)
 * === true` checks, which naturally fail (fall through) for an `INDETERMINATE` month,
 * arriving at the same `return true` real Python's own `else` branch would.
 */
function inRange(value: unknown, low: number, high: number): boolean {
	if (isIndeterminate(value)) return false;
	const v = value as number;
	return low <= v && v <= high;
}

function ifcValidCalendarDate(date: EntityInstance): boolean {
	const day = expressGetAttr(date, "DayComponent", INDETERMINATE);
	if (!inRange(day, 1, 31)) return false;
	const month = expressGetAttr(date, "MonthComponent", INDETERMINATE);
	if (triEq(month, 4) === true || triEq(month, 6) === true || triEq(month, 9) === true || triEq(month, 11) === true) {
		return inRange(day, 1, 30);
	}
	if (triEq(month, 2) === true) {
		const year = expressGetAttr(date, "YearComponent", INDETERMINATE);
		return ifcLeapYear(year) ? inRange(day, 1, 29) : inRange(day, 1, 28);
	}
	return true;
}

// =============================================================================
// SCOPE = 'type' rules (real source lines 3588-3803, all 24 in this schema).
// =============================================================================

// `IfcBoxAlignment_WR1` (line 3588): `express_getattr(self, 'lower', INDETERMINATE)()`
// is Python calling the raw STRING's own bound `.lower()` method (`getattr` on a real
// `str` resolves its method; the `INDETERMINATE` default is never actually reachable
// here since every `str` has a `.lower` attribute) -- ported directly as
// `self.toLowerCase()`.
const IfcBoxAlignment_WR1 = typeRule("IfcBoxAlignment", "WR1", (self: string) => {
	assertWhereRule(
		[
			"top-left",
			"top-middle",
			"top-right",
			"middle-left",
			"center",
			"middle-right",
			"bottom-left",
			"bottom-middle",
			"bottom-right",
		].includes(self.toLowerCase()),
		"IfcBoxAlignment must be one of the 9 documented box-alignment keywords (case-insensitive).",
	);
});

// `IfcCompoundPlaneAngleMeasure_WR1..WR4` (lines 3597-3632): `self` is the raw
// `LIST [3:4] OF INTEGER` value (degrees/minutes/seconds[/microseconds]).
const IfcCompoundPlaneAngleMeasure_WR1 = typeRule("IfcCompoundPlaneAngleMeasure", "WR1", (self: number[]) => {
	const degrees = expressGetItem(self, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	assertWhereRule(
		-360 <= degrees && degrees < 360,
		"IfcCompoundPlaneAngleMeasure: degrees component must be in [-360, 360).",
	);
});

const IfcCompoundPlaneAngleMeasure_WR2 = typeRule("IfcCompoundPlaneAngleMeasure", "WR2", (self: number[]) => {
	const minutes = expressGetItem(self, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	assertWhereRule(
		-60 <= minutes && minutes < 60,
		"IfcCompoundPlaneAngleMeasure: minutes component must be in [-60, 60).",
	);
});

const IfcCompoundPlaneAngleMeasure_WR3 = typeRule("IfcCompoundPlaneAngleMeasure", "WR3", (self: number[]) => {
	const seconds = expressGetItem(self, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	assertWhereRule(
		-60 <= seconds && seconds < 60,
		"IfcCompoundPlaneAngleMeasure: seconds component must be in [-60, 60).",
	);
});

// Real source: `(a >= 0 and b >= 0 and (c >= 0)) or (a <= 0 and b <= 0 and (c <= 0))`
// where a/b/c are the degrees/minutes/seconds components -- all 3 components must
// share the same sign (or be zero).
const IfcCompoundPlaneAngleMeasure_WR4 = typeRule("IfcCompoundPlaneAngleMeasure", "WR4", (self: number[]) => {
	const a = expressGetItem(self, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	const b = expressGetItem(self, 2 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	const c = expressGetItem(self, 3 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE) as number;
	assertWhereRule(
		(a >= 0 && b >= 0 && c >= 0) || (a <= 0 && b <= 0 && c <= 0),
		"IfcCompoundPlaneAngleMeasure: degrees/minutes/seconds components must share the same sign.",
	);
});

const IfcDaylightSavingHour_WR1 = typeRule("IfcDaylightSavingHour", "WR1", (self: number) => {
	assertWhereRule(0 <= self && self <= 2, "IfcDaylightSavingHour must be in [0, 2].");
});

const IfcDimensionCount_WR1 = typeRule("IfcDimensionCount", "WR1", (self: number) => {
	assertWhereRule(0 < self && self <= 3, "IfcDimensionCount must be in (0, 3].");
});

const IfcFontStyle_WR1 = typeRule("IfcFontStyle", "WR1", (self: string) => {
	assertWhereRule(
		["normal", "italic", "oblique"].includes(self.toLowerCase()),
		"IfcFontStyle must be one of 'normal', 'italic', 'oblique' (case-insensitive).",
	);
});

const IfcFontVariant_WR1 = typeRule("IfcFontVariant", "WR1", (self: string) => {
	assertWhereRule(
		["normal", "small-caps"].includes(self.toLowerCase()),
		"IfcFontVariant must be one of 'normal', 'small-caps' (case-insensitive).",
	);
});

const IfcFontWeight_WR1 = typeRule("IfcFontWeight", "WR1", (self: string) => {
	assertWhereRule(
		["normal", "small-caps", "100", "200", "300", "400", "500", "600", "700", "800", "900"].includes(
			self.toLowerCase(),
		),
		"IfcFontWeight must be one of the documented keyword/numeric-weight values (case-insensitive).",
	);
});

const IfcHeatingValueMeasure_WR1 = typeRule("IfcHeatingValueMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcHeatingValueMeasure must be greater than 0.");
});

const IfcHourInDay_WR1 = typeRule("IfcHourInDay", "WR1", (self: number) => {
	assertWhereRule(0 <= self && self < 24, "IfcHourInDay must be in [0, 24).");
});

const IfcMinuteInHour_WR1 = typeRule("IfcMinuteInHour", "WR1", (self: number) => {
	assertWhereRule(0 <= self && self <= 59, "IfcMinuteInHour must be in [0, 59].");
});

const IfcMonthInYearNumber_WR1 = typeRule("IfcMonthInYearNumber", "WR1", (self: number) => {
	assertWhereRule(1 <= self && self <= 12, "IfcMonthInYearNumber must be in [1, 12].");
});

const IfcNormalisedRatioMeasure_WR1 = typeRule("IfcNormalisedRatioMeasure", "WR1", (self: number) => {
	assertWhereRule(0.0 <= self && self <= 1.0, "IfcNormalisedRatioMeasure must be in [0, 1].");
});

const IfcPHMeasure_WR21 = typeRule("IfcPHMeasure", "WR21", (self: number) => {
	assertWhereRule(0.0 <= self && self <= 14.0, "IfcPHMeasure must be in [0, 14].");
});

const IfcPositiveLengthMeasure_WR1 = typeRule("IfcPositiveLengthMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcPositiveLengthMeasure must be greater than 0.");
});

const IfcPositivePlaneAngleMeasure_WR1 = typeRule("IfcPositivePlaneAngleMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcPositivePlaneAngleMeasure must be greater than 0.");
});

const IfcPositiveRatioMeasure_WR1 = typeRule("IfcPositiveRatioMeasure", "WR1", (self: number) => {
	assertWhereRule(self > 0.0, "IfcPositiveRatioMeasure must be greater than 0.");
});

const IfcSecondInMinute_WR1 = typeRule("IfcSecondInMinute", "WR1", (self: number) => {
	assertWhereRule(0.0 <= self && self < 60.0, "IfcSecondInMinute must be in [0, 60).");
});

const IfcSpecularRoughness_WR1 = typeRule("IfcSpecularRoughness", "WR1", (self: number) => {
	assertWhereRule(0.0 <= self && self <= 1.0, "IfcSpecularRoughness must be in [0, 1].");
});

const IfcTextAlignment_WR1 = typeRule("IfcTextAlignment", "WR1", (self: string) => {
	assertWhereRule(
		["left", "right", "center", "justify"].includes(self.toLowerCase()),
		"IfcTextAlignment must be one of 'left', 'right', 'center', 'justify' (case-insensitive).",
	);
});

const IfcTextDecoration_WR1 = typeRule("IfcTextDecoration", "WR1", (self: string) => {
	assertWhereRule(
		["none", "underline", "overline", "line-through", "blink"].includes(self.toLowerCase()),
		"IfcTextDecoration must be one of the 5 documented decoration keywords (case-insensitive).",
	);
});

const IfcTextTransformation_WR1 = typeRule("IfcTextTransformation", "WR1", (self: string) => {
	assertWhereRule(
		["capitalize", "uppercase", "lowercase", "none"].includes(self.toLowerCase()),
		"IfcTextTransformation must be one of 'capitalize', 'uppercase', 'lowercase', 'none' (case-insensitive).",
	);
});

// =============================================================================
// SCOPE = 'entity' rules (real source lines 3804-4283, the first 46 in this schema).
// =============================================================================

// `Ifc2DCompositeCurve_WR1` (line 3804): `ClosedCurve` is a DERIVE boolean (`calc_
// IfcCompositeCurve_ClosedCurve`, already ported by Phase EX-2) -- read via
// `expressGetAttr` and asserted directly (a `Tri`: boolean or `INDETERMINATE`).
const Ifc2DCompositeCurve_WR1 = entityRule("Ifc2DCompositeCurve", "WR1", (self) => {
	const closedCurve = expressGetAttr(self, "ClosedCurve", INDETERMINATE) as Tri;
	assertWhereRule(closedCurve, "Ifc2DCompositeCurve must be a closed curve (ClosedCurve must not be FALSE).");
});

// `Ifc2DCompositeCurve_WR2` (line 3813): `Dim` (DERIVE, `calc_IfcCurve_Dim`, already
// ported) must equal 2.
const Ifc2DCompositeCurve_WR2 = entityRule("Ifc2DCompositeCurve", "WR2", (self) => {
	const dim = expressGetAttr(self, "Dim", INDETERMINATE);
	assertWhereRule(triEq(dim, 2), "Ifc2DCompositeCurve.Dim must equal 2.");
});

// `IfcActorRole_WR1` (line 3822): `Role != USERDEFINED or (Role == USERDEFINED and
// exists(UserDefinedRole))`.
const IfcActorRole_WR1 = entityRule("IfcActorRole", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "Role", "UserDefinedRole"),
		"IfcActorRole: if Role is USERDEFINED, UserDefinedRole must be given.",
	);
});

// `IfcAddress_WR1` (line 3832): `not exists(Purpose) or (Purpose != USERDEFINED or
// (Purpose == USERDEFINED and exists(UserDefinedPurpose)))`.
const IfcAddress_WR1 = entityRule("IfcAddress", "WR1", (self) => {
	const purpose = expressGetAttr(self, "Purpose", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(purpose), () => userDefinedOrHasAttribute(self, "Purpose", "UserDefinedPurpose")),
		"IfcAddress: if Purpose is given and USERDEFINED, UserDefinedPurpose must be given.",
	);
});

// `IfcAirTerminalBoxType_WR1` (line 3842).
const IfcAirTerminalBoxType_WR1 = entityRule("IfcAirTerminalBoxType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcAirTerminalBoxType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcAirTerminalType_WR1` (line 3852).
const IfcAirTerminalType_WR1 = entityRule("IfcAirTerminalType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcAirTerminalType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcAirToAirHeatRecoveryType_WR1` (line 3862).
const IfcAirToAirHeatRecoveryType_WR1 = entityRule("IfcAirToAirHeatRecoveryType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcAirToAirHeatRecoveryType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcAnnotationCurveOccurrence_WR31` (line 3872): `not exists(Item) or
// 'ifc2x3.ifccurve' in typeof(Item)`.
const IfcAnnotationCurveOccurrence_WR31 = entityRule("IfcAnnotationCurveOccurrence", "WR31", (self) => {
	const item = expressGetAttr(self, "Item", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(item), () => typeOfAttr(item).has("ifc2x3.ifccurve")),
		"IfcAnnotationCurveOccurrence: if Item is given, it must be an IfcCurve.",
	);
});

// `IfcAnnotationFillAreaOccurrence_WR31` (line 3881).
const IfcAnnotationFillAreaOccurrence_WR31 = entityRule("IfcAnnotationFillAreaOccurrence", "WR31", (self) => {
	const item = expressGetAttr(self, "Item", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(item), () => typeOfAttr(item).has("ifc2x3.ifcannotationfillarea")),
		"IfcAnnotationFillAreaOccurrence: if Item is given, it must be an IfcAnnotationFillArea.",
	);
});

// `IfcAnnotationSurface_WR01` (line 3890): `sizeof([six named surface/solid types] *
// typeof(Item)) >= 1`.
const IfcAnnotationSurface_WR01 = entityRule("IfcAnnotationSurface", "WR01", (self) => {
	const item = expressGetAttr(self, "Item", INDETERMINATE);
	const count = typeOfAttr(item).multiply([
		"ifc2x3.ifcsurface",
		"ifc2x3.ifcshellbasedsurfacemodel",
		"ifc2x3.ifcfacebasedsurfacemodel",
		"ifc2x3.ifcsolidmodel",
		"ifc2x3.ifcbooleanresult",
		"ifc2x3.ifccsgprimitive3d",
	]).size;
	assertWhereRule(
		count >= 1,
		"IfcAnnotationSurface.Item must be one of IfcSurface/IfcShellBasedSurfaceModel/IfcFaceBasedSurfaceModel/IfcSolidModel/IfcBooleanResult/IfcCsgPrimitive3D.",
	);
});

// `IfcAnnotationSurfaceOccurrence_WR31` (line 3900): `not exists(Item) or
// sizeof([four named types] * typeof(Item)) > 0`.
const IfcAnnotationSurfaceOccurrence_WR31 = entityRule("IfcAnnotationSurfaceOccurrence", "WR31", (self) => {
	const item = expressGetAttr(self, "Item", INDETERMINATE);
	assertWhereRule(
		pyOr(
			!exists(item),
			() =>
				typeOfAttr(item).multiply([
					"ifc2x3.ifcsurface",
					"ifc2x3.ifcfacebasedsurfacemodel",
					"ifc2x3.ifcshellbasedsurfacemodel",
					"ifc2x3.ifcsolidmodel",
				]).size > 0,
		),
		"IfcAnnotationSurfaceOccurrence: if Item is given, it must be one of IfcSurface/IfcFaceBasedSurfaceModel/IfcShellBasedSurfaceModel/IfcSolidModel.",
	);
});

// `IfcAnnotationSymbolOccurrence_WR31` (line 3909).
const IfcAnnotationSymbolOccurrence_WR31 = entityRule("IfcAnnotationSymbolOccurrence", "WR31", (self) => {
	const item = expressGetAttr(self, "Item", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(item), () => typeOfAttr(item).has("ifc2x3.ifcdefinedsymbol")),
		"IfcAnnotationSymbolOccurrence: if Item is given, it must be an IfcDefinedSymbol.",
	);
});

// `IfcAnnotationTextOccurrence_WR31` (line 3918).
const IfcAnnotationTextOccurrence_WR31 = entityRule("IfcAnnotationTextOccurrence", "WR31", (self) => {
	const item = expressGetAttr(self, "Item", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(item), () => typeOfAttr(item).has("ifc2x3.ifctextliteral")),
		"IfcAnnotationTextOccurrence: if Item is given, it must be an IfcTextLiteral.",
	);
});

// `IfcAppliedValue_WR1` (line 3927): `exists(AppliedValue) or exists(ValueOfComponents)`.
// **Disclosed finding, confirmed empirically (`test/express/whereRules/ifc2x3.test.ts`
// has the full writeup)**: `ValueOfComponents` is the INVERSE side of `IfcAppliedValue
// Relationship.ComponentOfTotal`, not a forward attribute -- an unrelated instance's own
// `ValueOfComponents` reads back as an EMPTY ARRAY, not `null`/`INDETERMINATE`, and
// `exists([])` is `true` (EXPRESS's own `EXISTS()` means "is this attribute present at
// all", not "is it non-empty") -- true in real Python too (an empty INVERSE aggregate is
// an empty tuple there, never `None`). This rule is therefore, faithfully, essentially
// never violated via the `ValueOfComponents` disjunct in practice.
const IfcAppliedValue_WR1 = entityRule("IfcAppliedValue", "WR1", (self) => {
	const appliedValue = expressGetAttr(self, "AppliedValue", INDETERMINATE);
	const valueOfComponents = expressGetAttr(self, "ValueOfComponents", INDETERMINATE);
	assertWhereRule(
		exists(appliedValue) || exists(valueOfComponents),
		"IfcAppliedValue: either AppliedValue or ValueOfComponents must be given.",
	);
});

// `IfcArbitraryClosedProfileDef_WR1` (line 3938): `OuterCurve.Dim == 2`.
const IfcArbitraryClosedProfileDef_WR1 = entityRule("IfcArbitraryClosedProfileDef", "WR1", (self) => {
	const outerCurve = expressGetAttr(self, "OuterCurve", INDETERMINATE);
	const dim = expressGetAttr(outerCurve, "Dim", INDETERMINATE);
	assertWhereRule(triEq(dim, 2), "IfcArbitraryClosedProfileDef.OuterCurve.Dim must equal 2.");
});

// `IfcArbitraryClosedProfileDef_WR2` (line 3948): `not 'ifc2x3.ifcline' in typeof(OuterCurve)`.
const IfcArbitraryClosedProfileDef_WR2 = entityRule("IfcArbitraryClosedProfileDef", "WR2", (self) => {
	const outerCurve = expressGetAttr(self, "OuterCurve", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(outerCurve).has("ifc2x3.ifcline"),
		"IfcArbitraryClosedProfileDef.OuterCurve must not be an IfcLine.",
	);
});

// `IfcArbitraryClosedProfileDef_WR3` (line 3958): `not 'ifc2x3.ifcoffsetcurve2d' in typeof(OuterCurve)`.
const IfcArbitraryClosedProfileDef_WR3 = entityRule("IfcArbitraryClosedProfileDef", "WR3", (self) => {
	const outerCurve = expressGetAttr(self, "OuterCurve", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(outerCurve).has("ifc2x3.ifcoffsetcurve2d"),
		"IfcArbitraryClosedProfileDef.OuterCurve must not be an IfcOffsetCurve2D.",
	);
});

// `IfcArbitraryOpenProfileDef_WR11` (line 3968): `'ifc2x3.ifccenterlineprofiledef' in
// typeof(self) or ProfileType == CURVE`.
const IfcArbitraryOpenProfileDef_WR11 = entityRule("IfcArbitraryOpenProfileDef", "WR11", (self) => {
	const profileType = expressGetAttr(self, "ProfileType", INDETERMINATE);
	assertWhereRule(
		pyOr(typeOfAttr(self).has("ifc2x3.ifccenterlineprofiledef"), () => triEq(profileType, "CURVE")),
		"IfcArbitraryOpenProfileDef: must be an IfcCenterLineProfileDef, or ProfileType must be CURVE.",
	);
});

// `IfcArbitraryOpenProfileDef_WR12` (line 3977): `Curve.Dim == 2`.
const IfcArbitraryOpenProfileDef_WR12 = entityRule("IfcArbitraryOpenProfileDef", "WR12", (self) => {
	const curve = expressGetAttr(self, "Curve", INDETERMINATE);
	const dim = expressGetAttr(curve, "Dim", INDETERMINATE);
	assertWhereRule(triEq(dim, 2), "IfcArbitraryOpenProfileDef.Curve.Dim must equal 2.");
});

// `IfcArbitraryProfileDefWithVoids_WR1` (line 3987): `ProfileType == AREA`.
const IfcArbitraryProfileDefWithVoids_WR1 = entityRule("IfcArbitraryProfileDefWithVoids", "WR1", (self) => {
	const profileType = expressGetAttr(self, "ProfileType", INDETERMINATE);
	assertWhereRule(triEq(profileType, "AREA"), "IfcArbitraryProfileDefWithVoids.ProfileType must be AREA.");
});

// `IfcArbitraryProfileDefWithVoids_WR2` (line 3996): `sizeof([temp for temp in
// InnerCurves if temp.Dim != 2]) == 0`.
const IfcArbitraryProfileDefWithVoids_WR2 = entityRule("IfcArbitraryProfileDefWithVoids", "WR2", (self) => {
	const innerCurves = expressGetAttr(self, "InnerCurves", INDETERMINATE);
	const items = isIndeterminate(innerCurves) ? [] : (innerCurves as EntityInstance[]);
	const violating = items.filter((temp) => triNe(expressGetAttr(temp, "Dim", INDETERMINATE), 2) === true).length;
	assertWhereRule(violating === 0, "IfcArbitraryProfileDefWithVoids: every InnerCurves member must have Dim == 2.");
});

// `IfcArbitraryProfileDefWithVoids_WR3` (line 4006): `sizeof([temp for temp in
// InnerCurves if 'ifc2x3.ifcline' in typeof(temp)]) == 0`.
const IfcArbitraryProfileDefWithVoids_WR3 = entityRule("IfcArbitraryProfileDefWithVoids", "WR3", (self) => {
	const innerCurves = expressGetAttr(self, "InnerCurves", INDETERMINATE);
	const items = isIndeterminate(innerCurves) ? [] : (innerCurves as EntityInstance[]);
	const violating = items.filter((temp) => typeOfAttr(temp).has("ifc2x3.ifcline")).length;
	assertWhereRule(violating === 0, "IfcArbitraryProfileDefWithVoids: no InnerCurves member may be an IfcLine.");
});

// `IfcAsset_WR1` (line 4016): `sizeof([temp for temp in IsGroupedBy.RelatedObjects if
// not 'ifc2x3.ifcelement' in typeof(temp)]) == 0`. `IsGroupedBy` is a single-valued
// INVERSE here (`settings.unpackNonAggregateInverses` is toggled `true` for the whole
// rule-execution pass, `ruleExecutor.ts`), matching real Python's own identical setting.
const IfcAsset_WR1 = entityRule("IfcAsset", "WR1", (self) => {
	const isGroupedBy = expressGetAttr(self, "IsGroupedBy", INDETERMINATE);
	const relatedObjects = expressGetAttr(isGroupedBy, "RelatedObjects", INDETERMINATE);
	const items = isIndeterminate(relatedObjects) ? [] : (relatedObjects as EntityInstance[]);
	const violating = items.filter((temp) => !typeOfAttr(temp).has("ifc2x3.ifcelement")).length;
	assertWhereRule(violating === 0, "IfcAsset: every member of IsGroupedBy.RelatedObjects must be an IfcElement.");
});

// `IfcAxis1Placement_WR1` (line 4025): `not exists(Axis) or Axis.Dim == 3`.
const IfcAxis1Placement_WR1 = entityRule("IfcAxis1Placement", "WR1", (self) => {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis), () => triEq(expressGetAttr(axis, "Dim", INDETERMINATE), 3)),
		"IfcAxis1Placement: if Axis is given, its Dim must equal 3.",
	);
});

// `IfcAxis1Placement_WR2` (line 4035): `Location.Dim == 3`.
const IfcAxis1Placement_WR2 = entityRule("IfcAxis1Placement", "WR2", (self) => {
	const location = expressGetAttr(self, "Location", INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(location, "Dim", INDETERMINATE), 3),
		"IfcAxis1Placement.Location.Dim must equal 3.",
	);
});

// `IfcAxis2Placement2D_WR1` (line 4048): `not exists(RefDirection) or RefDirection.Dim == 2`.
const IfcAxis2Placement2D_WR1 = entityRule("IfcAxis2Placement2D", "WR1", (self) => {
	const refDirection = expressGetAttr(self, "RefDirection", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(refDirection), () => triEq(expressGetAttr(refDirection, "Dim", INDETERMINATE), 2)),
		"IfcAxis2Placement2D: if RefDirection is given, its Dim must equal 2.",
	);
});

// `IfcAxis2Placement2D_WR2` (line 4058): `Location.Dim == 2`.
const IfcAxis2Placement2D_WR2 = entityRule("IfcAxis2Placement2D", "WR2", (self) => {
	const location = expressGetAttr(self, "Location", INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(location, "Dim", INDETERMINATE), 2),
		"IfcAxis2Placement2D.Location.Dim must equal 2.",
	);
});

// `IfcAxis2Placement3D_WR1` (line 4071): `Location.Dim == 3`.
const IfcAxis2Placement3D_WR1 = entityRule("IfcAxis2Placement3D", "WR1", (self) => {
	const location = expressGetAttr(self, "Location", INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(location, "Dim", INDETERMINATE), 3),
		"IfcAxis2Placement3D.Location.Dim must equal 3.",
	);
});

// `IfcAxis2Placement3D_WR2` (line 4080): `not exists(Axis) or Axis.Dim == 3`.
const IfcAxis2Placement3D_WR2 = entityRule("IfcAxis2Placement3D", "WR2", (self) => {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis), () => triEq(expressGetAttr(axis, "Dim", INDETERMINATE), 3)),
		"IfcAxis2Placement3D: if Axis is given, its Dim must equal 3.",
	);
});

// `IfcAxis2Placement3D_WR3` (line 4090): `not exists(RefDirection) or RefDirection.Dim == 3`.
const IfcAxis2Placement3D_WR3 = entityRule("IfcAxis2Placement3D", "WR3", (self) => {
	const refDirection = expressGetAttr(self, "RefDirection", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(refDirection), () => triEq(expressGetAttr(refDirection, "Dim", INDETERMINATE), 3)),
		"IfcAxis2Placement3D: if RefDirection is given, its Dim must equal 3.",
	);
});

// `IfcAxis2Placement3D_WR4` (line 4100): `not exists(Axis) or not exists(RefDirection)
// or IfcCrossProduct(Axis, RefDirection).Magnitude > 0.0`.
const IfcAxis2Placement3D_WR4 = entityRule("IfcAxis2Placement3D", "WR4", (self) => {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	const refDirection = expressGetAttr(self, "RefDirection", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis), () =>
			pyOr(!exists(refDirection), () =>
				triGt(expressGetAttr(ifcCrossProduct(axis, refDirection), "Magnitude", INDETERMINATE), 0.0),
			),
		),
		"IfcAxis2Placement3D: Axis and RefDirection must not be parallel (their cross product must have positive magnitude).",
	);
});

// `IfcAxis2Placement3D_WR5` (line 4111): `not exists(Axis) ^ exists(RefDirection)`.
// Python operator precedence: `^` binds tighter than `not`, so this parses as `not
// (exists(Axis) ^ exists(RefDirection))` -- an XNOR: either both Axis and RefDirection
// are given, or neither is. `exists()` always returns a definite boolean (never `Tri`),
// so this reduces to a plain equality check with no indeterminacy concern.
const IfcAxis2Placement3D_WR5 = entityRule("IfcAxis2Placement3D", "WR5", (self) => {
	const axis = expressGetAttr(self, "Axis", INDETERMINATE);
	const refDirection = expressGetAttr(self, "RefDirection", INDETERMINATE);
	assertWhereRule(
		exists(axis) === exists(refDirection),
		"IfcAxis2Placement3D: Axis and RefDirection must either both be given or both be omitted.",
	);
});

// `IfcBSplineCurve_WR41` (line 4127): `sizeof([temp for temp in ControlPointsList if
// temp.Dim != ControlPointsList[0].Dim]) == 0`.
const IfcBSplineCurve_WR41 = entityRule("IfcBSplineCurve", "WR41", (self) => {
	const controlPointsList = expressGetAttr(self, "ControlPointsList", INDETERMINATE);
	const list = isIndeterminate(controlPointsList) ? [] : (controlPointsList as EntityInstance[]);
	const first = expressGetItem(list, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const firstDim = expressGetAttr(first, "Dim", INDETERMINATE);
	const violating = list.filter((temp) => triNe(expressGetAttr(temp, "Dim", INDETERMINATE), firstDim) === true).length;
	assertWhereRule(
		violating === 0,
		"IfcBSplineCurve: every ControlPointsList member must share the first member's Dim.",
	);
});

// `IfcBlobTexture_WR11` (line 4146): `RasterFormat.lower() in ['bmp','jpg','gif','png']`.
const IfcBlobTexture_WR11 = entityRule("IfcBlobTexture", "WR11", (self) => {
	const rasterFormat = expressGetAttr(self, "RasterFormat", INDETERMINATE) as string;
	assertWhereRule(
		["bmp", "jpg", "gif", "png"].includes(rasterFormat.toLowerCase()),
		"IfcBlobTexture.RasterFormat must be one of 'bmp', 'jpg', 'gif', 'png' (case-insensitive).",
	);
});

// `IfcBoilerType_WR1` (line 4155).
const IfcBoilerType_WR1 = entityRule("IfcBoilerType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcBoilerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcBooleanClippingResult_WR1` (line 4165): `'ifc2x3.ifcsweptareasolid' in
// typeof(FirstOperand) or 'ifc2x3.ifcbooleanclippingresult' in typeof(FirstOperand)`.
const IfcBooleanClippingResult_WR1 = entityRule("IfcBooleanClippingResult", "WR1", (self) => {
	const firstOperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	assertWhereRule(
		typeOfAttr(firstOperand).has("ifc2x3.ifcsweptareasolid") ||
			typeOfAttr(firstOperand).has("ifc2x3.ifcbooleanclippingresult"),
		"IfcBooleanClippingResult.FirstOperand must be an IfcSweptAreaSolid or IfcBooleanClippingResult.",
	);
});

// `IfcBooleanClippingResult_WR2` (line 4175): `'ifc2x3.ifchalfspacesolid' in typeof(SecondOperand)`.
const IfcBooleanClippingResult_WR2 = entityRule("IfcBooleanClippingResult", "WR2", (self) => {
	const secondOperand = expressGetAttr(self, "SecondOperand", INDETERMINATE);
	assertWhereRule(
		typeOfAttr(secondOperand).has("ifc2x3.ifchalfspacesolid"),
		"IfcBooleanClippingResult.SecondOperand must be an IfcHalfSpaceSolid.",
	);
});

// `IfcBooleanClippingResult_WR3` (line 4185): `Operator == DIFFERENCE`.
const IfcBooleanClippingResult_WR3 = entityRule("IfcBooleanClippingResult", "WR3", (self) => {
	const operator = expressGetAttr(self, "Operator", INDETERMINATE);
	assertWhereRule(triEq(operator, "DIFFERENCE"), "IfcBooleanClippingResult.Operator must be DIFFERENCE.");
});

// `IfcBooleanResult_WR1` (line 4195): `FirstOperand.Dim == SecondOperand.Dim`.
const IfcBooleanResult_WR1 = entityRule("IfcBooleanResult", "WR1", (self) => {
	const firstOperand = expressGetAttr(self, "FirstOperand", INDETERMINATE);
	const secondOperand = expressGetAttr(self, "SecondOperand", INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(firstOperand, "Dim", INDETERMINATE), expressGetAttr(secondOperand, "Dim", INDETERMINATE)),
		"IfcBooleanResult: FirstOperand.Dim must equal SecondOperand.Dim.",
	);
});

// `IfcBoxedHalfSpace_WR1` (line 4213): `not 'ifc2x3.ifccurveboundedplane' in typeof(BaseSurface)`.
const IfcBoxedHalfSpace_WR1 = entityRule("IfcBoxedHalfSpace", "WR1", (self) => {
	const baseSurface = expressGetAttr(self, "BaseSurface", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(baseSurface).has("ifc2x3.ifccurveboundedplane"),
		"IfcBoxedHalfSpace.BaseSurface must not be an IfcCurveBoundedPlane.",
	);
});

// `IfcBuildingElementProxy_WR1` (line 4222): `exists(Name)`.
const IfcBuildingElementProxy_WR1 = entityRule("IfcBuildingElementProxy", "WR1", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	assertWhereRule(exists(name), "IfcBuildingElementProxy.Name must be given.");
});

// `IfcCShapeProfileDef_WR1` (line 4231): `Girth < Depth / 2.0`.
const IfcCShapeProfileDef_WR1 = entityRule("IfcCShapeProfileDef", "WR1", (self) => {
	const depth = expressGetAttr(self, "Depth", INDETERMINATE);
	const girth = expressGetAttr(self, "Girth", INDETERMINATE);
	assertWhereRule(triLt(girth, triDiv(depth, 2.0)), "IfcCShapeProfileDef.Girth must be less than half of Depth.");
});

// `IfcCShapeProfileDef_WR2` (line 4242): `not exists(InternalFilletRadius) or
// (InternalFilletRadius <= Width / 2.0 and InternalFilletRadius <= Depth / 2.0)`.
const IfcCShapeProfileDef_WR2 = entityRule("IfcCShapeProfileDef", "WR2", (self) => {
	const depth = expressGetAttr(self, "Depth", INDETERMINATE);
	const width = expressGetAttr(self, "Width", INDETERMINATE);
	const internalFilletRadius = expressGetAttr(self, "InternalFilletRadius", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(internalFilletRadius), () =>
			pyAnd(triLe(internalFilletRadius, triDiv(width, 2.0)), () => triLe(internalFilletRadius, triDiv(depth, 2.0))),
		),
		"IfcCShapeProfileDef: if InternalFilletRadius is given, it must be at most half of both Width and Depth.",
	);
});

// `IfcCShapeProfileDef_WR3` (line 4254): `WallThickness < Width / 2.0 and WallThickness
// < Depth / 2.0`.
const IfcCShapeProfileDef_WR3 = entityRule("IfcCShapeProfileDef", "WR3", (self) => {
	const depth = expressGetAttr(self, "Depth", INDETERMINATE);
	const width = expressGetAttr(self, "Width", INDETERMINATE);
	const wallThickness = expressGetAttr(self, "WallThickness", INDETERMINATE);
	assertWhereRule(
		pyAnd(triLt(wallThickness, triDiv(width, 2.0)), () => triLt(wallThickness, triDiv(depth, 2.0))),
		"IfcCShapeProfileDef.WallThickness must be less than half of both Width and Depth.",
	);
});

// `IfcCableCarrierFittingType_WR1` (line 4266).
const IfcCableCarrierFittingType_WR1 = entityRule("IfcCableCarrierFittingType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcCableCarrierFittingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCalendarDate_WR21` (line 4276): `IfcValidCalendarDate(self)`.
const IfcCalendarDate_WR21 = entityRule("IfcCalendarDate", "WR21", (self) => {
	assertWhereRule(ifcValidCalendarDate(self), "IfcCalendarDate does not represent a valid calendar date.");
});

registerSchemaRules("IFC2X3", [
	IfcBoxAlignment_WR1,
	IfcCompoundPlaneAngleMeasure_WR1,
	IfcCompoundPlaneAngleMeasure_WR2,
	IfcCompoundPlaneAngleMeasure_WR3,
	IfcCompoundPlaneAngleMeasure_WR4,
	IfcDaylightSavingHour_WR1,
	IfcDimensionCount_WR1,
	IfcFontStyle_WR1,
	IfcFontVariant_WR1,
	IfcFontWeight_WR1,
	IfcHeatingValueMeasure_WR1,
	IfcHourInDay_WR1,
	IfcMinuteInHour_WR1,
	IfcMonthInYearNumber_WR1,
	IfcNormalisedRatioMeasure_WR1,
	IfcPHMeasure_WR21,
	IfcPositiveLengthMeasure_WR1,
	IfcPositivePlaneAngleMeasure_WR1,
	IfcPositiveRatioMeasure_WR1,
	IfcSecondInMinute_WR1,
	IfcSpecularRoughness_WR1,
	IfcTextAlignment_WR1,
	IfcTextDecoration_WR1,
	IfcTextTransformation_WR1,
	Ifc2DCompositeCurve_WR1,
	Ifc2DCompositeCurve_WR2,
	IfcActorRole_WR1,
	IfcAddress_WR1,
	IfcAirTerminalBoxType_WR1,
	IfcAirTerminalType_WR1,
	IfcAirToAirHeatRecoveryType_WR1,
	IfcAnnotationCurveOccurrence_WR31,
	IfcAnnotationFillAreaOccurrence_WR31,
	IfcAnnotationSurface_WR01,
	IfcAnnotationSurfaceOccurrence_WR31,
	IfcAnnotationSymbolOccurrence_WR31,
	IfcAnnotationTextOccurrence_WR31,
	IfcAppliedValue_WR1,
	IfcArbitraryClosedProfileDef_WR1,
	IfcArbitraryClosedProfileDef_WR2,
	IfcArbitraryClosedProfileDef_WR3,
	IfcArbitraryOpenProfileDef_WR11,
	IfcArbitraryOpenProfileDef_WR12,
	IfcArbitraryProfileDefWithVoids_WR1,
	IfcArbitraryProfileDefWithVoids_WR2,
	IfcArbitraryProfileDefWithVoids_WR3,
	IfcAsset_WR1,
	IfcAxis1Placement_WR1,
	IfcAxis1Placement_WR2,
	IfcAxis2Placement2D_WR1,
	IfcAxis2Placement2D_WR2,
	IfcAxis2Placement3D_WR1,
	IfcAxis2Placement3D_WR2,
	IfcAxis2Placement3D_WR3,
	IfcAxis2Placement3D_WR4,
	IfcAxis2Placement3D_WR5,
	IfcBSplineCurve_WR41,
	IfcBlobTexture_WR11,
	IfcBoilerType_WR1,
	IfcBooleanClippingResult_WR1,
	IfcBooleanClippingResult_WR2,
	IfcBooleanClippingResult_WR3,
	IfcBooleanResult_WR1,
	IfcBoxedHalfSpace_WR1,
	IfcBuildingElementProxy_WR1,
	IfcCShapeProfileDef_WR1,
	IfcCShapeProfileDef_WR2,
	IfcCShapeProfileDef_WR3,
	IfcCableCarrierFittingType_WR1,
	IfcCalendarDate_WR21,
]);
