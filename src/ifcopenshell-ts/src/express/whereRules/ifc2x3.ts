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
import { ifcCrossProduct, ifcDirection, ifcDotProduct } from "../rules/ifc2x3";
import {
	EXPRESS_ONE_BASED_INDEXING,
	ExpressSet,
	INDETERMINATE,
	type Tri,
	assertWhereRule,
	exists,
	expressGetAttr,
	expressGetItem,
	expressRange,
	hiIndex,
	isIndeterminate,
	pyAnd,
	pyNot,
	pyOr,
	sizeof,
	triDiv,
	triEq,
	triGe,
	triGt,
	triLe,
	triLt,
	triNe,
	typeOf,
	usedIn,
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

// =============================================================================
// Phase EX-4 chunk 2 (planning/ifcopenshell-ts/70-express-rules-plan.md): the NEXT 81
// `SCOPE = 'entity'` WHERE-rule classes in `IFC2X3.py`, real file order (lines
// 4285-5148, re-verified directly against that file -- `grep -n "^class Ifc.*_WR"`
// confirms exactly 81 matches in this range, matching the dispatching task brief's own
// citation exactly). Continues directly from chunk 1's own last-ported rule
// (`IfcCalendarDate_WR21`, line 4276) with zero gap or overlap.
//
// **Three new rule-file-local EXPRESS-library helpers ported** (none are `calc_*`
// DERIVE functions or WHERE-rule classes themselves -- same "third bucket" chunk 1's own
// header comment already established for `IfcValidCalendarDate`/`IfcLeapYear`):
// `ifcUniquePropertyName` (`IFC2X3.py` line 8037, used by `IfcComplexProperty_WR22`),
// `ifcLoopHeadToTail` (line 7841, used by `IfcEdgeLoop_WR2`), and
// `ifcCorrectFillAreaStyle` (line 7588, used by `IfcFillAreaStyle_WR13`).
//
// **Two more functions newly exported from `express/rules/ifc2x3.ts`, same precedent as
// chunk 1's own `ifcCrossProduct` export**: `ifcDirection` and `ifcDotProduct` (used
// together by `IfcExtrudedAreaSolid_WR31`, which constructs a scratch `IfcDirection`
// pointing along the global Z axis to dot-product against `ExtrudedDirection`).
//
// **`enum_namespace`/bare-lowercase-enum-identifier substitution, same precedent chunk 1
// already established for `USERDEFINED`, confirmed here by reading real source
// directly** (`IFC2X3.py` lines 150-153): `enum_namespace.__getattr__(k)` is `return
// express_getattr(k, 'upper', INDETERMINATE)()` -- it returns the ACCESSED MEMBER NAME
// itself, uppercased (`k` here is the attribute name being looked up, e.g.
// `'DISCONTINUOUS'`, not a real enum value looked up anywhere). Every bare lowercase
// module-level enum alias this chunk's own rules reference (e.g. `discontinuous =
// IfcTransitionCode.DISCONTINUOUS`, line 1473) therefore resolves to its own uppercased
// name as a plain string (`discontinuous == "DISCONTINUOUS"`), exactly like
// `express_getattr(IfcXxxEnum, 'USERDEFINED', INDETERMINATE) == "USERDEFINED"` -- ported
// below as bare uppercase string literals throughout, never a real enum lookup.
//
// **`IfcDimensionCurveDirectedCallout_WR42` is a confirmed, real, always-passing
// dead rule in BOTH real Python and this port -- verified empirically against BOTH a
// real `ifcopenshell` Python install (0.8.4.post1) and this port's own built native
// addon before writing this, not assumed** (real source lines 4816-4817): the class
// computes `contents = express_getattr(self, 'Contents', INDETERMINATE)` but never reads
// that local -- the actual list comprehension re-fetches `express_getattr(self,
// 'contents', INDETERMINATE)` (all-lowercase attribute NAME). Attribute-name resolution
// in real `entity_instance.__getattr__`/`get_attribute_category` is CASE-SENSITIVE, not
// case-insensitive as this comment originally guessed before checking -- confirmed with a
// throwaway script against the real Python install: `callout.contents` raises
// `AttributeError: ... has no attribute 'contents'`, and `getattr(callout, 'contents',
// default)` therefore returns `default` (Python's own `getattr` catches exactly that
// `AttributeError`). Since `express_getattr`'s own default here is `INDETERMINATE`, and
// `indeterminate_type.__iter__` returns `iter(())` (an empty iterator, confirmed directly
// against this file's own copy of that class body), the list comprehension over
// `express_getattr(self, 'contents', INDETERMINATE)` ALWAYS produces an empty list,
// making `sizeof([...]) <= 2` unconditionally `True` regardless of `self`'s real
// `Contents` -- this WHERE-rule can never actually fail in real Python, full stop. This
// port's own `expressGetAttr` reproduces the identical outcome (confirmed against the
// real built native addon): a lowercase `'contents'` property read throws "has no
// attribute 'contents'" internally, caught by `expressGetAttr`'s own try/catch, returning
// `INDETERMINATE`; `asList(INDETERMINATE)` then collapses to `[]`, same end state.
// **Decision**: ported literally (lowercase, matching real source exactly, dead local not
// reproduced -- JS has no equivalent "assign and discard" no-op) rather than "corrected"
// to read `Contents` -- this preserves the real, always-passing behavior verbatim, per
// this project's verbatim-translation mandate; the test for this rule documents the
// always-pass finding explicitly rather than attempting a doomed failing-case test.
//
// **`IfcCurveStyle_WR11`'s `IfcSizeSelect` (a SELECT of two DEFINED, non-entity types:
// `IfcDescriptiveMeasure`/`IfcPositiveLengthMeasure`) handling, confirmed empirically
// against BOTH the real Python install and this port's own native addon, not assumed**:
// real Python REQUIRES a SELECT-of-defined-types attribute to be assigned an explicit,
// pre-wrapped standalone `entity_instance` (e.g. `f.create_entity('IfcPositiveLengthMeasure',
// 5.0)`) -- assigning a bare Python `float` directly raises `TypeError: attribute
// 'CurveWidth' ... is expecting value of type 'ENTITY INSTANCE', got 'float'` (verified
// directly). Once properly wrapped, `typeof(CurveWidth)` correctly resolves the SELECT's
// chosen branch, exactly as every other SELECT-of-entity-types check elsewhere in this
// file already relies on. **A genuine, disclosed divergence found while verifying this**:
// this port's own attribute SETTER is more permissive than real Python here -- assigning
// a bare JS `number` directly to a `CurveWidth`-shaped attribute is silently ACCEPTED (no
// error) and read back as a bare unwrapped `number`, not a wrapped defined-type instance,
// which would then make `typeOfAttr`/`typeOf` throw (`(5).declaration is not a function`)
// if a caller relied on that shape downstream -- a real, if narrow (SELECT-of-simple-
// types attribute assignment specifically), primitive-layer permissiveness gap, out of
// this chunk's own scope to fix (an `EntityInstance.set()`/Proxy `set` trap concern, not a
// WHERE-rule one). This chunk's own test fixture for `IfcCurveStyle.WR11` uses the
// correct, real-Python-matching wrapped-value construction throughout, not the
// permissively-accepted bare primitive, so the rule's own pass/fail logic is exercised
// faithfully regardless of that separate, disclosed setter gap.
//
// **`IfcFillAreaStyle_WR11` (and the `colour` sub-check inside `IfcCorrectFillAreaStyle`,
// used by `IfcFillAreaStyle_WR13`) is a further CONFIRMED, always-passing dead check in
// BOTH real Python and this port**, same investigation discipline as the two findings
// above: `IfcColour` is a SELECT type (`ifcopenshell_wrapper.select_type`, confirmed
// directly against a real Python install), not an entity, and `typeof()` never walks
// SELECT membership (only entity-supertype / type_declaration chains) -- so
// `'ifc2x3.ifccolour' in typeof(style)` can never be `True` for any real colour instance.
// See `ifcCorrectFillAreaStyle`'s own doc comment (below) for the full writeup.
// =============================================================================

/**
 * Collapses an `INDETERMINATE`/`null`/`undefined` aggregate-attribute read to an empty
 * array -- every list-comprehension-shaped rule below reads a MANDATORY SET/LIST forward
 * attribute (never one that's genuinely optional in the schema), so this only ever
 * matters defensively (e.g. an incomplete test fixture that left a mandatory attribute
 * unset) -- mirrors chunk 1's own repeated inline `isIndeterminate(x) ? [] :
 * (x as EntityInstance[])` idiom, factored into one named helper here purely to cut down
 * repetition across this chunk's own larger rule count.
 */
function asList<T = EntityInstance>(value: unknown): T[] {
	return isIndeterminate(value) ? [] : (value as T[]);
}

const DIMENSION_TYPES = [
	"ifc2x3.ifcangulardimension",
	"ifc2x3.ifcdiameterdimension",
	"ifc2x3.ifclineardimension",
	"ifc2x3.ifcradiusdimension",
];

/**
 * Shared shape repeated verbatim across `IfcDimensionCalloutRelationship_WR12`,
 * `IfcDimensionPair_WR12`, `IfcDimensionPair_WR13` (each: `sizeof(typeof(X) * [4 named
 * dimension types]) == 1`, only the attribute `X` differs) -- Python: `sizeof(typeof(
 * value) * [...]) == 1`.
 */
function exactlyOneDimensionType(value: unknown): boolean {
	return typeOfAttr(value).multiply(DIMENSION_TYPES).size === 1;
}

/**
 * Python: `IfcLoopHeadToTail(aloop)` (`IFC2X3.py` line 7841):
 * ```python
 * def IfcLoopHeadToTail(aloop):
 *     p = True
 *     n = sizeof(express_getattr(aloop, 'EdgeList', INDETERMINATE))
 *     for i in range(2, n + 1):
 *         p = p and express_getattr(express_getitem(express_getattr(aloop, 'EdgeList',
 *             INDETERMINATE), i - 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
 *             'EdgeEnd', INDETERMINATE) == express_getattr(express_getitem(
 *             express_getattr(aloop, 'EdgeList', INDETERMINATE), i -
 *             EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), 'EdgeStart', INDETERMINATE)
 *     return p
 * ```
 * `p = p and (...)` is Python's own short-circuiting `and` (ported via `pyAnd`'s lazy
 * thunk) -- once `p` becomes `false`/`INDETERMINATE`, every subsequent loop iteration's
 * own comparison is never evaluated, matching real Python's own per-iteration
 * re-evaluation of `p and (...)`.
 */
function ifcLoopHeadToTail(aloop: EntityInstance): Tri {
	const edgeList = expressGetAttr(aloop, "EdgeList", INDETERMINATE);
	const n = sizeof(edgeList) as number;
	let p: Tri = true;
	for (const i of expressRange(2, n + 1)) {
		p = pyAnd(p, () =>
			triEq(
				expressGetAttr(
					expressGetItem(edgeList, i - 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
					"EdgeEnd",
					INDETERMINATE,
				),
				expressGetAttr(
					expressGetItem(edgeList, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
					"EdgeStart",
					INDETERMINATE,
				),
			),
		);
	}
	return p;
}

/**
 * Python: `IfcUniquePropertyName(properties)` (`IFC2X3.py` line 8037):
 * ```python
 * def IfcUniquePropertyName(properties):
 *     names = express_set([])
 *     for i in range(1, hiindex(properties) + 1):
 *         names = names + express_getattr(express_getitem(properties, i -
 *             EXPRESS_ONE_BASED_INDEXING, INDETERMINATE), 'Name', INDETERMINATE)
 *     return sizeof(names) == sizeof(properties)
 * ```
 * `names + X` is `express_set.__add__`/`__radd__` (ported via `ExpressSet.plus`, which
 * already dedups via its own `Set`-backed constructor).
 */
function ifcUniquePropertyName(properties: unknown): boolean {
	let names = new ExpressSet<unknown>();
	const n = hiIndex(properties) as number;
	for (const i of expressRange(1, n + 1)) {
		const property = expressGetItem(properties, i - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
		names = names.plus(expressGetAttr(property, "Name", INDETERMINATE));
	}
	return names.size === (sizeof(properties) as number);
}

/**
 * Python: `IfcCorrectFillAreaStyle(styles)` (`IFC2X3.py` line 7588):
 * ```python
 * def IfcCorrectFillAreaStyle(styles):
 *     external = sizeof([style for style in styles if 'ifc2x3.ifcexternallydefinedhatchstyle' in typeof(style)])
 *     hatching = sizeof([style for style in styles if 'ifc2x3.ifcfillareastylehatching' in typeof(style)])
 *     tiles = sizeof([style for style in styles if 'ifc2x3.ifcfillareastyletiles' in typeof(style)])
 *     colour = sizeof([style for style in styles if 'ifc2x3.ifccolour' in typeof(style)])
 *     if external > 1: return False
 *     if external == 1 and (hatching > 0 or tiles > 0 or colour > 0): return False
 *     if colour > 1: return False
 *     if hatching > 0 and tiles > 0: return False
 *     return True
 * ```
 *
 * **`colour`'s own two branches (`colour > 0`/`colour > 1`) are confirmed DEAD CODE in
 * BOTH real Python and this port** -- verified directly against a real ifcopenshell
 * Python install (0.8.4.post1, not assumed): `schema.declaration_by_name("IfcColour")`
 * is a `select_type`, not an `entity`. `typeof()` (this file's own imported `typeOf`,
 * `runtimeShim.ts`) only ever walks an ENTITY's `.supertype()` chain or a
 * `type_declaration`'s `.declared_type()` chain -- it has no SELECT-membership branch at
 * all -- so `'ifc2x3.ifccolour' in typeof(style)` is unconditionally `False` for every
 * real `IfcColourSpecification`/`IfcPreDefinedColour` instance (confirmed with a
 * throwaway script: `typeof(anIfcColourRgbInstance)` is `{'ifc2x3.ifccolourspecification',
 * 'ifc2x3.ifccolourrgb'}`, never including `'ifc2x3.ifccolour'`). `colour` is therefore
 * always `0` here, and in `IfcFillAreaStyle_WR11`'s own identically-shaped check below --
 * ported faithfully (not "fixed" to walk SELECT membership, which real Python's own
 * `typeof()` never does either) per this project's verbatim-translation mandate.
 */
function ifcCorrectFillAreaStyle(styles: unknown): boolean {
	const items = asList(styles);
	const external = items.filter((style) => typeOfAttr(style).has("ifc2x3.ifcexternallydefinedhatchstyle")).length;
	const hatching = items.filter((style) => typeOfAttr(style).has("ifc2x3.ifcfillareastylehatching")).length;
	const tiles = items.filter((style) => typeOfAttr(style).has("ifc2x3.ifcfillareastyletiles")).length;
	const colour = items.filter((style) => typeOfAttr(style).has("ifc2x3.ifccolour")).length;
	if (external > 1) return false;
	if (external === 1 && (hatching > 0 || tiles > 0 || colour > 0)) return false;
	if (colour > 1) return false;
	if (hatching > 0 && tiles > 0) return false;
	return true;
}

/**
 * Shared shape for `IfcConstraintAggregationRelationship_WR11`/
 * `IfcConstraintRelationship_WR11` (`IFC2X3.py` lines 4583/4594, byte-identical bodies):
 * `RelatedConstraints` must not contain `RelatingConstraint`.
 */
function relatedConstraintsExcludeRelating(self: EntityInstance): boolean {
	const relatingConstraint = expressGetAttr(self, "RelatingConstraint", INDETERMINATE);
	const relatedConstraints = asList<EntityInstance>(expressGetAttr(self, "RelatedConstraints", INDETERMINATE));
	return relatedConstraints.filter((temp) => triEq(temp, relatingConstraint) === true).length === 0;
}

/**
 * Shared shape for `IfcConstructionMaterialResource_WR2`/
 * `IfcConstructionProductResource_WR2` (`IFC2X3.py` lines 4614/4632, byte-identical
 * bodies): `not exists(lambda: express_getitem(ResourceOf, 0, INDETERMINATE)) or
 * express_getattr(express_getitem(ResourceOf, 0, INDETERMINATE), 'RelatedObjectsType',
 * INDETERMINATE) == PRODUCT`. `ResourceOf` is an INVERSE (SET) attribute -- always a
 * (possibly empty) array, never `INDETERMINATE`, in real Python and in this port alike --
 * so the real source's `exists(lambda: ...)` guard's eager-vs-lazy distinction is
 * behaviorally identical here (matching this file's own chunk 1 already-established
 * eager-evaluation convention for `expressGetAttr`/`expressGetItem` chains, neither of
 * which can throw).
 */
function resourceOfFirstIsProductType(self: EntityInstance): Tri {
	const resourceOf = expressGetAttr(self, "ResourceOf", INDETERMINATE);
	const first = expressGetItem(resourceOf, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	return pyOr(!exists(first), () => triEq(expressGetAttr(first, "RelatedObjectsType", INDETERMINATE), "PRODUCT"));
}

// =============================================================================
// SCOPE = 'entity' rules, chunk 2 (real source lines 4285-5148, all 81 in this range).
// =============================================================================

// `IfcCartesianPoint_WR1` (line 4285): `hiindex(Coordinates) >= 2`.
const IfcCartesianPoint_WR1 = entityRule("IfcCartesianPoint", "WR1", (self) => {
	const coordinates = expressGetAttr(self, "Coordinates", INDETERMINATE);
	assertWhereRule(triGe(hiIndex(coordinates), 2), "IfcCartesianPoint.Coordinates must have at least 2 components.");
});

// `IfcCartesianTransformationOperator_WR1` (line 4299): `Scl > 0.0`.
const IfcCartesianTransformationOperator_WR1 = entityRule("IfcCartesianTransformationOperator", "WR1", (self) => {
	const scl = expressGetAttr(self, "Scl", INDETERMINATE);
	assertWhereRule(triGt(scl, 0.0), "IfcCartesianTransformationOperator.Scl must be greater than 0.");
});

// `IfcCartesianTransformationOperator2D_WR1..WR3` (lines 4317/4326/4335).
const IfcCartesianTransformationOperator2D_WR1 = entityRule("IfcCartesianTransformationOperator2D", "WR1", (self) => {
	assertWhereRule(
		triEq(expressGetAttr(self, "Dim", INDETERMINATE), 2),
		"IfcCartesianTransformationOperator2D.Dim must equal 2.",
	);
});

const IfcCartesianTransformationOperator2D_WR2 = entityRule("IfcCartesianTransformationOperator2D", "WR2", (self) => {
	const axis1 = expressGetAttr(self, "Axis1", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis1), () => triEq(expressGetAttr(axis1, "Dim", INDETERMINATE), 2)),
		"IfcCartesianTransformationOperator2D: if Axis1 is given, its Dim must equal 2.",
	);
});

const IfcCartesianTransformationOperator2D_WR3 = entityRule("IfcCartesianTransformationOperator2D", "WR3", (self) => {
	const axis2 = expressGetAttr(self, "Axis2", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis2), () => triEq(expressGetAttr(axis2, "Dim", INDETERMINATE), 2)),
		"IfcCartesianTransformationOperator2D: if Axis2 is given, its Dim must equal 2.",
	);
});

// `IfcCartesianTransformationOperator2DnonUniform_WR1` (line 4347): `Scl2 > 0.0`.
const IfcCartesianTransformationOperator2DnonUniform_WR1 = entityRule(
	"IfcCartesianTransformationOperator2DnonUniform",
	"WR1",
	(self) => {
		const scl2 = expressGetAttr(self, "Scl2", INDETERMINATE);
		assertWhereRule(triGt(scl2, 0.0), "IfcCartesianTransformationOperator2DnonUniform.Scl2 must be greater than 0.");
	},
);

// `IfcCartesianTransformationOperator3D_WR1..WR4` (lines 4361/4370/4379/4388).
const IfcCartesianTransformationOperator3D_WR1 = entityRule("IfcCartesianTransformationOperator3D", "WR1", (self) => {
	assertWhereRule(
		triEq(expressGetAttr(self, "Dim", INDETERMINATE), 3),
		"IfcCartesianTransformationOperator3D.Dim must equal 3.",
	);
});

const IfcCartesianTransformationOperator3D_WR2 = entityRule("IfcCartesianTransformationOperator3D", "WR2", (self) => {
	const axis1 = expressGetAttr(self, "Axis1", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis1), () => triEq(expressGetAttr(axis1, "Dim", INDETERMINATE), 3)),
		"IfcCartesianTransformationOperator3D: if Axis1 is given, its Dim must equal 3.",
	);
});

