// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/sequence.py` (src/ifcopenshell-python, 465
// lines, 27 functions) -- a brand-new `util` module (zero prior TS coverage), ported now
// as a prerequisite for 7 of the ~39 still-unported `ifcopenshell.api.sequence` files
// (`add_time_period.py`, `assign_recurrence_pattern.py`, `cascade_schedule.py`,
// `create_baseline.py`, `edit_recurrence_pattern.py`, `edit_task_time.py`,
// `recalculate_schedule.py`), which are all themselves out of scope for this chunk.
//
// Two families of functionality, both ported in full:
// 1. Calendar/working-day arithmetic: `isWorkingDay`/`isCalendarApplicable`/
//    `isDayInWorkTime`/`isWorkTimeApplicableToDay`/`offsetDate`/`getStartOrFinishDate`/
//    `getSoonestWorkingDay`/`getRecentWorkingDay`/`countWorkingDays`, evaluating an
//    `IfcWorkCalendar`'s `WorkingTimes`/`ExceptionTimes` (`IfcWorkTime`s, each optionally
//    referencing an `IfcRecurrencePattern` and bounded by `IfcTimePeriod`-free start/
//    finish dates) to determine which calendar days are "working days" and to do date
//    arithmetic that skips non-working days.
// 2. Task-tree/schedule traversal: `deriveDate`/`deriveCalendar`/`getCalendar`/
//    `getTaskWorkSchedule`/`getNestedTasks`/`getParentTask`/`getAllNestedTasks`/
//    `getWorkScheduleTasks`/`getRootTasks`/`guessDateRange`/`getTaskOutputs`/
//    `getTaskInputs`/`getTaskResources`/`hasTaskOutputs`/`hasTaskInputs`/
//    `getTasksForProduct`/`getSequenceAssignment`/`getRelatedProducts`, walking
//    `IfcRelNests`/`IfcRelAssignsToControl`/`IfcRelAssignsToProduct`/
//    `IfcRelAssignsToProcess`/`IfcRelSequence` relationships on `IfcTask`/
//    `IfcWorkSchedule` entities.
//
// Reuses `util/date.ts`'s already-landed `Duration`/`IsoDate`/`IsoDateTime`/
// `ifc2datetime` (confirmed by reading `sequence.py`'s own top-of-file imports: it
// imports `ifcopenshell.util.date` and `ifcopenshell.util.element`, nothing else) and
// `util/element.ts`'s already-landed `getComponents` (`get_nested_tasks`'s own
// implementation is a one-line call to `ifcopenshell.util.element.get_components`).
//
// *** Real, disclosed findings (all confirmed directly against the real Python source
// and/or a real `ifcopenshell` Python installation, not assumed) ***
//
// 1. `IfcWorkTime`'s Start/Finish attribute is renamed between IFC4 (`Start`/`Finish`)
//    and IFC4X3 (`StartDate`/`FinishDate`) -- confirmed empirically against all 3
//    generated `.d.ts`s. This is exactly why real Python reads them POSITIONALLY
//    (`work_time[4]`/`work_time[5]`, `entity_instance.__getitem__` taking an integer
//    attribute index) rather than by name -- ported the same way via
//    `workTime.getByIndex(4)`/`.getByIndex(5)`, schema-name-agnostic by construction.
//
// 2. IFC2X3 lacks `IfcWorkCalendar`/`IfcWorkTime`/`IfcRecurrencePattern`/
//    `IfcTimePeriod`/`IfcTaskTime` entirely (confirmed empirically: `file.createEntity`
//    throws "not found in schema 'IFC2X3'" for all 5), so the entire calendar-arithmetic
//    half of this module is inapplicable there by construction -- no test coverage is
//    possible for it under IFC2X3, matching real Python's own equally total
//    inapplicability. Separately (and independently), IFC2X3's `IfcTask` has no
//    `Nests`/`IsNestedBy` attribute at all (confirmed empirically: IFC2X3 folds
//    decomposition into a single `Decomposes`/`IsDecomposedBy` pair instead, exactly
//    why `util/element.ts`'s own `getComponents`/`getNest` already branch on schema for
//    this) -- `derive_calendar`/`get_parent_task`/`get_sequence_assignment` all access
//    `task.Nests` with a PLAIN attribute access (`task.Nests` or `task.Nests or []` --
//    Python's `or` never catches `AttributeError`, so the trailing `or []` doesn't
//    protect against a genuinely undeclared attribute either), so all three genuinely
//    THROW on IFC2X3 in real Python too -- and, since `get_parent_task` does this
//    unconditionally at the very top of its own body (not merely on some fallback
//    path), `get_task_work_schedule` (which ALWAYS calls `get_parent_task` first) also
//    throws on IFC2X3 for ANY `IfcTask` whatsoever, confirmed empirically against a real
//    Python install -- not just for a nested one. Ported verbatim below (direct
//    `.get("Nests")`, not the null-substituting `attrList` helper used everywhere else
//    in this file) -- disclosed as a real, pre-existing asymmetry WITHIN this single
//    module: `getNestedTasks` (via the already schema-branched `util.element
//    .getComponents`) IS IFC2X3-safe, while `getParentTask`/`deriveCalendar`/
//    `getSequenceAssignment`/`getTaskWorkSchedule` (and therefore `getTasksForProduct`'s
//    own `schedule`-filter branch) are NOT. Pinned by dedicated regression tests
//    (`sequence.test.ts`).
//
// 3. *** THE BIGGEST FINDING: `isDayInWorkTime` (and therefore `isWorkingDay`/
//    `isCalendarApplicable`, both of which call it transitively) crashes with a genuine
//    `TypeError` in real Python whenever `IfcWorkTime.Start`/`.Finish` is set to a value
//    that includes a time component (i.e. any realistic `IfcDateTime`-formatted string)
//    ***. Confirmed empirically against a real Python `ifcopenshell` install (not
//    inferred): `is_day_in_work_time` always truncates `day` down to a bare
//    `datetime.date` (`day = datetime.date(day.year, day.month, day.day)` whenever `day`
//    was a `datetime.datetime`, a no-op otherwise -- either way `day` ends up a plain
//    `date`), then compares it directly against `ifcopenshell.util.date.ifc2datetime
//    (work_time[4])`/`[5]`, which returns a full `datetime.datetime` whenever the
//    underlying string has a time component (`ifc2datetime`'s own `":" in element`
//    dispatch, ported in `util/date.ts`). Python 3 genuinely raises `TypeError: can't
//    compare datetime.datetime to datetime.date` for ANY `<`/`>` comparison between a
//    bare `date` and a `datetime` -- confirmed both directions, and even for two values
//    naming the exact same calendar day (time-of-day is irrelevant, only the TYPE
//    mismatch matters). A date-ONLY `Start`/`Finish` string (no `":"`) avoids the crash
//    entirely (both sides end up "date"-kind, ordinary comparison). In practice this
//    means the WorkTime-validity-range feature of `IfcWorkCalendar` is essentially
//    unusable in real `ifcopenshell.util.sequence` today whenever `Start`/`Finish` is
//    populated the realistic way (a full ISO 8601 date-time string). Ported verbatim via
//    a strict, kind-aware comparator (`compareCalendarValues` below) that throws the
//    identical message when comparing a `"date"`-kind value against a `"datetime"`-kind
//    one -- not silently normalized or "fixed". Pinned by a dedicated regression test
//    using a realistic full-datetime `Start` value (`sequence.test.ts`).
//
//    3b. A further, previously-undocumented quirk in this SAME function, found while
//    writing this port's own tests: when BOTH `Start` and `Finish` are set (and neither
//    crashes per #3 above, i.e. both are date-only), the `Finish` check runs SECOND and
//    unconditionally OVERWRITES the `Start` check's result via a plain reassignment
//    (`is_day_in_work_time = ...`), NOT combined with `and` -- so the `Start` bound is
//    silently ignored whenever `Finish` is also set. Confirmed empirically: with
//    `Start="2020-01-01"`/`Finish="2020-12-31"`, `is_day_in_work_time(date(2019, 1, 1),
//    work_time)` returns `True` (the day is BEFORE `Start`, yet reported "in work time"
//    anyway, purely because it's also before `Finish`). `isDayInWorkTime` below
//    reproduces this verbatim via its own sequential (not `&&`-combined) `result = ...`
//    reassignments -- not "fixed" into a combined range check. Pinned by a dedicated
//    regression test.
//
// 4. `isWorkTimeApplicableToDay`'s `MONTHLY_BY_POSITION` branch reads
//    `recurrence["Position"]` (bracket/string-key indexing) instead of
//    `recurrence.Position` (dot access, used correctly in the very next, sibling
//    `YEARLY_BY_POSITION` branch) -- `ifcopenshell.entity_instance.__getitem__` only
//    ever accepts an INTEGER positional attribute index (confirmed directly against the
//    real `entity_instance.py` source: `def __getitem__(self, key: int) -> Any: if key <
//    0 or key >= len(self): ...`), so indexing with the string literal `"Position"`
//    always raises `TypeError: '<' not supported between instances of 'str' and 'int'`
//    in real Python (confirmed empirically). This branch is therefore completely
//    broken/unreachable in real `ifcopenshell.util.sequence` today -- ported verbatim
//    (NOT "fixed" to `.Position`), pinned by a dedicated regression test.
//
// 5. `isWorkTimeApplicableToDay`'s `DAILY`/`WEEKLY` branches each contain dead code: when
//    `Interval`/`Occurrences` is actually set, both branches check `work_time[4]`
//    (Start) and then unconditionally `return False` regardless of that check's outcome
//    (`if not work_time[4]: return False` immediately followed by `return False  #
//    TODO`) -- the whole nested check can never affect the result. Ported verbatim
//    (including the inert check) rather than collapsed, matching this project's policy
//    of preserving real dead code found upstream rather than simplifying it away.
//
// 6. `isWorkTimeApplicableToDay` has no fallback branch for 2 of the 8 real
//    `IfcRecurrenceTypeEnum` values (`BY_DAY_COUNT`/`BY_WEEKDAY_COUNT`) -- Python falls
//    off the end of the function, implicitly returning `None` (not `False`) despite the
//    function's own `-> bool` type hint. Ported verbatim (`undefined` in that case).
//
// 7. `getTaskWorkSchedule` has a genuine self-recursion risk: `return
//    get_task_work_schedule(parent_task) or get_task_work_schedule(task)` -- if the
//    recursive call up the parent chain returns falsy (i.e. some ancestor's own root
//    task has no `IfcRelAssignsToControl`/`IfcWorkSchedule` assignment at all --
//    malformed/incomplete data), the SAME expression re-evaluates
//    `get_task_work_schedule(task)` with the exact same `task` argument as the original
//    call, which recomputes the exact same `parent_task` and re-enters the exact same
//    branch -- genuine infinite recursion (`RecursionError` in real Python; a
//    `RangeError: Maximum call stack size exceeded` here), not a graceful `None`.
//    Confirmed by tracing the control flow precisely, not merely inferred. Ported
//    verbatim (no defensive guard added), pinned by a dedicated regression test using an
//    orphan task chain with no `IfcWorkSchedule` anywhere in it.
//
// 8. `getRelatedProducts`'s own type hint/docstring claims a `set[ifcopenshell
//    .entity_instance]` return ("A set of IfcProducts output by the IfcTask"), but the
//    real implementation calls `products.add(assignment.RelatingProduct.id())` --
//    adding the numeric **id**, not the entity itself. Confirmed by re-reading the exact
//    source line. Ported verbatim as `Set<number>`, disclosed as a genuine doc/
//    implementation mismatch rather than "corrected" to return entities.
//
// 9. `isWorkingDay`/`isCalendarApplicable` are `@functools.cache`-decorated in real
//    Python (memoized per `(day, calendar)` pair) -- two future, still-unported
//    `api.sequence` files (`add_time_period.py`, `edit_recurrence_pattern.py`) call
//    `.cache_clear()` on both after mutating a calendar's structure, purely to
//    invalidate this cache. This port does NOT implement memoization at all (a
//    deliberate simplification: always recomputing is strictly MORE correct than
//    Python's cache-plus-manual-invalidation scheme, just less optimized) -- when those
//    2 files are eventually ported, their `.cache_clear()` calls simply have nothing to
//    do here.
//
// Everything else (the date-arithmetic helpers, the task-tree walk) is a
// straightforward, faithful 1:1 port with no further disclosed gaps -- this is a pure
// `util` module with no `ifcopenshell.geom`/native-primitive dependency of any kind.
//
// *** Type design note ***: Python's `day`/`start`/`finish`/`date` parameters accept
// either a `datetime.date` or a `datetime.datetime` interchangeably throughout this
// module (several functions explicitly narrow the latter to the former via
// `datetime.date(day.year, day.month, day.day)`) -- real callers (all in the
// not-yet-ported `api.sequence`) always pass a value round-tripped through
// `ifcopenshell.util.date.ifc2datetime`. `CalendarValue` below (`IsoDate | IsoDateTime`,
// both already exported by `util/date.ts`) is the structural equivalent: every function
// here reads only the `year`/`month`/`day` fields both share, generic functions that
// need to preserve the caller's exact kind (`offsetDate`/`getSoonestWorkingDay`/
// `getRecentWorkingDay`/`getStartOrFinishDate`) are typed `<T extends CalendarValue>`.

