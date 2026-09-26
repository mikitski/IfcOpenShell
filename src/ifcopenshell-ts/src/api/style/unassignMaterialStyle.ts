// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/unassign_material_style.py` (src/ifcopenshell-python,
// 102 lines) -- chunk 1 of 2 for `api.style` (see `./index.ts`'s own header comment).
// One sibling `api.style` dependency, `unassign_representation_styles` (this same
// chunk, see `./unassignRepresentationStyles.ts`), already landed alongside this file --
// no cross-chunk ordering blocker. `ifcopenshell.util.element.get_elements_by_material`
// is already ported (`../../util/element.ts`'s `getElementsByMaterial`). The ONE
// genuinely unported dependency is `ifcopenshell.util.element.get_shape_aspects` --
// confirmed absent from `../../util/element.ts` (that file's own header comment
// explicitly lists it as out of scope for all 3 of its own chunks) -- see the dedicated
// section below and the matching `TODOS.md` entry.
//
// Reverses `api.style.assign_material_style` (a chunk 2 function, NOT yet ported --
// see `./index.ts`'s own header comment): removes a style from every
// `IfcStyledRepresentation` associated with a material (via
// `IfcMaterialDefinitionRepresentation`) at a given context, cascading cleanup of any
// `IfcStyledItem`/`IfcStyledRepresentation`/`IfcMaterialDefinitionRepresentation` left
// empty as a result. Also propagates the unassignment to any `IfcShapeAspect`-tagged
// representation item whose aspect name matches a material constituent built from this
// exact material (mirroring how a *style* gets ASSIGNED to those same items in
// `assign_material_style`'s own shape-aspect-matching tail -- see that file's own
// docstring/source, read directly, for the forward direction this function undoes).
//
// --- `IfcPresentationStyleAssignment`-wrapped-style unassignment, ported verbatim ---
//
// The first loop's inner style-filtering step drops an item's `Styles` entry either
// when it equals `style` directly, OR when it's an `IfcPresentationStyleAssignment`
// whose OWN `Styles` is the exact single-element tuple `(style,)` -- i.e. an assignment
// wrapping ONLY the style being unassigned is dropped in its entirety (not merely
// unwrapped/edited down to zero styles and left behind); an assignment wrapping
// `style` PLUS anything else is left completely untouched (real Python does not
// partially unwrap a multi-style assignment here at all, unlike
// `./unassignRepresentationStyles.ts`'s own `remove_styles` helper, which does support
// removing individual styles from within an assignment -- these two functions'
// "unassign from an item" logic are genuinely NOT shared/factored together in real
// Python, so this port keeps them as two independent implementations too).
//
// --- `ifcopenshell.util.element.get_shape_aspects`: genuinely unported, throws
// loudly, ONLY when actually needed ---
//
// The first loop (representation/item style-removal) ALWAYS runs to completion,
// regardless of whether `material` is ever used in any named material constituent --
// this is real, faithfully-ported, unconditional behavior, not gated by the blocked
// dependency below. Only the SECOND part -- "handle material constituents and shape
// aspects" -- can reach the blocked call, and only when `material` genuinely has at
// least one named `IfcMaterialConstituent` inverse (`material_constituents_names` is
// non-empty; otherwise real Python itself returns early, before ever computing
// `elements`/calling `get_shape_aspects`, ported identically here) AND
// `get_elements_by_material` actually finds at least one element using that material
// (an empty result short-circuits the loop before the blocked call is ever reached, no
// throw). This matches this project's established convention for a genuinely
// unported, separate-module dependency (see `../material/setShapeAspectConstituents
// .ts`'s own `api.style.assign_item_style` disclosure) -- never a proactive throw, and
// never after any of this function's own real mutations (the first loop's
// representation/item surgery) have already happened, since those mutations are
// required, correct, unconditional real behavior, not part of what's blocked. See
// `TODOS.md` for the full writeup.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getElementsByMaterial } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { unassignRepresentationStyles } from "./unassignRepresentationStyles";

/**
 * `ifcopenshell.util.element.get_shape_aspects` -- has no TS port of any kind (see this
 * file's own header comment and `TODOS.md`). Throws loudly, only when actually
 * reached (a real element using `material` was found) -- never proactively.
 */
function getShapeAspectsBlocked(element: EntityInstance): never {
	throw new Error(
		`unassignMaterialStyle: matching material constituents to shape aspects for element #${element.id()} needs util.element.getShapeAspects, not ported yet -- see TODOS.md.`,
	);
}