const IfcCartesianTransformationOperator3D_WR3 = entityRule("IfcCartesianTransformationOperator3D", "WR3", (self) => {
	const axis2 = expressGetAttr(self, "Axis2", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis2), () => triEq(expressGetAttr(axis2, "Dim", INDETERMINATE), 3)),
		"IfcCartesianTransformationOperator3D: if Axis2 is given, its Dim must equal 3.",
	);
});

const IfcCartesianTransformationOperator3D_WR4 = entityRule("IfcCartesianTransformationOperator3D", "WR4", (self) => {
	const axis3 = expressGetAttr(self, "Axis3", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(axis3), () => triEq(expressGetAttr(axis3, "Dim", INDETERMINATE), 3)),
		"IfcCartesianTransformationOperator3D: if Axis3 is given, its Dim must equal 3.",
	);
});

// `IfcCartesianTransformationOperator3DnonUniform_WR1/WR2` (lines 4402/4412).
const IfcCartesianTransformationOperator3DnonUniform_WR1 = entityRule(
	"IfcCartesianTransformationOperator3DnonUniform",
	"WR1",
	(self) => {
		const scl2 = expressGetAttr(self, "Scl2", INDETERMINATE);
		assertWhereRule(triGt(scl2, 0.0), "IfcCartesianTransformationOperator3DnonUniform.Scl2 must be greater than 0.");
	},
);

