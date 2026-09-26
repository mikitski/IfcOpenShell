// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_alignment_start_station.py`
// (src/ifcopenshell-python, 48 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 2 of many). Depends on chunk 1's
// already-landed `getParentAlignment` (mutual recursion) and `util.element`'s already-
// landed `getComponents`/`getPset` -- no blocker.
//
// Real Python's own `file: ifcopenshell.file` parameter is UNUSED by the function
// body -- it is only ever threaded through to the recursive
// `get_alignment_start_station(file, parent_alignment)` call, never read directly.
// Ported verbatim, including the unused-but-threaded-through parameter (prefixed
// `_file` here, matching `./getStationingNest.ts`'s own established convention for an
// unused leading `file` parameter, and still threaded through the recursive call
// exactly as real Python does, rather than silently dropping it and diverging from
// real Python's own signature).
//
// --- A real quirk that contradicts the function's OWN docstring ---
//
// The docstring promises "otherwise returns 0.0", but the loop body is:
// `start_station = get_pset(...); if not start_station == None: break` -- note that
// `start_station` is assigned UNCONDITIONALLY on every `IfcReferent` component, even
// when `get_pset` returns `None` (no `Pset_Stationing.Station` on that referent),
// which OVERWRITES the `0.0` default -- the loop does not `continue`/skip past a
// `None` result, it just doesn't `break` yet. So if the alignment has at least one
// `IfcReferent` component and NONE of them (up to and including the last one
// iterated) carries a `Pset_Stationing.Station` value, this returns `None`, not
// `0.0` as documented -- only an alignment with ZERO `IfcReferent` components (the
// loop body never runs at all) actually returns the documented `0.0` default. Ported
// verbatim (the return type is `number | null` to reflect this, not narrowed to
// `number` to match the docstring's own claim).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getComponents, getPset } from "../../util/element";
import { getParentAlignment } from "./getParentAlignment";

/**
 * Returns the start station of the alignment (Python:
 * `ifcopenshell.api.alignment.get_alignment_start_station`). The starting station is
 * defined by the first nested `IfcReferent`. This is interpreted to mean the first
 * `IfcReferent` with an occurrence of `Pset_Stationing.Station`, otherwise returns
 * `0.0`.
 *
 * @param _file Unused -- see this file's own header comment.
 * @param alignment The `IfcAlignment`.
 * @returns The start station -- `0.0` only when `alignment` has no `IfcReferent`
 *   component at all; see this file's own header comment for the real Python
 *   docstring-contradicting quirk this can also return `null` for.
 * @throws {TypeError} If `alignment` is not an `IfcAlignment`.
 */
export function getAlignmentStartStation(_file: IfcFile, alignment: EntityInstance): number | null {
	if (!alignment.isA("IfcAlignment")) {
		throw new TypeError(`Expected entity type to be IfcAlignment, instead received ${alignment.isA()}`);
	}

	let startStation: number | null = 0.0;

	const parentAlignment = getParentAlignment(alignment);
	if (parentAlignment) {
		startStation = getAlignmentStartStation(_file, parentAlignment);
	} else {
		const components = getComponents(alignment);
		for (const c of components) {
			if (c.isA("IfcReferent")) {
				// Unconditional assignment, even when `null` -- see this file's own
				// header comment quirk.
				startStation = getPset(c, "Pset_Stationing", "Station") as number | null;
				if (startStation !== null) break;
			}
		}
	}

	return startStation;
}
