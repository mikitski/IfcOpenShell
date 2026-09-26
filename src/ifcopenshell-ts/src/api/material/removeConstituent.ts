// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/remove_constituent.py` (src/ifcopenshell-python,
// 58 lines) -- chunk 3 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency of any kind -- the only imports in the real source
// are bare `ifcopenshell`/`ifcopenshell.util.element` (for `remove_deep2`).
//
// Byte-for-byte the same shape as `./removeLayer.ts`'s sibling (`IfcMaterialConstituent`
// in place of `IfcMaterialLayer`) -- confirmed by reading both real sources in full:
// genuine duplicate logic across two different set-item classes, not a copy/paste
// mistake introduced by this port. `IfcMaterialConstituent` doesn't exist on IFC2X3 at
// all (this whole function is implicitly IFC4+-only, matching real Python's own lack
// of a schema guard).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveConstituentSettings {
	/** The `IfcMaterialConstituent` entity you want to remove. */
	constituent: EntityInstance;
	/** If true, materials with no users will be removed. Defaults to `false`. */
	shouldRemoveMaterial?: boolean;
}

function removeConstituentUsecase(file: IfcFile, settings: RemoveConstituentSettings): void {
	const { constituent, shouldRemoveMaterial = false } = settings;
	const material = constituent.get("Material") as EntityInstance | null;
	file.remove(constituent);
	if (material && shouldRemoveMaterial) {
		removeDeep2(file, material);
	}
}

/**
 * Removes a constituent from a constituent set (Python:
 * `ifcopenshell.api.material.remove_constituent`).
 *
 * Note that it is invalid to have zero items in a set, so you should leave at least
 * one constituent to ensure a valid IFC dataset.
 *
 * Not available in IFC2X3.
 *
 * @example
 * ```ts
 * const materialSet = api.material.addMaterialSet(model, { name: "Window", setType: "IfcMaterialConstituentSet" });
 * const glass = api.material.addMaterial(model, { name: "GLZ01", category: "glass" });
 * const glazing = api.material.addConstituent(model, { constituentSet: materialSet, material: glass });
 * api.material.removeConstituent(model, { constituent: glazing });
 * ```
 */
export const removeConstituent = wrapUsecase("material.remove_constituent", removeConstituentUsecase);
