// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/assign_system.py` (src/ifcopenshell-python, 58
// lines) -- part of this project's `api.system` chunk (see `./index.ts`'s own header
// comment). Validates every product against `util.system.isAssignable` (already
// landed, `../../util/system.ts`) before delegating to the already-landed
// `group.assign_group` -- `IfcSystem` is an `IfcGroup` subtype, so assignment itself
// is just a plain `IfcRelAssignsToGroup`.
//
// Real Python raises a bare `TypeError` (not `ifcopenshell`'s own exception type) the
// moment it finds the FIRST unassignable product -- ported as a plain `Error` (this
// project's established convention for a Python `raise TypeError(...)`, e.g.
// `../type/assignType.ts`'s own guards), thrown BEFORE calling `group.assign_group` at
// all (real Python's own loop runs to completion over every `product`, checking each
// one, before ever calling `assign_group` -- so a batch with even one bad product
// assigns NOTHING, not a partial assignment of the good ones).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as systemUtil from "../../util/system";
import { assignGroup } from "../group/assignGroup";
import { wrapUsecase } from "../hooks";

export interface AssignSystemSettings {
	/** The list of `IfcDistributionElement`s to assign to the system. */
	products: readonly EntityInstance[];
	/** The `IfcSystem` you want to assign the element to. */
	system: EntityInstance;
}

function assignSystemUsecase(file: IfcFile, settings: AssignSystemSettings): EntityInstance | undefined {
	const { system } = settings;
	for (const product of settings.products) {
		if (!systemUtil.isAssignable(product, system)) {
			throw new Error(`You cannot assign an ${product.isA()} to an ${system.isA()}`);
		}
	}

	return assignGroup(file, { products: settings.products, group: system });
}

/**
 * Assigns distribution elements to a system (Python:
 * `ifcopenshell.api.system.assign_system`).
 *
 * Note that it is not necessary to assign distribution ports to a system.
 *
 * @returns The `IfcRelAssignsToGroup` relationship, or `undefined` if `products` was
 * an empty list.
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
 * ```
 */
export const assignSystem = wrapUsecase("system.assign_system", assignSystemUsecase);
