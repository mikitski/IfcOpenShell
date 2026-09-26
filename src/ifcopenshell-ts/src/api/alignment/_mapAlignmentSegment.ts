// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_map_alignment_segment.py`
// (src/ifcopenshell-python, 48 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 5 of many, the LAST of this chunk's 5
// files, ported after files 2-4 below all existed). A pure 3-way dispatcher over this
// chunk's own `_mapAlignmentHorizontalSegment`/`_mapAlignmentVerticalSegment`/
// `_mapAlignmentCantSegment` -- no unported dependency of any kind, no blocker.
//
// Real Python's leading underscore marks this as module-private -- NOT re-exported
// from `./index.ts`'s public barrel, matching every other `_map_*`/`_get_*` helper in
// this chunk.
//
// Real Python's final `else` branch reads `layout.RailHeadDistance` UNCONDITIONALLY,
// with no `layout.is_a("IfcAlignmentCant")` check at all (the `if`/`elif` above only
// distinguish `IfcAlignmentHorizontal`/`IfcAlignmentVertical`, so anything else --
// intended to mean "must be `IfcAlignmentCant`" -- falls through here). Ported the
// same way: a `layout` that is none of the 3 real layout classes would raise a real
// Python `AttributeError` reading `.RailHeadDistance`; this port's `.get(...)` throws
// the equivalent "entity instance ... has no attribute ..." `Error` for the same
// malformed input, so behavior parity holds without any extra guard needing to be
// invented here.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { _mapAlignmentCantSegment } from "./_mapAlignmentCantSegment";
import { _mapAlignmentHorizontalSegment } from "./_mapAlignmentHorizontalSegment";
import { _mapAlignmentVerticalSegment } from "./_mapAlignmentVerticalSegment";

/**
 * Maps an `IfcAlignmentSegment` to its corresponding `IfcCurveSegment`(s) in the
 * geometric representation (Python: `ifcopenshell.api.alignment
 * ._map_alignment_segment`). The mapping is done based on the layout type and
 * segment type.
 *
 * @param file The file.
 * @param layout The `IfcAlignmentHorizontal`/`IfcAlignmentVertical`/`IfcAlignmentCant`
 *   layout `segment` belongs to.
 * @param segment The `IfcAlignmentSegment` to map.
 * @returns A 2-tuple; the second element is `null` unless `segment` maps to a
 *   Helmert curve (2 `IfcCurveSegment`s).
 */
export function _mapAlignmentSegment(
	file: IfcFile,
	layout: EntityInstance,
	segment: EntityInstance,
): readonly [EntityInstance, EntityInstance | null] {
	if (layout.isA("IfcAlignmentHorizontal")) {
		return _mapAlignmentHorizontalSegment(file, segment);
	}
	if (layout.isA("IfcAlignmentVertical")) {
		return _mapAlignmentVerticalSegment(file, segment);
	}
	return _mapAlignmentCantSegment(file, segment, layout.get("RailHeadDistance") as number);
}
