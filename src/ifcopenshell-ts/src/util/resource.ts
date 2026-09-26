// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/resource.py` (src/ifcopenshell-python, 171
// lines, 13 functions) -- construction-resource productivity/quantity/cost queries for
// `IfcConstructionResource` (`IfcLaborResource`/`IfcCrewResource`/etc.) and its nesting/
// task-assignment graph. This was the last remaining Phase 3 Tier A module, blocked
// until `util.cost` landed (PR #56) since it imports `ifcopenshell.util.cost`
// (`calculateAppliedValue`), `ifcopenshell.util.date` (`ifc2datetime`), and
// `ifcopenshell.util.element` (`getPsets`) -- all three now ported (`cost.ts`/`date.ts`/
// `element.ts`).
//
// Ported in full: `getProductivity`, `getParentProductivity`, `getUnitConsumed`,
// `getQuantityProduced`, `getQuantityProducedName`, `getTotalQuantityProduced`,
// `getParametricResourceProducts`, `getTaskAssignments`, `getResourceRequiredWork`,
// `getNestedResources`, `getCost`, `getQuantity`, `getParentCost`, plus the module-level
// `RESOURCES_TO_QUANTITIES` constant (`resourcesToQuantities` below) -- kept for
// Python-API-surface parity even though nothing in this file's own functions reads it
// (confirmed by grep: it's unused by `resource.py` itself too, presumably consumed only
// by external callers, e.g. a UI's per-resource-class quantity-type picker).
//
// This module has **no mutating functions at all** -- every one of the 13 functions
// above is a pure read/query (confirmed by reading the whole source: no `.set(...)`, no
// `api.*` calls, nothing that would need `EntityInstance.set()`/`Transaction` undo-redo
// verification). No Transaction/undo-redo test is included in `test/util/resource.test.ts`
// for this reason, matching `util.pset`'s own precedent for a module with only read-only
// mutating-function candidates that turned out not to mutate anything.
//
// *** Real, disclosed finding: `date.ts`'s unified `Duration` type needs explicit
// Python-`timedelta`-style normalization before `.days`/`.seconds`/`.total_seconds()`-
// equivalent reads are safe *** (not hit by any previously-ported module -- this chunk's
// own investigation, not assumed). `get_resource_required_work`/`get_quantity` read
// `time_consumed.days`/`time_consumed.seconds`/`duration.total_seconds()` directly off
// whatever `ifcopenshell.util.date.ifc2datetime` returns for an `IfcDuration` string.
// In real Python, `ifc2datetime` calls `isodate.parse_duration`, which returns either a
// plain `datetime.timedelta` (already normalized: `0 <= seconds < 86400`, any H/M/S
// overflow folded into `days`) or, when the string has Y/M components, an
// `isodate.Duration` wrapper whose `__getattr__` delegates any attribute it doesn't
// define itself (`.days`/`.seconds`/`.total_seconds()` included) straight through to its
// own internal, *already-`timedelta`-normalized* `self.tdelta` -- confirmed directly
// against the real `isodate` source (`duration.py`), not assumed. Either way, `.days`/
// `.seconds` on whatever `ifc2datetime` returns are always the normalized values.
//
// This port's `Duration` (see `date.ts`'s own header comment finding #1) deliberately
// keeps `days`/`hours`/`minutes`/`seconds` as independently-parsed fields straight off
// the ISO 8601 regex, NOT normalized -- e.g. `parseDuration("PT8H")` returns `{days: 0,
// hours: 8, minutes: 0, seconds: 0, ...}`, not `{days: 0, seconds: 28800}` the way a real
// Python `timedelta.days`/`.seconds` pair would read. Naively porting `time_consumed
// .days`/`time_consumed.seconds` as direct field reads would therefore silently produce
// `0`/`0` here instead of the correct `0`/`28800` -- a real bug this chunk caught by
// tracing `isodate`'s source rather than assuming the field names lined up. Fixed via a
// small local bridging helper (`timedeltaDaysSeconds`/`durationTotalSeconds` below) that
// performs the same day/intraday-second normalization a real `timedelta` constructor
// does (matching `durationIsoformat`'s own recombine-then-resplit approach in `date.ts`),
// reading only `days`/`hours`/`minutes`/`seconds` (years/months correctly excluded,
// matching `isodate.Duration.tdelta` never including them either -- calendar month/year
// lengths aren't a fixed number of days). Real `BaseQuantityConsumed`/`ScheduleWork`
// values are D/H/M/S-only durations in practice, so this omission has no practical
// effect. One small, disclosed, practically-irrelevant precision cut: a real Python
// `timedelta.seconds` is always an integer (any fractional remainder folds into
// `.microseconds`, not `.seconds`) -- `timedeltaDaysSeconds` below matches this by
// truncating any fractional remainder rather than tracking a separate microseconds
// field this module never reads anyway.
//
// *** Three smaller, disclosed findings (not primitive gaps -- pure translation/precision
// notes, matching this project's near-verbatim-port mandate) ***:
//
// 1. `get_unit_consumed` does NOT null-guard its `productivity` parameter the way its
//    two sibling functions (`get_quantity_produced`/`get_quantity_produced_name`) both
//    do (`if not productivity: return <default>`) -- real Python calls
//    `productivity.get("BaseQuantityConsumed", None)` directly, which raises
//    `AttributeError` for a `None` `productivity`. This looks like a genuine, narrow
//    upstream inconsistency (the other two guard, this one doesn't), reproduced
//    faithfully below rather than "fixed" by adding a matching guard: `getUnitConsumed`
//    reads `productivity`'s property with no null-check, so a `null` `productivity`
//    throws a `TypeError` at the same point real Python would throw `AttributeError`.
//    Not reachable from this module's own `getResourceRequiredWork` (which always
//    guards with `if (productivity)` first, matching Python's own call site), so this
//    only matters for a direct external caller of `getUnitConsumed(null)`.
// 2. `get_resource_required_work`'s two `f"PT{...}H"`/`f"P{...}D"` f-strings embed a
//    Python `float` directly, which renders a whole-number result with a trailing
//    `.0` (e.g. `"PT2.0H"`), whereas this port's template-literal interpolation of a
//    whole-number JS `number` omits it (`"PT2H"`) -- the same already-tracked JS/Python
//    `int`-vs-`float`-`str()`-rendering divergence documented in `TODOS.md`'s
//    "`EntityInstance.getByIndex`/`wrapValue` collapse EXPRESS INTEGER vs. REAL" entry
//    (cross-referenced there, not filed as a new entry -- same root cause, also
//    independently re-found by `util/cost.ts`'s own quirk 2 and `util/selector.ts`'s
//    `pyStr`/`number()` finding). Cosmetic only: the numeric *value* embedded is
//    identical either way, only the exact rendered string's decimal-point presence
//    differs for a whole-number result.
// 3. `get_resource_required_work`'s `if not time_consumed or ...: return` guard relies
//    on real Python's `datetime.timedelta.__bool__`/`isodate.Duration.__bool__`
//    ("falsy iff every component is zero") -- an all-zero duration (e.g.
//    `BaseQuantityConsumed = "PT0S"`) is genuinely FALSY in Python, so that call
//    returns `None` for it exactly like it would for a missing/unparseable duration. A
//    plain JS object (this port's `Duration`) is always truthy regardless of its field
//    values, so a bare `!timeConsumed` check would silently miss this and fall through
//    to computing a (numerically correct, but Python-divergent) `"PT0H"`/`"P0D"`
//    result instead of `undefined`. Fixed via `isFalsyTimeConsumed` below, which
//    reproduces the real `__bool__` check explicitly (all of `years`/`months`/`days`/
//    `hours`/`minutes`/`seconds` zero) rather than relying on JS's own object
//    truthiness -- verified with a dedicated `"PT0S"` regression test in
//    `test/util/resource.test.ts`.
//
// *** `get_total_quantity_produced`'s nested `get_product_quantity` closure calls
// Python's `float(value)` on a matched pset property value ***. A plain JS `Number
// (value)` is not an equivalent substitute: it silently returns `NaN` for a
// non-numeric input where Python's `float()` raises `ValueError` (which would propagate
// up and crash the caller in real Python -- a real, if rare, difference worth
// preserving rather than silently swallowing into `NaN`/`0`). `pythonFloat` below
// reuses `util/selector.ts`'s own established `pythonFloat`-for-numeric-strings
// precedent (not exported there, so redefined locally per this project's "small pure
// helper, no cross-file sharing" convention for module-private translation aids),
// extended to accept an already-numeric/boolean `unknown` input directly (a pset
// property value read via `getPsets` is very often already a real JS `number`, not a
// string -- Python's `float()` accepts `int`/`float`/`bool`/numeric-string alike).
// Throws for anything else, matching Python's `ValueError`. One remaining, disclosed,
// practically-irrelevant edge case *not* fully replicated: Python's `or 0` fallback
// (`get_product_quantity(...) or 0`) treats a literal `float('nan')` result as *truthy*
// (Python's `or` only substitutes for a properly falsy value, and `nan != 0`), while
// this port's `|| 0` treats a `NaN` result as falsy (JS's `||` treats `NaN` as falsy)
// and substitutes `0` instead -- only reachable if a pset property's value is literally
// the string `"nan"`/`"NaN"`, essentially never true for real IFC quantity data.
//
// *** `getCost`/`getParentCost`/`getQuantity` reuse the real, already-ported
// `util/cost.ts` exports (`calculateAppliedValue`) and `util/element.ts`'s `getPsets`,
// per this chunk's own dispatch brief's naming note -- verified against the actual
// exported names in those files (camelCase, e.g. `calculateAppliedValue`, not a
// `calculate_applied_value` transliteration). ***

