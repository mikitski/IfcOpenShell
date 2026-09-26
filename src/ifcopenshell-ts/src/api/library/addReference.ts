// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/library/add_reference.py` (src/ifcopenshell-python, 51
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Creates a new, empty `IfcLibraryReference` linked to `library` -- a single entry (e.g.
// a table/row, a URI, a BACnet object identifier) within that external library. Unlike
// `../classification/addReference.ts` (this chunk's own explicitly-flagged structural
// precedent per the task brief), there is no "from identification" vs. "from library"
// branch here at all -- real Python's `add_reference` is a single, tiny function with
// only ONE schema branch (IFC2X3 vs. IFC4+, below), no `is_lightweight`/migration
// machinery whatsoever. `IfcLibraryReference` has no non-rooted "resource object"
// analogue either -- confirmed directly against the real Python source, which has no
// `IfcRoot`/non-`IfcRoot` partition anywhere in this module (see `./assignReference.ts`'s
// own header comment on this point too).
//
// --- Real IFC2X3-vs-IFC4+ schema difference, investigated not assumed (a DIFFERENT
//     shape from `../classification`'s `Identification`-vs-`ItemReference` rename) ---
//
// IFC2X3's `IfcLibraryReference` has only 3 attributes at all: `Location`(0)/
// `ItemReference`(1)/`Name`(2) -- no `Description`/`Language`, and critically no
// `ReferencedLibrary` forward link to the owning `IfcLibraryInformation` at all
// (confirmed against `ifc2x3.d.ts`). IFC4+ has 6: `Location`(0)/`Identification`(1)/
// `Name`(2)/`Description`(3)/`Language`(4)/`ReferencedLibrary`(5) (confirmed against
// `ifc4.d.ts`/`ifc4x3.d.ts`). So on IFC2X3, real Python instead links the two entities
// the OTHER way around: appending the new reference onto `library.LibraryReference` (a
// genuine forward, IFC2X3-only list attribute on `IfcLibraryInformation` itself,
// confirmed against `ifc2x3.d.ts`) -- the exact same shape as
// `../document/addReference.ts`'s `information.DocumentReferences` dance (that file's own
// header comment explains the general pattern; this is `library`'s own independent
// instance of it, verified directly against `ifc2x3.d.ts`, not assumed from symmetry with
// `document`).
//
// No DERIVE-attribute-interleaving gotcha (verified directly): `IfcLibraryReference`
// declares no DERIVE attributes in any of the 3 schemas.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface AddReferenceSettings {
	/** The `IfcLibraryInformation` element to add a reference to. */
	library: EntityInstance;
}

function addReferenceUsecase(file: IfcFile, settings: AddReferenceSettings): EntityInstance {
	const { library } = settings;

	if (file.schema === "IFC2X3") {
		// IfcLibraryReference (IFC2X3): Location(0), ItemReference(1), Name(2) -- all left
		// unset, matching real Python's own zero-kwarg `createIfcLibraryReference()` call.
		const reference = file.createEntity("IfcLibraryReference");
		const references = [...((library.get("LibraryReference") as EntityInstance[] | null) ?? [])];
		references.push(reference);
		library.set("LibraryReference", references);
		return reference;
	}
	// IfcLibraryReference (IFC4+): Location(0), Identification(1), Name(2),
	// Description(3), Language(4), ReferencedLibrary(5).
	return file.createEntity("IfcLibraryReference", null, null, null, null, null, library);
}

/**
 * Adds a new reference to a library (Python: `ifcopenshell.api.library.add_reference`).
 *
 * A library represents an external data source, such as a database, spreadsheet, API,
 * or something else that contains information related to the IFC project. Within a
 * library, there will be one or more references, such as a reference to a particular
 * table or row in a database, or a sheet and row or column in a spreadsheet, a URI in a
 * linked data Brickschema file, a 32-bit decimal `BACnetObjectIdentifier` in a BACnet
 * system, an IP address in a network, and so on.
 *
 * These references can then be related to IFC elements. You cannot relate an IFC
 * element directly to a library, it must be related to one of the library's references.
 *
 * @example
 * ```ts
 * const library = api.library.addLibrary(model, { name: "Brickschema" });
 *
 * // Let's create a reference to a single AHU in our Brickschema dataset
 * const reference = api.library.addReference(model, { library });
 * api.library.editReference(model, {
 *   reference,
 *   attributes: { Identification: "http://example.org/digitaltwin#AHU01" },
 * });
 * ```
 */
export const addReference = wrapUsecase("library.add_reference", addReferenceUsecase);
