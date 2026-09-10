// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/date.py` (src/ifcopenshell-python, 270
// lines, 8 functions) -- planning/ifcopenshell-ts/research/03-python-util-inventory.md's
// Phase 3 `util` Tier A sequencing. Ported in full: `timedelta2duration`, `ifc2datetime`,
// `readable_ifc_duration`, `datetime2ifc`, `string_to_date`, `string_to_duration`,
// `parse_duration`, `canonicalise_time`.
//
// *** Library-equivalence investigation (the point of this chunk's own task brief) ***
//
// Python's `date.py` leans on two third-party libraries this port has no equivalent
// native dependency for: `isodate` (ISO 8601 *duration* parsing/formatting --
// `isodate.parse_duration`/`isodate.duration_isoformat`/`isodate.Duration`) and
// `dateutil` (flexible date-*string* parsing -- `dateutil.parser.isoparse`/`.parse(...,
// dayfirst=True, fuzzy=True)`, used only by `string_to_date`). No new npm dependency is
// added here (none exists in `package.json` today, confirmed by reading it -- flagging
// per this chunk's own instructions rather than silently adding one). Both are replaced
// with hand-rolled logic below, per this project's established preference for
// hand-rolling small, stable grammars over pulling in a dependency (`selector.ts`'s
// key-path parser precedent, cited directly in this chunk's own task brief). ISO 8601
// duration grammar is small and well-defined (`P[n]Y[n]M[n]D[T[n]H[n]M[n]S]`), so
// `parseIso8601Duration`/`durationIsoformat` below reimplement it directly, verified
// line-by-line against `isodate`'s real source (`isoduration.py`/`duration.py`/
// `isostrf.py`, read from a local venv at
// `~/projects/formwork/mcp-server/ifc-backend/.venv/.../site-packages/isodate/` --
// not vendored into this repo, just used as a reference while porting) rather than
// assumed from memory. `dateutil`'s free-text fuzzy parser is a much bigger, genuinely
// open-ended grammar (arbitrary token/locale matching) that hand-rolling could not
// faithfully replicate without disproportionate effort for a function
// (`string_to_date`) that has **zero callers anywhere in `ifcopenshell-python` itself**
// (confirmed by repo-wide grep -- it exists for external callers, e.g. a UI text-field
// parser) -- this is disclosed as a genuine, narrower-than-Python gap below and in
// `TODOS.md`, not silently approximated.
//
// Findings, all confirmed against the real `isodate` source read directly (not assumed):
//
// 1. Python's `isinstance(duration, datetime.timedelta)` branch in `ifc2datetime` exists
//    only because `isodate.parse_duration` itself returns *one of two different Python
//    types* depending on whether the string has year/month components (a plain
//    `datetime.timedelta` if not, since Y/M aren't fixed-length; an `isodate.Duration`
//    if so) -- `timedelta2duration` exists purely to normalize the first case into the
//    second. TypeScript/JS has no native "timedelta" type to mirror that split in the
//    first place, and `isodate.duration_isoformat` (`isostrf.py`'s `_strfduration`)
//    formats both input types through the *exact same* code path with identical output
//    whenever years/months are zero -- so this port uses a single unified `Duration`
//    shape (`{years, months, days, hours, minutes, seconds}`, all plain numbers, freely
//    signed -- no separate magnitude+sign scheme; matches how a real Python
//    `datetime.timedelta`'s sign is carried entirely in its (possibly negative) `.days`
//    field while `.seconds`/`.microseconds` stay non-negative) everywhere, with no
//    behavioral difference for any caller. `timedelta2duration` is still ported and
//    exported standalone (Python-API-surface parity -- it's a public, non-underscore
//    function) even though this port's own `ifc2datetime`/`parseDuration` no longer need
//    to call it internally (verified: it has no other callers anywhere in
//    `ifcopenshell-python` either).
//
// 2. Two *cosmetic*, disclosed precision/format nuances vs. `isodate`, both from
//    `isodate` using Python's `Decimal` (arbitrary-precision, string-exact) for a
//    duration's `years`/`months` fields specifically (confirmed in `duration.py`'s
//    `Duration.__init__`), while every other duration field (`weeks`/`days`/`hours`/
//    `minutes`/`seconds`) is parsed as a plain `float` even by `isodate` itself
//    (confirmed in `isoduration.py`'s `parse_duration`) -- so this port's plain
//    `number` (IEEE-754 double) for `years`/`months` matches Python's *own* precision
//    for every field except those two:
//    a. Extreme-precision fractional years/months (many significant digits) could
//       theoretically lose precision as a `number` where a `Decimal` would not. Not
//       worth guarding: real IFC data essentially never encodes fractional years/months
//       in a duration string at all (D/H/M/S with at most fractional seconds is the
//       realistic case), and JS's shortest-round-trip float-to-string algorithm (like
//       Python's own `float`/`Decimal` repr) still round-trips ordinary decimal inputs
//       (e.g. "0.1") correctly in practice.
//    b. `Decimal` preserves the exact textual precision it was constructed from (e.g.
//       `str(Decimal("2.50"))` == `"2.50"`, trailing zero kept), so
//       `isodate.duration_isoformat` on a `Duration` parsed from `"P2.50Y"` reproduces
//       `"P2.50Y"` verbatim; this port's `number`-based `years`/`months` normalize
//       `2.50` -> `2.5` during parsing, so the round-trip output is `"P2.5Y"` (same
//       *value*, different textual precision). Again, real IFC duration strings don't
//       do this in practice -- flagged as a known, narrow, non-blocking cosmetic gap.
//
// 3. `isodate.parse_duration`'s alternative "complete date format" fallback (e.g.
//    `"P20201231T235959"`, `"P2020-12-31T23:59:59"`) is **not ported** -- confirmed
//    against `isoduration.py`: this is a rarely-used alternative ISO 8601 duration
//    encoding, not the `PnYnMnDTnHnMnS` component form the IFC schema's own `IfcDuration`
//    type and every real IFC file use. `parseIso8601Duration` below only implements the
//    regex-based component form (`isodate`'s own `ISO8601_PERIOD_REGEX`, reproduced
//    verbatim below), matching what `ifcopenshell-python`'s own `parse_duration`/
//    `ifc2datetime`/`datetime2ifc` actually round-trip in practice. Flagged as a
//    disclosed, low-risk scope narrowing (`TODOS.md`).
//
// 4. `string_to_date` (`dateutil.parser.isoparse` then `.parse(..., dayfirst=True,
//    fuzzy=True)` as a fallback) is the one **genuine, real, disclosed gap** in this
//    chunk (see `TODOS.md`): `stringToDate` below hand-rolls (a) a `dateutil.isoparse`-
//    equivalent covering both the extended (`YYYY-MM-DD[THH:MM:SS[.ffffff][Z|±HH:MM]]`)
//    and basic no-separator (`YYYYMMDD[THHMMSS...]`) ISO forms `isoparse` accepts (week-
//    date/ordinal-date ISO forms are NOT covered -- another narrow, disclosed scope cut,
//    genuinely rare in date-string input); (b) a `dayfirst=True` day/month/year numeric
//    fallback (`DD/MM/YYYY`, `DD-MM-YYYY`, `DD.MM.YYYY`, 2- or 4-digit year) plus a
//    hand-rolled month-name matcher (`"5 January 2020"`, `"January 5, 2020"`, 3-letter
//    abbreviations) covering `dateutil`'s most common non-ISO inputs explicitly. What is
//    **not** replicated: `dateutil`'s `fuzzy=True` mode, which extracts a date from
//    surrounding free text the parser doesn't otherwise recognize as date syntax (e.g.
//    `"Meeting on 5 January 2020 at noon"`) -- that requires an open-ended token-
//    scanning grammar disproportionate to a zero-internal-caller function; unrecognized/
//    embedded-in-prose input returns `null` here where Python's fuzzy mode might have
//    extracted a date. Since `string_to_date` has no caller anywhere in
//    `ifcopenshell-python` itself (confirmed by repo-wide grep -- it exists for external,
//    e.g. UI, callers), this is a bounded, disclosed risk, not silently swallowed.
//
// 5. `IfcTimeStamp` (`datetime2ifc`'s `int(dt.timestamp())` / `ifc2datetime`'s
//    `datetime.fromtimestamp(element)`) both interpret an epoch value against the
//    *local system timezone* in Python (a naive `fromtimestamp`/`.timestamp()` pair) --
//    `fromTimestamp`/`toEpochSeconds` below use JS `Date`'s own local-timezone
//    constructor/getters for the equivalent conversion, which is the same "ask the OS's
//    tzdata" operation Python's C runtime performs, so this is not a disclosed gap (both
//    ultimately depend on the same underlying OS timezone database).
//
// One additional finding, unrelated to the isodate/dateutil question: the fuzzy
// (non-`"P"`-prefixed) branch of Python's own `parse_duration` has a genuine pre-existing
// upstream dead-code bug, confirmed by reading the source closely -- it contains *two*
// `elif char == "M":` branches in the same `if/elif` chain (one before the `"H"` branch,
// one after, the latter with `"MIN" in value_upper` logic to insert a `"T"` separator
// before a lone minutes designator). Since Python's `elif` chain always takes the first
// matching branch, the second `"M"` branch can never execute -- it's unreachable dead
// code. Practical effect: a fuzzy duration string with minutes but no preceding hours
// (e.g. `"30M"`, meant as 30 minutes) never gets a `"T"` separator inserted, so it parses
// as `"P30M"` (30 *months*) instead of `"PT30M"` (30 minutes) -- an inherited upstream
// ambiguity-resolution bug, not something introduced by this port, and not a library-
// equivalence gap (it doesn't involve isodate/dateutil at all). `parseFuzzyDurationString`
// below ports only the reachable branch (byte-for-byte identical runtime behavior to
// Python's actual, buggy-as-shipped logic -- the dead second branch is omitted rather
// than transcribed, since it can never run either way) with this note attached at the
// call site.

