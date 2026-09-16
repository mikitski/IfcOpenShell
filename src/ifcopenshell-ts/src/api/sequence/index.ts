// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.sequence` (src/ifcopenshell-python's `ifcopenshell/api/
// sequence/` package, 40 real files, ~4257 lines total). ONLY `add_date_time` is
// ported here -- see `./addDateTime.ts`'s own header comment for exactly why (small,
// fully self-contained, a real dependency of `api.cost.addCostSchedule`). Every other
// file in this module (the actual task-scheduling logic: `calculate_task_duration`,
// `cascade_schedule`, `add_summary_task`, `add_task`, `assign_process`, etc.) remains
// entirely unported and out of scope -- this module is NOT complete, unlike most other
// `api.*` barrels in this project.
//
// Namespaced as `api.sequence.addDateTime`, matching `util/index.ts`'s per-submodule
// convention.
export { addDateTime } from "./addDateTime";
export type { AddDateTimeSettings } from "./addDateTime";
