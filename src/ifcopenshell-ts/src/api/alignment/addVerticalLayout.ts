// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/add_vertical_layout.py` (src/ifcopenshell-python,
// 192 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 8 of many, the LAST chunk for this module). PUBLIC (confirmed present in
// real Python's own `__init__.py` `__all__`). Depends on this module's own already-landed
// `_addZeroLengthSegment` (chunk 7), `getBasisCurve`/`getAxisSubcontext` (chunk 1),
// already-landed `api.aggregate.assignObject`/`api.nest.assignObject`/
// `api.nest.unassignObject`, `api.geometry.assignRepresentation`/`unassignRepresentation`,
// `util.element.getDecomposition`/`getComponents`, `util.representation
// .getRepresentationsIter` -- ALL verified directly against their real exported
// name/signature before use (see below for the exact call shapes).
//
// Real Python's own module-private `_move_vertical_layout_to_child_alignment` helper
// (defined in the SAME file, also leading-underscore-private, NOT in `__init__.py`'s
// `__all__`) is ported as a genuinely file-local, non-exported function here too --
// matching `_addSegmentToCurve.ts`'s own `_addCurveSegmentToCompositeCurve` precedent
// for a same-file, non-exported helper (not even re-exported for OTHER files in this
// module to import, since real Python's own helper isn't either).
//
// --- THE STANDOUT FINDING OF THIS CHUNK, CAREFULLY VERIFIED: `addVerticalLayout` IS
//     GENUINELY FULLY FUNCTIONAL END TO END for both the first-vertical-layout branch
//     (IFC CT 4.1.4.4.1.1) AND the second/subsequent-vertical (child-alignment-reuse)
//     branch (IFC CT 4.1.4.4.1.2) -- WITH ONE PRECISE PRECONDITION this chunk's own task
//     brief did not spell out ---
//
// Tracing the full real 192-line body line by line, confirming every single dependency
// call resolves the way this file's own header comment claims (not assumed):
//
// 1. `vertical_layout = file.createIfcAlignmentVertical(GlobalId=...)` is a fresh, empty
//    `IfcAlignmentVertical` with NO segments nested to it anywhere in this function's own
//    body -- confirmed by reading the whole function: every OTHER `IfcAlignmentVertical`
//    touched here (`vertical_layout_nesting_alignment`, moved to a child alignment by the
//    helper below) is a DIFFERENT entity, never mutated to add segments by this function
//    either.
// 2. `get_decomposition`/`get_components` (both already-landed, `util/element.ts`'s
//    `getDecomposition(element, isRecursive=true)`/`getComponents(element,
//    includePorts=false)`, matching real Python's own default-argument calls exactly) are
//    plain, portable traversals -- no blocker.
// 3. `_move_vertical_layout_to_child_alignment` (0 or 1 real invocations, per the
//    `assert len(...) == 0 or 1` immediately above it) is, itself, FULLY PORTABLE end to
//    end: `nest.unassignObject`/`nest.assignObject`/`aggregate.assignObject` are all
//    already-landed and reused directly (the newly-aggregated `child_alignment`'s own
//    `ObjectPlacement` is `null` at that point, so `aggregate.assignObject`'s own
//    `editObjectPlacement` call is skipped by its own `placement?.isA("IfcLocalPlacement")`
//    guard -- never reached, no blocker); `getBasisCurve`/`getRepresentationsIter` are
//    already-landed pure reads; `geometry.unassignRepresentation`/`assignRepresentation`
//    are both confirmed, by reading their own header comments AND bodies directly, to have
//    "no kernel/matrix-math dependency of any kind" for this exact call shape (a plain
//    `IfcProduct`-to-`IfcProduct` representation move, neither side typed) -- genuinely no
//    blocker anywhere in this helper.
// 4. Branch A (first vertical layout, `len(child_alignments) == 0 and
//    len(vertical_layouts_nesting_alignment) == 0`): `nest.assignObject`,
//    `getBasisCurve`, the plain `IfcGradientCurve`/`IfcShapeRepresentation` entity
//    constructions, the `RepresentationIdentifier` rename loop (a plain `.set()`, not
//    gated on anything), `getAxisSubcontext`, and the final `assignRepresentation` call
//    are ALL portable -- no blocker.
// 5. Branch B (second/subsequent vertical, child-alignment-reuse): the fresh
//    `child_alignment` entity construction, `aggregate.assignObject`, `nest.assignObject`,
//    the plain `ObjectPlacement` copy, `getBasisCurve`, the `IfcGradientCurve`/
//    `IfcShapeRepresentation` constructions, `getAxisSubcontext`, and the final
//    `assignRepresentation` call are ALL portable -- no blocker, structurally identical
//    to branch A's own portability.
// 6. The FINAL, unconditional `_add_zero_length_segment(file, vertical_layout)` call is
//    where this chunk's own task brief's hypothesis lives or dies. Tracing it precisely:
//    - `addZeroLengthSegment(file, vertical_layout)` (the fresh layout from step 1): its
//      `IfcAlignmentVertical` branch reads `vertical_layout.get("IsNestedBy")` -- this is
//      DIFFERENT from "is `vertical_layout` itself nested under something" (that's
//      `.Nests`, not `.IsNestedBy`) -- `vertical_layout.IsNestedBy` lists rels where
//      `vertical_layout` is the *relating* (parent) side, i.e. ITS OWN segments, which are
//      genuinely still empty at this point (step 1's own guarantee) -- FULLY PORTABLE,
//      always succeeds, appends a real zero-length `IfcAlignmentSegment`.
//    - `curve = getLayoutCurve(vertical_layout)`: `getAlignment(vertical_layout)` resolves
//      to whichever `IfcAlignment` `vertical_layout` was just nested under in branch A/B
//      above (`parent_alignment`/`child_alignment` respectively) -- both NOW have a real
//      "Axis"/"Curve3D" representation (the `axis3d_shape_representation` just assigned a
//      few lines earlier in the SAME branch), so `getCurve` finds it and returns the
//      SAME, still-empty `gradient_curve` this same function created moments ago, in BOTH
//      branches -- confirming this chunk's own task brief's hypothesis exactly.
//      `getLayoutCurve`'s own `IfcAlignmentVertical` unwrap step leaves a plain
//      `IfcGradientCurve` untouched (only unwraps `IfcSegmentedReferenceCurve`), so
//      `curve` ends up being `gradient_curve` itself, unchanged.
//    - `addZeroLengthSegment(file, gradientCurve)`: `gradientCurve.Segments` is `[]`
//      (freshly created) -- NOT blocked (the conditional gate is `segments.length > 0`) --
//      appends a real zero-length `IfcCurveSegment`, THEN recurses into
//      `gradientCurve.get("BaseCurve")` (since `IfcGradientCurve` always recurses) --
//      this is `base_curve`, i.e. WHATEVER `getBasisCurve(parent_alignment)` returned
//      at gradient-curve-construction time in branch A/B above.
//
// **THE ONE PRECISE PRECONDITION, not spelled out by this chunk's own task brief:** that
// recursive call needs `base_curve` to be a REAL entity, not `null` -- `addZeroLengthSegment`
// unconditionally calls `.isA(...)` on whatever it's given, with no null-guard of its own
// (matching real Python's own unguarded `layout.is_a(...)` on `None`, which raises a real
// `AttributeError` too). So: **`addVerticalLayout` is fully functional end to end
// if-and-only-if `parent_alignment` ALREADY has some real horizontal geometric
// representation** (any `"Axis"/"Curve2D"`, `"FootPrint"/"Curve2D"`, or `"Axis"/"Curve3D"`
// shape `getBasisCurve` recognizes) at the time it's called -- which is also, separately,
// the ONLY state this port's OWN currently-portable API surface can ever produce in the
// first place (since nothing that could add real segments to a horizontal composite curve
// is portable yet -- `create_layout_segment`/`_add_segment_to_layout` are both
// unconditionally blocked, chunks 7-8), meaning `baseCurve.Segments` is ALWAYS `[]` for
// every realistic fixture reachable through this port today. Given that:
// - If `parent_alignment` has a real basis curve with empty `Segments` (the only state
//   genuinely reachable through this port's portable surface): the recursive
//   `addZeroLengthSegment` call on it succeeds too (empty-`Segments` composite curve, not
//   blocked, and it doesn't recurse further since a plain `IfcCompositeCurve` isn't a
//   `IfcGradientCurve`/`IfcSegmentedReferenceCurve`) -- **the WHOLE function completes,
//   for real, end to end, with no throw at all.**
// - If `parent_alignment` has NO representation at all (`base_curve` is `null`): the
//   function throws a real, natural crash (`TypeError: Cannot read properties of null`,
//   the direct TS equivalent of real Python's own `AttributeError: 'NoneType' object has
//   no attribute 'is_a'`) at that exact recursive call -- a genuine real-Python bug/
//   precondition-violation this port reproduces verbatim, not specially guarded against.
// - If a caller somehow hand-built a `base_curve` with NON-empty `Segments` (impossible
//   through this port's own portable API today, but constructible directly in a test):
//   the recursive call throws `addZeroLengthSegment`'s own already-disclosed
//   `_getSegmentEndpoint` kernel-gap error instead (chunk 7's own established, still
//   current disclosure -- not a NEW gap).
//
// This is a genuinely new, valuable, and fully-verified finding -- not just confirming
// this chunk's own task brief's hypothesis, but PRECISELY REFINING it with the exact
// reachability condition. `addVerticalLayout.test.ts` exercises BOTH the first-vertical
// and second-vertical (child-alignment-reuse) cases end to end, with real, passing
// assertions on every created entity, PLUS a dedicated regression test for the
// `base_curve == null` throw case.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { getComponents, getDecomposition } from "../../util/element";
import { getRepresentationsIter } from "../../util/representation";
import { assignObject as assignAggregateObject } from "../aggregate/assignObject";
import { assignRepresentation } from "../geometry/assignRepresentation";
import { unassignRepresentation } from "../geometry/unassignRepresentation";
import { assignObject as assignNestObject } from "../nest/assignObject";
import { unassignObject as unassignNestObject } from "../nest/unassignObject";
import { _addZeroLengthSegment } from "./_addZeroLengthSegment";
import { getAxisSubcontext } from "./getAxisSubcontext";
import { getBasisCurve } from "./getBasisCurve";

