// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/edit_profile_usage.py` (src/ifcopenshell-python,
// 223 lines) -- chunk 4 of `api.material` (see `./index.ts`'s own header comment; this
// chunk completes the module, 26/26 files) -- by far the largest and most complex file
// in this chunk, read multiple times before porting. No sibling `api.material`
// dependency -- the real source imports `ifcopenshell.geom`, `ifcopenshell.util
// .representation` (`get_representation`, already landed), and `ifcopenshell.util
// .shape` (`get_x`/`get_y`, part of the ALREADY-disclosed `ifcopenshell.geom`-dependent
// 39-of-43-functions gap in `util/shape.ts`'s own header comment/`TODOS.md`).
//
// --- Real control flow, ported faithfully ---
//
// `execute()` is a trivial two-step shape: (1) IF the caller's own `attributes` include
// a `CardinalPoint` that's both truthy AND actually different from the usage's current
// value, run `update_cardinal_point()` FIRST; (2) only THEN apply every `attributes`
// entry via a plain `setattr` loop (this is the SAME order-of-operations as every other
// `edit_*` file in this chunk -- the "compute a derived side effect from the OLD value,
// then overwrite it" pattern -- not a coincidence: `CardinalPoint`'s old value is read
// inside `update_cardinal_point` via `usage.CardinalPoint`, which would already be the
// NEW value if the attribute-setting loop ran first).
//
// `update_cardinal_point()` itself: find the profile curve in play (the profile SET's
// own `CompositeProfile` if set, else the first `MaterialProfiles[0].Profile`) -- if
// there's no profile at all, silently return (a real, intentional no-op guard, ported
// as the same early `return`, not an error). Otherwise, `calculate_position()` computes
// a brand new `IfcAxis2Placement3D` for the NEW cardinal point (this is the genuinely
// blocked geometry-kernel step, see below), then every element actually using this
// exact profile SET's usage gets its own body representation's `IfcSweptAreaSolid
// .Position` overwritten with that new placement (schema-dispatched the same way
// `./assignProfile.ts`'s own `ToMaterialProfileSet` loop is -- `get_inverse`-then-filter
// on IFC2X3 vs. `AssociatedTo` on IFC4+ -- though, unlike `assignProfile.ts`,
// `IfcMaterialProfileSetUsage` genuinely CAN exist on an IFC2X3-authored dataset in
// real Python's own model here, since `usage` itself -- unlike `assign_profile`'s own
// `material_profile` parameter -- has no IFC2X3-absent type of its own gating this
// function's entry the same way; ported as the same real two-branch `if`/`else` either
// way, matching real Python's own unconditional dispatch).
//
// --- `ifcopenshell.geom`/`ifcopenshell.util.shape`: genuinely unported, throws loudly,
// exactly at the real call site, before any mutation ---
//
// `calculate_position()` builds a throwaway single-entity `ifcopenshell.file`, strips
// every non-`RoundingRadius` `*Radius` attribute off a COPY of the profile curve (so
// fillets/rounding don't skew the geometric centroid), extrudes it 1 unit via a dummy
// `IfcExtrudedAreaSolid`, calls `ifcopenshell.geom.create_shape(...)` to actually
// triangulate that dummy solid, then reads `util.shape.get_x`/`get_y` off the resulting
// triangulation to get the real-world bounding width/height needed to compute any of
// the 9 cardinal-point offsets (`get_bottom_left`/`get_top_centre`/etc. -- see
// `test_update_cardinal_point`'s own real assertion: `CardinalPoint: 1` on a 100x100mm
// square profile shifts a beam's swept-area `Position` from `(0,0,0)` to
// `(-50,50,0)`). This TS port has NO `ifcopenshell.geom` binding of any kind
// (`TODOS.md`'s very first disclosed gap, "`getAxis2placement`'s `IfcAxis2PlacementLinear`
// fallback needs `ifcopenshell.geom`") -- so `updateCardinalPoint` below ports
// EVERYTHING up to and including finding the real profile curve in play (a full,
// faithful, real computation -- not a stub), then throws a clear, loud, descriptive
// error the INSTANT it's clear `calculate_position()` would actually be needed (i.e. a
// profile was found) -- deliberately BEFORE building the dummy file, BEFORE the
// per-element representation-patching loop, and (per `execute()`'s own real
// order-of-operations above) BEFORE the final `attributes` `setattr` loop has touched
// `usage` at all. A caller editing any attribute OTHER than `CardinalPoint` (or setting
// `CardinalPoint` to its own current value, or to a falsy value) is entirely
// unaffected -- this only throws on a genuine cardinal-point CHANGE.
//
// --- Positional/by-name attribute access, verified against generated `.d.ts`s ---
//
// `IfcMaterialProfileSetUsage.ForProfileSet`/`.CardinalPoint`, `IfcMaterialProfileSet
// .CompositeProfile`/`.MaterialProfiles`, `IfcMaterialProfile.Profile` -- all read by
// name, matching this project's established convention for non-hot-path attribute
// access. `AssociatedTo` (an INVERSE attribute, absent from the generated `.d.ts`s
// entirely) is read via `.get(...)`, exactly like `./assignProfile.ts`'s own identical
// precedent.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/**
 * Python: `Usecase.update_cardinal_point`/`.calculate_position` (merged into one
 * function here, since everything past finding the profile is the genuinely blocked
 * geometry-kernel step -- see this file's own header comment). Throws the instant a
 * profile is found (i.e. `calculate_position()` would actually run), before any
 * mutation of `usage`/its associated elements.
 */
function updateCardinalPoint(usage: EntityInstance, cardinalPoint: unknown): void {
	const materialSet = usage.get("ForProfileSet") as EntityInstance;
	let profile = materialSet.get("CompositeProfile") as EntityInstance | null;
	if (!profile) {
		const materialProfiles = (materialSet.get("MaterialProfiles") as EntityInstance[] | null) ?? [];
		if (materialProfiles.length > 0) {
			profile = materialProfiles[0].get("Profile") as EntityInstance;
		}
	}
	if (!profile) return;

	// See this file's own header comment -- `calculate_position()` needs
	// `ifcopenshell.geom.create_shape`/`util.shape.get_x`/`get_y`, none ported yet.
	throw new Error(
		`editProfileUsage: changing CardinalPoint to ${String(cardinalPoint)} needs a geometry-kernel-backed position calculation (ifcopenshell.geom.create_shape / util.shape.get_x/get_y), not ported yet -- see TODOS.md.`,
	);
}

export interface EditProfileUsageSettings {
	/** The `IfcMaterialProfileSetUsage` entity you want to edit. */
	usage: EntityInstance;
	/** A dictionary of attribute names and values. */
	attributes: Record<string, unknown>;
}

function editProfileUsageUsecase(_file: IfcFile, settings: EditProfileUsageSettings): void {
	const { usage, attributes } = settings;

	const cardinalPoint = attributes.CardinalPoint;
	if (cardinalPoint && cardinalPoint !== usage.get("CardinalPoint")) {
		updateCardinalPoint(usage, cardinalPoint);
	}

	for (const [name, value] of Object.entries(attributes)) {
		usage.set(name, value);
	}
}

/**
 * Edits the attributes of an `IfcMaterialProfileSetUsage` (Python:
 * `ifcopenshell.api.material.edit_profile_usage`).
 *
 * This is typically used to change the cardinal point of the profile. The cardinal
 * point represents whether the profile is extruded along the center of the axis line,
 * at a corner, at a shear center, at the bottom, top, etc.
 *
 * For more information about the attributes and data types of an
 * `IfcMaterialProfileSetUsage`, consult the IFC documentation.
 *
 * **Known gap:** actually changing `CardinalPoint` to a genuinely new value needs a
 * geometry-kernel-backed position calculation (`ifcopenshell.geom`/`util.shape.getX`/
 * `getY`), neither of which has any TS port yet -- this throws in that case (see
 * `TODOS.md`). Editing any other attribute, or setting `CardinalPoint` to its own
 * current value, is unaffected.
 *
 * @example
 * ```ts
 * const rel = api.material.assignMaterial(model, {
 *   material: materialSet, products: [beam], type: "IfcMaterialProfileSetUsage",
 * });
 * // Editing an attribute other than CardinalPoint always works:
 * api.material.editProfileUsage(model, {
 *   usage: rel.get("RelatingMaterial") as EntityInstance,
 *   attributes: { ReferenceExtent: 1 },
 * });
 * ```
 */
export const editProfileUsage = wrapUsecase("material.edit_profile_usage", editProfileUsageUsecase);
