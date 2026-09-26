// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/library/add_library.py` (src/ifcopenshell-python, 60 lines)
// -- the first of this project's `api.library` chunk (8 files, ~542 lines total; see
// `./index.ts`'s own header comment for the module's overall scope). Adds a new
// `IfcLibraryInformation` (an external data source such as a database, spreadsheet, or
// API) with a bare `Name`, no relationship to the project at all -- unlike
// `../classification/addClassification.ts`'s `IfcRelAssociatesClassification` and
// `../document/addInformation.ts`'s `IfcRelAssociatesDocument`, real Python's
// `add_library` creates a completely unattached `IfcLibraryInformation`; nothing relates
// it to `IfcProject`. Ported verbatim -- not "fixed" to add a project rel neither
// sibling module's own real Python source calls for here either (this one is simply
// starker about it: it has no `relate_to_project` helper of any kind, unlike
// `add_classification.py`).
//
// --- `IfcLibraryInformation`'s attribute order, verified not assumed ---
//
// `Name`(0) sits at the same position in all 3 schemas (confirmed against
// `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`) -- only position ever touched by this file.
// No DERIVE-attribute-interleaving gotcha (verified directly): `IfcLibraryInformation`
// declares no DERIVE attributes in any of the 3 schemas.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddLibrarySettings {
	/** The name of the library. */
	name: string;
}

function addLibraryUsecase(file: IfcFile, settings: AddLibrarySettings): EntityInstance {
	// `IfcLibraryInformation`: Name(0) -- see header comment.
	return file.createEntity("IfcLibraryInformation", settings.name);
}

/**
 * Adds a new library to the project (Python: `ifcopenshell.api.library.add_library`).
 *
 * A library is an external data source that is related to the project. It may be a
 * database, a spreadsheet, an API, or even a stack of papers in a filing cabinet. This
 * allows IFC data to store relationships to these external data sources.
 *
 * A library will then contain a list of references within that library. These
 * references will then be related to IFC elements. For example, a library will
 * represent an external database, and a reference will point to a particular table and
 * row within that database.
 *
 * @example
 * ```ts
 * const library = api.library.addLibrary(model, { name: "Brickschema" });
 * ```
 */
export const addLibrary = wrapUsecase("library.add_library", addLibraryUsecase);
