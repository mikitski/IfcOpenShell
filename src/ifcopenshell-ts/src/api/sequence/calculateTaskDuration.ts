// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/calculate_task_duration.py` (src/ifcopenshell-python,
// 148 lines, a real `Usecase` class -- see `../cost/copyCostItem.ts`'s own precedent for
// this project's established "private context class + a thin `xUsecase` function that
// instantiates and calls it" convention for a real Python `Usecase` class) -- part of
// `api.sequence` chunk 2 (see `./index.ts`'s own header comment for this chunk's full
// scope). Computes a task's duration parametrically from its assigned resources'
// `ScheduleWork`/`ScheduleUsage`, writing the result to `task.TaskTime.ScheduleDuration`
// (creating a blank `IfcTaskTime` via `./addTaskTime.ts` first if the task doesn't have
// one yet). If the task has no resources (or none with `Usage.ScheduleWork` set),
// nothing happens -- `task.TaskTime` is left untouched (real Python: `if duration:
// self.set_task_duration(duration)`, a falsy `0` skips the whole branch).
//
// `./addTaskTime.ts` (already landed) is the only real `api.sequence` dependency --
// confirmed by reading the whole real file (the only other imports are
// `ifcopenshell.util.date`/`ifcopenshell.util.element`, both already-landed `util`
// modules).
//
// --- A pre-existing, already-tracked gap blocks TEST COVERAGE of one real branch here,
//     not the production code itself ---
//
// `calculateSecondsPerWorkday`'s own `Pset_WorkControlCommon.WorkDayDuration`-reading
// branch (below) is ported completely and faithfully -- but building a real fixture that
// exercises it needs `api.pset.editPset` to create a BRAND-NEW `WorkDayDuration`
// property on a just-created pset, which hits the same already-tracked `TODOS.md`
// primitive-layer gap (constructing a standalone, valued simple/defined-type instance)
// `api.alignment`'s own `addStationingReferent`/`updateKeyPointReferents` chunks already
// disclosed. `calculateTaskDuration.test.ts` pins this as a disclosed-throw regression at
// the fixture-setup step, not a real end-to-end test of this branch.
//
// --- `get_work_schedule`'s own `for rel in task.Nests or []: return
//     get_work_schedule(rel.RelatingObject)` -- ported literally, not "corrected" ---
//
// Read closely: this nested helper's SECOND loop (over `task.Nests`) contains an
// unconditional `return` as its ENTIRE body -- so it only ever inspects the FIRST
// `Nests` relationship (if any), and returns whatever the recursive call yields
// (including `None`, if the parent itself has no work schedule), never falling through
// to a second `Nests` entry even if one existed. In practice this is harmless (a task
// can only be nested under a single parent at a time -- `Nests` is realistically always
// 0-or-1 elements), but it's a literal reading of the Python source worth disclosing
// rather than silently "fixing" into a full loop with an early-return-only-on-success.
// Ported below as `if (nests.length > 0) return getWorkSchedule(...)`, the exact same
// "look at the first entry only" behavior.
//
// --- `ifc2datetime`'s unnormalized `Duration` vs. Python's normalized `timedelta`:
//     `normalizeToTimedelta` bridges the two, verified equivalent ---
//
// Real Python's `calculate_seconds_per_workday`/`calculate_duration_in_days` both read
// `.days`/`.seconds` off whatever `ifc2datetime` returns for a duration string -- which,
// for a realistic Y=0/M=0 IFC duration (`WorkDayDuration`/`ScheduleWork` always are, in
// practice), is a plain `datetime.timedelta`, i.e. NORMALIZED so `0 <= seconds < 86400`
// (the total elapsed time folded into `days`+`seconds`). This port's own `ifc2datetime`
// (`util/date.ts`) deliberately returns an UNNORMALIZED `Duration` for the exact same
// input (see that file's own header comment, finding #1) -- e.g. `ifc2datetime("PT30H")`
// yields `{days: 0, hours: 30, ...}`, not Python's normalized `{days: 1, seconds:
// 21600}`. `normalizeToTimedelta` below reconstructs Python's own `(days, seconds)`
// pair from this port's raw fields (`total = days*86400 + hours*3600 + minutes*60 +
// seconds`, then re-split via `floor`/remainder) -- verified algebraically equivalent to
// Python's own formulas for both downstream uses: the hourly branch's `days*86400 +
// seconds` always equals the raw `total` exactly (by construction); the non-hourly
// branch's `(days + seconds/86400) * secondsPerWorkday` always equals `(total/86400) *
// secondsPerWorkday` exactly (since `days = floor(total/86400)` and `seconds = total -
// days*86400` by definition) -- so both branches below produce bit-for-bit the same
// result as real Python would for realistic (Y=0, M=0) duration strings.
//
// Years/months are NOT handled (assumed always 0, matching every realistic
// `WorkDayDuration`/`ScheduleWork` value in real IFC data -- D/H/M/S-only durations).
// If they were ever non-zero, real Python's own `isodate.parse_duration` would instead
// return an `isodate.Duration` object (not a `timedelta`), which doesn't expose a
// `.days`/`.seconds` pair the same way -- an unrealistic edge case this port doesn't
// attempt to special-case either, matching real Python's own total absence of a guard
// for it.
//
// --- REAL, DISCLOSED PYTHON QUIRK: `calculate_seconds_per_workday` can return `0`,
//     which then divides by zero downstream -- ported verbatim, not guarded ---
//
// If `WorkDayDuration` is specified as a whole number of days with no time-of-day
// component (e.g. `"P1D"`), Python's normalized `timedelta(days=1).seconds` is `0` (the
// entire duration is absorbed into `.days`, none into `.seconds`) -- and
// `calculate_seconds_per_workday` returns exactly that `.seconds` value, `0`, NOT the
// total duration. `self.seconds_per_workday` is then used as a divisor in
// `calculate_duration_in_days` (`schedule_seconds / self.seconds_per_workday`) --
// dividing by this `0` raises `ZeroDivisionError` in real Python. This port reproduces
// the exact same `0` result from `normalizeToTimedelta` for the same input, so the same
// division produces `Infinity`/`NaN` (JS has no divide-by-zero exception) rather than a
// thrown error -- a disclosed, narrow divergence in FAILURE MODE (silent `NaN`
// propagation vs. a Python exception) for this specific, unrealistic
// `WorkDayDuration="P<n>D"`-with-no-time-component edge case, not a behavior this port
// introduces or could plausibly "fix" without diverging further from real Python's own
// (buggy) `.seconds`-only read.
//
// Schema-availability: `IfcResourceTime`/`IfcTaskTime` don't exist on IFC2X3 at all
// (confirmed against `ifc2x3.d.ts`, matching `./addTaskTime.ts`'s own already-disclosed
// finding), and `IfcConstructionResource` has no `Usage` attribute on IFC2X3 either
// (confirmed against `ifc2x3.d.ts` directly) -- so this function throws naturally the
// moment it reaches `resource.get("Usage")` for any IFC2X3 resource with an assigned
// process, matching real Python's own unguarded `resource.Usage` access exactly. No
// proactive guard added, matching this chunk's "disclose, don't silently guard"
// discipline. Real Python's own test suite (`test_calculate_task_duration.py`) has NO
// IFC2X3 variant at all ("sequence module features relies on entities introduced in
// IFC4"), so this port's own test file follows the same precedent.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type Duration, ifc2datetime } from "../../util/date";
import { getPsets } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { addTaskTime } from "./addTaskTime";

