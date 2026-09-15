// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.style` (src/ifcopenshell-python's `ifcopenshell/api/
// style/` package, 13 real files -- `add_style`/`add_surface_style`/
// `add_surface_textures`/`assign_item_style`/`assign_material_style`/
// `assign_representation_styles`/`edit_presentation_style`/`edit_surface_style`/
// `remove_style`/`remove_styled_representation`/`remove_surface_style`/
// `unassign_material_style`/`unassign_representation_styles`, excluding `__init__.py`)
// -- a BRAND-NEW module for this project (no TS port of any kind existed before this
// chunk, confirmed: no `api/style/` directory anywhere under `src/ifcopenshell-ts/src/`
// at chunk start). Manages `IfcPresentationStyle`/`IfcSurfaceStyle`/`IfcStyledItem`/
// `IfcStyledRepresentation` -- colours/textures/line styles/fill patterns/text styles,
// assigned either directly to an object's own representation or, more commonly, to a
// material (which is then inherited by every object using that material).
//
// This chunk (chunk 1 of 2) ports 7 of the 13 real files: `add_style`/`remove_style`/
// `remove_surface_style`/`remove_styled_representation`/`edit_presentation_style`/
// `unassign_material_style`/`unassign_representation_styles`. Chunk 2 (future work)
// will port the remaining 6: `add_surface_style`/`edit_surface_style`/
// `add_surface_textures`/`assign_item_style`/`assign_material_style`/
// `assign_representation_styles`.
//
// This module was prioritized (ahead of many still-smaller/simpler modules) because
// `../material/setShapeAspectConstituents.ts` (landed in `api.material` chunk 4)
// already disclosed a real, loud-throw blocker citing this exact module by name
// (`ifcopenshell.api.style.assign_item_style`, `TODOS.md`'s
// "`api.material.setShapeAspectConstituents` needs
// `ifcopenshell.api.style.assign_item_style`" entry) -- but `assign_item_style` itself
// is a chunk 2 file, NOT ported here, so that specific blocker remains open until
// chunk 2 lands and wires the real call back into `setShapeAspectConstituents.ts`.
//
// Every sibling `api.style` dependency this chunk's own 7 files need
// (`unassign_representation_styles`, needed by `unassign_material_style`) was already
// landed in this SAME chunk -- no cross-chunk ordering blocker. One genuinely
// unported, OUTSIDE-`api.style` dependency remains, disclosed in its own file's header
// comment and a dedicated `TODOS.md` entry, throwing a clear, loud, descriptive error
// only at the exact point it would actually be needed (never proactively, never before
// every otherwise-portable real behavior has run to completion):
// `unassignMaterialStyle.ts`'s shape-aspect-matching tail needs
// `ifcopenshell.util.element.get_shape_aspects` -- confirmed absent from
// `../../util/element.ts` (that file's own header comment explicitly lists it as out
// of scope for all 3 of its own already-landed chunks).
//
// Real, disclosed quirks/findings from this chunk, each with its own file's full
// writeup: `addStyle.ts` unconditionally forces `IfcSurfaceStyle.Side = "BOTH"` (real
// Python's own Revit-compatibility comment, not exposed as a settings option);
// `removeStyle.ts`'s `IfcFillAreaStyle` <-> `IfcFillAreaStyleHatching` mutual recursion
// (ported with two distinct, deliberately NOT-unified `removeDeep2` call shapes);
// `removeStyledRepresentation.ts` only cleans up `IfcPresentationStyleAssignment`
// wrappers on an orphaned styled item, never a bare `IfcPresentationStyle` (real
// Python's own asymmetry, matching this function's documented "doesn't remove the
// underlying styles" contract); `unassignMaterialStyle.ts`'s style-vs-assignment
// unassignment logic is a genuinely separate implementation from
// `unassignRepresentationStyles.ts`'s own (real Python doesn't share this logic between
// the two functions either). Also 2 real, confirmed IFC-schema differences:
// `IfcPresentationStyleAssignment` exists on IFC2X3/IFC4 but was REMOVED in IFC4X3
// (confirmed absent from `ifc4x3.d.ts` entirely -- `IfcStyledItem.Styles` narrows from
// `(IfcPresentationStyle | IfcPresentationStyleAssignment)[]` on IFC4 to plain
// `IfcPresentationStyle[]` on IFC4X3); `IfcTextureCoordinate`/
// `IfcTextureCoordinateGenerator.Maps`/`IfcSurfaceTexture.IsMappedBy` don't exist on
// IFC2X3 at all (confirmed against `ifc2x3.d.ts`: `IfcTextureCoordinate {}`, a genuinely
// empty interface) -- `removeSurfaceStyle.ts`'s own explicit `file.schema === "IFC2X3"`
// branch (ported from real Python's own `if`/`else`, not a guard this port added).
//
// Namespaced as `api.style.addStyle`/etc., matching `util/index.ts`'s per-submodule
// convention (see `../index.ts`'s own header comment for the flat-vs-namespaced
// distinction between `hooks.ts` and every real usecase module).
export { addStyle } from "./addStyle";
export type { AddStyleSettings } from "./addStyle";
export { removeStyle } from "./removeStyle";
export type { RemoveStyleSettings } from "./removeStyle";
export { removeSurfaceStyle } from "./removeSurfaceStyle";
export type { RemoveSurfaceStyleSettings } from "./removeSurfaceStyle";
export { removeStyledRepresentation } from "./removeStyledRepresentation";
export type { RemoveStyledRepresentationSettings } from "./removeStyledRepresentation";
export { editPresentationStyle } from "./editPresentationStyle";
export type { EditPresentationStyleSettings } from "./editPresentationStyle";
export { unassignMaterialStyle } from "./unassignMaterialStyle";
export type { UnassignMaterialStyleSettings } from "./unassignMaterialStyle";
export { unassignRepresentationStyles } from "./unassignRepresentationStyles";
export type { UnassignRepresentationStylesSettings } from "./unassignRepresentationStyles";
