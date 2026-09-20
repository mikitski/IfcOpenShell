// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/edit_task_time.py` (src/ifcopenshell-python, 154
// lines, a real `Usecase` class -- see `./calculateTaskDuration.ts`'s own precedent for
// this project's established "private context class + a thin `xUsecase` function that
// instantiates and calls it" convention for a real Python `Usecase` class) -- part of
// `api.sequence` chunk 3 (see `./index.ts`'s own header comment for this chunk's full
// scope). Edits an `IfcTaskTime`'s attributes, with special handling for
// `ScheduleStart`/`ScheduleFinish` (snapped forward to the soonest working day, then
// combined with a fixed 9am/5pm time-of-day), automatic finish/duration derivation, a
// cascade of the whole schedule when a date-affecting attribute changed, and a knock-on
// resource-usage recalculation.
//
// `util.date.ifc2datetime`/`datetime2ifc`/`parseIsoDatetime`, `util.sequence.
// deriveCalendar`/`getSoonestWorkingDay`/`getStartOrFinishDate`/`isWorkingDay`/
// `getTaskResources`, `util.constraint.isAttributeLocked` (all already landed), `./
// cascadeSchedule.ts` (this chunk, ported first) and `api.resource.
// calculateResourceUsage` (already landed -- a real, non-`api.sequence` cross-module
// dependency, confirmed at the real file's own line 150) are the only real dependencies
// -- confirmed by reading the whole real file.
//
// --- Real Python MUTATES the caller's own `attributes` dict in place -- ported verbatim,
//     not defensively copied ---
//
// `del attributes["ScheduleFinish"]` and the later `attributes["ScheduleFinish"] =
// datetime.datetime.combine(...)`/`attributes["ScheduleStart"] = ...` all mutate the
// EXACT dict object the caller passed in, not a local copy -- a real, disclosed side
// effect (a caller who inspects their own `attributes` object after calling this
// function would see it changed). Ported verbatim: `settings.attributes` (the caller's
// own object) is mutated directly below, not copied first.
//
// --- "duration takes priority": a truthy `ScheduleDuration` deletes a co-supplied
//     `ScheduleFinish`, ported verbatim ---
//
// If the caller supplies BOTH a truthy `ScheduleDuration` and a `ScheduleFinish` in the
// same call, the `ScheduleFinish` entry is deleted from `attributes` before anything else
// runs -- so it's never written at all in the main loop below (though it may still be
// recomputed afterward via `calculateFinish`, since `ScheduleDuration` remains).
//
// --- `get_soonest_working_day`/`datetime.combine` preprocessing applies ONLY to
//     `ScheduleStart`/`ScheduleFinish`, not to `ActualStart`/`EarlyFinish`/etc. -- ported
//     verbatim ---
//
// Every OTHER attribute whose name merely CONTAINS "Start" or "Finish" (e.g.
// `ActualStart`, `EarlyFinish`, `LateStart`) still gets converted via `datetime2ifc(...,
// "IfcDateTime")` in the generic loop below, but skips the soonest-working-day snapping
// and fixed 9am/5pm time-of-day combination entirely -- only `ScheduleStart`/
// `ScheduleFinish` get that special treatment, per real Python's own two dedicated
// `if finish:`/`if start:` blocks (which only ever read/write those two specific keys).
//
// --- `"Start" in name or "Finish" in name or name == "StatusTime"` -- a broad SUBSTRING
//     match, not an exact-name match, ported verbatim ---
//
// This is real Python's own `in` operator on a string (substring containment), not a
// membership check against a fixed set of attribute names -- ported as
// `name.includes("Start") || name.includes("Finish")`, matching the same broad match.
//
// --- `getTask`'s bare `next(...)` -- a real Python `StopIteration` if no `IfcTask`
//     references this `IfcTaskTime`, ported as a thrown `Error` ---
//
// Realistically unreachable via this function's own call shape (an `IfcTaskTime` is only
// ever created by `./addTaskTime.ts`, which always immediately assigns it to exactly one
// task's own `TaskTime`), but ported as a descriptive thrown `Error` rather than
// silently returning `undefined`, matching this project's established "thrown Error,
// direct equivalent of an uncaught Python exception" precedent.
//
// Schema availability: `IfcTaskTime` does NOT exist on IFC2X3 at all (confirmed against
// `src/generated/ifc2x3.d.ts`, matching `./addTaskTime.ts`'s own already-disclosed
// finding) -- unreachable on IFC2X3 in practice, matching real Python's own test suite
// ("sequence module features relies on entities introduced in IFC4 therefore no IFC2X3
// tests").

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { isAttributeLocked } from "../../util/constraint";
import { type Datetime2IfcInput, type Duration, datetime2ifc, ifc2datetime, parseIsoDatetime } from "../../util/date";
import {
	type CalendarValue,
	type DurationType,
	deriveCalendar,
	getSoonestWorkingDay,
	getStartOrFinishDate,
	getTaskResources,
	isWorkingDay,
} from "../../util/sequence";
import { wrapUsecase } from "../hooks";
import { calculateResourceUsage } from "../resource/calculateResourceUsage";
import { cascadeSchedule } from "./cascadeSchedule";

