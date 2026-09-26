// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/edit_constituent.py` (src/ifcopenshell-python, 68
// lines) -- chunk 4 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency -- the only import in the real source is bare
// `ifcopenshell`. `IfcMaterialConstituent` doesn't exist on IFC2X3 at all (implicitly
// IFC4+-only, matching real Python's own lack of a schema guard).
//
// --- Real, disclosed asymmetry vs. `./editLayer.ts`/`./editProfile.ts`, ported verbatim ---
//
// Unlike `editLayer`'s/`editProfile`'s own `if material: ...Material = material`
// (skipped when falsy), real Python here does `constituent.Material = material`
// UNCONDITIONALLY -- even when the caller passed no `material` at all (`material`
// defaults to `None`), which would overwrite a real, required, non-optional
// `IfcMaterialConstituent.Material` attribute with `None`. This is a genuine, real
// Python quirk (not a guarded-optional like its two siblings), reproduced exactly:
// `constituent.set("Material", material ?? null)` runs every single call, not gated
// behind an `if (material)` check.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditConstituentSettings {
	/** The `IfcMaterialConstituent` entity you want to edit. */
	constituent: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes?: Record<string, unknown>;
	/**
	 * The `IfcMaterial` entity you want to change the constituent to. See this file's
	 * own header comment -- `Material` is set unconditionally, even when omitted here.
	 */
	material?: EntityInstance | null;
}

function editConstituentUsecase(_file: IfcFile, settings: EditConstituentSettings): void {
	const { constituent, material } = settings;
	for (const [name, value] of Object.entries(settings.attributes ?? {})) {
		constituent.set(name, value);
	}
	constituent.set("Material", material ?? null);
}

/**
 * Edits the attributes of an `IfcMaterialConstituent` (Python:
 * `ifcopenshell.api.material.edit_constituent`).
 *
 * For more information about the attributes and data types of an
 * `IfcMaterialConstituent`, consult the IFC documentation.
 *
 * Not available in IFC2X3.
 *
 * See this file's own header comment for a real, disclosed Python quirk: `material` is
 * set UNCONDITIONALLY (even `null`/omitted), unlike `./editLayer.ts`'s/
 * `./editProfile.ts`'s own guarded `Material` handling.
 *
 * @example
 * ```ts
 * const aluminium1 = api.material.addMaterial(model, { name: "AL01", category: "aluminium" });
 * const aluminium2 = api.material.addMaterial(model, { name: "AL02", category: "aluminium" });
 * const glass = api.material.addMaterial(model, { name: "GLZ01", category: "glass" });
 *
 * const materialSet = api.material.addMaterialSet(model, { name: "Window", setType: "IfcMaterialConstituentSet" });
 * const framing = api.material.addConstituent(model, { constituentSet: materialSet, material: aluminium1 });
 * const glazing = api.material.addConstituent(model, { constituentSet: materialSet, material: glass });
 *
 * api.material.editConstituent(model, { constituent: framing, attributes: { Name: "Framing" }, material: aluminium2 });
 * ```
 */
export const editConstituent = wrapUsecase("material.edit_constituent", editConstituentUsecase);
