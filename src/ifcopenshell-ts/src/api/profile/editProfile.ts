// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/profile/edit_profile.py` (src/ifcopenshell-python, 45
// lines) -- part of this project's brand-new `api.profile` module (see `./index.ts`'s
// own header comment). Same plain generic attribute-setter loop shape as
// `../structural/editStructuralLoadCase.ts`/`editStructuralLoad.ts`/etc.: iterate the
// `attributes` record and `.set(name, value)` each one on the target entity, no
// validation, no special-casing of any attribute name.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditProfileSettings {
	/** The `IfcProfileDef` entity you want to edit. */
	profile: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editProfileUsecase(_file: IfcFile, settings: EditProfileSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.profile.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcProfileDef` (Python:
 * `ifcopenshell.api.profile.edit_profile`).
 *
 * For more information about the attributes and data types of an `IfcProfileDef`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const circle = api.profile.addParameterizedProfile(model, { ifcClass: "IfcCircleProfileDef" });
 * api.profile.editProfile(model, { profile: circle, attributes: { ProfileName: "1000mm Dia" } });
 * ```
 */
export const editProfile = wrapUsecase("profile.edit_profile", editProfileUsecase);
