// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/cascade_schedule.py` (src/ifcopenshell-python, 345
// lines, a real `Usecase` class -- see `./calculateTaskDuration.ts`'s own precedent for
// this project's established "private context class + a thin `xUsecase` function that
// instantiates and calls it" convention for a real Python `Usecase` class) -- part of
// `api.sequence` chunk 3 (see `./index.ts`'s own header comment for this chunk's full
// scope). Cascades start/finish dates from a task through its successors
// (`IsPredecessorTo`) and nested subtasks (`IsNestedBy`), recursively, based on each
// successor's `SequenceType` (FINISH_START/START_START/FINISH_FINISH/START_FINISH) and
// optional `TimeLag`.
//
// Ported FIRST within this chunk, per the chunk brief: it has ZERO same-batch
// dependencies (only already-landed `util.date`/`util.sequence`), and 5 other files in
// this same chunk call it for real (not just in a docstring example):
// `assignSequence.ts`, `editLagTime.ts`, `editSequence.ts`, `unassignLagTime.ts`,
// `unassignSequence.ts`.
//
// `util.date.ifc2datetime`/`datetime2ifc` and `util.sequence.deriveCalendar`/
// `getSequenceAssignment`/`getStartOrFinishDate`/`offsetDate` (all already landed) are
// the only real dependencies -- confirmed by reading the whole real file.
//
// --- The recursion-guard / cyclic-sequence detection, ported verbatim including its
//     `print()` diagnostics (as `console.log`, matching `util/migrator.ts`'s/
//     `util/schema.ts`'s own established "Python `print()` -> `console.log`" precedent) ---
//
// Real Python threads a growing `task_sequence` list through the recursion and raises a
// bare `RecursionError` (with a diagnostic `print()` trail) the moment the CURRENT task
// is already present in it -- ported as a plain `Error` (there is no dedicated
// `RecursionError` subclass in JS; `test/api/sequence/cascadeSchedule.test.ts` pins the
// thrown error's identity via `toThrow(Error)`, matching this project's own established
// "no native `RecursionError` equivalent" precedent elsewhere in the port).
//
// --- `IsNestedBy` fallback: `RelatedObjects or []`, ported verbatim ---
//
// Real Python's `for nested_task in rel.RelatedObjects or []` guards against a
// (realistically unreachable, since `IfcRelNests.RelatedObjects` is a mandatory 1+
// aggregate) falsy `RelatedObjects` -- ported as `?? []` below, matching the same
// defensive-but-likely-dead-code shape.
//
// --- `TimeLag.LagValue` branching: `IfcDuration` vs. `IfcRatioMeasure`, ported verbatim
//     (relevant to `assignLagTime`/`editLagTime`'s own already-tracked primitive-layer
//     block -- see those files' own header comments) ---
//
// Every branch below that reads `rel.TimeLag` first checks `rel.TimeLag.LagValue.is_a
// ("IfcDuration")` -- if so, `get_lag_time_days` (`ifc2datetime(lag_time.LagValue.
// wrappedValue).days`) is used; otherwise (an `IfcRatioMeasure` lag, e.g. "150% of the
// predecessor's own duration") `predecessor_duration.days * rel.TimeLag.LagValue.
// wrappedValue` is used instead. Ported verbatim, both branches, even though
// `assignLagTime`/`editLagTime` (this chunk) are currently BLOCKED from ever
// constructing a populated `IfcLagTime` at all (the already-tracked `TODOS.md`
// primitive-layer gap) -- a `TimeLag` read from a file authored by real Python (or
// hand-built via `file.createEntity`/`withAttrs` in a test fixture bypassing that
// block) still needs both branches to work correctly.
//
// --- `days = 0 if predecessor_duration.days == 0 else 1` (FINISH_START only) -- ported
//     verbatim, not "simplified" ---
//
// This odd little `days` seed (only in the FINISH_START branch) means a milestone
// predecessor (zero duration) contributes NO extra day before `TimeLag` is even
// considered, while a real-duration predecessor always contributes exactly 1 extra day
// -- ported exactly, including feeding into the subsequent `if days:`/`else:` branch
// that decides whether to call `offset_date` at all or just reuse `finish` unchanged.
//
// --- Two `starts`/`finishes` entries pushed per branch (once per calendar: `task`'s own
//     and `predecessor`'s), then `max()` taken -- ported verbatim, not deduplicated ---
//
// Real Python computes the SAME offset twice, once against `self.get_calendar(task)` and
// once against `self.get_calendar(predecessor)`, appends BOTH to the same list, then
// takes the max of the whole list at the end. When the two calendars agree (the common
// case) this is a redundant no-op; when they differ, the later (more conservative) date
// wins by construction. Ported exactly as two `push`es per branch, not collapsed into a
// single calendar choice.
//
// --- `potential_finish > finish` / re-deriving the other end via `get_start_or_finish_
//     date` when BOTH `starts` and `finishes` are non-empty -- ported verbatim ---
//
// When a task has predecessors of DIFFERENT sequence types feeding both a `starts` and a
// `finishes` candidate, real Python computes what the finish WOULD be if using the
// computed start (`get_start_or_finish_date(start, duration, ..., "FINISH")`), and only
// if that potential finish is LATER than the independently-computed `finishes` candidate
// does it use the start-driven pair; otherwise it uses the finish-driven pair, re-
// deriving start from finish instead. Ported exactly, including the strict `>` (not
// `>=`) comparison.
//
// --- "no-op if unchanged, UNLESS this is the first task" -- ported verbatim ---
//
// Every one of the three terminal branches (`starts && finishes` / `finishes` only /
// `starts` only) short-circuits with a bare `return` (skipping both the sibling-date
// write below it AND the recursive descent into successors/nested tasks entirely) the
// moment the newly-computed value already matches what's stored, UNLESS `is_first_task`
// -- so re-cascading from a task whose own dates didn't change never touches its
// successors, but the very first call always writes through and always descends,
// regardless of whether anything actually changed. Ported exactly: the recursive
// descent block is only reached when at least one of the three branches above did NOT
// early-return (or when `task.TaskTime` had no successors/nested tasks contributing any
// `starts`/`finishes` candidate at all, in which case none of the three branches runs
// and the descent still happens).
//
// Schema availability: `IfcTaskTime`/`IfcLagTime` don't exist on IFC2X3 at all
// (confirmed against `ifc2x3.d.ts`, matching this module's own chunk 1/2 findings) --
// `if not task.TaskTime: return` means this function is a silent no-op for any IFC2X3
// task (never throws, since `TaskTime` is read via `.get()` which returns `null` for an
// unset-but-declared attribute -- but IFC2X3's `IfcTask` doesn't even DECLARE `TaskTime`
// at all, so `.get("TaskTime")` itself throws there, matching real Python's own
// `AttributeError` for the same undeclared-attribute read). No IFC2X3 test coverage,
// matching real Python's own test suite (`test_cascade_schedule.py`: "sequence module
// features relies on entities introduced in IFC4 therefore no IFC2X3 tests").

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type Duration, datetime2ifc, ifc2datetime } from "../../util/date";
import {
	type CalendarValue,
	type DurationType,
	deriveCalendar,
	getSequenceAssignment,
	getStartOrFinishDate,
	offsetDate,
} from "../../util/sequence";
import { wrapUsecase } from "../hooks";

