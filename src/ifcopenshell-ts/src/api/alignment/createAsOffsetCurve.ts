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
// --- Real logic runs BEFORE hitting the (formerly) disclosed `.Dim` blocker ---
//
// Real Python creates the `IfcAlignment` entity (a real `guid.new()`, a real
// `IfcAlignment` in the file) BEFORE calling `_create_offset_curve_representation` --
// so a real `IfcAlignment` genuinely exists in the file regardless of whatever
// `_createOffsetCurveRepresentation` itself goes on to do. `_createOffsetCurveRepresentation`'s
// own real, portable `offsets[i].isA()` type-checking loop ALSO runs for real first --
// an `offsets` element that isn't an `IfcPointByDistanceExpression` throws a real,
// fully-portable `TypeError` from INSIDE that already-landed dependency, with the
// `IfcAlignment` already created (but not yet aggregated to the project) -- ported
// everything faithfully, no proactive guard added here.
//
// **UPDATE (Phase EX-2, IFC4X3's own SECOND `calc_*`-porting chunk): the
// `basisCurve.get("Dim")` read inside `_createOffsetCurveRepresentation` no longer
// throws for IFC4X3** (`calc_IfcCurve_Dim` is now ported there) -- so
// `createAsOffsetCurve` itself now completes successfully end-to-end for a valid
// `offsets` list, returning a real `IfcAlignment` (aggregated to the project, if one
// exists), matching real Python's own success path. At that point, `.Dim` always
// resolved to `runtimeShim.INDETERMINATE` for a realistic basis curve (via the
// then-still-unported `calc_IfcPoint_Dim`), so the representation this function built
// was always the 2D-shaped one, regardless of the real curve's dimensionality -- a
// disclosed latent gap in the dependency this function delegates to, not this file's
// own concern to fix.
//
// **UPDATE AGAIN (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/
// ifc4x3.ts`): that latent gap is now closed for real.** `calc_IfcPoint_Dim` is now
// ported -- `_createOffsetCurveRepresentation`'s own `basisCurve.get("Dim")` read now
// resolves to the REAL dimensionality, so `createAsOffsetCurve` now correctly builds a
// 3D-shaped representation for a 3D basis curve and a 2D-shaped one for a 2D basis
// curve -- inherited automatically from its own dependency's fix, re-verified directly
// against the real built addon, not assumed.
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
