// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/resource/calculate_resource_usage.py` (src/ifcopenshell-
// python, 54 lines) -- part of this project's brand-new `api.resource` chunk (see
// `./index.ts`'s own header comment). Calculates the number of resources required to
// perform a task's scheduled work, given the task's own scheduled duration.
//
// --- `timedelta.days`/`.seconds`/`.total_seconds()` bridging, matching `util/
//     resource.ts`'s own already-disclosed finding ---
//
// Real Python reads `task_duration.days`/`.seconds` (off `ifc2datetime`'s
// `IfcDuration`-string result) and `person_hours.total_seconds()` directly, relying on
// a real Python `datetime.timedelta`/`isodate.Duration` always being normalized
// (`0 <= seconds < 86400`, any H/M/S overflow folded into `days`) -- see `util/
// resource.ts`'s own header comment for the full investigation (confirmed against the
// real `isodate` source, not assumed). This port's `Duration` (`util/date.ts`) keeps
// `days`/`hours`/`minutes`/`seconds` as independently-parsed fields, NOT normalized --
// so `timedeltaDaysSeconds`/`durationTotalSeconds` below (small, local, pure bridging
// helpers, matching `util/resource.ts`'s own identically-named, module-private
// originals -- not importable from here, so duplicated per this project's established
// "small pure helper, no cross-file sharing" convention) perform the same day/
// intraday-second normalization a real `timedelta` constructor does before either
// value is read, exactly like `util/resource.ts`'s own `getResourceRequiredWork`/
// `getQuantity` already do for the identical reason.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { isAttributeLocked } from "../../util/constraint";
import { type Duration, ifc2datetime } from "../../util/date";
import { getTaskAssignments } from "../../util/resource";
import { wrapUsecase } from "../hooks";

/** See this file's header comment -- duplicated from `util/resource.ts`'s own
 * module-private original (not exported there). */
function timedeltaDaysSeconds(duration: Duration): { days: number; seconds: number } {
	const totalSeconds = duration.days * 86400 + duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
	const days = Math.floor(totalSeconds / 86400);
	const seconds = Math.floor(totalSeconds - days * 86400);
	return { days, seconds };
}

/** See this file's header comment -- duplicated from `util/resource.ts`'s own
 * module-private original (not exported there). */
function durationTotalSeconds(duration: Duration): number {
	return duration.days * 86400 + duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
}

export interface CalculateResourceUsageSettings {
	/** The `IfcConstructionResource` to calculate the usage for. */
	resource: EntityInstance;
}

function calculateResourceUsageUsecase(_file: IfcFile, settings: CalculateResourceUsageSettings): void {
	const { resource } = settings;
	if (isAttributeLocked(resource, "Usage.ScheduleUsage")) return;

	const usage = resource.get("Usage") as EntityInstance | null;
	const scheduleWork = usage?.get("ScheduleWork") as string | null | undefined;
	if (!usage || !scheduleWork) return;

	const task = getTaskAssignments(resource);
	const taskTime = task?.get("TaskTime") as EntityInstance | null | undefined;
	if (!task || !taskTime) return;

	const durationType = taskTime.get("DurationType") as string | null;
	const hoursPerDay = !durationType || durationType === "WORKTIME" ? 8 : 24;

	const taskDuration = ifc2datetime(taskTime.get("ScheduleDuration") as string) as Duration;
	const { days, seconds: intradaySeconds } = timedeltaDaysSeconds(taskDuration);
	let seconds = days * hoursPerDay * 60 * 60;
	seconds += intradaySeconds;

	const personHours = ifc2datetime(scheduleWork) as Duration;
	const requiredResources = durationTotalSeconds(personHours) / seconds;
	usage.set("ScheduleUsage", requiredResources);
}

/**
 * Calculates the number of resources required to perform scheduled work on a task
 * (Python: `ifcopenshell.api.resource.calculate_resource_usage`).
 */
export const calculateResourceUsage = wrapUsecase("resource.calculate_resource_usage", calculateResourceUsageUsecase);
