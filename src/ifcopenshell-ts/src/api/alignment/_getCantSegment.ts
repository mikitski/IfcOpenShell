// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/_get_cant_segment.py` (src/ifcopenshell-python,
// 73 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 3 of many). Depends on this module's own already-landed `getAlignment`
// (chunk 1) -- no blocker.
//
// Real Python's leading underscore marks this as module-private (absent from
// `__init__.py`'s own `__all__` -- see `./_sortNest.ts`'s own header comment for the
// same convention) -- NOT re-exported from `./index.ts`'s public barrel; a future
// chunk (`_map_alignment_cant_segment`, per real Python's own
// `from ifcopenshell.api.alignment._get_cant_segment import _get_cant_segment`) will
// import it directly by relative path.
//
// --- Real Python quirks, all preserved verbatim ---
//
// 1. **Every `Nests[0]`/`IsNestedBy[0]`/`IsDecomposedBy[0]` access below is an
//    UNCONDITIONAL index-0 access, with no filter on the relationship's own
//    content** -- matching `getMappedSegments.ts`'s own already-disclosed identical
//    quirk (chunk 2). A `horizontal_segment`/`horizontal_layout`/`alignment`/
//    `child_alignment` with more than one such relationship (not expected in this
//    module's own real usage) would silently pick the wrong one.
// 2. **`segment == horizontal_segment` is real Python's `entity_instance.__eq__`
//    (same underlying STEP entity, not JS reference identity)** -- ported via
//    `EntityInstance.equals()`, matching `getMappedSegments.ts`'s own identical
//    `seg.equals(layoutSegment)` precedent (a fresh JS wrapper is handed out per
//    accessor call in this port, so `===` would be wrong here).
// 3. **The final `layout.IsNestedBy[0].RelatedObjects[index]` array access is
//    UNGUARDED** -- if `index` is out of range for the found cant layout's own
//    segment list (a real Python `IndexError`, crashing before `cant_segment` is ever
//    assigned), this port's plain array indexing instead silently produces
//    `undefined`, which then fails the caller's `!= null`/truthy checks the same way
//    `null` would -- a real, disclosed divergence purely from JS's own non-throwing
//    out-of-range array access (same category already disclosed for
//    `getMappedSegments.ts`'s own quirk 3), not something independently
//    special-cased here.
// 4. **`ifcopenshell.api.alignment.get_alignment(horizontal_layout)` is called with no
//    `None`-guard on its result** -- `alignment.IsDecomposedBy` would raise a real
//    Python `AttributeError` if `get_alignment` returned `None`; ported the same way
//    `getLayoutCurve.ts`'s own header comment already establishes for an identical
//    unguarded `getAlignment(...)` call (a non-null assertion, so a malformed-input
//    call fails the same way real Python's own does: a runtime crash, not a graceful
//    `null`).
// 5. **A likely real, PRE-EXISTING upstream bug found while writing this file's own
//    test suite**: the CT 4.1.4.4.1.2 fallback reads `child_alignment.Nests[0]
//    .RelatedObjects` -- i.e. the `IfcRelNests` where `child_alignment` ITSELF is a
//    `RelatedObject` (a sibling lookup, the exact same shape as this file's own
//    `horizontal_layout.Nests[0]` a few lines above, where `horizontal_layout` is
//    nested UNDER the alignment alongside its own cant-layout sibling). But
//    `add_vertical_layout.py` (the one real file in this module confirmed, by
//    reading it directly, to actually CREATE a `child_alignment`) never nests
//    `child_alignment` itself as a `RelatedObject` anywhere -- it only
//    `ifcopenshell.api.aggregate.assign_object`s it (`IfcRelAggregates`, not
//    `IfcRelNests`) and then uses `child_alignment` as the RELATING object of its own
//    `IfcRelNests` (nesting `vertical_layout` -- and, presumably, an eventual cant
//    layout -- TO it, i.e. `child_alignment.IsNestedBy`, not `child_alignment.Nests`).
//    For every `child_alignment` shaped the way real Python's own real construction
//    code actually builds one, `child_alignment.Nests` is therefore an EMPTY array,
//    so `child_alignment.Nests[0]` is `undefined` and `.RelatedObjects` throws --
//    meaning this whole fallback branch appears to be DEAD/BROKEN in practice, not
//    just theoretically quirky. Ported verbatim (`child_alignment.get("Nests")`, not
//    silently "corrected" to `"IsNestedBy"`) per this project's own "preserve real
//    quirks/bugs verbatim, disclose rather than silently fix" policy -- confirming
//    which reading is actually intended would need real upstream clarification, not a
//    guess made unilaterally by this port. Pinned by a dedicated regression test
//    (`_getCantSegment.test.ts`, "CT 4.1.4.4.1.2 ... crashes with a REALISTIC
//    add_vertical_layout-shaped child alignment") using the exact `child_alignment`
//    shape `add_vertical_layout.py` itself produces.
import type { EntityInstance } from "../../entityInstance";
import { getAlignment } from "./getAlignment";

