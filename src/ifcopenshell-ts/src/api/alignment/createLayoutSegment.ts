// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create_layout_segment.py` (src/ifcopenshell-python,
// 58 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 8 of many, the LAST chunk for this module). PUBLIC (confirmed present in
// real Python's own `__init__.py` `__all__`). Depends on already-landed
// `_addSegmentToLayout` (chunk 7, unconditionally throws for every real invocation --
// see that file's own header comment) and `guid.new` -- both verified directly.
//
// --- A thin wrapper: real, portable type-checking, then a real, portable
//     `IfcAlignmentSegment` construction, then the already-unconditionally-blocked
//     `_addSegmentToLayout` call ---
//
// Real Python's own `if`/`elif`/`elif` chain means only ONE of the 3 type-mismatch
// checks can ever fire for a given `layout` (since `layout.isA()` can only match one of
// the 3 mutually-exclusive expected types, already validated by the check above). Ported
// as 3 independent `if`s instead of an `if`/`else if`/`else if` chain (this project's
// linter -- `noUselessElse` -- flags the `else` as redundant once every branch throws),
// which is behaviorally identical here: each branch's own condition can only be true for
// one specific `layout` type, and every branch throws when true, so at most one of the 3
// ever actually executes either way.
//
// `file.createIfcAlignmentSegment(GlobalId=..., DesignParameters=design_parameters)`
// (only 2 of 8 real attributes set, the rest defaulting to `None`) matches the identical
// attribute order already established by `addZeroLengthSegment.ts`'s own
// `IfcAlignmentSegment` constructions (GlobalId(0), OwnerHistory(1), Name(2),
// Description(3), ObjectType(4), ObjectPlacement(5), Representation(6),
// DesignParameters(7)) -- reused verbatim here, not re-derived.
//
// `_addSegmentToLayout(file, layout, segment)` performs 2 real, portable side effects
// (`nest.assignObject` then `nest.reorderNesting`) BEFORE its own unconditional
// `_getSegmentEndpoint` kernel-gap throw -- so by the time `createLayoutSegment` itself
// throws, the new `IfcAlignmentSegment` has ALREADY been nested into `layout` for real
// (see `_addSegmentToLayout.ts`'s own header comment). `createLayoutSegment.test.ts`
// pins this: the segment is created and nested, then the call throws.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import type { MatrixType } from "../../util/placement";
import { _addSegmentToLayout } from "./_addSegmentToLayout";

const EXPECTED_TYPES = ["IfcAlignmentHorizontal", "IfcAlignmentVertical", "IfcAlignmentCant"];

/** Python's `f"{[_ for _ in expected_types]}"` -- no unmatched-quote bug in this file's
 * own message, verified directly against the real source's exact f-string text. */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

/**
 * Creates a new `IfcAlignmentSegment` using the `IfcAlignmentParameterSegment` design
 * parameters (Python: `ifcopenshell.api.alignment.create_layout_segment`). The new
 * segment is appended to the layout alignment, and the corresponding `IfcCurveSegment`
 * is created in the geometric representation if it exists.
 *
 * **Currently unconditionally blocked** by `_addSegmentToLayout`'s own already-disclosed
 * `_getSegmentEndpoint` kernel gap -- see that file's own header comment, and this
 * file's own, for exactly which real, portable side effects run before the throw.
 *
 * @param file The file.
 * @param layout The layout to receive the new layout segment. Expected to be
 *   `IfcAlignmentHorizontal`, `IfcAlignmentVertical`, or `IfcAlignmentCant`.
 * @param designParameters The parameters defining the segment. Expected to be the
 *   appropriate subclass of `IfcAlignmentParameterSegment`.
 * @returns The 4x4 matrix at the end of the segment, intended to be used as the start
 *   point geometry for the next segment, or `null` if the geometric representation is
 *   not defined.
 * @throws {TypeError} If `layout` is not one of the 3 expected types, or
 *   `designParameters` doesn't match the type expected for `layout`.
 * @throws {Error} Always, from the already-unconditionally-blocked `_addSegmentToLayout`
 *   -- see this file's own header comment.
 */
export function createLayoutSegment(
	file: IfcFile,
	layout: EntityInstance,
	designParameters: EntityInstance,
): MatrixType | null {
	if (!EXPECTED_TYPES.includes(layout.isA())) {
		throw new TypeError(
			`Expected entity type to be one of ${pythonListRepr(EXPECTED_TYPES)}, instead received ${layout.isA()}`,
		);
	}

	if (layout.isA("IfcAlignmentHorizontal") && !designParameters.isA("IfcAlignmentHorizontalSegment")) {
		throw new TypeError("Expected design_parameters to be IfcAlignmentHorizontalSegment");
	}
	if (layout.isA("IfcAlignmentVertical") && !designParameters.isA("IfcAlignmentVerticalSegment")) {
		throw new TypeError("Expected design_parameters to be IfcAlignmentVerticalSegment");
	}
	if (layout.isA("IfcAlignmentCant") && !designParameters.isA("IfcAlignmentCantSegment")) {
		throw new TypeError("Expected design_parameters to be IfcAlignmentCantSegment");
	}

	// create the segment and add it to the layout.
	const segment = file.createEntity(
		"IfcAlignmentSegment",
		guid.new(),
		null,
		null,
		null,
		null,
		null,
		null,
		designParameters,
	);
	// adds to layout and geometric representation (if present, also updates zero length segment position)
	const end = _addSegmentToLayout(file, layout, segment);

	return end;
}