/** Python: `datetime.datetime.combine(date, datetime.time(hour))` -- see
 * `./cascadeSchedule.ts`'s own identical local helper's doc comment for why this isn't
 * shared/exported from `util/sequence.ts`. */
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

/** Python: `datetime.date(y, m, d)` triple, used only for `calculateDuration`'s own
 * day-counting loop below (plain calendar-day arithmetic, no time-of-day). */
interface Ymd {
	year: number;
	month: number;
	day: number;
}

function compareYmd(a: Ymd, b: Ymd): number {
	if (a.year !== b.year) return a.year - b.year;
	if (a.month !== b.month) return a.month - b.month;
	return a.day - b.day;
}

function addDay(value: Ymd): Ymd {
	const date = new Date(value.year, value.month - 1, value.day);
	date.setDate(date.getDate() + 1);
	return {
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate(),
	};
}

class EditTaskTimeContext {
	private taskTime!: EntityInstance;
	private task!: EntityInstance;
	private calendar: EntityInstance | null = null;

	constructor(private readonly file: IfcFile) {}

	execute(taskTime: EntityInstance, attributes: Record<string, unknown>): void {
		this.taskTime = taskTime;
		this.task = this.getTask();
		this.calendar = deriveCalendar(this.task);

		// See this file's header comment: Python mutates the caller's own `attributes`
		// dict in place -- ported verbatim, not defensively copied.
		// `delete` (not an `undefined` assignment -- biome's own suggested fix) is
		// required here, matching `api.resource.editResourceTime`'s own identical
		// precedent: the key must be fully absent (`Object.hasOwn` checks further down
		// rely on its absence, matching Python's own `"ScheduleFinish" in attributes
		// .keys()` check), not merely present with an `undefined` value.
		if (attributes.ScheduleDuration && Object.hasOwn(attributes, "ScheduleFinish")) {
			// biome-ignore lint/performance/noDelete: see the comment above this `if`.
			delete attributes.ScheduleFinish;
		}

		const durationType = (
			Object.hasOwn(attributes, "DurationType") ? attributes.DurationType : this.taskTime.get("DurationType")
		) as DurationType;

		const finish = attributes.ScheduleFinish as string | CalendarValue | null | undefined;
		if (finish) {
			const finishDt = typeof finish === "string" ? parseIsoDatetime(finish) : finish;
			attributes.ScheduleFinish = combineDateWithTime(getSoonestWorkingDay(finishDt, durationType, this.calendar), 17);
		}
		const start = attributes.ScheduleStart as string | CalendarValue | null | undefined;
		if (start) {
			const startDt = typeof start === "string" ? parseIsoDatetime(start) : start;
			attributes.ScheduleStart = combineDateWithTime(getSoonestWorkingDay(startDt, durationType, this.calendar), 9);
		}

		for (const [name, rawValue] of Object.entries(attributes)) {
			let value = rawValue;
			if (value !== null && value !== undefined) {
				if (name.includes("Start") || name.includes("Finish") || name === "StatusTime") {
					value = datetime2ifc(value as Datetime2IfcInput, "IfcDateTime");
				} else if (name === "ScheduleDuration" || name === "ActualDuration" || name === "RemainingTime") {
					value = datetime2ifc(value as Datetime2IfcInput, "IfcDuration");
				}
			}
			this.taskTime.set(name, value);
		}

		if (
			Object.hasOwn(attributes, "ScheduleDuration") &&
			this.taskTime.get("ScheduleDuration") &&
			this.taskTime.get("ScheduleStart")
		) {
			this.calculateFinish();
		} else if (attributes.ScheduleStart && this.taskTime.get("ScheduleDuration")) {
			this.calculateFinish();
		} else if (attributes.ScheduleFinish && this.taskTime.get("ScheduleStart")) {
			this.calculateDuration();
		}

		if (
			this.taskTime.get("ScheduleDuration") &&
			(Object.hasOwn(attributes, "ScheduleStart") ||
				Object.hasOwn(attributes, "ScheduleFinish") ||
				Object.hasOwn(attributes, "ScheduleDuration"))
		) {
			cascadeSchedule(this.file, { task: this.task });
		}
		if (this.taskTime.get("ScheduleDuration")) {
			this.handleResourceCalculation();
		}
	}