import type { EntityInstance } from "../entityInstance";
import { type Duration, type IfcDateTimeValue, type IsoDate, type IsoDateTime, ifc2datetime } from "./date";
import { getComponents } from "./element";

/** Python: `DURATION_TYPE = Literal["ELAPSEDTIME", "WORKTIME", "NOTDEFINED"]`. */
export type DurationType = "ELAPSEDTIME" | "WORKTIME" | "NOTDEFINED";

/** Python: `RECURRENCE_TYPE = Literal[...]` (the 8 real `IfcRecurrenceTypeEnum` values). */
export type RecurrenceType =
	| "BY_DAY_COUNT"
	| "BY_WEEKDAY_COUNT"
	| "DAILY"
	| "MONTHLY_BY_DAY_OF_MONTH"
	| "MONTHLY_BY_POSITION"
	| "WEEKLY"
	| "YEARLY_BY_DAY_OF_MONTH"
	| "YEARLY_BY_POSITION";

/** See this file's header comment's "Type design note". */
export type CalendarValue = IsoDate | IsoDateTime;

// --- internal helpers (not exported -- pure translation aids, no Python counterpart,
// matching `util/resource.ts`/`util/classification.ts`'s own established local-helper
// precedent for this exact shape) ---

/** Python's `x or []` idiom for a possibly-`null` array attribute. Deliberately does
 * NOT catch an `AttributeError`-equivalent the way `util/element.ts`'s own `attrList`
 * does -- several call sites below rely on a genuinely undeclared attribute (IFC2X3's
 * missing `Nests`/`IsNestedBy`) throwing through, matching real Python (see header
 * comment finding #2); this helper only ever substitutes `[]` for an actual `null`
 * VALUE, never for a thrown exception. */
