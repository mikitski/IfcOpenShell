// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/classification/add_classification.py` (src/ifcopenshell-
// python, 127 lines) -- the first of this project's `api.classification` chunk (6
// files, ~715 lines total; see `index.ts`'s own header comment for the module's overall
// scope). Adds a new `IfcClassification` (a classification system such as "Uniclass"),
// either from scratch (a bare `Name`, option 1) or migrated in from an external
// classification library file via `util/migrator.ts`'s `Migrator` (option 2), then
// relates it to the project via a new `IfcRelAssociatesClassification`.
//
// --- `IfcClassification`'s attribute order, verified not assumed ---
//
// `Source`(0)/`Edition`(1)/`EditionDate`(2)/`Name`(3) are identical and contiguous
// across all 3 schemas' generated `.d.ts` files -- `IFC4`/`IFC4X3` additionally append
// `Description`(4)/`Location`|`Specification`(5)/`ReferenceTokens`(6), but those trailing
// positions are never touched by this file. No DERIVE-attribute-interleaving gotcha
// here (verified directly, not assumed): `IfcClassification` declares no DERIVE
// attributes in any of the 3 schemas.
//
// --- Real Python quirk, disclosed not "fixed": no `OwnerHistory` on the project rel ---
//
// `relate_to_project`'s `IfcRelAssociatesClassification` create call passes `GlobalId`/
// `RelatedObjects`/`RelatingClassification` but deliberately never `OwnerHistory` --
// unlike `add_reference.ts`'s own `IfcRelAssociatesClassification` creation (which DOES
// call `ifcopenshell.api.owner.create_owner_history`). This asymmetry is real, verified
// directly against the Python source (not a translation slip): `add_classification.py`'s
// `relate_to_project` simply never mentions `OwnerHistory` as a kwarg, so it's left at
// its schema default (unset/`null`) -- ported verbatim, not "fixed" to match
// `add_reference`'s more careful convention.
//
// --- `add_from_library`'s `EditionDate` dance, ported verbatim including its own
//     `# TODO: should auto date migration be part of the migrator?` comment ---
//
// The *source* library classification's `EditionDate` (an `IfcCalendarDate` entity on
// IFC2X3, or a plain date string on IFC4+ -- whichever schema the LIBRARY file happens
// to be, independent of `file`'s own target schema) is read via `util/date.ts`'s
// `ifc2datetime` and then nulled out on the source entity *before* migrating, so
// `Migrator.migrate` doesn't attempt to carry over a value shape the target schema might
// not resolve the same way. After migration, the parsed edition date is converted back
// via `datetime2ifc` for the TARGET file's own schema: a freshly-created `IfcCalendarDate`
// entity if `file.schema === "IFC2X3"`, or a plain `IfcDate` string otherwise.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as dateUtil from "../../util/date";
import { Migrator } from "../../util/migrator";
import { wrapUsecase } from "../hooks";

function relateToProject(file: IfcFile, classification: EntityInstance): void {
	const project = file.byType("IfcProject")[0];
	// `IfcRelAssociatesClassification`: GlobalId(0), OwnerHistory(1, left unset -- see
	// this file's header comment), Name(2), Description(3), RelatedObjects(4),
	// RelatingClassification(5).
	file.createEntity("IfcRelAssociatesClassification", guid.new(), null, null, null, [project], classification);
}

function addFromLibrary(file: IfcFile, classification: EntityInstance): EntityInstance {
	let editionDate: dateUtil.Duration | dateUtil.IfcDateTimeValue | undefined;
	const sourceEditionDate = classification.get("EditionDate") as string | EntityInstance | null;
	if (sourceEditionDate) {
		editionDate = dateUtil.ifc2datetime(sourceEditionDate);
		classification.set("EditionDate", null);
	}

	const migrator = new Migrator();
	const result = migrator.migrate(classification, file);

	if (file.schema === "IFC2X3" && editionDate) {
		const calendarDateAttrs = dateUtil.datetime2ifc(editionDate, "IfcCalendarDate") as Record<string, number>;
		// `IfcCalendarDate`: DayComponent(0), MonthComponent(1), YearComponent(2) --
		// same order confirmed by `util/migrator.ts`'s own identical positional
		// construction (`preprocess`'s `IfcCalendarDate` handling).
		result.set(
			"EditionDate",
			file.createEntity(
				"IfcCalendarDate",
				calendarDateAttrs.DayComponent,
				calendarDateAttrs.MonthComponent,
				calendarDateAttrs.YearComponent,
			),
		);
	} else {
		result.set("EditionDate", editionDate ? dateUtil.datetime2ifc(editionDate, "IfcDate") : null);
	}

	relateToProject(file, result);
	return result;
}

export interface AddClassificationSettings {
	/**
	 * If a string is provided, it is assumed to be the name of your classification
	 * system. Alternatively, you may provide an `IfcClassification` entity_instance
	 * from an IFC classification library (see this function's own doc comment below).
	 */
	classification: string | EntityInstance;
}

function addClassificationUsecase(file: IfcFile, settings: AddClassificationSettings): EntityInstance {
	const { classification } = settings;
	if (typeof classification === "string") {
		// `IfcClassification`: Source(0), Edition(1), EditionDate(2), Name(3) -- see this
		// file's header comment.
		const created = file.createEntity("IfcClassification", null, null, null, classification);
		relateToProject(file, created);
		return created;
	}
	return addFromLibrary(file, classification);
}

/**
 * Adds a new classification system to the project (Python:
 * `ifcopenshell.api.classification.add_classification`).
 *
 * External classification systems such as Uniclass or Omniclass are ways of
 * categorising elements in the AEC industry, typically standardised or nominated by
 * governments or companies. A system typically contains a series of hierarchical
 * reference codes and labels like `Pr_12_23_34`.
 *
 * Adding a classification system will not add the entire hierarchy of references
 * available in the classification. References need to be added separately -- see
 * {@link import("./addReference").addReference}.
 *
 * @example
 * ```ts
 * // Option 1: adding a custom classification from scratch
 * api.classification.addClassification(model, { classification: "MyCustomClassification" });
 *
 * // Option 2: adding a popular classification from a library
 * const library = ifcopenshell.open("/path/to/Uniclass.ifc");
 * const libraryClassification = library.byType("IfcClassification")[0];
 * api.classification.addClassification(model, { classification: libraryClassification });
 * ```
 */
export const addClassification = wrapUsecase("classification.add_classification", addClassificationUsecase);
