// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create_as_offset_curve.py` (src/ifcopenshell-
// python, 58 lines) -- see `./index.ts`'s own header comment for this brand-new
// module's full scope (chunk 7 of many). PUBLIC (confirmed present in real Python's
// own `__init__.py` `__all__`). Depends on this module's own already-landed
// `_createOffsetCurveRepresentation` (chunk 6, `./_createOffsetCurveRepresentation.ts`)
// and already-landed `api.aggregate.assignObject` (`../aggregate/assignObject.ts`) --
// both verified against their real exported name/signature before use.
//
// --- Real logic runs BEFORE hitting the already-disclosed `.Dim` blocker ---
//
// Real Python creates the `IfcAlignment` entity (a real `guid.new()`, a real
// `IfcAlignment` in the file) BEFORE calling `_create_offset_curve_representation` --
// so a real `IfcAlignment` genuinely exists in the file by the time
// `_createOffsetCurveRepresentation`'s own already-disclosed `basisCurve.get("Dim")`
// throw (see that file's own header comment; the SAME pre-existing `entityInstance.ts`
// EXPRESS DERIVED-attribute gap `TODOS.md`'s very first entry in this family already
// tracks) is reached. `_createOffsetCurveRepresentation`'s own real, portable
// `offsets[i].isA()` type-checking loop ALSO runs for real before that throw -- an
// `offsets` element that isn't an `IfcPointByDistanceExpression` throws a real,
// fully-portable `TypeError` from INSIDE that already-landed dependency, with the
// `IfcAlignment` already created (but not yet aggregated to the project) -- ported
// everything faithfully, no proactive guard added here.
//
// --- Real, CONFIRMED Python quirk: `start_station` is accepted but NEVER used ---
//
// Real Python's own signature is `create_as_offset_curve(file, name, offsets,
// start_station: float = 0.0)`, and its docstring documents `start_station` as "station
// value at the start of the alignment" -- but `start_station` is NEVER referenced
// anywhere in the function's own 30-line body (confirmed by reading the whole file: no
// stationing referent of any kind is created here, unlike `create_as_polyline.py`'s own
// `start_station`, which IS genuinely used to build a stationing referent -- see
// `./createAsPolyline.ts`'s own header comment). This is a real, dead/ignored
// parameter, not a translation slip -- ported verbatim (the parameter is accepted,
// typed, and simply never read), not silently dropped or "fixed" to actually use it.
//
// --- Real, disclosed TS-vs-Python divergence: an empty `IfcProject` list ---
//
// Real Python's `project = file.by_type("IfcProject")[0]` raises a Python `IndexError`
// immediately if the file has no `IfcProject` at all -- the `if project:` check
// afterward is therefore only ever reached with a real (truthy) `project`, i.e. it
// never actually guards against a missing project in practice (the crash already
// happened one line earlier). This port's `file.byType("IfcProject")[0]` instead
// evaluates to `undefined` for an empty file, with NO throw -- so `if (project)` here
// is genuinely load-bearing in a way real Python's own equivalent-looking check isn't:
// a file with no `IfcProject` at all returns a real, valid, un-aggregated `IfcAlignment`
// instead of crashing. A narrow, deliberate divergence (JS array indexing vs. Python
// list indexing), not "fixed" to also throw, since throwing here would be inventing
// behavior real Python doesn't actually have either (its own crash is an accident of
// list indexing, not a deliberate validation this function performs).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { assignObject as assignAggregateObject } from "../aggregate/assignObject";
import { _createOffsetCurveRepresentation } from "./_createOffsetCurveRepresentation";

/**
 * Creates a new `IfcAlignment` with an `IfcOffsetCurveByDistances` representation
 * (Python: `ifcopenshell.api.alignment.create_as_offset_curve`).
 *
 * The `IfcAlignment` is aggregated to `IfcProject`.
 *
 * @param file The file.
 * @param name Assigned to `IfcAlignment.Name`.
 * @param offsets Offsets from the basis curve that define the offset curve, expected to
 *   be `IfcPointByDistanceExpression`s.
 * @param startStation Station value at the start of the alignment -- see this file's
 *   own header comment: real Python accepts, but never actually uses, this parameter.
 * @returns The new `IfcAlignment`.
 * @throws {TypeError} If any `offsets` element is not an `IfcPointByDistanceExpression`
 *   (from the already-landed `_createOffsetCurveRepresentation`).
 * @throws {Error} At the exact point real Python's own `basis_curve.Dim` read would need
 *   the (not-yet-implemented) EXPRESS DERIVED-attribute machinery -- see
 *   `_createOffsetCurveRepresentation.ts`'s own header comment.
 */
export function createAsOffsetCurve(
	file: IfcFile,
	name: string,
	offsets: readonly EntityInstance[],
	startStation = 0.0,
): EntityInstance {
	const alignment = file.createEntity("IfcAlignment", guid.new(), null, name);

	_createOffsetCurveRepresentation(file, alignment, offsets);

	// IFC 4.1.4.1.1 Alignment Aggregation To Project
	const project = file.byType("IfcProject")[0];
	if (project) {
		assignAggregateObject(file, { products: [alignment], relatingObject: project });
	}

	return alignment;
}
