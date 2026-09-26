// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset_template/remove_prop_template.py` (src/ifcopenshell-
// python, 50 lines) -- part of this project's `api.pset_template` chunk (see
// `./index.ts`'s own header comment). Removes a single `IfcSimplePropertyTemplate`,
// but -- per its own docstring -- deliberately refuses to remove the LAST property
// template of a pset template, to keep that pset template valid.
//
// `file.getInverse(prop_template)` (default `allowDuplicate=false`, returning a `Set`
// -- matching real Python's own `file.get_inverse` default) finds every entity
// referencing `prop_template` -- in practice, just the owning `IfcPropertySetTemplate`
// (the only class with a `HasPropertyTemplates` attribute pointing at property
// templates). For each such inverse: if it has MORE than one property template,
// `prop_template` is stripped from its `HasPropertyTemplates` list (unconditionally,
// regardless of how many inverses there are -- real Python has no `break`/early exit
// either). `remove_deep2` is then called UNCONDITIONALLY on `prop_template`.
//
// --- How "don't remove the last prop template" actually works: it's a `removeDeep2`
//     side effect, not an explicit guard in this file ---
//
// This function itself has NO explicit "is this the last one?" check before calling
// `remove_deep2` -- the "last property template is protected" behavior documented in
// this function's own docstring falls entirely out of `removeDeep2`'s own "the start
// element must have no inverses" precondition (see `util/element.ts`'s `removeDeep2`
// doc comment): when `prop_template` is the pset template's ONLY property template,
// the `if len(inverse.HasPropertyTemplates) > 1` guard above is FALSE, so
// `HasPropertyTemplates` is never stripped -- `prop_template` still has an inverse
// (the pset template itself) when `remove_deep2` runs. `removeDeep2` sees
// `getTotalInverses(prop_template) > 0` with no `alsoConsider` to account for it, and
// returns immediately without deleting anything at all. When `prop_template` is NOT
// the last one, the guard strips it from `HasPropertyTemplates` first, so by the time
// `remove_deep2` runs it has zero inverses and is deleted normally. Ported verbatim --
// this port adds no explicit "is this the last one" check either, relying on the same
// already-ported `removeDeep2` guard, pinned by `removePropTemplate.test.ts`'s own
// `test_not_removing_the_last_prop_template` port.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemovePropTemplateSettings {
	/** The `IfcSimplePropertyTemplate` to remove. */
	propTemplate: EntityInstance;
}

function removePropTemplateUsecase(file: IfcFile, settings: RemovePropTemplateSettings): void {
	const { propTemplate } = settings;

	const inverses = file.getInverse(propTemplate) as Set<EntityInstance>;
	for (const inverse of inverses) {
		const hasPropertyTemplates = inverse.get("HasPropertyTemplates") as EntityInstance[];
		if (hasPropertyTemplates.length > 1) {
			const remaining = hasPropertyTemplates.filter((pt) => !pt.equals(propTemplate));
			inverse.set("HasPropertyTemplates", remaining);
		}
	}
	elementUtil.removeDeep2(file, propTemplate);
}

/**
 * Removes a property template (Python:
 * `ifcopenshell.api.pset_template.remove_prop_template`).
 *
 * Note that a property set template should always have at least one property template
 * to be valid. So a property set template will not be removed if it is the only
 * template in a property set template.
 *
 * See this file's own header comment for how that protection actually works (a
 * `removeDeep2` side effect, not an explicit check in this function).
 *
 * @example
 * ```ts
 * const template = api.psetTemplate.addPsetTemplate(model, { name: "ABC_RiskFactors" });
 *
 * // Here's two properties with just default values.
 * const prop1 = api.psetTemplate.addPropTemplate(model, { psetTemplate: template });
 * const prop2 = api.psetTemplate.addPropTemplate(model, { psetTemplate: template });
 *
 * // Let's remove the second one.
 * api.psetTemplate.removePropTemplate(model, { propTemplate: prop2 });
 * ```
 */
export const removePropTemplate = wrapUsecase("pset_template.remove_prop_template", removePropTemplateUsecase);
