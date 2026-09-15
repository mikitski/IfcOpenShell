// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/edit_profile.py` (src/ifcopenshell-python, 85
// lines) -- chunk 4 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency -- the only import in the real source is bare
// `ifcopenshell`. `IfcMaterialProfile` doesn't exist on IFC2X3 at all (implicitly
// IFC4+-only, matching real Python's own lack of a schema guard).
//
// Same overall shape as `./editLayer.ts` (this chunk's own sibling): an `attributes`
// loop, then two INDEPENDENT, each-individually-guarded optional swaps afterward --
// `if material: profile.Material = material` / `if profile_def: profile.Profile =
// profile_def` -- not a single combined condition, and NOT `./editConstituent.ts`'s own
// unconditional-`Material`-assignment quirk (`Material` is genuinely optional on
// `IfcMaterialProfile`, unlike the required `IfcMaterialConstituent.Material`).
//
// Real Python's own parameter is named `profile_def` (the `IfcProfileDef` curve), to
// disambiguate from the `profile` parameter (the `IfcMaterialProfile` entity being
// edited) -- ported with the same two distinct names (`profile`/`profileDef`), not
// collapsed or renamed, to avoid exactly the ambiguity the real source itself avoids.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditProfileSettings {
	/** The `IfcMaterialProfile` entity you want to edit. */
	profile: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes?: Record<string, unknown>;
	/** The `IfcProfileDef` entity the profile curve should be extruded from. */
	profileDef?: EntityInstance | null;
	/** The `IfcMaterial` entity you want to change the profile to be made from. */
	material?: EntityInstance | null;
}

function editProfileUsecase(_file: IfcFile, settings: EditProfileSettings): void {
	const { profile, profileDef, material } = settings;
	for (const [name, value] of Object.entries(settings.attributes ?? {})) {
		profile.set(name, value);
	}
	if (material) {
		profile.set("Material", material);
	}
	if (profileDef) {
		profile.set("Profile", profileDef);
	}
}

/**
 * Edits the attributes of an `IfcMaterialProfile` (Python:
 * `ifcopenshell.api.material.edit_profile`).
 *
 * For more information about the attributes and data types of an `IfcMaterialProfile`,
 * consult the IFC documentation.
 *
 * Not available in IFC2X3.
 *
 * @example
 * ```ts
 * const materialSet = api.material.addMaterialSet(model, { name: "B1", setType: "IfcMaterialProfileSet" });
 * const steel1 = api.material.addMaterial(model, { name: "ST01", category: "steel" });
 * const steel2 = api.material.addMaterial(model, { name: "ST01", category: "steel" });
 *
 * const hea100 = model.createEntity("IfcIShapeProfileDef", "AREA", "HEA100", null, 100, 96, 5, 8, 12);
 * const hea200 = model.createEntity("IfcIShapeProfileDef", "AREA", "HEA200", null, 200, 190, 6.5, 10, 18);
 *
 * const profileItem = api.material.addProfile(model, { profileSet: materialSet, material: steel1, profile: hea100 });
 * api.material.editProfile(model, { profile: profileItem, profileDef: hea200, material: steel2 });
 * ```
 */
export const editProfile = wrapUsecase("material.edit_profile", editProfileUsecase);
