// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.root` (src/ifcopenshell-python's
// `ifcopenshell/api/root/` package). `create_entity` (`./createEntity.ts`) and
// `remove_product` (`./removeProduct.ts`) are now both ported -- `reassign_class`/
// `copy_class` remain their own future chunks, per `research/02-python-api-inventory.md`
// SS3's own framing ("conceptually simple API surface (4 functions) but each one is a
// mini graph-traversal algorithm") and `planning/ifcopenshell-ts/PROGRESS.md`'s Phase 6
// table. Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.root.createEntity`, `api.root.removeProduct`.
export { createEntity } from "./createEntity";
export type { CreateEntitySettings } from "./createEntity";
export { removeProduct } from "./removeProduct";
export type { RemoveProductSettings } from "./removeProduct";
