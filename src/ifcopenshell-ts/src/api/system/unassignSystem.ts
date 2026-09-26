// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/unassign_system.py` (src/ifcopenshell-python, 51
// lines) -- part of this project's `api.system` chunk (see `./index.ts`'s own header
// comment). A one-line delegation to the already-landed `group.unassign_group`
// (`IfcSystem` is an `IfcGroup` subtype, and a distribution system's own membership is
// just a plain `IfcRelAssignsToGroup`, no `IfcSystem`-specific relationship at all).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { unassignGroup } from "../group/unassignGroup";
import { wrapUsecase } from "../hooks";

export interface UnassignSystemSettings {
	/** The list of `IfcDistributionElement`s to unassign from the system. */
	products: readonly EntityInstance[];
	/** The `IfcSystem` you want to unassign the element from. */
	system: EntityInstance;
}

function unassignSystemUsecase(file: IfcFile, settings: UnassignSystemSettings): void {
	unassignGroup(file, { products: settings.products, group: settings.system });
}

/**
 * Unassigns list of products from a system (Python:
 * `ifcopenshell.api.system.unassign_system`).
 *
 * @example
 * ```ts
 * // A completely empty distribution system
 * const system = api.system.addSystem(model, {});
 *
 * // Create a duct
 * const duct = api.root.createEntity(model, { ifcClass: "IfcDuctSegment", predefinedType: "RIGIDSEGMENT" });
 *
 * // This duct is part of the system
 * api.system.assignSystem(model, { products: [duct], system });
 *
 * // Not anymore!
 * api.system.unassignSystem(model, { products: [duct], system });
 * ```
 */
export const unassignSystem = wrapUsecase("system.unassign_system", unassignSystemUsecase);
