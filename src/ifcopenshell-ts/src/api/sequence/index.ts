// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.sequence` (src/ifcopenshell-python's `ifcopenshell/api/
// sequence/` package, 40 real files, ~4257 lines total). Manages `IfcWorkSchedule`/
// `IfcTask`/`IfcWorkCalendar`/`IfcWorkTime` etc. for 4D construction/facility-maintenance
// scheduling. Real Python's own `__init__.py` DOES call `wrap_usecases` (unlike e.g.
// `api.alignment`/`api.cogo`'s plain-function shape) -- every file in this module is
// ported through `wrapUsecase`, matching that real listener-wrapped convention.
//
// --- Landed before this chunk: `add_date_time` only ---
//
// Ported ahead of the rest of this module because it's small, fully self-contained, and
// a genuine dependency of `api.cost.addCostSchedule` -- see `./addDateTime.ts`'s own
// header comment for the full story.
//
// --- Landed in chunk 1 (9 more files, ~890 lines) ---
//
// `addWorkCalendar`/`addWorkPlan`/`addWorkSchedule` (the three top-level grouping
// entities: `IfcWorkCalendar`/`IfcWorkPlan`/`IfcWorkSchedule`), `addTask` (creates and
// nests an `IfcTask` under a work schedule or parent task), `addTaskTime`/`addWorkTime`
// (blank `IfcTaskTime`/`IfcWorkTime` sub-objects), `assignLagTime` (`IfcLagTime` on an
// `IfcRelSequence`), `assignProcess`/`assignProduct` (the ICOM Input/Output relationships
// between a process and a product). No dependency of any kind on any other, still-
// unported sibling file within this same module -- confirmed by reading every one of
// these 9 real files' own imports AND full bodies. Cross-module dependencies (all
// already landed, verified directly against their own TS source): `api.aggregate.
// assignObject`, `api.control.assignControl`, `api.nest.assignObject`, `api.owner.
// createOwnerHistory`/`updateOwnerHistory`/`settings.ownerSettings`, `api.project.
// assignDeclaration`, `api.root.createEntity`, `guid`, `util.date.datetime2ifc`.
//
// Several real, disclosed Python-source quirks/bugs, ported verbatim (this project's
// established discipline) -- see each file's own header comment for the full writeup:
// `addWorkPlan`'s `startTime` parameter is silently ignored (`StartTime` always uses
// "now", a confirmed copy-paste-divergence bug vs. its own sibling `addWorkSchedule`,
// which correctly uses it); `addTask` sets `Identification` with no IFC2X3 guard even
// though `IfcTask` has no such attribute on IFC2X3 (it has `TaskId` instead), while its
// own auto-numbering step IS correctly guarded; `addWorkTime` silently orphans the
// created `IfcWorkTime` for a `timeType` outside the two documented literal values;
// `assignLagTime`'s `is_a("IfcRelSequence")` check only guards its cleanup step, not the
// final assignment; `assignProcess`/`assignProduct` disagree on what to return on a
// dedup hit (`undefined` vs. the existing relationship) despite being near-identical
// sibling functions. `assignLagTime` is additionally FULLY BLOCKED on every schema by
// the already-tracked `TODOS.md` primitive-layer gap (constructing a valued standalone
// `IfcDuration`) -- see that file's own header comment.
//
// Schema-specific findings (this module is NOT schema-specific the way `api.alignment`
// was -- its core entities exist across schemas, but several sub-entities don't):
// `IfcWorkCalendar`/`IfcTaskTime`/`IfcTaskTimeRecurring`/`IfcWorkTime`/`IfcLagTime` do
// NOT exist on IFC2X3 at all (confirmed against the generated `.d.ts`s), while
// `IfcWorkPlan`/`IfcWorkSchedule`/`IfcTask`/`IfcRelAssignsToProcess`/
// `IfcRelAssignsToProduct` exist on all 3 schemas -- though `IfcTask` itself differs:
// IFC2X3 has `TaskId`/no `Identification`/no `PredefinedType`/no `TaskTime`, where
// IFC4+ has `Identification`/`PredefinedType`/`TaskTime` instead. None of this is
// proactively guarded anywhere in this chunk's files -- every function throws naturally
// the moment an IFC2X3-absent class/attribute is touched, matching real Python's own
// unguarded behavior exactly, per each file's own header comment.
//
// --- Landed in chunk 2 (12 more files, ~800 lines) ---
//
// `assignWorkPlan` (aggregates an `IfcWorkSchedule` under an `IfcWorkPlan`),
// `calculateTaskDuration` (a real `Usecase` class -- computes a task's duration
// parametrically from its resources' `ScheduleWork`/`ScheduleUsage`), `editTask`/
// `editWorkCalendar`/`editWorkPlan`/`editWorkSchedule`/`editWorkTime` (attribute-setter
// loops, the latter three with date/duration-string conversion via `util.date.
// datetime2ifc`), `removeTimePeriod`/`removeWorkPlan`, `unassignProcess`/
// `unassignProduct` (the inverses of chunk 1's own `assignProcess`/`assignProduct`), and
// `unassignRecurrencePattern`. Every one of these 12 files' own real (non-docstring)
// `ifcopenshell.api.sequence.X(...)` references were independently verified to be either
// absent, or -- `calculate_task_duration`'s own real call to `add_task_time` inside
// `set_task_duration` -- an already-landed chunk 1 dependency; no dependency of any kind
// on any other still-unported sibling file within this module. Cross-module
// dependencies (all already landed, verified directly against their own TS source):
// `api.aggregate.assignObject`/`unassignObject`, `api.owner.updateOwnerHistory`,
// `api.project.unassignDeclaration`, `util.date.datetime2ifc`/`ifc2datetime`,
// `util.element.getPsets`/`removeDeep2`.
//
// Several real, disclosed Python-source quirks/bugs, ported verbatim -- see each file's
// own header comment for the full writeup: `assignWorkPlan`/`removeWorkPlan` both have
// NO `file.schema != "IFC2X3"` guard at all (unlike their own sibling `addWorkPlan`/
// `addWorkSchedule`), so both throw unconditionally on IFC2X3 (`file.byType
// ("IfcContext")` itself raises, since IFC2X3 has no `IfcContext` class); `editWorkPlan`/
// `editWorkSchedule` both throw on IFC2X3 specifically when editing `Duration`/
// `TotalFloat` with a truthy value (a genuine schema type mismatch -- `IfcTimeMeasure`/
// number on IFC2X3 vs. `IfcDuration`/string on IFC4+ for those two attributes only, no
// schema-aware branching in real Python); `editWorkTime` has no `if value:` truthy guard
// before its `Start`/`Finish` date conversion, unlike its `editWorkPlan`/
// `editWorkSchedule` siblings (harmless in practice, since `datetime2ifc(null, ...)`
// safely returns `null`); `calculateTaskDuration`'s own `get_work_schedule` nested
// helper only ever inspects the FIRST `Nests` entry (a literal, non-"corrected" reading
// of a real Python `for ...: return ...` loop body); `calculateTaskDuration` can
// silently divide by a `0` "seconds per workday" for a whole-day `WorkDayDuration`
// (e.g. `"P1D"`) -- a real Python `ZeroDivisionError`, ported as silent `NaN`/`Infinity`
// propagation instead (JS has no divide-by-zero exception) -- a disclosed, narrow
// failure-mode divergence.
//
// Cumulative file count landed after this chunk: 22 of 40 (`add_date_time` + chunk 1's 9
// + this chunk's 12).
//
// Still pending for future chunks: the remaining 18 real files (`add_time_period`/
// `assign_recurrence_pattern`/`assign_sequence`/`cascade_schedule`/`copy_work_schedule`/
// `create_baseline`/`duplicate_task`/`edit_lag_time`/`edit_recurrence_pattern`/
// `edit_sequence`/`edit_task_time`/`recalculate_schedule`/`remove_task`/
// `remove_work_calendar`/`remove_work_schedule`/`remove_work_time`/`unassign_lag_time`/
// `unassign_sequence`), several of which depend on the already-landed `util.sequence`
// module (see `../../util/sequence.ts`'s own header comment) that neither chunk 1 nor
// chunk 2 needed.
export { addDateTime } from "./addDateTime";
export type { AddDateTimeSettings } from "./addDateTime";
export { addTask } from "./addTask";
export type { AddTaskSettings } from "./addTask";
export { addTaskTime } from "./addTaskTime";
export type { AddTaskTimeSettings } from "./addTaskTime";
export { addWorkCalendar } from "./addWorkCalendar";
export type { AddWorkCalendarSettings } from "./addWorkCalendar";
export { addWorkPlan } from "./addWorkPlan";
export type { AddWorkPlanSettings } from "./addWorkPlan";
export { addWorkSchedule } from "./addWorkSchedule";
export type { AddWorkScheduleSettings } from "./addWorkSchedule";
export { addWorkTime } from "./addWorkTime";
export type { AddWorkTimeSettings, SequenceTimeType } from "./addWorkTime";
export { assignLagTime } from "./assignLagTime";
export type { AssignLagTimeSettings } from "./assignLagTime";
export { assignProcess } from "./assignProcess";
export type { AssignProcessSettings } from "./assignProcess";
export { assignProduct } from "./assignProduct";
export type { AssignProductSettings } from "./assignProduct";
export { assignWorkPlan } from "./assignWorkPlan";
export type { AssignWorkPlanSettings } from "./assignWorkPlan";
export { calculateTaskDuration } from "./calculateTaskDuration";
export type { CalculateTaskDurationSettings } from "./calculateTaskDuration";
export { editTask } from "./editTask";
export type { EditTaskSettings } from "./editTask";
export { editWorkCalendar } from "./editWorkCalendar";
export type { EditWorkCalendarSettings } from "./editWorkCalendar";
export { editWorkPlan } from "./editWorkPlan";
export type { EditWorkPlanSettings } from "./editWorkPlan";
export { editWorkSchedule } from "./editWorkSchedule";
export type { EditWorkScheduleSettings } from "./editWorkSchedule";
export { editWorkTime } from "./editWorkTime";
export type { EditWorkTimeSettings } from "./editWorkTime";
export { removeTimePeriod } from "./removeTimePeriod";
export type { RemoveTimePeriodSettings } from "./removeTimePeriod";
export { removeWorkPlan } from "./removeWorkPlan";
export type { RemoveWorkPlanSettings } from "./removeWorkPlan";
export { unassignProcess } from "./unassignProcess";
export type { UnassignProcessSettings } from "./unassignProcess";
export { unassignProduct } from "./unassignProduct";
export type { UnassignProductSettings } from "./unassignProduct";
export { unassignRecurrencePattern } from "./unassignRecurrencePattern";
export type { UnassignRecurrencePatternSettings } from "./unassignRecurrencePattern";
