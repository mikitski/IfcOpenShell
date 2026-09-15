// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/remove_styled_representation.py`
// (src/ifcopenshell-python, 49 lines) -- chunk 1 of 2 for `api.style` (see
// `./index.ts`'s own header comment). No sibling `api.style`/`util` dependency of any
// kind -- the only import in the real source is bare `ifcopenshell`.
//
// Removes an `IfcStyledRepresentation` (typically the one representation inside an
// `IfcMaterialDefinitionRepresentation`, i.e. a material's own style), WITHOUT removing
// the underlying `IfcPresentationStyle`/`IfcSurfaceStyle` objects it references (real
// Python's own docstring: "This removes the representation but not the underlying
// styles"). Cascades into: any `IfcMaterialDefinitionRepresentation` that would be left
// with zero representations, and any `IfcStyledItem` owned by this representation that
// (a) has no OTHER inverse reference at all (`get_total_inverses(item) == 1` -- the "1"
// being this very representation's own `Items` reference) and (b) wraps its styles in
// an `IfcPresentationStyleAssignment` (which IS removed here, unlike the bare
// `IfcPresentationStyle`/`IfcSurfaceStyle` etc. it assigns, which are deliberately left
// alone -- see this file's own quirk section below).
//
// --- Real, disclosed quirk, ported verbatim: only `IfcPresentationStyleAssignment` is
// removed from `item.Styles`, not any bare `IfcPresentationStyle` ---
//
// Real Python's inner loop reads:
//
//     for style in item.Styles:
//         if style.is_a("IfcPresentationStyleAssignment"):
//             self.file.remove(style)
//
// -- i.e. when an orphaned `IfcStyledItem` is being removed, only its
// `IfcPresentationStyleAssignment` wrapper(s) (a deprecated-but-still-legal IFC2X3/IFC4
// indirection layer, removed entirely in IFC4X3 -- confirmed absent from
// `ifc4x3.d.ts`) are cleaned up alongside it; a real `IfcSurfaceStyle`/`IfcCurveStyle`/
// etc. directly present in `item.Styles` (IFC4+ allows both shapes, per
// `IfcStyledItem.Styles`'s own union type in `ifc4.d.ts`) is left in the file
// untouched, exactly matching this function's own stated contract of never removing
// "the underlying styles" -- ported verbatim, not "improved" to also clean up bare
// styles for symmetry.
//
// --- Positional/by-name attribute access, verified against generated `.d.ts`s ---
//
// `IfcMaterialDefinitionRepresentation.Representations`, `IfcStyledRepresentation.Items`,
// `IfcStyledItem.Styles` are all read by name (`.get(...)`) -- this file only ever
// reads/removes existing entities, never constructs new ones.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface RemoveStyledRepresentationSettings {
	/** The `IfcStyledRepresentation` to remove. */
	representation: EntityInstance;
}

function removeStyledRepresentationUsecase(file: IfcFile, settings: RemoveStyledRepresentationSettings): void {
	const { representation } = settings;

	for (const inverse of file.getInverse(representation) as Set<EntityInstance>) {
		if (
			inverse.isA("IfcMaterialDefinitionRepresentation") &&
			(inverse.get("Representations") as EntityInstance[]).length === 1
		) {
			file.remove(inverse);
		}
	}

	for (const item of representation.get("Items") as EntityInstance[]) {
		if (item.isA("IfcStyledItem") && file.getTotalInverses(item) === 1) {
			// See this file's own header comment -- only IfcPresentationStyleAssignment
			// wrappers are removed here, not any bare IfcPresentationStyle they wrap.
			for (const style of item.get("Styles") as EntityInstance[]) {
				if (style.isA("IfcPresentationStyleAssignment")) {
					file.remove(style);
				}
			}
			file.remove(item);
		}
	}

	file.remove(representation);
}

/**
 * Removes a styled representation (Python:
 * `ifcopenshell.api.style.remove_styled_representation`).
 *
 * Styled representations are typically associated with materials. This removes the
 * representation but not the underlying styles.
 *
 * @example
 * ```ts
 * // Remove a styled representation
 * api.style.removeStyledRepresentation(model, { representation });
 * ```
 */
export const removeStyledRepresentation = wrapUsecase(
	"style.remove_styled_representation",
	removeStyledRepresentationUsecase,
);
