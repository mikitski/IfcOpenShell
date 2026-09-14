// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.owner` (src/ifcopenshell-python's
// `ifcopenshell/api/owner/` package) -- the `api.root`/`api.owner` chunk ported
// `create_owner_history` (`./createOwnerHistory.ts`) and the `settings`
// monkeypatch-replacement hook (`./settings.ts`); the `api.spatial` chunk added
// `update_owner_history` (`./updateOwnerHistory.ts`). This chunk (chunk 1 of 2 covering
// the remaining 22 real-Python files) ports the "person/organisation/application"
// family -- all 11 files/functions that manage `IfcPerson`/`IfcOrganization`/
// `IfcPersonAndOrganization`/`IfcApplication`: `add_person`/`edit_person`/
// `remove_person`, `add_organisation`/`edit_organisation`/`remove_organisation`,
// `add_person_and_organisation`/`remove_person_and_organisation` (real Python has no
// `edit_person_and_organisation.py` -- none is added here either), and
// `add_application`/`edit_application`/`remove_application`. Namespaced per this
// project's `util/index.ts` per-submodule convention: `api.owner.addPerson`, etc.
//
// The remaining 11 files (`add_actor`/`edit_actor`/`remove_actor`/`assign_actor`/
// `unassign_actor`, `add_role`/`edit_role`/`remove_role`, `add_address`/`edit_address`/
// `remove_address` -- the "actor/role/address" family) are chunk 2 of 2, landing as a
// separate PR against the same base branch; see `planning/ifcopenshell-ts/PROGRESS.md`'s
// Phase 6 table.
//
// Three of this chunk's own functions (`removePerson`/`removeOrganisation`/
// `removePersonAndOrganisation`) have real, load-bearing dependencies on
// `remove_role`/`remove_address` (chunk 2's own files) and `api.root.remove_product`
// (a much larger, entirely separate future chunk) -- none of the three are exposed
// here; see `./internalCascadeHelpers.ts`'s own header comment for how those
// dependencies were resolved (private, disclosed, verified-against-the-real-source
// reproductions, not real exported ports of either).
export { addApplication } from "./addApplication";
export type { AddApplicationSettings } from "./addApplication";
export { addOrganisation } from "./addOrganisation";
export type { AddOrganisationSettings } from "./addOrganisation";
export { addPerson } from "./addPerson";
export type { AddPersonSettings } from "./addPerson";
export { addPersonAndOrganisation } from "./addPersonAndOrganisation";
export type { AddPersonAndOrganisationSettings } from "./addPersonAndOrganisation";
export { createOwnerHistory } from "./createOwnerHistory";
export type { CreateOwnerHistorySettings } from "./createOwnerHistory";
export { editApplication } from "./editApplication";
export type { EditApplicationSettings } from "./editApplication";
export { editOrganisation } from "./editOrganisation";
export type { EditOrganisationSettings } from "./editOrganisation";
export { editPerson } from "./editPerson";
export type { EditPersonSettings } from "./editPerson";
export { removeApplication } from "./removeApplication";
export type { RemoveApplicationSettings } from "./removeApplication";
export { removeOrganisation } from "./removeOrganisation";
export type { RemoveOrganisationSettings } from "./removeOrganisation";
export { removePerson } from "./removePerson";
export type { RemovePersonSettings } from "./removePerson";
export { removePersonAndOrganisation } from "./removePersonAndOrganisation";
export type { RemovePersonAndOrganisationSettings } from "./removePersonAndOrganisation";
export { ownerSettings } from "./settings";
export type { GetApplication, GetUser } from "./settings";
export { updateOwnerHistory } from "./updateOwnerHistory";
export type { UpdateOwnerHistorySettings } from "./updateOwnerHistory";
