// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/drawing/edit_text_literal.py` (src/ifcopenshell-python, 44
// lines) -- a trivial attribute-setter loop, matching `../classification/
// editClassification.ts`/`../group/editGroup.ts`'s identical shape verbatim (same
// underlying Python pattern: `for name, value in attributes.items(): setattr(
// text_literal, name, value)`). No `update_owner_history` call -- `IfcTextLiteral`
// isn't an `IfcRoot` subtype, so it has no `OwnerHistory` to update in the first place.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface EditTextLiteralSettings {
	/** The `IfcTextLiteral` entity you want to edit. */
	textLiteral: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editTextLiteralUsecase(_file: IfcFile, settings: EditTextLiteralSettings): void {
	for (const [name, value] of Object.entries(settings.attributes)) {
		settings.textLiteral.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcTextLiteral` (Python:
 * `ifcopenshell.api.drawing.edit_text_literal`).
 *
 * For more information about the attributes and data types of an `IfcTextLiteral`,
 * consult the IFC documentation.
 *
 * @example
 * ```ts
 * const text = model.createEntity("IfcTextLiteralWithExtent");
 * api.drawing.editTextLiteral(model, { textLiteral: text, attributes: { Literal: "MY ANNOTATION" } });
 * ```
 */
export const editTextLiteral = wrapUsecase("drawing.edit_text_literal", editTextLiteralUsecase);
