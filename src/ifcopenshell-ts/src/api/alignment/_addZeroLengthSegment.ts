// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_add_zero_length_segment.py` (src/ifcopenshell-
// python, 45 lines) -- see `./index.ts`'s own header comment for this brand-new
// module's full scope (chunk 7 of many). Depends on this chunk's own `addZeroLengthSegment`
// (file 5 of this chunk, `./addZeroLengthSegment.ts`) and already-landed `getLayoutCurve`
// (chunk 2, `./getLayoutCurve.ts`) -- both verified against their real exported
// name/signature before use.
//
// Real Python's own docstring: "This function depends on the assumptions made in
// ifcopenshell.api.alignment.create and is called by that function. This is not a
// general purpose function." -- `create()` itself is out of this chunk's scope (a
// future chunk), so this function is, like several of this module's earlier chunks'
// own module-private helpers, currently unreachable from any ported public entry point
// -- ported completely and tested directly with hand-built fixtures regardless,
// matching that same established precedent (e.g. `_updateZeroLengthSegmentPlacement.ts`).
//
// --- Inherits `addZeroLengthSegment`'s own CONDITIONAL portability, with no special-
//     casing of its own ---
//
// Since `addZeroLengthSegment` (this chunk's own file 5) is only conditionally blocked
// (fully portable for a genuinely empty layout/curve -- see that file's own header
// comment for the full, nuanced writeup of exactly which layout types/shapes qualify --
// and throws a clear, disclosed error for a non-empty one), this plain 2-call wrapper
// inherits that same conditional behavior for BOTH of its own calls (once on `layout`,
// once on `layout`'s own representation curve, if one exists) with NO special-casing
// added here: each call either succeeds or throws exactly as `addZeroLengthSegment`
// itself dictates for that specific input. A caller with a genuinely fresh, empty
// `layout` (and either no curve yet, or an equally empty one) gets a fully real,
// working `_addZeroLengthSegment` end to end; a caller with any real segments already
// present on either side throws the same disclosed error `addZeroLengthSegment.ts`'s
// own header comment documents.
//
// `layout.get("IsNestedBy")`/etc. type-checking here is real Python's own, unrelated to
// `getLayoutCurve`'s own already-disclosed lack of a null-guard on `getAlignment`'s
// result (see `getLayoutCurve.ts`'s own header comment) -- ported with the identical
// lack of an extra guard: a malformed `layout` not nested to any `IfcAlignment` fails
// inside `getLayoutCurve` exactly as real Python's own equivalent call would.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { addZeroLengthSegment } from "./addZeroLengthSegment";
import { getLayoutCurve } from "./getLayoutCurve";

const EXPECTED_TYPES = ["IfcAlignmentHorizontal", "IfcAlignmentVertical", "IfcAlignmentCant"];

/** Python's `f"{[_ for _ in expected_types]}"` -- see `addZeroLengthSegment.ts`'s own
 * header comment: this file's own message has no unmatched-quote bug either. */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

/**
 * Adds a zero length segment to the end of a layout. Also adds a zero length segment
 * to the end of the corresponding geometric curve (Python: `ifcopenshell.api.alignment
 * ._add_zero_length_segment`).
 *
 * This function depends on the assumptions made in `create()` and is called by that
 * function. This is not a general purpose function.
 *
 * @param file The file.
 * @param layout An `IfcAlignmentHorizontal`, `IfcAlignmentVertical`, or `IfcAlignmentCant`.
 * @throws {TypeError} If `layout` is not one of the expected types.
 * @throws {Error} If either call to `addZeroLengthSegment` throws -- see this file's
 *   own header comment, and `addZeroLengthSegment.ts`'s own, for exactly when.
 */
export function _addZeroLengthSegment(file: IfcFile, layout: EntityInstance): void {
	if (!EXPECTED_TYPES.includes(layout.isA())) {
		throw new TypeError(
			`Expected layout type to be one of ${pythonListRepr(EXPECTED_TYPES)}, instead received ${layout.isA()}`,
		);
	}

	addZeroLengthSegment(file, layout);

	const curve = getLayoutCurve(layout);
	if (curve) {
		addZeroLengthSegment(file, curve);
	}
}