const ZERO_DURATION: Duration = {
	years: 0,
	months: 0,
	days: 0,
	hours: 0,
	minutes: 0,
	seconds: 0,
};

/** Python: `datetime.datetime.combine(date, datetime.time(hour))` -- see this file's
 * header comment; `util/sequence.ts`'s own identical private helper isn't exported, so
 * this is a local copy of the exact same translation. */
function combineDateWithTime(date: CalendarValue, hour: number): CalendarValue {
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

function daysOf(duration: Duration): number {
	return duration.days;
}

class CascadeScheduleContext {
	private readonly calendarCache = new Map<number, EntityInstance | null>();

	constructor(private readonly file: IfcFile) {}

	execute(task: EntityInstance): void {
		this.cascadeTask(task, true, []);
	}

	private cascadeTask(task: EntityInstance, isFirstTask: boolean, taskSequence: EntityInstance[]): void {
		if (taskSequence.some((t) => t.equals(task))) {
			console.log("Warning! Recursive sequence is as follows:");
			taskSequence.forEach((debugTask, i) => {
				if (i === 0) {
					console.log("Starting at", debugTask);
				} else {
					console.log("... is a predecessor to ...", debugTask);
				}
			});
			console.log("... which is cyclically a predecessor to ...", task);
			throw new Error("Recursive tasks found. Could not cascade schedule.");
		}

		const taskTime = task.get("TaskTime") as EntityInstance | null;
		if (!taskTime) return;

		const scheduleDuration = taskTime.get("ScheduleDuration") as string | null;
		const duration: Duration = scheduleDuration ? (ifc2datetime(scheduleDuration) as Duration) : ZERO_DURATION;

		const finishes: CalendarValue[] = [];
		const starts: CalendarValue[] = [];

		for (const rel of getSequenceAssignment(task, "predecessor")) {
			const predecessor = rel.get("RelatingProcess") as EntityInstance;
			const predecessorTaskTime = predecessor.get("TaskTime") as EntityInstance | null;
			const predecessorScheduleDuration = predecessorTaskTime?.get("ScheduleDuration") as string | null | undefined;
			const predecessorDuration: Duration = predecessorScheduleDuration
				? (ifc2datetime(predecessorScheduleDuration) as Duration)
				: ZERO_DURATION;

			const sequenceType = rel.get("SequenceType") as string;
			const timeLag = rel.get("TimeLag") as EntityInstance | null;

			if (sequenceType === "FINISH_START") {
				const finish = this.getTaskTimeAttribute(predecessor, "ScheduleFinish");
				if (!finish) continue;
				let days = daysOf(predecessorDuration) === 0 ? 0 : 1;
				let durationType: DurationType = "WORKTIME";
				if (timeLag) {
					days += this.lagContribution(timeLag, predecessorDuration);
					durationType = timeLag.get("DurationType") as DurationType;
				}
				if (days) {
					starts.push(combineDateWithTime(this.offsetDate(finish, days, durationType, this.getCalendar(task)), 9));
					starts.push(
						combineDateWithTime(this.offsetDate(finish, days, durationType, this.getCalendar(predecessor)), 9),
					);
				} else {
					starts.push(finish);
				}
			} else if (sequenceType === "START_START") {
				const start = this.getTaskTimeAttribute(predecessor, "ScheduleStart");
				if (!start) continue;
				if (timeLag) {
					const days = this.lagContribution(timeLag, predecessorDuration);
					const durationType = timeLag.get("DurationType") as DurationType;
					starts.push(this.offsetDate(start, days, durationType, this.getCalendar(task)));
					starts.push(this.offsetDate(start, days, durationType, this.getCalendar(predecessor)));
				} else {
					starts.push(start);
				}
			} else if (sequenceType === "FINISH_FINISH") {
				const finish = this.getTaskTimeAttribute(predecessor, "ScheduleFinish");
				if (!finish) continue;
				if (timeLag) {
					const days = this.lagContribution(timeLag, predecessorDuration);
					const durationType = timeLag.get("DurationType") as DurationType;
					finishes.push(this.offsetDate(finish, days, durationType, this.getCalendar(task)));
					finishes.push(this.offsetDate(finish, days, durationType, this.getCalendar(predecessor)));
				} else {
					finishes.push(finish);
				}
			} else if (sequenceType === "START_FINISH") {
				const start = this.getTaskTimeAttribute(predecessor, "ScheduleStart");
				if (!start) continue;
				let days = -1;
				let durationType: DurationType = "WORKTIME";
				if (timeLag) {
					days += this.lagContribution(timeLag, predecessorDuration);
					durationType = timeLag.get("DurationType") as DurationType;
				}
				if (days || timeLag) {
					finishes.push(combineDateWithTime(this.offsetDate(start, days, durationType, this.getCalendar(task)), 17));
					finishes.push(
						combineDateWithTime(this.offsetDate(start, days, durationType, this.getCalendar(predecessor)), 17),
					);
				} else {
					finishes.push(start);
				}
			}
		}

		if (starts.length > 0 && finishes.length > 0) {
			const start = maxCalendarValue(starts);
			const finish = maxCalendarValue(finishes);
			const potentialFinish = getStartOrFinishDate(
				start,
				duration,
				taskTime.get("DurationType") as DurationType,
				this.getCalendar(task),
				"FINISH",
			);
			if (compareMixed(potentialFinish, finish) > 0) {
				const startIfc = datetime2ifc(start, "IfcDateTime");
				if (taskTime.get("ScheduleStart") === startIfc && !isFirstTask) return;
				taskTime.set("ScheduleStart", startIfc);
				taskTime.set("ScheduleFinish", datetime2ifc(potentialFinish, "IfcDateTime"));
			} else {
				const finishIfc = datetime2ifc(finish, "IfcDateTime");
				if (taskTime.get("ScheduleFinish") === finishIfc && !isFirstTask) return;
				taskTime.set("ScheduleFinish", finishIfc);
				taskTime.set(
					"ScheduleStart",
					datetime2ifc(
						getStartOrFinishDate(
							finish,
							duration,
							taskTime.get("DurationType") as DurationType,
							this.getCalendar(task),
							"START",
						),
						"IfcDateTime",
					),
				);
			}
		} else if (finishes.length > 0) {
			const finish = maxCalendarValue(finishes);
			const finishIfc = datetime2ifc(finish, "IfcDateTime");
			if (taskTime.get("ScheduleFinish") === finishIfc && !isFirstTask) return;
			taskTime.set("ScheduleFinish", finishIfc);
			taskTime.set(
				"ScheduleStart",
				datetime2ifc(
					getStartOrFinishDate(
						finish,
						duration,
						taskTime.get("DurationType") as DurationType,
						this.getCalendar(task),
						"START",
					),
					"IfcDateTime",
				),
			);
		} else if (starts.length > 0) {
			const start = maxCalendarValue(starts);
			const startIfc = datetime2ifc(start, "IfcDateTime");
			if (taskTime.get("ScheduleStart") === startIfc && !isFirstTask) return;
			taskTime.set("ScheduleStart", startIfc);
			taskTime.set(
				"ScheduleFinish",
				datetime2ifc(
					getStartOrFinishDate(
						start,
						duration,
						taskTime.get("DurationType") as DurationType,
						this.getCalendar(task),
						"FINISH",
					),
					"IfcDateTime",
				),
			);
		}

		const isPredecessorTo = (task.get("IsPredecessorTo") as EntityInstance[] | null) ?? [];
		for (const rel of isPredecessorTo) {
			this.cascadeTask(rel.get("RelatedProcess") as EntityInstance, false, [...taskSequence, task]);
		}

		const isNestedBy = (task.get("IsNestedBy") as EntityInstance[] | null) ?? [];
		for (const rel of isNestedBy) {
			const relatedObjects = (rel.get("RelatedObjects") as EntityInstance[] | null) ?? [];
			for (const nestedTask of relatedObjects) {
				this.cascadeTask(nestedTask, false, [...taskSequence, task]);
			}
		}
	}

	/** Python: `get_lag_time_days`/the inline `IfcRatioMeasure` branch -- see this file's
	 * header comment for why both branches matter even though `IfcLagTime` construction
	 * is currently blocked elsewhere in this chunk. Reads the wrapped scalar via
	 * `.getByIndex(0)`, not `.get("wrappedValue")` -- see `util/cost.ts`'s own
	 * `wrappedValueOf` helper's doc comment: a standalone declared-type instance stores
	 * its single value at attribute index 0, and the N-API attribute-value shim doesn't
	 * support a `"wrappedValue"` pseudo-attribute name. */
	private lagContribution(timeLag: EntityInstance, predecessorDuration: Duration): number {
		const lagValue = timeLag.get("LagValue") as EntityInstance;
		if (lagValue.isA("IfcDuration")) {
			return this.getLagTimeDays(timeLag);
		}
		return daysOf(predecessorDuration) * (lagValue.getByIndex(0) as number);
	}

	private getLagTimeDays(lagTime: EntityInstance): number {
		const lagValue = lagTime.get("LagValue") as EntityInstance;
		const duration = ifc2datetime(lagValue.getByIndex(0) as string) as Duration;
		return duration.days;
	}

	private getCalendar(task: EntityInstance): EntityInstance | null {
		const id = task.id();
		if (!this.calendarCache.has(id)) {
			this.calendarCache.set(id, deriveCalendar(task));
		}
		return this.calendarCache.get(id) ?? null;
	}

	private offsetDate(
		date: CalendarValue,
		days: number,
		durationType: DurationType,
		calendar: EntityInstance | null,
	): CalendarValue {
		return offsetDate(date, { years: 0, months: 0, days, hours: 0, minutes: 0, seconds: 0 }, durationType, calendar);
	}

	private getTaskTimeAttribute(task: EntityInstance, attribute: string): CalendarValue | undefined {
		const taskTime = task.get("TaskTime") as EntityInstance | null;
		if (taskTime) {
			const value = taskTime.get(attribute) as string | null;
			if (value) {
				return ifc2datetime(value) as CalendarValue;
			}
		}
		return undefined;
	}
}

/** Python: `max(starts)`/`max(finishes)` -- a plain chronological max over same-"kind"
 * `CalendarValue`s (every entry pushed above is always `"datetime"`-kind, since every
 * push site either combines with a time-of-day or reuses a `getTaskTimeAttribute` result
 * that -- for `ScheduleStart`/`ScheduleFinish`, always stored as `IfcDateTime` by this
 * same function and by `editTaskTime` -- is itself always `"datetime"`-kind). */
function maxCalendarValue(values: CalendarValue[]): CalendarValue {
	let result = values[0];
	for (const value of values.slice(1)) {
		if (compareMixed(value, result) > 0) result = value;
	}
	return result;
}

/** Field-by-field chronological comparison, tolerant of a `"date"`-vs-`"datetime"`
 * mismatch (treats a bare date as midnight) -- used only for the `potential_finish >
 * finish` comparison, where real Python compares two `datetime.datetime` values that are
 * always genuinely same-"kind" in practice (unlike `util/sequence.ts`'s own
 * `compareCalendarValues`, which deliberately throws on a kind mismatch to match a real,
 * reachable Python `TypeError` elsewhere -- no such mismatch is reachable here since both
 * sides of this one comparison are always `"datetime"`-kind, per `maxCalendarValue`'s own
 * comment above). */
function compareMixed(a: CalendarValue, b: CalendarValue): number {
	const ah = a.kind === "datetime" ? a.hour : 0;
	const bh = b.kind === "datetime" ? b.hour : 0;
	const amin = a.kind === "datetime" ? a.minute : 0;
	const bmin = b.kind === "datetime" ? b.minute : 0;
	const asec = a.kind === "datetime" ? a.second : 0;
	const bsec = b.kind === "datetime" ? b.second : 0;
	if (a.year !== b.year) return a.year - b.year;
	if (a.month !== b.month) return a.month - b.month;
	if (a.day !== b.day) return a.day - b.day;
	if (ah !== bh) return ah - bh;
	if (amin !== bmin) return amin - bmin;
	return asec - bsec;
}

export interface CascadeScheduleSettings {
	/** The start task to begin cascading from. */
	task: EntityInstance;
}

function cascadeScheduleUsecase(file: IfcFile, settings: CascadeScheduleSettings): void {
	new CascadeScheduleContext(file).execute(settings.task);
}

/**
 * Cascades start and end dates of tasks based on durations (Python:
 * `ifcopenshell.api.sequence.cascade_schedule`).
 *
 * Given a start task with a start date and duration, the end date, and the start and end
 * of all successor tasks with durations may be automatically computed.
 *
 * Using this automatic computation is recommended as an alternative to manually
 * specifying dates. It is useful for doing edits and cascading changes.
 *
 * Dates can only cascade from predecessor to successors, not backwards. Cyclical
 * relationships are invalid and will result in an error being thrown (Python: a bare
 * `RecursionError`; no equivalent subclass exists in JS, so a plain `Error` is thrown
 * here instead -- see this file's header comment).
 *
 * Note that there may be differences between how different planning software calculate
 * start and end dates. Some may consider Monday 5pm to be equivalent to Tuesday 8am, for
 * instance.
 *
 * @example
 * ```ts
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction" });
 * const task = api.sequence.addTask(model, { workSchedule: schedule, name: "Site establishment" });
 * const time = api.sequence.addTaskTime(model, { task });
 * api.sequence.editTaskTime(model, { taskTime: time, attributes: { ScheduleStart: "2000-01-01", ScheduleDuration: "P1W" } });
 * api.sequence.cascadeSchedule(model, { task });
 * ```
 */
export const cascadeSchedule = wrapUsecase("sequence.cascade_schedule", cascadeScheduleUsecase);
