// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/edit_presentation_style.py` (src/ifcopenshell-python,
// 47 lines) -- chunk 1 of 2 for `api.style` (see `./index.ts`'s own header comment) --
// a trivial attribute-setter loop, matching `../material/editMaterial.ts`/`../group
// /editGroup.ts`/`../layer/editLayer.ts`/`../context/editContext.ts`'s identical shape
// verbatim (same underlying Python pattern: `for name, value in attributes.items():
// setattr(style, name, value)`). No `update_owner_history` call -- real Python's
// `edit_presentation_style` genuinely doesn't touch `OwnerHistory` at all
// (`IfcPresentationStyle` is not an `IfcRoot` subtype, so it has no `OwnerHistory` to
// touch).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditPresentationStyleSettings {
	/** The `IfcPresentationStyle` entity you want to edit. */
	style: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editPresentationStyleUsecase(_file: IfcFile, settings: EditPresentationStyleSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.style.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcPresentationStyle` (Python:
 * `ifcopenshell.api.style.edit_presentation_style`).
 *
 * For more information about the attributes and data types of an
 * `IfcPresentationStyle`, consult the IFC documentation.
 *
 * @example
 * ```ts
 * // Create a new surface style
 * const style = api.style.addStyle(model, {});
 *
 * // Change the name of the style to "Foo"
 * api.style.editPresentationStyle(model, { style, attributes: { Name: "Foo" } });
 * ```
 */
export const editPresentationStyle = wrapUsecase("style.edit_presentation_style", editPresentationStyleUsecase);
