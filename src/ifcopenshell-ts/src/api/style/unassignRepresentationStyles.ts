// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/unassign_representation_styles.py`
// (src/ifcopenshell-python, 98 lines) -- chunk 1 of 2 for `api.style` (see
// `./index.ts`'s own header comment). No sibling `api.style` dependency of any kind --
// the only import in the real source is bare `ifcopenshell`. This is `./
// unassignMaterialStyle.ts`'s own one real `api.style` dependency, landed in this same
// chunk (no cross-chunk ordering blocker).
//
// Reverses `api.style.assign_representation_styles` (a chunk 2 function, NOT yet
// ported -- see `./index.ts`'s own header comment): removes styles directly assigned to
// an object's own `IfcShapeRepresentation` (as opposed to a material-level style, which
// `./unassignMaterialStyle.ts` handles). This is a pure, self-contained "reader/mutator
// of already-existing entities" function -- no `createEntity` calls at all.
//
// --- IFC2X3-only `IfcPresentationStyleAssignment` indirection, ported verbatim ---
//
// `use_style_assignment` is `True` when `file.schema == "IFC2X3"` (unconditionally, no
// caller override possible on that schema) OR the caller explicitly opts in via
// `should_use_presentation_style_assignment` (documented as a Revit-compatibility
// workaround, producing non-compliant-but-Revit-friendly IFC on IFC4/IFC4X3). When
// true, before removing `styles` from a styled item's OWN `Styles` list, this first
// unwraps and cleans any `IfcPresentationStyleAssignment` found among that item's
// `Styles` (`remove_styles` is called once per matching assignment, THEN once more,
// unconditionally, on the styled item itself) -- ported with the exact same two-step
// shape, not merged into one pass.
//
// --- `item = item.StyledByItem[0]` variable-reuse, ported as a new binding (TS `for`
// loop variables are not reassignable) ---
//
// Real Python reassigns its own loop variable `item` mid-iteration (first the
// `IfcGeometricRepresentationItem`, then -- after confirming `item.StyledByItem` is
// non-empty -- the `IfcStyledItem` wrapping it) purely as a matter of Python style; this
// port introduces a second `const styledItem` binding instead (the underlying `for`
// loop variable here is a TS `for...of` binding, not reassignable), with identical
// control flow and no behavior change.
//
// --- Real, disclosed docstring/return-value mismatch, NOT reproduced (not observable
// either way) ---
//
// Real Python's own docstring says "`:return: None`", yet its `Usecase.execute` has an
// early `return []` (only reached when `styles` is empty) with no explicit `return`
// statement at the end of its main body (implicitly `None`) -- so the real function
// actually returns `[]` or `None` depending on the `styles` argument, contradicting its
// own docs. No caller anywhere (including every real Python test for this function)
// ever uses the return value, so this port's `unassignRepresentationStyles` is typed
// `void` throughout rather than reproducing this inconsequential inconsistency.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

function removeStylesFrom(file: IfcFile, item: EntityInstance, stylesToRemove: readonly EntityInstance[]): void {
	const currentStyles = item.get("Styles") as EntityInstance[];
	const remaining = currentStyles.filter((s) => !stylesToRemove.some((toRemove) => s.equals(toRemove)));
	if (remaining.length === 0) {
		file.remove(item);
	} else if (remaining.length !== currentStyles.length) {
		item.set("Styles", remaining);
	}
}

export interface UnassignRepresentationStylesSettings {
	/** The `IfcShapeRepresentation` of the object that you want to unassign styles from. */
	shapeRepresentation: EntityInstance;
	/**
	 * A list of presentation styles, typically `IfcSurfaceStyle`. The number of items in
	 * the list should correlate with the number of items in the `shapeRepresentation`'s
	 * `Items` attribute. If you have more items than styles, the last style is used.
	 */
	styles: readonly EntityInstance[];
	/**
	 * This is a technical detail to accommodate a bug in Revit. This should always be
	 * left as the default of `false`, unless you are finding that colours aren't showing
	 * up in Revit. In that case, set it to `true`, but keep in mind that this is no
	 * longer a valid IFC. Blame Autodesk.
	 */
	shouldUsePresentationStyleAssignment?: boolean;
}

function unassignRepresentationStylesUsecase(file: IfcFile, settings: UnassignRepresentationStylesSettings): void {
	const styles = settings.styles ?? [];
	if (styles.length === 0) return;
	const useStyleAssignment = file.schema === "IFC2X3" || (settings.shouldUsePresentationStyleAssignment ?? false);

	for (const element of file.traverse(settings.shapeRepresentation)) {
		if (!element.isA("IfcShapeRepresentation")) continue;
		for (const item of element.get("Items") as EntityInstance[]) {
			if (!item.isA("IfcGeometricRepresentationItem")) continue;

			const styledByItem = (item.get("StyledByItem") as EntityInstance[] | null) ?? [];
			if (styledByItem.length === 0) continue;

			const styledItem = styledByItem[0];
			if (useStyleAssignment) {
				for (const style_ of styledItem.get("Styles") as EntityInstance[]) {
					if (style_.isA("IfcPresentationStyleAssignment")) {
						removeStylesFrom(file, style_, styles);
					}
				}
			}
			removeStylesFrom(file, styledItem, styles);
		}
	}
}

/**
 * Unassigns styles directly assigned to an object representation (Python:
 * `ifcopenshell.api.style.unassign_representation_styles`).
 *
 * This does the inverse of `api.style.assignRepresentationStyles` (a chunk 2 function,
 * not yet ported -- see `./index.ts`'s own header comment).
 *
 * @example
 * ```ts
 * api.style.unassignRepresentationStyles(model, { shapeRepresentation: representation, styles: [style] });
 * ```
 */
export const unassignRepresentationStyles = wrapUsecase(
	"style.unassign_representation_styles",
	unassignRepresentationStylesUsecase,
);
