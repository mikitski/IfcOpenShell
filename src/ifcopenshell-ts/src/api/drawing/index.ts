// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.drawing` (src/ifcopenshell-python's `ifcopenshell/api/
// drawing/` package, 3 real files, 223 lines total) -- a brand-new module (no TS port
// of any kind existed before this chunk), all 3 functions ported in one chunk together
// with the also brand-new `api.control`/`api.pset_template` modules (11 real files,
// ~821 lines combined -- see the sibling `../control/index.ts`/`../pset_template/
// index.ts` for those).
//
// Associates products (or `IfcGridAxis`es) with objects (typically `IfcAnnotation`) via
// `IfcRelAssignsToProduct` (`assignProduct`/`unassignProduct`), and edits an
// `IfcTextLiteral`'s attributes (`editTextLiteral`) -- the "experimental API" (real
// Python's own docstring warning, preserved in `./assignProduct.ts`'s own doc comment)
// backing annotation/drawing features (dimension lines, labels, grid-axis callouts).
//
// --- Dependencies confirmed already landed (verified by reading each, not assumed) ---
//
// `api.owner` (`createOwnerHistory`/`updateOwnerHistory`, used by `assignProduct`/
// `unassignProduct`), `guid` (`assignProduct`'s grid/general branches), `util.element`
// (`removeDeep2`, used by `unassignProduct`). No `numpy`/`shape_builder`/
// `ifcopenshell.geom` import anywhere in this module (confirmed by reading all 3 real
// files) -- no geometry-kernel blocker.
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.drawing.assignProduct`/`api.drawing.unassignProduct`/`api.drawing.editTextLiteral`.
export { assignProduct } from "./assignProduct";
export type { AssignProductSettings } from "./assignProduct";
export { editTextLiteral } from "./editTextLiteral";
export type { EditTextLiteralSettings } from "./editTextLiteral";
export { unassignProduct } from "./unassignProduct";
export type { UnassignProductSettings } from "./unassignProduct";
