// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/remove_organisation.py` (src/ifcopenshell-python, 65
// lines). Removes an `IfcOrganization`, cascading into every role/address it (and it
// alone) uses (identical shape to `./removePerson.ts`'s own role/address cleanup), plus
// 5 kinds of inverse-reference cleanup: `IfcOrganizationRelationship` (removed outright,
// whether `organisation` is the relating OR one of the related organisations),
// `IfcDocumentInformation.Editors`, every `IfcPersonAndOrganization` pairing this
// organisation (full removal, via `./removePersonAndOrganisation.ts`), every
// `IfcActor`/`IfcOccupant` wrapping this organisation (full removal, via
// `./internalCascadeHelpers.ts`'s `removeProductCascade`), `IfcResourceLevelRelationship`
// (IFC4+ only), and every `IfcApplication` developed by this organisation (full removal,
// via `./removeApplication.ts`).
//
// --- A real, harmless, disclosed dead-code oddity in real Python, ported verbatim ---
//
// Real Python's `if`/`elif` chain checks `inverse.is_a("IfcOrganizationRelationship")`
// FIRST, then several `elif`s later has `elif inverse.is_a("IfcResourceLevelRelationship")
// and not inverse.is_a("IfcOrganizationRelationship"):` -- since `IfcOrganizationRelationship`
// IS a subtype of `IfcResourceLevelRelationship` (confirmed: it's one of the concrete
// subtypes EXPRESS declares under that IFC4+ abstract supertype), any instance that
// would satisfy `is_a("IfcOrganizationRelationship")` was ALREADY caught by the very
// first `if` branch above and can never reach this later `elif` at all -- making its own
// `and not inverse.is_a("IfcOrganizationRelationship")` guard permanently redundant
// (always true by the time control reaches it) rather than a real, reachable exclusion.
// Zero behavioral effect either way; ported verbatim rather than simplified to just
// `elif inverse.is_a("IfcResourceLevelRelationship"):`, matching this project's
// discipline of preserving a real Python source's own logic shape even when a piece of
// it is provably dead.
//
// `remove_role`/`remove_address`/`root.remove_product` -- see `./removePerson.ts`'s own
// header comment (identical reasoning, not repeated here) for why these come from
// `./internalCascadeHelpers.ts` instead of separate exported files.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { removeAddressCascade, removeProductCascade, removeRoleCascade } from "./internalCascadeHelpers";
import { removeApplication } from "./removeApplication";
import { removePersonAndOrganisation } from "./removePersonAndOrganisation";

export interface RemoveOrganisationSettings {
	/** The `IfcOrganization` to remove. */
	organisation: EntityInstance;
}

function removeOrganisationUsecase(file: IfcFile, settings: RemoveOrganisationSettings): void {
	const { organisation } = settings;

	for (const role of (organisation.get("Roles") as EntityInstance[] | null) ?? []) {
		if (file.getTotalInverses(role) === 1) {
			removeRoleCascade(file, role);
		}
	}
	for (const address of (organisation.get("Addresses") as EntityInstance[] | null) ?? []) {
		if (file.getTotalInverses(address) === 1) {
			removeAddressCascade(file, address);
		}
	}

	for (const inverse of file.getInverse(organisation) as Set<EntityInstance>) {
		if (inverse.isA("IfcOrganizationRelationship")) {
			const relatingOrganization = inverse.get("RelatingOrganization") as EntityInstance | null;
			const relatedOrganizations = (inverse.get("RelatedOrganizations") as EntityInstance[] | null) ?? [];
			if (relatingOrganization?.equals(organisation)) {
				file.remove(inverse);
			} else if (relatedOrganizations.length === 1 && relatedOrganizations[0].equals(organisation)) {
				file.remove(inverse);
			}
		} else if (inverse.isA("IfcDocumentInformation")) {
			const editors = (inverse.get("Editors") as EntityInstance[] | null) ?? [];
			if (editors.length === 1 && editors[0].equals(organisation)) {
				inverse.set("Editors", null);
			}
		} else if (inverse.isA("IfcPersonAndOrganization")) {
			removePersonAndOrganisation(file, { personAndOrganisation: inverse });
		} else if (inverse.isA("IfcActor")) {
			removeProductCascade(file, inverse);
		} else if (inverse.isA("IfcResourceLevelRelationship") && !inverse.isA("IfcOrganizationRelationship")) {
			// The `!inverse.isA("IfcOrganizationRelationship")` guard is permanently
			// redundant here -- see header comment. Ported verbatim.
			const related = (inverse.get("RelatedResourceObjects") as EntityInstance[] | null) ?? [];
			if (related.length === 1 && related[0].equals(organisation)) {
				file.remove(inverse);
			}
		} else if (inverse.isA("IfcApplication")) {
			removeApplication(file, { application: inverse });
		}
	}

	file.remove(organisation);
}

/**
 * Removes an organisation (Python: `ifcopenshell.api.owner.remove_organisation`).
 *
 * All roles and addresses assigned to the organisation will also be removed.
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, { identification: "AWB", name: "Architects Without Ballpens" });
 * api.owner.removeOrganisation(model, { organisation });
 * ```
 */
export const removeOrganisation = wrapUsecase("owner.remove_organisation", removeOrganisationUsecase);