/**
 * Returns the `IfcAlignmentSegment` from the cant layout that corresponds to
 * `horizontalSegment` (Python: `ifcopenshell.api.alignment._get_cant_segment`).
 * Returns `null` (or, per this file's own header comment quirk 3, `undefined` for an
 * out-of-range index) if the cant segment cannot be found.
 *
 * @param horizontalSegment The `IfcAlignmentSegment` from the horizontal layout.
 * @returns The corresponding cant `IfcAlignmentSegment`, or `null`/`undefined` if none
 *   is found.
 * @throws {TypeError} If `horizontalSegment` is not an `IfcAlignmentSegment`, or its
 *   `DesignParameters` is not an `IfcAlignmentHorizontalSegment`.
 */
export function _getCantSegment(horizontalSegment: EntityInstance): EntityInstance | null {
	const expectedType = "IfcAlignmentSegment";
	if (!horizontalSegment.isA(expectedType)) {
		throw new TypeError(`Expected ${expectedType} but got ${horizontalSegment.isA()}`);
	}

	const horizontalDesignParameters = horizontalSegment.get("DesignParameters") as EntityInstance;
	if (!horizontalDesignParameters.isA("IfcAlignmentHorizontalSegment")) {
		throw new TypeError(
			`Expect DesignParameter to be IfcAlignmentHorizontal but got ${horizontalDesignParameters.isA()}`,
		);
	}

	// Get the index of horizontal_segment in the horizontal_layout.
	const horizontalLayout = (horizontalSegment.get("Nests") as EntityInstance[])[0].get(
		"RelatingObject",
	) as EntityInstance;
	let index = 0;
	for (const segment of (horizontalLayout.get("IsNestedBy") as EntityInstance[])[0].get(
		"RelatedObjects",
	) as EntityInstance[]) {
		if (segment.equals(horizontalSegment)) break;
		index += 1;
	}

	let cantSegment: EntityInstance | null = null;

	// First check CT 4.1.4.4.1.1 Alignment Layout - Horizontal, Vertical and Cant.
	const nestsLayouts = (horizontalLayout.get("Nests") as EntityInstance[])[0];
	for (const layout of nestsLayouts.get("RelatedObjects") as EntityInstance[]) {
		if (layout.isA("IfcAlignmentCant")) {
			cantSegment = ((layout.get("IsNestedBy") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[])[
				index
			];
			break;
		}
	}

	// If a cant_segment wasn't found, check CT 4.1.4.4.1.2 Alignment Layout - Reusing
	// Horizontal Layout. Note that nothing forbids multiple child alignments from
	// having cant layouts. However, this would not make sense for Viennese Bend
	// because the Viennese Bend cant segment influences the geometry of the
	// horizontal Viennese Bend transition curve segment. The horizontal geometry
	// would not be unique if there are multiple child alignments with cant layouts.
	// For this reason, use the first cant layout found.
	if (cantSegment == null) {
		const alignment = getAlignment(horizontalLayout) as EntityInstance;
		for (const childAlignment of (alignment.get("IsDecomposedBy") as EntityInstance[])[0].get(
			"RelatedObjects",
		) as EntityInstance[]) {
			for (const layout of (childAlignment.get("Nests") as EntityInstance[])[0].get(
				"RelatedObjects",
			) as EntityInstance[]) {
				if (layout.isA("IfcAlignmentCant")) {
					cantSegment = ((layout.get("IsNestedBy") as EntityInstance[])[0].get("RelatedObjects") as EntityInstance[])[
						index
					];
					break;
				}
			}
			if (cantSegment) break;
		}
	}

	return cantSegment;
}
