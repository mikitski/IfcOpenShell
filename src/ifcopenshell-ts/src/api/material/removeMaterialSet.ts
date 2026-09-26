// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/remove_material_set.py` (src/ifcopenshell-python,
// 94 lines) -- chunk 3 of `api.material` (see `./index.ts`'s own header comment for the
// full chunk scope). ONE real sibling `api.material` dependency: `unassign_material`
// (already landed, chunk 1) -- called to strip every product's/type's association (and
// LayerSet/ProfileSet "Usage" wrapper) with this exact set before the set itself is
// removed, per real Python's own comment ("usage is invalid if it is not associated
// with some element, so we can remove usages through unassignment").
//
// Removes an entire material SET (`IfcMaterialLayerSet`/`IfcMaterialProfileSet`/
// `IfcMaterialConstituentSet`/`IfcMaterialList`) -- every set-item it owns (layers,
// profiles, constituents) is removed too, but the underlying `IfcMaterial`s/
// `IfcProfileDef`s those items reference are deliberately left alone (real Python's
// own docstring: "the materials and profile curves ... will not be removed").
//
// --- Real dispatch quirks, ported verbatim ---
//
// `has_usages` is `True` only for `IfcMaterialLayerSet`/`IfcMaterialProfileSet` --
// `IfcMaterialConstituentSet`/`IfcMaterialList` have no "Usage" wrapper entity at all
// in the schema, so unassignment is skipped for those (real Python never calls
// `unassign_material` for them either).
//
// The set-items `if`/`elif` chain has a real, unguarded `else: raise ValueError(...)`
// tail for anything that isn't one of the 4 known set classes -- ported as the same
// explicit `throw`, not silently ignored, matching real Python's own fail-fast
// behavior for a caller-supplied `material` that isn't actually a material-SET entity.
//
// Unlike `./removeMaterial.ts`'s own `IfcMaterialProperties` branch, this file's
// version has NO IFC2X3-vs-IFC4+ split: real Python reads `inverse.Properties`
// unconditionally here. This is not an oversight -- an `IfcMaterialProperties.Material`
// forward attribute is typed `IfcMaterial` on IFC2X3 (confirmed against `ifc2x3.d.ts`),
// and none of the 4 material-SET classes this function accepts IS an `IfcMaterial`, so
// an `IfcMaterialProperties` inverse of a material SET is structurally unreachable on
// IFC2X3 in the first place -- the branch below is IFC4+-only in practice, exactly as
// real Python's own unconditional read implies.
//
// --- Positional/by-name attribute access, verified against generated `.d.ts`s ---
//
// `MaterialLayers`/`MaterialProfiles`/`MaterialConstituents` (all list-valued, present
// identically in shape across schemas where each set class exists at all --
// `IfcMaterialProfileSet`/`IfcMaterialConstituentSet` don't exist on IFC2X3, matching
// real Python's own lack of a schema guard: calling this with either on an IFC2X3 file
// throws the same native "unknown declaration" error real Python would when even
// constructing such a set) and `IfcRelAssociatesMaterial.OwnerHistory`/
// `IfcMaterialProperties.Properties` are all read/written by name, matching this
// project's established convention for non-hot-path attribute access.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getElementsByMaterial, removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { unassignMaterial } from "./unassignMaterial";

export interface RemoveMaterialSetSettings {
	/** The `IfcMaterialLayerSet`, `IfcMaterialConstituentSet`, `IfcMaterialProfileSet`, or `IfcMaterialList` entity you want to remove. */
	material: EntityInstance;
}

function removeMaterialSetUsecase(file: IfcFile, settings: RemoveMaterialSetSettings): void {
	const { material } = settings;

	// Remove all usages for sets.
	const hasUsages = material.isA("IfcMaterialLayerSet") || material.isA("IfcMaterialProfileSet");
	if (hasUsages) {
		// Usage is invalid if it is not associated with some element, so we can remove
		// usages through unassignment.
		const elements = getElementsByMaterial(file, material);
		if (elements.size > 0) {
			unassignMaterial(file, { products: [...elements] });
		}
	}

	let setItems: EntityInstance[];
	if (material.isA("IfcMaterialLayerSet")) {
		setItems = (material.get("MaterialLayers") as EntityInstance[] | null) ?? [];
	} else if (material.isA("IfcMaterialProfileSet")) {
		setItems = (material.get("MaterialProfiles") as EntityInstance[] | null) ?? [];
	} else if (material.isA("IfcMaterialConstituentSet")) {
		setItems = (material.get("MaterialConstituents") as EntityInstance[] | null) ?? [];
	} else if (material.isA("IfcMaterialList")) {
		setItems = [];
	} else {
		throw new Error(`Unknown material set type: ${material.isA()}`);
	}
	for (const setItem of setItems) {
		file.remove(setItem);
	}

	const inverseElements = file.getInverse(material) as Set<EntityInstance>;
	file.remove(material);

	for (const inverse of inverseElements) {
		if (inverse.isA("IfcRelAssociatesMaterial")) {
			// NOTE: for has_usages already handled by unassign_material.
			const history = inverse.get("OwnerHistory") as EntityInstance | null;
			file.remove(inverse);
			if (history) removeDeep2(file, history);
		} else if (inverse.isA("IfcMaterialProperties")) {
			for (const prop of (inverse.get("Properties") as EntityInstance[] | null) ?? []) {
				file.remove(prop);
			}
			file.remove(inverse);
		}
	}
}

/**
 * Removes a material set (Python: `ifcopenshell.api.material.remove_material_set`).
 *
 * All set items, such as layers, profiles, or constituents will also be removed. All
 * set usages are also removed.
 *
 * However, the materials and profile curves used by the layers, profiles and
 * constituents will not be removed.
 *
 * @example
 * ```ts
 * const materialSet = api.material.addMaterialSet(model, { name: "GYP-ST-GYP", setType: "IfcMaterialLayerSet" });
 * const gypsum = api.material.addMaterial(model, { name: "PB01", category: "gypsum" });
 * const steel = api.material.addMaterial(model, { name: "ST01", category: "steel" });
 * api.material.addLayer(model, { layerSet: materialSet, material: gypsum });
 * api.material.addLayer(model, { layerSet: materialSet, material: steel });
 * api.material.addLayer(model, { layerSet: materialSet, material: gypsum });
 * api.material.removeMaterialSet(model, { material: materialSet });
 * ```
 */
export const removeMaterialSet = wrapUsecase("material.remove_material_set", removeMaterialSetUsecase);
