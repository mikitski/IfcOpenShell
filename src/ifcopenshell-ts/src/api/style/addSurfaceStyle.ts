// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/style/add_surface_style.py` (src/ifcopenshell-python, 143
// lines) -- chunk 2 of 2 for `api.style` (see `./index.ts`'s own header comment). Two
// sibling `api.style` dependencies: `edit_surface_style` (this same chunk, see
// `./editSurfaceStyle.ts`) and `remove_surface_style` (chunk 1, already landed, see
// `./removeSurfaceStyle.ts`) -- both wired up directly below, no ordering blocker.
//
// Creates a new presentation item (one of the six `SURFACE_STYLE_TYPES`) and attaches
// it to an `IfcSurfaceStyle`'s own `Styles` aggregate, enforcing two real, disclosed
// invariants ported verbatim from real Python:
//
// 1. "Shading and rendering are mutually exclusive" -- adding an
//    `IfcSurfaceStyleRendering` first REMOVES any existing `IfcSurfaceStyleShading`
//    item (and vice versa), via the `select_class` remapping (`ifc_class ==
//    "IfcSurfaceStyleRendering"` is treated as `"IfcSurfaceStyleShading"` for the
//    "find duplicates of this same select class" scan) -- real Python's own comment-free
//    implementation of the fact that `IfcSurfaceStyleRendering` IS-A
//    `IfcSurfaceStyleShading` in the EXPRESS schema (a rendering item already carries
//    every shading item's own `SurfaceColour`/`Transparency` fields, so keeping both
//    would be redundant/conflicting) -- pinned by real Python's own
//    `test_ensure_shading_and_rendering_are_mutually_exclusive_when_adding`, ported
//    below.
// 2. "No duplicate items of the exact same `ifc_class`" -- adding a second
//    `IfcSurfaceStyleShading` (or any other of the six classes) to the same
//    `IfcSurfaceStyle` removes the first one first (`remove_surface_style`, chunk 1),
//    so a style only ever carries at most one presentation item PER (shading-merged)
//    class -- pinned by `test_not_adding_a_style_twice`.
//
// --- `file.create_entity(ifc_class)` -- zero-arg create, THEN a separate
// `edit_surface_style` call, ported exactly (not merged into one call) ---
//
// Real Python creates the presentation item bare (`file.create_entity(ifc_class)`, no
// attributes at all) and immediately delegates every attribute assignment to
// `ifcopenshell.api.style.edit_surface_style` (this same chunk) -- so every schema
// difference/quirk that function's own header comment discloses (the `IfcColourRgb`/
// `SpecularHighlight`/`IfcColourOrFactor` special cases, and `IfcSurfaceStyleShading`
// lacking `Transparency` on IFC2X3, confirmed against `ifc2x3.d.ts`) applies here too,
// inherited rather than re-implemented.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";
import { editSurfaceStyle } from "./editSurfaceStyle";
import { removeSurfaceStyle } from "./removeSurfaceStyle";

export type SurfaceStyleType =
	| "IfcSurfaceStyleShading"
	| "IfcSurfaceStyleRendering"
	| "IfcSurfaceStyleWithTextures"
	| "IfcSurfaceStyleLighting"
	| "IfcSurfaceStyleRefraction"
	| "IfcExternallyDefinedSurfaceStyle";

export interface AddSurfaceStyleSettings {
	/** The `IfcSurfaceStyle` you want to add the presentation item to. See `api.style.addStyle`. */
	style: EntityInstance;
	/**
	 * Choose from `"IfcSurfaceStyleShading"`, `"IfcSurfaceStyleRendering"`,
	 * `"IfcSurfaceStyleWithTextures"`, `"IfcSurfaceStyleLighting"`,
	 * `"IfcSurfaceStyleRefraction"`, or `"IfcExternallyDefinedSurfaceStyle"`. Defaults to
	 * `"IfcSurfaceStyleShading"`.
	 */
	ifcClass?: SurfaceStyleType;
	/** A dictionary of attribute names and values -- see `api.style.editSurfaceStyle`. */
	attributes?: Record<string, unknown>;
}

function addSurfaceStyleUsecase(file: IfcFile, settings: AddSurfaceStyleSettings): EntityInstance {
	const { style } = settings;
	const ifcClass = settings.ifcClass ?? "IfcSurfaceStyleShading";
	const attributes = settings.attributes ?? {};

	const styleItem = file.createEntity(ifcClass);
	editSurfaceStyle(file, { style: styleItem, attributes });

	// See this file's own header comment, invariant 1 -- an `IfcSurfaceStyleRendering`
	// is treated as an `IfcSurfaceStyleShading` for the "same class" duplicate scan.
	const selectClass = ifcClass === "IfcSurfaceStyleRendering" ? "IfcSurfaceStyleShading" : ifcClass;
	const stylesBefore = (style.get("Styles") as EntityInstance[] | null) ?? [];
	const duplicateItems = stylesBefore.filter((s) => s.isA(selectClass));
	for (const duplicateItem of duplicateItems) {
		removeSurfaceStyle(file, { style: duplicateItem });
	}

	const stylesAfter = (style.get("Styles") as EntityInstance[] | null) ?? [];
	style.set("Styles", [...stylesAfter, styleItem]);
	return styleItem;
}

/**
 * Adds a new presentation item to a surface style (Python:
 * `ifcopenshell.api.style.add_surface_style`).
 *
 * A surface style can have multiple different types of presentation items assigned to
 * it:
 *
 * - Shading, the simplest item -- a single basic colour and transparency, an
 *   indicative colour of what the object would be in real life. If you just want to
 *   give something a colour, this is what you need.
 * - Rendering, an advanced extension of shading, including a shader description
 *   (reflectance/lighting model, diffuse/specular/emissive colour maps, ...) fully
 *   compatible with glTF/X3D. Use this if your model is prepared to be rendered by a
 *   glTF/X3D-compatible rendering engine.
 * - Textures, a special type of rendering item using image textures instead of single
 *   colours (see `api.style.addSurfaceTextures`, a chunk 2 sibling).
 * - Lighting, photometrically accurate colour parameters for lighting simulation.
 * - Reflectance, a special type of lighting item with lesser-used photometric
 *   properties, typically required for advanced materials like glazing.
 * - External, for any other surface style defined via an external URI (a third-party
 *   non-glTF-compatible shader, or a complex lighting simulation definition).
 *
 * Shading is sufficient for the majority of basic models.
 *
 * See this file's own header comment for two real, disclosed invariants this function
 * enforces: shading and rendering are mutually exclusive on the same style, and a
 * style only ever carries at most one item per class.
 *
 * @returns The newly created presentation item, based on the provided `ifcClass`.
 *
 * @example
 * ```ts
 * // Create a new surface style
 * const style = api.style.addStyle(model, {});
 *
 * // Create a simple shading colour and transparency.
 * api.style.addSurfaceStyle(model, {
 *   style,
 *   ifcClass: "IfcSurfaceStyleShading",
 *   attributes: {
 *     SurfaceColour: { Name: null, Red: 1.0, Green: 0.8, Blue: 0.8 },
 *     Transparency: 0.0, // 0 is opaque, 1 is transparent
 *   },
 * });
 * ```
 */
export const addSurfaceStyle = wrapUsecase("style.add_surface_style", addSurfaceStyleUsecase);
