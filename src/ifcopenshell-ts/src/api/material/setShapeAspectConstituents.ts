// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/set_shape_aspect_constituents.py`
// (src/ifcopenshell-python, 115 lines) -- chunk 4 of `api.material` (see `./index.ts`'s
// own header comment; this chunk completes the module, 26/26 files). Every
// `ifcopenshell.api.material.*` dependency the real source imports
// (`unassign_material`/`remove_material_set`/`add_material_set`/`add_constituent`/
// `assign_material`) is already landed, in this module itself, and wired up directly
// below. `ifcopenshell.util.element.get_material` and every
// `ifcopenshell.util.representation.*` helper it calls (`get_material_style`,
// `get_representation`, `resolve_representation`, `get_item_shape_aspect`) are
// likewise already landed. The ONE genuinely unported dependency is
// `ifcopenshell.api.style.assign_item_style` -- `api.style` has NO TS port of any kind
// (confirmed: no `api/style/` directory anywhere under `src/`) -- see the dedicated
// section below and the matching `TODOS.md` entry.
//
// --- Real, disclosed bug, ported verbatim: the "reuse an existing matching
// constituent set" branch is permanently unreachable ---
//
// Real Python's own reuse check reads:
//
//     if (
//         material.is_a("IfcMaterialConstituent")
//         and len(names := [c.Name for c in material.MaterialConstituents]) == len(materials)
//         and set(names) == set(materials.keys())
//     ):
//         should_create_new_material_set = False
//
// `get_material(element)` can only ever return `IfcMaterial`/`IfcMaterialConstituentSet`
// /`IfcMaterialLayerSet`/`IfcMaterialProfileSet`/`IfcMaterialList`/a "Set Usage" wrapper
// -- a `RelatingMaterial` is NEVER a bare `IfcMaterialConstituent` (that class is a
// SET-ITEM, only ever found inside `IfcMaterialConstituentSet.MaterialConstituents`,
// never assigned as the relationship's own `RelatingMaterial`). The check should almost
// certainly read `material.is_a("IfcMaterialConstituentSet")` instead. As written, this
// `is_a` check is always `False` for any real element, so Python's own `and`
// short-circuits before ever evaluating `material.MaterialConstituents` (which would
// otherwise raise `AttributeError` on a plain `IfcMaterialConstituentSet`, since that
// attribute lives on `IfcMaterialConstituent`, not the SET class -- so even fixing the
// typo naively would immediately break on the very case it's meant to detect; a correct
// fix needs `material.MaterialConstituents` on the SET itself, which import the same
// name -- IFC's own naming here is genuinely confusable). The practical effect: this
// function ALWAYS unassigns and (usually) removes any pre-existing material/material
// set on `element`, then ALWAYS creates a brand new `IfcMaterialConstituentSet` from
// scratch on every single call -- never reuses one, even when called twice in a row
// with byte-for-byte identical `materials`. Ported exactly as written below (same
// `isA("IfcMaterialConstituent")` check, same short-circuiting `&&` order, same
// unreachable branch), not "corrected" to check `IfcMaterialConstituentSet` instead --
// that would be a real, silent behavior CHANGE from upstream, not a faithful port.
//
// --- `ifcopenshell.api.style.assign_item_style`: genuinely unported, throws loudly ---
//
// The final loop (walk `representation.Items`, match each item's shape aspect name
// against `materials`' own keys via a per-material style lookup, then call
// `ifcopenshell.api.style.assign_item_style`) is ported in full up to the exact point
// of that one call -- everything else in this function (the material-set
// creation/reuse-check/removal surgery above, and the aspect/style MATCHING logic
// itself) is fully, faithfully ported and runs to completion regardless of whether any
// item ever actually needs a style reassigned. Only the actual `assign_item_style`
// call itself throws, and only when reached (a real aspect/style match was found for
// that specific item) -- never proactively before the loop even starts, matching this
// project's established convention for a genuinely-separate-future-module blocker
// (e.g. `../root/copyClass.ts`'s own `api.system` disclosure). See `TODOS.md` for the
// full writeup.
//
// --- `resolve_representation(get_representation(...))`: a real, disclosed
// `None`-crashes-Python gap, NOT guarded against here ---
//
// Real Python calls `ifcopenshell.util.representation.get_representation(element,
// context=context)` (which returns `None` if `element` has no representation in
// `context` at all) and immediately passes the result, UNCHECKED, into
// `resolve_representation`, which unconditionally reads `representation.Items` --
// raising a real `AttributeError: 'NoneType' object has no attribute 'Items'` for any
// `element` lacking a matching representation. Ported verbatim: no `null` guard here
// either, so this TS port throws its own (differently-worded, but equally real) runtime
// `TypeError` reading `null`'s `.get(...)` in that same situation -- not silently
// skipped, and not given a friendlier bespoke error message that upstream itself
// doesn't have.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getMaterial } from "../../util/element";
import {
	getItemShapeAspect,
	getMaterialStyle,
	getRepresentation,
	resolveRepresentation,
} from "../../util/representation";
import { wrapUsecase } from "../hooks";
import { addConstituent } from "./addConstituent";
import { addMaterialSet } from "./addMaterialSet";
import { assignMaterial } from "./assignMaterial";
import { removeMaterialSet } from "./removeMaterialSet";
import { unassignMaterial } from "./unassignMaterial";

/** Python's `set(a) == set(b)` for two string arrays. */
function sameStringSet(a: readonly (string | null)[], b: readonly string[]): boolean {
	const setA = new Set(a);
	const setB = new Set(b);
	if (setA.size !== setB.size) return false;
	for (const value of setA) {
		if (!setB.has(value as string)) return false;
	}
	return true;
}

