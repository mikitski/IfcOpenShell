// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/georeference/edit_georeferencing.py` (src/ifcopenshell-python,
// 117 lines) -- part of this project's brand-new `api.georeference` module (see
// `./index.ts`'s own header comment). Edits the attributes of a map conversion,
// projected CRS, and (via the pset stand-in) IFC2X3's equivalent metadata.
//
// --- IFC4+ branch: fully functional, plain `setattr` ---
//
// `crs = file.by_type("IfcProjectedCRS")[0]; for name, value in projected_crs.items():
// setattr(crs, name, value)` and the identical shape for `coordinate_operation`/
// `IfcCoordinateOperation` -- both are plain, name-based attribute assignments on real,
// already-existing, multi-attribute entities (never a standalone defined-type value
// construction), so neither hits the primitive-layer gap this module's sibling files
// (`./addGeoreferencing.ts`) disclose. Ported directly via `.set(name, value)`.
//
// --- IFC2X3 branch: a REAL, CONFIRMED PYTHON BUG -- the wrapped value is computed and
// then silently discarded, ported VERBATIM (not "fixed") ---
//
// Read closely, not assumed from the surrounding comments/docstring: both loops below
// compute a wrapped value (`v = file.createIfcText(v)` / `file.createIfcLabel(v)` /
// `file.createIfcIdentifier(v)` for `projected_crs`; `file.createIfcReal(v)` /
// `file.createIfcLengthMeasure(v)` for `coordinate_operation`) and reassign it to the
// LOOP-LOCAL variable `v` -- but never write it back into the dict itself (no
// `projected_crs[k] = v` / `coordinate_operation[k] = v` anywhere in either loop). Both
// loops are followed immediately by `ifcopenshell.api.pset.edit_pset(file, crs,
// properties=projected_crs)` / `...properties=coordinate_operation)`, which is passed
// the ORIGINAL, UNMODIFIED dict -- every single one of these value-wrapping computations
// is genuinely dead code, its result thrown away. `edit_pset`'s own value-type inference
// (its 4-tier `get_primary_measure_type`, see `../pset/editPset.ts`'s own header comment)
// ends up doing the ACTUAL typing instead, using its own generic Python-type-based
// heuristic (`str` -> `IfcLabel` unconditionally, `float`/`int` -> `IfcReal`/`IfcInteger`)
// -- meaning e.g. a `"Description"` key, which this dead code appears to intend to type
// as `IfcText`, is actually typed as `IfcLabel` by `edit_pset`'s own tier-4 fallback, and
// `"Eastings"`/`"Northings"`/etc. end up `IfcReal`, not `IfcLengthMeasure`. This is a
// real, verified bug in real Python's own source (confirmed by reading both loops in
// full, not assumed from the docstring's more optimistic framing) -- ported here exactly
// as literally as TS allows: this port also computes a (would-be) wrapped value inside
// the loop and never writes it anywhere, then calls `editPset` with the original,
// unmodified `properties`/`coordinateOperation` objects, faithfully reproducing the dead
// computation's complete lack of effect.
//
// --- Consequently: ALSO fully blocked by the SAME primitive-layer gap
// `./addGeoreferencing.ts`'s own header comment discloses (this module's tenth
// documented `TODOS.md` consequence, immediately following that file's ninth) --
// and, subtly, the throw happens INSIDE the dead-code loop itself, never reaching the
// `editPset` call below it at all ---
//
// Even setting the dead-code bug aside, this branch would still be blocked -- but not at
// `edit_pset` (which, per the bug above, never even receives a wrapped value): the dead
// computation itself (`file.createEntity("IfcLabel"/"IfcText"/"IfcIdentifier"/"IfcReal"/
// "IfcLengthMeasure", v)`) is a standalone, VALUED simple/defined-type construction --
// the identical blocked primitive as `./addGeoreferencing.ts`'s own
// `file.createEntity("IfcLengthMeasure", 0)` calls. So for any non-empty
// `projectedCrs`/`coordinateOperation`, this port throws on the very FIRST loop
// iteration, before `editPset` is ever reached at all (confirmed empirically against
// this worktree's own built native addon before writing this file). Ported completely
// and faithfully anyway: the real `get_pset`/`file.by_id` pset-lookup steps run to
// completion (fully functional, no gap involved), and the loop that computes-then-
// discards the wrapped value is preserved verbatim as prescribed above, left to fail
// naturally at its own first iteration -- no proactive guard.
// `test/api/georeference/editGeoreferencing.test.ts` pins this CURRENT, disclosed,
// blocked behavior with a dedicated IFC2X3 test.
//
// --- Schema divergence ---
//
// `IfcProjectedCRS`/`IfcCoordinateOperation` don't exist on IFC2X3 at all -- see
// `./addGeoreferencing.ts`'s own header comment for the full confirmation against the
// generated `.d.ts`s; this file's IFC2X3 branch never touches those classes directly,
// only the `ePSet_ProjectedCRS`/`ePSet_MapConversion` pset stand-ins.

