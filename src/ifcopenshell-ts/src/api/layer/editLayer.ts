// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/layer/edit_layer.py` (src/ifcopenshell-python, 41 lines) --
// a trivial attribute-setter loop, no dependency beyond `EntityInstance.set`. Matches
// `../context/editContext.ts`'s identical shape verbatim (same underlying Python
// pattern: `for name, value in attributes.items(): setattr(layer, name, value)`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditLayerSettings {
	/** The `IfcPresentationLayerAssignment` (or `IfcPresentationLayerWithStyle`) entity you want to edit. */
	layer: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editLayerUsecase(_file: IfcFile, settings: EditLayerSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.layer.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcPresentationLayerAssignment` (Python:
 * `ifcopenshell.api.layer.edit_layer`).
 *
 * For more information about the attributes and data types of an
 * `IfcPresentationLayerAssignment`, consult the IFC documentation.
 *
 * @example
 * ```ts
 * const layer = api.layer.addLayer(model, { name: "AI-WALL" });
 * api.layer.editLayer(model, {
 *   layer,
 *   attributes: { Description: "All walls, based on the AIA standard." },
 * });
 * ```
 */
export const editLayer = wrapUsecase("layer.edit_layer", editLayerUsecase);