const IfcCartesianTransformationOperator3DnonUniform_WR2 = entityRule(
	"IfcCartesianTransformationOperator3DnonUniform",
	"WR2",
	(self) => {
		const scl3 = expressGetAttr(self, "Scl3", INDETERMINATE);
		assertWhereRule(triGt(scl3, 0.0), "IfcCartesianTransformationOperator3DnonUniform.Scl3 must be greater than 0.");
	},
);

// `IfcChillerType_WR1` (line 4430).
const IfcChillerType_WR1 = entityRule("IfcChillerType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcChillerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCircleHollowProfileDef_WR1` (line 4440): `WallThickness < Radius`.
const IfcCircleHollowProfileDef_WR1 = entityRule("IfcCircleHollowProfileDef", "WR1", (self) => {
	const wallThickness = expressGetAttr(self, "WallThickness", INDETERMINATE);
	const radius = expressGetAttr(self, "Radius", INDETERMINATE);
	assertWhereRule(triLt(wallThickness, radius), "IfcCircleHollowProfileDef.WallThickness must be less than Radius.");
});

// `IfcCoilType_WR1` (line 4450).
const IfcCoilType_WR1 = entityRule("IfcCoilType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcCoilType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcComplexProperty_WR21` (line 4460): `self` must not be a member of its own `HasProperties`.
const IfcComplexProperty_WR21 = entityRule("IfcComplexProperty", "WR21", (self) => {
	const hasProperties = asList<EntityInstance>(expressGetAttr(self, "HasProperties", INDETERMINATE));
	const count = hasProperties.filter((temp) => triEq(self, temp) === true).length;
	assertWhereRule(count === 0, "IfcComplexProperty: HasProperties must not contain the property itself.");
});

// `IfcComplexProperty_WR22` (line 4470): `IfcUniquePropertyName(HasProperties)`.
const IfcComplexProperty_WR22 = entityRule("IfcComplexProperty", "WR22", (self) => {
	const hasProperties = expressGetAttr(self, "HasProperties", INDETERMINATE);
	assertWhereRule(
		ifcUniquePropertyName(hasProperties),
		"IfcComplexProperty.HasProperties must have unique Name values.",
	);
});

// `IfcCompositeCurve_WR41` (line 4480): exactly one segment has Transition DISCONTINUOUS
// unless the curve is closed, in which case none may.
const IfcCompositeCurve_WR41 = entityRule("IfcCompositeCurve", "WR41", (self) => {
	const segments = asList<EntityInstance>(expressGetAttr(self, "Segments", INDETERMINATE));
	const closedCurve = expressGetAttr(self, "ClosedCurve", INDETERMINATE) as Tri;
	const discontinuousCount = segments.filter(
		(temp) => triEq(expressGetAttr(temp, "Transition", INDETERMINATE), "DISCONTINUOUS") === true,
	).length;
	assertWhereRule(
		pyOr(
			pyAnd(pyNot(closedCurve), () => discontinuousCount === 1),
			() => pyAnd(closedCurve, () => discontinuousCount === 0),
		),
		"IfcCompositeCurve: exactly one segment must have Transition DISCONTINUOUS, unless the curve is closed, in which case none may.",
	);
});

// `IfcCompositeCurve_WR42` (line 4491): every segment shares the first segment's Dim.
const IfcCompositeCurve_WR42 = entityRule("IfcCompositeCurve", "WR42", (self) => {
	const segments = expressGetAttr(self, "Segments", INDETERMINATE);
	const list = asList<EntityInstance>(segments);
	const firstDim = expressGetAttr(
		expressGetItem(segments, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
		"Dim",
		INDETERMINATE,
	);
	const violating = list.filter((temp) => triNe(expressGetAttr(temp, "Dim", INDETERMINATE), firstDim) === true).length;
	assertWhereRule(violating === 0, "IfcCompositeCurve: every Segments member must share the first member's Dim.");
});

// `IfcCompositeCurveSegment_WR1` (line 4510): `ParentCurve` must be an `IfcBoundedCurve`.
const IfcCompositeCurveSegment_WR1 = entityRule("IfcCompositeCurveSegment", "WR1", (self) => {
	const parentCurve = expressGetAttr(self, "ParentCurve", INDETERMINATE);
	assertWhereRule(
		typeOfAttr(parentCurve).has("ifc2x3.ifcboundedcurve"),
		"IfcCompositeCurveSegment.ParentCurve must be an IfcBoundedCurve.",
	);
});

// `IfcCompositeProfileDef_WR1` (line 4524): every `Profiles` member shares the first
// member's `ProfileType`.
const IfcCompositeProfileDef_WR1 = entityRule("IfcCompositeProfileDef", "WR1", (self) => {
	const profiles = expressGetAttr(self, "Profiles", INDETERMINATE);
	const list = asList<EntityInstance>(profiles);
	const firstType = expressGetAttr(
		expressGetItem(profiles, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
		"ProfileType",
		INDETERMINATE,
	);
	const violating = list.filter(
		(temp) => triNe(expressGetAttr(temp, "ProfileType", INDETERMINATE), firstType) === true,
	).length;
	assertWhereRule(
		violating === 0,
		"IfcCompositeProfileDef: every Profiles member must share the first member's ProfileType.",
	);
});

// `IfcCompositeProfileDef_WR2` (line 4534): no `Profiles` member may itself be an
// `IfcCompositeProfileDef`.
const IfcCompositeProfileDef_WR2 = entityRule("IfcCompositeProfileDef", "WR2", (self) => {
	const profiles = asList<EntityInstance>(expressGetAttr(self, "Profiles", INDETERMINATE));
	const violating = profiles.filter((temp) => typeOfAttr(temp).has("ifc2x3.ifccompositeprofiledef")).length;
	assertWhereRule(
		violating === 0,
		"IfcCompositeProfileDef: no Profiles member may itself be an IfcCompositeProfileDef.",
	);
});

// `IfcCompressorType_WR1` (line 4544).
const IfcCompressorType_WR1 = entityRule("IfcCompressorType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcCompressorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCondenserType_WR1` (line 4554).
const IfcCondenserType_WR1 = entityRule("IfcCondenserType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcCondenserType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcConditionCriterion_WR1` (line 4564): `exists(Name)`.
const IfcConditionCriterion_WR1 = entityRule("IfcConditionCriterion", "WR1", (self) => {
	assertWhereRule(exists(expressGetAttr(self, "Name", INDETERMINATE)), "IfcConditionCriterion.Name must be given.");
});

// `IfcConstraint_WR11` (line 4573).
const IfcConstraint_WR11 = entityRule("IfcConstraint", "WR11", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "ConstraintGrade", "UserDefinedGrade"),
		"IfcConstraint: if ConstraintGrade is USERDEFINED, UserDefinedGrade must be given.",
	);
});

// `IfcConstraintAggregationRelationship_WR11`/`IfcConstraintRelationship_WR11` (lines
// 4583/4594, byte-identical bodies): see `relatedConstraintsExcludeRelating` above.
const IfcConstraintAggregationRelationship_WR11 = entityRule("IfcConstraintAggregationRelationship", "WR11", (self) => {
	assertWhereRule(
		relatedConstraintsExcludeRelating(self),
		"IfcConstraintAggregationRelationship: RelatedConstraints must not contain RelatingConstraint.",
	);
});

const IfcConstraintRelationship_WR11 = entityRule("IfcConstraintRelationship", "WR11", (self) => {
	assertWhereRule(
		relatedConstraintsExcludeRelating(self),
		"IfcConstraintRelationship: RelatedConstraints must not contain RelatingConstraint.",
	);
});

// `IfcConstructionMaterialResource_WR1` (line 4605): `sizeof(ResourceOf) <= 1`.
const IfcConstructionMaterialResource_WR1 = entityRule("IfcConstructionMaterialResource", "WR1", (self) => {
	const resourceOf = expressGetAttr(self, "ResourceOf", INDETERMINATE);
	assertWhereRule(
		(sizeof(resourceOf) as number) <= 1,
		"IfcConstructionMaterialResource.ResourceOf must have at most 1 member.",
	);
});

// `IfcConstructionMaterialResource_WR2` (line 4614): see `resourceOfFirstIsProductType` above.
const IfcConstructionMaterialResource_WR2 = entityRule("IfcConstructionMaterialResource", "WR2", (self) => {
	assertWhereRule(
		resourceOfFirstIsProductType(self),
		"IfcConstructionMaterialResource: if ResourceOf has a relationship, its RelatedObjectsType must be PRODUCT.",
	);
});

// `IfcConstructionProductResource_WR1` (line 4623): `sizeof(ResourceOf) <= 1`.
const IfcConstructionProductResource_WR1 = entityRule("IfcConstructionProductResource", "WR1", (self) => {
	const resourceOf = expressGetAttr(self, "ResourceOf", INDETERMINATE);
	assertWhereRule(
		(sizeof(resourceOf) as number) <= 1,
		"IfcConstructionProductResource.ResourceOf must have at most 1 member.",
	);
});

// `IfcConstructionProductResource_WR2` (line 4632): see `resourceOfFirstIsProductType` above.
const IfcConstructionProductResource_WR2 = entityRule("IfcConstructionProductResource", "WR2", (self) => {
	assertWhereRule(
		resourceOfFirstIsProductType(self),
		"IfcConstructionProductResource: if ResourceOf has a relationship, its RelatedObjectsType must be PRODUCT.",
	);
});

// `IfcCooledBeamType_WR1` (line 4641).
const IfcCooledBeamType_WR1 = entityRule("IfcCooledBeamType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcCooledBeamType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCoolingTowerType_WR1` (line 4651).
const IfcCoolingTowerType_WR1 = entityRule("IfcCoolingTowerType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcCoolingTowerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcCovering_WR61` (line 4661): `not exists(PredefinedType) or (USERDEFINED shape on
// PredefinedType/ObjectType)`.
const IfcCovering_WR61 = entityRule("IfcCovering", "WR61", (self) => {
	const predefinedType = expressGetAttr(self, "PredefinedType", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(predefinedType), () => userDefinedOrHasAttribute(self, "PredefinedType", "ObjectType")),
		"IfcCovering: if PredefinedType is given and USERDEFINED, ObjectType must be given.",
	);
});

// `IfcCurveStyle_WR11` (line 4681): `CurveWidth` must be unset, an
// `IfcPositiveLengthMeasure`, or an `IfcDescriptiveMeasure` equal to `'by layer'`. See
// this file's own chunk 2 header comment for the SELECT-of-simple-types disclosure.
const IfcCurveStyle_WR11 = entityRule("IfcCurveStyle", "WR11", (self) => {
	const curveWidth = expressGetAttr(self, "CurveWidth", INDETERMINATE);
	assertWhereRule(
		pyOr(!exists(curveWidth), () =>
			pyOr(typeOfAttr(curveWidth).has("ifc2x3.ifcpositivelengthmeasure"), () =>
				pyAnd(typeOfAttr(curveWidth).has("ifc2x3.ifcdescriptivemeasure"), () => triEq(curveWidth, "by layer")),
			),
		),
		"IfcCurveStyle: if CurveWidth is given, it must be an IfcPositiveLengthMeasure, or an IfcDescriptiveMeasure equal to 'by layer'.",
	);
});

// `IfcCurveStyleFontPattern_WR01` (line 4691): `VisibleSegmentLength >= 0.0`.
const IfcCurveStyleFontPattern_WR01 = entityRule("IfcCurveStyleFontPattern", "WR01", (self) => {
	const visibleSegmentLength = expressGetAttr(self, "VisibleSegmentLength", INDETERMINATE);
	assertWhereRule(
		triGe(visibleSegmentLength, 0.0),
		"IfcCurveStyleFontPattern.VisibleSegmentLength must be at least 0.",
	);
});

// `IfcDamperType_WR1` (line 4701).
const IfcDamperType_WR1 = entityRule("IfcDamperType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcDamperType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDerivedProfileDef_WR1` (line 4711): `ProfileType == ParentProfile.ProfileType`.
const IfcDerivedProfileDef_WR1 = entityRule("IfcDerivedProfileDef", "WR1", (self) => {
	const parentProfile = expressGetAttr(self, "ParentProfile", INDETERMINATE);
	assertWhereRule(
		triEq(
			expressGetAttr(self, "ProfileType", INDETERMINATE),
			expressGetAttr(parentProfile, "ProfileType", INDETERMINATE),
		),
		"IfcDerivedProfileDef.ProfileType must equal ParentProfile.ProfileType.",
	);
});

// `IfcDerivedUnit_WR1` (line 4721): more than one Element, or exactly one whose Exponent
// is not 1.
const IfcDerivedUnit_WR1 = entityRule("IfcDerivedUnit", "WR1", (self) => {
	const elements = expressGetAttr(self, "Elements", INDETERMINATE);
	const count = sizeof(elements) as number;
	assertWhereRule(
		pyOr(count > 1, () =>
			pyAnd(count === 1, () =>
				triNe(
					expressGetAttr(
						expressGetItem(elements, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE),
						"Exponent",
						INDETERMINATE,
					),
					1,
				),
			),
		),
		"IfcDerivedUnit.Elements must have more than one element, or exactly one whose Exponent is not 1.",
	);
});

// `IfcDerivedUnit_WR2` (line 4731).
const IfcDerivedUnit_WR2 = entityRule("IfcDerivedUnit", "WR2", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "UnitType", "UserDefinedType"),
		"IfcDerivedUnit: if UnitType is USERDEFINED, UserDefinedType must be given.",
	);
});

// `IfcDimensionCalloutRelationship_WR11` (line 4745): `Name.lower() in ['primary','secondary']`.
const IfcDimensionCalloutRelationship_WR11 = entityRule("IfcDimensionCalloutRelationship", "WR11", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE) as string;
	assertWhereRule(
		["primary", "secondary"].includes(name.toLowerCase()),
		"IfcDimensionCalloutRelationship.Name must be 'primary' or 'secondary' (case-insensitive).",
	);
});

