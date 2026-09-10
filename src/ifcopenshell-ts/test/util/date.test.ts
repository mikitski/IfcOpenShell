// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/util/test_date.py` (src/ifcopenshell-python). That Python
// file only tests `readable_ifc_duration` (confirmed by reading the whole 31-line
// file) -- `TestReadableIFCDuration` below ports its exact assertions. Every other
// function covered here is original coverage (matching `util/element.ts`/`util/unit.ts`'s
// own established precedent for functions Python itself doesn't directly test),
// targeting the behavior documented/verified in `src/util/date.ts`'s own header
// comment -- in particular its disclosed `isodate`/`dateutil` library-equivalence
// findings (unified `Duration` shape, the `-P.../P0D` sign/zero-duration edge cases,
// the inherited upstream fuzzy-parser "M" dead-code bug, and `stringToDate`'s
// documented, narrower-than-`dateutil.fuzzy` scope).
//
// `ifc2datetime`'s `IfcCalendarDate`/`IfcDateAndTime` entity-instance branches are
// IFC2X3-only types (confirmed empirically against this worktree's locally-built
// addon: absent from both IFC4 and IFC4X3's schema declarations, deprecated in favor
// of plain STRING-encoded `IfcDate`/`IfcDateTime`/`IfcTime` from IFC4 onward) --
// gated on `AVAILABLE_SCHEMAS.includes("IFC2X3")` (CI's core build is
// `SCHEMA_VERSIONS=4`, IFC4-only, per this project's own `AVAILABLE_SCHEMAS`
// skip-guard convention -- `test/bootstrap.ts`), never a hard-coded schema-version
// string literal outside that guard.

import { describe, expect, test } from "vitest";
import type { IfcFile } from "../../src/file";
import * as subject from "../../src/util/date";
import { AVAILABLE_SCHEMAS, createTestFile } from "../bootstrap";

describe("util.date readableIfcDuration", () => {
	test("matches test_date.py::TestReadableIFCDuration.test_run", () => {
		expect(subject.readableIfcDuration("P0Y0M1DT16H0M0S")).toBe("1D 16h");
		expect(subject.readableIfcDuration("P2Y3M1W4DT5H45M30S")).toBe("2Y 3M 1W 4D 5h 45m 30s");
		expect(subject.readableIfcDuration("PT40H")).toBe("40h");

		// Float values.
		expect(subject.readableIfcDuration("P2.5D")).toBe("2.5D");
		expect(subject.readableIfcDuration("PT1.5H")).toBe("1.5h");
	});
});

