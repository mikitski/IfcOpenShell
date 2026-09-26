// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create_by_pi_method.py` (src/ifcopenshell-python,
// ~63 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 8 of many, the LAST chunk for this module). PUBLIC (confirmed present in
// real Python's own `__init__.py` `__all__`). Depends on this chunk's own `create` (file
// 4, `./create.ts`), already-landed `getHorizontalLayout`/`getVerticalLayout` (chunk 1),
// this module's own `addStationingReferent` (chunk 4), `util.alignment.stationAsString`,
// and this chunk's own `layoutHorizontalAlignmentByPiMethod`/
// `layoutVerticalAlignmentByPiMethod` (files 7-8 of this chunk) -- all verified directly
// against their real exported name/signature before use.
//
// --- UPDATE (upstream sync chunk 3 of 4, upstream commit
//     `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`): `startStation` is now OPTIONAL
//     (default `null`), and the stationing referent is created by THIS function, not by
//     `create()` ---
//
// See `TODOS.md`'s "Upstream sync, chunk 3 of 4" entry, and `./create.ts`'s own header
// comment for why `create()` no longer auto-creates a stationing referent at all. Real
// Python's own new body: `create(file, name, include_vertical=include_vertical)` (no
// `start_station` argument -- that parameter no longer exists on `create()`), then the
// horizontal/vertical layout construction exactly as before, then -- only when
// `start_station is not None` -- a direct `add_stationing_referent(...)` call, placed
// AFTER the horizontal layout has been built (so a real, non-empty basis curve exists by
// then, unlike `create()`'s own now-reverted automatic call, which used to run before any
// layout segment existed at all).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { stationAsString } from "../../util/alignment";
import { addStationingReferent } from "./addStationingReferent";
import { create } from "./create";
import { getHorizontalLayout } from "./getHorizontalLayout";
import { getVerticalLayout } from "./getVerticalLayout";
import { layoutHorizontalAlignmentByPiMethod } from "./layoutHorizontalAlignmentByPiMethod";
import { layoutVerticalAlignmentByPiMethod } from "./layoutVerticalAlignmentByPiMethod";

/**
 * Creates an alignment using the PI layout method for both horizontal and vertical
 * alignments (Python: `ifcopenshell.api.alignment.create_by_pi_method`). If `vpoints`
 * and `lengths` are omitted, only a horizontal alignment is created.
 *
 * @param file The file.
 * @param name Value for the `Name` attribute.
 * @param hpoints (X, Y) pairs denoting the location of the horizontal PIs, including
 *   start and end.
 * @param radii Radii values to use for transition.
 * @param vpoints (distance_along, Z_height) pairs denoting the location of the vertical
 *   PIs, including start and end.
 * @param lengths Parabolic vertical curve horizontal length values to use for
 *   transition.
 * @param startStation If given, the starting station value. A `STATION` `IfcReferent`
 *   named "<name> <station string>" is added at distance along `0.0` once the geometry
 *   exists. If `null` (the default), no stationing referent is created and
 *   `getAlignmentStartStation()` reports `0.0`.
 * @returns The new `IfcAlignment`.
 */
export function createByPiMethod(
	file: IfcFile,
	name: string,
	hpoints: readonly (readonly number[])[],
	radii: readonly number[],
	vpoints: readonly (readonly number[])[] | null = null,
	lengths: readonly number[] | null = null,
	startStation: number | null = null,
): EntityInstance {
	const includeVertical = Boolean(vpoints?.length) && Boolean(lengths?.length);
	const alignment = create(file, name, includeVertical);
	const horizontalLayout = getHorizontalLayout(alignment) as EntityInstance;
	layoutHorizontalAlignmentByPiMethod(file, horizontalLayout, hpoints, radii);
	if (includeVertical) {
		const verticalLayout = getVerticalLayout(alignment) as EntityInstance;
		layoutVerticalAlignmentByPiMethod(
			file,
			verticalLayout,
			vpoints as readonly (readonly number[])[],
			lengths as readonly number[],
		);
	}

	if (startStation !== null) {
		const referentName = `${name} ${stationAsString(file, startStation)}`;
		addStationingReferent(file, referentName, alignment, 0.0, startStation);
	}

	return alignment;
}
