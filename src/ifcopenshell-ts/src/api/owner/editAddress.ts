// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/edit_address.py` (src/ifcopenshell-python, 45 lines)
// -- a trivial attribute-setter loop, matching `./editOrganisation.ts`/`./editPerson.ts`'s
// identical shape verbatim. Works identically for `IfcPostalAddress`/`IfcTelecomAddress`
// (a generic `setattr` loop, no class-specific branching) -- including
// `IfcTelecomAddress.MessagingIDs`, an IFC4+-only 9th attribute (see
// `./addAddress.ts`'s header comment) that this function requires no special handling
// for either, since it's just another name in the `attributes` dict.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditAddressSettings {
	/** The `IfcAddress` (`IfcPostalAddress`/`IfcTelecomAddress`) entity you want to edit. */
	address: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editAddressUsecase(_file: IfcFile, settings: EditAddressSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.address.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcAddress` (Python: `ifcopenshell.api.owner.edit_address`).
 *
 * For more information about the attributes and data types of an `IfcAddress`, consult
 * the IFC documentation.
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, {});
 * const postal = api.owner.addAddress(model, { assignedObject: organisation, ifcClass: "IfcPostalAddress" });
 * api.owner.editAddress(model, {
 *   address: postal,
 *   attributes: { Purpose: "OFFICE", AddressLines: ["42 Wallaby Way"], Town: "Sydney", Region: "NSW", PostalCode: "2000" },
 * });
 * ```
 */
export const editAddress = wrapUsecase("owner.edit_address", editAddressUsecase);
