// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.system` (src/ifcopenshell-python's `ifcopenshell/api/
// system/` package, 12 real files, ~1039 lines total) -- a brand-new module (no TS
// port of any kind existed before this chunk), ALL 12 functions ported in one chunk.
// Prioritized because `../root/copyClass.ts` disclosed a real, loud-throw blocker
// citing this exact module by name (`api.system.unassignPort`/`.disconnectPort`) --
// see this file's own "RESOLVED" section below for the exact per-call-site status now
// that this chunk has landed.
//
// Manages `IfcSystem` (a distribution system -- ducts, pipes, pumps, filters, fans,
// etc. that distribute a medium throughout a facility) via `IfcRelAssignsToGroup`
// (`IfcSystem` is an `IfcGroup` subtype, so `addSystem`/`assignSystem`/
// `unassignSystem`/`removeSystem`/`editSystem` are thin wrappers/near-duplicates of
// this project's already-landed `api.group` siblings -- see each file's own header
// comment for the exact relationship), plus `IfcDistributionPort` connectivity
// (`addPort`/`assignPort`/`unassignPort`/`connectPort`/`disconnectPort`) and
// distribution control assignment (`assignFlowControl`/`unassignFlowControl`, via
// `IfcRelFlowControlElements`).
//
// --- Dependencies confirmed already landed (verified by reading each, not assumed) ---
//
// `util.element` (`removeDeep2`), `util.system` (`isAssignable`), `api.owner`
// (`createOwnerHistory`/`updateOwnerHistory`), `api.group` (`assignGroup`/
// `unassignGroup`), `api.root` (`createEntity`), `api.pset` (`removePset`).
//
// --- The ONE genuinely unported dependency across this whole module ---
//
// `ifcopenshell.api.geometry.edit_object_placement`, called from `assign_port.py`
// only (confirmed by grep across all 12 real files, not assumed) -- has no TS port
// anywhere in this project (the same pre-existing blocker `TODOS.md` already tracks
// for `api.spatial.assignContainer`/`api.aggregate.assignObject`/`api.root.copyClass`).
// `./assignPort.ts` ports everything else in `assign_port` completely and faithfully,
// throwing a clear, loud, descriptive `Error` ONLY at the exact point
// `edit_object_placement` would actually be called (only reached when the port being
// assigned already has its own `IfcLocalPlacement` -- never for a freshly-created,
// placement-less port, the common case and the only one any real Python test other
// than `test_updating_the_placement_to_be_relative_if_it_exists` ever exercises) --
// see `./assignPort.ts`'s own header comment and `TODOS.md` for the full disclosure.
//
// --- RESOLVED: `../root/copyClass.ts`'s `api.system` half of its distribution-port
// blocker -- NARROWED, not fully resolved (still needs `editObjectPlacement` too) ---
//
// `copyClass.ts`'s own disclosed ports-branch blocker cited TWO missing dependencies:
// `api.system.unassignPort`/`.disconnectPort` (this chunk) AND
// `api.geometry.editObjectPlacement` (see above -- still genuinely unported). Real
// Python's own `copy_class.py` needs BOTH for every copied port (`unassign_port`/
// `disconnect_port` to sever carried-over connections, THEN `edit_object_placement` to
// reset the copy's placement) -- landing this chunk alone does not fully unblock that
// call site. `copyClass.ts`'s own header comment and `TODOS.md`'s matching entry are
// updated to cite `editObjectPlacement` as the sole remaining blocker (matching the
// exact "narrowing, not fully resolving" precedent already established for
// `reassignClass.ts`'s own `edit_object_placement`/`assign_representation` entry --
// see `TODOS.md`'s `UPDATE 2026-09-14 (api.geometry chunk 2 ...)` note there).
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.system.addSystem`/`api.system.connectPort`/etc.
export { addPort } from "./addPort";
export type { AddPortSettings } from "./addPort";
export { addSystem } from "./addSystem";
export type { AddSystemSettings } from "./addSystem";
export { assignFlowControl } from "./assignFlowControl";
export type { AssignFlowControlSettings } from "./assignFlowControl";
export { assignPort } from "./assignPort";
export type { AssignPortSettings } from "./assignPort";
export { assignSystem } from "./assignSystem";
export type { AssignSystemSettings } from "./assignSystem";
export { connectPort } from "./connectPort";
export type { ConnectPortSettings } from "./connectPort";
export { disconnectPort } from "./disconnectPort";
export type { DisconnectPortSettings } from "./disconnectPort";
export { editSystem } from "./editSystem";
export type { EditSystemSettings } from "./editSystem";
export { removeSystem } from "./removeSystem";
export type { RemoveSystemSettings } from "./removeSystem";
export { unassignFlowControl } from "./unassignFlowControl";
export type { UnassignFlowControlSettings } from "./unassignFlowControl";
export { unassignPort } from "./unassignPort";
export type { UnassignPortSettings } from "./unassignPort";
export { unassignSystem } from "./unassignSystem";
export type { UnassignSystemSettings } from "./unassignSystem";
