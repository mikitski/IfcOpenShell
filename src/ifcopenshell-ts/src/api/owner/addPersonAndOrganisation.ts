// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/add_person_and_organisation.py` (src/ifcopenshell-
// python, 43 lines) -- pairs a person and organisation into an `IfcPersonAndOrganization`
// ("a representative belonging to a company"). Note: real Python has no
// `edit_person_and_organisation.py` at all (confirmed by directory listing) -- there is
// deliberately no `editPersonAndOrganisation` in this port either.
//
// `IfcPersonAndOrganization`: `ThePerson`(0), `TheOrganization`(1), `Roles`(2) --
// identical order in all 3 schemas (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/
// `ifc4x3.d.ts`), no DERIVE attributes. Real Python passes `person`/`organisation` as
// positional args to `file.create_entity` directly (`file.create_entity(
// "IfcPersonAndOrganization", person, organisation)`) -- this is the one function in
// this chunk where real Python's own call is already positional, so this port's
// positional `createEntity` call is a direct, unmodified translation, not a kwargs-to-
// positional remapping like `./addPerson.ts`/`./addOrganisation.ts` needed.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddPersonAndOrganisationSettings {
	/** The `IfcPerson` being the representative of the organisation. */
	person: EntityInstance;
	/** The `IfcOrganization` it represents. */
	organisation: EntityInstance;
}

function addPersonAndOrganisationUsecase(file: IfcFile, settings: AddPersonAndOrganisationSettings): EntityInstance {
	// `IfcPersonAndOrganization`: ThePerson(0), TheOrganization(1) -- see header comment.
	return file.createEntity("IfcPersonAndOrganization", settings.person, settings.organisation);
}

/**
 * Adds a paired person and organisation (Python:
 * `ifcopenshell.api.owner.add_person_and_organisation`).
 *
 * A person and an organisation may be paired to create a representative belonging to a
 * company.
 *
 * @example
 * ```ts
 * const person = api.owner.addPerson(model, { identification: "lecorbycorbycorb", familyName: "Curbosiar", givenName: "Le" });
 * const organisation = api.owner.addOrganisation(model, { identification: "AWB", name: "Architects Without Ballpens" });
 * api.owner.addPersonAndOrganisation(model, { person, organisation });
 * ```
 */
export const addPersonAndOrganisation = wrapUsecase(
	"owner.add_person_and_organisation",
	addPersonAndOrganisationUsecase,
);