import type { EntityInstance } from "../entityInstance";
import { calculateAppliedValue } from "./cost";
import { type Duration, type IfcDateTimeValue, ifc2datetime } from "./date";
import { getPsets } from "./element";

/** Python: `PRODUCTIVITY_PSET_DATA = Union[dict[str, Any], None]`. */
export type ProductivityPsetData = Record<string, unknown> | null;

/**
 * Python: `RESOURCES_TO_QUANTITIES`.
 * https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcConstructionResource.htm#Table-7.3.3.7.1.3.H
 * Kept for Python-API-surface parity -- see this file's header comment (nothing in this
 * module's own functions reads it).
 */
export const resourcesToQuantities: Record<string, readonly string[]> = {
	IfcCrewResource: ["IfcQuantityTime"],
	IfcLaborResource: ["IfcQuantityTime"],
	IfcSubContractResource: ["IfcQuantityTime"],
	IfcConstructionEquipmentResource: ["IfcQuantityTime"],
	IfcConstructionMaterialResource: ["IfcQuantityVolume", "IfcQuantityArea", "IfcQuantityLength", "IfcQuantityWeight"],
	IfcConstructionProductResource: ["IfcQuantityCount"],
};

// --- internal helpers (not exported -- pure translation aids, no Python counterpart,
// matching `util/cost.ts`/`util/element.ts`'s own established local-helper precedent) ---

