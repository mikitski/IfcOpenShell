// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/owner/add_application.py` (src/ifcopenshell-python, 111
// lines). Creates a new `IfcApplication`. If `applicationDeveloper` isn't given, real
// Python's `Usecase.create_application_organisation` builds a default "IfcOpenShell"
// `IfcOrganization` -- see `createApplicationOrganisation` below.
//
// `IfcApplication`: `ApplicationDeveloper`(0), `Version`(1), `ApplicationFullName`(2),
// `ApplicationIdentifier`(3) -- identical order in all 3 schemas (confirmed against
// `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`), no DERIVE attributes. All 4 populated here,
// matching real Python's own `file.create_entity("IfcApplication", ApplicationDeveloper=
// ..., Version=..., ApplicationFullName=..., ApplicationIdentifier=...)` (a full kwargs
// call already -- this port's positional call needs no reordering, since the kwargs
// were already written in the class's declared attribute order).
//
// *** `createApplicationOrganisation`'s IFC4X3 branch (no `applicationDeveloper` given,
// on an IFC4X3 file) hits a real, pre-existing, already-disclosed primitive-layer gap
// and WILL THROW. Ported faithfully anyway, not silently worked around -- see the
// "IFC4X3 branch" section below for the full writeup. ***
//
// --- Why `create_application_organisation` needs its own writeup at all ---
//
// `IfcTelecomAddress` is deprecated in IFC4X3 (still declared in the schema, but no
// longer the recommended way to store a webpage URL) -- real Python's own comment says
// so directly. Its replacement on IFC4X3: wrap the organisation in an `IfcActor`
// (`ifcopenshell.api.owner.add_actor`) and attach a "PEnum_AddressType" property set to
// THAT actor (`ifcopenshell.api.pset.add_pset`/`edit_pset`) instead of setting
// `IfcOrganization.Addresses` directly. `add_actor`/`add_pset`/`edit_pset` are real
// files this port was explicitly told NOT to touch in this chunk (`add_actor.py`
// belongs to a separate, concurrently-in-flight "actor/role/address" chunk; `add_pset.py`
// /`edit_pset.py` belong to an entirely unported, much larger future `api.pset` chunk --
// only `pset.removePset` has landed so far, see `../pset/index.ts`'s own header
// comment). Rather than creating real, exported `./addActor.ts`/`../pset/addPset.ts`/
// `../pset/editPset.ts` files here (risking a same-file collision with the actor chunk,
// and requiring a much bigger `api.pset` port than this chunk's scope), this file
// reproduces the NARROW slice of their combined behavior needed for this one call site,
// inline, using primitives already ported: `../root/createEntity.ts` (for the actor
// itself -- `add_actor`'s own entire body is just `root.create_entity` +
// `actor.TheActor = actor_arg`, nothing more) and direct `file.createEntity`/`.set()`
// calls standing in for `add_pset`/`edit_pset`'s own `IfcPropertySet`/
// `IfcRelDefinesByProperties`/`IfcPropertySingleValue` construction (verified against
// the real `add_pset.py`/`assign_pset.py`/`edit_pset.py` source directly -- see the
// IFC4X3 branch below for exactly which of their statements this reproduces).
//
// `util.pset.getTemplate(...).getByName("PEnum_AddressType")` is called (not assumed
// null) to faithfully reproduce real `edit_pset`'s own `psetqto.get_by_name(self.
// settings["pset"].Name)` template lookup -- confirmed, not just assumed, that this
// always returns `null` for this specific name in all 3 schemas' bundled pset-template
// data (`data/pset-templates/Pset_IFC2X3.ifc`/`Pset_IFC4_ADD2.ifc`/`Pset_IFC4X3.ifc`):
// "PEnum_AddressType" only ever appears there as a standalone `IFCPROPERTYENUMERATION`
// (an enumeration of allowed `IfcAddressTypeEnum`-like string values, used BY other
// pset templates), never as an `IfcPropertySetTemplate` in its own right -- and
// `PsetQto.getByName` (`util/pset.ts`) only ever scans `IfcPropertySetTemplate`
// instances. So real `edit_pset`'s `self.pset_template` is always `None` here, and its
// `get_primary_measure_type` falls through to its final, template-less, Python-type-
// based inference branch: a plain `str` value always becomes `"IfcLabel"`
// (`edit_pset.py`'s `get_primary_measure_type`, the `isinstance(new_value, str): return
// "IfcLabel"` branch) -- all 3 of this call's property values (`"OTHER"`/`"WEBPAGE"`/
// `"https://ifcopenshell.org"`) are plain strings, so all 3 become `IfcPropertySingleValue`
// instances with an `IfcLabel`-typed `NominalValue`.
//
// --- The primitive-layer gap, and exactly where this file's IFC4X3 branch hits it ---
//
// Building that `IfcLabel`-typed `NominalValue` needs a freestanding, valued
// `IfcLabel` instance -- Python: `self.file.create_entity("IfcLabel", "OTHER")`. This
// port's `IfcFile.createEntity`/`EntityInstance.setByIndex` unconditionally call the
// native `attribute_kind_of` primitive, which throws "Attribute access is only
// supported on entity instances" for ANY standalone simple/defined-type instance --
// this is the EXACT SAME pre-existing, already-disclosed Phase 2 gap `../unit/
// addConversionBasedUnit.ts`'s own header comment documents in full (first surfaced by
// `util/migrator.ts`), independently re-confirmed here at a second, unrelated call
// site. It is NOT specific to `IfcLabel`, and NOT something this chunk introduces or
// can fix within its own scope (per this project's standing instruction: disclose,
// don't silently add a new native primitive). This file's IFC4X3 branch is therefore
// ported completely and faithfully up through the point of constructing the first
// property's `NominalValue` -- the actor, the `IfcPropertySet`, and the
// `IfcRelDefinesByProperties` linking them are all real, correctly-constructed
// entities by that point -- and then throws this same pre-existing error, exactly as
// real Python's `add_application(model)` call (with no `applicationDeveloper`, on an
// IFC4X3 file) would NOT, since real Python has no such gap.
// `test/api/owner/addApplication.test.ts` pins this CURRENT, disclosed, blocked
// behavior with a dedicated test (matching `addConversionBasedUnit.test.ts`'s own
// precedent) -- it starts failing (a good thing) the moment this foundational gap is
// ever closed. The IFC2X3/IFC4 default-organisation path, and the "applicationDeveloper
// explicitly given" path on all 3 schemas, need no standalone defined-type instance at
// all (`IfcTelecomAddress`/`IfcActorRole`/`IfcOrganization`/`IfcApplication` are all
// real ENTITY declarations, not `IfcValue`-SELECT-wrapped simple values) and work
// correctly today.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { getPep440Version } from "../../template";
import * as pset from "../../util/pset";
import { wrapUsecase } from "../hooks";
import { createEntity as rootCreateEntity } from "../root/createEntity";
import { createOwnerHistory } from "./createOwnerHistory";

