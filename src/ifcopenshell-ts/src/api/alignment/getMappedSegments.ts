// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_mapped_segments.py` (src/ifcopenshell-python,
// 60 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 2 of many). Depends on this same chunk's own `getLayoutCurve`
// (`./getLayoutCurve.ts`, ported first per this chunk's own dependency order) -- no
// blocker.
//
// `_getCurveSegmentCount` is real Python's own module-private `_get_curve_segment_count`
// (leading underscore -- not part of `ifcopenshell.api.alignment`'s own public
// `__init__.py` re-exports), also imported directly by `./getCurveSegment.ts` --
// exported here (matching `attributeCache.ts`'s own established
// `_clearAttributeMetaCacheForTests` precedent for a not-really-public, underscore-
// prefixed cross-file export) rather than duplicated, since real Python itself
// imports the SAME function object from this SAME module rather than duplicating it.
//
// --- 3 real Python quirks, all preserved verbatim ---
//
// 1. `_get_curve_segment_count` has NO `else` branch after its 3
//    `DesignParameters.is_a(...)` checks -- real Python implicitly returns `None` for
//    any other `DesignParameters` type, which would then blow up as a `TypeError`
//    (`int + NoneType`) the moment the caller's `index +=`/arithmetic touches it. In
//    practice this is dead code: `IfcAlignmentParameterSegment` (the schema-declared
//    type of `IfcAlignmentSegment.DesignParameters`) has exactly 3 concrete subtypes
//    in IFC4X3 -- `IfcAlignmentHorizontalSegment`/`IfcAlignmentVerticalSegment`/
//    `IfcAlignmentCantSegment` -- so the 3 checks are already exhaustive and the
//    missing branch can never actually fire. Ported as a loud, explicit `throw`
//    instead of JS's silent `undefined`-propagates-to-`NaN` behavior (which has no
//    faithful equivalent of Python's own immediate `TypeError` crash) -- this project's
//    own established "throw a clear, loud error rather than silently produce a wrong
//    value" discipline, applied to genuinely unreachable-in-practice dead code rather
//    than silently returning `NaN`.
// 2. `get_mapped_segments` reads `layout_segment.Nests[0]` and
//    `layout.IsNestedBy[0]` UNCONDITIONALLY (index `0`, no filter on the related
//    object's type) -- unlike this same module's own `getAlignmentSegmentNest`
//    (chunk 1), which explicitly searches for the `IfcRelNests` whose
//    `RelatedObjects` contains an `IfcAlignmentSegment`. Ported with the same
//    unfiltered `[0]` access; a `layout_segment`/`layout` with more than one nesting
//    relationship (not expected in this module's own real usage) would silently pick
//    the wrong one.
// 3. A genuine OFF-BY-ONE bug in the Helmert-curve (2-`IfcCurveSegment`) return path:
//    `index` (after the loop's `break`) is the CUMULATIVE curve-segment count
//    THROUGH AND INCLUDING `layout_segment`'s own segments, i.e. `layout_segment`'s
//    own 2 curve segments occupy `curve.Segments[index - segment_count]` (correct)
//    and `curve.Segments[index - 1]` (the actual second one) -- but real Python
//    returns `curve.Segments[index]` for the second element, which is really the
//    FIRST curve segment of the NEXT `IfcAlignmentSegment` in the layout (or, if
//    `layout_segment` is the LAST segment in the layout, an out-of-range access --
//    Python's own `IndexError`; this port's plain array indexing instead silently
//    returns `undefined` for that case, a divergence purely from JS's own
//    non-throwing out-of-range array access, not something independently
//    special-cased here). Ported with the exact same `curve.Segments[index]` (not
//    `curve.Segments[index - 1]`) for the second element.
import type { EntityInstance } from "../../entityInstance";
import { getLayoutCurve } from "./getLayoutCurve";

/**
 * Returns the number of `IfcCurveSegment` that an `IfcAlignmentSegment` maps to.
 * Generally this is a 1-to-1 mapping, with a Helmert curve being the exception (see
 * this file's own header comment, quirk 1, for the un-reachable-in-practice missing
 * `else` branch this throws for instead).
 */
export function _getCurveSegmentCount(segment: EntityInstance): number {
	const designParameters = segment.get("DesignParameters") as EntityInstance;
	if (designParameters.isA("IfcAlignmentHorizontalSegment")) {
		return designParameters.get("PredefinedType") === "HELMERTCURVE" ? 2 : 1;
	}
	if (designParameters.isA("IfcAlignmentVerticalSegment")) {
		return 1;
	}
	if (designParameters.isA("IfcAlignmentCantSegment")) {
		return designParameters.get("PredefinedType") === "HELMERTCURVE" ? 2 : 1;
	}
	throw new Error(
		`Unexpected DesignParameters type '${designParameters.isA()}' -- see getMappedSegments.ts's own header comment, quirk 1 (real Python implicitly returns None here, which is unreachable in practice for IFC4X3's own schema).`,
	);
}

/**
 * From an `IfcAlignmentSegment`, returns the related `IfcCurveSegment` (Python:
 * `ifcopenshell.api.alignment.get_mapped_segments`). Typically the sequence has one
 * entity, however there will be two for a Helmert curve.
 *
 * @param layoutSegment The `IfcAlignmentSegment`.
 * @returns A 2-tuple; the second element is `null` unless `layoutSegment` maps to a
 *   Helmert curve (2 `IfcCurveSegment`s).
 * @throws {TypeError} If `layoutSegment` is not an `IfcAlignmentSegment`.
 */
export function getMappedSegments(layoutSegment: EntityInstance): readonly [EntityInstance, EntityInstance | null] {
	const expectedType = "IfcAlignmentSegment";
	if (!layoutSegment.isA(expectedType)) {
		throw new TypeError(`Expected to see type '${expectedType}', instead received '${layoutSegment.isA()}'.`);
	}

	const layout = (layoutSegment.get("Nests") as EntityInstance[])[0].get("RelatingObject") as EntityInstance;
	const curve = getLayoutCurve(layout) as EntityInstance;

	let index = 0;
	for (const seg of (layout.get("IsNestedBy") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[]) {
		index += _getCurveSegmentCount(seg);
		if (seg.equals(layoutSegment)) break;
	}

	const segments = curve.get("Segments") as EntityInstance[];
	const segmentCount = _getCurveSegmentCount(layoutSegment);
	if (segmentCount === 1) {
		return [segments[index - segmentCount], null] as const;
	}
	return [segments[index - segmentCount], segments[index]] as const;
}
