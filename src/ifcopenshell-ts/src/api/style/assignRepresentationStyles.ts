// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/assign_representation_styles.py`
// (src/ifcopenshell-python, 210 lines) -- chunk 2 of 2 for `api.style` (see
// `./index.ts`'s own header comment). No sibling `api.style` dependency of any kind --
// the only import in the real source is bare `ifcopenshell`.
//
// This is `./unassignRepresentationStyles.ts`'s exact inverse (see that file's own
// header comment, landed in chunk 1) -- assigns styles IN BULK, in order, to every
// `IfcGeometricRepresentationItem`/`IfcTopologicalRepresentationItem` under a given
// `IfcShapeModel` (walked via `file.traverse`, exactly like the unassign side), rather
// than one item at a time (`./assignItemStyle.ts`, this same chunk).
//
// --- `element.is_a("IfcShapeModel")`/two item classes -- a real, disclosed asymmetry
// with `unassignRepresentationStyles.ts`'s own narrower `"IfcShapeRepresentation"`/
// `"IfcGeometricRepresentationItem"`-only checks, NOT a bug in either file ---
//
// Real Python's `assign_representation_styles.py` checks `element.is_a("IfcShapeModel")`
// (the abstract supertype of BOTH `IfcShapeRepresentation` AND `IfcTopologyRepresentation`)
// and `item.is_a("IfcGeometricRepresentationItem") or item.is_a("IfcTopologicalRepresentationItem")`
// -- so, unlike the unassign side, this function also assigns styles onto topology
// representations (`IfcFace`/etc under an `IfcTopologyRepresentation`), pinned by real
// Python's own `test_assign_style_to_topology_representation`, ported below. Confirmed
// this genuine difference exists in real Python itself (re-read `unassign_representation
// _styles.py` directly: it really does only check `"IfcShapeRepresentation"`/
// `"IfcGeometricRepresentationItem"`) -- not something either TS port introduced.
//
// --- `styles.pop(0)`/"last style repeats" fallback, ported as a `shift()`-mutated
// local queue plus a persistent `style` binding across items ---
//
// `style` is declared ONCE, outside both loops (`element`/`item`), and only
// reassigned when the (locally-copied) `styles` queue still has entries -- once
// exhausted, every subsequent item silently reuses whatever `style` was last popped,
// exactly matching the docstring's own "If you have more items than styles, the last
// style is used." The initial `if not styles: return []` guard (before either loop
// starts) guarantees `style` is non-`null` by the time it's first read, mirroring real
// Python's own `assert style is not None` (kept below as a defensive, expected-
// unreachable check, not a real runtime possibility).
//
// --- `replace_previous_same_type_style` (default `true`) vs. the "collect and
// dedupe" fallback branch -- both ported verbatim, including the real
// `IfcPresentationStyleAssignment`-vs-bare-style bookkeeping ---
//
// See this function's own `remove_same_type_styles` helper (ported as
// `removeSameTypeStyles` below, reused by BOTH branches) and its own real, subtle
// distinction (flagged in real Python's own comment, preserved verbatim): when
// `use_style_assignment` is true and NO `style_assignment` has been found yet among a
// previously-styled item's own `Styles`, the FIRST `IfcPresentationStyleAssignment`
// encountered becomes the long-lived `styleAssignment` accumulator (pruned of
// same-type styles but kept, `removeItem=false`); every OTHER assignment encountered
// (whether because `use_style_assignment` is false, or because an accumulator was
// already found) is pruned AND deleted outright if left empty (`removeItem=true`) --
// this operates on the assignment object found IN THAT ITERATION, not the
// accumulator, so a second-or-later assignment on a file authored by third-party
// tooling (real Python's own comment cites AVEVA E3D, GitHub issue #7883) is correctly
// disposed of rather than silently merged into the first.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** See this function's own header comment -- shared by both the `replacePreviousSameTypeStyle` and fallback branches below. */
function removeSameTypeStyles(
	file: IfcFile,
	styleItem: EntityInstance,
	currentStyleType: string,
	removeItem: boolean,
): void {
	const styles = (styleItem.get("Styles") as EntityInstance[]).filter((s) => s.isA() !== currentStyleType);
	if (removeItem && styles.length === 0) {
		file.remove(styleItem);
	} else {
		styleItem.set("Styles", styles);
	}
}

export interface AssignRepresentationStylesSettings {
	/**
	 * The `IfcShapeRepresentation`/`IfcTopologyRepresentation` of the object that you
	 * want to assign styles to. This implicitly defines the context at which the styles
	 * should be used.
	 */
	shapeRepresentation: EntityInstance;
	/**
	 * A list of presentation styles, typically `IfcSurfaceStyle`. The number of items in
	 * the list should correlate with the number of items in the `shapeRepresentation`'s
	 * `Items` attribute. If you have more items than styles, the last style is used.
	 */
	styles: readonly EntityInstance[];
	/**
	 * Remove previously assigned styles of the same type as the currently assigned
	 * style. Defaults to `true`.
	 */
	replacePreviousSameTypeStyle?: boolean;
	/**
	 * This is a technical detail to accommodate a bug in Revit. This should always be
	 * left as the default of `false`, unless you are finding that colours aren't showing
	 * up in Revit. In that case, set it to `true`, but keep in mind that this is no
	 * longer a valid IFC. Blame Autodesk.
	 */
	shouldUsePresentationStyleAssignment?: boolean;
}

