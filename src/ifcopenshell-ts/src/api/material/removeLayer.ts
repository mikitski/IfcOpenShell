// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/remove_layer.py` (src/ifcopenshell-python, 60
// lines) -- chunk 3 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency of any kind -- the only import in the real source
// is bare `ifcopenshell.util.element` (for `remove_deep2`).
//
// Removes a single `IfcMaterialLayer` from whatever layer set it belongs to (simply by
// deleting the layer entity itself -- real Python never touches the owning
// `IfcMaterialLayerSet.MaterialLayers` list explicitly, relying on the layer's own
// removal to drop it from that forward-attribute list; this project's `file.remove`
// already reproduces that same "drop from every referencing list" behavior, matching
// `./addLayer.ts`'s inverse operation). `should_remove_material` optionally also
// removes the layer's own `IfcMaterial`, but ONLY via `remove_deep2` -- i.e. only if
// that material has no OTHER remaining users after the layer itself is gone; a shared
// material used by multiple layers/products is left alone even when this flag is set.
//
// Real Python's own docstring warns that removing the LAST layer in a set leaves zero
// items, which is invalid IFC -- this function makes no attempt to detect or prevent
// that, matching real Python exactly.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveLayerSettings {
	/** The `IfcMaterialLayer` entity you want to remove. */
	layer: EntityInstance;
	/** If true, materials with no users will be removed. Defaults to `false`. */
	shouldRemoveMaterial?: boolean;
}

function removeLayerUsecase(file: IfcFile, settings: RemoveLayerSettings): void {
	const { layer, shouldRemoveMaterial = false } = settings;
	const material = layer.get("Material") as EntityInstance | null;
	file.remove(layer);
	if (material && shouldRemoveMaterial) {
		removeDeep2(file, material);
	}
}

/**
 * Removes a layer from a layer set (Python: `ifcopenshell.api.material.remove_layer`).
 *
 * Note that it is invalid to have zero items in a set, so you should leave at least
 * one layer to ensure a valid IFC dataset.
 *
 * @example
 * ```ts
 * const materialSet = api.material.addMaterialSet(model, { name: "Window", setType: "IfcMaterialConstituentSet" });
 * const gypsum = api.material.addMaterial(model, { name: "PB01", category: "gypsum" });
 * const layer3 = api.material.addLayer(model, { layerSet: materialSet, material: gypsum });
 * api.material.removeLayer(model, { layer: layer3 });
 * ```
 */
export const removeLayer = wrapUsecase("material.remove_layer", removeLayerUsecase);
