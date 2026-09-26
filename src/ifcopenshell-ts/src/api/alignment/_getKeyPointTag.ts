// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_get_key_point_tag.py` (src/ifcopenshell-python,
// 30 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 3 of many). Depends on already-landed `util.alignment.station_as_string`
// (`../../util/alignment.ts`'s `stationAsString`, verified against its real exported
// name/signature before use) -- no blocker.
//
// Real Python's leading underscore marks this as module-private (absent from
// `__init__.py`'s own `__all__` -- see `./_sortNest.ts`'s own header comment for the
// same convention) -- NOT re-exported from `./index.ts`'s public barrel; a future
// chunk (`update_alignment_parameter_segment_tags`/`update_key_point_referents`) will
// import it directly by relative path, matching real Python's own
// `from ifcopenshell.api.alignment._get_key_point_tag import _get_key_point_tag`.
import type { IfcFile } from "../../file";
import { stationAsString } from "../../util/alignment";

/**
 * Builds the station-and-label text shared by `update_alignment_parameter_segment_tags`
 * (used directly as `IfcAlignmentParameterSegment.StartTag`/`EndTag`) and
 * `update_key_point_referents` (used, prefixed with the alignment name, as
 * `IfcReferent.Name`): `"<station> (<label>)"`, e.g. `"145+98.32 (P.O.B.)"` (Python:
 * `ifcopenshell.api.alignment._get_key_point_tag`).
 *
 * @param file The file (passed through to `stationAsString` to resolve the project's
 *   length unit).
 * @param label The key-point label, e.g. `"P.O.B."`.
 * @param station The station, in the file's own project length units.
 * @returns The combined station-and-label text.
 */
export function _getKeyPointTag(file: IfcFile, label: string, station: number): string {
	return `${stationAsString(file, station)} (${label})`;
}