function assignRepresentationStylesUsecase(
	file: IfcFile,
	settings: AssignRepresentationStylesSettings,
): EntityInstance[] {
	const stylesQueue = [...(settings.styles ?? [])];
	if (stylesQueue.length === 0) return [];

	const results: EntityInstance[] = [];
	const useStyleAssignment = file.schema === "IFC2X3" || (settings.shouldUsePresentationStyleAssignment ?? false);
	const replacePreviousSameTypeStyle = settings.replacePreviousSameTypeStyle ?? true;

	let style: EntityInstance | null = null;
	for (const element of file.traverse(settings.shapeRepresentation)) {
		if (!element.isA("IfcShapeModel")) continue;
		for (const item of element.get("Items") as EntityInstance[]) {
			if (!item.isA("IfcGeometricRepresentationItem") && !item.isA("IfcTopologicalRepresentationItem")) continue;

			if (stylesQueue.length > 0) {
				style = stylesQueue.shift() as EntityInstance;
			}
			if (style === null) {
				// See this file's own header comment -- mirrors real Python's own `assert
				// style is not None`, expected unreachable (the initial empty-queue guard
				// above already returned).
				throw new Error("assignRepresentationStyles: unreachable -- style is null");
			}
			const name = style.get("Name") as string | null;
			const currentStyleType = style.isA();

			const styledByItem = (item.get("StyledByItem") as EntityInstance[] | null) ?? [];
			const prevStyledItem = styledByItem.length > 0 ? styledByItem[0] : null;
			let styleAssignment: EntityInstance | null = null;

			if (prevStyledItem === null) {
				if (useStyleAssignment) {
					styleAssignment = file.createEntity("IfcPresentationStyleAssignment", [style]);
					results.push(file.createEntity("IfcStyledItem", item, [styleAssignment], name));
				} else {
					results.push(file.createEntity("IfcStyledItem", item, [style], name));
				}
				continue;
			}

			if (replacePreviousSameTypeStyle) {
				removeSameTypeStyles(file, prevStyledItem, currentStyleType, false);
				for (const style_ of prevStyledItem.get("Styles") as EntityInstance[]) {
					if (!style_.isA("IfcPresentationStyleAssignment")) continue;
					if (useStyleAssignment && styleAssignment === null) {
						styleAssignment = style_;
						removeSameTypeStyles(file, styleAssignment, currentStyleType, false);
					} else {
						removeSameTypeStyles(file, style_, currentStyleType, true);
					}
				}

				if (useStyleAssignment) {
					if (styleAssignment) {
						styleAssignment.set("Styles", [...(styleAssignment.get("Styles") as EntityInstance[]), style]);
					} else {
						styleAssignment = file.createEntity("IfcPresentationStyleAssignment", [style]);
						prevStyledItem.set("Styles", [...(prevStyledItem.get("Styles") as EntityInstance[]), styleAssignment]);
					}
				} else {
					prevStyledItem.set("Styles", [...(prevStyledItem.get("Styles") as EntityInstance[]), style]);
				}
				continue;
			}

			// collect previously assigned styles
			const assignedStyles: EntityInstance[] = [];
			for (const style_ of prevStyledItem.get("Styles") as EntityInstance[]) {
				if (style_.isA("IfcPresentationStyleAssignment")) {
					if (styleAssignment === null) styleAssignment = style_;
					assignedStyles.push(...(style_.get("Styles") as EntityInstance[]));
				} else {
					assignedStyles.push(style_);
				}
			}

			if (assignedStyles.some((s) => s.equals(style as EntityInstance))) continue;

			if (useStyleAssignment) {
				if (styleAssignment !== null) {
					styleAssignment.set("Styles", [...(styleAssignment.get("Styles") as EntityInstance[]), style]);
				} else {
					styleAssignment = file.createEntity("IfcPresentationStyleAssignment", [style]);
					prevStyledItem.set("Styles", [...(prevStyledItem.get("Styles") as EntityInstance[]), styleAssignment]);
				}
			} else {
				prevStyledItem.set("Styles", [...(prevStyledItem.get("Styles") as EntityInstance[]), style]);
			}
		}
	}

	return results;
}

/**
 * Assigns styles directly to an object representation (Python:
 * `ifcopenshell.api.style.assign_representation_styles`).
 *
 * A style may either be assigned directly to an object's representation, or to a
 * material which is then associated with the object. If both exist, then the style
 * assigned directly to the object's representation takes precedence. It is recommended
 * to use materials and assign styles to materials (see `api.style.assignMaterialStyle`).
 * However, sometimes you may want to assign colours directly to the object
 * representation as an override. This API function provides that capability.
 *
 * This function assigns styles in bulk in an ordered manner to every item in the
 * representation, so the order and total styles provided is significant. If you want
 * more granular control, use `api.style.assignItemStyle`.
 *
 * @returns The list of created `IfcStyledItem`s (items where an existing style was
 *   merely extended, not newly created, are not included).
 *
 * @example
 * ```ts
 * // Create a new surface style
 * const style = api.style.addStyle(model, {});
 * api.style.addSurfaceStyle(model, {
 *   style,
 *   attributes: { SurfaceColour: { Name: null, Red: 0.5, Green: 0.5, Blue: 0.5 }, Transparency: 0.0 },
 * });
 *
 * // Now specifically this representation's items will be coloured grey.
 * api.style.assignRepresentationStyles(model, { shapeRepresentation: representation, styles: [style] });
 * ```
 */
export const assignRepresentationStyles = wrapUsecase(
	"style.assign_representation_styles",
	assignRepresentationStylesUsecase,
);