// `IfcDimensionCalloutRelationship_WR12` (line 4754): see `exactlyOneDimensionType` above.
const IfcDimensionCalloutRelationship_WR12 = entityRule("IfcDimensionCalloutRelationship", "WR12", (self) => {
	const relatingDraughtingCallout = expressGetAttr(self, "RelatingDraughtingCallout", INDETERMINATE);
	assertWhereRule(
		exactlyOneDimensionType(relatingDraughtingCallout),
		"IfcDimensionCalloutRelationship.RelatingDraughtingCallout must be exactly one of IfcAngularDimension/IfcDiameterDimension/IfcLinearDimension/IfcRadiusDimension.",
	);
});

// `IfcDimensionCalloutRelationship_WR13` (line 4763): `RelatedDraughtingCallout` must not
// be an `IfcDimensionCurveDirectedCallout`.
const IfcDimensionCalloutRelationship_WR13 = entityRule("IfcDimensionCalloutRelationship", "WR13", (self) => {
	const relatedDraughtingCallout = expressGetAttr(self, "RelatedDraughtingCallout", INDETERMINATE);
	assertWhereRule(
		!typeOfAttr(relatedDraughtingCallout).has("ifc2x3.ifcdimensioncurvedirectedcallout"),
		"IfcDimensionCalloutRelationship.RelatedDraughtingCallout must not be an IfcDimensionCurveDirectedCallout.",
	);
});

