// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/georeference/remove_georeferencing.py` (src/ifcopenshell-
// python, 51 lines) -- part of this project's brand-new `api.georeference` module (see
// `./index.ts`'s own header comment). Removes all georeferencing data: `IfcProjectedCRS`/
// `IfcCoordinateOperation` (IFC4+), or the `ePSet_ProjectedCRS`/`ePSet_MapConversion`
// psets on `IfcProject` (IFC2X3).
//
// --- IFC2X3 branch: fully functional, no gap of any kind ---
//
// `util.element.getPset`/`api.pset.removePset` are both already fully landed and
// unaffected by `./addGeoreferencing.ts`'s/`./editGeoreferencing.ts`'s own disclosed
// primitive-layer gap -- neither ever constructs a brand-new standalone typed value
// (`removePset` only ever deletes existing entities, per its own header comment).
//
// --- IFC4+ branch: another real, confirmed hit of the already-disclosed native
// inverse-index bug, worked around the SAME way `../boundary/removeBoundary.ts` already
// does for its own structurally-identical case, NOT a new pattern ---
//
// Real Python:
// ```python
// for projected_crs in file.by_type("IfcProjectedCRS"):
//     if (unit := projected_crs.MapUnit) and file.get_total_inverses(unit) == 1:
//         projected_crs.MapUnit = None
//         ifcopenshell.util.element.remove_deep2(file, unit)
//     file.remove(projected_crs)
// for coordinate_operation in file.by_type("IfcCoordinateOperation"):
//     file.remove(coordinate_operation)
// ```
// `projected_crs.MapUnit = None` (a single-entity-typed attribute nulled via `.set()`) is
// the identical confirmed-buggy sequence `./editTrueNorth.ts`'s own header comment
// documents in detail (this port's `EntityInstance.set(name, null)` doesn't correctly
// unregister the old value's inverse, so a subsequent `getTotalInverses`/`removeDeep2`
// call on it would incorrectly see it as still referenced). Confirmed empirically
// against this worktree's own built native addon before writing this file.
//
// This port applies `../boundary/removeBoundary.ts`'s own exact technique (there,
// `boundary` is the entity about to be deleted right after; here, `projectedCrs` plays
// that same role): the pre-existing `MapUnit` reference is deliberately left LIVE and
// UNTOUCHED, and `removeDeep2(file, unit, [projectedCrs])` is called directly, while
// `getTotalInverses(unit) === 1` is checked BEFORE any mutation (exactly matching real
// Python's own check, which is likewise evaluated before the `None` assignment) --
// `removeDeep2`'s own `alsoConsider` containment check sees the still-live forward
// reference and correctly treats it as "about to be removed anyway", satisfying its
// guard without ever exercising the buggy null-assignment path. `file.remove(
// projectedCrs)` (called unconditionally right after, exactly like real Python) then
// deletes `projectedCrs` itself regardless of whatever `MapUnit` currently points to --
// no explicit clear is needed at all, since the whole entity is being deleted. Net
// effect: byte-for-byte identical to real Python's own final state (a shared `MapUnit`
// is correctly left alone; a `MapUnit` referenced only by this `projectedCrs` is
// correctly purged) without ever hitting the disclosed bug. Verified with a dedicated
// regression test (`../../../test/api/georeference/removeGeoreferencing.test.ts`)
// asserting an orphaned `MapUnit` is genuinely removed.
//
// `coordinate_operation`'s own removal loop needs no such workaround -- `file.remove(
// coordinate_operation)` is a plain, unconditional deletion with no attribute-nulling
// step of any kind.
//
// --- Schema divergence: `IfcProjectedCRS`/`IfcCoordinateOperation` don't exist on
// IFC2X3 at all -- see `./addGeoreferencing.ts`'s own header comment for the full
// confirmation against the generated `.d.ts`s.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { removePset } from "../pset/removePset";

/**
 * Real Python's `remove_georeferencing(file)` takes no parameters at all beyond `file`.
 * Kept as an explicit (empty) settings type rather than dropping the parameter entirely,
 * matching this project's established "every usecase takes a `(file, settings)` pair"
 * `wrapUsecase` convention (see e.g. `../constraint/addObjective.ts`'s own identical
 * `AddObjectiveSettings`) -- call sites pass `{}`.
 */
export type RemoveGeoreferencingSettings = Record<string, never>;

function removeGeoreferencingUsecase(file: IfcFile, _settings: RemoveGeoreferencingSettings): void {
	if (file.schema === "IFC2X3") {
		const project = file.byType("IfcProject")[0];
		const crsPset = elementUtil.getPset(project, "ePSet_ProjectedCRS") as Record<string, unknown> | null;
		if (crsPset) {
			removePset(file, { product: project, pset: file.byId(crsPset.id as number) });
		}
		const conversionPset = elementUtil.getPset(project, "ePSet_MapConversion") as Record<string, unknown> | null;
		if (conversionPset) {
			removePset(file, { product: project, pset: file.byId(conversionPset.id as number) });
		}
		return;
	}

	for (const projectedCrs of file.byType("IfcProjectedCRS")) {
		const unit = projectedCrs.get("MapUnit") as EntityInstance | null;
		if (unit && file.getTotalInverses(unit) === 1) {
			// `MapUnit` is deliberately left untouched here -- see this file's header
			// comment for why `removeDeep2`'s own `[projectedCrs]` `alsoConsider` argument
			// (evaluated while the reference is still live) reaches the same correct end
			// state without hitting the disclosed native inverse-index bug.
			elementUtil.removeDeep2(file, unit, [projectedCrs]);
		}
		file.remove(projectedCrs);
	}
	for (const coordinateOperation of file.byType("IfcCoordinateOperation")) {
		file.remove(coordinateOperation);
	}
}

/**
 * Remove georeferencing data (Python: `ifcopenshell.api.georeference.remove_georeferencing`).
 *
 * All georeferencing parameters such as projected CRS and map conversion data will be
 * lost.
 *
 * In IFC2X3, the psets will be removed from the `IfcProject`.
 *
 * @example
 * ```ts
 * api.georeference.addGeoreferencing(model, {});
 * // Let's change our mind.
 * api.georeference.removeGeoreferencing(model, {});
 * ```
 */
export const removeGeoreferencing = wrapUsecase("georeference.remove_georeferencing", removeGeoreferencingUsecase);
