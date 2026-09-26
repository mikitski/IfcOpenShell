// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/remove_person_and_organisation.py` (src/
// ifcopenshell-python, 58 lines). Removes an `IfcPersonAndOrganization` "user" pairing
// -- the underlying `IfcPerson`/`IfcOrganization` are NOT removed, only the pairing
// itself (real Python's own docstring: "the underlying person and organisation is not
// removed, only the 'person and organisation' group"). Cleans up 4 kinds of inverse
// reference: `IfcDocumentInformation.Editors`, `IfcActor`/`IfcOccupant` wrapping this
// user (full removal, via `../root/removeProduct.ts`'s real, exported port -- this file
// previously called a private, since-deleted `removeProductCascade` reproduction from
// `./internalCascadeHelpers.ts`, see `../root/removeProduct.ts`'s own header comment
// for the full retirement writeup), `IfcResourceLevelRelationship` (IFC4+ only), and --
// unlike `./removePerson.ts`/`./removeOrganisation.ts`, neither of which touch
// `IfcOwnerHistory` at all -- every `IfcOwnerHistory` whose `OwningUser` is this
// pairing is unconditionally deleted outright (real Python: `elif inverse.is_a(
// "IfcOwnerHistory"): file.remove(inverse)`, no equality/cardinality check at all,
// unlike every other branch in this function -- a real, disclosed asymmetry, ported
// verbatim, not "fixed" to also check `inverse.OwningUser == person_and_organisation`
// first).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { removeProduct } from "../root/removeProduct";

export interface RemovePersonAndOrganisationSettings {
	/** The `IfcPersonAndOrganization` to remove. */
	personAndOrganisation: EntityInstance;
}

function removePersonAndOrganisationUsecase(file: IfcFile, settings: RemovePersonAndOrganisationSettings): void {
	const { personAndOrganisation } = settings;

	for (const inverse of file.getInverse(personAndOrganisation) as Set<EntityInstance>) {
		if (inverse.isA("IfcDocumentInformation")) {
			const editors = (inverse.get("Editors") as EntityInstance[] | null) ?? [];
			if (editors.length === 1 && editors[0].equals(personAndOrganisation)) {
				inverse.set("Editors", null);
			}
		} else if (inverse.isA("IfcActor")) {
			removeProduct(file, { product: inverse });
		} else if (inverse.isA("IfcResourceLevelRelationship")) {
			const related = (inverse.get("RelatedResourceObjects") as EntityInstance[] | null) ?? [];
			if (related.length === 1 && related[0].equals(personAndOrganisation)) {
				file.remove(inverse);
			}
		} else if (inverse.isA("IfcOwnerHistory")) {
			// Unconditional -- see header comment.
			file.remove(inverse);
		}
	}
	file.remove(personAndOrganisation);
}

/**
 * Removes a person and organisation pairing (Python:
 * `ifcopenshell.api.owner.remove_person_and_organisation`).
 *
 * Note that the underlying person and organisation are not removed, only the "person
 * and organisation" group.
 *
 * @example
 * ```ts
 * const person = api.owner.addPerson(model, { identification: "lecorbycorbycorb", familyName: "Curbosiar", givenName: "Le" });
 * const organisation = api.owner.addOrganisation(model, { identification: "AWB", name: "Architects Without Ballpens" });
 * const user = api.owner.addPersonAndOrganisation(model, { person, organisation });
 * api.owner.removePersonAndOrganisation(model, { personAndOrganisation: user });
 * ```
 */
export const removePersonAndOrganisation = wrapUsecase(
	"owner.remove_person_and_organisation",
	removePersonAndOrganisationUsecase,
);