function attrList<T = EntityInstance>(element: EntityInstance, name: string): T[] {
	return (element.get(name) as T[] | null) ?? [];
}

/** Python's `getattr(x, name, None)` -- unlike `attrList` above, this one DOES catch a
 * genuinely undeclared attribute (matching the explicit 3-arg `getattr` builtin's own
 * suppress-`AttributeError`-into-`default` semantics, distinct from a plain `x.attr`
 * access or `x.attr or []`, neither of which actually catches anything in Python). */
function attrOrNull(element: EntityInstance, name: string): unknown {
	try {
		return element.get(name);
	} catch {
		return null;
	}
}

/**
 * Python's `set()` idiom for a `set[entity_instance]`-returning function, keyed by
 * `EntityInstance.identity()` rather than JS reference equality (the N-API primitive
 * layer mints a fresh wrapper object per access) -- matches `util/classification.ts`'s
 * own local copy of this exact class precisely.
 */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}

	update(instances: Iterable<EntityInstance>): void {
		for (const instance of instances) this.add(instance);
	}

	toSet(): Set<EntityInstance> {
		return new Set(this.byIdentity.values());
	}
}

/** Python: `datetime.date(day.year, day.month, day.day)` -- truncates any time-of-day
 * component away. A no-op (structurally) when `day` is already `"date"`-kind, exactly
 * like Python's own conditional (`if isinstance(day, datetime.datetime): ...`) is a
 * no-op for an already-bare `date`. */
function toPlainDate(day: CalendarValue): IsoDate {
	return { kind: "date", year: day.year, month: day.month, day: day.day };
}

/** Python: `date.weekday() + 1` -- Monday=1 .. Sunday=7 (ISO weekday numbering, matching
 * `IfcRecurrencePattern.WeekdayComponent`'s own convention). JS `Date.getDay()` is
 * Sunday=0..Saturday=6; converted here rather than reimplementing weekday arithmetic by
 * hand. */
function isoWeekday(day: { year: number; month: number; day: number }): number {
	const jsDay = new Date(day.year, day.month - 1, day.day).getDay();
	return jsDay === 0 ? 7 : jsDay;
}

