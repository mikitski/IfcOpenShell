// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset_template/remove_pset_template.py` (src/ifcopenshell-
// python, 41 lines) -- part of this project's `api.pset_template` chunk (see
// `./index.ts`'s own header comment). A one-line delegation to the already-landed
// `util.element.removeDeep2` -- `pset_template` and every property template it
// exclusively owns (via `HasPropertyTemplates`, a forward attribute -- confirmed
// against `ifc4.d.ts`/`ifc4x3.d.ts` -- so `traverse()` walks straight into it) are
// removed together in one call, since `IfcSimplePropertyTemplate`s aren't normally
// shared between templates.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemovePsetTemplateSettings {
	/** The `IfcPropertySetTemplate` to remove. */
	psetTemplate: EntityInstance;
}

function removePsetTemplateUsecase(file: IfcFile, settings: RemovePsetTemplateSettings): void {
	elementUtil.removeDeep2(file, settings.psetTemplate);
}

/**
 * Removes a property set template (Python:
 * `ifcopenshell.api.pset_template.remove_pset_template`).
 *
 * All property templates within the property set template are also removed along with
 * it.
 *
 * @example
 * ```ts
 * // Create a template.
 * const template = api.psetTemplate.addPsetTemplate(model, { name: "ABC_RiskFactors" });
 *
 * // Let's remove the template.
 * api.psetTemplate.removePsetTemplate(model, { psetTemplate: template });
 * ```
 */
export const removePsetTemplate = wrapUsecase("pset_template.remove_pset_template", removePsetTemplateUsecase);
