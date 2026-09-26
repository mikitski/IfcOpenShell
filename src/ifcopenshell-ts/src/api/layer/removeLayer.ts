// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/layer/remove_layer.py` (src/ifcopenshell-python, 39 lines)
// -- a single `file.remove(layer)` call, verbatim. Unlike `../context/removeContext.ts`
// or `../aggregate/unassignObject.ts`, this does NOT cascade to `removeDeep2` or touch
// any `OwnerHistory` -- `IfcPresentationLayerAssignment`/`IfcPresentationLayerWithStyle`
// have no `OwnerHistory` attribute of their own (they're not `IfcRoot` subtypes), and
// real Python's own docstring is explicit that assigned representation items are left
// untouched, only the layer's own relationship to them is removed.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface RemoveLayerSettings {
	/** The `IfcPresentationLayerAssignment` entity to remove. */
	layer: EntityInstance;
}

function removeLayerUsecase(file: IfcFile, settings: RemoveLayerSettings): void {
	file.remove(settings.layer);
}

/**
 * Removes a layer (Python: `ifcopenshell.api.layer.remove_layer`).
 *
 * All representation items assigned to the layer will remain, but the relationship to
 * the layer will be removed.
 *
 * @example
 * ```ts
 * const layer = api.layer.addLayer(model, { name: "AI-WALL" });
 * api.layer.removeLayer(model, { layer });
 * ```
 */
export const removeLayer = wrapUsecase("layer.remove_layer", removeLayerUsecase);