/** Python's `x or []` idiom for a possibly-`null` array attribute. */
function attrList(element: EntityInstance, name: string): EntityInstance[] {
	return (element.get(name) as EntityInstance[] | null) ?? [];
}

/**
 * Python's `dict.get(key, default)` -- returns the actual value if `key` is present
 * (even if that value is itself falsy/`None`), only substituting `defaultValue` if
 * `key` is entirely absent. Deliberately does NOT null-guard `obj` itself (a plain `in`
 * check on `null`/`undefined` throws a `TypeError`) -- this is intentional, see this
 * file's header comment finding 1 for the one call site (`getUnitConsumed`) that relies
 * on this to faithfully preserve a real Python `AttributeError`-on-`None` crash.
 */
function dictGet<T>(obj: Record<string, unknown>, key: string, defaultValue: T): T {
	return key in obj ? (obj[key] as T) : defaultValue;
}

/**
 * Bridges this port's unified `Duration` shape into the `{days, seconds}` pair a real
 * Python `datetime.timedelta`/`isodate.Duration` exposes as `.days`/`.seconds` -- see
 * this file's header comment for the full investigation. Only `days`/`hours`/`minutes`/
 * `seconds` are combined; `years`/`months` are correctly excluded (matching
 * `isodate.Duration.tdelta` itself never including them).
 */