// `IfcDimensionCurve_WR51` (line 4772): must be used by at least one
// `IfcDraughtingCallout.Contents`.
const IfcDimensionCurve_WR51 = entityRule("IfcDimensionCurve", "WR51", (self) => {
	assertWhereRule(
		usedIn(self, "ifc2x3.ifcdraughtingcallout.contents").length >= 1,
		"IfcDimensionCurve must be used in at least one IfcDraughtingCallout.Contents.",
	);
});

// `IfcDimensionCurve_WR52` (line 4781): at most one `IfcTerminatorSymbol.AnnotatedCurve`
// user may have Role ORIGIN, and at most one may have Role TARGET.
const IfcDimensionCurve_WR52 = entityRule("IfcDimensionCurve", "WR52", (self) => {
	const terminators = usedIn(self, "ifc2x3.ifcterminatorsymbol.annotatedcurve");
	const originCount = terminators.filter(
		(dct) => triEq(expressGetAttr(dct, "Role", INDETERMINATE), "ORIGIN") === true,
	).length;
	const targetCount = terminators.filter(
		(dct) => triEq(expressGetAttr(dct, "Role", INDETERMINATE), "TARGET") === true,
	).length;
	assertWhereRule(
		originCount <= 1 && targetCount <= 1,
		"IfcDimensionCurve: at most one IfcTerminatorSymbol may have Role ORIGIN, and at most one may have Role TARGET.",
	);
});

