// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/edit_layer_usage.py` (src/ifcopenshell-python, 78
// lines) -- chunk 4 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency -- the only import in the real source is bare
// `ifcopenshell`. A trivial, unconditional attribute-setter loop over `attributes`
// (`for name, value in attributes.items(): setattr(usage, name, value)`) -- unlike
// `./editLayer.ts`/`./editConstituent.ts`/`./editProfile.ts` (this same chunk's own
// siblings), `attributes` here is a REQUIRED parameter (no default `None`/`{}`), and
// there is no extra `material`/`profile`-swap step -- `IfcMaterialLayerSetUsage` has no
// such attribute to swap (it points at a whole `ForLayerSet`, not a single material).
// Typically used to change `OffsetFromReferenceLine` (the docstring's own example).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditLayerUsageSettings {
	/** The `IfcMaterialLayerSetUsage` entity you want to edit. */
	usage: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editLayerUsageUsecase(_file: IfcFile, settings: EditLayerUsageSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.usage.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcMaterialLayerSetUsage` (Python:
 * `ifcopenshell.api.material.edit_layer_usage`).
 *
 * This is typically used to change the offset from the reference line to the layers.
 *
 * For more information about the attributes and data types of an
 * `IfcMaterialLayerSetUsage`, consult the IFC documentation.
 *
 * @example
 * ```ts
 * const rel = api.material.assignMaterial(model, { products: [wall], type: "IfcMaterialLayerSetUsage" });
 * api.material.editLayerUsage(model, {
 *   usage: rel.get("RelatingMaterial") as EntityInstance,
 *   attributes: { OffsetFromReferenceLine: 200 },
 * });
 * ```
 */
export const editLayerUsage = wrapUsecase("material.edit_layer_usage", editLayerUsageUsecase);