import type { EntityInstance } from "../entityInstance";

// ---------------------------------------------------------------------------
// Duration: unified replacement for isodate's `timedelta`/`Duration` split (finding #1
// above). All fields are plain, freely-signed numbers; `seconds` may be fractional.
// ---------------------------------------------------------------------------

/** Python: the union of `datetime.timedelta` and `isodate.Duration` that
 * `isodate.parse_duration`/`isodate.duration_isoformat` traffic in -- unified here,
 * see this file's header comment finding #1. */
export interface Duration {
	years: number;
	months: number;
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

/** Minimal duck-typed shape `timedelta2duration` actually reads off its argument
 * (Python: `getattr(timedelta, "days", 0)` / `getattr(timedelta, "seconds", 0)`) --
 * matches a normalized Python `timedelta`'s own invariant (`0 <= seconds < 86400`),
 * which is the only shape this function is ever actually called with (see header
 * comment finding #1: its sole caller no longer exists in this port, kept for
 * Python-API-surface parity). */
export interface TimedeltaLike {
	days?: number;
	seconds?: number;
}

/**
 * Python: `timedelta2duration`. Decomposes a normalized `{days, seconds}` pair (`0 <=
 * seconds < 86400`, matching Python's own `datetime.timedelta` invariant) into
 * `{days, hours, minutes, seconds}` -- ported via direct integer arithmetic rather than
 * Python's own `str(datetime.timedelta(seconds=...)).split(":")` string round-trip
 * (behaviorally identical for any input in the documented, invariant-respecting range;
 * see this file's header comment). Note this deliberately drops microseconds, exactly
 * like Python (`components["seconds"]` is `timedelta.seconds`, an int -- Python's
 * `.microseconds` field is never read here).
 */
export function timedelta2duration(timedelta: TimedeltaLike): Duration {
	const days = timedelta.days ?? 0;
	const totalSeconds = Math.trunc(timedelta.seconds ?? 0);
	let hours = 0;
	let minutes = 0;
	let seconds = 0;
	if (totalSeconds) {
		hours = Math.trunc(totalSeconds / 3600);
		minutes = Math.trunc((totalSeconds % 3600) / 60);
		seconds = totalSeconds % 60;
	}
	return { years: 0, months: 0, days, hours, minutes, seconds };
}

// ---------------------------------------------------------------------------
// Hand-rolled ISO 8601 duration parse/format (replaces `isodate`).
// ---------------------------------------------------------------------------

// Reproduces `isodate.isoduration.ISO8601_PERIOD_REGEX` verbatim (read from the real
// `isodate` source, see header comment) -- deliberately more permissive than strict ISO
// 8601 (e.g. allows combining weeks with other designators), matching `isodate`'s own
// documented behavior exactly.
const ISO8601_DURATION_RE =
	/^(?<sign>[+-])?P(?:(?<years>\d+(?:[.,]\d+)?)Y)?(?:(?<months>\d+(?:[.,]\d+)?)M)?(?:(?<weeks>\d+(?:[.,]\d+)?)W)?(?:(?<days>\d+(?:[.,]\d+)?)D)?(?:T(?:(?<hours>\d+(?:[.,]\d+)?)H)?(?:(?<minutes>\d+(?:[.,]\d+)?)M)?(?:(?<seconds>\d+(?:[.,]\d+)?)S)?)?$/;

/**
 * Python: `isodate.parse_duration`'s regex-based branch (the "complete duration
 * specification" form -- the alternative date-complete form is out of scope, see header
 * comment finding #3). Returns `null` (Python: raises `ISO8601Error`, caught by every
 * caller in this file) for a non-matching or all-zero string (Python: `P(?!\b)` rejects
 * a bare `"P"` with nothing after it; ported here as an explicit "at least one component
 * present" check instead of replicating that lookahead literally).
 */
function parseIso8601Duration(value: string): Duration | null {
	const match = ISO8601_DURATION_RE.exec(value);
	if (!match || !match.groups) return null;
	const g = match.groups;
	const fields = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"] as const;
	if (!fields.some((f) => g[f] !== undefined)) return null;

	const num = (s: string | undefined): number => (s === undefined ? 0 : Number.parseFloat(s.replace(",", ".")));
	const sign = g.sign === "-" ? -1 : 1;
	// `sign * 0` produces `-0` for a negative, all-zero-in-this-field duration string
	// (e.g. `"-P1D"`'s `years`/`months`/`hours`/`minutes`/`seconds`) -- `+ 0` below
	// normalizes that back to `0`, matching Python (a negated Decimal/float zero still
	// compares/serializes as plain `0`, not a signed zero).
	const negate = (n: number): number => sign * n + 0;
	const weeks = num(g.weeks);
	return {
		years: negate(num(g.years)),
		months: negate(num(g.months)),
		days: negate(num(g.days) + weeks * 7),
		hours: negate(num(g.hours)),
		minutes: negate(num(g.minutes)),
		seconds: negate(num(g.seconds)),
	};
}

/**
 * Python: `isodate.duration_isoformat` (via `isostrf.py`'s `_strfduration`, `%P`
 * format code, the `D_DEFAULT = "P%P"` format Python's call site always uses). Ported
 * directly from that algorithm: years/months (if non-zero) formatted with their own
 * sign-stripped magnitude, then `days`/`hours`/`minutes`/`seconds` combined into one
 * signed total and re-decomposed (matching Python's own recombine-then-resplit via a
 * microsecond-integer intermediate) before formatting -- so e.g. `{hours: 25}` formats
 * as `"P1DT1H"`, not `"P25H"`, exactly like Python's own `Duration`/`timedelta` handling.
 */
export function durationIsoformat(duration: Duration): string {
	const totalSeconds = duration.days * 86400 + duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
	const negative = duration.years < 0 || duration.months < 0 || totalSeconds < 0;

	const parts: string[] = [];
	if (duration.years) parts.push(`${formatDecimalLike(Math.abs(duration.years))}Y`);
	if (duration.months) parts.push(`${formatDecimalLike(Math.abs(duration.months))}M`);

	// Python: usecs = abs((days*86400 + seconds)*1e6 + microseconds); this port has no
	// separate microseconds field, so folds fractional seconds in directly.
	let usecs = Math.round(Math.abs(totalSeconds) * 1_000_000);
	let secs = Math.floor(usecs / 1_000_000);
	usecs -= secs * 1_000_000;
	let minutes = Math.floor(secs / 60);
	secs -= minutes * 60;
	let hours = Math.floor(minutes / 60);
	minutes -= hours * 60;
	const days = Math.floor(hours / 24);
	hours -= days * 24;

	if (days) parts.push(`${days}D`);
	if (hours || minutes || secs || usecs) {
		parts.push("T");
		if (hours) parts.push(`${hours}H`);
		if (minutes) parts.push(`${minutes}M`);
		if (secs || usecs) {
			if (usecs) {
				const formatted = `${secs}.${String(usecs).padStart(6, "0")}`.replace(/0+$/, "");
				parts.push(formatted);
			} else {
				parts.push(`${secs}`);
			}
			parts.push("S");
		}
	}

	const body = parts.length ? parts.join("") : "0D";
	return `${negative ? "-" : ""}P${body}`;
}

/** Python: `"%s" % abs(decimal_value)` for a `Decimal` -- see header comment finding
 * #2 for the (disclosed, cosmetic) precision difference vs. plain `number` here. */
function formatDecimalLike(n: number): string {
	return String(n);
}

// ---------------------------------------------------------------------------
// IFC date/time/datetime value representation. Python distinguishes `datetime.date` /
// `datetime.time` / `datetime.datetime` (the latter a *subclass* of the first) via
// `isinstance`; TS/JS has no equivalent trio of built-in types (`Date` always carries
// both a calendar date and a time-of-day, with no "date-only"/"time-only" mode, and its
// string-parsing timezone defaults differ inconsistently between date-only and
// date-time forms -- a well-known footgun this port sidesteps entirely by never handing
// a raw date/time *string* to the native `Date` constructor for parsing; see
// `parseIsoDate`/`parseIsoTime`/`parseIsoDatetime` below, which parse with a regex into
// plain numeric fields instead). A discriminated union (`kind: "date" | "time" |
// "datetime"`) replaces Python's `isinstance` trio -- `kind === "datetime"` decides
// unambiguously where Python relies on checking the `datetime.datetime` subclass
// *before* the `datetime.date` base class.
// ---------------------------------------------------------------------------

export interface IsoDate {
	readonly kind: "date";
	readonly year: number;
	readonly month: number;
	readonly day: number;
}

export interface IsoTime {
	readonly kind: "time";
	readonly hour: number;
	readonly minute: number;
	readonly second: number;
	readonly microsecond: number;
	/** UTC offset in minutes if the source string carried one (`"Z"` -> 0, `"+02:00"`
	 * -> 120); `undefined` for a naive value -- mirrors Python's `tzinfo=None`. */
	readonly utcOffsetMinutes?: number;
}

export interface IsoDateTime {
	readonly kind: "datetime";
	readonly year: number;
	readonly month: number;
	readonly day: number;
	readonly hour: number;
	readonly minute: number;
	readonly second: number;
	readonly microsecond: number;
	readonly utcOffsetMinutes?: number;
}

export type IfcDateTimeValue = IsoDate | IsoTime | IsoDateTime;

function isIsoDate(v: IfcDateTimeValue): v is IsoDate {
	return v.kind === "date";
}
function isIsoTime(v: IfcDateTimeValue): v is IsoTime {
	return v.kind === "time";
}
function isIsoDateTime(v: IfcDateTimeValue): v is IsoDateTime {
	return v.kind === "datetime";
}

function daysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

function assertValidDate(year: number, month: number, day: number, source: string): void {
	if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
		throw new RangeError(`Invalid isoformat date string: ${JSON.stringify(source)}`);
	}
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_BASIC_RE = /^(\d{4})(\d{2})(\d{2})$/;

/** Python: `datetime.date.fromisoformat`. Supports the extended (`YYYY-MM-DD`) and
 * basic (`YYYYMMDD`) forms `dateutil.isoparse`/Python 3.11+'s `fromisoformat` both
 * accept (see header comment finding #3/#4 for what's out of scope: week-date/ordinal
 * forms). Throws (mirrors Python's uncaught `ValueError`) rather than returning `null`
 * -- callers that want a lenient parse use `stringToDate` instead. */
export function parseIsoDate(value: string): IsoDate {
	const m = ISO_DATE_RE.exec(value) ?? ISO_DATE_BASIC_RE.exec(value);
	if (!m) throw new RangeError(`Invalid isoformat date string: ${JSON.stringify(value)}`);
	const year = Number(m[1]);
	const month = Number(m[2]);
	const day = Number(m[3]);
	assertValidDate(year, month, day, value);
	return { kind: "date", year, month, day };
}

const ISO_OFFSET_RE = /^(?:Z|([+-])(\d{2}):?(\d{2})?)$/;

function parseIsoOffset(value: string | undefined): number | undefined {
	if (value === undefined || value === "") return undefined;
	if (value === "Z") return 0;
	const m = ISO_OFFSET_RE.exec(value);
	if (!m) throw new RangeError(`Invalid isoformat UTC offset: ${JSON.stringify(value)}`);
	if (m[1] === undefined) return 0; // "Z"
	const sign = m[1] === "-" ? -1 : 1;
	const hours = Number(m[2]);
	const minutes = Number(m[3] ?? "0");
	return sign * (hours * 60 + minutes);
}

const ISO_TIME_RE = /^(\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?(Z|[+-]\d{2}:?\d{2}?)?$/;

/** Python: `datetime.time.fromisoformat`. Supports `HH:MM[:SS[.ffffff]]` with an
 * optional trailing `Z`/`±HH:MM`/`±HHMM` offset. Throws on invalid input, matching
 * Python's uncaught `ValueError` (see `parseIsoDate`'s doc comment for why). */
export function parseIsoTime(value: string): IsoTime {
	const m = ISO_TIME_RE.exec(value);
	if (!m) throw new RangeError(`Invalid isoformat time string: ${JSON.stringify(value)}`);
	const hour = Number(m[1]);
	const minute = Number(m[2]);
	const second = m[3] !== undefined ? Number(m[3]) : 0;
	const microsecond = m[4] !== undefined ? Number(m[4].slice(0, 6).padEnd(6, "0")) : 0;
	if (hour > 23 || minute > 59 || second > 59) {
		throw new RangeError(`Invalid isoformat time string: ${JSON.stringify(value)}`);
	}
	const utcOffsetMinutes = parseIsoOffset(m[5]);
	return { kind: "time", hour, minute, second, microsecond, utcOffsetMinutes };
}

const ISO_DATETIME_SPLIT_RE = /^(\d{4}-?\d{2}-?\d{2})[T ](.*)$/;

/** Python: `datetime.datetime.fromisoformat`. Accepts a date-only string (defaults the
 * time-of-day to midnight, matching Python 3.11+'s own relaxed `fromisoformat`) or a
 * date + `T`/space-separated time (reusing `parseIsoTime`'s grammar, including its
 * optional offset). Throws on invalid input (see `parseIsoDate`'s doc comment). */
export function parseIsoDatetime(value: string): IsoDateTime {
	const split = ISO_DATETIME_SPLIT_RE.exec(value);
	if (!split) {
		const date = parseIsoDate(value);
		return {
			kind: "datetime",
			year: date.year,
			month: date.month,
			day: date.day,
			hour: 0,
			minute: 0,
			second: 0,
			microsecond: 0,
		};
	}
	const date = parseIsoDate(
		split[1].includes("-") ? split[1] : `${split[1].slice(0, 4)}-${split[1].slice(4, 6)}-${split[1].slice(6, 8)}`,
	);
	const time = parseIsoTime(split[2]);
	return {
		kind: "datetime",
		year: date.year,
		month: date.month,
		day: date.day,
		hour: time.hour,
		minute: time.minute,
		second: time.second,
		microsecond: time.microsecond,
		utcOffsetMinutes: time.utcOffsetMinutes,
	};
}

function pad(n: number, width: number): string {
	const sign = n < 0 ? "-" : "";
	return sign + String(Math.trunc(Math.abs(n))).padStart(width, "0");
}

function formatIsoOffset(minutes: number | undefined): string {
	if (minutes === undefined) return "";
	const sign = minutes < 0 ? "-" : "+";
	const abs = Math.abs(minutes);
	return `${sign}${pad(Math.floor(abs / 60), 2)}:${pad(abs % 60, 2)}`;
}

/** Python: `datetime.time.isoformat()` / the time portion of `datetime.datetime
 * .isoformat()` -- microseconds omitted when zero, else zero-padded to 6 digits. */
export function formatIsoTime(t: IsoTime | IsoDateTime): string {
	let s = `${pad(t.hour, 2)}:${pad(t.minute, 2)}:${pad(t.second, 2)}`;
	if (t.microsecond) s += `.${String(t.microsecond).padStart(6, "0")}`;
	s += formatIsoOffset(t.utcOffsetMinutes);
	return s;
}

/** Python: `datetime.date.isoformat()` / the date portion of `datetime.datetime
 * .isoformat()`. */
export function formatIsoDate(d: IsoDate | IsoDateTime): string {
	return `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}`;
}

/** Python: `datetime.datetime.isoformat()` (default `"T"` separator). */
export function formatIsoDatetime(dt: IsoDateTime): string {
	return `${formatIsoDate(dt)}T${formatIsoTime(dt)}`;
}

function dateToDatetimeMidnight(d: IsoDate): IsoDateTime {
	return { kind: "datetime", year: d.year, month: d.month, day: d.day, hour: 0, minute: 0, second: 0, microsecond: 0 };
}

/** Python: `datetime.fromtimestamp(element)` -- local-system-timezone interpretation
 * of an epoch-seconds value (see header comment finding #5: not a disclosed gap, both
 * ultimately consult the OS's own timezone database). */
function fromTimestamp(epochSeconds: number): IsoDateTime {
	const d = new Date(epochSeconds * 1000);
	return {
		kind: "datetime",
		year: d.getFullYear(),
		month: d.getMonth() + 1,
		day: d.getDate(),
		hour: d.getHours(),
		minute: d.getMinutes(),
		second: d.getSeconds(),
		microsecond: d.getMilliseconds() * 1000,
	};
}

/** Python: `dt.timestamp()`. Honors an explicit UTC offset when present (an
 * offset-aware Python `datetime.timestamp()` computes the instant directly from the
 * offset, independent of local system timezone); falls back to local-system-timezone
 * interpretation otherwise, matching a naive Python `datetime.timestamp()` (see header
 * comment finding #5). Throws for a value with no time-of-day fields (Python: only
 * `datetime.datetime` has `.timestamp()` -- calling it on a bare `date`/`time` raises
 * `AttributeError`, uncaught). */
function toEpochSeconds(dt: IsoDateTime): number {
	if (dt.utcOffsetMinutes !== undefined) {
		const utcMs = Date.UTC(
			dt.year,
			dt.month - 1,
			dt.day,
			dt.hour,
			dt.minute,
			dt.second,
			Math.floor(dt.microsecond / 1000),
		);
		return utcMs / 1000 - dt.utcOffsetMinutes * 60;
	}
	const localMs = new Date(
		dt.year,
		dt.month - 1,
		dt.day,
		dt.hour,
		dt.minute,
		dt.second,
		Math.floor(dt.microsecond / 1000),
	).getTime();
	return localMs / 1000;
}

// ---------------------------------------------------------------------------
// Public API -- ported 1:1 from date.py's own public function inventory.
// ---------------------------------------------------------------------------

/**
 * Python: `ifc2datetime`. `element` is an `IfcDuration`/`IfcTimeMeasure` string
 * (`"P..."`), `IfcTime`/`IfcDateTime`/`IfcDate` string, `IfcTimeStamp` (epoch-seconds
 * `number`), or an `IfcDateAndTime`/`IfcCalendarDate` entity instance. Returns
 * `undefined` for anything else (Python: falls off the end of the function with no
 * `return`, i.e. implicit `None`).
 */
export function ifc2datetime(element: string | number | EntityInstance): Duration | IfcDateTimeValue | undefined {
	if (typeof element === "string") {
		if (element.slice(0, 2).includes("P")) {
			// IfcDuration -- see header comment finding #1 for why this port has no
			// separate `timedelta2duration` normalization step here.
			return parseDuration(element) ?? undefined;
		}
		if (element.length > 3 && element[2] === ":") {
			// IfcTime
			return parseIsoTime(element);
		}
		if (element.includes(":")) {
			// IfcDateTime
			return parseIsoDatetime(element);
		}
		// IfcDate
		return parseIsoDate(element);
	}

	if (typeof element === "number") {
		// IfcTimeStamp
		return fromTimestamp(element);
	}

	if (element.isA("IfcDateAndTime")) {
		const dateComponent = element.get("DateComponent") as EntityInstance;
		const timeComponent = element.get("TimeComponent") as EntityInstance;
		return {
			kind: "datetime",
			year: dateComponent.get("YearComponent") as number,
			month: dateComponent.get("MonthComponent") as number,
			day: dateComponent.get("DayComponent") as number,
			hour: timeComponent.get("HourComponent") as number,
			minute: timeComponent.get("MinuteComponent") as number,
			// Python: `int(element.TimeComponent.SecondComponent)` -- `SecondComponent`
			// is declared `IfcDayInMonthNumber`-adjacent real-valued in some schemas;
			// truncated to an int either way.
			second: Math.trunc(timeComponent.get("SecondComponent") as number),
			microsecond: 0,
			// TODO: implement TimeComponent timezone (ported verbatim from Python's own
			// inline TODO comment -- IfcLocalTime's zone/DST fields are not read here,
			// matching upstream, not a new gap introduced by this port).
		};
	}
	if (element.isA("IfcCalendarDate")) {
		return {
			kind: "date",
			year: element.get("YearComponent") as number,
			month: element.get("MonthComponent") as number,
			day: element.get("DayComponent") as number,
		};
	}
	return undefined;
}

/**
 * Python: `readable_ifc_duration`. Convert ISO duration to a more readable string
 * format, purely via string manipulation -- deliberately does not use
 * `parseIso8601Duration`/`durationIsoformat` (matching Python's own explicit choice not
 * to use `isodate.parse_duration` here, since e.g. `"PT2500H"` should stay `"2500h"`
 * rather than being renormalized into weeks/days/hours the way `durationIsoformat`
 * would).
 *
 * Examples:
 * - `"P2Y3M1W4DT5H45M30S"` -> `"2Y 3M 1W 4D 5h 45m 30s"`
 * - `"P2Y3MT30S"` -> `"2Y 3M 30s"`
 * - `"PT2500H"` -> `"2500h"`
 */
export function readableIfcDuration(duration: string): string {
	let periodDuration: string;
	let timeDuration: string;
	const tIndex = duration.indexOf("T");
	if (tIndex !== -1) {
		periodDuration = duration.slice(1, tIndex);
		timeDuration = duration.slice(tIndex + 1);
	} else {
		periodDuration = duration.slice(1);
		timeDuration = "";
	}

	const result: string[] = [];
	for (const designator of ["Y", "M", "W", "D"] as const) {
		const idx = periodDuration.indexOf(designator);
		if (idx !== -1) {
			const value = periodDuration.slice(0, idx);
			periodDuration = periodDuration.slice(idx + 1);
			if (Number.parseFloat(value)) result.push(`${value}${designator}`);
		}
	}

	if (timeDuration) {
		for (const designator of ["H", "M", "S"] as const) {
			const idx = timeDuration.indexOf(designator);
			if (idx !== -1) {
				const value = timeDuration.slice(0, idx);
				timeDuration = timeDuration.slice(idx + 1);
				if (Number.parseFloat(value)) result.push(`${value}${designator.toLowerCase()}`);
			}
		}
	}
	return result.join(" ");
}

/** Python: `datetime2ifc`'s supported `ifc_type` literal. */
export type Datetime2IfcType =
	| "IfcDuration"
	| "IfcTimeStamp"
	| "IfcDateTime"
	| "IfcDate"
	| "IfcTime"
	| "IfcCalendarDate"
	| "IfcLocalTime";

/** Python: the (imprecise, duck-typed) `dt` parameter of `datetime2ifc` -- a string
 * (ISO date/time/datetime, or a raw `IfcDuration` string returned as-is), a parsed
 * `IfcDateTimeValue`/`Duration` (typically round-tripped from `ifc2datetime`), or
 * `null`/`undefined`. */
export type Datetime2IfcInput = IfcDateTimeValue | Duration | string | null | undefined;

/**
 * Python: `datetime2ifc`. Converts a parsed date/time/duration value back into its IFC
 * attribute-value representation for the given `ifc_type`.
 */
export function datetime2ifc(dt: null | undefined, ifcType: Datetime2IfcType): undefined;
export function datetime2ifc(
	dt: Datetime2IfcInput,
	ifcType: Datetime2IfcType,
): number | string | Record<string, number> | undefined;
export function datetime2ifc(
	dt: Datetime2IfcInput,
	ifcType: Datetime2IfcType,
): number | string | Record<string, number> | undefined {
	let value: IfcDateTimeValue | Duration;
	if (typeof dt === "string") {
		if (ifcType === "IfcDuration") return dt;
		try {
			value = parseIsoDatetime(dt);
		} catch {
			// Python: bare `except: dt = datetime.time.fromisoformat(dt)` -- if this
			// also throws, it propagates uncaught, same as here.
			value = parseIsoTime(dt);
		}
	} else if (dt === null || dt === undefined) {
		return undefined;
	} else {
		value = dt;
	}

	switch (ifcType) {
		case "IfcDuration":
			return durationIsoformat(value as Duration);
		case "IfcTimeStamp":
			return Math.trunc(toEpochSeconds(requireDateTime(value, ifcType)));
		case "IfcDateTime":
			if (isDateTimeValue(value)) return formatIsoDatetime(value);
			if (isDateValue(value)) return formatIsoDatetime(dateToDatetimeMidnight(value));
			break;
		case "IfcDate":
			if (isDateTimeValue(value)) return formatIsoDate(value);
			if (isDateValue(value)) return formatIsoDate(value);
			break;
		case "IfcTime":
			if (isDateTimeValue(value)) return formatIsoTime(value);
			if (isTimeValue(value)) return formatIsoTime(value);
			break;
		case "IfcCalendarDate":
			if (isDateTimeValue(value) || isDateValue(value)) {
				return { DayComponent: value.day, MonthComponent: value.month, YearComponent: value.year };
			}
			break;
		case "IfcLocalTime":
			// TODO implement timezones (ported verbatim from Python's own inline TODO).
			if (isDateTimeValue(value) || isTimeValue(value)) {
				return { HourComponent: value.hour, MinuteComponent: value.minute, SecondComponent: value.second };
			}
			break;
	}

	throw new TypeError(
		`Unsupported ifc_type for conversion from datetime.datetime = ${ifcType}, value = ${JSON.stringify(value)}`,
	);
}

function isDateValue(v: IfcDateTimeValue | Duration): v is IsoDate {
	return "kind" in v && v.kind === "date";
}
function isTimeValue(v: IfcDateTimeValue | Duration): v is IsoTime {
	return "kind" in v && v.kind === "time";
}
function isDateTimeValue(v: IfcDateTimeValue | Duration): v is IsoDateTime {
	return "kind" in v && v.kind === "datetime";
}

function requireDateTime(v: IfcDateTimeValue | Duration, ifcType: Datetime2IfcType): IsoDateTime {
	if (!isDateTimeValue(v)) {
		// Python: `dt.timestamp()` on a bare `date`/`time`/`Duration` raises
		// `AttributeError`, uncaught -- mirrored here as a thrown error rather than the
		// generic `TypeError` at the bottom of `datetime2ifc`, matching which exception
		// type would actually surface first in Python.
		throw new TypeError(
			`'${"kind" in v ? v.kind : "Duration"}' object has no attribute 'timestamp' (ifc_type = ${ifcType})`,
		);
	}
	return v;
}

const NUMBER_WITH_DESIGNATOR_RE = /(\d+\.?\d*)([dhms])/i;

/**
 * Python: `string_to_duration`. Fuzzy-extracts `d`/`h`/`m`/`s`-suffixed numeric
 * components from a free-form string (e.g. `"2d 3h"`) and formats the result as an
 * ISO 8601 duration string. Matches Python's case-sensitive designator matching
 * (lowercase only) and its explicit non-support for years/months/weeks (Python's own
 * `# TODO support years, months, weeks aswell` comment, ported verbatim below -- not a
 * gap introduced by this port).
 */
export function stringToDuration(durationString: string): string {
	// TODO support years, months, weeks aswell
	const days = Number.parseFloat(/(\d+\.?\d*)d/.exec(durationString)?.[1] ?? "0");
	const hours = Number.parseFloat(/(\d+\.?\d*)h/.exec(durationString)?.[1] ?? "0");
	const minutes = Number.parseFloat(/(\d+\.?\d*)m/.exec(durationString)?.[1] ?? "0");
	const seconds = Number.parseFloat(/(\d+\.?\d*)s/.exec(durationString)?.[1] ?? "0");
	return durationIsoformat({ years: 0, months: 0, days, hours, minutes, seconds });
}

/**
 * Python: `parse_duration`. Parses either a real ISO 8601 duration string (containing
 * `"P"`) or a "fuzzy" duration string (e.g. `"2D4H"`, `"90MIN"`) into a unified
 * `Duration` (Python: `datetime.timedelta`, see header comment finding #1 for why this
 * port always returns the unified `Duration` shape instead). Returns `null` on any
 * parse failure (Python: catches and swallows the exception, `print()`s a message, and
 * returns `None` -- ported as `console.error` since Node has no closer equivalent to a
 * bare Python `print()` for an error condition).
 */
export function parseDuration(value: string | null | undefined): Duration | null {
	if (!value) return null;
	if (value.includes("P")) {
		try {
			const parsed = parseIso8601Duration(value);
			if (parsed === null) throw new RangeError(`Unable to parse duration string ${JSON.stringify(value)}`);
			return parsed;
		} catch {
			console.error("Error parsing ISO string duration");
			return null;
		}
	}
	return parseFuzzyDurationString(value);
}

/**
 * Python: `parse_duration`'s fuzzy (non-`"P"`-prefixed) branch. Builds a synthetic ISO
 * 8601 string from a loosely-formatted duration (e.g. `"2D4H"`, `"90MIN"`) and parses
 * it via `parseIso8601Duration`. See this file's header comment for the one genuine,
 * pre-existing upstream dead-code finding here (a second, unreachable `"M"` branch in
 * Python's own `elif` chain) -- only the reachable branch is ported (see below).
 */
function parseFuzzyDurationString(value: string): Duration | null {
	try {
		let finalString = "P";
		const valueUpper = value.toUpperCase();
		for (const char of valueUpper) {
			if (/\d/.test(char)) {
				finalString += char;
			} else if (char === "D") {
				finalString += "D";
				if (valueUpper.includes("H") || valueUpper.includes("S") || valueUpper.includes("MIN")) {
					finalString += "T";
				}
			} else if (char === "W") {
				finalString += "W";
			} else if (char === "M") {
				// Python: this is the FIRST of two `elif char == "M":` branches in the
				// real source's `if/elif` chain -- it always wins over the later
				// `"MIN"`-aware branch, which is unreachable dead code (see header
				// comment). Ported as the sole "M" handling to match Python's actual
				// runtime behavior exactly (not its literal, partially-dead source
				// structure).
				finalString += "M";
			} else if (char === "Y") {
				finalString += "Y";
			} else if (char === "H") {
				if (!finalString.includes("T")) {
					finalString = `${finalString.slice(0, 1)}T${finalString.slice(1)}`;
				}
				finalString += "H";
			} else if (char === "S") {
				if (!finalString.includes("T")) {
					finalString = `${finalString.slice(0, 1)}T${finalString.slice(1)}`;
				}
				finalString += "S";
			}
		}
		const parsed = parseIso8601Duration(finalString);
		if (parsed === null) throw new RangeError(`Unable to parse duration string ${JSON.stringify(finalString)}`);
		return parsed;
	} catch {
		console.error("error fuzzy parsing duration");
		return null;
	}
}

const MONTH_NAMES: Record<string, number> = {
	jan: 1,
	january: 1,
	feb: 2,
	february: 2,
	mar: 3,
	march: 3,
	apr: 4,
	april: 4,
	may: 5,
	jun: 6,
	june: 6,
	jul: 7,
	july: 7,
	aug: 8,
	august: 8,
	sep: 9,
	sept: 9,
	september: 9,
	oct: 10,
	october: 10,
	nov: 11,
	november: 11,
	dec: 12,
	december: 12,
};

function twoDigitYear(y: number): number {
	// Python's dateutil defaults 2-digit years to a 1950-2049 pivot window.
	return y < 50 ? 2000 + y : 1900 + y;
}

/** `dateutil.parser`'s `dayfirst=True` numeric-separator fallback (`DD/MM/YYYY`,
 * `DD-MM-YYYY`, `DD.MM.YYYY`) -- see header comment finding #4. */
function tryParseNumericDayFirst(value: string): IsoDateTime | null {
	const m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/.exec(value.trim());
	if (!m) return null;
	const day = Number(m[1]);
	const month = Number(m[2]);
	let year = Number(m[3]);
	if (m[3].length <= 2) year = twoDigitYear(year);
	if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
	return { kind: "datetime", year, month, day, hour: 0, minute: 0, second: 0, microsecond: 0 };
}

/** Month-name formats (`"5 January 2020"`, `"January 5, 2020"`, abbreviations) --
 * see header comment finding #4. */
function tryParseMonthName(value: string): IsoDateTime | null {
	const trimmed = value.trim();
	let m = /^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{2,4})$/.exec(trimmed);
	let day: number;
	let monthName: string;
	let yearStr: string;
	if (m) {
		[, , monthName, yearStr] = m;
		day = Number(m[1]);
	} else {
		m = /^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{2,4})$/.exec(trimmed);
		if (!m) return null;
		[, monthName, , yearStr] = m;
		day = Number(m[2]);
	}
	const month = MONTH_NAMES[monthName.toLowerCase()];
	if (!month) return null;
	let year = Number(yearStr);
	if (yearStr.length <= 2) year = twoDigitYear(year);
	if (day < 1 || day > daysInMonth(year, month)) return null;
	return { kind: "datetime", year, month, day, hour: 0, minute: 0, second: 0, microsecond: 0 };
}

