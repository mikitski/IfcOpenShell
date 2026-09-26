// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.library` (src/ifcopenshell-python's `ifcopenshell/api/
// library/` package, 8 files, ~542 lines total including `__init__.py`) -- all 8
// functions ported in one chunk, completing that module. Manages
// `IfcLibraryInformation`/`IfcLibraryReference` -- external classification/reference
// libraries (e.g. Uniclass, a manufacturer's product library, a Brickschema dataset, a
// BACnet system) and the references into them, assigned to rooted objects via
// `IfcRelAssociatesLibrary`.
//
// The third sibling in the `classification`/`document`/`library` family (all 3 now
// fully ported). Structurally closest to `../document` overall (see
// `assignReference.ts`/`unassignReference.ts`'s own header comments -- both reuse
// `../document/assignDocument.ts`/`unassignDocument.ts`'s exact shape, and real Python's
// own source explicitly cross-references this: `document.assign_document`'s docstring
// carries the comment "NOTE: reuses the same shape as `library.assign_reference`"),
// EXCEPT `add_reference`/`edit_reference`/`remove_reference`, which are each simpler,
// smaller, and structurally closer to neither sibling than to each other -- `library`
// has no non-`IfcRoot` "resource object" support anywhere (unlike `classification`) and
// no multi-parent/subdocument tree (unlike `document`'s `IfcDocumentInformationRelationship`
// machinery) -- confirmed directly against the real Python source for every one of the 8
// files, not assumed from either sibling's shape.
//
// No unported dependency of any kind: every file only imports `ifcopenshell.api.owner`
// (`create_owner_history`/`update_owner_history`, both already landed),
// `ifcopenshell.util.date`/`ifcopenshell.util.element` (both already fully ported,
// including `get_referenced_elements`'s `REFERENCE_TYPES` table's
// `IfcLibraryReference`/`IfcLibraryInformation` rows -- added in the `api.classification`
// chunk, already exercised by `api.document`, this module is simply their third
// caller), plus `ifcopenshell.guid` -- confirmed directly against the real Python
// source's own imports, not assumed.
//
// Three real, disclosed IFC2X3-vs-IFC4+ schema differences, investigated directly
// against the real Python source and the generated `.d.ts`s, not assumed from either
// sibling's own findings:
// 1. `IfcLibraryReference` has only 3 attributes on IFC2X3 (`Location`/`ItemReference`/
//    `Name`) vs. 6 on IFC4+ (adding `Description`/`Language`/`ReferencedLibrary`) -- no
//    `ReferencedLibrary` forward link at all on IFC2X3, which instead links the other
//    way via a forward `IfcLibraryInformation.LibraryReference` list attribute (the same
//    general shape as `../document`'s `Identification`-vs-`ItemReference` finding, but
//    with a different, IFC2X3-only trailing attribute name -- `ItemReference`, not
//    renamed from anything -- and a starker attribute-count gap: 3 vs. 6, not 4 vs. 5).
//    See `addReference.ts`'s own header comment.
// 2. `IfcLibraryInformation.VersionDate` is an `IfcCalendarDate` ENTITY reference on
//    IFC2X3 but a plain `IfcDateTime` STRING on IFC4+ -- a genuinely new finding not
//    called out by either sibling module (neither `IfcClassification` nor
//    `IfcDocumentInformation` has an analogous datetime-typed attribute that this port
//    has needed to special-case in an `edit_*` function before). See `editLibrary.ts`'s
//    own header comment for the full `datetime2ifc`-based conversion.
// 3. `remove_reference.py`'s own IFC2X3 branch does a direct `file.by_type(
//    "IfcRelAssociatesLibrary")` scan filtered by `RelatingLibrary == reference`, NOT
//    `../document/removeReference.ts`'s own `file.get_inverse(reference)` call -- a real,
//    disclosed asymmetry between the two structurally-similar sibling modules,
//    confirmed directly against both real Python sources (not a translation slip in
//    either port). See `removeReference.ts`'s own header comment.
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.library.addLibrary`/`api.library.addReference`/etc.
export { addLibrary } from "./addLibrary";
export type { AddLibrarySettings } from "./addLibrary";
export { addReference } from "./addReference";
export type { AddReferenceSettings } from "./addReference";
export { assignReference } from "./assignReference";
export type { AssignReferenceSettings } from "./assignReference";
export { editLibrary } from "./editLibrary";
export type { EditLibrarySettings } from "./editLibrary";
export { editReference } from "./editReference";
export type { EditReferenceSettings } from "./editReference";
export { removeLibrary } from "./removeLibrary";
export type { RemoveLibrarySettings } from "./removeLibrary";
export { removeReference } from "./removeReference";
export type { RemoveReferenceSettings } from "./removeReference";
export { unassignReference } from "./unassignReference";
export type { UnassignReferenceSettings } from "./unassignReference";