describe("util.date durationIsoformat / parseDuration (ISO 8601 round trips)", () => {
	test("full component round trip", () => {
		const parsed = subject.parseDuration("P1Y2M3DT4H5M6S");
		expect(parsed).toEqual({ years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6 });
		expect(subject.durationIsoformat(parsed as subject.Duration)).toBe("P1Y2M3DT4H5M6S");
	});

	test("weeks collapse into days on format, matching isodate (not preserved as 'W')", () => {
		const parsed = subject.parseDuration("P2W");
		expect(parsed).toEqual({ years: 0, months: 0, days: 14, hours: 0, minutes: 0, seconds: 0 });
		expect(subject.durationIsoformat(parsed as subject.Duration)).toBe("P14D");
	});

	test("negative duration", () => {
		const parsed = subject.parseDuration("-P1D");
		expect(parsed).toEqual({ years: 0, months: 0, days: -1, hours: 0, minutes: 0, seconds: 0 });
		expect(subject.durationIsoformat(parsed as subject.Duration)).toBe("-P1D");
	});

	test("fractional seconds, trailing zeros stripped", () => {
		expect(subject.durationIsoformat({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 1.5 })).toBe(
			"PT1.5S",
		);
	});

	test("all-zero duration formats as P0D, not PT0S", () => {
		const parsed = subject.parseDuration("PT0S");
		expect(parsed).toEqual({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
		expect(subject.durationIsoformat(parsed as subject.Duration)).toBe("P0D");
	});

	test("large hour count renormalizes into days on format, unlike readableIfcDuration", () => {
		// PT2500H stays "2500h" in readableIfcDuration (see that function's own
		// docstring/test above), but durationIsoformat recombines-then-resplits
		// exactly like isodate's own `_strfduration` does.
		const parsed = subject.parseDuration("PT2500H");
		expect(subject.durationIsoformat(parsed as subject.Duration)).toBe("P104DT4H");
	});

	test("invalid duration string returns null", () => {
		expect(subject.parseDuration("not a duration")).toBeNull();
		expect(subject.parseDuration("")).toBeNull();
		expect(subject.parseDuration(null)).toBeNull();
		expect(subject.parseDuration(undefined)).toBeNull();
	});
});

describe("util.date timedelta2duration", () => {
	test("decomposes normalized seconds into h/m/s, keeps days as-is", () => {
		expect(subject.timedelta2duration({ days: 2, seconds: 3661 })).toEqual({
			years: 0,
			months: 0,
			days: 2,
			hours: 1,
			minutes: 1,
			seconds: 1,
		});
	});

	test("negative timedelta (Python's own normalized form: sign lives entirely in `days`)", () => {
		// Python: timedelta(seconds=-1) normalizes to days=-1, seconds=86399.
		const duration = subject.timedelta2duration({ days: -1, seconds: 86399 });
		expect(duration).toEqual({ years: 0, months: 0, days: -1, hours: 23, minutes: 59, seconds: 59 });
		expect(subject.durationIsoformat(duration)).toBe("-PT1S");
	});

	test("missing fields default to 0 (Python: getattr(..., 0))", () => {
		expect(subject.timedelta2duration({})).toEqual({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
	});
});

describe("util.date stringToDuration", () => {
	test("matches Python's lowercase-only d/h/m/s extraction", () => {
		expect(subject.stringToDuration("2d 3h 4m 5s")).toBe("P2DT3H4M5S");
	});

	test("single component", () => {
		expect(subject.stringToDuration("90m")).toBe("PT1H30M");
	});

	test("uppercase designators are not matched (Python's regex is case-sensitive)", () => {
		expect(subject.stringToDuration("2D 3H")).toBe("P0D");
	});
});

describe("util.date parseDuration (fuzzy, non-ISO fallback)", () => {
	test("hours before minutes correctly inserts the T separator", () => {
		const parsed = subject.parseDuration("2H30M");
		expect(subject.durationIsoformat(parsed as subject.Duration)).toBe("PT2H30M");
	});

	test("mixed day + time designators", () => {
		const parsed = subject.parseDuration("1D2H3M4S");
		expect(subject.durationIsoformat(parsed as subject.Duration)).toBe("P1DT2H3M4S");
	});

	test("days alone, no T section", () => {
		const parsed = subject.parseDuration("5D");
		expect(subject.durationIsoformat(parsed as subject.Duration)).toBe("P5D");
	});

	test("inherited upstream dead-code bug (see date.ts's header comment): a lone " +
		"'M' with no preceding 'H' is never T-inserted, so '90MIN' parses as 90 " +
		"MONTHS, not 90 minutes -- ported faithfully, not fixed", () => {
		const parsed = subject.parseDuration("90MIN");
		expect(parsed).toEqual({ years: 0, months: 90, days: 0, hours: 0, minutes: 0, seconds: 0 });
		expect(subject.durationIsoformat(parsed as subject.Duration)).toBe("P90M");
	});

	test("unparseable fuzzy string returns null", () => {
		expect(subject.parseDuration("hello")).toBeNull();
	});
});

describe("util.date parseIsoDate / parseIsoTime / parseIsoDatetime / format*", () => {
	test("parseIsoDate: extended and basic forms", () => {
		expect(subject.parseIsoDate("2020-01-15")).toEqual({ kind: "date", year: 2020, month: 1, day: 15 });
		expect(subject.parseIsoDate("20200115")).toEqual({ kind: "date", year: 2020, month: 1, day: 15 });
	});

	test("parseIsoDate: invalid calendar date throws", () => {
		// 2020 is a leap year (Feb has 29 days), so Feb 30 is invalid either way.
		expect(() => subject.parseIsoDate("2020-02-30")).toThrow();
	});

	test("parseIsoTime: seconds, fractional seconds, and offsets", () => {
		expect(subject.parseIsoTime("14:30:00")).toEqual({
			kind: "time",
			hour: 14,
			minute: 30,
			second: 0,
			microsecond: 0,
			utcOffsetMinutes: undefined,
		});
		expect(subject.parseIsoTime("14:30:00.5")).toMatchObject({ microsecond: 500000 });
		expect(subject.parseIsoTime("14:30:00+02:00")).toMatchObject({ utcOffsetMinutes: 120 });
		expect(subject.parseIsoTime("14:30:00Z")).toMatchObject({ utcOffsetMinutes: 0 });
	});

	test("parseIsoDatetime: date-only defaults time to midnight, matching Python 3.11+ fromisoformat", () => {
		expect(subject.parseIsoDatetime("2020-01-15")).toEqual({
			kind: "datetime",
			year: 2020,
			month: 1,
			day: 15,
			hour: 0,
			minute: 0,
			second: 0,
			microsecond: 0,
		});
	});

	test("parseIsoDatetime: full date + time round trips through formatIsoDatetime", () => {
		const dt = subject.parseIsoDatetime("2020-01-15T14:30:00");
		expect(subject.formatIsoDatetime(dt)).toBe("2020-01-15T14:30:00");
	});

	test("formatIsoTime omits microseconds when zero, includes them zero-padded otherwise", () => {
		expect(subject.formatIsoTime({ kind: "time", hour: 1, minute: 2, second: 3, microsecond: 0 })).toBe("01:02:03");
		expect(subject.formatIsoTime({ kind: "time", hour: 1, minute: 2, second: 3, microsecond: 500000 })).toBe(
			"01:02:03.500000",
		);
	});
});

describe("util.date ifc2datetime", () => {
	test("IfcDuration string", () => {
		expect(subject.ifc2datetime("P1DT2H")).toEqual({ years: 0, months: 0, days: 1, hours: 2, minutes: 0, seconds: 0 });
	});

	test("IfcTime string", () => {
		expect(subject.ifc2datetime("14:30:00")).toEqual({
			kind: "time",
			hour: 14,
			minute: 30,
			second: 0,
			microsecond: 0,
			utcOffsetMinutes: undefined,
		});
	});

	test("IfcDateTime string", () => {
		expect(subject.ifc2datetime("2020-01-15T14:30:00")).toEqual({
			kind: "datetime",
			year: 2020,
			month: 1,
			day: 15,
			hour: 14,
			minute: 30,
			second: 0,
			microsecond: 0,
			utcOffsetMinutes: undefined,
		});
	});

	test("IfcDate string", () => {
		expect(subject.ifc2datetime("2020-01-15")).toEqual({ kind: "date", year: 2020, month: 1, day: 15 });
	});

	test("IfcTimeStamp (epoch seconds, local-timezone interpretation)", () => {
		const epoch = 1_600_000_000; // 2020-09-13T12:26:40Z, some fixed instant
		const result = subject.ifc2datetime(epoch) as subject.IsoDateTime;
		const expected = new Date(epoch * 1000);
		expect(result).toEqual({
			kind: "datetime",
			year: expected.getFullYear(),
			month: expected.getMonth() + 1,
			day: expected.getDate(),
			hour: expected.getHours(),
			minute: expected.getMinutes(),
			second: expected.getSeconds(),
			microsecond: 0,
		});
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("util.date ifc2datetime (IFC2X3 entity instances)", () => {
	function makeFile(): IfcFile {
		return createTestFile("IFC2X3");
	}

	test("IfcCalendarDate", () => {
		const file = makeFile();
		const calendarDate = file.createEntity("IfcCalendarDate");
		calendarDate.set("DayComponent", 15);
		calendarDate.set("MonthComponent", 1);
		calendarDate.set("YearComponent", 2020);

		expect(subject.ifc2datetime(calendarDate)).toEqual({ kind: "date", year: 2020, month: 1, day: 15 });
		file.dispose();
	});

	test("IfcDateAndTime", () => {
		const file = makeFile();
		const calendarDate = file.createEntity("IfcCalendarDate");
		calendarDate.set("DayComponent", 15);
		calendarDate.set("MonthComponent", 1);
		calendarDate.set("YearComponent", 2020);
		const localTime = file.createEntity("IfcLocalTime");
		localTime.set("HourComponent", 14);
		localTime.set("MinuteComponent", 30);
		localTime.set("SecondComponent", 45);
		const dateAndTime = file.createEntity("IfcDateAndTime");
		dateAndTime.set("DateComponent", calendarDate);
		dateAndTime.set("TimeComponent", localTime);

		expect(subject.ifc2datetime(dateAndTime)).toEqual({
			kind: "datetime",
			year: 2020,
			month: 1,
			day: 15,
			hour: 14,
			minute: 30,
			second: 45,
			microsecond: 0,
		});
		file.dispose();
	});
});

describe("util.date datetime2ifc", () => {
	test("null/undefined returns undefined", () => {
		expect(subject.datetime2ifc(null, "IfcDate")).toBeUndefined();
		expect(subject.datetime2ifc(undefined, "IfcDate")).toBeUndefined();
	});

	test("IfcDuration string is returned verbatim (Python: early return, no reformatting)", () => {
		expect(subject.datetime2ifc("not-actually-iso-8601", "IfcDuration")).toBe("not-actually-iso-8601");
	});

	test("IfcDuration from a Duration object", () => {
		const duration: subject.Duration = { years: 0, months: 0, days: 1, hours: 2, minutes: 0, seconds: 0 };
		expect(subject.datetime2ifc(duration, "IfcDuration")).toBe("P1DT2H");
	});

	test("IfcTimeStamp", () => {
		const dt: subject.IsoDateTime = {
			kind: "datetime",
			year: 2020,
			month: 1,
			day: 15,
			hour: 14,
			minute: 30,
			second: 0,
			microsecond: 0,
		};
		const result = subject.datetime2ifc(dt, "IfcTimeStamp") as number;
		expect(result).toBe(Math.trunc(new Date(2020, 0, 15, 14, 30, 0).getTime() / 1000));
	});

	test("IfcDateTime from a datetime value", () => {
		const dt: subject.IsoDateTime = {
			kind: "datetime",
			year: 2020,
			month: 1,
			day: 15,
			hour: 14,
			minute: 30,
			second: 0,
			microsecond: 0,
		};
		expect(subject.datetime2ifc(dt, "IfcDateTime")).toBe("2020-01-15T14:30:00");
	});

	test("IfcDateTime from a date-only value (combines with midnight, matching Python)", () => {
		const d: subject.IsoDate = { kind: "date", year: 2020, month: 1, day: 15 };
		expect(subject.datetime2ifc(d, "IfcDateTime")).toBe("2020-01-15T00:00:00");
	});

	test("IfcDate from a datetime value (drops the time-of-day)", () => {
		const dt: subject.IsoDateTime = {
			kind: "datetime",
			year: 2020,
			month: 1,
			day: 15,
			hour: 14,
			minute: 30,
			second: 0,
			microsecond: 0,
		};
		expect(subject.datetime2ifc(dt, "IfcDate")).toBe("2020-01-15");
	});

	test("IfcTime from a datetime value (drops the date)", () => {
		const dt: subject.IsoDateTime = {
			kind: "datetime",
			year: 2020,
			month: 1,
			day: 15,
			hour: 14,
			minute: 30,
			second: 0,
			microsecond: 0,
		};
		expect(subject.datetime2ifc(dt, "IfcTime")).toBe("14:30:00");
	});

	test("IfcCalendarDate", () => {
		const d: subject.IsoDate = { kind: "date", year: 2020, month: 1, day: 15 };
		expect(subject.datetime2ifc(d, "IfcCalendarDate")).toEqual({
			DayComponent: 15,
			MonthComponent: 1,
			YearComponent: 2020,
		});
	});

	test("IfcLocalTime", () => {
		const t: subject.IsoTime = { kind: "time", hour: 14, minute: 30, second: 45, microsecond: 0 };
		expect(subject.datetime2ifc(t, "IfcLocalTime")).toEqual({
			HourComponent: 14,
			MinuteComponent: 30,
			SecondComponent: 45,
		});
	});

	test("mismatched value/ifc_type combination throws (Python: falls through to the final TypeError)", () => {
		const t: subject.IsoTime = { kind: "time", hour: 14, minute: 30, second: 45, microsecond: 0 };
		expect(() => subject.datetime2ifc(t, "IfcDate")).toThrow(TypeError);
	});

	test("string input: full datetime string parses via the datetime branch first", () => {
		expect(subject.datetime2ifc("2020-01-15T10:00:00", "IfcDate")).toBe("2020-01-15");
	});

	test("string input: falls back to time parsing when the datetime parse fails", () => {
		expect(subject.datetime2ifc("14:30:00", "IfcTime")).toBe("14:30:00");
	});

	test("round trips ifc2datetime -> datetime2ifc for a duration string", () => {
		const parsed = subject.ifc2datetime("P1DT2H") as subject.Duration;
		expect(subject.datetime2ifc(parsed, "IfcDuration")).toBe("P1DT2H");
	});

	test("round trips ifc2datetime -> datetime2ifc for an IfcTimeStamp", () => {
		const epoch = 1_600_000_000;
		const parsed = subject.ifc2datetime(epoch) as subject.IsoDateTime;
		expect(subject.datetime2ifc(parsed, "IfcTimeStamp")).toBe(epoch);
	});
});

describe("util.date stringToDate", () => {
	test("empty/null/undefined returns null", () => {
		expect(subject.stringToDate("")).toBeNull();
		expect(subject.stringToDate(null)).toBeNull();
		expect(subject.stringToDate(undefined)).toBeNull();
	});

	test("ISO extended datetime", () => {
		expect(subject.stringToDate("2020-01-15T14:30:00")).toMatchObject({
			year: 2020,
			month: 1,
			day: 15,
			hour: 14,
			minute: 30,
		});
	});

	test("ISO basic (no separators) datetime -- dateutil.isoparse accepts this, plain fromisoformat doesn't", () => {
		expect(subject.stringToDate("20200115T143000")).toMatchObject({
			year: 2020,
			month: 1,
			day: 15,
			hour: 14,
			minute: 30,
		});
	});

	test("numeric day-first fallback (dateutil.parser(..., dayfirst=True))", () => {
		expect(subject.stringToDate("15/01/2020")).toMatchObject({ year: 2020, month: 1, day: 15 });
		expect(subject.stringToDate("15-01-2020")).toMatchObject({ year: 2020, month: 1, day: 15 });
	});

	test("month-name fallback", () => {
		expect(subject.stringToDate("5 January 2020")).toMatchObject({ year: 2020, month: 1, day: 5 });
		expect(subject.stringToDate("January 5, 2020")).toMatchObject({ year: 2020, month: 1, day: 5 });
		expect(subject.stringToDate("5 Jan 2020")).toMatchObject({ year: 2020, month: 1, day: 5 });
	});

	test("free-text fuzzy extraction is NOT supported (disclosed gap vs. dateutil's " +
		"fuzzy=True -- see date.ts's header comment finding #4 / TODOS.md)", () => {
		expect(subject.stringToDate("Meeting on 5 January 2020 at noon")).toBeNull();
	});
});

describe("util.date canonicaliseTime", () => {
	test("falsy input returns '-'", () => {
		expect(subject.canonicaliseTime(null)).toBe("-");
		expect(subject.canonicaliseTime(undefined)).toBe("-");
	});

	test("formats as DD/MM/YY", () => {
		expect(subject.canonicaliseTime({ kind: "date", year: 2020, month: 1, day: 5 })).toBe("05/01/20");
	});

	test("2-digit year wraps like Python's %y (year 2000 -> '00')", () => {
		expect(subject.canonicaliseTime({ kind: "date", year: 2000, month: 12, day: 31 })).toBe("31/12/00");
	});
});
