// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/add_stationing_referent.py`
// (src/ifcopenshell-python, 128 lines) -- see `./index.ts`'s own header comment for
// this brand-new module's full scope (chunk 4 of many). Depends on this module's own
// already-landed `getBasisCurve`/`getCurve`/`getStationingNest` (chunk 1),
// `_sortNest`/`updateFallbackPosition` (chunk 3), plus already-landed
// `api.pset.addPset`/`editPset`, `guid.new`, and `util.element.getPset` (verified
// against its real exported name/signature -- `../../util/element.ts`'s own
// `getPset(element, name, prop, ...)` -- before using).
//
// Not wrapped in `wrapUsecase`, plain positional-argument function -- matching
// `./addPositioningReferent.ts`'s own identical convention/reasoning (see that file's
// header comment).
//
// *** Structurally almost identical to `./addPositioningReferent.ts` -- same two
// independent, already-disclosed primitive-layer gaps, same consequence for each of
// the two placement branches. Read that file's own header comment for the full
// writeup of gap 1 (the composite-curve branch's own `IfcPointByDistanceExpression
// .DistanceAlong` construction) and gap 2 (`editPset`'s own separate, pre-existing
// "cannot create a brand-new plain-scalar property" gap, hit here by the
// `{Station: station}` -- and, when given, `{IncomingStation: incoming_station}` --
// `editPset` call) -- both independently reconfirmed empirically for this file's own
// call shape before writing it. The ONLY behavioral differences from
// `addPositioningReferent.ts`, all ported faithfully below: ***
// - `curve` resolution defaults to `getBasisCurve` (not `getCurve`) unless
//   `onBasisCurve` is explicitly `false` -- real Python's own `on_basis_curve=None`
//   default-to-`true` semantics, ported the same way (a `?? true`-shaped default, not
//   a plain parameter default, so an explicit `false` is preserved and only `null`/
//   `undefined` fall back to `true`).
// - `PredefinedType` is `"STATION"`, not `"POSITION"`.
// - No `positionedProduct`/`IfcRelPositions` linking at all -- this referent is
//   purely a stationing marker, nested to the alignment's own stationing
//   `IfcRelNests` (`getStationingNest`) instead.
// - An optional `incomingStation` adds a second `Pset_Stationing.IncomingStation`
//   property (station-equation support) -- ALSO independently blocked by the exact
//   same `editPset`-new-property gap as `Station` itself, so it never becomes
//   independently observable (the function already throws on `Station` first, since
//   real Python's own `properties` dict is built with `Station` inserted before a
//   conditional `IncomingStation`, and `editPset`'s own `addNewProperties` iterates a
//   `Map` in insertion order).
// - The final `_sortNest`/`getStationingNest` bookkeeping is dead code under the
//   current gap for the SAME reason `./addPositioningReferent.ts`'s own
//   `IfcRelPositions` step is -- the function already threw at `editPset`, in every
//   branch, before this point is ever reached. Ported completely and faithfully
//   anyway (it is real, correct, and will run the moment the gap closes).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { getPset } from "../../util/element";
import { addPset } from "../pset/addPset";
import { editPset } from "../pset/editPset";
import { _sortNest } from "./_sortNest";
import { getBasisCurve } from "./getBasisCurve";
import { getCurve } from "./getCurve";
import { getStationingNest } from "./getStationingNest";
import { updateFallbackPosition } from "./updateFallbackPosition";

/**
 * Adds an `IfcReferent` to the alignment that defines the stationing system (Python:
 * `ifcopenshell.api.alignment.add_stationing_referent`).
 *
 * **Currently blocked end to end** by two independent, already-disclosed
 * primitive-layer gaps -- see this file's own header comment (and
 * `./addPositioningReferent.ts`'s own, more detailed writeup of the same two gaps)
 * for exactly which of the two throws for a given `alignment`/curve shape.
 *
 * @param file The file.
 * @param name Name to assign to `IfcReferent.Name`, typically a stringized version of
 *   the station value.
 * @param alignment The alignment to receive the referent.
 * @param distanceAlong Distance along the alignment basis curve.
 * @param station Station value.
 * @param incomingStation Station value of the incoming segment, only set to specify a
 *   station equation.
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

	const properties: Record<string, number> = { Station: station };
	if (incomingStation !== null) {
		properties.IncomingStation = incomingStation;
	}

	const psetStationing = addPset(file, { product: referent, name: "Pset_Stationing" });
	editPset(file, { pset: psetStationing, properties });

	let nest = getStationingNest(file, alignment);
	if (nest === null) {
		nest = file.createEntity("IfcRelNests", guid.new(), null, null, null, alignment, [referent]);
	} else {
		nest.set("RelatedObjects", [...(nest.get("RelatedObjects") as EntityInstance[]), referent]);
	}

	_sortNest(nest, (x) => getPset(x, "Pset_Stationing", "Station") as number);

	return referent;
}