/** Python: `current_date += datetime.timedelta(days=delta)` -- pure calendar-day
 * arithmetic via JS's own `Date` (matching `util/date.ts`'s `daysInMonth`/`fromTimestamp`
 * precedent for using `Date` as a calendar-math primitive, never for string parsing).
 * Preserves the input's exact "kind" and any other fields (hour/minute/second/
 * microsecond/UTC offset for a `"datetime"`), only `year`/`month`/`day` are recomputed --
 * matching Python's own `datetime.datetime + timedelta(days=N)` preserving time-of-day. */
function addCalendarDays<T extends CalendarValue>(value: T, delta: number): T {
	const base = new Date(value.year, value.month - 1, value.day);
	base.setDate(base.getDate() + delta);
	return { ...value, year: base.getFullYear(), month: base.getMonth() + 1, day: base.getDate() } as T;
}

function describeKind(kind: "date" | "datetime" | "time"): string {
	if (kind === "datetime") return "datetime.datetime";
	if (kind === "date") return "datetime.date";
	return "datetime.time";
}

/**
 * Python: `date`/`datetime` `<`/`>`/`<=`/`>=` comparison. Two same-"kind" values compare
 * their fields lexicographically (year, month, day[, hour, minute, second, microsecond]
 * for `"datetime"`); comparing a `"date"`-kind value against a `"datetime"`-kind one
 * genuinely raises `TypeError: can't compare datetime.datetime to datetime.date` in real
 * Python 3 -- confirmed empirically (see this file's header comment finding #3), and
 * reproduced verbatim here since it's exactly the crash `isDayInWorkTime` hits whenever
 * a `WorkTime`'s Start/Finish carries an actual time component.
 */
function compareCalendarValues(a: CalendarValue, b: CalendarValue): number {
	if (a.kind !== b.kind) {
		throw new TypeError(`can't compare ${describeKind(b.kind)} to ${describeKind(a.kind)}`);
	}
	if (a.year !== b.year) return a.year - b.year;
	if (a.month !== b.month) return a.month - b.month;
	if (a.day !== b.day) return a.day - b.day;
	if (a.kind === "date") return 0;
	const aa = a as IsoDateTime;
	const bb = b as IsoDateTime;
	if (aa.hour !== bb.hour) return aa.hour - bb.hour;
	if (aa.minute !== bb.minute) return aa.minute - bb.minute;
	if (aa.second !== bb.second) return aa.second - bb.second;
	return aa.microsecond - bb.microsecond;
}

/** Python: `start == finish` for `count_working_days`'s early-return check -- comparing
 * a `"date"`-kind value against a `"datetime"`-kind one is genuinely always `False` in
 * real Python (never `True`, and never raises for `==`/`!=` specifically, unlike `<`/`>`
 * -- confirmed against the Python docs and empirically), so a same-kind field-by-field
 * comparison (matching a real `datetime.date`/`datetime.datetime`'s own `__eq__`) is
 * exactly right here. */
function calendarValuesEqual(a: CalendarValue, b: CalendarValue): boolean {
	if (a.kind !== b.kind) return false;
	if (a.year !== b.year || a.month !== b.month || a.day !== b.day) return false;
	if (a.kind === "date") return true;
	const aa = a as IsoDateTime;
	const bb = b as IsoDateTime;
	return aa.hour === bb.hour && aa.minute === bb.minute && aa.second === bb.second && aa.microsecond === bb.microsecond;
}

/** Python: `datetime.datetime.combine(result, datetime.time(hour))`. */
function combineDateWithTime(date: CalendarValue, hour: number): IsoDateTime {
	return {
		kind: "datetime",
		year: date.year,
		month: date.month,
		day: date.day,
		hour,
		minute: 0,
		second: 0,
		microsecond: 0,
	};
}

/**
 * A lenient, generic sort key for `deriveDate`/`guessDateRange`'s own `<`/`>`
 * comparisons -- unlike `compareCalendarValues` above, this does NOT reproduce Python's
 * cross-kind `TypeError` (real callers of `deriveDate`/`guessDateRange` only ever compare
 * two `ifc2datetime` results of the SAME attribute, e.g. `ScheduleStart` across sibling
 * tasks, which are always the same kind in practice -- a deliberately lenient design
 * choice, not a missed finding).
 */
function calendarSortKey(v: IfcDateTimeValue | Duration): readonly number[] {
	if ("kind" in v) {
		if (v.kind === "date") return [v.year, v.month, v.day, 0, 0, 0, 0];
		if (v.kind === "datetime") return [v.year, v.month, v.day, v.hour, v.minute, v.second, v.microsecond];
		return [0, 0, 0, v.hour, v.minute, v.second, v.microsecond]; // "time"
	}
	return [v.years, v.months, v.days, v.hours, v.minutes, v.seconds, 0];
}

function compareDateTimeLike(a: IfcDateTimeValue | Duration, b: IfcDateTimeValue | Duration): number {
	const ka = calendarSortKey(a);
	const kb = calendarSortKey(b);
	for (let i = 0; i < ka.length; i++) {
		if (ka[i] !== kb[i]) return ka[i] - kb[i];
	}
	return 0;
}

// --- Task-tree helpers used by the calendar-arithmetic section below (Python defines
// these later in the file; hoisted here purely for readability -- no behavioral
// significance to the reordering). ---

/**
 * Python: `get_calendar(task) -> Union[entity_instance, None]`.
 *
 * Retrieves the `IfcWorkCalendar` directly assigned to a task, if any.
 */
export function getCalendar(task: EntityInstance): EntityInstance | null {
	for (const rel of attrList(task, "HasAssignments")) {
		if (rel.isA("IfcRelAssignsToControl") && (rel.get("RelatingControl") as EntityInstance).isA("IfcWorkCalendar")) {
			return rel.get("RelatingControl") as EntityInstance;
		}
	}
	return null;
}

