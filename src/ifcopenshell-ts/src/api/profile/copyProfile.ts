// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/profile/copy_profile.py` (src/ifcopenshell-python, 47
// lines) -- part of this project's brand-new `api.profile` module (see `./index.ts`'s
// own header comment).
//
// Real Python: `ifcopenshell.util.element.copy_deep(file, profile)` (deep-copies the
// profile and everything it references), then finds every inverse of the ORIGINAL
// profile that `is_a("IfcProfileProperties")` (its psets), shallow-`copy`s each one,
// and repoints the new pset's `ProfileDefinition` at the new profile. Both
// `util.element.copyDeep`/`copy` are already fully ported (`../../util/element.ts`),
// confirmed by reading the real source's only imports (`ifcopenshell`,
// `ifcopenshell.util.element`) -- no unported dependency of any kind.
//
// `file.get_inverse(profile)` returns a Python `set` -- ported via `IfcFile.getInverse`'s
// own default (`allowDuplicate=false`) return shape, `Set<EntityInstance>`, matching
// `../pset/removePset.ts`'s own established `for (const inverse of file.getInverse(pset)
// as Set<EntityInstance>)` iteration pattern.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface CopyProfileSettings {
	/** The `IfcProfileDef` to copy. */
	profile: EntityInstance;
}

function copyProfileUsecase(file: IfcFile, settings: CopyProfileSettings): EntityInstance {
	const { profile } = settings;
	const newProfile = elementUtil.copyDeep(file, profile);
	const inverses = file.getInverse(profile) as Set<EntityInstance>;
	const psets = [...inverses].filter((i) => i.isA("IfcProfileProperties"));
	for (const pset of psets) {
		const newPset = elementUtil.copy(file, pset);
		newPset.set("ProfileDefinition", newProfile);
	}
	return newProfile;
}

/**
 * Copies a profile (Python: `ifcopenshell.api.profile.copy_profile`).
 *
 * All of the profile's psets are copied. The copied profile is not associated to any
 * elements.
 *
 * @example
 * ```ts
 * const profile = api.profile.addParameterizedProfile(model, { ifcClass: "IfcRectangleProfileDef" });
 * const profileCopy = api.profile.copyProfile(model, { profile });
 * ```
 */
export const copyProfile = wrapUsecase("profile.copy_profile", copyProfileUsecase);
