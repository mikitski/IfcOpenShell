// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/update_key_point_referents.py`
// (src/ifcopenshell-python, 233 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 4 of many). Depends on this module's own
// already-landed `getAlignment`/`getLayoutSegments`/`hasZeroLengthSegment`/
// `getAlignmentStartStation`/`getLayoutCurve` (chunk 1/2), `_getKeyPointTag`/
// `_sortNest`/`updateFallbackPosition` (chunk 3), this chunk's own
// `_getSegmentStartPointLabel` (`./_getSegmentStartPointLabel.ts`), plus already-landed
// `api.pset.addPset`/`editPset`/`removePset`, `guid.new`, and
// `util.element.getPset`/`removeDeep2` (both verified against their real exported
// names/signatures in `../../util/element.ts` before use). Real Python's own
// `get_horizontal_layout` is NOT used by this file at all -- confirmed by reading the
// full real source, not assumed (`layout` is passed IN by the caller; this file only
// ever reads FROM it, never looks it up itself).
//
// Real Python's own private `_remove_referent`/`_create_key_point_referent` helpers
// live in this SAME file (not a separate underscore-prefixed module file the way
// `_sortNest.py`/`_get_key_point_tag.py`/`_get_segment_start_point_label.py` each are)
// -- ported here as ordinary, non-exported local functions (`removeReferent`/
// `createKeyPointReferent`), matching this project's own established naming for a
// same-file-scoped private helper (e.g. `editPset.ts`'s own `tryPurge`/
// `castValueToPrimaryMeasureType`) rather than the leading-underscore-export
// convention this module reserves for a Python helper that genuinely lives in its
// OWN separate module file.
//
// --- `file.get_inverse`/`file.get_total_inverses` (real Python) -- confirmed to
// already exist on this port's own `IfcFile`, not assumed ---
//
// `removeReferent`'s own `clear=true` code path (the ONE branch of this whole file
// that is NOT blocked by the disclosed gap below -- see that section) needs
// `file.get_inverse(referent)` (real Python: `file_mixin.get_inverse`) and
// `file.get_total_inverses(object_placement)` (real Python:
// `file_mixin.get_total_inverses`) -- both confirmed, by reading `../../file.ts`
// directly, to already exist as `IfcFile.getInverse`/`IfcFile.getTotalInverses`
// (`../pset/removePset.ts`'s own `_remove_referent`-shaped cleanup logic already
// established the exact same `getInverse(...)  as Set<EntityInstance>` /
// `getTotalInverses(...) === 1` usage pattern this file reuses). NOT a new blocker --
// investigated directly per this chunk's own task brief, not assumed either way.
//
// *** TWO INDEPENDENT, ALREADY-DISCLOSED primitive-layer gaps block every REFERENT-
// CREATING code path in this file -- see `./addPositioningReferent.ts`'s own header
// comment for the full writeup of both (gap 1: `IfcPointByDistanceExpression
// .DistanceAlong`'s standalone-`IfcLengthMeasure` construction, hit by
// `createKeyPointReferent`'s own composite-curve branch; gap 2: `editPset`'s own
// separate, pre-existing "cannot create a brand-new plain-scalar property" gap, hit
// by `createKeyPointReferent`'s own `{Station: station}` `editPset` call in EVERY
// branch -- confirmed empirically for this file's own call shape before writing it,
// not assumed from `addPositioningReferent.ts` alone). Every REAL segment therefore
// throws building its own key-point referent, at whichever of the two gaps its own
// `curve` shape hits first (gap 1 for a real, non-empty `IfcCompositeCurve`; gap 2
// otherwise) -- reached on the very FIRST loop iteration when `layout` has at least
// one real segment. ***
//
// --- What remains FULLY PORTABLE and independently testable despite the above ---
//
// - The `layout`/`rel_nests`/`layout_alignment` validation (`TypeError`s for a wrong
//   `layout` class or a `rel_nests.RelatingObject` that isn't an `IfcAlignment`;
//   `ValueError` when `layout` isn't nested under any `IfcAlignment` at all) -- no
//   referent-creation call of any kind.
// - The zero-real-segments early return (`segments` empty after stripping a trailing
//   zero-length segment) -- sorts and returns `rel_nests` immediately, no
//   `createKeyPointReferent` call at all.
// - `removeReferent`'s own `clear=true` cleanup of PRE-EXISTING referents/psets/
//   placements (built via a hand-rolled fixture bypassing the blocked creation path
//   entirely, matching this module's own established "can't reuse the real fixture,
//   build an equivalent one instead" precedent, e.g. chunk 1's own
//   `getStationingNest.test.ts`) -- a pure DELETION path, touching no
//   standalone-value construction of any kind (`removePset`, `removeDeep2`,
//   `file.remove` -- all already fully portable, confirmed by their own existing
//   ported/tested behavior).
//
// `updateKeyPointReferents.test.ts` covers every one of the above with real, passing
// assertions, plus dedicated regression tests pinning the CURRENT disclosed throw at
// the earliest of the two gaps for both a composite-curve and a non-composite-curve
// `layout` (matching `addPositioningReferent.test.ts`'s/`addStationingReferent
// .test.ts`'s own established pattern for the identical situation).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { getPset, removeDeep2 } from "../../util/element";
import { addPset } from "../pset/addPset";
import { editPset } from "../pset/editPset";
import { removePset } from "../pset/removePset";
import { _getKeyPointTag } from "./_getKeyPointTag";
import { _getSegmentStartPointLabel } from "./_getSegmentStartPointLabel";
import { _sortNest } from "./_sortNest";
import { getAlignment } from "./getAlignment";
import { getAlignmentStartStation } from "./getAlignmentStartStation";
import { getLayoutCurve } from "./getLayoutCurve";
import { getLayoutSegments } from "./getLayoutSegments";
import { hasZeroLengthSegment } from "./hasZeroLengthSegment";
import { updateFallbackPosition } from "./updateFallbackPosition";