export interface UnassignMaterialStyleSettings {
	/** The `IfcMaterial` which you want to unassign the style from. */
	material: EntityInstance;
	/**
	 * The `IfcPresentationStyle` (typically `IfcSurfaceStyle`) that you want to unassign
	 * from `material`. This will then be applied to all objects that have that material.
	 */
	style: EntityInstance;
	/**
	 * The `IfcGeometricRepresentationSubContext` at which this style should be
	 * unassigned. Typically this is the Model BODY context.
	 */
	context: EntityInstance;
}

function unassignMaterialStyleUsecase(file: IfcFile, settings: UnassignMaterialStyleSettings): void {
	const { material, style, context } = settings;

	for (const definition of (material.get("HasRepresentation") as EntityInstance[] | null) ?? []) {
		for (const representation of definition.get("Representations") as EntityInstance[]) {
			if (!representation.isA("IfcStyledRepresentation")) continue;
			if (!(representation.get("ContextOfItems") as EntityInstance).equals(context)) continue;
			for (const item of representation.get("Items") as EntityInstance[]) {
				if (!item.isA("IfcStyledItem")) continue;
				const currentStyles = item.get("Styles") as EntityInstance[];
				const styles: EntityInstance[] = [];
				for (const s of currentStyles) {
					if (s.equals(style)) continue;
					if (s.isA("IfcPresentationStyleAssignment")) {
						const inner = s.get("Styles") as EntityInstance[];
						if (inner.length === 1 && inner[0].equals(style)) continue;
					}
					styles.push(s);
				}
				if (styles.length === 0) {
					file.remove(item);
				} else if (styles.length !== currentStyles.length) {
					item.set("Styles", styles);
				}
			}
			if ((representation.get("Items") as EntityInstance[]).length === 0) {
				file.remove(representation);
			}
		}
		if ((definition.get("Representations") as EntityInstance[]).length === 0) {
			file.remove(definition);
		}
	}

	// handle material constituents and shape aspects
	const materialConstituentsNames: string[] = [];
	for (const inverse of file.getInverse(material) as Set<EntityInstance>) {
		if (inverse.isA("IfcMaterialConstituent")) {
			const name = inverse.get("Name") as string | null;
			if (name) materialConstituentsNames.push(name);
		}
	}
	if (materialConstituentsNames.length === 0) return;

	const elements = getElementsByMaterial(file, material);
	const shapeAspects: EntityInstance[] = [];
	for (const element of elements) {
		// See this file's own header comment and `TODOS.md`: `util.element.getShapeAspects`
		// has no TS port of any kind yet. `getShapeAspectsBlocked` always throws, so the
		// (unreachable) `shapeAspects.push` below exists only to keep the real Python
		// `shape_aspects += get_shape_aspects(element)` shape visible for a future fix.
		const aspectsForElement: EntityInstance[] = getShapeAspectsBlocked(element);
		shapeAspects.push(...aspectsForElement);
	}

	for (const shapeAspect of shapeAspects) {
		const aspectName = shapeAspect.get("Name") as string | null;
		if (aspectName === null || !materialConstituentsNames.includes(aspectName)) continue;

		for (const rep of shapeAspect.get("ShapeRepresentations") as EntityInstance[]) {
			unassignRepresentationStyles(file, { shapeRepresentation: rep, styles: [style] });
		}
	}
}

/**
 * Unassigns a style from a material (Python:
 * `ifcopenshell.api.style.unassign_material_style`).
 *
 * This does the inverse of `api.style.assignMaterialStyle` (a chunk 2 function, not yet
 * ported -- see `./index.ts`'s own header comment).
 *
 * **Known gap:** propagating the unassignment to shape-aspect-tagged representation
 * items needs `util.element.getShapeAspects`, which has no TS port of any kind yet --
 * this throws only if `material` is used by at least one named material constituent
 * AND at least one element actually uses `material` (see this file's own header
 * comment and `TODOS.md`). The direct material-style unassignment (this function's
 * primary behavior) is unaffected and always completes.
 *
 * @example
 * ```ts
 * api.style.unassignMaterialStyle(model, { material: concrete, style, context: body });
 * ```
 */
export const unassignMaterialStyle = wrapUsecase("style.unassign_material_style", unassignMaterialStyleUsecase);
