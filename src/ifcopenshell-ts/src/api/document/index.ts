// This file was generated with the assistance of an AI coding tool.
//
// Barrel for `ifcopenshell.api.document` (src/ifcopenshell-python's `ifcopenshell/api/
// document/` package, 8 files, ~600 lines total including `__init__.py`) -- all 8
// functions ported in one chunk, completing that module. Manages
// `IfcDocumentInformation`/`IfcDocumentReference` -- external project documents
// (drawings, specifications, certificates, reports, etc) and references into them,
// assigned to model elements via `IfcRelAssociatesDocument`.
//
// Structurally the closest sibling to `../classification` (same real Python package
// shape: an `add_*`/`assign_*`/`edit_*`/`remove_*`/`unassign_*` split over an
// "information system" class and a "reference into it" class), but with one real,
// disclosed asymmetry: unlike `classification.addReference`/`removeReference`, this
// module's `assignDocument`/`unassignDocument` do NOT support non-`IfcRoot` "resource"
// objects via `IfcExternalReferenceRelationship` at all -- confirmed directly against
// the real Python source, which carries its own unresolved `# TODO: do we need to
// support non-ifcroot elements like we do in classification.add_reference?` comment on
// both functions. See `assignDocument.ts`'s own header comment for the full writeup;
// ported verbatim, not "fixed" to add parity with `classification`.
//
// No unported dependency of any kind: every file only imports `ifcopenshell.api.owner`
// (`create_owner_history`/`update_owner_history`, both already landed),
// `ifcopenshell.util.element` (already fully ported, including its `REFERENCE_TYPES`
// table's `IfcDocumentReference`/`IfcDocumentInformation` rows -- added in the
// `api.classification` chunk, this module's first genuine caller for those two rows),
// plus `ifcopenshell.guid` -- confirmed directly against the real Python source's own
// imports, not assumed.
//
// Three real, disclosed IFC2X3-vs-IFC4+ schema differences, investigated directly
// against the real Python source and the generated `.d.ts`s, not assumed:
// 1. `IfcDocumentReference` has no `Identification` attribute on IFC2X3 -- its
//    equivalent field is named `ItemReference` instead, AND it has no `ReferencedDocument`
//    forward link to `IfcDocumentInformation` at all (IFC2X3 links the other way, via a
//    forward `IfcDocumentInformation.DocumentReferences` list attribute instead -- see
//    `addReference.ts`'s own header comment for the full writeup, the task brief's own
//    predicted "analogous IFC2X3-vs-IFC4+ naming difference", confirmed).
// 2. `IfcDocumentInformationRelationship` has no `Name`/`Description` attributes on
//    IFC2X3, shifting `RelatingDocument`/`RelatedDocuments` two positions earlier than
//    on IFC4+ -- a NEW finding, not called out by the task brief (see `addInformation.ts`'s
//    own header comment).
// 3. `IfcExternalReferenceRelationship` doesn't exist in IFC2X3 at all -- moot for this
//    module specifically, since (per the asymmetry noted above) `assignDocument`/
//    `unassignDocument` never reach that class on ANY schema, unlike `classification`'s
//    equivalents.
//
// Namespaced per this project's `util/index.ts` per-submodule convention:
// `api.document.addInformation`/`api.document.addReference`/etc.
export { addInformation } from "./addInformation";
export type { AddInformationSettings } from "./addInformation";
export { addReference } from "./addReference";
export type { AddReferenceSettings } from "./addReference";
export { assignDocument } from "./assignDocument";
export type { AssignDocumentSettings } from "./assignDocument";
export { editInformation } from "./editInformation";
export type { EditInformationSettings } from "./editInformation";
export { editReference } from "./editReference";
export type { EditReferenceSettings } from "./editReference";
export { removeInformation } from "./removeInformation";
export type { RemoveInformationSettings } from "./removeInformation";
export { removeReference } from "./removeReference";
export type { RemoveReferenceSettings } from "./removeReference";
export { unassignDocument } from "./unassignDocument";
export type { UnassignDocumentSettings } from "./unassignDocument";
