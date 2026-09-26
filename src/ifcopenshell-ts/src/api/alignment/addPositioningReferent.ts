// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/add_positioning_referent.py`
// (src/ifcopenshell-python, 113 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 4 of many). Depends on this module's own
// already-landed `getCurve` (chunk 1) and `updateFallbackPosition` (chunk 3), plus
// already-landed `api.pset.addPset`/`editPset` and `guid.new`.
//
// Not wrapped in `wrapUsecase` -- matching every other file in this module (confirmed,
// per `./index.ts`'s own header comment, that NONE of `ifcopenshell.api.alignment`'s
// real files are registered with `ifcopenshell.api.run`/an internal `Usecase` class);
// exported as a plain, positional-argument function, matching real Python's own
// `def add_positioning_referent(file, name, alignment, distance_along, station,
// positioned_product)` signature one-for-one (not a `Settings` object, unlike this
// project's `wrapUsecase`-wrapped `api.*` conventions elsewhere).
//
// *** TWO INDEPENDENT, ALREADY-DISCLOSED primitive-layer gaps, each independently
// confirmed EMPIRICALLY against this exact worktree's own built native addon before
// writing this file -- read both before assuming either branch is "the" blocker. ***
//
// 1. **The composite-curve branch's own placement construction** -- real Python:
//    `file.createIfcPointByDistanceExpression(DistanceAlong=file.createIfcLengthMeasure(
//    distance_along), ...)`. `IfcPointByDistanceExpression.DistanceAlong` is a real
//    `IfcLengthMeasure`-SELECT-typed (confirmed `unknown` in `ifc4x3.d.ts`) attribute
//    that needs a freshly-constructed STANDALONE `IfcLengthMeasure` value to
//    disambiguate its concrete type -- the SAME `EntityInstance.setByIndex`/
//    `IfcFile.createEntity` gap tracked in `TODOS.md`'s dedicated entry since PR #124
//    (`api.project.append_asset`), re-confirmed in chunks 1-3 of this very module
//    (`./index.ts`'s own header comment). Confirmed to still throw
//    (`file.createEntity("IfcLengthMeasure", 1.0)` -> `"Attribute access is only
//    supported on entity instances"`) against this chunk's own freshly-built addon.
// 2. **`api.pset.editPset`'s own, SEPARATELY-already-disclosed gap for creating a
//    BRAND NEW plain-scalar property** (`TODOS.md`'s SAME dedicated entry, "fourth
//    consequence" update, `api.pset` `edit_pset` chunk) -- `editPset(file, {pset,
//    properties: {Station: station}})` needs to materialize a fresh
//    `IfcLengthMeasure`/`IfcReal`-class value for the new `Station` property's own
//    `NominalValue`, which hits the IDENTICAL root gate. Confirmed EMPIRICALLY, while
//    writing this file's own tests, that `editPset(file, {pset, properties: {Station:
//    100.0}})` throws the identical error for a brand-new numeric property, on a
//    pset that was itself just successfully created via `addPset` (which does NOT
//    hit the gate -- `IfcPropertySet` is a real, multi-attribute ENTITY, not a
//    standalone simple/defined-type value).
//
// **The consequence: BOTH of this function's two branches are currently blocked in
// this port, just at DIFFERENT points** -- a real, narrower finding than either gap's
// own existing `TODOS.md` writeup states in isolation (neither entry, read alone,
// says THIS function is blocked on BOTH its own branches):
// - The `if` branch (curve is an `IfcCompositeCurve` with `Segments`) throws at gap 1
//   above, at the exact point real Python would materialize the `IfcLengthMeasure` --
//   BEFORE `updateFallbackPosition`, BEFORE the `IfcReferent` is created, and BEFORE
//   `addPset`/`editPset` are ever reached. No side effect of any kind occurs.
// - The `else` branch (no curve, or a curve that isn't a non-empty `IfcCompositeCurve`
//   -- e.g. `create(..., include_geometry=False)`, per real Python's own
//   `test_fallback_placement_when_layout_has_no_geometry`) is FULLY portable on its
//   own -- it builds a real `IfcLocalPlacement`/`IfcAxis2Placement2D`/
//   `IfcCartesianPoint` from `alignment.ObjectPlacement`'s own already-real
//   `Coordinates`, no standalone-value construction of any kind. The `IfcReferent` is
//   then created (real entity) and `addPset` succeeds (real entity) -- but the
//   subsequent `editPset(..., {Station: station})` call throws at gap 2 above. So this
//   branch reaches much further (a real, addressable `IfcReferent` with the correct
//   `Name`/`PredefinedType`/`ObjectPlacement` already exists in the file, matching
//   real Python's own identical non-transactional "partial effects are NOT rolled
//   back on an exception" behavior) before throwing for its own, separate, disclosed
//   reason.
//
// Ported both branches completely and faithfully -- including `IfcRelPositions`
// creation/appending (real Python's own `len(referent.Positions) == 0` dedup check,
// preserved verbatim) -- with NO proactive guard anywhere: every call in this file is
// the exact real Python call, in the exact real order, and is allowed to throw
// naturally at whichever of the two gaps above it would hit first for a given
// `alignment`/`curve` shape. `addPositioningReferent.test.ts` pins BOTH disclosed
// throw points with dedicated regression tests (one per branch), plus every other
// portable branch/validation this file has (there are none beyond the two placement
// branches -- confirmed by reading the real source in full: no type-checking, no
// early-return path at all).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { addPset } from "../pset/addPset";
import { editPset } from "../pset/editPset";
import { getCurve } from "./getCurve";
import { updateFallbackPosition } from "./updateFallbackPosition";