/**
 * Python: `derive_calendar(task) -> Union[entity_instance, None]`.
 *
 * Retrieves the task's own calendar, or the nearest ancestor task's calendar. See this
 * file's header comment finding #2: THROWS on IFC2X3 (`task.Nests` is genuinely
 * undeclared there) whenever `getCalendar(task)` itself returns falsy -- i.e. always,
 * since IFC2X3 has no `IfcWorkCalendar` type at all.
 */
export function deriveCalendar(task: EntityInstance): EntityInstance | null {
	const calendar = getCalendar(task);
	if (calendar) return calendar;
	const nests = task.get("Nests") as EntityInstance[]; // direct access -- see header comment finding #2
	if (nests.length > 0) return deriveCalendar(nests[0].get("RelatingObject") as EntityInstance);
	return null;
}

// --- Calendar / working-day arithmetic ---

/**
 * Python: `count_working_days(start, finish, calendar) -> int`.
 */
export function countWorkingDays(start: CalendarValue, finish: CalendarValue, calendar: EntityInstance | null): number {
	let result = 0;
	if (calendarValuesEqual(start, finish)) return 0;
	let currentDate = toPlainDate(start);
	const finishDate = toPlainDate(finish);
	while (compareCalendarValues(currentDate, finishDate) <= 0) {
		if (calendar && attrList(calendar, "WorkingTimes").length > 0 && isWorkingDay(currentDate, calendar)) {
			result += 1;
		} else if (!calendar || !isCalendarApplicable(currentDate, calendar)) {
			result += 1;
		}
		currentDate = addCalendarDays(currentDate, 1);
	}
	return result;
}

/**
 * Python: `get_start_or_finish_date(start, duration, duration_type, calendar,
 * date_type="FINISH")`.
 */
export function getStartOrFinishDate<T extends CalendarValue>(
	start: T,
	duration: Duration,
	durationType: DurationType,
	calendar: EntityInstance | null,
	dateType: "START" | "FINISH" = "FINISH",
): T | IsoDateTime {
	if (!duration.days) {
		// Typically a milestone will have zero duration, so the start == finish.
		return start;
	}
	// We minus 1 because the start day itself is counted as a day.
	const months = Math.trunc(duration.months);
	const years = Math.trunc(duration.years);
	const totalDuration = duration.days + months * 30 + years * 12 * 30;
	let daysDelta = totalDuration - 1;
	if (dateType === "START") daysDelta = -daysDelta;
	const adjustedDuration: Duration = { years: 0, months: 0, days: daysDelta, hours: 0, minutes: 0, seconds: 0 };

	const result = offsetDate(start, adjustedDuration, durationType, calendar);
	if (dateType === "START") return combineDateWithTime(result, 9);
	return combineDateWithTime(result, 17);
}

/**
 * Python: `offset_date(start, duration, duration_type, calendar)`.
 */
export function offsetDate<T extends CalendarValue>(
	start: T,
	duration: Duration,
	durationType: DurationType,
	calendar: EntityInstance | null,
): T {
	let currentDate: T = start;
	const months = duration.months;
	const years = duration.years;

	let absDuration = Math.abs(duration.days + months * 30 + years * 12 * 30);
	const dateOffset = duration.days > 0 ? 1 : -1;
	while (absDuration > 0) {
		if (durationType === "ELAPSEDTIME" || !isCalendarApplicable(currentDate, calendar)) {
			absDuration -= 1;
		} else if (isWorkingDay(currentDate, calendar as EntityInstance)) {
			absDuration -= 1;
		}
		currentDate = addCalendarDays(currentDate, dateOffset);
	}
	if (duration.days > 0) {
		currentDate = getSoonestWorkingDay(currentDate, durationType, calendar);
	} else {
		currentDate = getRecentWorkingDay(currentDate, durationType, calendar);
	}
	return currentDate;
}

/**
 * Python: `get_soonest_working_day(start, duration_type, calendar)`.
 */
export function getSoonestWorkingDay<T extends CalendarValue>(
	start: T,
	durationType: DurationType,
	calendar: EntityInstance | null,
): T {
	if (durationType === "ELAPSEDTIME" || !isCalendarApplicable(start, calendar)) return start;
	let current = start;
	while (!isWorkingDay(current, calendar as EntityInstance)) {
		if (!isCalendarApplicable(current, calendar)) break;
		current = addCalendarDays(current, 1);
	}
	return current;
}

/**
 * Python: `get_recent_working_day(start, duration_type, calendar)`.
 */
export function getRecentWorkingDay<T extends CalendarValue>(
	start: T,
	durationType: DurationType,
	calendar: EntityInstance | null,
): T {
	if (durationType === "ELAPSEDTIME" || !isCalendarApplicable(start, calendar)) return start;
	let current = start;
	while (!isWorkingDay(current, calendar as EntityInstance)) {
		if (!isCalendarApplicable(current, calendar)) break;
		current = addCalendarDays(current, -1);
	}
	return current;
}

/**
 * Python: `@cache def is_working_day(day, calendar) -> bool`. See this file's header
 * comment finding #9 for why this port does not implement memoization. Unlike its
 * sibling `isCalendarApplicable`, this has NO guard for a falsy `calendar` in real
 * Python either -- `calendar.WorkingTimes` on `None` raises `AttributeError` there,
 * reproduced here as a `TypeError` thrown by `.get` on a `null` value, matching Python's
 * own lack of a defensive check (not something this port adds).
 */
export function isWorkingDay(day: CalendarValue, calendar: EntityInstance): boolean {
	let result = false;
	for (const workTime of attrList(calendar, "WorkingTimes")) {
		if (isWorkTimeApplicableToDay(workTime, day)) {
			result = true;
			break;
		}
	}
	if (!result) return result;
	for (const workTime of attrList(calendar, "ExceptionTimes")) {
		if (isWorkTimeApplicableToDay(workTime, day)) {
			result = false;
			break;
		}
	}
	return result;
}

