// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.root` (src/ifcopenshell-python's
// `ifcopenshell/api/root/` package) -- now FULLY PORTED, all 4 functions:
// `create_entity` (`./createEntity.ts`), `remove_product` (`./removeProduct.ts`),
// `reassign_class` (`./reassignClass.ts`), `copy_class` (`./copyClass.ts`). Matches
// `research/02-python-api-inventory.md` SS3's own framing ("conceptually simple API
// surface (4 functions) but each one is a mini graph-traversal algorithm") and
// `planning/ifcopenshell-ts/PROGRESS.md`'s Phase 6 table. Namespaced per this project's
// `util/index.ts` per-submodule convention: `api.root.createEntity`,
// `api.root.removeProduct`, `api.root.reassignClass`, `api.root.copyClass`.
//
// `reassignClass`/`copyClass` each have one real, disclosed blocker (needing
// `api.geometry.assignRepresentation`/`.editObjectPlacement` and, for `copyClass`,
// `api.system`/`api.material` respectively) -- see each file's own header comment and
// `TODOS.md`; every other real Python behavior in both files is ported completely and
// faithfully.
export { copyClass } from "./copyClass";
export type { CopyClassSettings } from "./copyClass";
export { createEntity } from "./createEntity";
export type { CreateEntitySettings } from "./createEntity";
export { reassignClass } from "./reassignClass";
export type { ReassignClassSettings } from "./reassignClass";
export { removeProduct } from "./removeProduct";
export type { RemoveProductSettings } from "./removeProduct";