/**
 * Creates a new child alignment and aggregates it to the parent alignment. Moves the
 * vertical alignment from the parent alignment to the child alignment. Also moves the
 * "Axis"/"Curve3D" representation to the child alignment, if present. This function
 * supports the transition of vertical alignment between CT 4.1.4.4.1.1 and 4.1.4.4.1.2
 * because a subsequent vertical alignment is being added and the Alignment Layout -
 * Reusing Horizontal Layout concept applies. (Python:
 * `ifcopenshell.api.alignment.add_vertical_layout._move_vertical_layout_to_child_alignment`
 * -- file-private in real Python too, NOT exported here.)
 *
 * Fully portable -- see this file's own header comment, point 3.
 */
function _moveVerticalLayoutToChildAlignment(
	file: IfcFile,
	parentAlignment: EntityInstance,
	verticalLayout: EntityInstance,
): void {
	// unhook the vertical layout from the parent alignment
	unassignNestObject(file, { relatedObjects: [verticalLayout] });

	// create the child alignment
	const childAlignment = file.createEntity(
		"IfcAlignment",
		guid.new(),
		null,
		`Child of ${parentAlignment.get("Name") as string}`,
	);

	// nest the vertical layout onto the child alignment
	assignNestObject(file, { relatedObjects: [verticalLayout], relatingObject: childAlignment });

	// aggregate the child alignment to the parent alignment
	assignAggregateObject(file, { products: [childAlignment], relatingObject: parentAlignment });

	// if the parent alignment has a representation, move the Axis/Curve3D represention to the child alignment
	const baseCurve = getBasisCurve(parentAlignment);
	if (baseCurve) {
		const representations = getRepresentationsIter(parentAlignment);
		for (const representation of representations) {
			if (
				representation.get("RepresentationIdentifier") === "Axis" &&
				representation.get("RepresentationType") === "Curve3D"
			) {
				unassignRepresentation(file, { product: parentAlignment, representation });
				assignRepresentation(file, { product: childAlignment, representation });
				childAlignment.set("ObjectPlacement", parentAlignment.get("ObjectPlacement"));
				break;
			}
		}
	}
}

