// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/layer/add_layer.py` (src/ifcopenshell-python, 40 lines) --
// the first of this project's `api.layer` chunk (6 files, ~373 lines total; see
// `index.ts`'s own header comment for the module's overall scope). Trivially self-
// contained: a single `create_entity` call, no other dependency at all.
//
// `IfcPresentationLayerAssignment`'s attribute order (`Name`, `Description`,
// `AssignedItems`, `Identifier`) is identical and contiguous across all 3 schemas'
// generated `.d.ts` files (`ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`) -- no
// `IfcGeometricRepresentationSubContext`-style DERIVE-attribute-interleaving gotcha
// here (verified directly against all three, not assumed): `IfcPresentationLayerAssignment`
// declares no supertype and no DERIVE attributes at all, so positional index 0 really is
// `Name`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddLayerSettings {
	/** The name of the layer. Python default: `"Unnamed"`. */
	name?: string;
}

function addLayerUsecase(file: IfcFile, settings: AddLayerSettings = {}): EntityInstance {
	const name = settings.name ?? "Unnamed";
	return file.createEntity("IfcPresentationLayerAssignment", name);
}

/**
 * Adds a new layer (Python: `ifcopenshell.api.layer.add_layer`).
 *
 * An IFC layer is like a CAD layer. Portions of an object's geometry (typically
 * portions of its 2D linework) can be assigned to layers, which can provide stylistic
 * information such as line weights, colours, or simply be used for filtering.
 *
 * Layers have historically been used to organise CAD data and included in ISO
 * standards such as ISO 13567 or by the AIA. This allows IFC data to be compatible
 * with older, 2D-oriented, layer-based workflows.
 *
 * Some software that are still based on layers, such as Tekla or ArchiCAD may also use
 * this layer information for filtering.
 *
 * @example
 * ```ts
 * api.layer.addLayer(model, { name: "AI-WALL-FULL-DIMS-N" });
 * ```
 */
export const addLayer = wrapUsecase("layer.add_layer", addLayerUsecase);