/**
 * Semantically defines the position of a product along an alignment by adding an
 * `IfcReferent` to the alignment that defines the stationing system (Python:
 * `ifcopenshell.api.alignment.add_positioning_referent`).
 *
 * **Currently blocked end to end** by two independent, already-disclosed
 * primitive-layer gaps -- see this file's own header comment for the full writeup,
 * including exactly which of the two throws for a given `alignment`/curve shape.
 *
 * @param file The file.
 * @param name Name to assign to `IfcReferent.Name`, typically a stringized version of
 *   the station value.
 * @param alignment The alignment to receive the referent.
 * @param distanceAlong Distance along the alignment basis curve.
 * @param station Station value.
 * @param positionedProduct The product whose position is informed by the referent.
 * @returns The referent.
 *
 * @example
 * ```ts
 * const alignment = file.byType("IfcAlignment")[0];
 * const pier = file.byType("IfcBridgePart")[0];
 * api.alignment.addPositioningReferent(model, "Pier 1 Sta 1+00", alignment, 0.0, 100.0, pier);
 * ```
 */
export function addPositioningReferent(
	file: IfcFile,
	name: string,
	alignment: EntityInstance,
	distanceAlong: number,
	station: number,
	positionedProduct: EntityInstance,
): EntityInstance {
	const curve = getCurve(alignment);

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
		// Python: `alignment.ObjectPlacement.RelativePlacement.Location.Coordinates`,
		// with no guard of any kind -- ported the same way (an unguarded chained
		// `.get()`), so a malformed `alignment` (missing `ObjectPlacement`/
		// `RelativePlacement`/`Location`) fails the same way real Python's own
		// `AttributeError` would, rather than being silently null-checked into a
		// different, non-faithful error.
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
		"POSITION",
	);

	const psetStationing = addPset(file, { product: referent, name: "Pset_Stationing" });
	editPset(file, { pset: psetStationing, properties: { Station: station } });

	const positions = referent.get("Positions") as EntityInstance[];
	if (positions.length === 0) {
		file.createEntity("IfcRelPositions", guid.new(), null, null, null, referent, [positionedProduct]);
	} else {
		positions[0].set("RelatedProducts", [
			...(positions[0].get("RelatedProducts") as EntityInstance[]),
			positionedProduct,
		]);
	}

	return referent;
}
