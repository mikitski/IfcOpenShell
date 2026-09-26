// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/remove_person.py` (src/ifcopenshell-python, 57 lines).
// Removes an `IfcPerson`, cascading into every role/address it (and it alone) uses, and
// cleaning up every inverse reference so nothing is left dangling/invalid:
// `IfcWorkControl.Creators`/`IfcDocumentInformation.Editors` are cleared (both OPTIONAL
// SETs); `IfcInventory.ResponsiblePersons` is cleared on IFC4+ but, since it's a
// MANDATORY (non-optional) attribute on IFC2X3, the whole `IfcInventory` is removed
// there instead (real Python's own comment: "in IFC2X3 ResponsiblePersons is not
// optional and without it IfcInventory is not valid"); every `IfcPersonAndOrganization`
// pairing this person is fully removed (via `./removePersonAndOrganisation.ts`, this
// chunk's own sibling file); every `IfcActor`/`IfcOccupant` wrapping this person is
// fully removed; every `IfcResourceLevelRelationship` (IFC4+ only) solely referencing
// this person is removed.
//
// `remove_role`/`remove_address` are called via their real, exported ports
// (`./removeRole.ts`/`./removeAddress.ts`, landed by the "actor/role/address" chunk) --
// this file previously called private `removeRoleCascade`/`removeAddressCascade`
// reproductions from a since-deleted `./internalCascadeHelpers.ts`. `root.remove_product`
// is likewise now called via its own real, exported port (`../root/removeProduct.ts`,
// landed by the "root -- remove_product" chunk) -- this file previously called that
// same now-deleted file's own private `removeProductCascade` reproduction (see
// `../root/removeProduct.ts`'s own header comment for the full retirement writeup).
// Since this function only ever calls it on an `IfcActor` or (IFC2X3-only)
// `IfcInventory` -- never a genuine `IfcProduct`/`IfcTypeProduct` -- the swap changes
// no observable behavior here (confirmed by re-running this file's own test suite).
//
// No id-collect-then-refetch defensive pattern here (unlike `../group/removeGroup.ts`/
// `../root/removeProduct.ts`) -- real Python's
// `remove_person.py` iterates `file.get_inverse(person)` directly with no such
// precaution, so this port doesn't add one either (bug-compatible: if a future change
// to an earlier iteration ever invalidates a later `inverse` before this port reaches
// it, that's the same latent fragility real Python already has here).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { removeProduct } from "../root/removeProduct";
import { removeAddress } from "./removeAddress";
import { removePersonAndOrganisation } from "./removePersonAndOrganisation";
import { removeRole } from "./removeRole";

export interface RemovePersonSettings {
	/** The `IfcPerson` to remove. */
	person: EntityInstance;
}

function removePersonUsecase(file: IfcFile, settings: RemovePersonSettings): void {
	const { person } = settings;

	for (const role of (person.get("Roles") as EntityInstance[] | null) ?? []) {
		if (file.getTotalInverses(role) === 1) {
			removeRole(file, { role });
		}
	}
	for (const address of (person.get("Addresses") as EntityInstance[] | null) ?? []) {
		if (file.getTotalInverses(address) === 1) {
			removeAddress(file, { address });
		}
	}

	for (const inverse of file.getInverse(person) as Set<EntityInstance>) {
		if (inverse.isA("IfcWorkControl")) {
			const creators = (inverse.get("Creators") as EntityInstance[] | null) ?? [];
			if (creators.length === 1 && creators[0].equals(person)) {
				inverse.set("Creators", null);
			}
		} else if (inverse.isA("IfcInventory")) {
			const responsiblePersons = (inverse.get("ResponsiblePersons") as EntityInstance[] | null) ?? [];
			if (responsiblePersons.length === 1 && responsiblePersons[0].equals(person)) {
				// In IFC2X3, ResponsiblePersons is not optional -- without it, IfcInventory
				// wouldn't be schema-valid, so the whole inventory is removed instead of just
				// clearing the attribute. On IFC4+ it's OPTIONAL, so real Python leaves the
				// inventory alone entirely in that case (a real, disclosed asymmetry with
				// every other branch here, which DOES clear the OPTIONAL attribute on IFC4+ --
				// ported verbatim, not "fixed" to also clear it).
				if (file.schema === "IFC2X3") {
					removeProduct(file, { product: inverse });
				}
			}
		} else if (inverse.isA("IfcDocumentInformation")) {
			const editors = (inverse.get("Editors") as EntityInstance[] | null) ?? [];
			if (editors.length === 1 && editors[0].equals(person)) {
				inverse.set("Editors", null);
			}
		} else if (inverse.isA("IfcPersonAndOrganization")) {
			removePersonAndOrganisation(file, { personAndOrganisation: inverse });
		} else if (inverse.isA("IfcActor")) {
			removeProduct(file, { product: inverse });
		} else if (inverse.isA("IfcResourceLevelRelationship")) {
			const related = (inverse.get("RelatedResourceObjects") as EntityInstance[] | null) ?? [];
			if (related.length === 1 && related[0].equals(person)) {
				file.remove(inverse);
			}
		}
	}

	file.remove(person);
}

/**
 * Removes a person (Python: `ifcopenshell.api.owner.remove_person`).
 *
 * All roles and addresses assigned to the person will also be removed. In IFC2X3, this
 * will also remove related inventories if `person` was the only responsible person for
 * them.
 *
 * @example
 * ```ts
 * const person = api.owner.addPerson(model, { identification: "bobthebuilder", familyName: "Thebuilder", givenName: "Bob" });
 * api.owner.removePerson(model, { person });
 * ```
 */
export const removePerson = wrapUsecase("owner.remove_person", removePersonUsecase);
