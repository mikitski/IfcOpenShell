// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/profile/remove_profile.py` (src/ifcopenshell-python, 60
// lines) -- part of this project's brand-new `api.profile` module (see `./index.ts`'s
// own header comment). Not to be confused with the unrelated, already-landed
// `../material/removeProfile.ts` (Python: `ifcopenshell.api.material.remove_profile`,
// a completely different function that removes an `IfcMaterialProfile` set item, not
// an `IfcProfileDef`) -- the two live in separate namespaces (`api.material.removeProfile`
// vs. `api.profile.removeProfile`), matching real Python's own separate modules.
//
// --- `for attribute in profile:` -- same sequence-iteration protocol as
// `../material/removeProfile.ts`, ported the identical way ---
//
// Real Python's `for attribute in profile:` iterates every FORWARD attribute's raw
// value by positional index (`entity_instance.__len__`/`__getitem__`), collecting
// every entity-typed value into a `set()`. Ported via `attributeCount()`/`getByIndex(i)`,
// deduped by identity (`Map<number, EntityInstance>`), matching
// `../material/removeProfile.ts`'s own established precedent for this exact pattern.
//
// --- Real schema divergence: how a profile's psets are found ---
//
// IFC2X3's `IfcProfileProperties` has no inverse link back to the profile via a
// `HasProperties`-style attribute on `IfcProfileDef` itself -- confirmed directly
// against `ifc2x3.d.ts` (no `IfcProfileDef` inverse attributes declared there at
// all) -- so real Python instead does a global `file.by_type("IfcProfileProperties")`
// scan and filters by `pset.ProfileDefinition == profile`. On IFC4+, `IfcProfileDef`
// gained a genuine `HasProperties` inverse attribute (confirmed: not declared as a
// forward attribute in `ifc4.d.ts`/`ifc4x3.d.ts` either -- it's a pure inverse,
// accessed dynamically via `.get("HasProperties")` exactly like
// `../../util/element.ts`'s own established `attrList(element, "HasProperties")`
// call sites elsewhere in this codebase, which likewise reach inverse attributes
// undeclared in the generated `.d.ts`s). Both branches ported faithfully.

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removePset } from "../pset/removePset";

export interface RemoveProfileSettings {
	/** The `IfcProfileDef` to remove. */
	profile: EntityInstance;
}

function removeProfileUsecase(file: IfcFile, settings: RemoveProfileSettings): void {
	const { profile } = settings;
	const isIfc2x3 = file.schema === "IFC2X3";

	const subelements = new Map<number, EntityInstance>();
	const count = profile.attributeCount();
	for (let i = 0; i < count; i++) {
		const attribute = profile.getByIndex(i);
		if (attribute instanceof EntityInstance) {
			subelements.set(attribute.identity(), attribute);
		}
	}

	// Clean up profile property sets.
	let profilePsets: readonly EntityInstance[];
	if (isIfc2x3) {
		profilePsets = file
			.byType("IfcProfileProperties")
			.filter((pset) => (pset.get("ProfileDefinition") as EntityInstance | null)?.equals(profile) ?? false);
	} else {
		profilePsets = (profile.get("HasProperties") as EntityInstance[] | null) ?? [];
	}

	for (const pset of profilePsets) {
		removePset(file, { product: profile, pset });
	}

	file.remove(profile);
	for (const subelement of subelements.values()) {
		elementUtil.removeDeep2(file, subelement);
	}
}

/**
 * Removes a profile (Python: `ifcopenshell.api.profile.remove_profile`).
 *
 * @example
 * ```ts
 * const circle = api.profile.addParameterizedProfile(model, { ifcClass: "IfcCircleProfileDef" });
 * api.profile.removeProfile(model, { profile: circle });
 * ```
 */
export const removeProfile = wrapUsecase("profile.remove_profile", removeProfileUsecase);