/**
 * Cleanly deletes a key-point `IfcReferent`: its `Pset_Stationing`, its
 * `ObjectPlacement` (if exclusively owned by it), and finally the referent itself.
 * Python: `update_key_point_referents._remove_referent` -- see this file's own header
 * comment for why it's ported as a local, non-exported function here rather than a
 * separate underscore-prefixed module file.
 */
function removeReferent(file: IfcFile, referent: EntityInstance): void {
	for (const inverse of [...(file.getInverse(referent) as Set<EntityInstance>)]) {
		if (inverse.isA("IfcRelDefinesByProperties")) {
			removePset(file, { product: referent, pset: inverse.get("RelatingPropertyDefinition") as EntityInstance });
		}
	}

	const objectPlacement = referent.get("ObjectPlacement") as EntityInstance | null;
	if (objectPlacement && file.getTotalInverses(objectPlacement) === 1) {
		referent.set("ObjectPlacement", null);
		removeDeep2(file, objectPlacement);
	}

	// Also strips referent out of any IfcRelNests.RelatedObjects referencing it.
	file.remove(referent);
}

/**
 * Python: `update_key_point_referents._create_key_point_referent`. See this file's
 * own header comment for the two independent, already-disclosed gaps this hits.
 */
function createKeyPointReferent(
	file: IfcFile,
	alignment: EntityInstance,
	curve: EntityInstance | null,
	label: string,
	distanceAlong: number,
	station: number,
): EntityInstance {
	let objectPlacement: EntityInstance;

	if (curve?.isA("IfcCompositeCurve") && (curve.get("Segments") as EntityInstance[]).length > 0) {
		objectPlacement = file.createEntity(
			"IfcLinearPlacement",
			null,
			file.createEntity(
				"IfcAxis2PlacementLinear",
				file.createEntity(
					"IfcPointByDistanceExpression",
					file.createEntity("IfcLengthMeasure", distanceAlong),
					null,
					null,
					null,
					curve,
				),
			),
		);
		updateFallbackPosition(file, objectPlacement);
	} else {
		// Python: `alignment.ObjectPlacement.RelativePlacement.Location.Coordinates`,
		// unguarded -- see `addPositioningReferent.ts`'s own identical construction and
		// header comment note about preserving the lack of a guard.
		const alignmentLocation = (
			(alignment.get("ObjectPlacement") as EntityInstance).get("RelativePlacement") as EntityInstance
		).get("Location") as EntityInstance;
		objectPlacement = file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity(
				"IfcAxis2Placement2D",
				file.createEntity("IfcCartesianPoint", alignmentLocation.get("Coordinates")),
			),
		);
	}

	const name = `${alignment.get("Name")} ${_getKeyPointTag(file, label, station)}`;

	// IfcReferent: GlobalId(0), OwnerHistory(1), Name(2), Description(3), ObjectType(4),
	// ObjectPlacement(5), Representation(6), PredefinedType(7).
	const referent = file.createEntity(
		"IfcReferent",
		guid.new(),
		null,
		name,
		null,
		null,
		objectPlacement,
		null,
		"POSITION",
	);

	const psetStationing = addPset(file, { product: referent, name: "Pset_Stationing" });
	editPset(file, { pset: psetStationing, properties: { Station: station } });

	return referent;
}