const DEFAULT_SECONDS_PER_WORKDAY = 8 * 60 * 60;

/**
 * Python's normalized `datetime.timedelta` `(days, seconds)` pair -- see this file's
 * header comment for why this bridging helper exists and why it's verified equivalent
 * to real Python's own formulas for realistic (Y=0, M=0) duration values.
 */
function normalizeToTimedelta(duration: Duration): { days: number; seconds: number } {
	const total = duration.days * 86400 + duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
	const days = Math.floor(total / 86400);
	const seconds = total - days * 86400;
	return { days, seconds };
}

class CalculateTaskDurationContext {
	private secondsPerWorkday = DEFAULT_SECONDS_PER_WORKDAY;

	constructor(
		private readonly file: IfcFile,
		private readonly task: EntityInstance,
	) {}

	execute(): void {
		this.secondsPerWorkday = this.calculateSecondsPerWorkday();
		const duration = this.calculateMaxResourceUsageDuration();
		if (duration) {
			this.setTaskDuration(duration);
		}
	}

	/** Python's nested `get_work_schedule` helper -- see this file's header comment for
	 * the literal, non-"corrected" `Nests`-loop-of-one reading. */
	private getWorkSchedule(task: EntityInstance): EntityInstance | null {
		const hasAssignments = (task.get("HasAssignments") as EntityInstance[] | null) ?? [];
		for (const rel of hasAssignments) {
			if (rel.isA("IfcRelAssignsToControl") && (rel.get("RelatingControl") as EntityInstance).isA("IfcWorkSchedule")) {
				return rel.get("RelatingControl") as EntityInstance;
			}
		}
		const nests = (task.get("Nests") as EntityInstance[] | null) ?? [];
		if (nests.length > 0) {
			return this.getWorkSchedule(nests[0].get("RelatingObject") as EntityInstance);
		}
		return null;
	}