// `IfcDimensionCurve_WR53` (line 4790): every `AnnotatedBySymbols` member must be an
// `IfcDimensionCurveTerminator`.
const IfcDimensionCurve_WR53 = entityRule("IfcDimensionCurve", "WR53", (self) => {
	const annotatedBySymbols = asList<EntityInstance>(expressGetAttr(self, "AnnotatedBySymbols", INDETERMINATE));
	const violating = annotatedBySymbols.filter(
		(dct) => !typeOfAttr(dct).has("ifc2x3.ifcdimensioncurveterminator"),
	).length;
	assertWhereRule(
		violating === 0,
		"IfcDimensionCurve: every AnnotatedBySymbols member must be an IfcDimensionCurveTerminator.",
	);
});

// `IfcDimensionCurveDirectedCallout_WR41` (line 4800): `Contents` must contain exactly
// one `IfcDimensionCurve`.
const IfcDimensionCurveDirectedCallout_WR41 = entityRule("IfcDimensionCurveDirectedCallout", "WR41", (self) => {
	const contents = asList<EntityInstance>(expressGetAttr(self, "Contents", INDETERMINATE));
	const count = contents.filter((dc) => typeOfAttr(dc).has("ifc2x3.ifcdimensioncurve")).length;
	assertWhereRule(count === 1, "IfcDimensionCurveDirectedCallout.Contents must contain exactly one IfcDimensionCurve.");
});

// `IfcDimensionCurveDirectedCallout_WR42` (line 4809) -- a CONFIRMED, always-passing
// dead rule in both real Python and this port (verified against a real ifcopenshell
// Python install): real source reads `express_getattr(self, 'contents', INDETERMINATE)`
// here (all-lowercase attribute NAME, which never resolves -- attribute lookup is
// case-SENSITIVE, not insensitive), rather than the `Contents` local it also computes but
// never uses -- see this file's own chunk 2 header comment for the full writeup; the dead
// local is not ported (JS has no equivalent no-op "assign and discard" idiom to preserve).
const IfcDimensionCurveDirectedCallout_WR42 = entityRule("IfcDimensionCurveDirectedCallout", "WR42", (self) => {
	const contents = asList<EntityInstance>(expressGetAttr(self, "contents", INDETERMINATE));
	const count = contents.filter((dc) => typeOfAttr(dc).has("ifc2x3.ifcprojectioncurve")).length;
	assertWhereRule(
		count <= 2,
		"IfcDimensionCurveDirectedCallout.Contents must contain at most 2 IfcProjectionCurve members.",
	);
});

// `IfcDimensionCurveTerminator_WR61` (line 4819): `AnnotatedCurve` must be an
// `IfcDimensionCurve`.
const IfcDimensionCurveTerminator_WR61 = entityRule("IfcDimensionCurveTerminator", "WR61", (self) => {
	const annotatedCurve = expressGetAttr(self, "AnnotatedCurve", INDETERMINATE);
	assertWhereRule(
		typeOfAttr(annotatedCurve).has("ifc2x3.ifcdimensioncurve"),
		"IfcDimensionCurveTerminator.AnnotatedCurve must be an IfcDimensionCurve.",
	);
});

// `IfcDimensionPair_WR11` (line 4828): `Name.lower() in ['chained','parallel']`.
const IfcDimensionPair_WR11 = entityRule("IfcDimensionPair", "WR11", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE) as string;
	assertWhereRule(
		["chained", "parallel"].includes(name.toLowerCase()),
		"IfcDimensionPair.Name must be 'chained' or 'parallel' (case-insensitive).",
	);
});

// `IfcDimensionPair_WR12` (line 4837): see `exactlyOneDimensionType` above.
const IfcDimensionPair_WR12 = entityRule("IfcDimensionPair", "WR12", (self) => {
	const relatingDraughtingCallout = expressGetAttr(self, "RelatingDraughtingCallout", INDETERMINATE);
	assertWhereRule(
		exactlyOneDimensionType(relatingDraughtingCallout),
		"IfcDimensionPair.RelatingDraughtingCallout must be exactly one of IfcAngularDimension/IfcDiameterDimension/IfcLinearDimension/IfcRadiusDimension.",
	);
});

// `IfcDimensionPair_WR13` (line 4846): see `exactlyOneDimensionType` above.
const IfcDimensionPair_WR13 = entityRule("IfcDimensionPair", "WR13", (self) => {
	const relatedDraughtingCallout = expressGetAttr(self, "RelatedDraughtingCallout", INDETERMINATE);
	assertWhereRule(
		exactlyOneDimensionType(relatedDraughtingCallout),
		"IfcDimensionPair.RelatedDraughtingCallout must be exactly one of IfcAngularDimension/IfcDiameterDimension/IfcLinearDimension/IfcRadiusDimension.",
	);
});

// `IfcDocumentElectronicFormat_WR1` (line 4859): either `FileExtension` or
// `MimeContentType` must be given.
const IfcDocumentElectronicFormat_WR1 = entityRule("IfcDocumentElectronicFormat", "WR1", (self) => {
	const fileExtension = expressGetAttr(self, "FileExtension", INDETERMINATE);
	const mimeContentType = expressGetAttr(self, "MimeContentType", INDETERMINATE);
	assertWhereRule(
		exists(fileExtension) || exists(mimeContentType),
		"IfcDocumentElectronicFormat: either FileExtension or MimeContentType must be given.",
	);
});

// `IfcDocumentReference_WR1` (line 4870): exactly one of `Name`/`ReferenceToDocument`
// must be given (`^` on two definite booleans, ported as `!==`).
const IfcDocumentReference_WR1 = entityRule("IfcDocumentReference", "WR1", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	const referenceToDocument = expressGetAttr(self, "ReferenceToDocument", INDETERMINATE);
	const first = expressGetItem(referenceToDocument, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	assertWhereRule(
		exists(name) !== exists(first),
		"IfcDocumentReference: exactly one of Name or ReferenceToDocument must be given.",
	);
});

// `IfcDoorLiningProperties_WR31/WR32` (lines 4881/4892): `not (not exists(depth) and
// exists(thickness))`, ported as `exists(depth) || !exists(thickness)`.
const IfcDoorLiningProperties_WR31 = entityRule("IfcDoorLiningProperties", "WR31", (self) => {
	const liningDepth = expressGetAttr(self, "LiningDepth", INDETERMINATE);
	const liningThickness = expressGetAttr(self, "LiningThickness", INDETERMINATE);
	assertWhereRule(
		!(!exists(liningDepth) && exists(liningThickness)),
		"IfcDoorLiningProperties: LiningThickness must not be given without LiningDepth.",
	);
});

const IfcDoorLiningProperties_WR32 = entityRule("IfcDoorLiningProperties", "WR32", (self) => {
	const thresholdDepth = expressGetAttr(self, "ThresholdDepth", INDETERMINATE);
	const thresholdThickness = expressGetAttr(self, "ThresholdThickness", INDETERMINATE);
	assertWhereRule(
		!(!exists(thresholdDepth) && exists(thresholdThickness)),
		"IfcDoorLiningProperties: ThresholdThickness must not be given without ThresholdDepth.",
	);
});