/** Python's `f"{[_ for _ in expected_types]}"` -- `repr()` of a list of strings (single-quoted elements, `", "`-joined). Matches `hasZeroLengthSegment.ts`'s/`nameSegments.ts`'s/`updateEndPoint.ts`'s/`_getSegmentStartPointLabel.ts`'s own identical, deliberately-duplicated-per-file helper. */
function pythonListRepr(items: readonly string[]): string {
	return `[${items.map((s) => `'${s}'`).join(", ")}]`;
}

const EXPECTED_LAYOUT_TYPES = ["IfcAlignmentHorizontal", "IfcAlignmentVertical", "IfcAlignmentCant"];

/**
 * Creates `IfcReferent` key-point markers for every segment transition in an
 * alignment layout (Python: `ifcopenshell.api.alignment.update_key_point_referents`).
 *
 * Labels are derived from `_getSegmentStartPointLabel` (e.g. `"P.C."`, `"P.T."`,
 * `"P.O.B."`, `"P.V.C."`, ...), and combined with the alignment name and station to
 * build the `Name`, e.g. `"MyAlignment 145+98.32 (P.C.)"`. Different jurisdictions use
 * different naming systems for these key points -- `registerReferentNameCallback`
 * lets a caller override the default horizontal/vertical/cant labeling before calling
 * this function; if a callback is registered, its output is used here instead of the
 * built-in labels. Referents are nested to `relNests`, an `IfcRelNests` distinct from
 * the layout's segment nest (found via `getAlignmentSegmentNest`) and from the
 * alignment's stationing nest (found via `getStationingNest`) -- key-point referents
 * never belong in either of those.
 *
 * **Currently blocked for every real segment** by two independent, already-disclosed
 * primitive-layer gaps -- see this file's own header comment for the full writeup.
 * Validation, the zero-real-segments early return, and `clear`'s own referent-removal
 * cleanup all remain fully functional.
 *
 * @param file The file.
 * @param layout `IfcAlignmentHorizontal`, `IfcAlignmentVertical`, or
 *   `IfcAlignmentCant`.
 * @param relNests An existing `IfcRelNests` to (re)populate; its `RelatingObject`
 *   must be an `IfcAlignment` (`TypeError` is raised otherwise), but need not be the
 *   `IfcAlignment` that directly nests `layout` -- passing an ancestor's own
 *   `IfcRelNests` is supported specifically so that a vertical/cant layout living
 *   under a child `IfcAlignment` (per CT 4.1.4.4.1.2, once a second vertical layout is
 *   added) can still have its key-point referents named after and nested to the
 *   top-level parent alignment, matching how the alignment's horizontal key points
 *   are named, rather than a generic "Child of X" name. When `relNests` is given,
 *   `relNests`'s own `RelatingObject` -- not `layout`'s own direct parent -- is used
 *   for both the created referents' `Name` and the returned `IfcRelNests`. If
 *   omitted, a new `IfcRelNests` is always created and related to `layout`'s own
 *   direct parent alignment -- there is no implicit search for or reuse of a
 *   previously created nest. Callers who want to regenerate into an existing nest
 *   must pass it back in explicitly via `relNests`.
 * @param clear If `true`, deletes all `IfcReferent`s currently in
 *   `relNests.RelatedObjects` (and their `Pset_Stationing`) before regenerating. If
 *   `false` (default), new referents are appended to whatever already exists -- no
 *   deduplication.
 * @returns The `IfcRelNests`, with `RelatedObjects` sorted ascending by
 *   `Pset_Stationing.Station`.
 *
 * @example
 * ```ts
 * const horizontal = api.alignment.getHorizontalLayout(alignment);
 * const nest = api.alignment.updateKeyPointReferents(model, horizontal);
 * ```
 */
