// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/boundary/remove_boundary.py` (src/ifcopenshell-python, 48
// lines) -- part of this project's brand-new `api.boundary` module (see `./index.ts`'s
// own header comment). Removes an `IfcRelSpaceBoundary`, purging its
// `ConnectionGeometry` (if any) and `OwnerHistory` (if any), neither of which is
// touched by the relating space or related building element themselves.
//
// --- Another confirmed hit of the already-disclosed native inverse-index bug
//     (`TODOS.md`'s "clearing an entity/aggregate-of-entity attribute to null via
//     .set() leaves a stale inverse-index entry") -- worked around the exact same way
//     `../resource/removeResourceQuantity.ts`/`../geometry/editObjectPlacement.ts`/
//     `../root/removeProduct.ts` already do for their own structurally-identical
//     single-entity-attribute-nulling cases, not a new pattern ---
//
// Real Python:
// ```python
// geometry = boundary.ConnectionGeometry
// if geometry:
//     boundary.ConnectionGeometry = None
//     ifcopenshell.util.element.remove_deep2(file, geometry)
// history = boundary.OwnerHistory
// file.remove(boundary)
// if history:
//     ifcopenshell.util.element.remove_deep2(file, history)
// ```
// Nulling `boundary.ConnectionGeometry` first is real Python's own way of dropping
// `geometry`'s inverse count to 0 so `remove_deep2`'s own `total_inverses(element) > 0`
// guard doesn't refuse to remove it (`boundary` is `geometry`'s only real reference at
// this point for any boundary created through this project's own `assignConnectionGeometry`).
//
// This port does NOT null `ConnectionGeometry` directly: `EntityInstance.set(name,
// null)` for a single-entity-typed attribute has the disclosed native primitive-layer
// bug above -- confirmed EMPIRICALLY against this worktree's own built native addon
// for THIS specific case (not assumed from the other, structurally-similar call
// sites' own writeups): explicitly nulling `boundary.ConnectionGeometry` first, THEN
// calling `removeDeep2(file, geometry)`, silently no-ops forever
// (`getTotalInverses(geometry)` stays stuck at 1), leaving `geometry` permanently
// orphaned. Instead, `removeDeep2`'s own `alsoConsider` parameter is used to reach the
// exact same correct end state via a different, unaffected code path: `geometry` is
// read but `boundary.ConnectionGeometry` is deliberately left UNTOUCHED (still
// pointing at `geometry`) at the moment `removeDeep2(file, geometry, [boundary])` is
// called, so its inverse-containment check sees `boundary`'s one real, still-live
// forward reference (reachable within one `traverse` level) and treats it as "also
// being removed", satisfying the guard without ever touching the buggy
// null-assignment path. `IfcFile.remove`'s own documented behavior ("attribute values
// in other entity instances that reference the deleted object will be set to null")
// then automatically nulls `boundary.ConnectionGeometry` as a side effect of deleting
// `geometry` itself -- confirmed empirically to reach the identical final state real
// Python's own `None`-assignment achieves, moments before `boundary` itself is deleted
// anyway at the end of this function. Verified with a dedicated regression test
// (`../../../test/api/boundary/removeBoundary.test.ts`, porting real Python's own
// `test_removing_connection_geometry`) asserting BOTH the boundary and the geometry
// are gone afterward.
//
// `history` needs no such workaround: by the time `removeDeep2(file, history)` runs,
// `boundary` itself has already been fully deleted by the preceding `file.remove(boundary)`
// call, so `history`'s only real forward-reference-holder is already gone from the
// file and its own inverse count is genuinely 0 -- matching
// `../root/removeProduct.ts`'s own `removeWithOwnerHistory` helper's identical,
// already-established "no alsoConsider needed here" precedent for the exact same
// reason (duplicated here per this project's "small per-module private helpers"
// convention rather than imported, since it's a two-line, boundary-specific sequence,
// not a general-purpose export).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

export interface RemoveBoundarySettings {
	/** The `IfcRelSpaceBoundary` you want to remove. */
	boundary: EntityInstance;
}

function removeBoundaryUsecase(file: IfcFile, settings: RemoveBoundarySettings): void {
	const { boundary } = settings;

	const geometry = boundary.get("ConnectionGeometry") as EntityInstance | null;
	if (geometry) {
		// See this file's header comment: `boundary.ConnectionGeometry` is deliberately
		// NOT nulled here -- `removeDeep2`'s own `[boundary]` `alsoConsider` argument
		// below, plus `IfcFile.remove`'s own auto-nulling, reaches the same end state
		// without hitting the disclosed native inverse-index bug.
		elementUtil.removeDeep2(file, geometry, [boundary]);
	}

	const history = boundary.get("OwnerHistory") as EntityInstance | null;
	file.remove(boundary);
	if (history) {
		elementUtil.removeDeep2(file, history);
	}
}

/**
 * Removes a space boundary (Python: `ifcopenshell.api.boundary.remove_boundary`).
 *
 * The relating space or related building element is untouched. Only the boundary and
 * its connection geometry is removed.
 *
 * @example
 * ```ts
 * // A boring boundary with no geometry. Note that this boundary is invalid and does
 * // not relate to any space or building element.
 * const boundary = api.root.createEntity(model, { ifcClass: "IfcRelSpaceBoundary" });
 *
 * // Let's remove it!
 * api.boundary.removeBoundary(model, { boundary });
 * ```
 */
export const removeBoundary = wrapUsecase("boundary.remove_boundary", removeBoundaryUsecase);
