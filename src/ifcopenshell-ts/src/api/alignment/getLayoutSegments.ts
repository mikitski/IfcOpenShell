// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/get_layout_segments.py` (src/ifcopenshell-python,
// 41 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 1 of many). No dependency of any kind, no blocker.
//
// Real Python's return type is `collections.abc.Sequence[entity_instance]` -- ported
// as `readonly EntityInstance[]`, matching `./getChildAlignments.ts`'s own identical
// convention.
import type { EntityInstance } from "../../entityInstance";

/**
 * Returns the `IfcAlignmentSegment`s nested to this alignment layout (Python:
 * `ifcopenshell.api.alignment.get_layout_segments`).
 *
 * @param layout The `IfcAlignmentHorizontal`/`IfcAlignmentVertical`/`IfcAlignmentCant`.
 * @returns The nested `IfcAlignmentSegment`s, in nesting order (possibly empty).
 *
 * @example
 * ```ts
 * const horizontal = file.byType("IfcAlignmentHorizontal")[0];
 * const segments = api.alignment.getLayoutSegments(horizontal);
 * ```
 */
export function getLayoutSegments(layout: EntityInstance): readonly EntityInstance[] {
	const segments: EntityInstance[] = [];
	for (const rel of layout.get("IsNestedBy") as EntityInstance[]) {
		for (const segment of rel.get("RelatedObjects") as EntityInstance[]) {
			if (segment.isA("IfcAlignmentSegment")) segments.push(segment);
		}
	}
	return segments;
}