/**
 * Python: `@cache def is_calendar_applicable(day, calendar) -> bool`. See finding #9
 * above for why this port does not implement memoization.
 */
export function isCalendarApplicable(day: CalendarValue, calendar: EntityInstance | null): boolean {
	if (!calendar || attrList(calendar, "WorkingTimes").length === 0) return false;
	for (const workTime of attrList(calendar, "WorkingTimes")) {
		if (isDayInWorkTime(day, workTime)) return true;
	}
	return false;
}

/**
 * Python: `is_day_in_work_time(day, work_time) -> bool`.
 *
 * See this file's header comment finding #3: THROWS whenever `work_time`'s Start/Finish
 * (read positionally, index 4/5 -- see finding #1) carries a full date-TIME value,
 * matching a genuine, confirmed real-Python crash. A date-only Start/Finish string does
 * not crash.
 */
export function isDayInWorkTime(day: CalendarValue, workTime: EntityInstance): boolean {
	let result = true;
	const plainDay = toPlainDate(day);
	// 4 IfcWorkTime Start
	const rawStart = workTime.getByIndex(4) as string | null;
	if (rawStart) {
		const start = ifc2datetime(rawStart) as CalendarValue;
		result = compareCalendarValues(plainDay, start) > 0;
	}
	// 5 IfcWorkTime Finish
	const rawFinish = workTime.getByIndex(5) as string | null;
	if (rawFinish) {
		const finish = ifc2datetime(rawFinish) as CalendarValue;
		result = compareCalendarValues(plainDay, finish) < 0;
	}
	return result;
}

/**
 * Python: `is_work_time_applicable_to_day(work_time, day) -> bool`.
 *
 * See this file's header comment findings #4/#5/#6 for real, verbatim-preserved
 * upstream bugs/dead-code in this function's `MONTHLY_BY_POSITION`/`DAILY`/`WEEKLY`
 * branches, and finding #6 for the 2 `RecurrenceType` values with no branch at all
 * (returns `undefined`, matching Python's implicit `None`).
 */
export function isWorkTimeApplicableToDay(workTime: EntityInstance, day: CalendarValue): boolean | undefined {
	if (!isDayInWorkTime(day, workTime)) return false;
	const recurrence = workTime.get("RecurrencePattern") as EntityInstance | null;
	if (!recurrence) return true;

	const plainDay = toPlainDate(day);
	const recurrenceType = recurrence.get("RecurrenceType") as RecurrenceType;
	const interval = recurrence.get("Interval") as number | null;
	const occurrences = recurrence.get("Occurrences") as number | null;
	const noIntervalOrOccurrences = !interval && !occurrences;

	if (recurrenceType === "DAILY") {
		if (noIntervalOrOccurrences) return true;
		// 4 IfcWorkTime Start -- dead code, see header comment finding #5: both branches
		// return `false` regardless of this check's outcome.
		if (!workTime.getByIndex(4)) return false;
		return false; // TODO
	}
	if (recurrenceType === "WEEKLY") {
		if (noIntervalOrOccurrences) {
			return attrList<number>(recurrence, "WeekdayComponent").includes(isoWeekday(plainDay));
		}
		// 4 IfcWorkTime Start -- dead code, see header comment finding #5.
		if (!workTime.getByIndex(4)) return false;
		return false; // TODO
	}
	if (recurrenceType === "MONTHLY_BY_DAY_OF_MONTH") {
		if (noIntervalOrOccurrences) {
			return attrList<number>(recurrence, "DayComponent").includes(plainDay.day);
		}
		return false; // TODO
	}
	if (recurrenceType === "MONTHLY_BY_POSITION") {
		if (noIntervalOrOccurrences) {
			// Real, disclosed upstream bug -- see header comment finding #4:
			// `recurrence["Position"]` (real Python source) always raises `TypeError` since
			// `entity_instance.__getitem__` only accepts an integer index, never a string
			// key. Reproduced verbatim (not "fixed" to `.get("Position")`).
			if (!attrList<number>(recurrence, "WeekdayComponent").includes(isoWeekday(plainDay))) {
				// Python's `and` short-circuits before ever reaching `recurrence["Position"]`
				// when the WeekdayComponent check already fails -- matched here too, so the
				// crash below is only reached when it would be in real Python as well.
				return false;
			}
			throw new TypeError("'<' not supported between instances of 'str' and 'int'");
		}
		return false; // TODO
	}
	if (recurrenceType === "YEARLY_BY_DAY_OF_MONTH") {
		if (noIntervalOrOccurrences) {
			return (
				attrList<number>(recurrence, "MonthComponent").includes(plainDay.month) &&
				attrList<number>(recurrence, "DayComponent").includes(plainDay.day)
			);
		}
		return false; // TODO
	}
	if (recurrenceType === "YEARLY_BY_POSITION") {
		if (noIntervalOrOccurrences) {
			return (
				attrList<number>(recurrence, "MonthComponent").includes(plainDay.month) &&
				attrList<number>(recurrence, "WeekdayComponent").includes(isoWeekday(plainDay)) &&
				Math.floor(plainDay.day / 7) + 1 === (recurrence.get("Position") as number)
			);
		}
		return false; // TODO
	}
	// `BY_DAY_COUNT`/`BY_WEEKDAY_COUNT` -- see header comment finding #6: real Python
	// falls off the end of the function here, implicitly returning `None`.
	return undefined;
}

// --- Task-tree / schedule traversal ---

/**
 * Python: `derive_date(task, attribute_name, date=None, is_earliest=False,
 * is_latest=False)`.
 */
