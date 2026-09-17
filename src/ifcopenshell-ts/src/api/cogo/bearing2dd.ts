// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/cogo/bearing2dd.py` (src/ifcopenshell-python, 108 lines)
// -- see `./index.ts`'s own header comment for this brand-new module's full scope.
// Pure string-parsing + arithmetic -- confirmed by reading the full real source that
// its ONLY `ifcopenshell` dependency is `util.geolocation.dms2dd` (already landed,
// `../../util/geolocation.ts`), used purely for arithmetic. No `ifcopenshell.file`/
// entity dependency at all; not a usecase (takes a plain `str`, no `file` parameter).
//
// --- A genuine, verbatim-preserved Python-source quirk: the 4th `dms2dd` argument is
//     NOT real microseconds, despite the real variable being scaled to look like one ---
//
// Real Python extracts a fractional-seconds decimal (`s`) into a whole-seconds `int`
// and a remainder via `ms = 100.0 * (s - int(s))` -- e.g. `s = 22.5` becomes `s = 22`,
// `ms = 50.0`. This `ms` value is then passed as `dms2dd`'s 4th positional parameter,
// `us` (microseconds), whose own real formula (`util/geolocation.ts`'s `dms2dd`:
// `degrees + minutes / 60.0 + seconds / 3600.0 + us / 3600000000.0`) expects a value
// scaled to actual microseconds -- i.e. `0.5` seconds of arc would need `us =
// 500000.0`, not `50.0`. `100.0 * fractional_seconds` is neither real microseconds
// NOR what the variable's own name suggests (a genuine "milliseconds" value would
// need `1000.0 *`, still the wrong parameter for a function documented as taking
// microseconds) -- a real upstream naming/scale bug in `bearing2dd.py` itself,
// ported verbatim (identical arithmetic, identical result) rather than silently
// corrected to a presumably-intended `1000000.0 * (s - int(s))`. Confirmed directly
// against this file's own real test fixture (ported below): `"N 45 15 22.5 E"`
// expects `44.743888875`, which is exactly `90 - dms2dd(45, 15, 22, 50.0)` -- the
// real (buggy) value, NOT the value a corrected `dms2dd(45, 15, 22, 500000.0)` call
// would produce -- i.e. the real Python test suite itself locks in this exact buggy
// arithmetic as the documented, expected behavior, not a hypothetical fixed one.
//
// --- `int(...)`/`float(...)` parsing: NOT wrapped in `errorMsg`, unlike the later
//     `dms2dd` call ---
//
// Real Python's `d = int(parts[1])` (and the `m`/`s` equivalents) run with NO
// surrounding `try`/`except` -- only the later `dms2dd(...)` call is wrapped in a
// `try: ... except ValueError: raise ValueError(error_msg)`. A syntactically
// non-numeric degree/minute/second token therefore raises Python's own raw
// `ValueError` (e.g. `invalid literal for int() with base 10: 'xyz'`), NOT
// `error_msg` ("Invalid bearing string") -- a real, if minor, distinction preserved
// here via `pythonInt`/`pythonFloat` below, which intentionally throw their OWN
// (differently-worded, JS-native) error rather than the shared `errorMsg`, matching
// the real source's control flow. Not exercised by any of the real ported test cases
// below (all of which use syntactically valid numeric tokens for this path), so this
// exact message text is unverified against a live interpreter -- the "don't swallow
// into `errorMsg`" CONTROL FLOW is what's verified directly from the real source.

import { dms2dd } from "../../util/geolocation";

/** Python's `int(s)` for this file's own degree/minute token parsing -- see this
 * file's own header comment for why this throws its own error rather than the
 * caller's `errorMsg`. */
function pythonInt(value: string): number {
	const trimmed = value.trim();
	if (!/^[+-]?\d+$/.test(trimmed)) {
		throw new Error(`invalid literal for int() with base 10: '${value}'`);
	}
	return Number.parseInt(trimmed, 10);
}

/** Python's `float(s)` for this file's own seconds-token parsing -- see this file's
 * own header comment for why this throws its own error rather than the caller's
 * `errorMsg`. */
function pythonFloat(value: string): number {
	const trimmed = value.trim();
	if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed) && !/^[+-]?(inf|infinity|nan)$/i.test(trimmed)) {
		throw new Error(`could not convert string to float: '${value}'`);
	}
	return Number.parseFloat(trimmed);
}

/**
 * Converts a quadrant bearing string to decimal degrees (Python:
 * `ifcopenshell.api.cogo.bearing2dd`).
 *
 * The format of the string is `"N|S dd (mm (ss.s)) E|W"` where:
 * - `N|S` is `N` or `S` for North or South
 * - `dd` is degree (required)
 * - `mm` is minute (optional, but required if second is provided)
 * - `ss.s` is second (required if provided along with minute)
 * - `E|W` is `E` or `W` for East or West
 *
 * @param bearing The bearing string.
 * @returns Angle in decimal degrees.
 */
export function bearing2dd(bearing: string): number {
	const errorMsg = "Invalid bearing string";

	// Python: `bearing.strip()` then `" ".join(bearing.split())` -- trim, then
	// collapse every internal whitespace run to a single space; `str.split()` with no
	// arguments (and this port's `/\s+/` split + empty-string filter) both drop empty
	// tokens the same way.
	const parts = bearing
		.trim()
		.split(/\s+/)
		.filter((p) => p.length > 0);
	const nParts = parts.length;
	if (nParts < 3 || nParts > 5) {
		throw new Error(errorMsg);
	}

	const cY = (parts[0] as string).toUpperCase();
	if (cY !== "N" && cY !== "S") {
		throw new Error(errorMsg);
	}

	const cX = (parts[parts.length - 1] as string).toUpperCase();
	if (cX !== "E" && cX !== "W") {
		throw new Error(errorMsg);
	}

	let d = 0;
	let m = 0;
	let s = 0.0;

	if (nParts === 3) {
		d = pythonInt(parts[1] as string);
	} else if (nParts === 4) {
		d = pythonInt(parts[1] as string);
		m = pythonInt(parts[2] as string);
	} else if (nParts === 5) {
		d = pythonInt(parts[1] as string);
		m = pythonInt(parts[2] as string);
		s = pythonFloat(parts[3] as string);
	}

	// `s` is a decimal number; break it into whole seconds and (Python's own
	// misleadingly-named, wrongly-scaled) "ms" -- see this file's own header comment.
	// Python's `int(s)` truncates toward zero, matching `Math.trunc`.
	const ms = 100.0 * (s - Math.trunc(s));
	s = Math.trunc(s);

	if (d < 0 || m < 0 || m >= 60 || s < 0 || s >= 60 || ms < 0) {
		throw new Error(errorMsg);
	}

	let angle: number;
	let sign: number;
	if (cY === "N" && cX === "E") {
		angle = 90.0;
		sign = -1.0;
	} else if (cY === "N" && cX === "W") {
		angle = 90.0;
		sign = 1.0;
	} else if (cY === "S" && cX === "E") {
		angle = 270.0;
		sign = 1.0;
	} else {
		// cY === "S" && cX === "W" -- the only remaining combination, per the two
		// earlier N/S and E/W validation checks above.
		angle = 270.0;
		sign = -1.0;
	}

	let dms: number;
	try {
		dms = dms2dd(d, m, s, ms);
	} catch {
		throw new Error(errorMsg);
	}

	if (dms < 0.0 || dms > 90.0) {
		throw new Error(errorMsg);
	}

	angle += sign * dms;

	// "S 90 E" evaluates to 360.
	if (angle === 360.0) {
		angle = 0.0;
	}

	return angle;
}
