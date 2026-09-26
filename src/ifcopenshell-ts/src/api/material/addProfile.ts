// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/add_profile.py` (src/ifcopenshell-python, 101
// lines) -- chunk 2 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency of any kind -- the only import in the real source
// is bare `ifcopenshell`.
//
// Adds a new `IfcMaterialProfile` item to an `IfcMaterialProfileSet` -- most commonly
// there is only a single profile item in a set (e.g. a beam's one steel I-beam
// cross-section), but a composite beam/column may have several. `IfcMaterialProfile`
// itself doesn't exist on IFC2X3 at all (profile sets are an IFC4+ feature), so this
// whole function is implicitly IFC4+-only, matching real Python's own lack of a
// schema guard (a native "unknown declaration" error on IFC2X3, not a friendlier
// message).
//
// `material`/`profile` are both optional here (the docstring: "Profile is not
// optional for IfcMaterialProfile but it is optional for this API call and can be
// assigned later with material.assign_profile" -- `assign_profile` itself is a
// separate, unported `api.material` sibling not needed by this function's own body).
//
// --- Real, disclosed quirk, ported verbatim ---
//
// `mat_profile = file.create_entity("IfcMaterialProfile", Name=name)` passes
// `Name=name` unconditionally (`name` defaults to `None`) -- an explicit `None`/`null`
// `Name`, not "leave unset" -- while `Material`/`Profile` are each set via a separate
// truthy `if material: ... / if profile: ...` AFTERWARD, only when actually provided.
// Ported the same asymmetric shape: `Name` always passed positionally at creation
// time (`name ?? null`, not omitted), `Material`/`Profile` each set via a conditional
// `.set()` call afterward, not folded into the constructor call.
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcMaterialProfile` (IFC4/IFC4X3 only): `[Name, Description, Material, Profile,
// Priority, Category]` -- `Name` is attribute index 0 on both schemas, so
// `file.createEntity("IfcMaterialProfile", name ?? null)` needs no further positional
// args; `Material`/`Profile` are set by name afterward, not positionally, exactly
// matching real Python's own post-creation `mat_profile.Material = material` /
// `mat_profile.Profile = profile` attribute assignments.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddProfileSettings {
	/** The `IfcMaterialProfileSet` that the profile is part of. */
	profileSet: EntityInstance;
	/** The `IfcMaterial` that the profile item is made out of. May be assigned later. */
	material?: EntityInstance | null;
	/** The `IfcProfileDef` representing the 2D cross section of the profile item. May be assigned later (e.g. via the still-unported `api.material.assign_profile`). */
	profile?: EntityInstance | null;
	/** An optional name of the material profile (not the geometric profile). */
	name?: string | null;
}

function addProfileUsecase(file: IfcFile, settings: AddProfileSettings): EntityInstance {
	const { profileSet, material, profile } = settings;
	const profiles = ((profileSet.get("MaterialProfiles") as EntityInstance[] | null) ?? []).slice();

	const matProfile = file.createEntity("IfcMaterialProfile", settings.name ?? null);
	if (material) {
		matProfile.set("Material", material);
	}
	if (profile) {
		matProfile.set("Profile", profile);
	}

	profiles.push(matProfile);
	profileSet.set("MaterialProfiles", profiles);
	return matProfile;
}

/**
 * Adds a new profile item to a profile set (Python:
 * `ifcopenshell.api.material.add_profile`).
 *
 * A profile item in a profile set represents an extruded 2D profile curve that is
 * extruded along the axis of the element. Most commonly there will only be a single
 * profile item in a profile set -- for example, a beam will have a material profile
 * set containing a single profile item, which may have a steel material and an
 * I-beam-shaped profile curve.
 *
 * Note that the "profile item" (`IfcMaterialProfile`) represents a single extrusion
 * in the profile set, whereas the "profile curve" (`IfcProfileDef`) represents a 2D
 * curve used by a "profile item".
 *
 * In some rare cases, a profiled element (a beam or column) may be a composite and
 * include multiple extrusions -- the order of the profiles does not matter.
 *
 * @returns The newly created `IfcMaterialProfile`.
 *
 * @example
 * ```ts
 * const beamType = api.root.createEntity(model, { ifcClass: "IfcBeamType", name: "B1" });
 * const materialSet = api.material.addMaterialSet(model, { name: "B1", setType: "IfcMaterialProfileSet" });
 * const steel = api.material.addMaterial(model, { name: "ST01", category: "steel" });
 * const hea100 = model.createEntity(
 *   "IfcIShapeProfileDef", "AREA", "HEA100", null, 100, 96, 5, 8, 12,
 * );
 * api.material.addProfile(model, { profileSet: materialSet, material: steel, profile: hea100 });
 * api.material.assignMaterial(model, { products: [beamType], material: materialSet });
 * ```
 */
export const addProfile = wrapUsecase("material.add_profile", addProfileUsecase);
