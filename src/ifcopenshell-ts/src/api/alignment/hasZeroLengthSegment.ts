// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/has_zero_length_segment.py`
// (src/ifcopenshell-python, 62 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 1 of many). No dependency of any kind, no
// blocker.
//
// --- 3 real Python quirks, all preserved verbatim (this project's established
//     discipline: port the actual logic, disclose rather than silently fix) ---
//
// 1. **The `TypeError` message has a genuine unmatched-quote bug.** Real Python:
//    `f"Expected entity type to be one of {[_ for _ in expected_types]}, instead
//    received '{layout.is_a()}"` -- opens a `'` right before `{layout.is_a()}` but
//    never closes it (no trailing `'` after). `pythonListRepr` below reproduces
//    Python's own `repr()` of a list of strings (single-quoted, `", "`-joined) so the
//    first half of the message matches exactly; the missing closing quote is
//    reproduced by simply not adding one.
// 2. **The `IfcCompositeCurve`/`IfcGradientCurve`/`IfcSegmentedReferenceCurve` branch
//    tests `layout.Segments and 0 < len(layout.Segments)`** -- both conjuncts test the
//    same "is this list non-empty" condition (a falsy `None`/`[]` list attribute vs. a
//    `len() > 0` check), a redundant double-check with no behavioral difference from
//    either alone. Ported as `segments && segments.length > 0`, not simplified to a
//    single check, to keep the line a literal mirror of the real source.
// 3. **The `else` branch (horizontal/vertical/cant layout) never `break`s out of its
//    `for rel in layout.IsNestedBy` loop.** If a layout has more than one `IfcRelNests`
//    in `IsNestedBy` (unusual, but not guarded against), EVERY rel whose own last
//    `RelatedObjects` entry is an `IfcAlignmentSegment` reassigns `result` in
//    iteration order -- so the LAST such rel silently wins, not the first, and a rel
//    whose own last segment isn't recognized (not an `IfcAlignmentSegment`, or a
//    `DesignParameters` class not in the 3-way `elif` chain) leaves `result` at
//    whatever a PREVIOUS iteration set it to (never resets it to `false`). Ported with
//    the same never-reset, never-`break` control flow.
//
// `IfcCurveSegment.SegmentLength` (reached via `IfcCompositeCurve`/`IfcGradientCurve`/
// `IfcSegmentedReferenceCurve`'s `Segments` attribute) is a real EXPRESS SELECT-typed
// (`IfcCurveMeasureSelect`) attribute -- confirmed against `ifc4x3.d.ts`, where it's
// typed `unknown` (unlike `IfcAlignmentHorizontalSegment.SegmentLength`/
// `IfcAlignmentVerticalSegment.HorizontalLength`/`IfcAlignmentCantSegment
// .HorizontalLength`, all plain `number`s) -- so `.wrappedValue` (Python) is read here
// via `wrappedValueOf`'s `.getByIndex(0)`, matching `util/cost.ts`'s own identical
// helper's doc comment for why a standalone declared-type instance's single value
// lives at attribute index 0, not behind a `.get("wrappedValue")` pseudo-attribute
// name (unsupported by this port's N-API shim).
//
// NOTE: this branch's own logic is fully ported and correct (a READ of an
// already-existing wrapped value, unaffected by any known gap), but it has no real
// regression test in `hasZeroLengthSegment.test.ts` -- building a FRESH test fixture
// for it requires *constructing* a standalone declared-type value
// (`file.createEntity("IfcLengthMeasure", 0)`), which is a DIFFERENT, pre-existing,
// already-tracked primitive-layer gap (TODOS.md's own dedicated
// `EntityInstance.setByIndex`/`IfcFile.createEntity` entry) -- see that test file's
// own header comment for the full writeup.
import type { EntityInstance } from "../../entityInstance";

const EXPECTED_TYPES = [
	"IfcAlignmentHorizontal",
	"IfcAlignmentVertical",
	"IfcAlignmentCant",
	"IfcCompositeCurve",
	"IfcGradientCurve",
	"IfcSegmentedReferenceCurve",
];

/** Python's `f"{[_ for _ in expected_types]}"` -- `repr()` of a list of strings
 * (single-quoted elements, `", "`-joined) -- see this file's own header comment,
 * quirk 1, for why the caller deliberately leaves the message's closing quote off. */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

/** Python's `x.wrappedValue` for a defined/select-type-wrapped scalar -- see this
 * file's own header comment and `util/cost.ts`'s identical private helper's doc
 * comment. */
function wrappedValueOf(value: unknown): unknown {
	return value !== null && typeof value === "object" && "getByIndex" in value
		? (value as EntityInstance).getByIndex(0)
		: value;
}

/**
 * Returns true if the layout ends with a zero length segment (Python:
 * `ifcopenshell.api.alignment.has_zero_length_segment`).
 *
 * @param layout An `IfcAlignmentHorizontal`, `IfcAlignmentVertical`,
 *   `IfcAlignmentCant`, `IfcCompositeCurve`, `IfcGradientCurve`, or
 *   `IfcSegmentedReferenceCurve`.
 * @returns True if the zero length segment is present.
 * @throws {TypeError} If `layout` is not one of the expected types -- see this file's
 *   own header comment, quirk 1, for the exact (deliberately malformed) message text.
 */
export function hasZeroLengthSegment(layout: EntityInstance): boolean {
	if (!EXPECTED_TYPES.includes(layout.isA())) {
		throw new TypeError(
			`Expected entity type to be one of ${pythonListRepr(EXPECTED_TYPES)}, instead received '${layout.isA()}`,
		);
	}

	let result = false;

	if (layout.isA("IfcCompositeCurve") || layout.isA("IfcGradientCurve") || layout.isA("IfcSegmentedReferenceCurve")) {
		const segments = layout.get("Segments") as EntityInstance[] | null;
		result =
			!!segments && segments.length > 0 && wrappedValueOf(segments[segments.length - 1].get("SegmentLength")) === 0.0;
	} else {
		// See this file's own header comment, quirk 3: no `break`, `result` is never
		// reset -- the LAST matching `IsNestedBy` rel wins, and a non-matching later
		// rel leaves an earlier match's `result` untouched.
		for (const rel of layout.get("IsNestedBy") as EntityInstance[]) {
			const relatedObjects = rel.get("RelatedObjects") as EntityInstance[];
			if (relatedObjects.length > 0) {
				const lastSegment = relatedObjects[relatedObjects.length - 1];
				if (lastSegment.isA("IfcAlignmentSegment")) {
					const designParameters = lastSegment.get("DesignParameters") as EntityInstance;
					if (designParameters.isA("IfcAlignmentHorizontalSegment")) {
						result = (designParameters.get("SegmentLength") as number) === 0.0;
					} else if (designParameters.isA("IfcAlignmentVerticalSegment")) {
						result = (designParameters.get("HorizontalLength") as number) === 0.0;
					} else if (designParameters.isA("IfcAlignmentCantSegment")) {
						result = (designParameters.get("HorizontalLength") as number) === 0.0;
					}
				}
			}
		}
	}

	return result;
}
