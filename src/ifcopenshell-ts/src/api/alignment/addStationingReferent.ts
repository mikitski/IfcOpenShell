// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/add_stationing_referent.py`
// (src/ifcopenshell-python, 128 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 4 of many). Depends on this module's own
// already-landed `getBasisCurve`/`getCurve`/`getStationingNest` (chunk 1),
// `_sortNest`/`updateFallbackPosition` (chunk 3), plus already-landed
// `api.pset.addPset`/`editPset` and `guid.new`.
//
// Not wrapped in `wrapUsecase`, plain positional-argument function -- matching
// `./addPositioningReferent.ts`'s own identical convention/reasoning (see that file's
// header comment).
//
// --- UPDATE (upstream sync chunk 3 of 4, upstream commit
//     `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`): reverse (decreasing) stationing
//     support added, plus a real fallback-placement construction fix ---
//
// See `TODOS.md`'s "Upstream sync, chunk 3 of 4" entry and
// `planning/ifcopenshell-ts/90-upstream-sync-plan.md` §4c for the full context. Three
// real changes ported from the real upstream diff:
//
// 1. **New `hasIncreasingStation` parameter** (inserted between `incomingStation` and
//    `onBasisCurve`, matching real Python's own new parameter position), written to
//    `Pset_Stationing.HasIncreasingStation` when given (not `null`/`undefined`).
//    Records the stationing DIRECTION starting at this referent: `true`/omitted (the
//    common case) means subsequent nested referents have increasing `Station` values as
//    `DistanceAlong` increases; `false` means decreasing (reverse) stationing.
// 2. **The fallback-placement (non-composite-curve) branch no longer reads
//    `alignment.ObjectPlacement.RelativePlacement.Location.Coordinates`** -- real
//    Python's own previous unguarded read (see `./addPositioningReferent.ts`'s own
//    still-current identical construction, which this change does NOT touch --
//    `add_positioning_referent.py` itself was not part of the real upstream diff) is
//    replaced with a hardcoded `Coordinates=(0.0, 0.0)` (the global origin). This is a
//    real, deliberate behavior change, not just a refactor: real upstream's own new
//    docstring explains why -- "No resolvable basis curve yet: place the referent at
//    the global origin. Once geometry exists, `create_representation()` restates the
//    starting referent onto the curve at `DistanceAlong` 0.0." (this also removes this
//    function's own previous reliance on `alignment.ObjectPlacement` being already
//    populated at all).
// 3. **Referents are now sorted by increasing `DistanceAlong`, not
//    `Pset_Stationing.Station`**, via the new shared `./_referentDistanceAlong.ts`
//    helper (factored out of `./distanceAlongFromStation.ts`'s own former private
//    helper by the same real upstream commit) -- critical for a reverse-stationed
//    alignment, where increasing `DistanceAlong` means DECREASING `Station`; sorting on
//    `Station` directly would put referents in the wrong nest order in that case.
//
// *** Structurally almost identical to `./addPositioningReferent.ts` in every OTHER
// respect -- read that file's own header comment for the two independent,
// already-disclosed primitive-layer gaps this file's own composite-curve branch and
// `editPset` call can still hit (neither is touched by this update): ***
// - `curve` resolution defaults to `getBasisCurve` (not `getCurve`) unless
//   `onBasisCurve` is explicitly `false` -- real Python's own `on_basis_curve=None`
//   default-to-`true` semantics, ported the same way (a `?? true`-shaped default, not
//   a plain parameter default, so an explicit `false` is preserved and only `null`/
//   `undefined` fall back to `true`).
// - `PredefinedType` is `"STATION"`, not `"POSITION"`.
// - No `positionedProduct`/`IfcRelPositions` linking at all -- this referent is
//   purely a stationing marker, nested to the alignment's own stationing
//   `IfcRelNests` (`getStationingNest`) instead.
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { addPset } from "../pset/addPset";
import { editPset } from "../pset/editPset";
import { _referentDistanceAlong } from "./_referentDistanceAlong";
import { _sortNest } from "./_sortNest";
import { getBasisCurve } from "./getBasisCurve";
import { getCurve } from "./getCurve";
import { getStationingNest } from "./getStationingNest";
import { updateFallbackPosition } from "./updateFallbackPosition";

