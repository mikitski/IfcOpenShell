// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/library/edit_library.py` (src/ifcopenshell-python, 55 lines)
// -- an attribute-setter loop like every other `edit_*` function in this project, but
// with one genuinely new wrinkle not seen in `../classification`/`../document`: a
// special-cased `VersionDate` attribute that, when given an actual `datetime.datetime`
// value, is converted to the right on-schema representation (an `IfcDateTime` string on
// IFC4+, or a freshly-created `IfcCalendarDate` entity on IFC2X3) before being assigned
// -- a plain string/other value passed as `VersionDate` is left untouched, exactly
// matching Python's `isinstance(dt, datetime.datetime)` guard (a plain `datetime.date`,
// which is NOT a `datetime.datetime` subclass upward -- Python's `isinstance` check goes
// the other way -- would also be left untouched, matching `util/date.ts`'s own established
// `kind: "date" | "time" | "datetime"` discriminated union standing in for Python's
// `isinstance` trio; see that file's own header comment).
//
// --- `IfcLibraryInformation.VersionDate`'s real IFC2X3-vs-IFC4+ schema difference,
//     confirmed directly against the real Python source AND the generated `.d.ts`s ---
//
// IFC2X3's `IfcLibraryInformation.VersionDate` is typed `IfcCalendarDate | null` (an
// ENTITY reference, confirmed against `ifc2x3.d.ts`) -- so real Python builds a brand-new
// `IfcCalendarDate` entity via `datetime2ifc(dt, "IfcCalendarDate")`'s dict of
// `DayComponent`/`MonthComponent`/`YearComponent` spread into `file.create_entity(
// "IfcCalendarDate", **calendar_date)`. IFC4+'s `IfcLibraryInformation.VersionDate` is
// instead typed `string | null` (an `IfcDateTime` value, confirmed against
// `ifc4.d.ts`/`ifc4x3.d.ts`) -- a plain ISO datetime string via `datetime2ifc(dt,
// "IfcDateTime")`, no entity created at all. Ported via the same schema branch, not
// collapsed to one shared code path.
//
// `IfcCalendarDate`: DayComponent(0), MonthComponent(1), YearComponent(2) -- same order
// confirmed by `../classification/addClassification.ts`'s own identical positional
// construction (`addFromLibrary`'s `IfcCalendarDate` handling) and `util/migrator.ts`'s
// `preprocess` step.
//
// --- Real Python quirk, disclosed not "fixed": `attributes.copy()` shallow-copies the
//     WHOLE dict just to patch one key ---
//
// Real Python's `attributes = attributes.copy(); attributes["VersionDate"] = dt` avoids
// mutating the CALLER's own `attributes` dict in place -- ported the same way via a
// shallow `{ ...attributes, VersionDate: converted }` spread, rather than mutating
// `settings.attributes` directly (which this project's other `edit_*` functions never do
// either, since they never need to transform a value first).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as dateUtil from "../../util/date";
import { wrapUsecase } from "../hooks";

export interface EditLibrarySettings {
	/** The `IfcLibraryInformation` entity you want to edit. */
	library: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

/**
 * Python: `isinstance(dt, datetime.datetime)`, ported via `util/date.ts`'s own
 * `kind: "datetime"` discriminator -- the substitute this project already established
 * for Python's `datetime.datetime`/`datetime.date` `isinstance` trio (see that file's own
 * header comment). `attributes` is an untyped `Record<string, unknown>`, so this is a
 * plain runtime shape check, not a cast.
 */
function isDateTimeValue(value: unknown): value is dateUtil.IsoDateTime {
	return typeof value === "object" && value !== null && (value as { kind?: unknown }).kind === "datetime";
}

function editLibraryUsecase(file: IfcFile, settings: EditLibrarySettings): void {
	let attributes = settings.attributes;

	if ("VersionDate" in attributes) {
		const dt = attributes.VersionDate;
		if (isDateTimeValue(dt)) {
			let converted: string | EntityInstance;
			if (file.schema !== "IFC2X3") {
				converted = dateUtil.datetime2ifc(dt, "IfcDateTime") as string;
			} else {
				const calendarDate = dateUtil.datetime2ifc(dt, "IfcCalendarDate") as Record<string, number>;
				// `IfcCalendarDate`: DayComponent(0), MonthComponent(1), YearComponent(2) --
				// see header comment.
				converted = file.createEntity(
					"IfcCalendarDate",
					calendarDate.DayComponent,
					calendarDate.MonthComponent,
					calendarDate.YearComponent,
				);
			}
			attributes = { ...attributes, VersionDate: converted };
		}
	}

	for (const [name, value] of Object.entries(attributes)) {
		settings.library.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcLibraryInformation` (Python:
 * `ifcopenshell.api.library.edit_library`).
 *
 * For more information about the attributes and data types of an
 * `IfcLibraryInformation`, consult the IFC documentation.
 *
 * @example
 * ```ts
 * const library = api.library.addLibrary(model, { name: "Brickschema" });
 * api.library.editLibrary(model, {
 *   library,
 *   attributes: { Description: "A Brickschema TTL including only mechanical distribution systems." },
 * });
 * ```
 */
export const editLibrary = wrapUsecase("library.edit_library", editLibraryUsecase);
