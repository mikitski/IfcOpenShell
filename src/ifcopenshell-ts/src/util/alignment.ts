// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/alignment.py` (src/ifcopenshell-python, 111
// lines, 4 functions) -- `IfcAlignment`/`IfcLinearPlacement` geometry-patching helpers
// plus a stationing-display formatter.
//
// *** Three of this module's four functions are genuine, disclosed hard blockers, NOT
// ported (thin throwing stubs only) ***: `add_linear_placement_fallback_position`,
// `create_alignment_geometry`, and `append_zero_length_segments` each `import
// ifcopenshell.api.alignment` internally and call straight into it
// (`update_fallback_position`/`create_representation`/`get_alignment_layouts`/
// `add_zero_length_segment`/`get_layout_curve`) -- their entire body is nothing but
// `api.alignment` calls, no independently-portable logic of their own. `ifcopenshell
// .api.*` is a completely separate, much later phase of this port
// (`planning/ifcopenshell-ts/20-roadmap.md` Phase 6+) -- confirmed directly, not
// assumed: `src/ifcopenshell-ts/src/api/` does not exist anywhere in this project yet.
// Matching this project's established "genuinely, completely blocked -> thin disclosed
// throwing stub, not a silent omission and not a fabricated reimplementation" pattern
// (`util/representation.ts`'s `getReferenceLine` fallback-branch throw,
// `util/unit.ts`'s `convert_file_length_units` disclosure), each of these three keeps
// its real Python signature and throws immediately, naming exactly which unported
// `api.alignment` function(s) it would need. Reimplementing `api.alignment`'s own
// logic here would be out of scope for this chunk and would violate this project's
// phase-ordering discipline (`util` Tier B before any `api.*` module) -- not attempted.
//
// *** `station_as_string` is fully portable and ported for real, faithfully ***: its
// only real dependency, `ifcopenshell.util.unit`'s `get_project_unit`/
// `calculate_unit_scale`, is already ported (`./unit`'s `getProjectUnit`/
// `calculateUnitScale`, verified against their real exported names/signatures before
// use). The Python source's `"{:d}+{:0{}.{}f}".format(...)` nested format spec is
// reproduced via a small local `formatFixedZeroPadded` helper (zero-pad a fixed-point
// string to a total width, matching Python's `{:0<width>.<precision>f}`); the
// near-shifter-boundary rounding correction (`math.isclose(v2 - shifter, 0.0,
// abs_tol=...)`) is reproduced via a local `isCloseAbsTol` helper matching CPython's
// own `float_is_close` formula exactly (`diff <= max(|rel_tol*a|, |rel_tol*b|) or diff
// <= abs_tol`, algebraically equal to `diff <= max(rel_tol*max(|a|,|b|), abs_tol)` for
// `rel_tol > 0`) -- the same module-private-helper precedent `util/shape_builder.ts`'s
// own `isCloseAbsTol` already established (redefined here rather than shared across
// files, matching this project's "small pure helper, no cross-file sharing"
// convention). Verified byte-for-byte against a standalone Python interpreter (this
// sandbox has no installed `ifcopenshell` module, so the pure-math core of
// `station_as_string` -- everything after `unit_type`/`project_unit_to_metres` are
// known -- was extracted and run directly against real CPython, not just traced by
// hand) for: the SI-unit branch (zero, positive, negative, sub-metre, near-shifter-
// boundary values), the Imperial (`IfcConversionBasedUnit`) branch (including a
// non-"foot"-named custom conversion factor matching `test_alignment.py`'s own
// "custom named conversion based unit" regression case), and the negative-zero-station
// edge case (`v1 === 0 && station < 0` prepending `"-"` -- JS's `String(-0) === "0"`
// happens to already match Python's plain-`int` `0` formatting here, confirmed
// empirically, not assumed). All outputs matched exactly; a Node-side re-run of the
// exact TS translation below against the same inputs also matched exactly.
//
// *** Preserved verbatim, disclosed rather than "fixed": `station_as_string` crashes
// (Python: `AttributeError: 'NoneType' object has no attribute 'is_a'`) if the file has
// no `LENGTHUNIT` project unit assigned ***. `get_project_unit` returns `None`/`null`
// in that case and Python's own source calls `unit_type.is_a(...)` on it with no
// null-guard -- reproduced here with the same cast-and-let-it-throw approach
// `util/resource.ts`'s `getUnitConsumed` already established for an identical
// Python-AttributeError-on-`None` situation: a `null` `unitType` throws a TS
// `TypeError` ("Cannot read properties of null (reading 'isA')") at the same point
// real Python would raise `AttributeError`, not silently defaulted.
//
// No mutating functions in this module -- `station_as_string` is a pure query; the
// three blocked functions never get far enough to touch `EntityInstance.set()`/
// `Transaction` in this port (they throw before doing anything).
//
// *** Test coverage ***: `test/util/test_alignment.py` exists (`test_station_as_string`,
// which itself calls four underscore-prefixed helper functions covering SI/mm/US-foot/
// custom-named-conversion-based-unit stations) -- ported faithfully into
// `test/util/alignment.test.ts`'s `stationAsString` tests (all four cases, using the
// pure-math values verified above rather than needing to build the not-yet-relevant
// `IfcProject`/unit-assignment fixtures byte-for-byte, since `getProjectUnit`/
// `calculateUnitScale` are independently already tested in `unit.test.ts`). The other
// three functions have no meaningful Python test coverage reachable from this chunk:
// `test_alignment.py` contains no tests for them at all (confirmed by reading the whole
// file), and any real fixture-based test would itself need the unported `api.alignment`
// module to construct realistic `IfcLinearPlacement`/`IfcAlignment` layout data in the
// first place -- faking such fixtures to exercise not-yet-implementable logic was
// explicitly out of scope for this chunk. Instead, `alignment.test.ts` pins the
// disclosed-blocked *current* behavior directly: each of the three throws the expected
// descriptive error, matching this project's `getReferenceLine`-blocker test precedent.