import type { IfcFile } from "../../file";
import { getPset } from "../../util/element";
import { wrapUsecase } from "../hooks";
import { type PropertyValue, editPset } from "../pset/editPset";

export interface EditGeoreferencingSettings {
	/**
	 * The dictionary of attribute names and values you want to edit on the
	 * `IfcCoordinateOperation` (`IfcMapConversion`/etc). On IFC2X3, `MapUnit` should be
	 * a full unit name (a plain string); on other IFC versions it's an `IfcNamedUnit`.
	 */
	coordinateOperation?: Record<string, unknown> | null;
	/** The `IfcProjectedCRS` dictionary of attribute names and values you want to edit. */
	projectedCrs?: Record<string, unknown> | null;
}

function editGeoreferencingUsecase(file: IfcFile, settings: EditGeoreferencingSettings = {}): void {
	const { projectedCrs, coordinateOperation } = settings;

	if (file.schema === "IFC2X3") {
		const project = file.byType("IfcProject")[0];

		if (projectedCrs) {
			const crsPset = getPset(project, "ePSet_ProjectedCRS") as Record<string, unknown> | null;
			if (crsPset) {
				const crs = file.byId(crsPset.id as number);
				// See this file's header comment: real Python computes a wrapped value here
				// and NEVER writes it back into `projectedCrs` -- a confirmed dead-code bug,
				// reproduced verbatim (the loop body has no observable effect on
				// `projectedCrs` itself).
				for (const [k, v] of Object.entries(projectedCrs)) {
					if (k === "Description") {
						file.createEntity("IfcText", v);
					} else if (k === "Name") {
						file.createEntity("IfcLabel", v);
					} else if (v !== null && v !== undefined) {
						file.createEntity("IfcIdentifier", v);
					}
				}
				// Blocked by the same primitive-layer gap `./addGeoreferencing.ts`'s own
				// header comment discloses -- see this file's own header comment. Left to
				// fail naturally, no proactive guard.
				editPset(file, { pset: crs, properties: projectedCrs as Record<string, PropertyValue> });
			}
		}

		if (coordinateOperation) {
			const conversionPset = getPset(project, "ePSet_MapConversion") as Record<string, unknown> | null;
			if (conversionPset) {
				const conversion = file.byId(conversionPset.id as number);
				// See this file's header comment: same dead-code bug as above.
				for (const [k, v] of Object.entries(coordinateOperation)) {
					if (k === "XAxisAbscissa" || k === "XAxisOrdinate" || k === "Scale") {
						file.createEntity("IfcReal", v);
					} else {
						file.createEntity("IfcLengthMeasure", v);
					}
				}
				editPset(file, { pset: conversion, properties: coordinateOperation as Record<string, PropertyValue> });
			}
		}
		return;
	}

	if (projectedCrs) {
		const crs = file.byType("IfcProjectedCRS")[0];
		for (const [name, value] of Object.entries(projectedCrs)) {
			crs.set(name, value);
		}
	}
	if (coordinateOperation) {
		const conversion = file.byType("IfcCoordinateOperation")[0];
		for (const [name, value] of Object.entries(coordinateOperation)) {
			conversion.set(name, value);
		}
	}
}

/**
 * Edits the attributes of a map conversion, projected CRS, and true north (Python:
 * `ifcopenshell.api.georeference.edit_georeferencing`).
 *
 * Setting the correct georeferencing parameters is a complex topic and should ideally be
 * done with three parties present: the lead architect, surveyor, and a third-party
 * digital engineer with expertise in IFC to moderate.
 *
 * **On IFC2X3, this is currently blocked** by both a real, confirmed, dead-code bug in
 * real Python's own source (a computed wrapped value is silently discarded -- see this
 * file's own header comment) and, independently, by the same primitive-layer gap
 * `./addGeoreferencing.ts`'s own header comment discloses. The IFC4+ path (plain
 * `setattr`-equivalent `.set()` calls on real entities) is fully functional.
 *
 * @example
 * ```ts
 * api.georeference.editGeoreferencing(model, {
 *   projectedCrs: { Name: "EPSG:7856" },
 *   coordinateOperation: { Eastings: 335087.17, Northings: 6251635.41 },
 * });
 * ```
 */
export const editGeoreferencing = wrapUsecase("georeference.edit_georeferencing", editGeoreferencingUsecase);
