// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.layer` (src/ifcopenshell-python's `ifcopenshell/api/
// layer/` package, 6 files, ~373 lines total) -- all 6 functions ported in one chunk,
// per the Phase 6 roadmap. Manages `IfcPresentationLayerAssignment`/
// `IfcPresentationLayerWithStyle` -- presentation layers, like CAD layers, used to
// group/hide/style representations (representation ITEMS are assigned to layers, not
// whole elements -- for whole-element grouping, see `api.classification` instead, per
// the real Python package's own module docstring).
//
// No geometry-kernel or other unported hard dependency anywhere in this module (every
// file only ever imports bare `ifcopenshell`, `collections.abc.Sequence`, `typing`).
//
// Two disclosed findings surfaced while porting this chunk (see each file's own header
// comment for the full empirical writeup):
// 1. `addLayerWithStyle.ts` -- this port's LOGICAL-attribute round-trip doesn't yet
//    match Python's bool-like semantics (`get()` returns raw `1`/`0`, not JS
//    `true`/`false`); a pre-existing primitive-layer gap, not fixed here.
// 2. `unassignLayer.ts` -- a genuine real-Python-source bug (`set(layer.AssignedItems)
//    or set()` crashes with `TypeError` on a never-assigned layer, rather than
//    defaulting to empty as the `or` might suggest) is reproduced verbatim, not
//    silently guarded away.
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.layer.addLayer`/`api.layer.assignLayer`/etc.
export { addLayer } from "./addLayer";
export type { AddLayerSettings } from "./addLayer";
export { addLayerWithStyle } from "./addLayerWithStyle";
export type { AddLayerWithStyleSettings, IfcLogical } from "./addLayerWithStyle";
export { assignLayer } from "./assignLayer";
export type { AssignLayerSettings } from "./assignLayer";
export { editLayer } from "./editLayer";
export type { EditLayerSettings } from "./editLayer";
export { removeLayer } from "./removeLayer";
export type { RemoveLayerSettings } from "./removeLayer";
export { unassignLayer } from "./unassignLayer";
export type { UnassignLayerSettings } from "./unassignLayer";
