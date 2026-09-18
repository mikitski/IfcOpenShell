// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create_by_pi_method.py` (src/ifcopenshell-python,
// 57 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 8 of many, the LAST chunk for this module). PUBLIC (confirmed present in
// real Python's own `__init__.py` `__all__`). Depends on this chunk's own `create`
// (file 4, `./create.ts`), already-landed `getHorizontalLayout`/`getVerticalLayout`
// (chunk 1), and this chunk's own `layoutHorizontalAlignmentByPiMethod`/
// `layoutVerticalAlignmentByPiMethod` (files 7-8 of this chunk) -- all verified
// directly against their real exported name/signature before use.
//
// --- A thin wrapper: real, portable `includeVertical` boolean logic, then the
//     unconditionally-blocked `create()` call, reached immediately ---
//
// Real Python's own `include_vertical = True if vpoints and lengths else False` is a
// plain truthiness check (an empty list/`None` for either is falsy) -- ported with the
// identical truthiness shape (`Boolean(vpoints?.length) && Boolean(lengths?.length)`,
// matching Python's `and`-short-circuit precisely: BOTH must be non-empty).
// `ifcopenshell.api.alignment.create(...)` (this chunk's own file 4) is
// UNCONDITIONALLY blocked for every real invocation (see `./create.ts`'s own header
// comment), so this function throws immediately at that call, before
// `getHorizontalLayout`/`layoutHorizontalAlignmentByPiMethod`/`getVerticalLayout`/
// `layoutVerticalAlignmentByPiMethod` are ever reached -- ported completely and
// faithfully regardless, matching this project's "port every real branch up to the
// exact blocked call" discipline.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
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
 * **Currently unconditionally blocked** by `create()`'s own already-disclosed
 * `addStationingReferent` gap -- see this file's own header comment, and `./create.ts`'s
 * own, for the precise reason.
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
 * @param startStation Station value at the start of the alignment.
 * @returns The new `IfcAlignment`.
 * @throws {Error} Always, from the already-unconditionally-blocked `create()`.
 */
export function createByPiMethod(
	file: IfcFile,
	name: string,
	hpoints: readonly (readonly number[])[],
	radii: readonly number[],
	vpoints: readonly (readonly number[])[] | null = null,
	lengths: readonly number[] | null = null,
	startStation = 0.0,
): EntityInstance {
	const includeVertical = Boolean(vpoints?.length) && Boolean(lengths?.length);
	const alignment = create(file, name, includeVertical, false, true, startStation);
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

	return alignment;
}