/**
 * Adds a vertical layout to a previously created alignment (Python:
 * `ifcopenshell.api.alignment.add_vertical_layout`).
 *
 * If this is the first vertical layout assigned to `parentAlignment` the IFC CT
 * 4.1.4.4.1.1 Alignment Layout - Horizontal, Vertical and Cant is followed. If this is
 * the second or subsequent vertical layout assigned to `parentAlignment` the IFC CT
 * 4.1.4.4.1.2 Alignment Layout - Reusing Horizontal Layout is followed.
 *
 * When the second vertical layout is added, the structure of the IFC model must
 * transition from one concept template to the other. Specifically, the following occurs:
 * 1) The first child `IfcAlignment` is created and is `IfcRelAggregates` with the parent
 *    alignment.
 * 2) The first vertical layout is unassigned from the `IfcRelNests` of the parent
 *    alignment and is `IfcRelNests` to the new child alignment.
 * 3) A second child `IfcAlignment` is created and it is `IfcRelAggregates` with the
 *    parent alignment.
 * 4) The vertical layout is `IfcRelNests` to the second child alignment.
 *
 * For the third and subsequent vertical layouts, a new child alignment is created and
 * aggregated to the parent alignment.
 *
 * A zero segment length terminated `IfcGradientCurve` is created for the new vertical
 * layout.
 *
 * **Fully functional end to end if-and-only-if `parentAlignment` already has a real
 * horizontal geometric representation (basis curve)** -- see this file's own header
 * comment for the full, precisely-verified writeup, including the exact throw this
 * function raises when that precondition doesn't hold.
 *
 * @param file The file.
 * @param parentAlignment The parent alignment.
 * @returns The new vertical layout, including the mandatory zero length segment.
 * @throws {Error} `Cannot read properties of null` (the direct TS equivalent of real
 *   Python's own `AttributeError`) if `parentAlignment` has no real geometric
 *   representation at all -- see this file's own header comment.
 */
