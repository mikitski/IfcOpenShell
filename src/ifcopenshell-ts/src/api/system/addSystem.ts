// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/add_system.py` (src/ifcopenshell-python, 58 lines)
// -- part of this project's `api.system` chunk (see `./index.ts`'s own header comment
// for the module's overall scope). Trivially self-contained: a single `create_entity`
// call plus the already-landed `owner.create_owner_history` dependency, structurally
// close to `../group/addGroup.ts`.
//
// --- The IFC2X3 workaround, ported verbatim ---
//
// Real Python's own comment: "workaround for failing default argument in ifc2x3" --
// `IfcDistributionSystem` (the default `ifcClass`) does not exist on IFC2X3 at all
// (confirmed absent from `ifc2x3.d.ts`), so a caller who doesn't override `ifcClass`
// would otherwise hit a native "unknown declaration" error creating an IFC2X3 file.
// This substitutes the base `IfcSystem` class instead, but ONLY when `ifcClass` is
// left at its literal default `"IfcDistributionSystem"` -- a caller who explicitly
// passes `ifcClass: "IfcDistributionSystem"` on an IFC2X3 file gets the exact same
// substitution (the check can't distinguish "defaulted" from "explicitly re-supplied
// the same string"), matching real Python's own `ifc_class == "IfcDistributionSystem"`
// string comparison exactly -- not a bug, just how the substitution is actually keyed.
//
// `IfcSystem`'s attribute order (`GlobalId`, `OwnerHistory`, `Name`, `Description`,
// `ObjectType`) is identical and contiguous across all 3 schemas' generated `.d.ts`
// files (verified directly, not assumed) -- `GlobalId`/`OwnerHistory`/`Name` are
// created positionally (matching `createEntity.ts`'s established "one `Transaction`
// create op, not N create+edit ops" convention), `Description`/`ObjectType` left
// unset entirely, matching real Python's own kwargs call, which never mentions them.
// This same positional shape and order also holds for `IfcDistributionSystem`/
// `IfcBuildingSystem` (both add a `LongName`/`PredefinedType` tail after the same
// `GlobalId`/`OwnerHistory`/`Name`/`Description`/`ObjectType` prefix, confirmed against
// all 3 `.d.ts` files), so the same 3-positional-arg `createEntity` call is valid
// regardless of which of the 3 classes `ifcClass` actually resolves to.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";

export interface AddSystemSettings {
	/**
	 * The type of system, chosen from `IfcDistributionSystem` for mechanical,
	 * electrical, communications, plumbing, fire, or security systems. Alternatively
	 * you may choose `IfcBuildingSystem` for specialised building facade systems or
	 * similar. For IFC2X3, choose `IfcSystem`. Python default: `"IfcDistributionSystem"`.
	 */
	ifcClass?: string;
}

function addSystemUsecase(file: IfcFile, settings: AddSystemSettings = {}): EntityInstance {
	let ifcClass = settings.ifcClass ?? "IfcDistributionSystem";
	// Workaround for failing default argument in IFC2X3 -- see this file's own header
	// comment.
	if (file.schema === "IFC2X3" && ifcClass === "IfcDistributionSystem") {
		ifcClass = "IfcSystem";
	}

	return file.createEntity(
		ifcClass,
		guid.new(),
		createOwnerHistory(file, {}),
		"Unnamed", // Name
	);
}

/**
 * Add a new distribution system (Python: `ifcopenshell.api.system.add_system`).
 *
 * A distribution system is a group of distribution elements, like ducts, pipes,
 * pumps, filters, fans, and so on that distribute a medium (air, liquid, or
 * electricity) throughout a facility. Systems may be hierarchical, with larger
 * systems composed of smaller subsystems.
 *
 * @returns The newly created `IfcSystem`.
 *
 * @example
 * ```ts
 * // A completely empty distribution system
 * const system = api.system.addSystem(model, {});
 * ```
 */
export const addSystem = wrapUsecase("system.add_system", addSystemUsecase);