/**
 * Python: `Usecase.create_application_organisation` -- see this file's header comment
 * for the full writeup, including exactly why/where the IFC4X3 branch throws.
 */
function createApplicationOrganisation(file: IfcFile): EntityInstance {
	// `IfcActorRole`: Role(0), UserDefinedRole(1) -- confirmed identical order/no DERIVE
	// attributes in all 3 schemas.
	const role = file.createEntity("IfcActorRole", "USERDEFINED", "CONTRIBUTOR");

	// `IfcOrganization`: Id/Identification(0, left unset here -- see the `setByIndex(0,
	// ...)` call below, matching real Python's own separate `result[0] = "IfcOpenShell"`
	// statement), Name(1), Description(2), Roles(3).
	const organisation = file.createEntity(
		"IfcOrganization",
		null,
		"IfcOpenShell",
		"IfcOpenShell is an open source software library that helps users and software developers to work with IFC data.",
		[role],
	);
	// Python: `result[0] = "IfcOpenShell"` (Id on IFC2X3 / Identification on IFC4+, same
	// position(0) in both -- see `./addPerson.ts`'s header comment for this same rename).
	organisation.setByIndex(0, "IfcOpenShell");

	if (file.schema === "IFC4X3") {
		// --- IFC4X3 branch: BLOCKED, see this file's header comment ---
		const actor = rootCreateEntity(file, { ifcClass: "IfcActor" });
		actor.set("TheActor", organisation);

		// Python: `ifcopenshell.api.pset.add_pset(file, actor, "PEnum_AddressType")`.
		// `add_pset`'s own `IfcObject`/`IfcContext` branch: no existing
		// `IfcRelDefinesByProperties` with this name is defined by `actor` yet (it was
		// just created), so it creates a fresh `IfcPropertySet` and calls `assign_pset`.
		// `IfcPropertySet`: GlobalId(0), OwnerHistory(1), Name(2).
		const propertySet = file.createEntity(
			"IfcPropertySet",
			guid.new(),
			createOwnerHistory(file, {}),
			"PEnum_AddressType",
		);
		// `assign_pset`'s own `products_occurrences` branch: `actor` has no existing
		// `DefinesOccurrence` rel yet, so a fresh `IfcRelDefinesByProperties` is created.
		// `IfcRelDefinesByProperties`: GlobalId(0), OwnerHistory(1), Name(2),
		// Description(3), RelatedObjects(4), RelatingPropertyDefinition(5).
		file.createEntity(
			"IfcRelDefinesByProperties",
			guid.new(),
			createOwnerHistory(file, {}),
			null,
			null,
			[actor],
			propertySet,
		);

		// Python: `ifcopenshell.api.pset.edit_pset(file, pset, properties={"Purpose":
		// "OTHER", "UserDefinedPurpose": "WEBPAGE", "WWWHomePageURL": "https://
		// ifcopenshell.org"})`. `getByName` is called (not assumed null) to faithfully
		// reproduce `edit_pset`'s own template lookup -- see header comment for why it's
		// confirmed to always resolve to `null` for this exact name.
		const template = pset.getTemplate(file.schemaIdentifier).getByName("PEnum_AddressType");
		if (template) {
			throw new Error(
				"createApplicationOrganisation: unexpected 'PEnum_AddressType' pset template match -- this port's " +
					"inlined edit_pset reproduction assumed no template would ever match this name (see " +
					"addApplication.ts's header comment); update this code before relying on it.",
			);
		}
		const properties: ReadonlyArray<readonly [string, string]> = [
			["Purpose", "OTHER"],
			["UserDefinedPurpose", "WEBPAGE"],
			["WWWHomePageURL", "https://ifcopenshell.org"],
		];
		const createdProperties: EntityInstance[] = [];
		for (const [name, value] of properties) {
			// `IfcPropertySingleValue`: Name(0), Specification(1), NominalValue(2). Real
			// Python: `primary_measure_type = "IfcLabel"` (a plain `str` value, no
			// template -- see header comment), `nominal_value = self.file.create_entity(
			// "IfcLabel", value)`. *** THROWS here -- see header comment. ***
			const nominalValue = file.createEntity("IfcLabel", value);
			createdProperties.push(file.createEntity("IfcPropertySingleValue", name, null, nominalValue));
		}
		propertySet.set("HasProperties", createdProperties);
	} else {
		// Python: `result[4] = [self.file.create_entity("IfcTelecomAddress",
		// Purpose="USERDEFINED", UserDefinedPurpose="WEBPAGE", WWWHomePageURL=
		// "https://ifcopenshell.org")]`.
		// `IfcTelecomAddress`: Purpose(0), Description(1), UserDefinedPurpose(2),
		// TelephoneNumbers(3), FacsimileNumbers(4), PagerNumber(5),
		// ElectronicMailAddresses(6), WWWHomePageURL(7) -- identical order/positions in
		// all 3 schemas (IFC4/IFC4X3 additionally declare a 9th, MessagingIDs, unused
		// here).
		const address = file.createEntity(
			"IfcTelecomAddress",
			"USERDEFINED",
			null,
			"WEBPAGE",
			null,
			null,
			null,
			null,
			"https://ifcopenshell.org",
		);
		// `IfcOrganization.Addresses` is position(4) -- see header comment.
		organisation.setByIndex(4, [address]);
	}

	return organisation;
}