function timedeltaDaysSeconds(duration: Duration): { days: number; seconds: number } {
	const totalSeconds = duration.days * 86400 + duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
	const days = Math.floor(totalSeconds / 86400);
	// A real `timedelta.seconds` is always an integer (fractional remainder folds into
	// `.microseconds`, unread by this module) -- truncated here to match.
	const seconds = Math.floor(totalSeconds - days * 86400);
	return { days, seconds };
}

/** Python: `duration.total_seconds()` -- see `timedeltaDaysSeconds` above for why
 * `years`/`months` are correctly excluded here too. */
function durationTotalSeconds(duration: Duration): number {
	return duration.days * 86400 + duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
}

/**
 * Python's `not time_consumed` for a real `datetime.timedelta`/`isodate.Duration`
 * result -- see this file's header comment finding 3. A real `timedelta` (and
 * `isodate.Duration`, which delegates to its own internal `tdelta`) defines
 * `__bool__` as "any component is non-zero", so an all-zero duration (e.g. a
 * `BaseQuantityConsumed` of `"PT0S"`) is genuinely FALSY in Python -- `if not
 * time_consumed: return` fires for it exactly like it would for `None`. A plain JS
 * object is always truthy regardless of its field values, so a bare `!value` check on
 * a parsed `Duration` would never catch this case; this reproduces the real
 * `__bool__` semantics explicitly. `getUnitConsumed`'s `BaseQuantityConsumed` is
 * always an `IfcDuration` in practice, so only the `Duration` shape is checked here --
 * an `IfcDateTimeValue` (date/time/datetime) has no such override in real Python
 * either (a `datetime.date`/`.time`/`.datetime` is always truthy).
 */
function isFalsyTimeConsumed(value: Duration | IfcDateTimeValue | undefined): boolean {
	if (!value) return true;
	if (!("years" in value)) return false;
	return (
		value.years === 0 &&
		value.months === 0 &&
		value.days === 0 &&
		value.hours === 0 &&
		value.minutes === 0 &&
		value.seconds === 0
	);
}

/** Python: `float(value)` -- see this file's header comment for the full rationale
 * (reused concept from `util/selector.ts`'s own `pythonFloat`, extended to accept an
 * already-numeric/boolean input directly). Throws for anything not numeric-convertible,
 * matching Python's own `float()` raising `ValueError`. */
function pythonFloat(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "boolean") return value ? 1 : 0;
	const raw = String(value).trim();
	if (/^[+-]?(inf|infinity)$/i.test(raw)) {
		return raw.startsWith("-") ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
	}
	if (/^[+-]?nan$/i.test(raw)) return Number.NaN;
	if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(raw)) {
		throw new Error(`could not convert value to float: ${JSON.stringify(value)}`);
	}
	return Number(raw);
}

// --- productivity queries ---

/** Python: `get_productivity(resource, should_inherit=True) -> PRODUCTIVITY_PSET_DATA`. */
export function getProductivity(resource: EntityInstance, shouldInherit = true): ProductivityPsetData {
	const psets = getPsets(resource);
	let productivity = dictGet<ProductivityPsetData>(psets, "EPset_Productivity", null);
	if (shouldInherit && !productivity) {
		// Note: This is not part of the Schema - but it makes sense to inherit from parent
		productivity = getParentProductivity(resource);
	}
	return productivity;
}

