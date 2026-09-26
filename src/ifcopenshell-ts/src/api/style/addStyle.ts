// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/add_style.py` (src/ifcopenshell-python, 65 lines) --
// chunk 1 of 2 for `api.style` (see `./index.ts`'s own header comment for the full
// chunk scope). No sibling `api.style` dependency of any kind -- the only import in
// the real source is bare `ifcopenshell`.
//
// Creates one of the four kinds of `IfcPresentationStyle`: `IfcSurfaceStyle` (the
// default, and by far the most common -- gives 3D surfaces their colour/texture),
// `IfcCurveStyle`, `IfcFillAreaStyle`, or `IfcTextStyle`. The style is created empty --
// no presentation items attached yet (that's `api.style.add_surface_style`/etc., a
// chunk 2 function).
//
// --- `Name` positional-vs-kwarg translation, verified against generated `.d.ts`s ---
//
// Real Python builds a `kwargs` dict (`{"Name": name}`, plus `Side: "BOTH"` only for
// `IfcSurfaceStyle`) and calls `file.create_entity(ifc_class, **kwargs)`. This port's
// `IfcFile.createEntity` is positional-args-only (no kwarg equivalent, see `file.ts`'s
// own header comment) -- ported as a positional `Name` at attribute index 0, confirmed
// identical across all three schemas for every one of the four style classes
// (`IfcSurfaceStyle`/`IfcCurveStyle`/`IfcFillAreaStyle`/`IfcTextStyle`, each a direct
// `IfcPresentationStyle` subtype whose own single attribute is `Name`, always inherited
// first per EXPRESS attribute ordering), then `Side` set separately by name afterward
// for `IfcSurfaceStyle` only -- matching real Python's own two-attribute-at-once
// construction exactly in end result, just split into a positional create plus one
// conditional `.set()` rather than a single kwargs-dict call.
//
// --- Real, disclosed quirk, ported verbatim (real Python's own comment) ---
//
// `IfcSurfaceStyle.Side` is unconditionally forced to `"BOTH"` regardless of what the
// caller might want, with real Python's own comment explaining why: "Name is filled
// out because Revit treats this incorrectly as the material name" (this comment
// actually describes the `Name` kwarg, not `Side` -- reproduced here verbatim as
// written in the real source, not corrected, since it's real upstream's own comment,
// not this port's own words). Not exposed as a settings option -- callers cannot
// currently create an `IfcSurfaceStyle` with `Side` set to anything other than
// `"BOTH"` through this function, matching real Python exactly.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddStyleSettings {
	/** The name of the style. Used to easily identify it using a style library. */
	name?: string | null;
	/**
	 * Choose from `"IfcSurfaceStyle"`, `"IfcCurveStyle"`, `"IfcFillAreaStyle"`, or
	 * `"IfcTextStyle"`. Defaults to `"IfcSurfaceStyle"`.
	 */
	ifcClass?: string;
}

function addStyleUsecase(file: IfcFile, settings: AddStyleSettings): EntityInstance {
	const ifcClass = settings.ifcClass ?? "IfcSurfaceStyle";
	const style = file.createEntity(ifcClass, settings.name ?? null);
	if (ifcClass === "IfcSurfaceStyle") {
		// Name is filled out because Revit treats this incorrectly as the material name
		// (real Python's own comment, ported verbatim -- see this file's own header
		// comment).
		style.set("Side", "BOTH");
	}
	return style;
}

/**
 * Adds a new presentation style (Python: `ifcopenshell.api.style.add_style`).
 *
 * A presentation style is a container of visual settings (called presentation items)
 * that affect the appearance of objects. There are four types of style:
 *
 * - Surface styles, which give 3D objects (which have surfaces / faces) their colours
 *   and textures. This is the most common type of style.
 * - Curve styles, which give 2D and 3D curves, lines, polylines, their stroke
 *   thickness and colour.
 * - Fill area styles, which gives 2D polygons and flat 3D planes their colours, hatch
 *   patterns, tiled patterns, and pattern scales.
 * - Text styles, which gives text their font family, weight, variant, size,
 *   indentation, alignment, decoration, spacing, and transformation.
 *
 * Once you have created a presentation style object, you can further define the
 * properties of your style using other API functions by adding presentation items,
 * such as `api.style.addSurfaceStyle` (not yet ported -- see `./index.ts`'s own header
 * comment).
 *
 * @returns The newly created style element, based on the provided `ifcClass`.
 *
 * @example
 * ```ts
 * // Create a new surface style
 * const style = api.style.addStyle(model, {});
 * ```
 */
export const addStyle = wrapUsecase("style.add_style", addStyleUsecase);
