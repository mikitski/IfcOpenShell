// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/remove_profile.py` (src/ifcopenshell-python, 80
// lines) -- chunk 3 of `api.material` (see `./index.ts`'s own header comment). No
// sibling `api.material` dependency of any kind -- the only import in the real source
// is bare `ifcopenshell.util.element` (for `remove_deep2`). `IfcMaterialProfile`
// doesn't exist on IFC2X3 at all (this whole function is implicitly IFC4+-only,
// matching real Python's own lack of a schema guard).
//
// --- `for attribute in profile:` -- Python's C++-backed `entity_instance.__len__`/
// `__getitem__` sequence-iteration protocol, ported via `attributeCount`/`getByIndex` ---
//
// Real Python's `for attribute in profile:` does NOT iterate the profile's own STEP
// argument list generically -- `entity_instance` has no `__iter__` of its own; Python's
// default sequence-iteration protocol instead calls `profile[i]` (SWIG's
// `entity_instance.__getitem__`, itself `getByIndex`'s own Python counterpart) for
// `i` in `range(len(profile))` (`__len__`, `declaration().attribute_count()`) until
// exhausted. I.e. this iterates every FORWARD attribute's raw VALUE by positional
// index (`Name`/`Description`/`Material`/`Profile`/`Priority`/`Category` for
// `IfcMaterialProfile`) -- not inverse attributes, and NOT flattening a list-valued
// attribute's own elements (an `isinstance(attribute, ifcopenshell.entity_instance)`
// check on a Python `list` is always `False`, so a list-typed forward attribute, were
// one ever added to this class, would be silently skipped entire, not iterated into).
// Ported as the equivalent `attributeCount()`/`getByIndex(i)` loop (the exact same
// technique already established by `util/element.ts`'s own `copy`/`copyDeep`), keyed
// by identity (a `Map<number, EntityInstance>`, mirroring `unassignMaterial.ts`'s own
// `MutableEntityInstanceSet` precedent) to reproduce Python's `set()` dedup semantics
// -- `IfcMaterialProfile.Material`/`.Profile` are the only two attributes that could
// ever actually be entity-typed here, so in practice this collects at most those two.
//
// --- Real, disclosed asymmetric skip logic, ported verbatim ---
//
// The `if/elif` chain below is a `continue`-to-skip shape, NOT a `remove_deep2` gated
// by a combined boolean -- `should_remove_material`/`should_remove_profile_def` are
// each checked independently, and neither is even inspected for a subelement that is
// NEITHER an `IfcMaterial` NOR an `IfcProfileDef` (there is no such subelement in
// practice for this class, but the shape is preserved as-is rather than collapsed into
// a single combined condition).

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { removeDeep2 } from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveProfileSettings {
	/** The `IfcMaterialProfile` entity you want to remove. */
	profile: EntityInstance;
	/** If true, profile defs with no users will be removed. Defaults to `false`. */
	shouldRemoveProfileDef?: boolean;
	/** If true, materials with no users will be removed. Defaults to `false`. */
	shouldRemoveMaterial?: boolean;
}

function removeProfileUsecase(file: IfcFile, settings: RemoveProfileSettings): void {
	const { profile, shouldRemoveProfileDef = false, shouldRemoveMaterial = false } = settings;

	const subelements = new Map<number, EntityInstance>();
	const count = profile.attributeCount();
	for (let i = 0; i < count; i++) {
		const attribute = profile.getByIndex(i);
		if (attribute instanceof EntityInstance) {
			subelements.set(attribute.identity(), attribute);
		}
	}
	file.remove(profile);
	for (const subelement of subelements.values()) {
		if (subelement.isA("IfcMaterial") && !shouldRemoveMaterial) {
			continue;
		}
		if (subelement.isA("IfcProfileDef") && !shouldRemoveProfileDef) {
			continue;
		}
		removeDeep2(file, subelement);
	}
}

/**
 * Removes a profile item from a profile set (Python:
 * `ifcopenshell.api.material.remove_profile`).
 *
 * Note that it is invalid to have zero items in a set, so you should leave at least
 * one profile to ensure a valid IFC dataset.
 *
 * Not available in IFC2X3.
 *
 * @example
 * ```ts
 * const materialSet = api.material.addMaterialSet(model, { name: "B1", setType: "IfcMaterialProfileSet" });
 * const steel = api.material.addMaterial(model, { name: "ST01", category: "steel" });
 * const weldProfile = api.material.addProfile(model, { profileSet: materialSet, material: steel });
 * api.material.removeProfile(model, { profile: weldProfile });
 * ```
 */
export const removeProfile = wrapUsecase("material.remove_profile", removeProfileUsecase);
