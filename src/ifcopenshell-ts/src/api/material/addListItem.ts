// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/add_list_item.py` (src/ifcopenshell-python, 82
// lines) -- chunk 2 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency of any kind -- the only import in the real source
// is bare `ifcopenshell`. No entity is created here at all -- this simply appends an
// already-existing `IfcMaterial` to an `IfcMaterialList.Materials` list.
//
// In IFC2X3, a composite material (e.g. a window with an aluminium frame and a glass
// panel) is represented as a flat `IfcMaterialList` of its member materials. In IFC4+
// this is deprecated in favour of constituent sets (`./addConstituent.ts`), which
// additionally let each constituent carry its own name/fraction/category -- real
// Python's own docstring: "if you're stuck on IFC2X3, you have my condolences as well
// as this function." Nothing in this function's own body is actually schema-gated
// (`IfcMaterialList.Materials` exists identically on every schema, per the schema
// note below), but it exists to serve IFC2X3 callers specifically.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddListItemSettings {
	/** The `IfcMaterialList` the material should be added to. */
	materialList: EntityInstance;
	/** The `IfcMaterial` to add to the list. */
	material: EntityInstance;
}

function addListItemUsecase(_file: IfcFile, settings: AddListItemSettings): void {
	const { materialList, material } = settings;
	const materials = ((materialList.get("Materials") as EntityInstance[] | null) ?? []).slice();
	materials.push(material);
	materialList.set("Materials", materials);
}

/**
 * Adds a new material in a list of materials (Python:
 * `ifcopenshell.api.material.add_list_item`).
 *
 * In IFC2X3, if you wanted an object to have multiple materials (i.e. a composite
 * material) you would assign the object to a material list, which would contain a
 * list of materials. For example, a window might have a list of 2 materials, one
 * being aluminium for the frame, and another being glass for the panel.
 *
 * In IFC4 and above, this is deprecated and should not be used -- use
 * `./addConstituent.ts`'s constituent sets instead, which achieve the same thing but
 * are more powerful as they allow you to define the properties of the constituents
 * too.
 *
 * @example
 * ```ts
 * const windowType = api.root.createEntity(model, { ifcClass: "IfcWindowType" });
 * const materialSet = api.material.addMaterialSet(model, { name: "Window", setType: "IfcMaterialList" });
 * const aluminium = api.material.addMaterial(model, { name: "AL01", category: "aluminium" });
 * const glass = api.material.addMaterial(model, { name: "GLZ01", category: "glass" });
 * api.material.addListItem(model, { materialList: materialSet, material: aluminium });
 * api.material.addListItem(model, { materialList: materialSet, material: glass });
 * api.material.assignMaterial(model, { products: [windowType], material: materialSet });
 * ```
 */
export const addListItem = wrapUsecase("material.add_list_item", addListItemUsecase);
