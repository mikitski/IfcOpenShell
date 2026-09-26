// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create_segment_representations.py`
// (src/ifcopenshell-python, 75 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 6 of many). PUBLIC (confirmed present in
// real Python's own `__init__.py` `__all__`), unlike the other 3 files landed in this
// chunk -- re-exported from `./index.ts`'s barrel. Depends on this module's own
// already-landed `getAxisSubcontext`/`getBasisCurve`/`getCurve` (all chunk 1) and
// already-landed `util.representation.getRepresentationsIter`/`util.element
// .getComponents` (`../../util/representation.ts`/`../../util/element.ts`, both
// verified directly against their real exported signatures before use) -- no blocker.
//
// --- A real, CONFIRMED, genuinely REACHABLE bug, preserved verbatim per this
// project's "preserve real Python bugs verbatim, disclose rather than silently fix"
// policy ---
//
// `curve`/`nested_alignment` are initialized to `None` before the `if`/`elif` chain
// (real Python lines 45-58) -- but there is NO `else` branch and NO `continue`. If a
// representation on the alignment matches NEITHER of the 2 expected shapes
// (`"Axis"`/`"Curve2D"` or `"FootPrint"`/`"Curve2D"`, or `"Axis"`/`"Curve3D"`), the
// loop falls straight through to `curve.Segments` (line 60) with `curve` still `None`
// -- a real Python `AttributeError: 'NoneType' object has no attribute 'Segments'`.
// This is genuinely REACHABLE, not just theoretical: any alignment with an ADDITIONAL
// representation the loop doesn't recognize (e.g. a `"Body"` representation, or any
// other `RepresentationIdentifier`/`RepresentationType` pair) triggers it on that
// representation's own loop iteration, even if the alignment ALSO has a
// perfectly-valid Axis/FootPrint representation elsewhere in the same
// `get_representations_iter` list.
//
// Ported the same way: `curve`/`nestedAlignment` are typed `EntityInstance | null`,
// left `null` when neither branch matches (no `else`/`continue` added), and the
// unguarded `curve.get("Segments")` read below is a plain, ungated `EntityInstance`
// method call on what may be `null` -- this port's exact equivalent throws
// `TypeError: Cannot read properties of null (reading 'get')` at the identical point,
// not a graceful `null`/empty-array fallback. Pinned by a dedicated regression test
// (an alignment with a "Body" representation alongside a valid "Axis"/"Curve2D" one).
//
// --- `next(c for c in get_components(alignment) if c.is_a(...))`, ported as a small
// local helper that throws (matching Python's own `StopIteration` for "no match"),
// per `../grid/createAxisCurve.ts`'s own established `findFirst`-style precedent ---
//
// Real Python's `next(...)` with no default raises `StopIteration` if no component of
// the expected class exists (a malformed/unexpected alignment shape, not expected in
// practice for either the "Axis"/"FootPrint" Curve2D branch, which expects an
// `IfcAlignmentHorizontal` component, or the "Axis" Curve3D branch, which expects an
// `IfcAlignmentVertical` component). This port throws a descriptive `Error` for the
// same case (matching this project's established "throw a clear, real error rather
// than silently propagate `undefined`" convention, not a verbatim `StopIteration`
// message, since JS has no equivalent built-in).
//
// `nested_alignment.IsNestedBy[0]` is another unconditional index-0 access with no
// filter on the relationship's own content, matching `./_getCantSegment.ts`'s own
// already-disclosed identical pattern -- ported the same way (no added guard).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { getComponents } from "../../util/element";
import { getRepresentationsIter } from "../../util/representation";
import { getAxisSubcontext } from "./getAxisSubcontext";
import { getBasisCurve } from "./getBasisCurve";
import { getCurve } from "./getCurve";

/** Python's `next(c for c in components if c.is_a(componentType))` -- throws
 * (matching Python's own `StopIteration`) if no component of `componentType` exists. */
function findComponent(components: readonly EntityInstance[], componentType: string): EntityInstance {
	for (const c of components) {
		if (c.isA(componentType)) return c;
	}
	throw new Error(
		`createSegmentRepresentations: no ${componentType} component found (real Python's own next(...) would raise StopIteration here).`,
	);
}

/**
 * Creates curve segment representations for the alignment for IFC CT 4.1.7.1.1.4
 * (Python: `ifcopenshell.api.alignment.create_segment_representations`).
 *
 * The alignment is expected to have representations for "Axis"/"Curve2D" (horizontal
 * only) or "FootPrint"/"Curve2D" and "Axis"/"Curve3D" (horizontal + vertical/cant).
 * There is the additional expectation that there is a 1-to-1 relationship between
 * `IfcAlignmentSegment` and `IfcCurveSegment` -- that is, no Helmert curves in the
 * alignment, which have a 1-to-2 relationship.
 *
 * @param file The model.
 * @param alignment The alignment to create segment representations for.
 * @throws {TypeError} If `alignment` is not an `IfcAlignment`.
 * @throws {TypeError} At the exact point real Python's own unguarded `curve.Segments`
 *   would raise `AttributeError` on `None`, for any representation matching neither
 *   expected shape -- see this file's own header comment.
 */
export function createSegmentRepresentations(file: IfcFile, alignment: EntityInstance): void {
	const expectedType = "IfcAlignment";
	if (!alignment.isA(expectedType)) {
		throw new TypeError(`Expected to see type '${expectedType}', instead received '${alignment.isA()}'.`);
	}

	const axisGeomSubcontext = getAxisSubcontext(file);
	const representations = getRepresentationsIter(alignment);
	for (const representation of representations) {
		let curve: EntityInstance | null = null;
		let nestedAlignment: EntityInstance | null = null;

		const identifier = representation.get("RepresentationIdentifier");
		const type = representation.get("RepresentationType");

		if ((identifier === "Axis" && type === "Curve2D") || (identifier === "FootPrint" && type === "Curve2D")) {
			curve = getBasisCurve(alignment);
			nestedAlignment = findComponent(getComponents(alignment), "IfcAlignmentHorizontal");
		} else if (identifier === "Axis" && type === "Curve3D") {
			curve = getCurve(alignment);
			nestedAlignment = findComponent(getComponents(alignment), "IfcAlignmentVertical");
		}
		// No `else`/`continue` here -- see this file's own header comment for the real,
		// verbatim-preserved Python bug this deliberately omitted guard reproduces.

		const curveSegments = (curve as EntityInstance).get("Segments") as EntityInstance[];
		const segments = ((nestedAlignment as EntityInstance).get("IsNestedBy") as EntityInstance[])[0].get(
			"RelatedObjects",
		) as EntityInstance[];

		const pairCount = Math.min(curveSegments.length, segments.length);
		for (let i = 0; i < pairCount; i++) {
			const curveSegment = curveSegments[i];
			const alignmentSegment = segments[i];

			const axisRepresentation = file.createEntity("IfcShapeRepresentation", axisGeomSubcontext, "Axis", "Segment", [
				curveSegment,
			]);
			const product = file.createEntity("IfcProductDefinitionShape", null, null, [axisRepresentation]);
			alignmentSegment.set("ObjectPlacement", alignment.get("ObjectPlacement"));
			alignmentSegment.set("Representation", product);
		}
	}
}
