// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/edit_material.py` (src/ifcopenshell-python, 27
// lines) -- chunk 2 of `api.material` (see `./index.ts`'s own header comment) -- a
// trivial attribute-setter loop, matching `../group/editGroup.ts`/`../layer
// /editLayer.ts`/`../context/editContext.ts`'s identical shape verbatim (same
// underlying Python pattern: `for name, value in attributes.items(): setattr(material,
// name, value)`). No `update_owner_history` call -- real Python's `edit_material`
// genuinely doesn't touch `OwnerHistory` at all (an `IfcMaterial` has none to touch --
// it's not an `IfcRoot` subtype).
//
// Note real Python's own docstring here is a single one-line summary ("Edits the
// attributes of an IfcMaterial") with no `:param`/example, unlike this same file's
// near-identical sibling `./editAssignedMaterial.ts`, which has a fuller docstring
// (`:param element`/`:param attributes`/an example) despite its function body being
// byte-for-byte the same `setattr` loop -- confirmed by reading both real 27-line/
// 44-line sources directly: they are genuine duplicates of each other (both real
// Python functions, not a copy/paste error introduced by this port), differing only
// in docstring/parameter naming (`material` here vs. `element` there), not behavior.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditMaterialSettings {
	/** The `IfcMaterial` entity to edit. */
	material: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editMaterialUsecase(_file: IfcFile, settings: EditMaterialSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.material.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcMaterial` (Python:
 * `ifcopenshell.api.material.edit_material`).
 */
export const editMaterial = wrapUsecase("material.edit_material", editMaterialUsecase);
