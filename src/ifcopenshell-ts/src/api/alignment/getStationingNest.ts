// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_stationing_nest.py` (src/ifcopenshell-python,
// 45 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). No dependency of any kind, no blocker.
//
// Real Python's own `file: ifcopenshell.file` parameter is UNUSED by the function
// body (confirmed by reading the full real source -- only `alignment` is ever
// touched) -- ported verbatim, including the unused parameter (prefixed `_file` here,
// matching `../context/editContext.ts`'s own established convention for an unused
// leading `file` parameter, rather than silently dropping it and diverging from real
// Python's own signature).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";

/**
 * Searches for the `IfcRelNests` that defines the alignment's stationing scheme
 * (Python: `ifcopenshell.api.alignment.get_stationing_nest`).
 *
 * The returned nest is nested to the `IfcAlignment` and its `RelatedObjects` contains
 * only the `IfcReferent`(s) (`PredefinedType="STATION"`) that establish the
 * alignment's starting station and any station equations along it, as created by
 * `addStationingReferent`. It does not contain any other kind of referent (e.g.
 * key-point referents from `updateKeyPointReferents` live in their own, separate
 * `IfcRelNests`).
 *
 * @param _file Unused -- see this file's own header comment.
 * @param alignment The `IfcAlignment` which hosts the stationing `IfcReferent`(s).
 * @returns The `IfcRelNests`, or `null` if none is found.
 * @throws {TypeError} If `alignment` is not an `IfcAlignment`.
 */
export function getStationingNest(_file: IfcFile, alignment: EntityInstance): EntityInstance | null {
	if (!alignment.isA("IfcAlignment")) {
		throw new TypeError(`Expected IfcAlignment, instead received ${alignment.isA()}`);
	}

	for (const nest of alignment.get("IsNestedBy") as EntityInstance[]) {
		for (const relatedObject of nest.get("RelatedObjects") as EntityInstance[]) {
			if (relatedObject.isA("IfcReferent")) return nest;
		}
	}
	return null;
}