export interface AddApplicationSettings {
	/**
	 * The `IfcOrganization` responsible for creating the application. Defaults to
	 * generating an IfcOpenShell organisation if none is provided.
	 */
	applicationDeveloper?: EntityInstance | null;
	/** The version of the application. Defaults to this port's own version string. */
	version?: string | null;
	/** The name of the application. Python default: `"IfcOpenShell"`. */
	applicationFullName?: string;
	/**
	 * An identification string for the application intended for computers to read.
	 * Python default: `"IfcOpenShell"`.
	 */
	applicationIdentifier?: string;
}

// Python: `ifcopenshell.version` -- this port has no standalone "ifcopenshell.version"
// module yet (the only existing version-string source is `template.ts`'s own
// `PLACEHOLDER_VERSION`/`getPep440Version`, used for a freshly-created file's STEP
// header, not exported as a reusable constant) -- reproduced here via the same
// `getPep440Version` helper and the same `"0.9.0"` placeholder value, matching
// `template.ts`'s own disclosed placeholder (see that file's header comment for why
// it isn't read from `package.json`), rather than inventing a second, possibly-
// diverging version string.
const DEFAULT_VERSION = getPep440Version("0.9.0");

function addApplicationUsecase(file: IfcFile, settings: AddApplicationSettings = {}): EntityInstance {
	const applicationFullName = settings.applicationFullName ?? "IfcOpenShell";
	const applicationIdentifier = settings.applicationIdentifier ?? "IfcOpenShell";
	const version = settings.version || DEFAULT_VERSION;
	const applicationDeveloper = settings.applicationDeveloper || createApplicationOrganisation(file);

	// `IfcApplication`: ApplicationDeveloper(0), Version(1), ApplicationFullName(2),
	// ApplicationIdentifier(3) -- see header comment.
	return file.createEntity("IfcApplication", applicationDeveloper, version, applicationFullName, applicationIdentifier);
}

/**
 * Adds a new application (Python: `ifcopenshell.api.owner.add_application`).
 *
 * IFC data may be associated with an authoring application to identify which
 * application was responsible for editing or authoring the data. An application is
 * defined by the developing organisation, as well as a full name and identifier. This
 * is akin to how web browsers have an identification string.
 *
 * On an IFC4X3 file, calling this with no `applicationDeveloper` currently throws --
 * see this file's header comment for the disclosed, pre-existing primitive-layer gap
 * responsible.
 *
 * @example
 * ```ts
 * const application = api.owner.addApplication(model, {});
 * ```
 */
export const addApplication = wrapUsecase("owner.add_application", addApplicationUsecase);
