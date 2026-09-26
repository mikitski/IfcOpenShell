// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/add_material_set.py` (src/ifcopenshell-python,
// 117 lines) -- chunk 2 of `api.material` (see `./index.ts`'s own header comment for
// the full chunk scope). No sibling `api.material` dependency of any kind (the real
// source's own docstring example calls `add_layer`/`edit_layer`/`add_material`, but
// those are documentation only, not real code inside `add_material_set` itself --
// confirmed by reading the full 117-line source directly).
//
// Creates an empty material SET -- a layer set (`IfcMaterialLayerSet`, for layered
// construction like walls/slabs), a profile set (`IfcMaterialProfileSet`, for
// profiled construction like beams/columns, IFC4+ only), a constituent set
// (`IfcMaterialConstituentSet`, for arbitrary composite construction, IFC4+ only), or
// a material list (`IfcMaterialList`, the legacy IFC2X3-only equivalent). The set
// starts with zero items -- `./addLayer.ts`/`./addProfile.ts`/`./addConstituent.ts`/
// `./addListItem.ts` (this same chunk's own siblings) populate it afterward.
//
// --- `set_type: MATERIAL_SET_TYPE` -- a fresh, file-local literal type, deliberately
// NOT reusing `util/element.ts`'s already-landed `MaterialType` ---
//
// Real Python declares its own module-level `MATERIAL_SET_TYPE = Literal[
// "IfcMaterialLayerSet", "IfcMaterialProfileSet", "IfcMaterialConstituentSet",
// "IfcMaterialList"]` right here in `add_material_set.py` -- a different, narrower
// literal than `ifcopenshell.util.element.MATERIAL_TYPE` (which additionally includes
// `"IfcMaterial"`/`"IfcMaterialLayerSetUsage"`/`"IfcMaterialProfileSetUsage"`, none of
// which are a "set" this function can create). Ported as its own exported
// `MaterialSetType`, not folded into (or reusing) `util/element.ts`'s `MaterialType`.
//
// --- Real, disclosed dispatch quirk, ported verbatim ---
//
// The `if/elif` chain has no `else` for its final case -- `IfcMaterialProfileSet` and
// `IfcMaterialConstituentSet` both fall through to the same bare `return
// file.create_entity(set_type, Name=name or "Unnamed")` tail (a "catch-all" for
// anything that isn't `IfcMaterialLayerSet`/`IfcMaterialList`), not two explicit
// branches of their own. Ported the same way: a single fallback branch handles both
// (and, for a caller bypassing the type system, any other string), rather than two
// separate `if` branches that would only coincidentally produce the same code.
//
// `name or "Unnamed"` (both the `IfcMaterialLayerSet.LayerSetName` branch and the
// fallback branch) is a Python truthiness check -- an explicit empty string `""` also
// falls back to `"Unnamed"`. Ported as `name || "Unnamed"` (same falsy-string
// semantics in JS/TS), not `name ?? "Unnamed"` (see `./addMaterial.ts`'s own header
// comment for the identical pattern there).
//
// `IfcMaterialList`'s branch takes NO `name` at all (`return
// file.create_entity("IfcMaterialList")`) -- a caller-supplied `name` is silently
// discarded for this one set type, matching real Python exactly (an `IfcMaterialList`
// genuinely has no `Name` attribute to set, see the schema note below).
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcMaterialLayerSet`: `[MaterialLayers, LayerSetName]` on IFC2X3, `[MaterialLayers,
// LayerSetName, Description]` on IFC4/IFC4X3 -- `LayerSetName` is attribute index 1 on
// every schema (`Description` is simply appended at the end on IFC4+), so
// `file.createEntity("IfcMaterialLayerSet", null, name || "Unnamed")` (index 0,
// `MaterialLayers`, left unset -- matching real Python's own bare `LayerSetName=...`
// kwarg, which never touches `MaterialLayers` either) is schema-agnostic and needs no
// branch.
//
// `IfcMaterialList`: `[Materials]` (1 attribute, identical on every schema) --
// `file.createEntity("IfcMaterialList")` with zero positional args, matching real
// Python's own bare `file.create_entity("IfcMaterialList")` and this chunk's own
// `./assignMaterial.ts` precedent for the same class.
//
// `IfcMaterialProfileSet`/`IfcMaterialConstituentSet` (both IFC4+-only -- confirmed
// absent from `ifc2x3.d.ts` entirely, matching the docstring's own "not available in
// IFC2X3" claim; calling this with either `set_type` on an IFC2X3 file throws the same
// native "unknown declaration" error real Python would, with no guard in either
// source): `Name` is attribute index 0 on both (`[Name, Description,
// MaterialProfiles, CompositeProfile]` / `[Name, Description, MaterialConstituents]`),
// so `file.createEntity(setType, name || "Unnamed")` needs no further positional args.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python: `MATERIAL_SET_TYPE = Literal[...]` (module-level constant in `add_material_set.py`). See this file's own header comment for why this is a fresh type, not `util/element.ts`'s `MaterialType`. */
export type MaterialSetType =
	| "IfcMaterialLayerSet"
	| "IfcMaterialProfileSet"
	| "IfcMaterialConstituentSet"
	| "IfcMaterialList";

export interface AddMaterialSetSettings {
	/** The name of the material set, which may be purely descriptive or annotated in drawings. Defaults to `"Unnamed"` (also used for an explicit empty string). Ignored for `set_type: "IfcMaterialList"`, which has no `Name` attribute at all. */
	name?: string | null;
	/** What type of set to create. Defaults to `"IfcMaterialConstituentSet"`. `"IfcMaterialProfileSet"`/`"IfcMaterialConstituentSet"` are not available in IFC2X3. */
	setType?: MaterialSetType;
}

function addMaterialSetUsecase(file: IfcFile, settings: AddMaterialSetSettings): EntityInstance {
	const setType = settings.setType ?? "IfcMaterialConstituentSet";
	const name = settings.name || "Unnamed";

	if (setType === "IfcMaterialLayerSet") {
		return file.createEntity("IfcMaterialLayerSet", null, name);
	}
	if (setType === "IfcMaterialList") {
		return file.createEntity("IfcMaterialList");
	}
	// Real Python: a single fallback tail handles both `IfcMaterialProfileSet` and
	// `IfcMaterialConstituentSet` (see this file's own header comment).
	return file.createEntity(setType, name);
}

/**
 * Adds a new material set (Python: `ifcopenshell.api.material.add_material_set`).
 *
 * IFC allows you to state that objects are made out of multiple materials. These are
 * known generically as material sets, but may also be called layered materials,
 * composite materials, or other names in software.
 *
 * There are three types of material sets:
 * - A layer set, used for layered construction such as walls.
 * - A profile set, used for profiled construction such as beams or columns. Not
 *   available in IFC2X3.
 * - A constituent set, used for arbitrary composite construction. Not available in
 *   IFC2X3.
 *
 * There is also a fourth material set known as a material list, a legacy type of set
 * used by IFC2X3. It should not be used on IFC4 and above.
 *
 * @returns The newly created material set element.
 *
 * @example
 * ```ts
 * const wallType = api.root.createEntity(model, { ifcClass: "IfcWallType", name: "WAL01" });
 * const materialSet = api.material.addMaterialSet(model, { name: "GYP-ST-GYP", setType: "IfcMaterialLayerSet" });
 * api.material.assignMaterial(model, { products: [wallType], material: materialSet });
 * ```
 */
export const addMaterialSet = wrapUsecase("material.add_material_set", addMaterialSetUsecase);
