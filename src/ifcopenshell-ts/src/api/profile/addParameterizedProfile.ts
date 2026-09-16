// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/profile/add_parameterized_profile.py`
// (src/ifcopenshell-python, 50 lines) -- part of this project's brand-new
// `api.profile` module (see `./index.ts`'s own header comment).
//
// Real Python's own docstring: "Currently, this API has no benefit over directly
// calling ifcopenshell.file.create_entity." -- confirmed true here too: this is a
// one-line `file.create_entity(ifc_class, ProfileType=profile_type)` call.
//
// `IfcProfileDef` (the common base of every `IfcParameterizedProfileDef` subclass --
// `IfcRectangleProfileDef`, `IfcCircleProfileDef`, etc.) declares `ProfileType` as its
// FIRST attribute (index 0) across all 3 schemas, confirmed directly against the
// generated `.d.ts`s (`ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` all agree:
// `ProfileType: IfcProfileTypeEnum; ProfileName: string | null;`), so the single
// positional argument below lands on the right attribute in every schema.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddParameterizedProfileSettings {
	/**
	 * The subclass of `IfcParameterizedProfileDef` that you'd like to create, e.g.
	 * `"IfcCircleProfileDef"`.
	 */
	ifcClass: string;
	/** Python default: `"AREA"`. */
	profileType?: "AREA" | "CURVE";
}

function addParameterizedProfileUsecase(file: IfcFile, settings: AddParameterizedProfileSettings): EntityInstance {
	const profileType = settings.profileType ?? "AREA";
	return file.createEntity(settings.ifcClass, profileType);
}

/**
 * Adds a new parameterised profile (Python:
 * `ifcopenshell.api.profile.add_parameterized_profile`).
 *
 * IFC offers parameterised profiles for common standardised hot roll steel sections
 * and common concrete forms. A full list is available on the IFC documentation as
 * subclasses of `IfcParameterizedProfileDef`.
 *
 * Currently, this API has no benefit over directly calling `file.createEntity`.
 *
 * @example
 * ```ts
 * const circle = api.profile.addParameterizedProfile(model, { ifcClass: "IfcCircleProfileDef" });
 * circle.set("Radius", 1.0);
 * ```
 */
export const addParameterizedProfile = wrapUsecase("profile.add_parameterized_profile", addParameterizedProfileUsecase);
