// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/update_alignment_parameter_segment_tags.py`
// (src/ifcopenshell-python, 108 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 4 of many). Depends on this module's own
// already-landed `getAlignment`/`getLayoutSegments`/`hasZeroLengthSegment`/
// `getAlignmentStartStation` (chunk 1/2) and this chunk's own `_getKeyPointTag`/
// `_getSegmentStartPointLabel` -- no blocker of any kind.
//
// **Fully portable -- confirmed by reading the real source in full.** Unlike
// `./updateKeyPointReferents.ts`, this function creates NO `IfcReferent`/`IfcRelNests`
// and calls neither `api.pset.addPset` nor `api.pset.editPset` at all -- it only
// mutates `StartTag`/`EndTag`, both confirmed (directly against `ifc4x3.d.ts`) to be
// plain `string | null` attributes on `IfcAlignmentParameterSegment` -- i.e. an
// ordinary `IfcLabel`-typed attribute on an ALREADY-REAL entity, NOT a SELECT-typed
// attribute needing a freshly-constructed standalone wrapper value. Confirmed by this
// module's own already-established "assigning a raw JS value directly to an
// already-real entity's own attribute works fine" technique (`./index.ts`'s own
// header comment, chunk 2's finding) applies here too -- a plain `.set("StartTag",
// tag)` call is unaffected by the `EntityInstance.setByIndex`/`IfcFile.createEntity`
// gap this chunk's other 3 new files are blocked by (that gap is specifically about
// constructing a NEW standalone simple/defined-type instance BY NAME to disambiguate
// a SELECT-typed attribute; `StartTag`/`EndTag` have no such SELECT indirection at
// all). Every branch of this file gets full, real, passing test coverage.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { _getKeyPointTag } from "./_getKeyPointTag";
import { _getSegmentStartPointLabel } from "./_getSegmentStartPointLabel";
import { getAlignment } from "./getAlignment";
import { getAlignmentStartStation } from "./getAlignmentStartStation";
import { getLayoutSegments } from "./getLayoutSegments";
import { hasZeroLengthSegment } from "./hasZeroLengthSegment";

/** Python's `f"{[_ for _ in expected_types]}"` -- `repr()` of a list of strings (single-quoted elements, `", "`-joined). Matches `hasZeroLengthSegment.ts`'s/`nameSegments.ts`'s/`updateEndPoint.ts`'s/`_getSegmentStartPointLabel.ts`'s/`updateKeyPointReferents.ts`'s own identical, deliberately-duplicated-per-file helper. */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

const EXPECTED_LAYOUT_TYPES = ["IfcAlignmentHorizontal", "IfcAlignmentVertical", "IfcAlignmentCant"];

/**
 * Sets `IfcAlignmentParameterSegment.StartTag` (and, optionally, `EndTag`) for every
 * segment transition in an alignment layout (Python:
 * `ifcopenshell.api.alignment.update_alignment_parameter_segment_tags`). Unlike
 * `updateKeyPointReferents`, this does not create any `IfcReferent` or `IfcRelNests`
 * -- it only mutates the `StartTag`/`EndTag` string attributes already present on
 * each segment's `DesignParameters`.
 *
 * Every real segment's `StartTag` is set to a computed tag describing the point where
 * it begins, using the same label-and-station format as `updateKeyPointReferents`'
 * `Name` minus the alignment name (via `_getKeyPointTag`), e.g. `"145+98.32 (P.C.)"`.
 * The first segment's `StartTag` comes from the "Beginning of Alignment" boundary
 * label.
 *
 * `EndTag` is left untouched unless `labelEndTag` is `true`. When enabled, for each
 * transition between two consecutive segments, the outgoing segment's `EndTag` is set
 * to the same tag as the incoming segment's `StartTag` (they describe the same
 * physical point), and the last segment's `EndTag` is set from the "End of Alignment"
 * boundary label.
 *
 * Labels come from `_getSegmentStartPointLabel` -- if a callback has been registered
 * via `registerReferentNameCallback()`, its output is used instead of the built-in
 * labels, exactly as in `updateKeyPointReferents`.
 *
 * @param file The file.
 * @param layout `IfcAlignmentHorizontal`, `IfcAlignmentVertical`, or
 *   `IfcAlignmentCant`.
 * @param labelEndTag If `true`, also sets `EndTag` on every real segment. If `false`
 *   (default), `EndTag` is left untouched.
 * @returns Nothing -- this function mutates `segment.DesignParameters.StartTag`/
 *   `EndTag` in place.
 *
 * @example
 * ```ts
 * const horizontal = api.alignment.getHorizontalLayout(alignment);
 * api.alignment.updateAlignmentParameterSegmentTags(model, horizontal);
 * ```
 */
export function updateAlignmentParameterSegmentTags(file: IfcFile, layout: EntityInstance, labelEndTag = false): void {
	if (!EXPECTED_LAYOUT_TYPES.includes(layout.isA())) {
		throw new TypeError(
			`Expected entity type to be one of ${pythonListRepr(EXPECTED_LAYOUT_TYPES)}, instead received ${layout.isA()}`,
		);
	}

	const alignment = getAlignment(layout);
	if (alignment === null) {
		throw new Error(`${layout.isA()} #${layout.id()} is not nested under an IfcAlignment.`);
	}

	let segments = [...getLayoutSegments(layout)];
	if (segments.length > 0 && hasZeroLengthSegment(layout)) {
		segments = segments.slice(0, -1);
	}

	if (segments.length === 0) {
		return;
	}

	const startStation = getAlignmentStartStation(file, alignment) as number;
	const isHorizontal = layout.isA("IfcAlignmentHorizontal");

	let distanceAlong = 0.0;
	let prevSegment: EntityInstance | null = null;
	for (const segment of segments) {
		const dp = segment.get("DesignParameters") as EntityInstance;
		const segDistanceAlong = isHorizontal ? distanceAlong : (dp.get("StartDistAlong") as number);

		const label = _getSegmentStartPointLabel(prevSegment, segment);
		const station = startStation + segDistanceAlong;
		const tag = _getKeyPointTag(file, label, station);

		dp.set("StartTag", tag);
		if (prevSegment !== null && labelEndTag) {
			(prevSegment.get("DesignParameters") as EntityInstance).set("EndTag", tag);
		}

		if (isHorizontal) {
			distanceAlong += dp.get("SegmentLength") as number;
		} else {
			distanceAlong = (dp.get("StartDistAlong") as number) + (dp.get("HorizontalLength") as number);
		}

		prevSegment = segment;
	}

	if (labelEndTag) {
		const label = _getSegmentStartPointLabel(prevSegment, null);
		const station = startStation + distanceAlong;
		((prevSegment as EntityInstance).get("DesignParameters") as EntityInstance).set(
			"EndTag",
			_getKeyPointTag(file, label, station),
		);
	}
}
