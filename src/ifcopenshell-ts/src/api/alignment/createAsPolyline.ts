// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/alignment/create_as_polyline.py` (src/ifcopenshell-python,
// 160 lines) -- see `./index.ts`'s own header comment for this brand-new module's full
// scope (chunk 7 of many). PUBLIC (confirmed present in real Python's own
// `__init__.py` `__all__`). Depends on this module's own already-landed
// `_createPolylineRepresentation` (chunk 6, `./_createPolylineRepresentation.ts`) and
// already-landed `addStationingReferent` (chunk 4, `./addStationingReferent.ts`),
// already-landed `util.alignment.stationAsString` (`../../util/alignment.ts`), and
// already-landed `api.aggregate.assignObject` (`../aggregate/assignObject.ts`) -- all
// verified against their real exported name/signature before use.
//
// --- A GENUINELY CONFIRMED FINDING that corrects this chunk's own original task brief:
//     real Python's own private `_create_layout` helper is DEAD CODE, never called ---
//
// The task brief that scoped this chunk described `_create_layout` as if it were part
// of `create_as_polyline`'s own real call chain, with its own "EARLIER `points[0].Dim`-
// shaped check". Reading the real 160-line file in full, and grepping the ENTIRE real
// Python source tree (`grep -rn "_create_layout" .` from `ifcopenshell/api/alignment/`
// and from the whole `ifcopenshell-python` tree), shows `_create_layout` is defined
// (lines 33-119) but is NEVER called anywhere -- not by `create_as_polyline` itself
// (whose own body only calls `_create_polyline_representation`, then
// `add_stationing_referent`, then `aggregate.assign_object`), not by
// `__init__.py`, and not by any other file in the whole real Python module. This is
// genuine, confirmed dead/orphaned code (its own docstring even hints at this: "I
// don't believe it is required for polylines, but the validation service gives an
// error if the alignment doesn't have a layout" -- describing a validation-service
// requirement `create_as_polyline` itself never actually satisfies, since the helper
// meant to satisfy it is never invoked). Given this, `_create_layout` is deliberately
// NOT ported here at all: porting an entire never-reachable
// `IfcAlignmentHorizontal`/`IfcAlignmentVertical` layout-construction implementation
// (with its own `points[0].Dim` check, its own segment-by-segment loop) would be real,
// unjustifiable scope creep for code that provably never runs in real Python either --
// this disclosure directly corrects, rather than blindly follows, this chunk's own
// task brief, per this project's "verify everything yourself" discipline.
//
// The task brief's underlying intuition -- that a real, EARLIER `points[0].Dim`-shaped
// check exists before `create_as_polyline` can succeed -- IS correct, just misattributed:
// it was `_createPolylineRepresentation.ts`'s OWN `points[0].get("Dim")` read (chunk 6,
// the SAME pre-existing `entityInstance.ts` EXPRESS DERIVED-attribute gap `TODOS.md`'s
// `api.cogo.editSurveyPoint` entry already tracks) -- not `_create_layout` (which is
// never reached at all).
//
// --- UPDATE (Phase EX-2, IFC4X3's own THIRD chunk, `src/express/rules/ifc4x3.ts`):
// that gap is now closed for real ---
//
// `calc_IfcPoint_Dim` is now ported for IFC4X3 -- `_createPolylineRepresentation`'s own
// `points[0].get("Dim")` read now resolves to a real number instead of throwing, so
// `createAsPolyline` now runs to completion end-to-end: the stationing referent
// (`addStationingReferent`) and project aggregation ARE now reached for any real
// `points` input -- re-verified directly against the real built addon, not assumed.
// `createAsPolyline.test.ts`'s own former "throws"/"never reaches" tests are replaced
// with real, passing success tests.
//
// --- Real, disclosed TS-vs-Python divergence: same empty-`IfcProject` quirk as
//     `./createAsOffsetCurve.ts` ---
//
// See that file's own header comment for the full writeup (real Python's own
// `file.by_type("IfcProject")[0]` raises `IndexError` for an empty file, before its own
// `if project:` check is ever meaningfully reached; this port's `file.byType(...)[0]`
// evaluates to `undefined` instead, so `if (project)` here genuinely guards a
// currently-unreachable-in-real-Python case: an `IfcAlignment` with no `IfcProject` in
// the file at all).
//
// --- UPDATE (upstream sync chunk 3 of 4, upstream commit
//     `b5670c4fc5347ec5c2c621f3f53a1a737bd21d2b`): `startStation` is now OPTIONAL
//     (default `null`, meaning "no stationing referent"), not defaulted to `0.0` ---
//
// See `TODOS.md`'s "Upstream sync, chunk 3 of 4" entry and
// `planning/ifcopenshell-ts/90-upstream-sync-plan.md` §4c for the full context. Real
// Python's own `start_station: Optional[float] = None` (previously `float = 0.0`) --
// the stationing referent is now only created when `startStation` is explicitly given
// (`!== null`), matching real Python's own `if start_station is not None:` guard. This
// function's own `_createPolylineRepresentation` call always runs first regardless (its
// own real geometry, unlike `create()`'s), so the referent it creates here -- when
// requested -- is placed correctly on the alignment's own already-real curve, unlike
// `create()`'s own now-removed automatic call (see `./create.ts`'s own header comment
// for why that one was reverted).
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { stationAsString } from "../../util/alignment";
import { assignObject as assignAggregateObject } from "../aggregate/assignObject";
import { _createPolylineRepresentation } from "./_createPolylineRepresentation";
import { addStationingReferent } from "./addStationingReferent";

/**
 * Creates a new `IfcAlignment` with an `IfcPolyline` representation (Python:
 * `ifcopenshell.api.alignment.create_as_polyline`).
 *
 * The `IfcAlignment` is aggregated to `IfcProject`.
 *
 * If `startStation` is given, a `STATION` `IfcReferent` named "<alignment name>
 * <station>" (e.g. "MyAlignment 49+00.00") is added at distance along `0.0` -- the same
 * naming convention `updateKeyPointReferents()` and `create()` use for their own
 * referents, so every referent nested under an alignment is identifiable by name
 * alone. If `null` (the default), no stationing referent is created.
 *
 * @param file The file.
 * @param name Assigned to `IfcAlignment.Name`.
 * @param points Sequence of points defining the polyline.
 * @param startStation Station value at the start of the alignment, or `null` for no
 *   stationing referent.
 * @returns The new `IfcAlignment`.
 */
export function createAsPolyline(
	file: IfcFile,
	name: string,
	points: readonly EntityInstance[],
	startStation: number | null = null,
): EntityInstance {
	const alignment = file.createEntity("IfcAlignment", guid.new(), null, name);

	_createPolylineRepresentation(file, alignment, points);

	// define stationing
	if (startStation !== null) {
		const referentName = `${alignment.get("Name") as string} ${stationAsString(file, startStation)}`;
		addStationingReferent(file, referentName, alignment, 0.0, startStation);
	}

	// IFC 4.1.4.1.1 Alignment Aggregation To Project
	const project = file.byType("IfcProject")[0];
	if (project) {
		assignAggregateObject(file, { products: [alignment], relatingObject: project });
	}

	return alignment;
}
