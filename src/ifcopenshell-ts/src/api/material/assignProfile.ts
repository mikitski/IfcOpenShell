// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/assign_profile.py` (src/ifcopenshell-python, 128
// lines) -- chunk 4 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency of any kind -- the only import in the real source
// is `ifcopenshell.util.representation` (`get_representation`, already landed as
// `util/representation.ts`'s own `getRepresentation`). `IfcMaterialProfile` doesn't
// exist on IFC2X3 at all (implicitly IFC4+-only, matching real Python's own lack of a
// schema guard).
//
// Changes an `IfcMaterialProfile`'s own `Profile` (`IfcProfileDef` curve) -- e.g.
// swapping a HEA100 cross-section for a HEA200 -- and propagates that new profile onto
// every occurrence's own body representation extrusion that used the OLD profile,
// via every `IfcMaterialProfileSetUsage` built on top of the profile SET this one
// profile item belongs to. The old profile itself is removed afterward if nothing else
// references it (`file.get_total_inverses(old_profile) == 0`).
//
// Real Python has a `# TODO: handle composite profiles` comment right at the top of
// `execute()` -- ported verbatim as the same comment; this function only ever swaps
// the SweptArea profile of `IfcSweptAreaSolid`s (not e.g. `IfcSectionedSolid`'s
// multiple cross-sections along a spine), matching real Python's own acknowledged gap.
//
// --- Real dead-code branch, ported verbatim, NOT silently dropped ---
//
// `if self.file.schema == "IFC2X3": ... else: ...` inside the `ToMaterialProfileSet`
// loop dispatches on schema to decide HOW to find the elements associated with each
// `IfcMaterialProfileSetUsage` (`get_inverse`-then-filter on IFC2X3 vs. the direct
// `AssociatedTo` inverse attribute on IFC4+). This branch is genuinely UNREACHABLE in
// practice: `IfcMaterialProfile` (this whole function's own `material_profile`
// parameter type) doesn't exist on IFC2X3 at all -- confirmed absent from
// `ifc2x3.d.ts` -- so a real IFC2X3 file could never reach this function's body with a
// valid `material_profile` argument in the first place (the function would already
// have thrown a native "unknown declaration" error long before this point, the moment
// any caller tried to even CREATE an `IfcMaterialProfile` on such a file via
// `./addProfile.ts`). Ported as the same explicit two-branch `if`/`else` anyway (not
// collapsed into the IFC4+ branch alone), matching this project's established
// "preserve real dead code verbatim, disclose it" convention (e.g.
// `./assignMaterial.ts`'s own quirk 3, `typesToMaterialSets`).
//
// --- Real, disclosed AttributeError-on-`null` gap, NOT guarded against here ---
//
// (None specific to this file -- `material_profile.Profile` is a required,
// non-optional `IfcMaterialProfile` attribute, so `old_profile` is always a real
// entity in practice for a validly-constructed file; `./addProfile.ts`'s own docstring
// even says "Profile is not optional for IfcMaterialProfile", so this isn't a gap this
// file itself introduces.)
//
// --- Positional/by-name attribute access, verified against generated `.d.ts`s ---
//
// `IfcMaterialProfile.Profile`/`.ToMaterialProfileSet` (inverse), `IfcMaterialProfileSet
// .MaterialProfiles`, `IfcRelAssociatesMaterial.RelatedObjects`, `IfcSweptAreaSolid
// .SweptArea` -- all read/written by name, matching this project's established
// convention for non-hot-path attribute access. `ToMaterialProfileSet` (an INVERSE
// attribute, absent from the generated `.d.ts`s entirely since those only list FORWARD
// attributes) is read via `.get(...)`, exactly like `./assignMaterial.ts`'s own
// `AssociatedTo` precedent -- `EntityInstance.get()` resolves inverse attributes
// dynamically regardless of the `.d.ts`'s own forward-only attribute listing.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getRepresentation } from "../../util/representation";
import { wrapUsecase } from "../hooks";

/** Python: `Usecase.change_profile`. */
function changeProfile(file: IfcFile, element: EntityInstance, profile: EntityInstance): void {
	const representation = getRepresentation(element, "Model", "Body", "MODEL_VIEW");
	if (!representation) return;
	for (const subelement of file.traverse(representation)) {
		if (subelement.isA("IfcSweptAreaSolid")) {
			subelement.set("SweptArea", profile);
		}
	}
}

export interface AssignProfileSettings {
	/** The `IfcMaterialProfile` to change the profile curve of. See `./addProfile.ts` to see how to create profiles. */
	materialProfile: EntityInstance;
	/** The `IfcProfileDef` to set the profile item's curve to. */
	profile: EntityInstance;
}

function assignProfileUsecase(file: IfcFile, settings: AssignProfileSettings): void {
	const { materialProfile, profile } = settings;

	// TODO: handle composite profiles
	const oldProfile = materialProfile.get("Profile") as EntityInstance | null;
	materialProfile.set("Profile", profile);

	const profileSets = (materialProfile.get("ToMaterialProfileSet") as EntityInstance[] | null) ?? [];
	for (const profileSet of profileSets) {
		for (const inverse of file.getInverse(profileSet) as Set<EntityInstance>) {
			if (!inverse.isA("IfcMaterialProfileSetUsage")) continue;

			// See this file's own header comment -- this branch is real dead code, ported
			// verbatim (`IfcMaterialProfile` doesn't exist on IFC2X3 at all).
			if (file.schema === "IFC2X3") {
				for (const rel of file.getInverse(inverse) as Set<EntityInstance>) {
					if (!rel.isA("IfcRelAssociatesMaterial")) continue;
					for (const element of rel.get("RelatedObjects") as EntityInstance[]) {
						changeProfile(file, element, profile);
					}
				}
			} else {
				for (const rel of (inverse.get("AssociatedTo") as EntityInstance[] | null) ?? []) {
					for (const element of rel.get("RelatedObjects") as EntityInstance[]) {
						changeProfile(file, element, profile);
					}
				}
			}
		}
	}

	if (oldProfile && file.getTotalInverses(oldProfile) === 0) {
		// TODO: check remove deep
		file.remove(oldProfile);
	}
}

/**
 * Changes the profile curve of a material profile item in a profile set (Python:
 * `ifcopenshell.api.material.assign_profile`).
 *
 * In addition to changing the profile curve, it will also change the profile curve
 * used in any body representation extrusions.
 *
 * Not available in IFC2X3.
 *
 * @example
 * ```ts
 * const beamType = api.root.createEntity(model, { ifcClass: "IfcBeamType", name: "B1" });
 * const materialSet = api.material.addMaterialSet(model, { name: "B1", setType: "IfcMaterialProfileSet" });
 * const steel = api.material.addMaterial(model, { name: "ST01", category: "steel" });
 * const hea100 = model.createEntity("IfcIShapeProfileDef", "AREA", "HEA100", null, 100, 96, 5, 8, 12);
 * const profileItem = api.material.addProfile(model, { profileSet: materialSet, material: steel, profile: hea100 });
 * api.material.assignMaterial(model, { products: [beamType], material: materialSet });
 *
 * const hea200 = model.createEntity("IfcIShapeProfileDef", "AREA", "HEA200", null, 200, 190, 6.5, 10, 18);
 * api.material.assignProfile(model, { materialProfile: profileItem, profile: hea200 });
 * ```
 */
export const assignProfile = wrapUsecase("material.assign_profile", assignProfileUsecase);
