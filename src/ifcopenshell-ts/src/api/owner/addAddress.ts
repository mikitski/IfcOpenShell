// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/add_address.py` (src/ifcopenshell-python, 58 lines)
// -- creates a new `IfcPostalAddress` or `IfcTelecomAddress` and appends it to
// `assignedObject.Addresses` (an `IfcPerson`/`IfcOrganization` -- note NOT
// `IfcPersonAndOrganization`, which has no `Addresses` attribute of its own in any of
// the 3 schemas, unlike `IfcActorRole`'s `Roles`, which all 3 of `IfcPerson`/
// `IfcOrganization`/`IfcPersonAndOrganization` declare).
//
// `IfcPostalAddress`: `Purpose`(0), `Description`(1), `UserDefinedPurpose`(2),
// `InternalLocation`(3), `AddressLines`(4), `PostalBox`(5), `Town`(6), `Region`(7),
// `PostalCode`(8), `Country`(9). `IfcTelecomAddress`: `Purpose`(0), `Description`(1),
// `UserDefinedPurpose`(2), `TelephoneNumbers`(3), `FacsimileNumbers`(4), `PagerNumber`(5),
// `ElectronicMailAddresses`(6), `WWWHomePageURL`(7), plus a 9th `MessagingIDs`(8) on
// IFC4+ only. Both classes' `Purpose` sits at position(0) in all 3 schemas, and neither
// declares any DERIVE attribute (confirmed against `ifc2x3.d.ts`/`ifc4.d.ts`/
// `ifc4x3.d.ts`) -- so `file.createEntity(ifcClass, "OFFICE")` below correctly seeds
// `Purpose` for either class, matching real Python's own single, class-agnostic
// `file.create_entity(ifc_class, "OFFICE")` call.
//
// --- `IfcTelecomAddress` deprecation in IFC4X3: NOT relevant to this file ---
//
// Real Python's own comment (also seen in `./addApplication.ts`'s `createApplicationOrganisation`
// helper, ported there) notes `IfcTelecomAddress` is deprecated in IFC4X3 in favor of an
// `IfcActor`+"PEnum_AddressType" pset. That deprecation guidance is specific to
// `add_application`'s OWN internal default-organisation-building logic (which needed to
// decide how to store a default webpage URL without relying on a deprecated class) --
// `add_address.py`/`edit_address.py`/`remove_address.py` are all generic, class-agnostic
// functions with no schema-version branching of any kind; none of them special-case
// IFC4X3 or refuse to create/edit/remove an `IfcTelecomAddress` there (the schema still
// declares the class on IFC4X3, merely discourages new usage) -- ported verbatim as
// plain, unconditional functions, not "fixed" to add an IFC4X3 guard real Python itself
// doesn't have here.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python: `ADDRESS_TYPE = Literal["IfcPostalAddress", "IfcTelecomAddress"]`. */
export type AddressType = "IfcPostalAddress" | "IfcTelecomAddress";

export interface AddAddressSettings {
	/** The `IfcOrganization` or `IfcPerson` the contact address belongs to. */
	assignedObject: EntityInstance;
	/** Either `IfcPostalAddress` or `IfcTelecomAddress`. Python default: `"IfcPostalAddress"`. */
	ifcClass?: AddressType;
}

function addAddressUsecase(file: IfcFile, settings: AddAddressSettings): EntityInstance {
	const ifcClass = settings.ifcClass ?? "IfcPostalAddress";
	const { assignedObject } = settings;

	// `Purpose` is position(0) for both `IfcPostalAddress`/`IfcTelecomAddress` -- see
	// header comment.
	const address = file.createEntity(ifcClass, "OFFICE");

	const addresses = (assignedObject.get("Addresses") as EntityInstance[] | null) ?? [];
	assignedObject.set("Addresses", [...addresses, address]);
	return address;
}

/**
 * Add a new telecom or postal address to an organisation or person (Python:
 * `ifcopenshell.api.owner.add_address`).
 *
 * A person or organisation may have associated contact details such as phone numbers,
 * mailing addresses, websites, email addresses, and instant messaging handles. This
 * information is critical in recording the contact information of manufacturers and
 * suppliers for facility management, or liable actors.
 *
 * There are two types of addresses, postal addresses for physical snail mail, and
 * telecom addresses for telephone or internet contact numbers and addresses.
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, {});
 * const postal = api.owner.addAddress(model, { assignedObject: organisation, ifcClass: "IfcPostalAddress" });
 * api.owner.editAddress(model, { address: postal, attributes: { Town: "Sydney" } });
 * ```
 */
export const addAddress = wrapUsecase("owner.add_address", addAddressUsecase);
