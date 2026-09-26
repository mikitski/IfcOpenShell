// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.owner` (src/ifcopenshell-python's
// `ifcopenshell/api/owner/` package) -- the `api.root`/`api.owner` chunk ported
// `create_owner_history` (`./createOwnerHistory.ts`) and the `settings`
// monkeypatch-replacement hook (`./settings.ts`); the `api.spatial` chunk added
// `update_owner_history` (`./updateOwnerHistory.ts`). Chunk 1 of 2 ported the
// "person/organisation/application" family -- 11 files/functions that manage
// `IfcPerson`/`IfcOrganization`/`IfcPersonAndOrganization`/`IfcApplication`:
// `add_person`/`edit_person`/`remove_person`, `add_organisation`/`edit_organisation`/
// `remove_organisation`, `add_person_and_organisation`/`remove_person_and_organisation`
// (real Python has no `edit_person_and_organisation.py` -- none is added here either),
// and `add_application`/`edit_application`/`remove_application`. This chunk (chunk 2 of
// 2, completing `api.owner`'s full 25-file/function surface) ports the remaining
// "actor/role/address" family -- `add_actor`/`edit_actor`/`remove_actor`/
// `assign_actor`/`unassign_actor` (IfcActor/IfcOccupant), `add_role`/`edit_role`/
// `remove_role` (IfcActorRole), and `add_address`/`edit_address`/`remove_address`
// (IfcPostalAddress/IfcTelecomAddress). Namespaced per this project's `util/index.ts`
// per-submodule convention: `api.owner.addPerson`, `api.owner.addActor`, etc.
//
// Three of chunk 1's own functions (`removePerson`/`removeOrganisation`/
// `removePersonAndOrganisation`) had real, load-bearing dependencies on
// `remove_role`/`remove_address` (this chunk's own files, not yet landed at the time)
// and `api.root.remove_product` (a much larger, entirely separate future chunk) --
// resolved at the time via a private, disclosed, since-deleted `./internalCascadeHelpers
// .ts` (verified-against-the-real-source reproductions of each dependency's generic
// behavior). `removeRoleCascade`/`removeAddressCascade` were retired once this chunk's
// own `./removeRole.ts`/`./removeAddress.ts` landed as real, exported ports; the same
// file's `removeProductCascade` was retired once the "`api.root` -- `remove_product`"
// chunk landed the real, exported `../root/removeProduct.ts` -- see that file's own
// header comment for the full retirement writeup. All three `remove*` functions above
// now call the real, exported ports directly.
export { addActor } from "./addActor";
export type { ActorType, AddActorSettings } from "./addActor";
export { addAddress } from "./addAddress";
export type { AddAddressSettings, AddressType } from "./addAddress";
export { addApplication } from "./addApplication";
export type { AddApplicationSettings } from "./addApplication";
export { addOrganisation } from "./addOrganisation";
export type { AddOrganisationSettings } from "./addOrganisation";
export { addPerson } from "./addPerson";
export type { AddPersonSettings } from "./addPerson";
export { addPersonAndOrganisation } from "./addPersonAndOrganisation";
export type { AddPersonAndOrganisationSettings } from "./addPersonAndOrganisation";
export { addRole } from "./addRole";
export type { AddRoleSettings } from "./addRole";
export { assignActor } from "./assignActor";
export type { AssignActorSettings } from "./assignActor";
export { createOwnerHistory } from "./createOwnerHistory";
export type { CreateOwnerHistorySettings } from "./createOwnerHistory";
export { editActor } from "./editActor";
export type { EditActorSettings } from "./editActor";
export { editAddress } from "./editAddress";
export type { EditAddressSettings } from "./editAddress";
export { editApplication } from "./editApplication";
export type { EditApplicationSettings } from "./editApplication";
export { editOrganisation } from "./editOrganisation";
export type { EditOrganisationSettings } from "./editOrganisation";
export { editPerson } from "./editPerson";
export type { EditPersonSettings } from "./editPerson";
export { editRole } from "./editRole";
export type { EditRoleSettings } from "./editRole";
export { removeActor } from "./removeActor";
export type { RemoveActorSettings } from "./removeActor";
export { removeAddress } from "./removeAddress";
export type { RemoveAddressSettings } from "./removeAddress";
export { removeApplication } from "./removeApplication";
export type { RemoveApplicationSettings } from "./removeApplication";
export { removeOrganisation } from "./removeOrganisation";
export type { RemoveOrganisationSettings } from "./removeOrganisation";
export { removePerson } from "./removePerson";
export type { RemovePersonSettings } from "./removePerson";
export { removePersonAndOrganisation } from "./removePersonAndOrganisation";
export type { RemovePersonAndOrganisationSettings } from "./removePersonAndOrganisation";
export { removeRole } from "./removeRole";
export type { RemoveRoleSettings } from "./removeRole";
export { ownerSettings } from "./settings";
export type { GetApplication, GetUser } from "./settings";
export { unassignActor } from "./unassignActor";
export type { UnassignActorSettings } from "./unassignActor";
export { updateOwnerHistory } from "./updateOwnerHistory";
export type { UpdateOwnerHistorySettings } from "./updateOwnerHistory";
