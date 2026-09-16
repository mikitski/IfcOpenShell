// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.resource` (src/ifcopenshell-python's
// `ifcopenshell/api/resource/` package) -- a brand-new module, all 12 real files
// ported in one chunk (905 lines total), alongside this same chunk's `api.nest` (a
// direct dependency of `./addResource.ts`, ported FIRST). Manages
// `IfcConstructionResource` (crew/labour/equipment/material/product-subtype
// resources) and its quantity (`IfcPhysicalSimpleQuantity` via `BaseQuantity`), time
// (`IfcResourceTime` via `Usage`, IFC4+ only), and object-assignment
// (`IfcRelAssignsToResource`) sub-objects.
//
// Dependencies confirmed already landed (verified by reading every real file's own
// imports, not assumed): `api.nest.assignObject` (this same chunk),
// `api.owner.createOwnerHistory`/`.updateOwnerHistory`, `api.project.assignDeclaration`,
// `api.root.createEntity`, `guid`, `util.constraint`, `util.date`, `util.element`,
// `util.resource`.
//
// One remaining genuinely-unported dependency: `./editResourceTime.ts`'s
// `ScheduleUsage`-under-a-hard-constraint branch needs
// `ifcopenshell.api.sequence.calculate_task_duration` -- `api.sequence` (40 files,
// ~4257 lines) has no TS port of any kind and is out of scope for this chunk. A clear,
// descriptive `Error` is thrown ONLY at that exact call site, never proactively -- see
// `editResourceTime.ts`'s own header comment and `TODOS.md` for the full disclosure.
//
// Namespaced as `api.resource.addResource`/etc., matching `util/index.ts`'s per-
// submodule convention. See each function's own header comment for several disclosed
// real Python quirks/bugs: `edit_resource_time.py`'s literal `"RemainingTime"` typo
// (should read `"RemainingWork"`), `remove_resource.py`'s own `# TODO: review deep
// purge` self-flagged inconsistency (one `RelatedObjects`-splice branch skips
// `update_owner_history`, unlike every sibling branch), and a real, disclosed IFC2X3-
// only schema divergence on `IfcConstructionResource.BaseQuantity`'s declared type
// (confirmed NOT to block `add_resource_quantity` at runtime).
export { addResource } from "./addResource";
export type { AddResourceSettings } from "./addResource";
export { editResource } from "./editResource";
export type { EditResourceSettings } from "./editResource";
export { removeResource } from "./removeResource";
export type { RemoveResourceSettings } from "./removeResource";
export { assignResource } from "./assignResource";
export type { AssignResourceSettings } from "./assignResource";
export { unassignResource } from "./unassignResource";
export type { UnassignResourceSettings } from "./unassignResource";
export { addResourceQuantity } from "./addResourceQuantity";
export type { AddResourceQuantitySettings } from "./addResourceQuantity";
export { editResourceQuantity } from "./editResourceQuantity";
export type { EditResourceQuantitySettings } from "./editResourceQuantity";
export { removeResourceQuantity } from "./removeResourceQuantity";
export type { RemoveResourceQuantitySettings } from "./removeResourceQuantity";
export { addResourceTime } from "./addResourceTime";
export type { AddResourceTimeSettings } from "./addResourceTime";
export { editResourceTime } from "./editResourceTime";
export type { EditResourceTimeSettings } from "./editResourceTime";
export { calculateResourceWork } from "./calculateResourceWork";
export type { CalculateResourceWorkSettings } from "./calculateResourceWork";
export { calculateResourceUsage } from "./calculateResourceUsage";
export type { CalculateResourceUsageSettings } from "./calculateResourceUsage";
