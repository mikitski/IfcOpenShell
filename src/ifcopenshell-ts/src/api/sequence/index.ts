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
// Still pending for future chunks: the remaining ~30 real files (`assign_recurrence_
// pattern`/`assign_sequence`/`assign_work_plan`/`calculate_task_duration`/
// `cascade_schedule`/`copy_work_schedule`/`create_baseline`/`duplicate_task`/every
// `edit_*`/`remove_*`/`unassign_*` file/`recalculate_schedule`), several of which depend
// on the already-landed `util.sequence` module (see `../../util/sequence.ts`'s own
// header comment) that this chunk's own 9 files did NOT need.
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
