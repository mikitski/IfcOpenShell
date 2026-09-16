// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/copy_representation.py` (src/ifcopenshell-python,
// 76 lines) -- part of this chunk's 8-file `api.geometry` addition (see `./index.ts`'s
// own header comment). Verified directly: this file's real imports are
// `ifcopenshell.api.geometry` (itself, recursively -- `unassign_representation`/
// `remove_representation`/`assign_representation`, all 3 already landed by earlier
// `api.geometry` chunks), and `ifcopenshell.util.element`/`ifcopenshell.util.
// representation` (`copy_deep`/`get_representation`, both already landed) -- no
// kernel/matrix-math dependency, no genuinely new/unported primitive at all.
//
// Copies `source`'s named representation (default `"Body"`, matched against `"Model"`
// context + `contextIdentifier` via `util.representation.getRepresentation`) onto
// `target`: deep-copies the whole representation entity graph (geometry items,
// profiles, placements, etc.) via `util.element.copyDeep`, EXCLUDING
// `IfcGeometricRepresentationContext` from the copy (the context itself is always
// SHARED with the original, never duplicated -- both `source`'s and `target`'s copies
// end up under the exact same `IfcGeometricRepresentationContext`/
// `IfcGeometricRepresentationSubContext`). If `target` already has a matching
// representation, it is unassigned and removed first (via the already-landed
// `unassignRepresentation`/`removeRepresentation`, called in that order, matching real
// Python's own order exactly -- unassigning first so `removeRepresentation`'s own
// "expected not to be in use" precondition, see that file's own doc comment, actually
// holds). Returns `undefined` (Python: `None`) if `source` has no matching
// representation at all, leaving `target` completely untouched.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { type RepresentationIdentifier, getRepresentation } from "../../util/representation";
import { wrapUsecase } from "../hooks";
import { assignRepresentation } from "./assignRepresentation";
import { removeRepresentation } from "./removeRepresentation";
import { unassignRepresentation } from "./unassignRepresentation";

export interface CopyRepresentationSettings {
	/** The element to copy the representation from. */
	source: EntityInstance;
	/** The element to assign the copied representation to. */
	target: EntityInstance;
	/** The `RepresentationIdentifier` to look up on `source` (e.g. `"Body"`, `"Axis"`, `"Box"`). Python default: `"Body"`. */
	contextIdentifier?: RepresentationIdentifier;
}

function copyRepresentationUsecase(file: IfcFile, settings: CopyRepresentationSettings): EntityInstance | undefined {
	const { source, target } = settings;
	const contextIdentifier = settings.contextIdentifier ?? "Body";

	const sourceRep = getRepresentation(source, "Model", contextIdentifier);
	if (sourceRep === null) return undefined;

	const newRep = elementUtil.copyDeep(file, sourceRep, ["IfcGeometricRepresentationContext"]);

	const existingRep = getRepresentation(target, "Model", contextIdentifier);
	if (existingRep) {
		unassignRepresentation(file, { product: target, representation: existingRep });
		removeRepresentation(file, { representation: existingRep });
	}

	assignRepresentation(file, { product: target, representation: newRep });
	return newRep;
}

/**
 * Copies a geometric representation from one element to another (Python:
 * `ifcopenshell.api.geometry.copy_representation`).
 *
 * Finds the named representation on `source`, deep-copies its entity graph (geometry
 * items, profiles, placements, etc. -- `GlobalId`s are regenerated where applicable),
 * and assigns the copy to `target`. Representation contexts are shared, not copied. If
 * `target` already has a matching representation it is removed and replaced.
 *
 * @returns The newly created `IfcShapeRepresentation`, or `undefined` if no matching
 * representation was found on `source` (in which case `target` is left unchanged).
 *
 * @example
 * ```ts
 * const wallA = file.byId(1);
 * const wallB = file.byId(2);
 *
 * // Give wallB the same body geometry as wallA.
 * api.geometry.copyRepresentation(model, { source: wallA, target: wallB });
 * ```
 */
export const copyRepresentation = wrapUsecase("geometry.copy_representation", copyRepresentationUsecase);