// `IfcDoorLiningProperties_WR33/WR34` (lines 4903/4914): `(exists(A) and exists(B)) ^
// (not exists(A) and not exists(B))` -- an XNOR of two `exists()` calls (both always
// definite booleans), equivalent to `exists(A) === exists(B)` (same reduction as chunk
// 1's own `IfcAxis2Placement3D_WR5`).
const IfcDoorLiningProperties_WR33 = entityRule("IfcDoorLiningProperties", "WR33", (self) => {
	const transomOffset = expressGetAttr(self, "TransomOffset", INDETERMINATE);
	const transomThickness = expressGetAttr(self, "TransomThickness", INDETERMINATE);
	assertWhereRule(
		exists(transomOffset) === exists(transomThickness),
		"IfcDoorLiningProperties: TransomOffset and TransomThickness must either both be given or both be omitted.",
	);
});

const IfcDoorLiningProperties_WR34 = entityRule("IfcDoorLiningProperties", "WR34", (self) => {
	const casingDepth = expressGetAttr(self, "CasingDepth", INDETERMINATE);
	const casingThickness = expressGetAttr(self, "CasingThickness", INDETERMINATE);
	assertWhereRule(
		exists(casingDepth) === exists(casingThickness),
		"IfcDoorLiningProperties: CasingDepth and CasingThickness must either both be given or both be omitted.",
	);
});

// `IfcDoorLiningProperties_WR35` (line 4925): must be associated (via `DefinesType`)
// with exactly one `IfcDoorStyle`.
const IfcDoorLiningProperties_WR35 = entityRule("IfcDoorLiningProperties", "WR35", (self) => {
	const definesType = expressGetAttr(self, "DefinesType", INDETERMINATE);
	const first = expressGetItem(definesType, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	assertWhereRule(
		exists(first) && typeOfAttr(first).has("ifc2x3.ifcdoorstyle"),
		"IfcDoorLiningProperties must be associated (via DefinesType) with exactly one IfcDoorStyle.",
	);
});

// `IfcDoorPanelProperties_WR31` (line 4934): byte-identical shape to
// `IfcDoorLiningProperties_WR35` above.
const IfcDoorPanelProperties_WR31 = entityRule("IfcDoorPanelProperties", "WR31", (self) => {
	const definesType = expressGetAttr(self, "DefinesType", INDETERMINATE);
	const first = expressGetItem(definesType, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	assertWhereRule(
		exists(first) && typeOfAttr(first).has("ifc2x3.ifcdoorstyle"),
		"IfcDoorPanelProperties must be associated (via DefinesType) with exactly one IfcDoorStyle.",
	);
});

// `IfcDraughtingPreDefinedColour_WR31` (line 4943).
const IfcDraughtingPreDefinedColour_WR31 = entityRule("IfcDraughtingPreDefinedColour", "WR31", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE) as string;
	assertWhereRule(
		["black", "red", "green", "blue", "yellow", "magenta", "cyan", "white", "by layer"].includes(name.toLowerCase()),
		"IfcDraughtingPreDefinedColour.Name must be one of the 9 documented colour keywords (case-insensitive).",
	);
});

// `IfcDraughtingPreDefinedCurveFont_WR31` (line 4952).
const IfcDraughtingPreDefinedCurveFont_WR31 = entityRule("IfcDraughtingPreDefinedCurveFont", "WR31", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE) as string;
	assertWhereRule(
		["continuous", "chain", "chain double dash", "dashed", "dotted", "by layer"].includes(name.toLowerCase()),
		"IfcDraughtingPreDefinedCurveFont.Name must be one of the 6 documented curve-font keywords (case-insensitive).",
	);
});

// `IfcDraughtingPreDefinedTextFont_WR31` (line 4961).
const IfcDraughtingPreDefinedTextFont_WR31 = entityRule("IfcDraughtingPreDefinedTextFont", "WR31", (self) => {
	const name = expressGetAttr(self, "Name", INDETERMINATE) as string;
	assertWhereRule(
		["iso 3098-1 font a", "iso 3098-1 font b"].includes(name.toLowerCase()),
		"IfcDraughtingPreDefinedTextFont.Name must be 'ISO 3098-1 font A' or 'ISO 3098-1 font B' (case-insensitive).",
	);
});

// `IfcDuctFittingType_WR2` (line 4970).
const IfcDuctFittingType_WR2 = entityRule("IfcDuctFittingType", "WR2", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcDuctFittingType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDuctSegmentType_WR1` (line 4980).
const IfcDuctSegmentType_WR1 = entityRule("IfcDuctSegmentType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcDuctSegmentType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcDuctSilencerType_WR1` (line 4990).
const IfcDuctSilencerType_WR1 = entityRule("IfcDuctSilencerType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcDuctSilencerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcEdgeLoop_WR1` (line 5000): the first edge's `EdgeStart` must equal the last edge's
// `EdgeEnd`.
const IfcEdgeLoop_WR1 = entityRule("IfcEdgeLoop", "WR1", (self) => {
	const edgeList = expressGetAttr(self, "EdgeList", INDETERMINATE);
	const ne = expressGetAttr(self, "Ne", INDETERMINATE);
	const first = expressGetItem(edgeList, 1 - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	const last = expressGetItem(edgeList, (ne as number) - EXPRESS_ONE_BASED_INDEXING, INDETERMINATE);
	assertWhereRule(
		triEq(expressGetAttr(first, "EdgeStart", INDETERMINATE), expressGetAttr(last, "EdgeEnd", INDETERMINATE)),
		"IfcEdgeLoop: the first edge's EdgeStart must equal the last edge's EdgeEnd.",
	);
});

// `IfcEdgeLoop_WR2` (line 5011): see `ifcLoopHeadToTail` above.
const IfcEdgeLoop_WR2 = entityRule("IfcEdgeLoop", "WR2", (self) => {
	assertWhereRule(
		ifcLoopHeadToTail(self),
		"IfcEdgeLoop: consecutive edges must be head-to-tail connected (EdgeEnd of edge i must equal EdgeStart of edge i+1).",
	);
});

// `IfcElectricDistributionPoint_WR31` (line 5024).
const IfcElectricDistributionPoint_WR31 = entityRule("IfcElectricDistributionPoint", "WR31", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "DistributionPointFunction", "UserDefinedFunction"),
		"IfcElectricDistributionPoint: if DistributionPointFunction is USERDEFINED, UserDefinedFunction must be given.",
	);
});

// `IfcElementAssembly_WR1` (line 5034).
const IfcElementAssembly_WR1 = entityRule("IfcElementAssembly", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ObjectType"),
		"IfcElementAssembly: if PredefinedType is USERDEFINED, ObjectType must be given.",
	);
});

// `IfcEnvironmentalImpactValue_WR1` (line 5048).
const IfcEnvironmentalImpactValue_WR1 = entityRule("IfcEnvironmentalImpactValue", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "Category", "UserDefinedCategory"),
		"IfcEnvironmentalImpactValue: if Category is USERDEFINED, UserDefinedCategory must be given.",
	);
});

