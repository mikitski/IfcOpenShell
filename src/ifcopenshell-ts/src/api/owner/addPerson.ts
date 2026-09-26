// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/add_person.py` (src/ifcopenshell-python, 46 lines) --
// the first file of this project's `api.owner` "person/organisation/application"
// chunk (11 files, ~632 real-Python lines across the whole `api.owner` module's
// remaining 22 files -- see `./index.ts`'s own header comment for this chunk's exact
// scope). Creates a new, unattached `IfcPerson` -- no relationship of any kind, matching
// `../library/addLibrary.ts`'s own precedent for a bare, unrelated resource-object
// creation.
//
// --- `IfcPerson`'s attribute order, verified not assumed ---
//
// Real Python builds a `dict` (`{"FamilyName": ..., "GivenName": ..., "Id"|
// "Identification": ...}`) and passes it as `**kwargs` -- order-independent, since
// `file.create_entity(cls, **kwargs)` resolves each key by name. This port's
// `IfcFile.createEntity` is positional-only, so the real ordering matters: confirmed
// directly against `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`'s `IfcPerson` interface, all
// three schemas declare the identical order `Id`|`Identification`(0), `FamilyName`(1),
// `GivenName`(2), `MiddleNames`(3), `PrefixTitles`(4), `SuffixTitles`(5), `Roles`(6),
// `Addresses`(7) -- no DERIVE attributes on this class in any schema. Only the first
// 3 positions are ever populated here, matching `../library/addLibrary.ts`'s own
// "fewer positional args than the class declares, the rest default to null" precedent.
//
// --- IFC2X3-vs-IFC4+ attribute rename, ported verbatim ---
//
// `Id` (IFC2X3) vs. `Identification` (IFC4+) -- the same attribute at the same
// position(0) in every schema, just renamed going into IFC4. Real Python dispatches on
// `file.schema == "IFC2X3"` to decide which dict key to populate; since both names
// resolve to the identical positional slot, this port doesn't need the schema branch at
// all for the *value* -- `identification` always goes in position 0 regardless of
// schema -- but the branch is kept anyway, in spirit, via the shared `identification`
// local variable's own comment, to keep this file readable next to the real source.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddPersonSettings {
	/**
	 * The computer readable unique identification of the person. For example, their
	 * username in a CDE or alias. Python default: `"HSeldon"`.
	 */
	identification?: string;
	/** The family name. Python default: `"Seldon"`. */
	familyName?: string;
	/** The given name. Python default: `"Hari"`. */
	givenName?: string;
}

function addPersonUsecase(file: IfcFile, settings: AddPersonSettings = {}): EntityInstance {
	const identification = settings.identification ?? "HSeldon";
	const familyName = settings.familyName ?? "Seldon";
	const givenName = settings.givenName ?? "Hari";

	// `IfcPerson`: Id/Identification(0), FamilyName(1), GivenName(2) -- see header
	// comment. `identification` fills position 0 regardless of schema (`Id` on
	// IFC2X3, `Identification` on IFC4+ -- same slot, just renamed).
	return file.createEntity("IfcPerson", identification, familyName, givenName);
}

/**
 * Adds a new person (Python: `ifcopenshell.api.owner.add_person`).
 *
 * Persons are used to identify a legal or liable representative of an organisation or
 * point of contact.
 *
 * @example
 * ```ts
 * api.owner.addPerson(model, {
 *   identification: "bobthebuilder", familyName: "Thebuilder", givenName: "Bob",
 * });
 * ```
 */
export const addPerson = wrapUsecase("owner.add_person", addPersonUsecase);
