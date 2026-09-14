// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/library/remove_reference.py` (src/ifcopenshell-python, 49
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Unconditionally removes `reference` and every `IfcRelAssociatesLibrary` associating it
// with any object (like `../document/removeReference.ts`, and unlike
// `../classification/removeReference.ts`, this function has no `products` parameter and
// no "detach, delete only if now unreferenced" split -- it always deletes `reference`
// outright, matching real Python exactly).
//
// --- IFC2X3-vs-IFC4+ dispatch, ported verbatim -- a REAL difference from
//     `../document/removeReference.ts`'s own IFC2X3 branch, investigated not assumed ---
//
// IFC4+ reads `reference.LibraryRefForObjects` directly (an inverse attribute, not in the
// generated `.d.ts` -- see `util/element.ts`'s `REFERENCE_TYPES` table, which already
// lists this exact name). For IFC2X3, `../document/removeReference.ts`'s own Python
// counterpart calls `file.get_inverse(reference)` and filters down to
// `IfcRelAssociatesDocument`; `library`'s real Python source does NOT do that here --
// confirmed directly against `remove_reference.py`, which instead does a plain
// `file.by_type("IfcRelAssociatesLibrary")` scan filtered by `rel.RelatingLibrary ==
// reference` (the same shape as `../classification/removeClassification.ts`'s own
// `IfcRelAssociatesClassification` sweep, not `document`'s `get_inverse` call). This is a
// genuine, real asymmetry between the two structurally-similar sibling modules -- ported
// verbatim via `file.byType(...).filter(...)`, not "fixed" to reuse `IfcFile.getInverse`
// for parity with `document`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveReferenceSettings {
	/** The `IfcLibraryReference` to remove. */
	reference: EntityInstance;
}

function removeReferenceUsecase(file: IfcFile, settings: RemoveReferenceSettings): void {
	const { reference } = settings;

	const rels: EntityInstance[] =
		file.schema !== "IFC2X3"
			? (reference.get("LibraryRefForObjects") as EntityInstance[])
			: file
					.byType("IfcRelAssociatesLibrary")
					.filter((rel) => (rel.get("RelatingLibrary") as EntityInstance | null)?.equals(reference));

	for (const rel of rels) {
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}
	file.remove(reference);
}

/**
 * Removes a library reference (Python: `ifcopenshell.api.library.remove_reference`).
 *
 * Any products which have relationships to this reference will not be removed.
 *
 * @example
 * ```ts
 * const library = api.library.addLibrary(model, { name: "Brickschema" });
 * const reference = api.library.addReference(model, { library });
 * // Let's change our mind and remove it.
 * api.library.removeReference(model, { reference });
 * ```
 */
export const removeReference = wrapUsecase("library.remove_reference", removeReferenceUsecase);
