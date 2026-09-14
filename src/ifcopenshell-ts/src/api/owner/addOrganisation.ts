// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/add_organisation.py` (src/ifcopenshell-python, 46
// lines) -- creates a new, unattached `IfcOrganization`, matching `./addPerson.ts`'s
// identical shape (see that file's own header comment for the full "positional order
// verified against the 3 generated `.d.ts`s" / "`Id`-vs-`Identification` rename, same
// slot" writeup, which applies here symmetrically).
//
// `IfcOrganization`: `Id`|`Identification`(0), `Name`(1), `Description`(2), `Roles`(3),
// `Addresses`(4) -- identical order in all 3 schemas, no DERIVE attributes. Only the
// first 2 positions are ever populated here.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddOrganisationSettings {
	/**
	 * The short code identifying the organisation. Sometimes used in drawing naming
	 * schemes. Otherwise used as a canonicalised way for computers to identify the
	 * organisation, like their stock name. Python default: `"APTR"`.
	 */
	identification?: string;
	/** The legal name of the organisation. Python default: `"Aperture Science"`. */
	name?: string;
}

function addOrganisationUsecase(file: IfcFile, settings: AddOrganisationSettings = {}): EntityInstance {
	const identification = settings.identification ?? "APTR";
	const name = settings.name ?? "Aperture Science";

	// `IfcOrganization`: Id/Identification(0), Name(1) -- see header comment.
	return file.createEntity("IfcOrganization", identification, name);
}

/**
 * Adds a new organisation (Python: `ifcopenshell.api.owner.add_organisation`).
 *
 * Organisations are the main way to identify manufacturers, suppliers, and other
 * actors who do not have a single representative or must not have any personally
 * identifiable information.
 *
 * @example
 * ```ts
 * api.owner.addOrganisation(model, { identification: "AWB", name: "Architects Without Ballpens" });
 * ```
 */
export const addOrganisation = wrapUsecase("owner.add_organisation", addOrganisationUsecase);