export interface SetShapeAspectConstituentsSettings {
	/** The `IfcProduct` or `IfcTypeProduct`. */
	element: EntityInstance;
	/**
	 * The `IfcGeometricRepresentationContext` that the geometry belongs to, typically the
	 * body context. You can get this via `util.representation.getContext`.
	 */
	context: EntityInstance;
	/** The key is the name of the constituent, and the value is the `IfcMaterial`. */
	materials: Record<string, EntityInstance>;
}

function setShapeAspectConstituentsUsecase(file: IfcFile, settings: SetShapeAspectConstituentsSettings): void {
	const { element, context, materials } = settings;

	let shouldCreateNewMaterialSet: boolean;
	const material = getMaterial(element);
	if (material) {
		// See this file's own header comment -- this `isA("IfcMaterialConstituent")`
		// check (not `"IfcMaterialConstituentSet"`) is a real upstream bug, ALWAYS `false`
		// here, so this whole `if` branch is permanently unreachable in practice. Ported
		// verbatim, including the short-circuiting `&&` order that avoids ever touching
		// `.get("MaterialConstituents")` (which real Python's own `material
		// .MaterialConstituents` would raise on for a `IfcMaterialConstituentSet`, the
		// class `get_material` can actually return here).
		const materialNames = Object.keys(materials);
		if (
			material.isA("IfcMaterialConstituent") &&
			(() => {
				const names = ((material.get("MaterialConstituents") as EntityInstance[] | null) ?? []).map(
					(c) => c.get("Name") as string | null,
				);
				return names.length === materialNames.length && sameStringSet(names, materialNames);
			})()
		) {
			shouldCreateNewMaterialSet = false;
		} else {
			shouldCreateNewMaterialSet = true;
			unassignMaterial(file, { products: [element] });
			if (!material.isA("IfcMaterial") && file.getTotalInverses(material) === 0) {
				removeMaterialSet(file, { material });
			}
		}
	} else {
		shouldCreateNewMaterialSet = true;
	}

	if (shouldCreateNewMaterialSet) {
		const materialSet = addMaterialSet(file, { setType: "IfcMaterialConstituentSet" });
		for (const [name, constituentMaterial] of Object.entries(materials)) {
			addConstituent(file, { constituentSet: materialSet, material: constituentMaterial, name });
		}
		assignMaterial(file, { products: [element], material: materialSet });
	}

	const styles = new Map<string, EntityInstance | null>(
		Object.entries(materials).map(([n, m]) => [n, getMaterialStyle(m, context)]),
	);
	// See this file's own header comment -- no `null` guard here, matching real Python's
	// own unguarded `resolve_representation(get_representation(...))` crash-on-`None`.
	const representation = resolveRepresentation(getRepresentation(element, context) as EntityInstance);
	for (const item of representation.get("Items") as EntityInstance[]) {
		const aspect = getItemShapeAspect(representation, item);
		if (!aspect) continue;
		const aspectName = aspect.get("Name") as string | null;
		const style = aspectName !== null ? styles.get(aspectName) : undefined;
		if (style) {
			// See this file's own header comment and `TODOS.md`: `api.style` has no TS port
			// of any kind yet.
			throw new Error(
				`setShapeAspectConstituents: assigning item style for shape aspect '${aspectName}' needs api.style.assignItemStyle, not ported yet -- see TODOS.md.`,
			);
		}
	}
}

/**
 * Assigns a material constituent set and sets styles based on shape aspects (Python:
 * `ifcopenshell.api.material.set_shape_aspect_constituents`).
 *
 * An IFC element may be assigned to a set of material constituents. For example, a
 * window may have a framing material and a glazing material. Each constituent may have
 * a name, such as "Framing" (which may be assigned to an "Aluminium" material), and
 * "Glazing" (assigned to a "Laminated Low-e Glass" material).
 *
 * An IFC element's geometry may be composed of multiple geometric items. These
 * geometric items may have names, known as "Shape Aspects". For example a solid
 * extrusion for the framing named "Framing" and a solid extrusion for the glass panel
 * named "Glazing".
 *
 * A material may be associated with a style (i.e. colour). For example, a grey style
 * for the "Aluminium" material and a transparent blue style for the "Laminated Low-e
 * Glass" material.
 *
 * These three concepts of material constituents, shape aspects, and associated styles
 * are correlated. For example, if the name (e.g. "Framing") of a material constituent
 * and a shape aspect correlate, that means that the geometric item inherits the style
 * (i.e. grey).
 *
 * This function lets you specify named material constituents, and it'll create a
 * constituent set assigned to the element with those names. It'll then find any
 * geometric representation items with shape aspects matching those names, and assign
 * the correlating style.
 *
 * See this file's own header comment for a real, disclosed upstream bug: an existing,
 * value-matching material constituent set assigned to `element` is NEVER reused -- a
 * brand new one is always created.
 *
 * **Known gap:** the final style-assignment step needs `api.style.assignItemStyle`,
 * which has no TS port of any kind yet -- this throws only if a matching shape
 * aspect/style pair is actually found (see `TODOS.md`).
 *
 * @example
 * ```ts
 * const aluminium = api.material.addMaterial(model, { name: "AL01", category: "aluminium" });
 * const glass = api.material.addMaterial(model, { name: "GLZ01", category: "glass" });
 * api.material.setShapeAspectConstituents(model, {
 *   element: window,
 *   context: body,
 *   materials: { Framing: aluminium, Lining: aluminium, Glazing: glass },
 * });
 * ```
 */
export const setShapeAspectConstituents = wrapUsecase(
	"material.set_shape_aspect_constituents",
	setShapeAspectConstituentsUsecase,
);