export function deriveDate(
	task: EntityInstance,
	attributeName: string,
	date: IfcDateTimeValue | Duration | undefined = undefined,
	isEarliest = false,
	isLatest = false,
): IfcDateTimeValue | Duration | undefined {
	let accumulatedDate = date;
	const taskTime = task.get("TaskTime") as EntityInstance | null; // direct access, throws on IFC2X3 (no `TaskTime` attribute)
	if (taskTime) {
		const rawValue = taskTime.get(attributeName);
		const currentDate = rawValue
			? (ifc2datetime(rawValue as string | number | EntityInstance) ?? undefined)
			: undefined;
		if (currentDate) return currentDate;
	}
	for (const subtask of getAllNestedTasks(task)) {
		const currentDate = deriveDate(subtask, attributeName, accumulatedDate, isEarliest, isLatest);
		if (isEarliest) {
			if (currentDate && (accumulatedDate === undefined || compareDateTimeLike(currentDate, accumulatedDate) < 0)) {
				accumulatedDate = currentDate;
			}
		}
		if (isLatest) {
			if (currentDate && (accumulatedDate === undefined || compareDateTimeLike(currentDate, accumulatedDate) > 0)) {
				accumulatedDate = currentDate;
			}
		}
	}
	return accumulatedDate;
}

/**
 * Python: `get_task_work_schedule(task) -> Union[entity_instance, None]`.
 *
 * See this file's header comment finding #7: a genuine self-recursion risk, preserved
 * verbatim (no defensive guard).
 */
export function getTaskWorkSchedule(task: EntityInstance): EntityInstance | null {
	const parentTask = getParentTask(task);
	if (parentTask) {
		return getTaskWorkSchedule(parentTask) ?? getTaskWorkSchedule(task);
	}
	for (const rel of task.get("HasAssignments") as EntityInstance[]) {
		if (rel.isA("IfcRelAssignsToControl") && (rel.get("RelatingControl") as EntityInstance).isA("IfcWorkSchedule")) {
			return rel.get("RelatingControl") as EntityInstance;
		}
	}
	return null;
}

/**
 * Python: `get_nested_tasks(task) -> list[entity_instance]`.
 */
export function getNestedTasks(task: EntityInstance): EntityInstance[] {
	return getComponents(task).filter((obj) => obj.isA("IfcTask"));
}

/**
 * Python: `get_parent_task(task) -> Union[entity_instance, None]`.
 *
 * See this file's header comment finding #2: THROWS on IFC2X3 (`task.Nests` is
 * genuinely undeclared there).
 */
export function getParentTask(task: EntityInstance): EntityInstance | null {
	const nests = task.get("Nests") as EntityInstance[]; // direct access -- see header comment finding #2
	if (nests.length > 0) {
		const obj = nests[0].get("RelatingObject") as EntityInstance;
		if (obj.isA("IfcTask")) return obj;
	}
	return null;
}

/**
 * Python: `get_all_nested_tasks(task) -> Generator[entity_instance]`. Ported as a real
 * JS generator, matching `util/cost.ts`'s own `getAllNestedCostItems` precedent for the
 * identical shape (a Python `Generator`-returning recursive nest walk).
 */
export function* getAllNestedTasks(task: EntityInstance): Generator<EntityInstance> {
	for (const nestedTask of getNestedTasks(task)) {
		yield nestedTask;
		yield* getAllNestedTasks(nestedTask);
	}
}

/**
 * Python: `get_work_schedule_tasks(work_schedule) -> Generator[entity_instance]`. Get
 * all work schedule tasks, including the nested ones.
 */
export function* getWorkScheduleTasks(workSchedule: EntityInstance): Generator<EntityInstance> {
	for (const rootTask of getRootTasks(workSchedule)) {
		yield rootTask;
		yield* getAllNestedTasks(rootTask);
	}
}

/**
 * Python: `get_root_tasks(work_schedule) -> list[entity_instance]`.
 */
export function getRootTasks(workSchedule: EntityInstance): EntityInstance[] {
	const results: EntityInstance[] = [];
	for (const rel of workSchedule.get("Controls") as EntityInstance[]) {
		for (const obj of rel.get("RelatedObjects") as EntityInstance[]) {
			if (obj.isA("IfcTask")) results.push(obj);
		}
	}
	return results;
}

/**
 * Python: `guess_date_range(work_schedule)`.
 */
export function guessDateRange(
	workSchedule: EntityInstance,
): [IfcDateTimeValue | Duration | undefined, IfcDateTimeValue | Duration | undefined] {
	let earliest: IfcDateTimeValue | Duration | undefined;
	let latest: IfcDateTimeValue | Duration | undefined;
	const rootTasks = getRootTasks(workSchedule);
	const tasksWithAssignments: EntityInstance[] = [];
	for (const task of rootTasks) {
		if (hasTaskOutputs(task) || hasTaskInputs(task)) tasksWithAssignments.push(task);
		for (const subTask of getAllNestedTasks(task)) {
			if (hasTaskOutputs(subTask) || hasTaskInputs(subTask)) tasksWithAssignments.push(subTask);
		}
	}

	for (const task of tasksWithAssignments) {
		const derivedStart = deriveDate(task, "ScheduleStart", undefined, true, false);
		const derivedFinish = deriveDate(task, "ScheduleFinish", undefined, false, true);
		if (derivedStart && (!earliest || compareDateTimeLike(derivedStart, earliest) < 0)) earliest = derivedStart;
		if (derivedFinish && (!latest || compareDateTimeLike(derivedFinish, latest) > 0)) latest = derivedFinish;
	}
	return [earliest, latest];
}

/**
 * Python: `get_task_outputs(task, is_recursive=False) -> set[entity_instance]`.
 */
export function getTaskOutputs(task: EntityInstance, isRecursive = false): Set<EntityInstance> {
	const result = new EntityInstanceSet();
	if (isRecursive) {
		for (const subtask of [task, ...getAllNestedTasks(task)]) {
			result.update(getTaskOutputs(subtask));
		}
		return result.toSet();
	}
	for (const rel of task.get("HasAssignments") as EntityInstance[]) {
		if (rel.isA("IfcRelAssignsToProduct")) result.add(rel.get("RelatingProduct") as EntityInstance);
	}
	return result.toSet();
}

