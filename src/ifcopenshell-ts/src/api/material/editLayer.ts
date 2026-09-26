// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/edit_layer.py` (src/ifcopenshell-python, 67
// lines) -- chunk 4 of `api.material` (see `./index.ts`'s own header comment; this
// chunk completes the module, 26/26 files). No sibling `api.material` dependency --
// the only import in the real source is bare `ifcopenshell`.
//
// A trivial attribute-setter loop over `attributes`, plus one extra conditional step:
// `if material: layer.Material = material` -- matching `./editProfile.ts`'s (this same
// chunk's own sibling) identical two-part shape (`attributes` loop, then an optional
// `material`/`profile_def` swap afterward), NOT `./editMaterial.ts`'s/
// `./editAssignedMaterial.ts`'s (chunk 2) simpler attribute-only shape. No
// `update_owner_history` call -- `IfcMaterialLayer` is not an `IfcRoot` subtype, so it
// has no `OwnerHistory` to touch.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditLayerSettings {
	/** The `IfcMaterialLayer` entity you want to edit. */
	layer: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes?: Record<string, unknown>;
	/** The `IfcMaterial` entity you want the layer to be made from. */
	material?: EntityInstance | null;
}

function editLayerUsecase(_file: IfcFile, settings: EditLayerSettings): void {
	const { layer, material } = settings;
	for (const [name, value] of Object.entries(settings.attributes ?? {})) {
		layer.set(name, value);
	}
	if (material) {
		layer.set("Material", material);
	}
}

/**
 * Edits the attributes of an `IfcMaterialLayer` (Python:
 * `ifcopenshell.api.material.edit_layer`).
 *
 * For more information about the attributes and data types of an `IfcMaterialLayer`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * // Let's create two materials typically used for steel stud partition walls with
 * // gypsum lining.
 * const gypsum = api.material.addMaterial(model, { name: "PB01", category: "gypsum" });
 * const steel = api.material.addMaterial(model, { name: "ST01", category: "steel" });
 *
 * const materialSet = api.material.addMaterialSet(model, { name: "GYP-ST-GYP", setType: "IfcMaterialLayerSet" });
 *
 * let layer = api.material.addLayer(model, { layerSet: materialSet, material: gypsum });
 * api.material.editLayer(model, { layer, attributes: { LayerThickness: 13 } });
 * layer = api.material.addLayer(model, { layerSet: materialSet, material: steel });
 * api.material.editLayer(model, { layer, attributes: { LayerThickness: 92 } });
 * ```
 */
export const editLayer = wrapUsecase("material.edit_layer", editLayerUsecase);
