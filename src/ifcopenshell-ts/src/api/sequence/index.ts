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
// --- Landed in chunk 3 (14 more files) ---
//
// `cascadeSchedule` (ported FIRST within this chunk -- zero same-batch dependencies, and
// 5 other files in this chunk call it for real: `assignSequence`/`editLagTime`/
// `editSequence`/`unassignLagTime`/`unassignSequence`), `removeWorkTime` (ported before
// `removeWorkCalendar`, which really calls it), `addTimePeriod`/
// `assignRecurrencePattern`/`editRecurrencePattern` (zero same-batch dependencies),
// `assignSequence` (a deliberate, disclosed `(RelatingProcess, SequenceType)`-pair match
// rule -- see that file's own header comment), `editLagTime`/`editSequence`/
// `unassignLagTime`/`unassignSequence` (all real `cascadeSchedule` callers),
// `editTaskTime` (a real `Usecase` class; also a real, non-`api.sequence` dependency on
// `api.resource.calculateResourceUsage`), `removeTask` (self-recursive; a real,
// confirmed Python source bug -- a duplicated, provably unreachable
// `IfcRelAssignsToProcess` branch, preserved verbatim), `removeWorkCalendar` (really
// calls `removeWorkTime`), `removeWorkSchedule` (self-recursive; really calls
// `removeTask`). Every one of these 14 files' own real (non-docstring) `ifcopenshell.
// api.sequence.X(...)` references was independently verified against the chunk brief's
// own pre-derived dependency map, not re-derived from scratch. Cross-module
// dependencies (all already landed, verified directly against their own TS source):
// `api.aggregate.unassignObject`, `api.control.unassignControl`, `api.nest.
// unassignObject`, `api.project.unassignDeclaration`, `api.pset.removePset`, `api.
// resource.calculateResourceUsage`, `guid`, `util.constraint.isAttributeLocked`, `util.
// date.datetime2ifc`/`ifc2datetime`/`parseIsoDatetime`, `util.element.removeDeep2`,
// `util.sequence.deriveCalendar`/`getSequenceAssignment`/`getSoonestWorkingDay`/
// `getStartOrFinishDate`/`getTaskResources`/`isWorkingDay`/`offsetDate`.
//
// Several real, disclosed Python-source quirks/bugs, ported verbatim -- see each file's
// own header comment for the full writeup: `assignSequence` deliberately matches an
// existing `IfcRelSequence` on `(RelatingProcess, SequenceType)`, not just the pair (a
// "ladder" relationship may legitimately have more than one sequence type between the
// same two tasks); `removeTask` has a duplicated, provably unreachable
// `IfcRelAssignsToProcess` `elif` branch (a genuine copy-paste bug); `unassignLagTime`
// calls `file.getTotalInverses` on a possibly-`null` `TimeLag` with no truthiness guard;
// `unassignSequence`'s optional `sequenceType` parameter is a genuinely later real-source
// addition (its own docstring cross-references `assignSequence`'s own "ladder"
// disclosure); `removeWorkPlan`/`removeWorkCalendar`/`removeWorkSchedule` all lack an
// IFC2X3 guard before their own unconditional `file.byType("IfcContext")[0]` call
// (`removeWorkPlan` already disclosed this in chunk 2; `removeWorkCalendar`/
// `removeWorkSchedule` are the same finding, confirmed independently for this chunk).
// `editLagTime`'s `LagValue`-editing branch and `assignLagTime` (chunk 1) are BOTH fully
// blocked by the already-tracked `TODOS.md` standalone-valued-simple-type-construction
// gap -- `editLagTime`'s 16th independent confirmed consequence of that same gap, the
// 15th being `assignLagTime`'s own (chunk 1). `addTimePeriod`/`editRecurrencePattern`
// both call `ifcopenshell.util.sequence.is_working_day`/`is_calendar_applicable
// .cache_clear()` in real Python, which `util/sequence.ts`'s own header comment (finding
// #9) already anticipated as a no-op in this port (no memoization implemented) --
// confirmed, not a new finding.
//
// Schema-specific findings (consistent with this module's own chunk 1/2 findings):
// `IfcLagTime`/`IfcRecurrencePattern`/`IfcTimePeriod`/`IfcTaskTime`/`IfcWorkTime`/
// `IfcWorkCalendar` do NOT exist on IFC2X3 at all (confirmed against the generated
// `.d.ts`s); `IfcRelSequence` DOES exist on all 3 schemas, but IFC2X3's own `TimeLag`
// attribute is typed a plain `number`/`IfcTimeMeasure`, not an `IfcLagTime` entity
// reference (confirmed against `ifc2x3.d.ts` directly -- a genuine, disclosed schema-
// shape difference, moot for `assignSequence`/`unassignSequence` since neither populates
// `TimeLag`); `IfcRelAssignsToControl`/`IfcRelAssignsToProcess`/`IfcRelAssignsToProduct`/
// `IfcRelAssignsToObject`/`IfcRelDefinesByObject`/`IfcRelDefinesByProperties`/`IfcTask`
// all exist on IFC2X3 (used by `removeTask`/`removeWorkSchedule`'s own inverse-cleanup
// loops), so those loops' own branches are reachable there even though this chunk's
// `IfcContext`-lookup-first bug (above) means `removeTask`/`removeWorkSchedule`
// themselves still throw before ever reaching them on a real IFC2X3 call.
//
// Cumulative file count after chunk 3: 36 of 40 (`add_date_time` + chunk 1's 9 + chunk
// 2's 12 + chunk 3's 14).
//
// --- Landed in chunk 4 (final 4 files) -- `api.sequence` is now FUNCTIONALLY COMPLETE,
//     40/40 real files ---
//
// `duplicateTask` (ported FIRST, per this chunk's own dependency order --
// `copyWorkSchedule`/`createBaseline` both have a REAL dependency on it),
// `recalculateSchedule` (independent of the other 3 within this chunk; by far the
// largest/most complex file in the whole module -- a hand-rolled forward-pass/
// backward-pass Critical Path Method over the schedule's task graph, no graph library),
// `copyWorkSchedule`, `createBaseline` (both real dependents of `duplicateTask`, ported
// last). Cross-module dependencies (all already landed, verified directly against their
// own TS source): `api.control.assignControl`, `api.nest.assignObject`/
// `unassignObject`, `api.owner.createOwnerHistory`/`updateOwnerHistory`, `guid`,
// `util.date.datetime2ifc`/`ifc2datetime`, `util.element.copy`/`copyDeep`,
// `util.sequence.countWorkingDays`/`deriveCalendar`/`getRootTasks`/
// `getSequenceAssignment`/`getStartOrFinishDate`/`offsetDate`. Same-module
// dependencies: `duplicateTask` on this SAME chunk's own already-landed
// `assignSequence`/`assignLagTime` (chunk 3/chunk 1 respectively); `recalculateSchedule`
// on chunk 3's own `editTaskTime`; `copyWorkSchedule`/`createBaseline` on this chunk's
// own `duplicateTask` and (`createBaseline` only) chunk 1's `addWorkSchedule`.
//
// Several real, disclosed Python-source quirks/findings, ported verbatim -- see each
// file's own header comment for the full writeup: `duplicateTask`'s own generic
// by-index attribute scan uses two genuinely DIFFERENT (not buggy) strategies depending
// on the matched attribute's cardinality -- a single-valued match clones `inverse`
// (every attribute, not just the matched one) and redirects just that one attribute to
// the duplicate, which is genuinely wired into the graph via that attribute value even
// though no variable keeps a reference to the clone afterward; a list-valued match
// instead appends the duplicate into the SAME existing list on the ORIGINAL, avoiding a
// redundant clone where the attribute can hold more than one value -- an earlier pass of
// this same investigation initially misread the first case as an "orphaned copy" bug
// before tracing it through fully and correcting that; `duplicateTask`'s own
// `createObjectReference` is a CONFIRMED,
// PROVABLY DEAD method (never called anywhere in the class) -- a near-verbatim copy of
// `createBaseline`'s own `createBaselineReference`, which IS genuinely live/called
// there; `duplicateTask`'s `copySequenceRelationship` has a provably inert
// `relatingProcess`/`relatedProcess` initial assignment, always overwritten by a later
// unconditional recompute; `recalculateSchedule`'s own `addNode` (and `duplicateTask`'s
// own `copySequenceRelationship`) both call `ifc2datetime` on a `TimeLag.LagValue
// .wrappedValue` with NO `is_a("IfcDuration")` vs. `"IfcRatioMeasure"` branch, unlike
// `cascadeSchedule.ts`'s own careful branching -- a real bug, moot in this port since
// nothing can ever populate a real `TimeLag` (both blocked by the primitive-layer gap
// below); `recalculateSchedule`'s own cyclic-detection heuristic recalculates its
// worst-case-attempts bound only on the FORWARD pass, with no equivalent guard at all on
// the backward pass (matching real Python exactly, not "fixed" to add one); two
// genuinely dead local variables in `recalculateSchedule` (`forward_pass`'s own
// `successors`, `backward_pass`'s own `predecessors`) are omitted, confirmed inert by
// re-reading both full function bodies; `createBaseline`'s own name-fallback
// (`name or work_schedule.Name`) needed a small, disclosed workaround around chunk 1's
// own `addWorkSchedule.ts` interface, which has no way to distinguish "name omitted,
// use the 'Unnamed' default" from "explicitly falsy, keep it `null`" -- corrected via a
// direct `.set("Name", null)` after the call rather than widening that sibling's
// interface. `duplicateTask`'s own `assignLagTime` call (inherited from chunk 1) and
// `recalculateSchedule`'s own `TimeLag`-reading step remain subject to the already-
// tracked `TODOS.md` standalone-valued-simple-type-construction gap -- READS of an
// existing `TimeLag` are unaffected (not blocked), only CONSTRUCTING a new one is, and
// nothing in this port can do that, so these paths are untestable end-to-end (disclosed
// in each file's own header comment, not silently skipped).
//
// Schema findings: `createBaseline` throws EARLIER on IFC2X3 than its own documented
// `ValueError` -- `IfcWorkSchedule.PredefinedType` doesn't exist there at all (confirmed
// against `ifc2x3.d.ts`, matching chunk 1's own finding), so `.get("PredefinedType")`
// itself throws an undeclared-attribute error first; IFC4X3 has an identical
// `PredefinedType` shape to IFC4, so `createBaseline` is IFC4/IFC4X3-only in practice
// (matching real Python's own IFC4-only test file). `duplicateTask`/`copyWorkSchedule`
// have no schema-specific logic of their own and are exercised across all 3 schemas
// (real Python's own `test_copy_work_schedule.py` has explicit IFC2X3/IFC4X3
// subclasses); `recalculateSchedule` is IFC4+-only in practice (`IfcTaskTime` doesn't
// exist on IFC2X3), matching `cascadeSchedule`'s own already-disclosed finding and real
// Python's own IFC4-only test file.
//
// Test coverage: real Python tests exist for `recalculateSchedule`
// (`test_recalculate_schedule.py`, 9 cases -- this CORRECTS an earlier, outdated claim
// that no such test existed; ported below, ~unmodified for 7 of 9 cases, 2 lag-dependent
// cases adapted since `assignLagTime` remains fully blocked) and `copyWorkSchedule`/
// `createBaseline` (`test_copy_work_schedule.py`/`test_create_baseline.py`, ported
// verbatim, the latter's own IFC4-only scope widened to IFC4X3 too); `duplicateTask` has
// no real Python test at all (confirmed by listing `test/api/sequence/`), so its own
// coverage is written directly from source, including dedicated pins for the disclosed
// orphan-copy bug and dead-method finding above.
//
// `api.sequence` is now FUNCTIONALLY COMPLETE: all 40 real files from
// `src/ifcopenshell-python/ifcopenshell/api/sequence/` are ported.
export { addDateTime } from "./addDateTime";
export type { AddDateTimeSettings } from "./addDateTime";
export { addTask } from "./addTask";
export type { AddTaskSettings } from "./addTask";
export { addTaskTime } from "./addTaskTime";
export type { AddTaskTimeSettings } from "./addTaskTime";
export { addTimePeriod } from "./addTimePeriod";
export type { AddTimePeriodSettings } from "./addTimePeriod";
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
export { assignRecurrencePattern } from "./assignRecurrencePattern";
export type {
	AssignRecurrencePatternSettings,
	RecurrenceType,
} from "./assignRecurrencePattern";
export { assignSequence } from "./assignSequence";
export type { AssignSequenceSettings } from "./assignSequence";
export { assignWorkPlan } from "./assignWorkPlan";
export type { AssignWorkPlanSettings } from "./assignWorkPlan";
export { calculateTaskDuration } from "./calculateTaskDuration";
export type { CalculateTaskDurationSettings } from "./calculateTaskDuration";
export { cascadeSchedule } from "./cascadeSchedule";
export type { CascadeScheduleSettings } from "./cascadeSchedule";
export { copyWorkSchedule } from "./copyWorkSchedule";
export type { CopyWorkScheduleSettings } from "./copyWorkSchedule";
export { createBaseline } from "./createBaseline";
export type { CreateBaselineSettings } from "./createBaseline";
export { duplicateTask } from "./duplicateTask";
export type { DuplicateTaskResult, DuplicateTaskSettings } from "./duplicateTask";
export { editLagTime } from "./editLagTime";
export type { EditLagTimeSettings } from "./editLagTime";
export { editRecurrencePattern } from "./editRecurrencePattern";
export type { EditRecurrencePatternSettings } from "./editRecurrencePattern";
export { editSequence } from "./editSequence";
export type { EditSequenceSettings } from "./editSequence";
export { editTask } from "./editTask";
export type { EditTaskSettings } from "./editTask";
export { editTaskTime } from "./editTaskTime";
export type { EditTaskTimeSettings } from "./editTaskTime";
export { editWorkCalendar } from "./editWorkCalendar";
export type { EditWorkCalendarSettings } from "./editWorkCalendar";
export { editWorkPlan } from "./editWorkPlan";
export type { EditWorkPlanSettings } from "./editWorkPlan";
export { editWorkSchedule } from "./editWorkSchedule";
export type { EditWorkScheduleSettings } from "./editWorkSchedule";
export { editWorkTime } from "./editWorkTime";
export type { EditWorkTimeSettings } from "./editWorkTime";
export { recalculateSchedule } from "./recalculateSchedule";
export type { RecalculateScheduleSettings } from "./recalculateSchedule";
export { removeTask } from "./removeTask";
export type { RemoveTaskSettings } from "./removeTask";
export { removeTimePeriod } from "./removeTimePeriod";
export type { RemoveTimePeriodSettings } from "./removeTimePeriod";
export { removeWorkCalendar } from "./removeWorkCalendar";
export type { RemoveWorkCalendarSettings } from "./removeWorkCalendar";
export { removeWorkPlan } from "./removeWorkPlan";
export type { RemoveWorkPlanSettings } from "./removeWorkPlan";
export { removeWorkSchedule } from "./removeWorkSchedule";
export type { RemoveWorkScheduleSettings } from "./removeWorkSchedule";
export { removeWorkTime } from "./removeWorkTime";
export type { RemoveWorkTimeSettings } from "./removeWorkTime";
export { unassignLagTime } from "./unassignLagTime";
export type { UnassignLagTimeSettings } from "./unassignLagTime";
export { unassignProcess } from "./unassignProcess";
export type { UnassignProcessSettings } from "./unassignProcess";
export { unassignProduct } from "./unassignProduct";
export type { UnassignProductSettings } from "./unassignProduct";
export { unassignRecurrencePattern } from "./unassignRecurrencePattern";
export type { UnassignRecurrencePatternSettings } from "./unassignRecurrencePattern";
export { unassignSequence } from "./unassignSequence";
export type { UnassignSequenceSettings } from "./unassignSequence";