	private calculateFinish(): void {
		const finish = getStartOrFinishDate(
			ifc2datetime(this.taskTime.get("ScheduleStart") as string) as CalendarValue,
			ifc2datetime(this.taskTime.get("ScheduleDuration") as string) as Duration,
			this.taskTime.get("DurationType") as DurationType,
			this.calendar,
			"FINISH",
		);
		this.taskTime.set("ScheduleFinish", datetime2ifc(finish, "IfcDateTime"));
	}

	private calculateDuration(): void {
		const start = ifc2datetime(this.taskTime.get("ScheduleStart") as string) as CalendarValue;
		const finish = ifc2datetime(this.taskTime.get("ScheduleFinish") as string) as CalendarValue;
		let currentDate: Ymd = {
			year: start.year,
			month: start.month,
			day: start.day,
		};
		const finishDate: Ymd = {
			year: finish.year,
			month: finish.month,
			day: finish.day,
		};
		let days = 1;
		const durationType = this.taskTime.get("DurationType");
		const calendar = this.calendar;
		while (compareYmd(currentDate, finishDate) < 0) {
			if (durationType === "ELAPSEDTIME" || !calendar) {
				days += 1;
			} else if (isWorkingDay({ kind: "date", ...currentDate }, calendar)) {
				days += 1;
			}
			currentDate = addDay(currentDate);
		}
		const duration: Duration = {
			years: 0,
			months: 0,
			days,
			hours: 0,
			minutes: 0,
			seconds: 0,
		};
		this.taskTime.set("ScheduleDuration", datetime2ifc(duration, "IfcDuration"));
	}

	private getTask(): EntityInstance {
		const inverses = this.file.getInverse(this.taskTime) as Set<EntityInstance>;
		for (const e of inverses) {
			if (e.isA("IfcTask")) return e;
		}
		// Python: bare `next(...)` with no default -- see this file's header comment.
		throw new Error("StopIteration: no IfcTask found referencing this IfcTaskTime");
	}

	private handleResourceCalculation(): void {
		const resources = getTaskResources(this.task, false);
		for (const resource of resources) {
			if (isAttributeLocked(resource, "Usage.ScheduleWork")) {
				calculateResourceUsage(this.file, { resource });
			}
			// Python: a commented-out TODO for the `Usage.ScheduleUsage`-locked branch --
			// left out here too, matching real Python's own dead code exactly.
		}
	}
}

export interface EditTaskTimeSettings {
	/** The `IfcTaskTime` entity you want to edit. */
	taskTime: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editTaskTimeUsecase(file: IfcFile, settings: EditTaskTimeSettings): void {
	new EditTaskTimeContext(file).execute(settings.taskTime, settings.attributes);
}

/**
 * Edits the attributes of an `IfcTaskTime` (Python:
 * `ifcopenshell.api.sequence.edit_task_time`).
 *
 * For more information about the attributes and data types of an `IfcTaskTime`, consult
 * the IFC documentation.
 *
 * `ScheduleStart`/`ScheduleFinish` are snapped forward to the soonest working day (per
 * the task's own derived calendar) and combined with a fixed 9am/5pm time-of-day. If
 * both a start (or an existing one) and a duration are known, the finish is derived
 * automatically; if a start and finish are both known, the duration is derived instead.
 * Whenever a date-affecting attribute changes, the whole schedule is cascaded (see
 * `api.sequence.cascadeSchedule`) and any resource whose usage is locked to this task's
 * duration has its usage recalculated.
 *
 * @example
 * ```ts
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A" });
 * const task = api.sequence.addTask(model, { workSchedule: schedule, name: "Formwork", identification: "A" });
 * const time = api.sequence.addTaskTime(model, { task });
 * api.sequence.editTaskTime(model, { taskTime: time, attributes: { ScheduleStart: "2000-01-01", ScheduleDuration: "P2D" } });
 * ```
 */
export const editTaskTime = wrapUsecase("sequence.edit_task_time", editTaskTimeUsecase);
