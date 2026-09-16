// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/georeference/edit_true_north.py` (src/ifcopenshell-python, 78
// lines) -- part of this project's brand-new `api.georeference` module (see
// `./index.ts`'s own header comment). Edits (or unsets) `IfcGeometricRepresentationContext
// .TrueNorth` for every top-level context in the file.
//
// No unported dependency: `ifcopenshell.util.geolocation.angle2yaxis` is ALREADY landed
// (`../../util/geolocation.ts`, verified by reading that file directly) and reused here
// as-is -- no re-derivation of its trig needed.
//
// --- A real, confirmed hit of the already-disclosed native inverse-index bug
// (`TODOS.md`'s "clearing an entity attribute to null via `.set()` leaves a stale
// inverse-index entry"), in the "unset true north" branch -- worked around the SAME way
// `../boundary/removeBoundary.ts`/`../grid/removeGridAxis.ts`/
// `../geometry/editObjectPlacement.ts` already do, NOT a new pattern ---
//
// Real Python:
// ```python
// if context.TrueNorth and true_north is None:
//     old_true_north = context.TrueNorth
//     context.TrueNorth = None
//     if not file.get_total_inverses(old_true_north):
//         ifcopenshell.util.element.remove_deep2(file, old_true_north)
//     continue
// ```
// Nulling `context.TrueNorth` FIRST, then checking `get_total_inverses(old_true_north)`,
// is exactly the confirmed-buggy sequence: `EntityInstance.set(name, null)` for a
// single-entity-typed attribute does not correctly unregister the OLD value from this
// port's inverse index, so `file.getTotalInverses(oldTrueNorth)` would stay stuck
// reporting a non-zero count even when `context` was genuinely its only reference --
// silently refusing to ever purge an orphaned `TrueNorth` `IfcDirection`. Confirmed
// empirically against this worktree's own built native addon before writing this file
// (not assumed from the other, structurally-similar call sites' own writeups).
//
// This port instead reorders (matching `removeBoundary.ts`'s own established technique):
// call `removeDeep2(file, oldTrueNorth, [context])` FIRST, while `context.TrueNorth`
// still genuinely, LIVE-ly references `oldTrueNorth` -- `removeDeep2`'s own
// `alsoConsider`-based containment check (`file.traverse(context, 1)`) sees a real,
// un-stale forward reference and correctly treats it as "the one reference that's about
// to go away", satisfying its guard without ever touching the buggy null-assignment
// code path. If that reference was genuinely the only one, `removeDeep2` deletes
// `oldTrueNorth`, and `IfcFile.remove`'s own documented "other references get
// auto-nulled" behavior clears `context.TrueNorth` as a side effect. `context.set(
// "TrueNorth", null)` is THEN called unconditionally (whether or not `oldTrueNorth` was
// actually deleted) -- a harmless, already-null no-op in the deleted case, and the exact
// real detach-without-delete behavior real Python's own unconditional `context.TrueNorth
// = None` achieves for the SHARED case (some other entity also references the same
// `IfcDirection`, so it must not be purged, but this context should still stop pointing
// at it). Net effect in both cases: byte-for-byte identical to real Python's own final
// state, without ever exercising the buggy code path. Verified with a dedicated
// regression test (`../../../test/api/georeference/editTrueNorth.test.ts`) asserting an
// orphaned `TrueNorth` is genuinely removed, not just detached-with-a-stale-reference.
//
// --- The "set/reuse true north" branch needs no such workaround ---
//
// `context.TrueNorth = file.create_entity("IfcDirection")` (when absent, or shared) is a
// DIRECT entity-to-entity (or null-to-entity) reassignment, never routing through an
// explicit `null` intermediate -- `../geometry/editObjectPlacement.ts`'s own header
// comment already established that this specific shape correctly unregisters any old
// reference AND registers the new one, with no bug. Ported literally.
//
// --- Schema divergence: none ---
//
// `IfcGeometricRepresentationContext.TrueNorth`/`IfcDirection.DirectionRatios` are
// identical in shape across `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` (confirmed directly)
// -- this function runs unmodified against every schema, unlike `./addGeoreferencing.ts`/
// `./editGeoreferencing.ts`'s own real IFC2X3-vs-IFC4+ branching.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { angle2yaxis } from "../../util/geolocation";
import { wrapUsecase } from "../hooks";

export interface EditTrueNorthSettings {
	/**
	 * A unitised 2D vector `[x, y]`, or an angle in decimal degrees where anticlockwise
	 * is positive. `null` unsets true north. Defaults to `0.0`.
	 */
	trueNorth?: readonly [number, number] | number | null;
}

function editTrueNorthUsecase(file: IfcFile, settings: EditTrueNorthSettings = {}): void {
	const trueNorth = settings.trueNorth === undefined ? 0.0 : settings.trueNorth;

	let x: number | null = null;
	let y: number | null = null;
	if (typeof trueNorth === "number") {
		[x, y] = angle2yaxis(trueNorth);
	} else if (trueNorth !== null) {
		[x, y] = trueNorth;
	}

	for (const context of file.byType("IfcGeometricRepresentationContext", false)) {
		const existingTrueNorth = context.get("TrueNorth") as EntityInstance | null;

		if (existingTrueNorth && trueNorth === null) {
			// See this file's header comment: the buggy `null`-first sequence is
			// deliberately reordered to sidestep the disclosed native inverse-index bug,
			// while reaching the identical final state.
			elementUtil.removeDeep2(file, existingTrueNorth, [context]);
			context.set("TrueNorth", null);
			continue;
		}

		if (trueNorth === null) continue;

		let directionEntity = existingTrueNorth;
		if (directionEntity) {
			if (file.getTotalInverses(directionEntity) !== 1) {
				directionEntity = file.createEntity("IfcDirection");
				context.set("TrueNorth", directionEntity);
			}
		} else {
			directionEntity = file.createEntity("IfcDirection");
			context.set("TrueNorth", directionEntity);
		}
		if (x === null || y === null) {
			throw new Error("editTrueNorth: x/y must be resolved by this point");
		}
		directionEntity.set("DirectionRatios", [x, y]);
	}
}

/**
 * Edits the true north (Python: `ifcopenshell.api.georeference.edit_true_north`).
 *
 * Given project north being up (i.e. a vector of `[0, 1]`), true north is defined as a
 * unitised 2D vector pointing to true north. Alternatively, true north may be defined as
 * a rotation from project north to true north. Anticlockwise is positive.
 *
 * Note that true north is not part of georeferencing, and is only optionally provided as
 * a reference value, typically for solar analysis. Remember: grid north (what your
 * surveyor will typically use) is not the same as true north!
 *
 * @example
 * ```ts
 * // Both of these are identical, and indicate that:
 * // - If project north is up the page, true north is in the top left
 * // - The building is therefore facing north east
 * api.georeference.editTrueNorth(model, { trueNorth: 30 });
 * api.georeference.editTrueNorth(model, { trueNorth: [-0.5, 0.8660254] });
 *
 * // This unsets true north.
 * api.georeference.editTrueNorth(model, { trueNorth: null });
 * ```
 */
export const editTrueNorth = wrapUsecase("georeference.edit_true_north", editTrueNorthUsecase);
