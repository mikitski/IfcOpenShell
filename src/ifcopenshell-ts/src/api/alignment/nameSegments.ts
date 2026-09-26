// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/name_segments.py` (src/ifcopenshell-python, 40
// lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). No dependency of any kind, no blocker.
//
// Same `TypeError` message quirk as `./hasZeroLengthSegment.ts` (a genuine
// unmatched-quote bug in the real Python f-string, preserved verbatim -- see that
// file's own header comment, quirk 1, for the full writeup; `pythonListRepr` is
// duplicated here rather than shared, matching this project's established
// per-module-local-helper convention).
//
// Real Python's `i` counter is NOT reset per `IfcRelNests` -- it increments
// continuously across every `IfcAlignmentSegment` found in EVERY rel in
// `layout.IsNestedBy` (in iteration order), so if a layout unusually had more than
// one nesting relationship, segment numbering would continue seamlessly across all of
// them, not restart at 1 for each. Ported with the same single, outer-scoped counter.
import type { EntityInstance } from "../../entityInstance";

const EXPECTED_TYPES = ["IfcAlignmentHorizontal", "IfcAlignmentVertical", "IfcAlignmentCant"];

/** Python's `f"{[_ for _ in expected_types]}"` -- see `./hasZeroLengthSegment.ts`'s
 * identical helper's own doc comment. */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

/**
 * Sets the `IfcAlignmentSegment.Name` attribute using a prefix and sequence number
 * (e.g. `"H1"` for horizontal, `"V1"` for vertical, `"C1"` for cant) (Python:
 * `ifcopenshell.api.alignment.name_segments`).
 *
 * @param prefix The naming prefix.
 * @param layout The layout alignment whose segments are to be named. This should be
 *   an `IfcAlignmentHorizontal`, `IfcAlignmentVertical`, or `IfcAlignmentCant`.
 * @throws {TypeError} If `layout` is not one of the expected types -- see this file's
 *   own header comment for the exact (deliberately malformed) message text.
 */
export function nameSegments(prefix: string, layout: EntityInstance): void {
	if (!EXPECTED_TYPES.includes(layout.isA())) {
		throw new TypeError(
			`Expected entity type to be one of ${pythonListRepr(EXPECTED_TYPES)}, instead received '${layout.isA()}`,
		);
	}

	let i = 1;
	for (const rel of layout.get("IsNestedBy") as EntityInstance[]) {
		for (const segment of rel.get("RelatedObjects") as EntityInstance[]) {
			if (segment.isA("IfcAlignmentSegment")) {
				segment.set("Name", `${prefix}${i}`);
				i += 1;
			}
		}
	}
}
