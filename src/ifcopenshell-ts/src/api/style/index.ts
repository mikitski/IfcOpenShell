// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.style` (src/ifcopenshell-python's `ifcopenshell/api/
// style/` package, 13 real files -- `add_style`/`add_surface_style`/
// `add_surface_textures`/`assign_item_style`/`assign_material_style`/
// `assign_representation_styles`/`edit_presentation_style`/`edit_surface_style`/
// `remove_style`/`remove_styled_representation`/`remove_surface_style`/
// `unassign_material_style`/`unassign_representation_styles`, excluding `__init__.py`)
// -- a BRAND-NEW module for this project when chunk 1 started (no TS port of any kind
// existed before it). Manages `IfcPresentationStyle`/`IfcSurfaceStyle`/`IfcStyledItem`/
// `IfcStyledRepresentation` -- colours/textures/line styles/fill patterns/text styles,
// assigned either directly to an object's own representation or, more commonly, to a
// material (which is then inherited by every object using that material).
//
// **`api.style` is now COMPLETE, 13/13 files, across two chunks.** Chunk 1 ported 7
// files: `add_style`/`remove_style`/`remove_surface_style`/`remove_styled_representation`/
// `edit_presentation_style`/`unassign_material_style`/`unassign_representation_styles`.
// This chunk (chunk 2 of 2) ports the remaining 6: `add_surface_style`/
// `edit_surface_style`/`add_surface_textures`/`assign_item_style`/
// `assign_material_style`/`assign_representation_styles`.
//
// This module was prioritized (ahead of many still-smaller/simpler modules) because
// `../material/setShapeAspectConstituents.ts` (landed in `api.material` chunk 4)
// disclosed a real, loud-throw blocker citing this exact module by name
// (`ifcopenshell.api.style.assign_item_style`, `TODOS.md`'s
// "`api.material.setShapeAspectConstituents` needs
// `ifcopenshell.api.style.assign_item_style`" entry). This chunk lands
// `assign_item_style` (`./assignItemStyle.ts`) and wires the real call back into
// `setShapeAspectConstituents.ts`, replacing its disclosed throw -- that `TODOS.md`
// entry is now marked RESOLVED.
//
// Every sibling `api.style` dependency this chunk's own 6 files need
// (`edit_surface_style`/`remove_surface_style`, needed by `add_surface_style`;
// `assign_representation_styles`, needed by `assign_material_style`) was already
// landed either in this same chunk or in chunk 1 -- no cross-chunk ordering blocker.
// Two genuinely unported dependencies remain, each disclosed in its own file's header
// comment and a dedicated `TODOS.md` entry, throwing a clear, loud, descriptive error
// only at the exact point it would actually be needed (never proactively, never before
// every otherwise-portable real behavior has run to completion):
// `unassignMaterialStyle.ts` (chunk 1) AND `assignMaterialStyle.ts` (this chunk, its
// exact inverse) both need `ifcopenshell.util.element.get_shape_aspects` -- confirmed
// absent from `../../util/element.ts` (that file's own header comment explicitly lists
// it as out of scope for all 3 of its own already-landed chunks). Separately,
// `addSurfaceTextures.ts`'s `material` (Blender node-tree) parameter has no TS/Node
// equivalent AT ALL -- a permanent architectural scope boundary, not a "port later"
// item (see that file's own header comment and its own dedicated `TODOS.md` entry).
//
// Real, disclosed quirks/findings from chunk 1, each with its own file's full writeup:
// `addStyle.ts` unconditionally forces `IfcSurfaceStyle.Side = "BOTH"` (real Python's
// own Revit-compatibility comment, not exposed as a settings option); `removeStyle.ts`'s
// `IfcFillAreaStyle` <-> `IfcFillAreaStyleHatching` mutual recursion (ported with two
// distinct, deliberately NOT-unified `removeDeep2` call shapes); `removeStyledRepresentation
// .ts` only cleans up `IfcPresentationStyleAssignment` wrappers on an orphaned styled
// item, never a bare `IfcPresentationStyle` (real Python's own asymmetry, matching this
// function's documented "doesn't remove the underlying styles" contract);
// `unassignMaterialStyle.ts`'s style-vs-assignment unassignment logic is a genuinely
// separate implementation from `unassignRepresentationStyles.ts`'s own (real Python
// doesn't share this logic between the two functions either).
//
// Real, disclosed quirks/findings from THIS chunk (chunk 2), each with its own file's
// full writeup: `editSurfaceStyle.ts`'s `editColourRgb` always overwrites `Name` while
// its own `editColourOrFactor` never touches it (a real asymmetry, ported verbatim, not
// unified); `assignMaterialStyle.ts`'s `create_styled_item` reuse branch is a real,
// TEST-CONFIRMED upstream bug -- its own `IfcPresentationStyleAssignment` reuse check
// is permanently unreachable (`reuse_item` is always an `IfcStyledItem`, never a
// `IfcPresentationStyleAssignment`), so reusing an existing styled item always writes
// the RAW, unwrapped style, even on IFC2X3 (confirmed by real Python's own shipped
// `test_assign_material_style.py::TestAssignMaterialStyleIFC2X3::test_run`, whose own
// `else: # IfcPresentationStyleAssignment` comment is immediately followed by an
// assertion checking the bare, unwrapped style -- contradicting its own comment);
// `assignRepresentationStyles.ts`/`unassignRepresentationStyles.ts` (chunk 1) check
// different element/item class sets (`"IfcShapeModel"`/two item classes on the assign
// side vs. `"IfcShapeRepresentation"`/one item class on the unassign side) -- confirmed
// this is real Python's own asymmetry, not a bug introduced by either port, pinned by
// real Python's own `test_assign_style_to_topology_representation`.
//
// Real, confirmed IFC-schema differences (chunk 1 found 2, chunk 2 confirms both still
// apply plus finds no new ones): `IfcPresentationStyleAssignment` exists on IFC2X3/IFC4
// but was REMOVED in IFC4X3 (confirmed absent from `ifc4x3.d.ts` entirely --
// `IfcStyledItem.Styles` narrows from `(IfcPresentationStyle |
// IfcPresentationStyleAssignment)[]` on IFC4 to plain `IfcPresentationStyle[]` on
// IFC4X3); `IfcTextureCoordinate`/`IfcTextureCoordinateGenerator.Maps`/
// `IfcSurfaceTexture.IsMappedBy` don't exist on IFC2X3 at all (confirmed against
// `ifc2x3.d.ts`: `IfcTextureCoordinate {}`, a genuinely empty interface);
// `IfcSurfaceStyleShading.Transparency` doesn't exist on IFC2X3 (confirmed against
// `ifc2x3.d.ts`, added in IFC4); `IfcImageTexture` has an entirely different attribute
// shape on IFC2X3 (`TextureType`/`UrlReference`) than IFC4+ (`Mode`/`URLReference`),
// underpinning `add_surface_textures.py`'s own IFC2X3 early-return.
//
// Namespaced as `api.style.addStyle`/etc., matching `util/index.ts`'s per-submodule
// convention (see `../index.ts`'s own header comment for the flat-vs-namespaced
// distinction between `hooks.ts` and every real usecase module).
export { addStyle } from "./addStyle";
export type { AddStyleSettings } from "./addStyle";
export { addSurfaceStyle } from "./addSurfaceStyle";
export type { AddSurfaceStyleSettings, SurfaceStyleType } from "./addSurfaceStyle";
export { addSurfaceTextures } from "./addSurfaceTextures";
export type { AddSurfaceTexturesSettings } from "./addSurfaceTextures";
export { removeStyle } from "./removeStyle";
export type { RemoveStyleSettings } from "./removeStyle";
export { removeSurfaceStyle } from "./removeSurfaceStyle";
export type { RemoveSurfaceStyleSettings } from "./removeSurfaceStyle";
export { removeStyledRepresentation } from "./removeStyledRepresentation";
export type { RemoveStyledRepresentationSettings } from "./removeStyledRepresentation";
export { editPresentationStyle } from "./editPresentationStyle";
export type { EditPresentationStyleSettings } from "./editPresentationStyle";
export { editSurfaceStyle } from "./editSurfaceStyle";
export type { EditSurfaceStyleSettings } from "./editSurfaceStyle";
export { assignItemStyle } from "./assignItemStyle";
export type { AssignItemStyleSettings } from "./assignItemStyle";
export { assignMaterialStyle } from "./assignMaterialStyle";
export type { AssignMaterialStyleSettings } from "./assignMaterialStyle";
export { assignRepresentationStyles } from "./assignRepresentationStyles";
export type { AssignRepresentationStylesSettings } from "./assignRepresentationStyles";
export { unassignMaterialStyle } from "./unassignMaterialStyle";
export type { UnassignMaterialStyleSettings } from "./unassignMaterialStyle";
export { unassignRepresentationStyles } from "./unassignRepresentationStyles";
export type { UnassignRepresentationStylesSettings } from "./unassignRepresentationStyles";
