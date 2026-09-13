// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.classification` (src/ifcopenshell-python's `ifcopenshell/
// api/classification/` package, 6 files, ~715 lines total) -- all 6 functions ported in
// one chunk, completing that module. Manages `IfcClassification`/
// `IfcClassificationReference` -- external classification systems (e.g. Uniclass,
// Omniclass) and the references into them, assigned to products/types/resources via
// `IfcRelAssociatesClassification` (rooted objects) or `IfcExternalReferenceRelationship`
// (non-rooted "resource" objects, IFC4+ only). Distinct from `api.group`/`api.system`/
// `api.spatial`/`api.aggregate`, per the real Python package's own module docstring
// (referenced from `../group/index.ts`'s own header comment).
//
// No unported dependency of any kind: every file only imports `ifcopenshell.api.owner`
// (`create_owner_history`/`update_owner_history`, both already landed),
// `ifcopenshell.util.date`/`ifcopenshell.util.element`/`ifcopenshell.util.schema` (all
// already fully ported), plus `ifcopenshell.guid` -- confirmed directly against the
// real Python source's own imports, not assumed.
//
// One exception, disclosed: `ifcopenshell.util.element.get_referenced_elements` (and
// its backing `REFERENCE_TYPES` table) had been deliberately deferred out of
// `util/element.ts`'s own 3-chunk port (see that file's own header comment) as
// belonging to "classification/document/library association" territory rather than
// that chunk's spatial/structural-graph domain -- but `add_reference`/`remove_reference`
// (this chunk) are its first genuine callers, so it's added here, in full (all 6
// `REFERENCE_TYPES` entries, not narrowed to just the `IfcClassification*` rows this
// module exercises), appended to `util/element.ts` just after `has_openings` --
// matching Python's own function ordering in `element.py`. See that file's own updated
// header comment for the full disclosure.
//
// Two real, disclosed IFC2X3-vs-IFC4+ schema differences, investigated directly against
// the real Python source and the generated `.d.ts`s, not assumed:
// 1. `IfcClassificationReference` has no `Identification` attribute on IFC2X3 -- its
//    equivalent field is named `ItemReference` instead. Every read/write of this field
//    across `add_reference.ts`/`remove_reference.ts` branches on `file.schema` to use
//    the right attribute name, matching real Python's own identical branching exactly.
// 2. `IfcExternalReferenceRelationship` (the non-rooted "resource object" association
//    class) doesn't exist in IFC2X3 at all -- `add_reference`/`remove_reference` both
//    raise `TypeError` for any non-`IfcRoot` product on IFC2X3 before ever reaching
//    that code path, matching real Python's own explicit schema guard.
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.classification.addClassification`/`api.classification.addReference`/etc.
export { addClassification } from "./addClassification";
export type { AddClassificationSettings } from "./addClassification";
export { addReference } from "./addReference";
export type { AddReferenceSettings } from "./addReference";
export { editClassification } from "./editClassification";
export type { EditClassificationSettings } from "./editClassification";
export { editReference } from "./editReference";
export type { EditReferenceSettings } from "./editReference";
export { removeClassification } from "./removeClassification";
export type { RemoveClassificationSettings } from "./removeClassification";
export { removeReference } from "./removeReference";
export type { RemoveReferenceSettings } from "./removeReference";
