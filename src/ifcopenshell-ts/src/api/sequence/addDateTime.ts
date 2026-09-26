// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/sequence/add_date_time.py` (src/ifcopenshell-python, 56
// lines) -- THE FIRST FILE OF `api.sequence` (40 real files, ~4257 lines total),
// ported ahead of the rest of that (still entirely unported) module because it's
// small, fully self-contained (its only real dependency is the already-landed
// `util.date.datetime2ifc`), and a genuine dependency of this project's new
// `api.cost.addCostSchedule` (real Python: `add_cost_schedule.py` calls
// `ifcopenshell.api.sequence.add_date_time(file, datetime.now())` to populate
// `IfcCostSchedule.UpdateDate`). Every other `api.sequence` file (the actual
// task-scheduling logic -- `calculate_task_duration`, `cascade_schedule`,
// `add_summary_task`, etc.) remains future, separate work; nothing else from that
// module is ported here.
//
// --- Schema-dependent return type, ported exactly ---
//
// - IFC2X3: `IfcDateAndTime` has no `IfcDateTime` string-defined-type equivalent in
//   that schema -- a real ENTITY is created (`DateComponent`: `IfcCalendarDate`,
//   `TimeComponent`: `IfcLocalTime`), confirmed against `ifc2x3.d.ts`.
// - IFC4+: a plain ISO 8601 datetime STRING (`IfcDateTime` is a defined type wrapping
//   `IfcDateAndTime` -- err, actually just a plain `STRING`-underlying defined type in
//   these schemas), confirmed against `ifc4.d.ts`'s `IfcCostSchedule.UpdateDate:
//   string | null`.
//
// This asymmetry is exactly why `addDateTime`'s return type is `string |
// EntityInstance`, matching real Python's own `Union[str, ifcopenshell.entity_instance]`
// return type annotation verbatim.
//
// --- `dt: Date`, not `dt: IsoDateTime` ---
//
// Real Python's own parameter is a `datetime.datetime` (the natural "current wall
// clock time" type in Python, typically `datetime.now()`). The natural TS equivalent
// for that same "current wall clock time" concept is a plain JS `Date`, not
// `util/date.ts`'s own `IsoDateTime` domain type (which that module reserves for
// values ROUND-TRIPPED from IFC attribute strings via `ifc2datetime`, not for
// representing "now"). This file's own small, local, module-private
// `jsDateToIsoDateTime` helper below bridges a `Date` into the `IsoDateTime` shape
// `datetime2ifc` actually consumes -- matching `util/date.ts`'s own private
// (non-exported) `fromTimestamp` helper's identical field-by-field construction
// (`getFullYear`/`getMonth`/`getDate`/`getHours`/`getMinutes`/`getSeconds`), duplicated
// here rather than imported since `fromTimestamp` isn't exported from that module.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { type IsoDateTime, datetime2ifc } from "../../util/date";
import { wrapUsecase } from "../hooks";

/** See this file's header comment -- a local bridge from a plain JS `Date` (real
 * Python's `datetime.now()` equivalent) to `util/date.ts`'s own `IsoDateTime` shape. */
function jsDateToIsoDateTime(d: Date): IsoDateTime {
	return {
		kind: "datetime",
		year: d.getFullYear(),
		month: d.getMonth() + 1,
		day: d.getDate(),
		hour: d.getHours(),
		minute: d.getMinutes(),
		second: d.getSeconds(),
		microsecond: d.getMilliseconds() * 1000,
	};
}

export interface AddDateTimeSettings {
	/** The date/time to convert to an IFC-attribute-ready value. */
	dt: Date;
}

function addDateTimeUsecase(file: IfcFile, settings: AddDateTimeSettings): string | EntityInstance {
	const dt = jsDateToIsoDateTime(settings.dt);

	if (file.schema === "IFC2X3") {
		const ifcDt = file.createEntity("IfcDateAndTime");

		// IfcCalendarDate: DayComponent(0), MonthComponent(1), YearComponent(2).
		const calendarDateData = datetime2ifc(dt, "IfcCalendarDate") as Record<string, number>;
		const calendarDate = file.createEntity(
			"IfcCalendarDate",
			calendarDateData.DayComponent,
			calendarDateData.MonthComponent,
			calendarDateData.YearComponent,
		);
		ifcDt.set("DateComponent", calendarDate);

		// IfcLocalTime: HourComponent(0), MinuteComponent(1), SecondComponent(2).
		const localTimeData = datetime2ifc(dt, "IfcLocalTime") as Record<string, number>;
		const localTime = file.createEntity(
			"IfcLocalTime",
			localTimeData.HourComponent,
			localTimeData.MinuteComponent,
			localTimeData.SecondComponent,
		);
		ifcDt.set("TimeComponent", localTime);

		return ifcDt;
	}

	return datetime2ifc(dt, "IfcDateTime") as string;
}

/**
 * Add a new date time (Python: `ifcopenshell.api.sequence.add_date_time`).
 *
 * Depending on `file`'s schema, this will:
 * - IFC2X3 -- create an `IfcDateAndTime` entity.
 * - IFC4+ -- create an `IfcDateTime`-formatted string.
 *
 * @returns An `IfcDateAndTime` entity (IFC2X3) or an `IfcDateTime` string (IFC4+).
 *
 * @example
 * ```ts
 * const datetimeIfc = api.sequence.addDateTime(model, { dt: new Date(2025, 2, 1, 12, 31, 24) });
 * // IFC2X3: an IfcDateAndTime entity.
 * // IFC4+: "2025-03-01T12:31:24"
 * console.log(datetimeIfc);
 * ```
 */
export const addDateTime = wrapUsecase("sequence.add_date_time", addDateTimeUsecase);