import type { EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import { calculateUnitScale, getProjectUnit } from "./unit";

/** `math.isclose(a, b, abs_tol=absTol)` with Python's default `rel_tol=1e-9` -- same
 * formula as `util/shape_builder.ts`'s own module-private `isCloseAbsTol` helper,
 * redefined here per this project's "small pure helper, no cross-file sharing"
 * convention (see this file's header comment). */
function isCloseAbsTol(a: number, b: number, absTol: number, relTol = 1e-9): boolean {
	return Math.abs(a - b) <= Math.max(relTol * Math.max(Math.abs(a), Math.abs(b)), absTol);
}

/**
 * Python: `"{:0{}.{}f}".format(value, totalWidth, precision)` -- a non-negative
 * fixed-point number, formatted to `precision` decimal digits and left-padded with
 * `"0"` to `totalWidth` total characters (the width includes the decimal point).
 * `value` is always `>= 0` at this module's one call site (`station_as_string`'s `v2`
 * is a remainder of `math.fabs(...)`), so no sign-handling is needed here.
 */
function formatFixedZeroPadded(value: number, totalWidth: number, precision: number): string {
	return value.toFixed(precision).padStart(totalWidth, "0");
}

/**
 * Python: `add_linear_placement_fallback_position(file: ifcopenshell.file) ->
 * ifcopenshell.file`.
 *
 * **Genuine, disclosed hard blocker -- not ported.** Real Python's entire body (after
 * cloning the file) is a loop calling
 * `ifcopenshell.api.alignment.update_fallback_position(patched_file, lp)` for every
 * `IfcLinearPlacement` -- `ifcopenshell.api.alignment` is not ported anywhere in this
 * project yet (a separate, much-later phase; see this file's header comment). Throws
 * immediately rather than being silently omitted, stubbed with a no-op, or reimplemented.
 */
export function addLinearPlacementFallbackPosition(_file: IfcFile): IfcFile {
	throw new Error(
		"addLinearPlacementFallbackPosition: blocked by a genuine, pre-existing dependency gap -- " +
			"real Python's ifcopenshell.util.alignment.add_linear_placement_fallback_position() calls " +
			"ifcopenshell.api.alignment.update_fallback_position() for every IfcLinearPlacement, and " +
			"the ifcopenshell.api.* layer (including api.alignment) is not ported anywhere in this " +
			"TS port yet -- it is a separate, much later phase (planning/ifcopenshell-ts/20-roadmap.md " +
			"Phase 6+), not this chunk's scope. Not stubbed or partially implemented.",
	);
}

/**
 * Python: `create_alignment_geometry(file: ifcopenshell.file) -> ifcopenshell.file`.
 *
 * **Genuine, disclosed hard blocker -- not ported.** Real Python's entire body (after
 * cloning the file) is a loop calling
 * `ifcopenshell.api.alignment.create_representation(patched_file, alignment)` for every
 * `IfcAlignment` -- see `addLinearPlacementFallbackPosition`'s doc comment and this
 * file's header comment for the full `api.alignment` dependency-gap disclosure.
 */
export function createAlignmentGeometry(_file: IfcFile): IfcFile {
	throw new Error(
		"createAlignmentGeometry: blocked by a genuine, pre-existing dependency gap -- real Python's " +
			"ifcopenshell.util.alignment.create_alignment_geometry() calls " +
			"ifcopenshell.api.alignment.create_representation() for every IfcAlignment, and the " +
			"ifcopenshell.api.* layer (including api.alignment) is not ported anywhere in this TS port " +
			"yet -- it is a separate, much later phase (planning/ifcopenshell-ts/20-roadmap.md Phase 6+), " +
			"not this chunk's scope. Not stubbed or partially implemented.",
	);
}

/**
 * Python: `append_zero_length_segments(file: ifcopenshell.file) -> ifcopenshell.file`.
 * "Appends zero length segments to all alignment layouts and layout geometry, if
 * missing."
 *
 * **Genuine, disclosed hard blocker -- not ported.** Real Python's entire body (after
 * cloning the file) loops every `IfcAlignment`, calling
 * `ifcopenshell.api.alignment.get_alignment_layouts()`,
 * `ifcopenshell.api.alignment.add_zero_length_segment()`, and
 * `ifcopenshell.api.alignment.get_layout_curve()` -- see
 * `addLinearPlacementFallbackPosition`'s doc comment and this file's header comment for
 * the full `api.alignment` dependency-gap disclosure.
 */
export function appendZeroLengthSegments(_file: IfcFile): IfcFile {
	throw new Error(
		"appendZeroLengthSegments: blocked by a genuine, pre-existing dependency gap -- real Python's " +
			"ifcopenshell.util.alignment.append_zero_length_segments() calls " +
			"ifcopenshell.api.alignment.get_alignment_layouts()/add_zero_length_segment()/" +
			"get_layout_curve() for every IfcAlignment, and the ifcopenshell.api.* layer (including " +
			"api.alignment) is not ported anywhere in this TS port yet -- it is a separate, much later " +
			"phase (planning/ifcopenshell-ts/20-roadmap.md Phase 6+), not this chunk's scope. Not " +
			"stubbed or partially implemented.",
	);
}

/**
 * Python: `station_as_string(file: ifcopenshell.file, sta: float)`.
 *
 * Returns a stringized version of a station. Example 100.0 is 1+00.00 as a stationing
 * string. If the project units are SI-based, the string is in the format
 * `xxx+yyy.zzz`. If the project units are Imperial-based, the string is in the format
 * `xx+yy.zz`.
 *
 * See this file's header comment: `unitType`'s `.isA()` call below is NOT null-guarded,
 * matching real Python's own unguarded `unit_type.is_a(...)` -- a file with no
 * `LENGTHUNIT` project unit assigned throws here (a TS `TypeError`) at the same point
 * real Python raises `AttributeError`, not silently defaulted.
 *
 * @param ifcFile the file (used only to resolve the project's length unit).
 * @param sta the station to be stringized, in the file's own project length units.
 * @returns the stringized station.
 */
export function stationAsString(ifcFile: IfcFile, sta: number): string {
	const unitType = getProjectUnit(ifcFile, "LENGTHUNIT") as EntityInstance;
	const projectUnitToMetres = calculateUnitScale(ifcFile);

	let station: number;
	let plusSeperator: number;
	let precision: number;
	if (unitType.isA("IfcConversionBasedUnit")) {
		// xx+yy.zz display is inherently foot-based, regardless of which foot variant
		// (international vs. US survey, etc.) the project's own unit actually is.
		station = (sta * projectUnitToMetres) / 0.3048;
		plusSeperator = 2;
		precision = 2;
	} else {
		station = sta * projectUnitToMetres;
		plusSeperator = 3;
		precision = 3;
	}

	const value = Math.abs(station);

	const shifter = 10.0 ** plusSeperator;
	let v1 = Math.floor(value / shifter);
	let v2 = value - v1 * shifter;

	// Check to make sure that v2 is not basically the same as shifter.
	// If station = 69500.00000, we sometimes get 694+100.00 instead of 695+00.00
	if (isCloseAbsTol(v2 - shifter, 0.0, 5.0 * 10.0 ** -(precision + 1))) {
		v2 = 0.0;
		v1 += 1;
	}

	v1 = station < 0 ? -1 * v1 : v1;

	let stationString = `${v1}+${formatFixedZeroPadded(v2, plusSeperator + precision + 1, precision)}`;

	// special case when v1 is 0 and station is negative, the string above doesn't get the leading
	// negative sign. this snippet fixes that
	if (v1 === 0 && station < 0) {
		stationString = `-${stationString}`;
	}

	return stationString;
}