const ISOPARSE_BASIC_DATETIME_RE = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:[.,](\d+))?(Z|[+-]\d{2}:?\d{2})?$/;

/** `dateutil.parser.isoparse` -- a somewhat broader ISO 8601 acceptor than
 * `datetime.fromisoformat` (notably the no-separator "basic" form). See header comment
 * finding #4 for what's not covered (week-date/ordinal-date forms). */
function tryParseIsoparse(value: string): IsoDateTime | null {
	try {
		return parseIsoDatetime(value);
	} catch {
		// fall through to the basic (no-separator) form below
	}
	const m = ISOPARSE_BASIC_DATETIME_RE.exec(value);
	if (m) {
		const year = Number(m[1]);
		const month = Number(m[2]);
		const day = Number(m[3]);
		if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
		const hour = Number(m[4]);
		const minute = Number(m[5]);
		const second = Number(m[6]);
		if (hour > 23 || minute > 59 || second > 59) return null;
		const microsecond = m[7] !== undefined ? Number(m[7].slice(0, 6).padEnd(6, "0")) : 0;
		const utcOffsetMinutes = m[8] !== undefined ? parseIsoOffset(m[8]) : undefined;
		return { kind: "datetime", year, month, day, hour, minute, second, microsecond, utcOffsetMinutes };
	}
	try {
		return dateToDatetimeMidnight(parseIsoDate(value));
	} catch {
		return null;
	}
}