/**
 * Python: `get_task_inputs(task, is_recursive=False) -> set[entity_instance]`.
 */
export function getTaskInputs(task: EntityInstance, isRecursive = false): Set<EntityInstance> {
	const result = new EntityInstanceSet();
	if (isRecursive) {
		for (const subtask of [task, ...getAllNestedTasks(task)]) {
			result.update(getTaskInputs(subtask));
		}
		return result.toSet();
	}
	for (const rel of task.get("OperatesOn") as EntityInstance[]) {
		for (const obj of rel.get("RelatedObjects") as EntityInstance[]) {
			if (obj.isA("IfcProduct")) result.add(obj);
		}
	}
	return result.toSet();
}

/**
 * Python: `get_task_resources(task, is_recursive=False) -> set[entity_instance]`.
 */
export function getTaskResources(task: EntityInstance, isRecursive = false): Set<EntityInstance> {
	const result = new EntityInstanceSet();
	if (isRecursive) {
		for (const subtask of [task, ...getAllNestedTasks(task)]) {
			result.update(getTaskResources(subtask));
		}
		return result.toSet();
	}
	for (const rel of task.get("OperatesOn") as EntityInstance[]) {
		for (const obj of rel.get("RelatedObjects") as EntityInstance[]) {
			if (obj.isA("IfcResource")) result.add(obj);
		}
	}
	return result.toSet();
}

/**
 * Python: `has_task_outputs(task) -> bool`.
 */
export function hasTaskOutputs(task: EntityInstance): boolean {
	return getTaskOutputs(task).size > 0;
}

/**
 * Python: `has_task_inputs(task) -> bool`.
 */
export function hasTaskInputs(task: EntityInstance): boolean {
	return getTaskInputs(task).size > 0;
}

/**
 * Python: `get_tasks_for_product(product, schedule=None)`.
 *
 * Get all tasks assigned to or referenced by the given product.
 *
 * @returns A tuple of two lists: the first contains all tasks assigned to the product,
 * the second contains all tasks referenced by the product that are part of the given
 * schedule.
 */
export function getTasksForProduct(
	product: EntityInstance,
	schedule: EntityInstance | null = null,
): [EntityInstance[], EntityInstance[]] {
	let inputs = (product.get("HasAssignments") as EntityInstance[])
		.filter((a) => a.isA("IfcRelAssignsToProcess") && (a.get("RelatingProcess") as EntityInstance).isA("IfcTask"))
		.map((a) => a.get("RelatingProcess") as EntityInstance);
	let outputs = (product.get("ReferencedBy") as EntityInstance[])
		.filter((ref) => ref.isA("IfcRelAssignsToProduct"))
		.flatMap((ref) => ref.get("RelatedObjects") as EntityInstance[])
		.filter((obj) => obj.isA("IfcTask"));

	if (schedule) {
		inputs = inputs.filter((task) => (getTaskWorkSchedule(task) as EntityInstance).id() === schedule.id());
		outputs = outputs.filter((task) => (getTaskWorkSchedule(task) as EntityInstance).id() === schedule.id());
	}

	return [inputs, outputs];
}

/**
 * Python: `get_sequence_assignment(task, sequence="successor")`.
 *
 * See this file's header comment finding #2: THROWS on IFC2X3 whenever the recursive
 * `Nests` fallback is actually reached (`IsPredecessorTo`/`IsSuccessorFrom` return `[]`,
 * not undeclared, on every schema -- only the `Nests` fallback is IFC2X3-unsafe).
 */
export function getSequenceAssignment(task: EntityInstance, sequence = "successor"): EntityInstance[] {
	let relationshipAttr: string;
	if (sequence === "successor") {
		relationshipAttr = "IsPredecessorTo";
	} else if (sequence === "predecessor") {
		relationshipAttr = "IsSuccessorFrom";
	} else {
		return [];
	}

	const relationship = attrOrNull(task, relationshipAttr) as EntityInstance[] | null;
	if (relationship && relationship.length > 0) return relationship;

	for (const rel of task.get("Nests") as EntityInstance[]) {
		const result = getSequenceAssignment(rel.get("RelatingObject") as EntityInstance, sequence);
		if (result.length > 0) return result;
	}

	return [];
}

/**
 * Python: `get_related_products(relating_product=None, related_object=None) ->
 * set[entity_instance]`.
 *
 * Gets the related products being output by a task.
 *
 * See this file's header comment finding #8: real Python's own docstring/type hint
 * claims a `set[entity_instance]` return, but the actual implementation returns a set of
 * numeric **ids** -- reproduced verbatim as `Set<number>`, not "corrected" to entities.
 */
export function getRelatedProducts(
	relatingProduct: EntityInstance | null = null,
	relatedObject: EntityInstance | null = null,
): Set<number> {
	if (!relatingProduct && !relatedObject) {
		throw new Error("Either relating_product or related_object must be provided.");
	}

	let resolvedRelatedObject = relatedObject;
	if (!resolvedRelatedObject && relatingProduct) {
		for (const reference of relatingProduct.get("ReferencedBy") as EntityInstance[]) {
			if (reference.isA("IfcRelAssignsToProduct")) {
				resolvedRelatedObject = (reference.get("RelatedObjects") as EntityInstance[])[0];
			}
		}
	}

	const products = new Set<number>();
	if (resolvedRelatedObject) {
		for (const assignment of resolvedRelatedObject.get("HasAssignments") as EntityInstance[]) {
			if (assignment.isA("IfcRelAssignsToProduct")) {
				products.add((assignment.get("RelatingProduct") as EntityInstance).id());
			}
		}
	}

	return products;
}
