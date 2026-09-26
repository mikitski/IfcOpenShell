// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_horizontal_layout.py` (src/ifcopenshell-python,
// 31 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). A single, direct forward/inverse-attribute traversal, no
// dependency of any kind, no blocker.
//
// `IfcAlignment`/`IfcAlignmentHorizontal` are IFC4X3-only classes -- confirmed directly
// against all 3 generated `.d.ts`s (neither interface exists on `ifc2x3.d.ts`/
// `ifc4.d.ts` at all). This function itself has no schema-specific branching (plain
// `.isA()` checks work identically once such an instance exists at all), but it can
// only ever be called with a real `IfcAlignment` on an IFC4X3 model in practice --
// matching this whole module's own real Python docstring ("under development") and
// `./index.ts`'s own disclosed schema constraint.
import type { EntityInstance } from "../../entityInstance";

/**
 * Returns the `IfcAlignmentHorizontal` nested to this alignment (Python:
 * `ifcopenshell.api.alignment.get_horizontal_layout`).
 *
 * @param alignment The `IfcAlignment`.
 * @returns The `IfcAlignmentHorizontal`, or `null` if none is nested to it.
 */
export function getHorizontalLayout(alignment: EntityInstance): EntityInstance | null {
	for (const rel of alignment.get("IsNestedBy") as EntityInstance[]) {
		for (const layout of rel.get("RelatedObjects") as EntityInstance[]) {
			if (layout.isA("IfcAlignmentHorizontal")) return layout;
		}
	}
	return null;
}
