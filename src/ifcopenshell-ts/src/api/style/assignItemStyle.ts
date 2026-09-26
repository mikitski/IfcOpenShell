// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/assign_item_style.py` (src/ifcopenshell-python, 134
// lines) -- chunk 2 of 2 for `api.style` (see `./index.ts`'s own header comment). No
// sibling `api.style` dependency of any kind -- the only import in the real source is
// bare `ifcopenshell`.
//
// **This is the function `../material/setShapeAspectConstituents.ts` was blocked on**
// (see that file's own header comment and its matching `TODOS.md` entry, now marked
// RESOLVED there) -- landing it here means that blocker is wired up for real in this
// same PR, replacing its loud, disclosed throw with a real call.
//
// Assigns (or removes, when `style` is `null`) a style DIRECTLY onto a single
// `IfcRepresentationItem`, via that item's own `StyledByItem` inverse. Real Python's
// own docstring explains the intended precedence: a style assigned directly to an
// item's own representation overrides a style inherited from the item's material (see
// `./assignMaterialStyle.ts`'s own docstring for the material-level alternative).
//
// --- Three-way schema branch, ported verbatim ---
//
// 1. No existing `StyledByItem` at all: `style === null` is a no-op (nothing to
//    remove); otherwise creates a brand new `IfcStyledItem`, wrapping `style` in a
//    freshly-created `IfcPresentationStyleAssignment` first on IFC2X3 (unconditionally
//    -- that schema's own `IfcStyledItem.Styles: IfcPresentationStyleAssignment[]`
//    requires it, confirmed against `ifc2x3.d.ts`) or whenever the caller opts in via
//    `shouldUsePresentationStyleAssignment` (documented as a Revit-compatibility
//    workaround, producing non-compliant-but-Revit-friendly IFC on IFC4/IFC4X3).
// 2. IFC4X3 (`IfcPresentationStyleAssignment` REMOVED from this schema entirely,
//    confirmed absent from `ifc4x3.d.ts` -- `IfcStyledItem.Styles` narrows to plain
//    `IfcPresentationStyle[]` there): `style === null` removes the whole
//    `IfcStyledItem` outright; otherwise simply overwrites `Styles` to `[style]`.
// 3. IFC2X3/IFC4 (pre-IFC4X3): the fully involved branch below -- an existing
//    `IfcStyledItem.Styles` may contain a MIX of bare `IfcPresentationStyle`s and
//    `IfcPresentationStyleAssignment`s (real IFC files authored by other tools are not
//    guaranteed to only ever produce what this project's own writers would). Walks the
//    ORIGINAL (pre-mutation) `Styles` snapshot once: every `IfcPresentationStyleAssignment`
//    found AFTER the first one is deleted outright (`file.remove`); the FIRST one found
//    is kept as `assignment` and (only if `style` is non-`null`) its own `Styles`
//    forced to exactly `[style]` (dropping whatever it wrapped before). When `style` is
//    `null`, EVERY assignment found gets removed (the `assignment ||`-style
//    accumulator is irrelevant in that branch -- real Python's own `if style is None or
//    assignment:` condition is `True` unconditionally whenever `style is None`,
//    regardless of `assignment`'s own state) and the whole `IfcStyledItem` is then
//    removed too, right after the loop. Otherwise (`style` is non-`null`): if an
//    `assignment` was found and reused, `Styles` is forced to exactly `[assignment]`
//    (a no-op if that was already the item's ONLY style) -- collapsing any bare,
//    non-assignment presentation styles that coexisted alongside it in the original
//    snapshot; if no assignment existed at all, `Styles` is forced to exactly `[style]`
//    directly (same collapsing behavior). Both of these final overwrites are a
//    deliberate "this item carries exactly one effective style" normalization, not a
//    bug -- ported verbatim from real Python's own unconditional final assignment.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AssignItemStyleSettings {
	/** The `IfcRepresentationItem` of the object that you want to assign styles to. */
	item: EntityInstance;
	/** A presentation style, typically `IfcSurfaceStyle`. `null` to remove an existing style from the item. */
	style: EntityInstance | null;
	/**
	 * This is a technical detail to accommodate a bug in Revit. This should always be
	 * left as the default of `false`, unless you are finding that colours aren't showing
	 * up in Revit. In that case, set it to `true`, but keep in mind that this is no
	 * longer a valid IFC. Blame Autodesk.
	 */
	shouldUsePresentationStyleAssignment?: boolean;
}

function assignItemStyleUsecase(file: IfcFile, settings: AssignItemStyleSettings): EntityInstance | null {
	const { item, style } = settings;
	const shouldUsePresentationStyleAssignment = settings.shouldUsePresentationStyleAssignment ?? false;

	const styledByItem = (item.get("StyledByItem") as EntityInstance[] | null) ?? [];
	const existingStyledItem = styledByItem.length > 0 ? styledByItem[0] : null;

	if (existingStyledItem === null) {
		if (style === null) return null;
		let effectiveStyle: EntityInstance = style;
		if (file.schema === "IFC2X3" || shouldUsePresentationStyleAssignment) {
			effectiveStyle = file.createEntity("IfcPresentationStyleAssignment", [style]);
		}
		return file.createEntity("IfcStyledItem", item, [effectiveStyle]);
	}

	const styledItemStyles = existingStyledItem.get("Styles") as EntityInstance[];
	if (style !== null && styledItemStyles.length === 1 && styledItemStyles[0].equals(style)) {
		return existingStyledItem;
	}

	if (file.schema === "IFC4X3") {
		if (style === null) {
			file.remove(existingStyledItem);
			return null;
		}
		existingStyledItem.set("Styles", [style]);
		return existingStyledItem;
	}

	// < IFC4X3 -- see this file's own header comment, branch 3.
	let assignment: EntityInstance | null = null;
	for (const style_ of styledItemStyles) {
		if (!style_.isA("IfcPresentationStyleAssignment")) continue;
		if (style === null || assignment !== null) {
			file.remove(style_);
		} else {
			assignment = style_;
			const assignmentStyles = assignment.get("Styles") as EntityInstance[];
			if (!(assignmentStyles.length === 1 && assignmentStyles[0].equals(style))) {
				assignment.set("Styles", [style]);
			}
		}
	}

	if (style === null) {
		file.remove(existingStyledItem);
		return null;
	}

	if (assignment !== null) {
		if (styledItemStyles.length === 1 && styledItemStyles[0].equals(assignment)) {
			return existingStyledItem;
		}
		existingStyledItem.set("Styles", [assignment]);
		return existingStyledItem;
	}

	existingStyledItem.set("Styles", [style]);
	return existingStyledItem;
}

/**
 * Assigns a style directly to a representation item (Python:
 * `ifcopenshell.api.style.assign_item_style`).
 *
 * A style may either be assigned directly to an object's representation items, or to a
 * material which is then associated with the object. If both exist, then the style
 * assigned directly to the object's representation takes precedence. It is recommended
 * to use materials and assign styles to materials (see `api.style.assignMaterialStyle`).
 * However, sometimes you may want to assign colours directly to the object
 * representation as an override. This API function provides that capability.
 *
 * @returns The created or existing `IfcStyledItem`, or `null` if the style was removed.
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
 * // Now specifically this item only will be coloured grey.
 * api.style.assignItemStyle(model, { style, item: representation.get("Items")[0] });
 * ```
 */
export const assignItemStyle = wrapUsecase("style.assign_item_style", assignItemStyleUsecase);