/**
 * Adds an `IfcReferent` to the alignment that defines the stationing system (Python:
 * `ifcopenshell.api.alignment.add_stationing_referent`).
 *
 * Call this once with `distanceAlong=0.0` to define the starting station, and again
 * for each station equation. If the alignment has no geometry yet, the referent is
 * placed with an `IfcLocalPlacement` at the global origin; once the basis curve has
 * real segments it is placed with an `IfcLinearPlacement` at `distanceAlong` on that
 * curve. `createRepresentation()` restates an origin-placed starting referent onto the
 * curve when geometry is added later.
 *
 * **The composite-curve branch and the `editPset` call may still hit two independent,
 * already-disclosed primitive-layer gaps** -- see this file's own header comment (and
 * `./addPositioningReferent.ts`'s own, more detailed writeup of the same two gaps) for
 * exactly which of the two throws for a given `alignment`/curve shape.
 *
 * @param file The file.
 * @param name Name to assign to `IfcReferent.Name`, typically a stringized version of
 *   the station value.
 * @param alignment The alignment to receive the referent.
 * @param distanceAlong Distance along the alignment basis curve.
 * @param station Station value.
 * @param incomingStation Station value of the incoming segment, only set to specify a
 *   station equation.
 * @param hasIncreasingStation Sets `Pset_Stationing.HasIncreasingStation`, which
 *   records the direction of stationing for the referents nested after this one. Leave
 *   `null`/`undefined` (the default) or pass `true` for the common case where station
 *   values increase with distance along; pass `false` on the starting referent of a
 *   reverse-stationed alignment, where station values decrease as distance along
 *   increases.
 * @param onBasisCurve Whether the referent is positioned on the basis curve or the
 *   alignment curve. If `null`/`undefined`, defaults to the basis curve.
 * @returns The referent.
 *
 * @example
 * ```ts
 * const alignment = file.byType("IfcAlignment")[0];
 * api.alignment.addStationingReferent(model, "1+00.0", alignment, 0.0, 100.0);
 * ```
 */
export function addStationingReferent(
	file: IfcFile,
	name: string,
	alignment: EntityInstance,
	distanceAlong: number,
	station: number,
	incomingStation: number | null = null,
	hasIncreasingStation: boolean | null = null,
	onBasisCurve: boolean | null = null,
): EntityInstance {
	const resolvedOnBasisCurve = onBasisCurve ?? true;

	const curve = resolvedOnBasisCurve ? getBasisCurve(alignment) : getCurve(alignment);

	let objectPlacement: EntityInstance;
	const representation: EntityInstance | null = null;

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
		// No resolvable basis curve yet: place the referent at the global origin. Once
		// geometry exists, `createRepresentation()` restates the starting referent onto
		// the curve at `DistanceAlong` 0.0.
		objectPlacement = file.createEntity(
			"IfcLocalPlacement",
			null,
			file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0.0, 0.0])),
		);
	}

	// This commented-out code is what you would do to add a geometric representation
	// of the referent -- the example is a circle. A better way would be to pass a
	// representation into the function.
	//   representation = file.createEntity(
	//     "IfcCircle",
	//     file.createEntity("IfcAxis2Placement2D", file.createEntity("IfcCartesianPoint", [0.0, 0.0])),
	//     1.0,
	//   );

	// IfcReferent: GlobalId(0), OwnerHistory(1), Name(2), Description(3), ObjectType(4),
	// ObjectPlacement(5), Representation(6), PredefinedType(7) -- identical index on
	// IFC4X3 (the only schema this whole module targets).
	const referent = file.createEntity(
		"IfcReferent",
		guid.new(),
		null,
		name,
		null,
		null,
		objectPlacement,
		representation,
		"STATION",
	);

	const properties: Record<string, number | boolean> = { Station: station };
	if (incomingStation !== null) {
		properties.IncomingStation = incomingStation;
	}
	if (hasIncreasingStation !== null && hasIncreasingStation !== undefined) {
		properties.HasIncreasingStation = hasIncreasingStation;
	}

	const psetStationing = addPset(file, { product: referent, name: "Pset_Stationing" });
	editPset(file, { pset: psetStationing, properties });

	let nest = getStationingNest(file, alignment);
	if (nest === null) {
		nest = file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [referent]);
	} else {
		nest.set("RelatedObjects", [...(nest.get("RelatedObjects") as EntityInstance[]), referent]);
	}

	// Referents are ordered by increasing DistanceAlong (IFC CT 4.1.4.4.3), which for a
	// reverse-stationed alignment is decreasing Station -- so sort on DistanceAlong, not
	// Station. See this file's own header comment.
	_sortNest(nest, _referentDistanceAlong);

	return referent;
}
