// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_alignment.py` (src/ifcopenshell-python, 31
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). No dependency of any kind, no blocker.
import type { EntityInstance } from "../../entityInstance";

/**
 * Returns the alignment that nests this layout (Python:
 * `ifcopenshell.api.alignment.get_alignment`).
 *
 * @param layout The `IfcAlignmentHorizontal`/`IfcAlignmentVertical`/`IfcAlignmentCant`.
 * @returns The `IfcAlignment` this layout is nested to, or `null` if none is found.
 */
export function getAlignment(layout: EntityInstance): EntityInstance | null {
	for (const nest of layout.get("Nests") as EntityInstance[]) {
		const relatingObject = nest.get("RelatingObject") as EntityInstance;
		if (relatingObject.isA("IfcAlignment")) return relatingObject;
	}
	return null;
}