// `IfcEvaporativeCoolerType_WR1` (line 5058).
const IfcEvaporativeCoolerType_WR1 = entityRule("IfcEvaporativeCoolerType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcEvaporativeCoolerType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcEvaporatorType_WR1` (line 5068).
const IfcEvaporatorType_WR1 = entityRule("IfcEvaporatorType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcEvaporatorType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcExternalReference_WR1` (line 5078): at least one of `ItemReference`/`Location`/`Name`.
const IfcExternalReference_WR1 = entityRule("IfcExternalReference", "WR1", (self) => {
	const location = expressGetAttr(self, "Location", INDETERMINATE);
	const itemReference = expressGetAttr(self, "ItemReference", INDETERMINATE);
	const name = expressGetAttr(self, "Name", INDETERMINATE);
	assertWhereRule(
		exists(itemReference) || exists(location) || exists(name),
		"IfcExternalReference: at least one of ItemReference, Location, or Name must be given.",
	);
});

// `IfcExtrudedAreaSolid_WR31` (line 5090): `ExtrudedDirection` must not be perpendicular
// to the global Z axis. See `ifcDirection`/`ifcDotProduct` (`express/rules/ifc2x3.ts`).
const IfcExtrudedAreaSolid_WR31 = entityRule("IfcExtrudedAreaSolid", "WR31", (self) => {
	const extrudedDirection = expressGetAttr(self, "ExtrudedDirection", INDETERMINATE);
	assertWhereRule(
		triNe(ifcDotProduct(ifcDirection([0.0, 0.0, 1.0]), extrudedDirection), 0.0),
		"IfcExtrudedAreaSolid.ExtrudedDirection must not be perpendicular to the global Z axis (dot product with [0,0,1] must not be 0).",
	);
});

// `IfcFace_WR1` (line 5099): `Bounds` must contain at most one `IfcFaceOuterBound`.
const IfcFace_WR1 = entityRule("IfcFace", "WR1", (self) => {
	const bounds = asList<EntityInstance>(expressGetAttr(self, "Bounds", INDETERMINATE));
	const count = bounds.filter((temp) => typeOfAttr(temp).has("ifc2x3.ifcfaceouterbound")).length;
	assertWhereRule(count <= 1, "IfcFace.Bounds must contain at most one IfcFaceOuterBound.");
});

// `IfcFanType_WR1` (line 5112).
const IfcFanType_WR1 = entityRule("IfcFanType", "WR1", (self) => {
	assertWhereRule(
		userDefinedOrHasAttribute(self, "PredefinedType", "ElementType"),
		"IfcFanType: if PredefinedType is USERDEFINED, ElementType must be given.",
	);
});

// `IfcFillAreaStyle_WR11` (line 5122): `FillStyles` must contain at most one `IfcColour`
// -- a CONFIRMED, always-passing dead rule (`IfcColour` is a SELECT, never matched by
// `typeof()`; see `ifcCorrectFillAreaStyle`'s own doc comment above for the full,
// empirically-verified writeup -- the exact same finding applies here verbatim).
const IfcFillAreaStyle_WR11 = entityRule("IfcFillAreaStyle", "WR11", (self) => {
	const fillStyles = asList<EntityInstance>(expressGetAttr(self, "FillStyles", INDETERMINATE));
	const count = fillStyles.filter((style) => typeOfAttr(style).has("ifc2x3.ifccolour")).length;
	assertWhereRule(count <= 1, "IfcFillAreaStyle.FillStyles must contain at most one IfcColour.");
});

// `IfcFillAreaStyle_WR12` (line 5131): `FillStyles` must contain at most one
// `IfcExternallyDefinedHatchStyle`.
const IfcFillAreaStyle_WR12 = entityRule("IfcFillAreaStyle", "WR12", (self) => {
	const fillStyles = asList<EntityInstance>(expressGetAttr(self, "FillStyles", INDETERMINATE));
	const count = fillStyles.filter((style) => typeOfAttr(style).has("ifc2x3.ifcexternallydefinedhatchstyle")).length;
	assertWhereRule(count <= 1, "IfcFillAreaStyle.FillStyles must contain at most one IfcExternallyDefinedHatchStyle.");
});

// `IfcFillAreaStyle_WR13` (line 5140): see `ifcCorrectFillAreaStyle` above.
const IfcFillAreaStyle_WR13 = entityRule("IfcFillAreaStyle", "WR13", (self) => {
	const fillStyles = expressGetAttr(self, "FillStyles", INDETERMINATE);
	assertWhereRule(
		ifcCorrectFillAreaStyle(fillStyles),
		"IfcFillAreaStyle.FillStyles do not form a correct combination of hatching/tiles/colour/external styles.",
	);
});

registerSchemaRules("IFC2X3", [
	IfcCartesianPoint_WR1,
	IfcCartesianTransformationOperator_WR1,
	IfcCartesianTransformationOperator2D_WR1,
	IfcCartesianTransformationOperator2D_WR2,
	IfcCartesianTransformationOperator2D_WR3,
	IfcCartesianTransformationOperator2DnonUniform_WR1,
	IfcCartesianTransformationOperator3D_WR1,
	IfcCartesianTransformationOperator3D_WR2,
	IfcCartesianTransformationOperator3D_WR3,
	IfcCartesianTransformationOperator3D_WR4,
	IfcCartesianTransformationOperator3DnonUniform_WR1,
	IfcCartesianTransformationOperator3DnonUniform_WR2,
	IfcChillerType_WR1,
	IfcCircleHollowProfileDef_WR1,
	IfcCoilType_WR1,
	IfcComplexProperty_WR21,
	IfcComplexProperty_WR22,
	IfcCompositeCurve_WR41,
	IfcCompositeCurve_WR42,
	IfcCompositeCurveSegment_WR1,
	IfcCompositeProfileDef_WR1,
	IfcCompositeProfileDef_WR2,
	IfcCompressorType_WR1,
	IfcCondenserType_WR1,
	IfcConditionCriterion_WR1,
	IfcConstraint_WR11,
	IfcConstraintAggregationRelationship_WR11,
	IfcConstraintRelationship_WR11,
	IfcConstructionMaterialResource_WR1,
	IfcConstructionMaterialResource_WR2,
	IfcConstructionProductResource_WR1,
	IfcConstructionProductResource_WR2,
	IfcCooledBeamType_WR1,
	IfcCoolingTowerType_WR1,
	IfcCovering_WR61,
	IfcCurveStyle_WR11,
	IfcCurveStyleFontPattern_WR01,
	IfcDamperType_WR1,
	IfcDerivedProfileDef_WR1,
	IfcDerivedUnit_WR1,
	IfcDerivedUnit_WR2,
	IfcDimensionCalloutRelationship_WR11,
	IfcDimensionCalloutRelationship_WR12,
	IfcDimensionCalloutRelationship_WR13,
	IfcDimensionCurve_WR51,
	IfcDimensionCurve_WR52,
	IfcDimensionCurve_WR53,
	IfcDimensionCurveDirectedCallout_WR41,
	IfcDimensionCurveDirectedCallout_WR42,
	IfcDimensionCurveTerminator_WR61,
	IfcDimensionPair_WR11,
	IfcDimensionPair_WR12,
	IfcDimensionPair_WR13,
	IfcDocumentElectronicFormat_WR1,
	IfcDocumentReference_WR1,
	IfcDoorLiningProperties_WR31,
	IfcDoorLiningProperties_WR32,
	IfcDoorLiningProperties_WR33,
	IfcDoorLiningProperties_WR34,
	IfcDoorLiningProperties_WR35,
	IfcDoorPanelProperties_WR31,
	IfcDraughtingPreDefinedColour_WR31,
	IfcDraughtingPreDefinedCurveFont_WR31,
	IfcDraughtingPreDefinedTextFont_WR31,
	IfcDuctFittingType_WR2,
	IfcDuctSegmentType_WR1,
	IfcDuctSilencerType_WR1,
	IfcEdgeLoop_WR1,
	IfcEdgeLoop_WR2,
	IfcElectricDistributionPoint_WR31,
	IfcElementAssembly_WR1,
	IfcEnvironmentalImpactValue_WR1,
	IfcEvaporativeCoolerType_WR1,
	IfcEvaporatorType_WR1,
	IfcExternalReference_WR1,
	IfcExtrudedAreaSolid_WR31,
	IfcFace_WR1,
	IfcFanType_WR1,
	IfcFillAreaStyle_WR11,
	IfcFillAreaStyle_WR12,
	IfcFillAreaStyle_WR13,
]);
