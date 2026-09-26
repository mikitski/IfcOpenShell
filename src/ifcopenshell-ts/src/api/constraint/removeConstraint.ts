// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/constraint/remove_constraint.py` (src/ifcopenshell-python,
// 49 lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Removes a constraint (typically an `IfcObjective`, though real Python's own docstring
// notes `IfcMetric` can technically be associated with products too, "though the
// meaning may be unclear") and every `IfcRelAssociatesConstraint` left dangling by the
// removal.
//
// --- `IfcFile.remove`'s cascade + a whole-file sweep for orphaned rels ---
//
// `file.remove(constraint)` already nulls out `RelatingConstraint` on any rel that
// pointed at it (`IfcFile.remove`'s own documented automatic "null out any attribute
// referencing a just-removed entity" cascade -- see `../classification/
// removeClassification.ts`'s own header comment for the identical mechanism, confirmed
// there against `IfcFile.remove`'s doc comment). The subsequent whole-file
// `file.byType("IfcRelAssociatesConstraint")` sweep (not scoped to just the rel(s) this
// call just orphaned) relies on that cascade having already happened -- ported verbatim,
// not narrowed to a smaller, more surgical scope. Works unbranched on all 3 schemas:
// `IfcRelAssociatesConstraint` exists on every schema (unlike, say, `library`'s
// `IfcExternalReferenceRelationship`), so there is no schema-specific limitation here
// (contrast with `./removeMetric.ts`'s own, genuinely schema-limited, sibling).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveConstraintSettings {
	/** The `IfcObjective` (or, technically, `IfcMetric`) you want to remove. */
	constraint: EntityInstance;
}

function removeConstraintUsecase(file: IfcFile, settings: RemoveConstraintSettings): void {
	const { constraint } = settings;

	file.remove(constraint);
	for (const rel of file.byType("IfcRelAssociatesConstraint")) {
		if (!rel.get("RelatingConstraint")) {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}
}

/**
 * Remove a constraint, typically an objective (Python:
 * `ifcopenshell.api.constraint.remove_constraint`).
 *
 * Removes a constraint definition and all of its associations to any products.
 * Typically this would be an `IfcObjective`, although technically you can associate
 * `IfcMetric`s with products too, though the meaning may be unclear.
 *
 * @example
 * ```ts
 * const objective = api.constraint.addObjective(model, {});
 * api.constraint.removeConstraint(model, { constraint: objective });
 * ```
 */
export const removeConstraint = wrapUsecase("constraint.remove_constraint", removeConstraintUsecase);
