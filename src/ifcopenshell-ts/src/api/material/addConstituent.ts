// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/add_constituent.py` (src/ifcopenshell-python, 92
// lines) -- chunk 2 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency of any kind -- the only import in the real source
// is bare `ifcopenshell`.
//
// Adds a new `IfcMaterialConstituent` to an `IfcMaterialConstituentSet` -- describes
// how a portion of an object (e.g. a window's aluminium frame vs. its glass panel) is
// made out of a material, distinct from other constituents of the same object.
// `IfcMaterialConstituent`/`IfcMaterialConstituentSet` don't exist on IFC2X3 at all
// (this whole function is implicitly IFC4+-only, matching real Python's own lack of a
// schema guard -- a native "unknown declaration" error on IFC2X3, not a friendlier
// message).
//
// --- Real, disclosed quirk, ported verbatim ---
//
// `file.create_entity("IfcMaterialConstituent", Material=material, Name=name)` passes
// `Name=name` unconditionally (`name` defaults to `None`) -- an explicit `None`/`null`
// `Name`, not "leave unset". Ported as `name ?? null` in the constructor call itself
// (not a conditional `.set()` afterward, unlike `./addProfile.ts`'s own asymmetric
// `Material`/`Profile` handling) -- `Material` is likewise set at creation time here
// (a required, non-optional parameter, unlike `addProfile`'s optional `material`).
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcMaterialConstituent` (IFC4/IFC4X3 only): `[Name, Description, Material,
// Fraction, Category]` on both schemas -- `Name` is index 0, `Material` is index 2, so
// `file.createEntity("IfcMaterialConstituent", name ?? null, null, material)`
// (`Description`, index 1, left unset) matches real Python's own 2-kwarg call
// (`Fraction`/`Category`, both trailing, are likewise left unset on both sides).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddConstituentSettings {
	/** The `IfcMaterialConstituentSet` that the constituent is part of. */
	constituentSet: EntityInstance;
	/** The `IfcMaterial` that the constituent is made out of. */
	material: EntityInstance;
	/** An optional name of the constituent. */
	name?: string | null;
}

function addConstituentUsecase(file: IfcFile, settings: AddConstituentSettings): EntityInstance {
	const { constituentSet, material } = settings;
	const constituents = ((constituentSet.get("MaterialConstituents") as EntityInstance[] | null) ?? []).slice();

	const constituent = file.createEntity("IfcMaterialConstituent", settings.name ?? null, null, material);

	constituents.push(constituent);
	constituentSet.set("MaterialConstituents", constituents);
	return constituent;
}

/**
 * Adds a new constituent to a constituent set (Python:
 * `ifcopenshell.api.material.add_constituent`).
 *
 * A constituent describes how a portion of an object is made out of a material
 * whereas other portions of the object are made out of other materials. For example,
 * a window might be made out of an aluminium frame and a glass panel -- the aluminium
 * used for the frame is one constituent, and the glass would be another. Another
 * example might be concrete, where one constituent might be cement, and another
 * constituent might be binder. In the case of the window, the constituent is
 * represented explicitly by the geometry of the window frame and the geometry of the
 * window panel; in the case of a concrete slab, the constituents might instead be
 * represented in terms of percentages.
 *
 * Not available in IFC2X3.
 *
 * @returns The newly created `IfcMaterialConstituent`.
 *
 * @example
 * ```ts
 * const windowType = api.root.createEntity(model, { ifcClass: "IfcWindowType" });
 * const materialSet = api.material.addMaterialSet(model, { name: "Window", setType: "IfcMaterialConstituentSet" });
 * const aluminium = api.material.addMaterial(model, { name: "AL01", category: "aluminium" });
 * const glass = api.material.addMaterial(model, { name: "GLZ01", category: "glass" });
 * api.material.addConstituent(model, { constituentSet: materialSet, material: aluminium, name: "Framing" });
 * api.material.addConstituent(model, { constituentSet: materialSet, material: glass, name: "Glazing" });
 * api.material.assignMaterial(model, { products: [windowType], material: materialSet });
 * ```
 */
export const addConstituent = wrapUsecase("material.add_constituent", addConstituentUsecase);
