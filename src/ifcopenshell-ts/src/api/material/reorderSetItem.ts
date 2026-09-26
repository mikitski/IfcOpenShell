// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/reorder_set_item.py` (src/ifcopenshell-python, 70
// lines) -- chunk 4 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency -- the only import in the real source is bare
// `ifcopenshell`.
//
// Reorders one item within whichever list-valued attribute the given `IfcMaterialSet`
// subtype actually owns -- `MaterialConstituents` (`IfcMaterialConstituentSet`),
// `MaterialLayers` (`IfcMaterialLayerSet`), `MaterialProfiles`
// (`IfcMaterialProfileSet`), or `Materials` (`IfcMaterialList`) -- dispatched by an
// `if`/`elif`/`elif`/`elif`/`else: raise ValueError(...)` chain, ported as the same
// explicit `if`/`else if`/`throw` (not silently ignored for an unrecognised class).
//
// `items.insert(new_index, items.pop(old_index))` -- Python `list.pop(i)`/`list.insert
// (i, v)` semantics, ported via a small local `moveItem` helper using `Array.splice`
// (`splice(oldIndex, 1)[0]` then `splice(newIndex, 0, item)`) to reproduce the exact
// same "remove then insert at the (already-shifted) target index" behavior -- e.g.
// moving index 0 to index 1 in a 3-item list lands the item at the very end (index 1
// of the now-2-item remainder, which is the last slot), matching Python's own
// `list.insert`/`list.pop` combination exactly (not a naive swap).
//
// `list(getattr(material_set, set_name) or [])` -- Python's `or` is a truthiness check
// (an empty list is also falsy), so `None or []` and `[] or []` both yield `[]` -- no
// observable difference from a straightforward `?? []` here (same reasoning already
// established by `./addLayer.ts`'s own identical pattern).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python's `items.insert(new_index, items.pop(old_index))` -- see this file's header comment. */
function moveItem<T>(items: T[], oldIndex: number, newIndex: number): T[] {
	const moved = items.splice(oldIndex, 1)[0];
	items.splice(newIndex, 0, moved);
	return items;
}

export interface ReorderSetItemSettings {
	/** The `IfcMaterialSet` (constituent set, layer set, profile set, or material list) you want to reorder an item in. */
	materialSet: EntityInstance;
	/** The index of the item you want to move. Starts counting from 0. Defaults to `0`. */
	oldIndex?: number;
	/** The index of the new position the item will move to. Starts counting from 0. Defaults to `0`. */
	newIndex?: number;
}

function reorderSetItemUsecase(_file: IfcFile, settings: ReorderSetItemSettings): void {
	const { materialSet } = settings;
	const oldIndex = settings.oldIndex ?? 0;
	const newIndex = settings.newIndex ?? 0;

	let setName: string;
	if (materialSet.isA("IfcMaterialConstituentSet")) {
		setName = "MaterialConstituents";
	} else if (materialSet.isA("IfcMaterialLayerSet")) {
		setName = "MaterialLayers";
	} else if (materialSet.isA("IfcMaterialProfileSet")) {
		setName = "MaterialProfiles";
	} else if (materialSet.isA("IfcMaterialList")) {
		setName = "Materials";
	} else {
		throw new Error(`Unexpected material set type: '${materialSet.isA()}'.`);
	}

	const items = ((materialSet.get(setName) as EntityInstance[] | null) ?? []).slice();
	materialSet.set(setName, moveItem(items, oldIndex, newIndex));
}

/**
 * Reorders an item in a material set (Python:
 * `ifcopenshell.api.material.reorder_set_item`).
 *
 * In some material sets, the order have meaning, like in a layer set. In other cases,
 * it is purely for human convenience.
 *
 * @example
 * ```ts
 * const materialSet = api.material.addMaterialSet(model, { name: "Window", setType: "IfcMaterialList" });
 * const aluminium = api.material.addMaterial(model, { name: "AL01", category: "aluminium" });
 * const glass = api.material.addMaterial(model, { name: "GLZ01", category: "glass" });
 * api.material.addListItem(model, { materialList: materialSet, material: aluminium });
 * api.material.addListItem(model, { materialList: materialSet, material: glass });
 * api.material.reorderSetItem(model, { materialSet, oldIndex: 0, newIndex: 1 });
 * ```
 */
export const reorderSetItem = wrapUsecase("material.reorder_set_item", reorderSetItemUsecase);
