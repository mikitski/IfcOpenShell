// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/remove_list_item.py` (src/ifcopenshell-python, 56
// lines) -- chunk 3 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency of any kind -- the only import in the real source
// is bare `ifcopenshell`. No entity is created OR removed here at all -- this simply
// drops one element from an existing `IfcMaterialList.Materials` list by index (the
// reverse of `./addListItem.ts`'s append), matching that sibling's own IFC2X3-legacy
// scope (`IfcMaterialList.Materials` is schema-uniform, so nothing here is actually
// schema-gated despite existing to serve IFC2X3 callers specifically).
//
// --- Real Python's `materials.pop(material_index)` -- `list.pop`'s exact semantics,
// ported explicitly (JS `Array`/`splice` indexing differs) ---
//
// Python's `list.pop(index)`: a negative `index` counts from the end (`-1` is the
// last element); ANY `index` (positive or negative) outside `[-len, len)` raises
// `IndexError: pop index out of range`. Plain JS array indexing/`Array.prototype
// .splice` would instead silently no-op (an out-of-range `splice` start clamps to the
// array's bounds and removes nothing) rather than throwing -- ported with an explicit
// bounds check + `throw new RangeError("pop index out of range")` at the equivalent
// point, matching this project's own established convention for this exact situation
// (`../pset/editPset.ts`'s own disclosed `IndexError` -> `RangeError` translation, see
// that file's header comment) rather than silently leaving `Materials` unchanged for
// a caller-supplied out-of-range `materialIndex`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface RemoveListItemSettings {
	/** The `IfcMaterialList` entity you want to remove an item from. */
	materialList: EntityInstance;
	/** The index of the material you want to remove from the list. Starts counting at 0. Defaults to `0`. */
	materialIndex?: number;
}

function removeListItemUsecase(_file: IfcFile, settings: RemoveListItemSettings): void {
	const { materialList } = settings;
	const materialIndex = settings.materialIndex ?? 0;
	const materials = ((materialList.get("Materials") as EntityInstance[] | null) ?? []).slice();

	const resolvedIndex = materialIndex < 0 ? materials.length + materialIndex : materialIndex;
	if (resolvedIndex < 0 || resolvedIndex >= materials.length) {
		throw new RangeError("pop index out of range");
	}
	materials.splice(resolvedIndex, 1);

	materialList.set("Materials", materials);
}

/**
 * Removes an item in a material list (Python:
 * `ifcopenshell.api.material.remove_list_item`).
 *
 * Note that it is invalid to have zero items in a list, so you should leave at least
 * one item to ensure a valid IFC dataset.
 *
 * @example
 * ```ts
 * const materialSet = api.material.addMaterialSet(model, { name: "Window", setType: "IfcMaterialList" });
 * const aluminium = api.material.addMaterial(model, { name: "AL01", category: "aluminium" });
 * const glass = api.material.addMaterial(model, { name: "GLZ01", category: "glass" });
 * api.material.addListItem(model, { materialList: materialSet, material: aluminium });
 * api.material.addListItem(model, { materialList: materialSet, material: glass });
 * api.material.removeListItem(model, { materialList: materialSet, materialIndex: 1 });
 * ```
 */
export const removeListItem = wrapUsecase("material.remove_list_item", removeListItemUsecase);
