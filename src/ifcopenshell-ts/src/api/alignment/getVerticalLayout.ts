// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_vertical_layout.py` (src/ifcopenshell-python,
// 31 lines) -- structurally identical to `./getHorizontalLayout.ts`'s own port (same
// traversal, different target class) -- see that file's own header comment for the
// full writeup (no dependency, no blocker, IFC4X3-only schema constraint) and
// `./index.ts`'s own header comment for this brand-new module's full scope.
import type { EntityInstance } from "../../entityInstance";

/**
 * Returns the `IfcAlignmentVertical` nested to this alignment (Python:
 * `ifcopenshell.api.alignment.get_vertical_layout`).
 *
 * @param alignment The `IfcAlignment`.
 * @returns The `IfcAlignmentVertical`, or `null` if none is nested to it.
 */
export function getVerticalLayout(alignment: EntityInstance): EntityInstance | null {
	for (const rel of alignment.get("IsNestedBy") as EntityInstance[]) {
		for (const layout of rel.get("RelatedObjects") as EntityInstance[]) {
			if (layout.isA("IfcAlignmentVertical")) return layout;
		}
	}
	return null;
}