/** Python: `get_parent_productivity(resource) -> PRODUCTIVITY_PSET_DATA`. */
export function getParentProductivity(resource: EntityInstance): ProductivityPsetData {
	const nests = attrList(resource, "Nests");
	if (nests.length === 0) return null;
	const parentResource = nests[0].get("RelatingObject") as EntityInstance;
	const psets = getPsets(parentResource);
	return dictGet<ProductivityPsetData>(psets, "EPset_Productivity", null);
}

/**
 * Python: `get_unit_consumed(productivity) -> Union[Any, None]`. See this file's
 * header comment finding 1 for the deliberately-unguarded `productivity` access.
 */
export function getUnitConsumed(productivity: ProductivityPsetData): Duration | IfcDateTimeValue | undefined {
	const duration = dictGet<string | undefined>(
		productivity as Record<string, unknown>,
		"BaseQuantityConsumed",
		undefined,
	);
	if (!duration) return undefined;
	return ifc2datetime(duration);
}

/** Python: `get_quantity_produced(productivity) -> float`. */
export function getQuantityProduced(productivity: ProductivityPsetData): number {
	if (!productivity) return 0.0;
	return dictGet<number>(productivity, "BaseQuantityProducedValue", 0.0);
}

/** Python: `get_quantity_produced_name(productivity)`. */
export function getQuantityProducedName(productivity: ProductivityPsetData): string {
	if (!productivity) return "";
	return dictGet<string>(productivity, "BaseQuantityProducedName", "");
}

/** Python: `get_total_quantity_produced(resource, quantity_name_in_process) -> float`. */
export function getTotalQuantityProduced(resource: EntityInstance, quantityNameInProcess: string): number {
	function getProductQuantity(product: EntityInstance, quantityName: string): number | undefined {
		const psets = getPsets(product);
		for (const pset of Object.values(psets)) {
			for (const [name, value] of Object.entries(pset)) {
				if (name === quantityName) return pythonFloat(value);
			}
		}
		return undefined;
	}

	let total = 0.0;
	const products = getParametricResourceProducts(resource);
	if (quantityNameInProcess === "Count") {
		total = products.length;
	} else {
		for (const product of products) {
			total += getProductQuantity(product, quantityNameInProcess) || 0;
		}
	}
	return total;
}

/** Python: `get_parametric_resource_products(resource) -> list[entity_instance]`. */
export function getParametricResourceProducts(resource: EntityInstance): EntityInstance[] {
	const products: EntityInstance[] = [];
	for (const rel of attrList(resource, "HasAssignments")) {
		if (!rel.isA("IfcRelAssignsToProcess")) continue;
		const relatingProcess = rel.get("RelatingProcess") as EntityInstance;
		for (const rel2 of attrList(relatingProcess, "HasAssignments")) {
			if (!rel2.isA("IfcRelAssignsToProduct")) continue;
			products.push(rel2.get("RelatingProduct") as EntityInstance);
		}
	}
	return products;
}

/** Python: `get_task_assignments(resource) -> Union[entity_instance, None]`. */
export function getTaskAssignments(resource: EntityInstance): EntityInstance | undefined {
	for (const rel of attrList(resource, "HasAssignments")) {
		if (!rel.isA("IfcRelAssignsToProcess")) continue;
		return rel.get("RelatingProcess") as EntityInstance;
	}
	return undefined;
}

/**
 * Python: `get_resource_required_work(resource) -> Union[str, None]`. See this file's
 * header comment for the `Duration` normalization finding (`timedeltaDaysSeconds`) and
 * the disclosed `f-string`-rendering cosmetic divergence (finding 2).
 */
