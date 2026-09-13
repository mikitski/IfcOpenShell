// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.pset` (src/ifcopenshell-python's `ifcopenshell/api/
// pset/` package) -- **NOT a full port of that module**. Only `remove_pset` is ported
// here, as a minimal, direct dependency of `api.group.removeGroup` (see
// `./removePset.ts`'s own header comment for the full disclosure of why exactly this
// one function, and not the rest of the module). `add_pset`/`edit_pset`/`add_qto`/
// `edit_qto`/`assign_pset`/`unassign_pset`/`unshare_pset` (the other 7 files/functions
// of this module -- `edit_pset.py` alone the single biggest file in the whole `api`
// package per `research/02-api-layer.md`) remain unported; a future `api.pset` chunk
// should treat `removePset` as already landed (reviewed against the real Python
// source, see that file's own header comment) rather than re-porting it from scratch.
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.pset.removePset`.
export { removePset } from "./removePset";
export type { RemovePsetSettings } from "./removePset";
