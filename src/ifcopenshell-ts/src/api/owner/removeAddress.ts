// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/remove_address.py` (src/ifcopenshell-python, 40
// lines) -- the real, exported home for this function. `./internalCascadeHelpers.ts`
// had a private, unexported `removeAddressCascade` reproducing this exact same real
// Python source as a temporary stand-in (needed by `./removePerson.ts`/
// `./removeOrganisation.ts` before this chunk existed -- see that file's own header
// comment); this file's implementation is behaviorally identical (verified
// line-by-line against the same real Python source below), and
// `internalCascadeHelpers.ts`'s own copy has now been deleted in favor of
// `./removePerson.ts`/`./removeOrganisation.ts` calling this real, exported function
// directly.
//
// Real Python:
// ```python
// def remove_address(file, address):
//     for inverse in file.get_inverse(address):
//         if inverse.is_a() in ("IfcOrganization", "IfcPerson"):
//             if inverse.Addresses == (address,):
//                 inverse.Addresses = None
//     file.remove(address)
// ```
//
// Note `IfcPersonAndOrganization` is NOT one of the checked types here (unlike
// `./removeRole.ts`'s equivalent `IfcOrganization`/`IfcPerson`/`IfcPersonAndOrganization`
// trio) -- confirmed against all 3 generated `.d.ts`s: `IfcPersonAndOrganization`
// declares no `Addresses` attribute of its own in any schema (see `./addAddress.ts`'s
// header comment for the same fact), so it genuinely can never be an inverse of an
// `IfcAddress` this way -- not an oversight in real Python, ported verbatim without
// adding a third, always-no-op branch.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface RemoveAddressSettings {
	/** The `IfcAddress` to remove. */
	address: EntityInstance;
}

function removeAddressUsecase(file: IfcFile, settings: RemoveAddressSettings): void {
	const { address } = settings;
	for (const inverse of file.getInverse(address) as Set<EntityInstance>) {
		const type = inverse.isA();
		if (type === "IfcOrganization" || type === "IfcPerson") {
			const addresses = (inverse.get("Addresses") as EntityInstance[] | null) ?? [];
			if (addresses.length === 1 && addresses[0].equals(address)) {
				inverse.set("Addresses", null);
			}
		}
	}
	file.remove(address);
}

/**
 * Removes an address (Python: `ifcopenshell.api.owner.remove_address`).
 *
 * Naturally, any organisations or people using that address will have the
 * relationship removed.
 *
 * @example
 * ```ts
 * const organisation = api.owner.addOrganisation(model, {});
 * const address = api.owner.addAddress(model, { assignedObject: organisation, ifcClass: "IfcPostalAddress" });
 * api.owner.removeAddress(model, { address });
 * ```
 */
export const removeAddress = wrapUsecase("owner.remove_address", removeAddressUsecase);
