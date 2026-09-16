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
// --- The ONE dependency this module needed elsewhere -- RESOLVED ---
//
// `ifcopenshell.api.geometry.edit_object_placement`, called from `assign_port.py`
// only (confirmed by grep across all 12 real files, not assumed), has since landed
// (see `../geometry/editObjectPlacement.ts`) -- `./assignPort.ts`'s own
// placement-relocalization step now calls it directly, no disclosed throw left. This
// also fully resolves `../root/copyClass.ts`'s own distribution-port blocker, which
// needed BOTH `api.system.unassignPort`/`.disconnectPort` (this chunk) AND
// `api.geometry.editObjectPlacement` for every copied port -- see `copyClass.ts`'s own
// header comment.
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
