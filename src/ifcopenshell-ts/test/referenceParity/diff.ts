// This file was generated with the assistance of an AI coding tool.
//
// Diff/compare logic for the reference-model parity testing plan
// (planning/ifcopenshell-ts/80-reference-parity-testing-plan.md §4): a recursive
// structural diff over the normalized dump format `dump.ts`/
// `tools/reference_dump_python.py` both produce, with `approxEqual` float tolerance
// (the plan doc's own ~1e-9 default). Deliberately generic over `FileDump`'s shape
// (not import-coupled to `dump.ts` beyond that shared shape) and reports every actual
// mismatch found, not just a boolean -- both per this chunk's own task brief ("you'll
// want detail when triaging real divergences") and so chunks 2/3 (round-trip and
// mutation parity, not built by this chunk) can reuse this exact engine unchanged: both
// reuse chunk 1's checked-in goldens and this same diff, only varying what TS-side dump
// gets compared against it.
//
// Note on why int-vs-float/JSON number formatting differences never need special-casing
// here: this diff always operates on already-`JSON.parse`d (or freshly-`dumpFile`-built)
// in-memory JS values, never on the raw golden JSON text. JS has exactly one numeric
// type (`number`, IEEE-754 double) -- Python's own `int`/`float` distinction (real in
// `json.dumps`' text output, e.g. `5` vs `5.0`) collapses to the identical JS `number`
// the instant `JSON.parse` reads it back, so it can never surface as a diff here even
// though it's a real, disclosed, already-tracked gap elsewhere in this port (`TODOS.md`:
// "`EntityInstance.getByIndex`/`wrapValue` collapse EXPRESS INTEGER vs. REAL into one JS
// `number`") -- that gap only bites callers doing their own Python-style string
// rendering (`util/selector.ts`'s `format()`), not a value-level structural diff like
// this one.

/** One entry per instance, keyed by STEP id (`"#<id>"`) -- the shared dump shape. */
export interface DumpedInstanceLike {
	readonly type: string;
	readonly attrs: readonly unknown[];
}

export type FileDumpLike = Record<string, DumpedInstanceLike>;

/** A single, fully-described mismatch -- always includes both sides and why they differ. */
export interface DumpMismatch {
	/** e.g. `"#123.type"`, `"#123.attrs[4]"`, `"#123.attrs[4][1]"` for a nested aggregate. */
	readonly path: string;
	readonly expected: unknown;
	readonly actual: unknown;
	readonly reason: string;
}

/**
 * Tolerance-based float comparison (the plan doc's own §4: "never exact equality --
 * Python and V8 can legitimately format/round the same double slightly differently
 * without it being a real port bug"). `NaN` is treated as equal to itself (neither
 * language's own attribute values are expected to ever be `NaN` in a valid IFC file, but
 * `NaN !== NaN` under plain `===` would otherwise make an accidental pair look like a
 * mismatch when it's actually the same "not a real number" state on both sides).
 */
export function approxEqual(a: number, b: number, epsilon = 1e-9): boolean {
	if (Number.isNaN(a) && Number.isNaN(b)) return true;
	if (a === b) return true;
	return Math.abs(a - b) <= epsilon;
}

function typeName(value: unknown): string {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	return typeof value;
}

/**
 * Recursive structural diff of two already-normalized dump values (an `attrs` array, or
 * any value nested within one). Appends every mismatch found to `out` rather than
 * stopping at the first one, except where continuing would only produce further noise
 * from an already-reported structural mismatch (an array-vs-non-array or length
 * mismatch at a given path makes any deeper per-element comparison meaningless).
 */
export function diffValues(
	expected: unknown,
	actual: unknown,
	path: string,
	epsilon: number,
	out: DumpMismatch[],
): void {
	if (Array.isArray(expected) || Array.isArray(actual)) {
		if (!Array.isArray(expected) || !Array.isArray(actual)) {
			out.push({
				path,
				expected,
				actual,
				reason: `type mismatch (${typeName(expected)} vs ${typeName(actual)})`,
			});
			return;
		}
		if (expected.length !== actual.length) {
			out.push({
				path,
				expected,
				actual,
				reason: `array length mismatch (${expected.length} vs ${actual.length})`,
			});
			return;
		}
		for (let i = 0; i < expected.length; i++) {
			diffValues(expected[i], actual[i], `${path}[${i}]`, epsilon, out);
		}
		return;
	}
	if (typeof expected === "number" && typeof actual === "number") {
		if (!approxEqual(expected, actual, epsilon)) {
			out.push({ path, expected, actual, reason: "number mismatch (outside float tolerance)" });
		}
		return;
	}
	if (typeName(expected) !== typeName(actual)) {
		out.push({ path, expected, actual, reason: `type mismatch (${typeName(expected)} vs ${typeName(actual)})` });
		return;
	}
	if (expected !== actual) {
		out.push({ path, expected, actual, reason: "value mismatch" });
	}
}

/**
 * Diffs two whole-file dumps: every instance present in `expected` (the golden) must be
 * present in `actual` (this port's own dump) with the same `type` and `attrs`, and
 * vice versa -- an extra or missing instance is reported exactly like an attribute
 * mismatch, not silently ignored.
 */
export function diffFileDumps(expected: FileDumpLike, actual: FileDumpLike, epsilon = 1e-9): DumpMismatch[] {
	const mismatches: DumpMismatch[] = [];
	const expectedKeys = Object.keys(expected);
	const actualKeySet = new Set(Object.keys(actual));

	for (const key of expectedKeys) {
		if (!actualKeySet.has(key)) {
			mismatches.push({
				path: key,
				expected: expected[key],
				actual: undefined,
				reason: "instance missing from actual",
			});
			continue;
		}
		actualKeySet.delete(key);
		const expectedInstance = expected[key];
		const actualInstance = actual[key];
		if (expectedInstance.type !== actualInstance.type) {
			mismatches.push({
				path: `${key}.type`,
				expected: expectedInstance.type,
				actual: actualInstance.type,
				reason: "type name mismatch",
			});
			// The attrs comparison would only be noise once the type itself is wrong
			// (different declarations generally have different attribute shapes).
			continue;
		}
		diffValues(expectedInstance.attrs, actualInstance.attrs, `${key}.attrs`, epsilon, mismatches);
	}
	for (const key of actualKeySet) {
		mismatches.push({
			path: key,
			expected: undefined,
			actual: actual[key],
			reason: "unexpected extra instance in actual",
		});
	}
	return mismatches;
}
