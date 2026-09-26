// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/document/remove_reference.py` (src/ifcopenshell-python, 50
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Unconditionally removes `reference` and every `IfcRelAssociatesDocument` associating
// it with any object (unlike `api.classification.removeReference`, this function has no
// `products` parameter and no "detach, delete only if now unreferenced" split -- it
// always deletes `reference` outright, matching real Python exactly).
//
// --- IFC2X3-vs-IFC4+ dispatch, ported verbatim ---
//
// IFC4+ reads `reference.DocumentRefForObjects` directly (an inverse attribute, not in
// the generated `.d.ts` -- see `util/element.ts`'s `REFERENCE_TYPES` table, which already
// lists this exact name). IFC2X3 has no such inverse, so it instead calls
// `file.get_inverse(reference)` (every entity referencing `reference` from anywhere) and
// filters down to `IfcRelAssociatesDocument` instances -- ported via `IfcFile.getInverse`
// (default `allowDuplicate=false`, matching Python's own default `get_inverse` shape,
// which returns a set already deduplicated by identity).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveReferenceSettings {
	/** The `IfcDocumentReference` to remove. */
	reference: EntityInstance;
}

function removeReferenceUsecase(file: IfcFile, settings: RemoveReferenceSettings): void {
	const { reference } = settings;

	const rels: EntityInstance[] =
		file.schema === "IFC2X3"
			? [...(file.getInverse(reference) as Set<EntityInstance>)].filter((r) => r.isA("IfcRelAssociatesDocument"))
			: (reference.get("DocumentRefForObjects") as EntityInstance[]);

	for (const rel of rels) {
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}
	file.remove(reference);
}

/**
 * Removes a document reference (Python: `ifcopenshell.api.document.remove_reference`).
 *
 * All associations with objects are removed.
 *
 * @example
 * ```ts
 * const document = api.document.addInformation(model, {});
 * const reference = api.document.addReference(model, { information: document });
 * api.document.removeReference(model, { reference });
 * ```
 */
export const removeReference = wrapUsecase("document.remove_reference", removeReferenceUsecase);