	private calculateSecondsPerWorkday(): number {
		const workSchedule = this.getWorkSchedule(this.task);
		if (!workSchedule) return DEFAULT_SECONDS_PER_WORKDAY;

		const psets = getPsets(workSchedule);
		const workControlCommon = psets.Pset_WorkControlCommon as Record<string, unknown> | undefined;
		if (!workControlCommon || !("WorkDayDuration" in workControlCommon)) {
			return DEFAULT_SECONDS_PER_WORKDAY;
		}
		const workDayDuration = ifc2datetime(workControlCommon.WorkDayDuration as string) as Duration;
		return normalizeToTimedelta(workDayDuration).seconds;
	}

	private calculateMaxResourceUsageDuration(): number {
		let maxDuration = 0;
		const operatesOn = (this.task.get("OperatesOn") as EntityInstance[] | null) ?? [];
		for (const rel of operatesOn) {
			const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
			for (const relatedObject of relatedObjects) {
				if (relatedObject.isA("IfcConstructionResource")) {
					const duration = this.calculateDurationInDays(relatedObject);
					if (duration && duration > maxDuration) maxDuration = duration;
				}
			}
		}
		return maxDuration;
	}

	private calculateDurationInDays(resource: EntityInstance): number | undefined {
		const usage = resource.get("Usage") as EntityInstance | null;
		const scheduleWork = usage ? (usage.get("ScheduleWork") as string | null) : null;
		if (!usage || !scheduleWork) return undefined;

		const scheduleUsage = (usage.get("ScheduleUsage") as number | null) ?? 1;
		const scheduleDuration = ifc2datetime(scheduleWork) as Duration;
		const { days, seconds } = normalizeToTimedelta(scheduleDuration);

		// Python: `is_hourly_work(schedule_work)` -- `"T" in schedule_work`.
		const isHourlyWork = scheduleWork.includes("T");
		let scheduleSeconds: number;
		if (isHourlyWork) {
			scheduleSeconds = days * 86400 + seconds;
		} else {
			const partialDays = seconds / 86400;
			scheduleSeconds = (days + partialDays) * this.secondsPerWorkday;
		}
		return Math.ceil(scheduleSeconds / this.secondsPerWorkday / scheduleUsage);
	}

	private setTaskDuration(duration: number): void {
		let taskTime = this.task.get("TaskTime") as EntityInstance | null;
		if (!taskTime) {
			taskTime = addTaskTime(this.file, { task: this.task });
		}
		taskTime.set("ScheduleDuration", `P${duration}D`);
	}
}

export interface CalculateTaskDurationSettings {
	/** The `IfcTask` to calculate the duration for. */
	task: EntityInstance;
}

function calculateTaskDurationUsecase(file: IfcFile, settings: CalculateTaskDurationSettings): void {
	new CalculateTaskDurationContext(file, settings.task).execute();
}

/**
 * Calculates the task duration based on resource usage (Python:
 * `ifcopenshell.api.sequence.calculate_task_duration`).
 *
 * If a task has labour or equipment resources assigned to it, its duration may be
 * parametrically derived from the scheduled work of the resource. For example, a labour
 * resource with scheduled work of 10 working days and a resource utilisation of 200%
 * (i.e. two labour teams) will imply that the task duration is 5 working days.
 *
 * If this data is not available, such as if the task has no resources, then nothing
 * happens.
 *
 * See this file's header comment for a real, disclosed Python quirk (a whole-day
 * `WorkDayDuration` like `"P1D"` yields a `0` seconds-per-workday, which then divides by
 * zero downstream -- a thrown `ZeroDivisionError` in real Python, silent `NaN`/`Infinity`
 * propagation here).
 *
 * @example
 * ```ts
 * const schedule = api.sequence.addWorkSchedule(model, { name: "Construction Schedule A" });
 * const task = api.sequence.addTask(model, { workSchedule: schedule, name: "Foundations", identification: "A" });
 * const labour = api.resource.addResource(model, { ifcClass: "IfcLaborResource" });
 * const time = api.resource.addResourceTime(model, { resource: labour });
 * api.resource.editResourceTime(model, { resourceTime: time, attributes: { ScheduleWork: "PT80H", ScheduleUsage: 2 } });
 * api.sequence.assignProcess(model, { relatingProcess: task, relatedObject: labour });
 * // Sets task.TaskTime.ScheduleDuration to "P5D".
 * api.sequence.calculateTaskDuration(model, { task });
 * ```
 */
export const calculateTaskDuration = wrapUsecase("sequence.calculate_task_duration", calculateTaskDurationUsecase);
