// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/classification/remove_classification.py` (src/ifcopenshell-
// python, 77 lines). Removes an `IfcClassification` and, per this module's own logic,
// cascades to every reference nested underneath it (`get_references`'s recursion) plus
// any now-orphaned `IfcRelAssociatesClassification`/`IfcExternalReferenceRelationship`
// left dangling by the removal.
//
// --- Real IFC2X3-vs-IFC4+ schema difference in `get_references`, investigated ---
//
// IFC4+ walks the classification's `HasReferences` inverse recursively (each
// `IfcClassificationReference` ALSO declares `HasReferences`, pointing at its own child
// references -- confirmed against `ifc4.d.ts`; a reference-of-a-reference chain, not
// just classification-of-references). IFC2X3 has no such inverse at all (its
// `IfcClassificationReference` only carries a forward `ReferencedSource`, no reverse
// link), so that branch instead scans every `IfcClassificationReference` in the whole
// file and keeps the ones whose `ReferencedSource` equals `classification` by identity
// -- ported verbatim, matching real Python's own identical schema branch (not
// recursive on IFC2X3, since IFC2X3 classification references can only ever point
// directly at the top-level `IfcClassification`, never chain through another
// reference).
//
// --- `IfcFile.remove`'s cascade + a whole-file sweep for orphaned rels ---
//
// After removing `classification` and its references, the file-wide sweep over EVERY
// `IfcRelAssociatesClassification`/`IfcExternalReferenceRelationship` (not scoped to
// just the ones this call just orphaned) relies on `IfcFile.remove` already having
// nulled out `RelatingClassification`/`RelatingReference` on any rel that pointed at a
// just-removed entity (see `../group/removeGroup.ts`'s own header comment for the
// identical "IfcFile.remove already splices/nulls references automatically" mechanism,
// confirmed against that file's own doc comment). This sweep is real Python's own
// behavior, ported verbatim -- not narrowed to a smaller, more surgical scope.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

function getReferences(file: IfcFile, classification: EntityInstance): EntityInstance[] {
	const results: EntityInstance[] = [];
	if (file.schema === "IFC2X3") {
		for (const reference of file.byType("IfcClassificationReference")) {
			if ((reference.get("ReferencedSource") as EntityInstance | null)?.equals(classification)) {
				results.push(reference);
			}
		}
	} else {
		for (const reference of classification.get("HasReferences") as EntityInstance[]) {
			results.push(reference);
			results.push(...getReferences(file, reference));
		}
	}
	return results;
}

export interface RemoveClassificationSettings {
	/** The `IfcClassification` entity you want to remove. */
	classification: EntityInstance;
}

function removeClassificationUsecase(file: IfcFile, settings: RemoveClassificationSettings): void {
	const { classification } = settings;

	const references = getReferences(file, classification);
	for (const reference of references) {
		file.remove(reference);
	}
	file.remove(classification);

	for (const rel of file.byType("IfcRelAssociatesClassification")) {
		if (!rel.get("RelatingClassification")) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}

	if (file.schema !== "IFC2X3") {
		for (const rel of file.byType("IfcExternalReferenceRelationship")) {
			if (!rel.get("RelatingReference")) {
				file.remove(rel);
			}
		}
	}
}

/**
 * Removes an `IfcClassification` from the project and all references (Python:
 * `ifcopenshell.api.classification.remove_classification`).
 *
 * The classification and all of its relationships, children references, and
 * relationships between objects and child references are completely removed from a
 * project.
 *
 * @example
 * ```ts
 * const classification = model.byType("IfcClassification")[0];
 * api.classification.removeClassification(model, { classification });
 * ```
 */
export const removeClassification = wrapUsecase("classification.remove_classification", removeClassificationUsecase);