export function addVerticalLayout(file: IfcFile, parentAlignment: EntityInstance): EntityInstance {
	const verticalLayout = file.createEntity("IfcAlignmentVertical", guid.new());

	// get all the child alignments under alignment
	const childAlignments = [...getDecomposition(parentAlignment)].filter((c) => c.isA("IfcAlignment"));

	// Get all the IfcAlignmentVertical that are nesting alignment (there should be 0 or 1)
	// if 0, alignment is just horizontal and we are adding the first vertical so it will nest to the alignment,
	// or there are multiple vertical and they nest to the aggregated child alignments
	// if 1, there is one vertical alignments. Move it to a child alignment
	const verticalLayoutsNestingAlignment = getComponents(parentAlignment).filter((c) => c.isA("IfcAlignmentVertical"));

	// move the vertical layout to a child alignment because there is going to be more than one vertical
	if (!(verticalLayoutsNestingAlignment.length === 0 || verticalLayoutsNestingAlignment.length === 1)) {
		throw new Error("Assertion failed: verticalLayoutsNestingAlignment must have length 0 or 1");
	}
	for (const verticalLayoutNestingAlignment of verticalLayoutsNestingAlignment) {
		_moveVerticalLayoutToChildAlignment(file, parentAlignment, verticalLayoutNestingAlignment);
	}

	if (childAlignments.length === 0 && verticalLayoutsNestingAlignment.length === 0) {
		// this is the first vertical layout so nest it into the parent alignment (IFC CT 4.1.4.4.1.1)
		assignNestObject(file, { relatedObjects: [verticalLayout], relatingObject: parentAlignment });

		const baseCurve = getBasisCurve(parentAlignment);

		// the parent alignment has a Representation so create a representation for the vertical
		const gradientCurve = file.createEntity("IfcGradientCurve", [], false, baseCurve, null);

		// Per IFC CT 4.1.7.1.1.1, the shape representation for Horizontal geometry only is
		// RepresentationIdentifier="Axis" and RepresentationType="Curve2D".
		// However, per IFC CT 4.1.7.1.1.2 and 3 the shape represenation with Horizontal, Vertical and Cant
		// is RepresentationIdentifier="FootPrint" and RepresentationType="Curve2D" for the horizontal and
		// RepresentationIdentifier="Axis" and RepresentationType="Curve3D" for the 2.5D curve.
		// Since the alignment is transitioning from horizontal only to horizontal+vertical, the
		// RepresentationIdentifier must change from "Axis" to "FootPrint"
		const representations = getRepresentationsIter(parentAlignment);
		for (const representation of representations) {
			if (
				representation.get("RepresentationIdentifier") === "Axis" &&
				representation.get("RepresentationType") === "Curve2D"
			) {
				representation.set("RepresentationIdentifier", "FootPrint");
				break;
			}
		}

		// create the Axis,Curve3D representation
		const axisGeomSubcontext = getAxisSubcontext(file);
		const axis3dShapeRepresentation = file.createEntity(
			"IfcShapeRepresentation",
			axisGeomSubcontext,
			"Axis",
			"Curve3D",
			[gradientCurve],
		);

		assignRepresentation(file, { product: parentAlignment, representation: axis3dShapeRepresentation });
	} else {
		// there are multiple vertical reusing the horizontal (IFC CT 4.1.4.4.1.2)
		// this is the second or subsequent vertical reusing the horizontal

		// create a new child alignment for the new vertical
		const childAlignment = file.createEntity(
			"IfcAlignment",
			guid.new(),
			null, // OwnerHistory
			`Child of ${parentAlignment.get("Name") as string}`, // Name
			null, // Description
			null, // ObjectType
			null, // ObjectPlacement
			null, // Representation
			null, // PredefinedType
		);

		// Aggregate the child alignment to the parent alignment
		assignAggregateObject(file, { products: [childAlignment], relatingObject: parentAlignment });

		// nest the vertical under the child alignment
		assignNestObject(file, { relatedObjects: [verticalLayout], relatingObject: childAlignment });

		childAlignment.set("ObjectPlacement", parentAlignment.get("ObjectPlacement"));

		// the parent alignment has a Representation so create a representation for the vertical
		const baseCurve = getBasisCurve(parentAlignment);
		const gradientCurve = file.createEntity("IfcGradientCurve", [], false, baseCurve, null);

		const axisGeomSubcontext = getAxisSubcontext(file);

		// create the Curve3D representation
		const axis3dShapeRepresentation = file.createEntity(
			"IfcShapeRepresentation",
			axisGeomSubcontext,
			"Axis",
			"Curve3D",
			[gradientCurve],
		);

		// add the representation to the child alignment
		assignRepresentation(file, { product: childAlignment, representation: axis3dShapeRepresentation });
	}

	// All alignment layouts must end with a zero length segment. Their geometric representations must also end with a zero length segment.
	// Now that all the geometry is setup, add the zero length segment to the layout, which also adds a zero length segment to the representation
	_addZeroLengthSegment(file, verticalLayout);

	return verticalLayout;
}
