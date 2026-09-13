// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.owner` (src/ifcopenshell-python's
// `ifcopenshell/api/owner/` package) -- the `api.root`/`api.owner` chunk ported
// `create_owner_history` (`./createOwnerHistory.ts`) and the `settings`
// monkeypatch-replacement hook (`./settings.ts`); this `api.spatial` chunk adds
// `update_owner_history` (`./updateOwnerHistory.ts`), a direct dependency of all 4
// `api.spatial` functions (see that file's own header comment). The remaining 24+
// files (`add_person`/`add_organisation`/`add_application`/`add_actor`/etc.) are still
// a later, separate chunk (see `planning/ifcopenshell-ts/PROGRESS.md`'s Phase 6
// table). Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.owner.createOwnerHistory`, `api.owner.updateOwnerHistory`,
// `api.owner.settings.ownerSettings`.
export { createOwnerHistory } from "./createOwnerHistory";
export type { CreateOwnerHistorySettings } from "./createOwnerHistory";
export { ownerSettings } from "./settings";
export type { GetApplication, GetUser } from "./settings";
export { updateOwnerHistory } from "./updateOwnerHistory";
export type { UpdateOwnerHistorySettings } from "./updateOwnerHistory";