export function updateKeyPointReferents(
	file: IfcFile,
	layout: EntityInstance,
	relNests: EntityInstance | null = null,
	clear = false,
): EntityInstance {
	if (!EXPECTED_LAYOUT_TYPES.includes(layout.isA())) {
		throw new TypeError(
			`Expected entity type to be one of ${pythonListRepr(EXPECTED_LAYOUT_TYPES)}, instead received ${layout.isA()}`,
		);
	}

	const layoutAlignment = getAlignment(layout);
	if (layoutAlignment === null) {
		throw new Error(`${layout.isA()} #${layout.id()} is not nested under an IfcAlignment.`);
	}

	// `alignment` is used below for referent naming (and as the fallback-placement
	// basis) -- it defaults to layout's own direct parent, but an explicitly passed
	// `relNests` overrides it with `relNests.RelatingObject` instead (see the
	// `relNests` doc above). Station computation always uses `layoutAlignment`,
	// unaffected by this -- `getAlignmentStartStation` already walks up to the true
	// top-level alignment's own stationing referent regardless of which (possibly
	// child) alignment it's given.
	let alignment: EntityInstance;
	let nest: EntityInstance;
	if (relNests !== null) {
		if (!(relNests.get("RelatingObject") as EntityInstance).isA("IfcAlignment")) {
			throw new TypeError(
				`Expected rel_nests.RelatingObject to be IfcAlignment, instead received ${(relNests.get("RelatingObject") as EntityInstance).isA()}`,
			);
		}
		alignment = relNests.get("RelatingObject") as EntityInstance;
		nest = relNests;
	} else {
		alignment = layoutAlignment;
		nest = file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, []);
	}

	if (clear) {
		for (const referent of [...(nest.get("RelatedObjects") as EntityInstance[])]) {
			removeReferent(file, referent);
		}
		nest.set("RelatedObjects", []);
	}

	let segments = [...getLayoutSegments(layout)];
	if (segments.length > 0 && hasZeroLengthSegment(layout)) {
		segments = segments.slice(0, -1);
	}

	if (segments.length === 0) {
		_sortNest(nest, (x) => getPset(x, "Pset_Stationing", "Station") as number);
		return nest;
	}

	const startStation = getAlignmentStartStation(file, layoutAlignment) as number;
	const curve = getLayoutCurve(layout);
	const isHorizontal = layout.isA("IfcAlignmentHorizontal");

	const newReferents: EntityInstance[] = [];
	let distanceAlong = 0.0;
	let prevSegment: EntityInstance | null = null;
	for (const segment of segments) {
		const dp = segment.get("DesignParameters") as EntityInstance;
		const segDistanceAlong = isHorizontal ? distanceAlong : (dp.get("StartDistAlong") as number);

		const label = _getSegmentStartPointLabel(prevSegment, segment);
		const station = startStation + segDistanceAlong;
		newReferents.push(createKeyPointReferent(file, alignment, curve, label, segDistanceAlong, station));

		if (isHorizontal) {
			distanceAlong += dp.get("SegmentLength") as number;
		} else {
			distanceAlong = (dp.get("StartDistAlong") as number) + (dp.get("HorizontalLength") as number);
		}

		prevSegment = segment;
	}

	const lastLabel = _getSegmentStartPointLabel(prevSegment, null);
	const lastStation = startStation + distanceAlong;
	newReferents.push(createKeyPointReferent(file, alignment, curve, lastLabel, distanceAlong, lastStation));

	nest.set("RelatedObjects", [...(nest.get("RelatedObjects") as EntityInstance[]), ...newReferents]);
	_sortNest(nest, (x) => getPset(x, "Pset_Stationing", "Station") as number);

	return nest;
}