/**
 * Python: `string_to_date`. Parses a free-form date/time string into a value comparable
 * to Python's `datetime.datetime` (Python: `dateutil.parser.isoparse`, falling back to
 * `dateutil.parser.parse(string, dayfirst=True, fuzzy=True)`; see header comment finding
 * #4 for exactly what is and is not replicated here -- notably, `fuzzy=True`'s free-text
 * substring extraction is NOT reproduced, a genuine, disclosed gap, see `TODOS.md`).
 * Returns `null` for an empty/falsy input or anything neither strategy recognizes
 * (Python: returns `None` in both cases too).
 */
export function stringToDate(value: string | null | undefined): IsoDateTime | null {
	if (!value) return null;
	const iso = tryParseIsoparse(value);
	if (iso) return iso;
	const numeric = tryParseNumericDayFirst(value);
	if (numeric) return numeric;
	return tryParseMonthName(value);
}

/**
 * Python: `canonicalise_time`. Formats a date/datetime-like value as `"DD/MM/YY"`, or
 * `"-"` for a falsy input (Python: `if not time: return "-"`).
 */
export function canonicaliseTime(time: IsoDate | IsoDateTime | null | undefined): string {
	if (!time) return "-";
	return `${pad(time.day, 2)}/${pad(time.month, 2)}/${pad(time.year % 100, 2)}`;
}

export { isIsoDate as isDate, isIsoTime as isTime, isIsoDateTime as isDateTime };
