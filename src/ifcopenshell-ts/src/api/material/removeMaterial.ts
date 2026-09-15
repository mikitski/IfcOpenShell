// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/remove_material.py` (src/ifcopenshell-python, 75
// lines) -- chunk 3 of `api.material` (see `./index.ts`'s own header comment for the
// full chunk scope). No sibling `api.material` dependency of any kind -- the only
// import in the real source is bare `ifcopenshell.util.element` (for `remove_deep2`).
//
// Removes an `IfcMaterial` and cascades into every inverse relationship that would
// otherwise dangle: any `IfcMaterialConstituent`/`IfcMaterialLayer`/`IfcMaterialProfile`
// set-item wrapping this exact material, any `IfcRelAssociatesMaterial` association
// (plus its `OwnerHistory`, via `removeDeep2`), any `IfcMaterialProperties` pset (plus
// its own properties), and any `IfcMaterialDefinitionRepresentation` (a material's
// style, plus every representation/item it owns).
//
// --- Real, disclosed quirk, ported verbatim (real Python's own `TODO` comment) ---
//
// "Right now, we choose only to delete set items (e.g. a layer) but not the material
// set itself -- this can lead to invalid material sets, but we assume the user will
// deal with it." I.e. removing the LAST material used by a layer set leaves behind a
// layer set with zero layers (invalid IFC), and this function makes no attempt to
// detect or fix that -- matches real Python exactly, not "improved" here.
//
// --- Real IFC2X3-vs-IFC4+ schema branch for `IfcMaterialProperties`, ported verbatim
// (not merged into one call) ---
//
// On IFC4+, `IfcMaterialProperties` itself declares a `Properties: IfcProperty[]`
// attribute directly (confirmed against `ifc4.d.ts`/`ifc4x3.d.ts`). On IFC2X3,
// `IfcMaterialProperties` declares NO such attribute at all (confirmed against
// `ifc2x3.d.ts`: `{ Material: IfcMaterial }` only) -- only its own subtype
// `IfcExtendedMaterialProperties` declares `ExtendedProperties: IfcProperty[]`. Real
// Python's own comment: "only IfcExtendedMaterialProperties have properties in
// IFC2X3" -- reached via `getattr(inverse, "ExtendedProperties", None)`, a soft
// attribute read that tolerates `inverse` being a bare (non-extended)
// `IfcMaterialProperties` with no such attribute at all (returning `None` instead of
// raising). Ported as the same explicit `if file.schema !== "IFC2X3"` two-branch
// shape, with the IFC2X3 branch using this file's own local `attrOrNull` helper (the
// same `getattr(instance, name, None)` technique already established by
// `../context/removeContext.ts`/`../root/removeProduct.ts`, duplicated per-module by
// this project's own convention rather than shared).
//
// --- Positional/by-name attribute access, verified against generated `.d.ts`s ---
//
// `IfcRelAssociatesMaterial.OwnerHistory`, `IfcMaterialProperties.Properties`/
// `IfcExtendedMaterialProperties.ExtendedProperties`, and
// `IfcMaterialDefinitionRepresentation.Representations`/`IfcRepresentation.Items` are
// all read by name (`.get(...)`), matching this project's established convention for
// non-hot-path attribute access (no positional `createEntity` calls in this file at
// all -- it only ever reads/removes existing entities, never constructs new ones).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";

/** Python's `getattr(instance, name, None)` -- soft attribute access for a class that may not declare `name` at all. See this file's own header comment for why this is duplicated per-module rather than shared. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

export interface RemoveMaterialSettings {
	/** The `IfcMaterial` entity you want to remove. */
	material: EntityInstance;
}

function removeMaterialUsecase(file: IfcFile, settings: RemoveMaterialSettings): void {
	const { material } = settings;
	const inverseElements = file.getInverse(material) as Set<EntityInstance>;
	file.remove(material);
	// TODO (real Python's own TODO, ported verbatim): right now, we choose only to
	// delete set items (e.g. a layer) but not the material set. This can lead to
	// invalid material sets, but we assume the user will deal with it.
	for (const inverse of inverseElements) {
		if (inverse.isA("IfcMaterialConstituent")) {
			file.remove(inverse);
		} else if (inverse.isA("IfcMaterialLayer")) {
			file.remove(inverse);
		} else if (inverse.isA("IfcMaterialProfile")) {
			file.remove(inverse);
		} else if (inverse.isA("IfcRelAssociatesMaterial")) {
			const history = inverse.get("OwnerHistory") as EntityInstance | null;
			file.remove(inverse);
			if (history) removeDeep2(file, history);
		} else if (inverse.isA("IfcMaterialProperties")) {
			let props: EntityInstance[] | null;
			if (file.schema !== "IFC2X3") {
				props = inverse.get("Properties") as EntityInstance[] | null;
			} else {
				// only IfcExtendedMaterialProperties have properties in IFC2X3
				props = attrOrNull(inverse, "ExtendedProperties") as EntityInstance[] | null;
			}
			for (const prop of props ?? []) {
				file.remove(prop);
			}
			file.remove(inverse);
		} else if (inverse.isA("IfcMaterialDefinitionRepresentation")) {
			for (const representation of inverse.get("Representations") as EntityInstance[]) {
				for (const item of representation.get("Items") as EntityInstance[]) {
					file.remove(item);
				}
				file.remove(representation);
			}
			file.remove(inverse);
		}
	}
}

/**
 * Removes a material (Python: `ifcopenshell.api.material.remove_material`).
 *
 * If the material is used in a material set, the corresponding layer, profile, or
 * constituent is also removed. Note that this may result in a material set with zero
 * items in it, which is invalid, so the user must take care of this situation
 * themselves.
 *
 * @example
 * ```ts
 * const aluminium = api.material.addMaterial(model, { name: "AL01", category: "aluminium" });
 * api.material.removeMaterial(model, { material: aluminium });
 * ```
 */
export const removeMaterial = wrapUsecase("material.remove_material", removeMaterialUsecase);