export function getResourceRequiredWork(resource: EntityInstance): string | undefined {
	const productivity = getProductivity(resource);
	if (!productivity) return undefined;
	const quantityProduced = getQuantityProduced(productivity);
	const timeConsumedRaw = getUnitConsumed(productivity);
	const quantityNameInProcess = getQuantityProducedName(productivity);
	const totalQuantityToProduce = getTotalQuantityProduced(resource, quantityNameInProcess);
	if (isFalsyTimeConsumed(timeConsumedRaw) || !quantityProduced || !totalQuantityToProduce) return undefined;
	// `BaseQuantityConsumed` is an `IfcDuration` (a string) -- `ifc2datetime` always
	// returns a `Duration` for that input shape, matching Python's implicit assumption
	// (it never checks the returned type before using `.days`/`.seconds` either).
	const timeConsumed = timeConsumedRaw as Duration;
	const rawBaseQuantityConsumed = dictGet<string>(productivity, "BaseQuantityConsumed", "");
	let isoString: string;
	if (rawBaseQuantityConsumed.includes("T")) {
		const { days, seconds } = timedeltaDaysSeconds(timeConsumed);
		const totalSeconds = days * 24 * 60 * 60 + seconds;
		const productivityRatio = totalSeconds / quantityProduced;
		const requiredWork = totalQuantityToProduce * productivityRatio;
		isoString = `PT${requiredWork / 60 / 60}H`;
	} else {
		const { days, seconds } = timedeltaDaysSeconds(timeConsumed);
		const daysFloat = days + seconds / (24 * 60 * 60);
		const productivityRatio = daysFloat / quantityProduced;
		const requiredWork = totalQuantityToProduce * productivityRatio;
		isoString = `P${requiredWork}D`;
	}
	return isoString;
}

/** Python: `get_nested_resources(resource) -> list[entity_instance]`. */
export function getNestedResources(resource: EntityInstance): EntityInstance[] {
	const objects: EntityInstance[] = [];
	for (const rel of attrList(resource, "IsNestedBy")) {
		objects.push(...attrList(rel, "RelatedObjects"));
	}
	return objects;
}

// --- cost queries (delegate to `util/cost.ts`) ---

/**
 * Python: `get_cost(resource) -> tuple[Union[float, None], Union[str, None]]`. Get cost
 * data for `IfcConstructionResource`. Returns a tuple of cost and unit.
 */
export function getCost(resource: EntityInstance): [number | null, string | null] {
	let cost: number | null = null;
	let unit: string | null = null;
	const baseCosts = attrList(resource, "BaseCosts");
	if (baseCosts.length > 0) {
		const costs = baseCosts.map((costValue) => calculateAppliedValue(resource, costValue));
		cost = costs.reduce((a, b) => a + b, 0);
		let unitBasis: EntityInstance | null = null;
		for (const costValue of baseCosts) {
			const candidate = costValue.get("UnitBasis") as EntityInstance | null;
			if (candidate) {
				unitBasis = candidate;
				break;
			}
		}
		if (unitBasis) {
			const unitComponent = unitBasis.get("UnitComponent") as EntityInstance;
			if (unitComponent.isA("IfcConversionBasedUnit")) {
				unit = unitComponent.get("Name") as string;
			}
		}
	}
	return [cost, unit];
}

/** Python: `get_quantity(resource) -> float`. */
export function getQuantity(resource: EntityInstance): number {
	const usage = resource.get("Usage") as EntityInstance | null;
	const scheduleWork = usage?.get("ScheduleWork") as string | null | undefined;
	if (usage && scheduleWork) {
		const duration = ifc2datetime(scheduleWork) as Duration;
		return durationTotalSeconds(duration) / 3600;
	}
	// TODO: is it safe to assume None quantity should be treated as 1.0? See #910 in ifc4x3dev.
	const quantity = resource.get("BaseQuantity") as EntityInstance | null;
	return quantity === null ? 1.0 : (quantity.getByIndex(3) as number);
}

/**
 * Python: `get_parent_cost(resource) -> Union[tuple[Union[float, None], Union[str, None]], None]`.
 */
export function getParentCost(resource: EntityInstance): [number | null, string | null] | undefined {
	const nests = attrList(resource, "Nests");
	if (nests.length === 0) return undefined;
	return getCost(nests[0].get("RelatingObject") as EntityInstance);
}
