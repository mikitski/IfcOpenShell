// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/regenerate_wall_representation.py` (src/ifcopenshell-python,
// 646 lines) -- the LAST portable file in `api.geometry` (28 of ~29 real files landed before this
// chunk; `add_representation.py`, the one remaining real file, imports `bpy`/`bmesh`/`mathutils`
// and is permanently, genuinely Blender-only -- see `./index.ts`'s own updated header comment for
// this module's final scope). Regenerates a standard (case) wall's body + axis representation,
// taking into account material-layer-set thicknesses/priorities and `IfcRelConnectsPathElements`
// connections (notches, butts, mitres) to other walls.
//
// *** Branch structure, mapped completely before writing any code ***
//
// `createRegeneratorContext` (Python: `Regenerator.__init__`): resolves the "Model"/"Body"/
// "MODEL_VIEW" context (`ctx.body`, possibly `null` -- see Finding 5 below) and the "Plan"/"Axis"/
// "GRAPH_VIEW" context (`ctx.axis`, auto-created via `addContext` if missing -- the ONE context
// this function ever creates on its own), plus `unitScale`.
//
// `regenerate` (Python: `Regenerator.regenerate`), in real Python's own exact order:
// 1. Resolve `fallbackLength`/`fallbackHeight`/`fallbackAngle` (SI -> project units).
// 2. `getLayers(wall)` -- if the wall has no `IfcMaterialLayerSet` (`getMaterial(wall,
//    shouldSkipUsage=true)`), return `undefined` immediately. **This is the ONLY early-return,
//    fully-functional path this function has** -- every other real invocation eventually reaches
//    one of the 2 unconditional primitive-layer blockers below (Finding 1).
// 3. Compute the reference line (`getReferenceLine`), this wall's own `WallVectors`
//    (`getWallVectors`, which also decides `isAngled`), and its layered cross-section axes
//    (`getAxes`).
// 4. Walk `wall.ConnectedTo`/`ConnectedFrom` (`IfcRelConnectsPathElements` only), combining layer
//    priorities (`combineLayers` -- see Finding 2, a REAL, severe, reachable bug) and calling
//    `join` for each valid connection, accumulating `startPoints`/`endPoints`/`atpathPoints`/
//    `splitPoints`/`maxpathPoints`/`minpathPoints` as mutable mutable-state side effects.
// 5. Default `startPoints`/`endPoints` to the wall's own 4 corners if no connection populated
//    them; canonicalise both to the +Y direction.
// 6. Build the body solid: EITHER a single sloped extrusion + boolean-differenced end/atpath caps
//    (`isAngled`), OR one-or-more straight vertical extrusions from a (possibly composite,
//    `IfcCompositeProfileDef`) 2D profile assembled from `startPoints`/`endPoints`/`splitPoints`/
//    `maxpathPoints`/`minpathPoints` (`!isAngled`) -- see Finding 1 for why EVERY real call
//    reaches an unconditional throw somewhere in this step, on every schema.
// 7. Apply any manually-tracked `BBIM_Boolean` clippings (`getManualBooleans`, called a SECOND,
//    independent time here -- see Finding 3).
// 8. Build/replace the body `IfcShapeRepresentation`, then the axis `IfcShapeRepresentation`
//    (a single, un-closed 2-point polyline from `referenceP1` to `referenceP2` -- the one
//    `ShapeBuilder.polyline` call in this whole file that is NOT itself blocked by Finding 1's own
//    `IfcLineIndex`/`IfcArcIndex` gap, since it is never `closed`/never has `arcPoints` -- see
//    Finding 1's own "reachability" note for why this is never actually exercised today anyway).
// 9. If `referenceP1` moved away from the origin (and there are no manual booleans), re-anchor the
//    wall's own object placement to `referenceP1` (preserving the world position of every child
//    placement via `editObjectPlacement`'s own `shouldTransformChildren` machinery).
//
// `join` (Python: `Regenerator.join`) computes, for ONE `IfcRelConnectsPathElements` connection
// between `wall1` (always the outer `wall`) and `wall2`: transforms `wall2`'s own axes/reference
// line/`y`/`z` vectors into `wall1`'s local coordinate frame (`inv(getLocalPlacement(wall1
// .ObjectPlacement)) @ getLocalPlacement(wall2.ObjectPlacement)`), bails out early for
// `"NOTDEFINED"` connections, a parallel `axis2`, or an `"ATPATH"`+`"ATPATH"` pair, then dispatches
// on `(connection1, connection2)` into exactly ONE of 3 mutually exclusive shapes: `connection1 ==
// "ATPATH"` (wall2 crosses THROUGH wall1's own path -- builds `atpathPoints`/`splitPoints`/
// `maxpathPoints`/`minpathPoints`), `connection2 == "ATPATH"` (wall1 crosses through wall2's own
// path -- sets `startPoints`/`endPoints` at one end of wall1), or neither (an ordinary end-to-end
// mitre join at one end of wall1, via a real, intentionally-ambiguous-per-bSI priority-driven
// walk across both walls' own layer boundaries).
//
// `getLayers`/`combineLayers`/`getWallVectors`/`getJoinVector`/`getAxes`/`getManualBooleans`
// (Python: `Regenerator`'s remaining private methods) are pure(-ish) helper functions -- flattened
// to module-level, per this port's established convention for a file of this size/complexity
// (matching the 3 immediately-preceding `addWindowRepresentation.ts`/`addDoorRepresentation.ts`/
// `addRailingRepresentation.ts` chunks). Real Python's `Regenerator` class's own mutable
// per-call instance state (`self.reference_p1`/`self.wall_vectors`/`self.start_points`/etc.) is
// modelled here as an explicit `RegenerateState` object threaded through `regenerate`/`join` --
// this state-threading is inherent to the algorithm (many fields genuinely accumulate across the
// `ConnectedTo`/`ConnectedFrom` loop's own repeated `join` calls), not an artifact of OOP kept
// around for no reason, so an explicit mutable state object (rather than hidden `this` fields) is
// the more TS-idiomatic, equally-faithful translation.
//
// *** Finding 1 (the big one): EVERY real invocation with a valid `IfcMaterialLayerSet` wall
// throws while building the actual body solid, on EVERY schema -- via the SAME 2 already-tracked
// `entityInstance.ts` primitive-layer gaps as `addWindowRepresentation`/`addDoorRepresentation`/
// `addRailingRepresentation`, reached here through a DIFFERENT, simpler code shape (no
// `TargetView` branching at all -- this function only ever builds ONE representation type: the
// wall's own body extrusion) ***
//
// Both the `isAngled` branch (a single `builder.polyline(points, closed=true, ...)` for the outer
// wall shape, optionally boolean-differenced with more `closed=true` polylines for end/atpath
// caps) and the `!isAngled` branch (one-or-more `builder.profile(builder.polyline(points,
// closed=true, ...))` calls per profile segment) call `ShapeBuilder.polyline(..., closed=true)`
// unconditionally, at least once, on every single path through this function that reaches this
// point (there is no branch that skips it). Traced precisely, confirmed by reading
// `util/shapeBuilder.ts`'s own header comment findings directly (not re-derived from scratch):
//   - On IFC4/IFC4X3: `polyline(closed=true)` throws immediately (`IfcLineIndex`/`IfcArcIndex`
//     defined-type-creation gap -- `TODOS.md`'s "`EntityInstance.setByIndex`/`IfcFile.createEntity`
//     cannot write an initial value into a freshly created simple/defined-type instance" entry).
//   - On IFC2X3: `polyline(closed=true)` succeeds (no `IfcLineIndex`/`IfcArcIndex` needed there at
//     all) -- but the VERY NEXT step always hits the OTHER gap: the `isAngled` branch's
//     `builder.extrude(polylineResult, ...)` internally calls `this.profile(polylineResult)`
//     (since a bare polyline isn't already an `IfcProfileDef`), and the `!isAngled` branch calls
//     `builder.profile(...)` directly -- either way, `profile()`'s own unconditional
//     `outerCurve.get("Dim")` check (an EXPRESS DERIVED attribute `entityInstance.ts` cannot
//     resolve, per `util/representation.ts`'s `guessType` finding) throws, on EVERY schema
//     including IFC2X3.
// **Net effect: `regenerateWallRepresentation` throws for every wall with a real
// `IfcMaterialLayerSet`, on every schema, the moment it tries to build the body solid** -- there is
// no `isAngled`/schema/connection combination that avoids both gaps, matching
// `addRailingRepresentation`'s own "blocked on literally every input" finding rather than
// `addWindowRepresentation`/`addDoorRepresentation`'s own "most real-world inputs" one. Because the
// body-representation step always throws first, the LATER, independently-blocked axis-line
// `builder.getRepresentation(ctx.axis, [axisItem])` call (which, with no explicit
// `representationType`, falls back to the SAME already-disclosed `guessType`'s own `Dim` gap for
// its own `IfcPolyline`/`IfcIndexedPolyCurve` item) is never actually reached in practice today --
// disclosed for completeness (and future-proofing once the 2 gaps above are fixed), not given its
// own separate regression test since it is genuinely unreachable while Finding 1's own throw fires
// first.
//
// Fully, faithfully ported anyway, per this project's established discipline: every branch --
// `isAngled`'s end/atpath-cap boolean differencing, `!isAngled`'s composite-profile assembly from
// `splitPoints`/`maxpathPoints`/`minpathPoints`, the final body/axis representation
// replace-or-assign logic, the placement re-anchoring step -- is real, correct, verbatim-translated
// control flow, reachable end-to-end the moment `entityInstance.ts` grows EXPRESS DERIVED-attribute
// support and freshly-created-defined-type initial-value support (both already tracked), with zero
// further changes needed here. The wall-with-no-material-layer-set early return, and every PURE
// layer/axis/join computation (Finding 1 never touches `ShapeBuilder` until well after `join`'s own
// loop completes -- `join` itself does no entity creation at all), are genuinely, fully UNBLOCKED
// today and are this file's own primary test-coverage target, matching `addRailingRepresentation`'s
// own "pure-compute layer is unblocked, thin IFC-wrapping layer on top is not" shape (even though,
// unlike that file, this one was never deliberately split that way in real Python -- it just
// happens to have the identical property once traced).
//
// **UPDATE (Phase EX-2 chunks 1+2, `planning/ifcopenshell-ts/70-express-rules-plan.md` §4) --
// Finding 1 is now RESOLVED FOR IFC2X3, UNCHANGED for IFC4/IFC4X3.** `entityInstance.ts`'s
// DERIVE dispatch now resolves `IfcCurve.Dim`/`IfcElementarySurface.Dim`/etc. for real IFC2X3
// geometry (see `TODOS.md`'s "`util.representation.guessType`'s `Curve2D`/... branches..."
// entry). On IFC2X3, `profile()`'s own `outerCurve.get("Dim")` check now succeeds instead of
// throwing, so `regenerateWallRepresentation` completes end-to-end for every connection shape
// this file's own tests exercise (verified against the real, built native addon) -- Finding 2
// (below) remains a real, separate, still-reachable crash for the specific non-empty-
// `RelatingPriorities` case it describes, independent of Finding 1's own resolution. IFC4/IFC4X3
// are unaffected -- `polyline(closed=true)` still throws first there, exactly as documented
// above. `regenerateWallRepresentation.test.ts` has been updated accordingly; this header's own
// narrative above is left intact as the ORIGINAL, still-accurate-for-IFC4/IFC4X3 description.
//
// *** Finding 2 (a REAL, severe, reachable bug -- not a primitive-layer gap): `combineLayers`
// attempts to mutate an immutable value whenever a connection actually specifies
// `RelatingPriorities`/`RelatedPriorities` ***
//
// Real Python's `PrioritisedLayer = namedtuple("PrioritisedLayer", "priority thickness")` is an
// IMMUTABLE tuple subclass. `combine_layers`'s own override-priorities loop, however, does:
// `for i, priority in enumerate(override_priorities[: len(layers)]): layers[i][0] = priority` --
// positional item-assignment on a `PrioritisedLayer` INSTANCE (not the list -- `layers[i]` IS the
// namedtuple), which namedtuples never support (`TypeError: 'PrioritisedLayer' object does not
// support item assignment`), confirmed directly against Python's own namedtuple semantics (a
// `collections.namedtuple` instance is a plain immutable tuple subclass with no `__setitem__`
// override). `RelatingPriorities`/`RelatedPriorities` (`IfcRelConnectsPathElements`'s own real
// `LIST [0:?] OF INTEGER` attributes) are ordinary, real IFC data -- a model author overriding
// layer join priorities on a wall connection is not a contrived edge case. **So: any real
// `IfcRelConnectsPathElements` relationship that actually specifies a non-empty
// `RelatingPriorities`/`RelatedPriorities` override crashes `regenerate_wall_representation`
// (upstream, real Python) with an uncaught `TypeError`, before `join` is ever even called for that
// connection.** This is a genuine, disclosed, verbatim-preserved upstream-Python bug, not a TS-port
// gap -- reproduced here by representing `PrioritisedLayer` as a FROZEN plain object (matching
// every OTHER call site's own `.priority`/`.thickness` named-field access throughout this file --
// the overwhelmingly more common usage, versus Python's namedtuple ALSO supporting positional
// index access, which this file uses only in this one spot). `combineLayers`'s own override loop
// therefore attempts `layers[i].priority = priority` (the natural TS analogue of "mutate positional
// field 0, which is `priority`"), which -- on a frozen object, in strict-mode ES modules (every TS
// module here compiles to one) -- throws `TypeError: Cannot assign to read only property
// 'priority' of object '#<Object>'`, reproducing the exact crash CLASS and reachability (any
// override-priorities connection crashes), not Python's literal wording. Pinned by a dedicated
// test asserting this throw for a non-empty override list, and a separate test confirming the
// empty-override (the overwhelmingly common real case) path is fully functional and correct.
//
// *** Finding 3: `getManualBooleans` is called TWICE, independently, per `regenerate` call -- a
// real, disclosed, verbatim-preserved inefficiency, NOT consolidated ***
//
// `manual_booleans = self.get_manual_booleans(wall)` (line 144) is used only to decide `offset`
// (`None` if any manual booleans exist, since they'd otherwise be shifted along with everything
// else) and the final placement-re-anchoring guard. Line 333's `for boolean in
// self.get_manual_booleans(wall):` is a SEPARATE, independent re-fetch (re-reading + re-parsing
// the identical `BBIM_Boolean` pset JSON + re-resolving each `IfcBooleanClippingResult` by STEP id)
// used to actually chain the booleans onto the freshly-built body solid. Since nothing in between
// modifies the `BBIM_Boolean` pset, both calls always return equal (by value) results -- wasteful,
// but harmless. Per this port's "preserve real Python's own inefficiencies/quirks verbatim, don't
// silently optimize" discipline: this port makes the identical 2 separate `getManualBooleans` calls
// (`manualBooleans` computed once near the top; a second, independent call inside the
// booleans-application loop near the bottom), not consolidated into one.
//
// *** Finding 4 (a real, subtle, verbatim-preserved control-flow quirk deep inside `join`'s own
// mitre-join branch): the equal-priority merge step advances the shared axes2 iterator but
// discards the result instead of updating the retained `axis2` reference ***
//
// The `else` (mitre-join, neither wall is `"ATPATH"`) branch's own equal-priority case reads:
// `x = intersect_x_axis_2d(*next(axes2), y=y)` -- this call DOES advance the shared `axes2`
// iterator (consuming one element), but its RESULT is used only as a throwaway positional argument
// to `intersect_x_axis_2d`; the persistent `axis2` variable (read by the OTHER 2 branches of the
// very same `while` loop) is never reassigned to this newly-consumed value. So immediately after an
// equal-priority merge, `axis2` is one element BEHIND where the iterator itself has advanced to --
// if the very next loop iteration takes the `layer2.priority > layer1.priority` branch (which reads
// the STALE, retained `axis2`), it uses an axis that is no longer "in sync" with the freshly-
// advanced `y`/layer counters. This is a genuine, real Python-source quirk (easy to misread as a
// harmless local-variable-naming choice at a glance), reproduced here VERBATIM: the equal-priority
// branch below calls `axes2Iter.next()` into a fresh, throwaway local (`nextAxis2`) used only for
// that one `intersectXAxis2d` call, deliberately NOT reassigning the retained `axis2c` variable the
// other 2 branches read.
//
// *** Finding 5 (real, disclosed, currently UNREACHABLE given Finding 1's own earlier throw): the
// "Model"/"Body"/"MODEL_VIEW" context is never auto-created, unlike "Plan"/"Axis"/"GRAPH_VIEW" ***
//
// `createRegeneratorContext` (Python: `Regenerator.__init__`) auto-creates the axis context via
// `addContext` if missing, but has NO equivalent fallback for the body context -- `ctx.body` can be
// `null` for a file that has never had a "Model"/"Body"/"MODEL_VIEW" subcontext registered. Real
// Python's own `builder.get_representation(self.body, items=[item])` would then crash with
// `AttributeError: 'NoneType' object has no attribute 'ContextIdentifier'` (this port's own
// `getRepresentation` throws the TS/JS equivalent, `TypeError: Cannot read properties of null`,
// for the identical reason). This asymmetry is real and worth documenting, but -- confirmed by
// tracing every code path -- is currently UNREACHABLE in practice: Finding 1's own throw always
// fires first, while building the body SOLID, well before `ctx.body` is ever dereferenced. Not
// given its own dedicated test for that reason (there is no way to observe this specific crash
// point today without first resolving Finding 1); documented here for whoever eventually fixes
// Finding 1's own 2 gaps.
//
// *** Explicit check (per this port's own required process): does the `Usecase.settings`-accessed-
// before-assignment evaluation-order bug from `addWindowRepresentation`/`addDoorRepresentation`
// apply here? NO -- traced directly, not assumed ***
//
// `regenerate_wall_representation` is a PLAIN module-level function that immediately delegates to
// `Regenerator(file).regenerate(wall, length=length, height=height, angle=angle)`. `Regenerator` IS
// a real class (unlike `addRailingRepresentation`'s file, which has none at all), but it does NOT
// use the `Usecase.settings`-dict-accessed-via-a-method pattern window/door's own bug depends on --
// `Regenerator.__init__` assigns `self.unit_scale = calculate_unit_scale(file)` directly and
// immediately (a plain instance attribute, assigned unconditionally, before anything could read
// it), and `regenerate`'s own `length`/`height`/`angle` are ordinary Python function default
// parameters (`length: float = 1.0`, evaluated normally at call time), never routed through a
// not-yet-assigned `self.settings` dict at all. Every `self.*` attribute this file reads is always
// assigned strictly before it is ever read (verified by tracing `regenerate`'s own body from its
// very first line). **This bug class does not apply here.**
//
// *** `BBIM_Boolean`: confirmed this file only READS it (`getManualBooleans` -> `getPset`), never
// creates/writes it -- the previously-disclosed `editPset`/`addPset` "cannot write an initial value
// into a freshly created defined-type instance" gap (`clipSolid.ts`'s/`clipSolidBounded.ts`'s own
// disclosed blocker) does NOT apply here at all ***
//
// `getManualBooleans` calls `elementUtil.getPset(element, "BBIM_Boolean")` (a pure READ) and, on a
// hit, `JSON.parse` + `file.byId` per tracked boolean id -- there is no `editPset`/`addPset` call
// anywhere in this file. `getManualBooleans` is therefore fully functional on every schema,
// independent of Finding 1's own blockers, and independent of `clipSolid`'s own already-disclosed
// write-side gap.
//
// *** Dead field, disclosed and omitted (matching `addWindowRepresentation.ts`'s own
// `overallDepth`/`addRailingRepresentation.ts`'s own precedent for preserving-but-flagging real
// Python dead code): `self.end_point = None` ***
//
// Assigned once (`regenerate`'s own line "self.end_point = None"), never read anywhere else in the
// whole 646-line file (confirmed by reading every line) -- a genuinely dead instance attribute in
// real Python (distinct from `self.end_points`, PLURAL, which is used extensively). Omitted from
// this port's `RegenerateState` entirely rather than carried as inert dead weight -- documented
// here rather than silently dropped.
//
// *** A real, disclosed "same name, different value" shadowing trap: `self.miny`/`self.maxy`
// (assigned once, near the top of `regenerate`, BEFORE the `join` loop) vs. a LOCAL `miny`/`maxy`
// (assigned once, AFTER the `join` loop, from a DIFFERENT pair of axes) ***
//
// `self.miny = axes[0][0][1]` / `self.maxy = axes[-1][0][1]` (the wall's OUTERMOST layer axes' own Y
// coordinates) are set once, immediately after `axes` is first computed, and read only inside
// `join`'s own `"ATPATH"` branch (categorising a crossing segment as a max-path/min-path cut).
// SEPARATELY, `miny = axes[-2][0][1]` / `maxy = axes[-1][0][1]` (note: the SECOND-TO-LAST axis, not
// the first) are LOCAL variables computed AFTER the `join` loop completes, read only much later, in
// the `!isAngled` branch's `if maxy < miny:` swap check. These 2 pairs happen to share Python
// variable names but refer to genuinely DIFFERENT axis rows (`self.maxy === local maxy` always,
// since both read `axes[-1][0][1]`, but `self.miny` (`axes[0]`) generally differs from local `miny`
// (`axes[-2]`) whenever there are more than 2 layers) -- a real, easy-to-misread shadowing trap in
// the original source. Named distinctly and unambiguously in this port: `state.minY`/`state.maxY`
// for the `self.*` pair, `localMinY`/`localMaxY` for the post-`join`-loop local pair.
//
// *** `util.representation`/`util.shape_builder`/`util.placement`/`util.element`/`util.unit`
// functions used, and their exact signatures verified directly against each module's own TS source
// (not assumed from the Python names alone) ***
//
// `getContext`/`getReferenceLine`/`getRepresentation`/`resolveRepresentation` (`util/
// representation.ts`) -- all already landed with matching signatures (`getReferenceLine`'s own
// `[readonly number[], readonly number[]]` 2-tuple return; `getRepresentation`'s `element,
// context: EntityInstance | ContextType, subcontext?, targetView?` shape, both call shapes used
// here -- `(wall, "Model", "Body", "MODEL_VIEW")` and `(wall, ctx.body)`/`(wall, ctx.axis)`).
// `ShapeBuilder.polyline`/`.profile`/`.extrude`/`.getRepresentation` (methods) plus the
// module-level `isX`/`npAngleSigned`/`intersectXAxis2d` free functions (`util/shapeBuilder.ts`) --
// `intersectXAxis2d`'s own real Python source (`shape_builder.py`'s `intersect_x_axis_2d`) returns
// `Optional[float]` for a parallel input pair, ALREADY the exact behavior this file's own real
// Python source relies on without any extra `None`-guarding of its own at any call site (a
// pre-existing, un-guarded latent hazard in real Python itself, not something this port needs to
// harden beyond what Python already does -- reproduced identically via a `number | undefined`
// return, cast through `as number` at each of this file's own call sites exactly where real
// Python's own un-guarded `x` local variable would be). `getLocalPlacement` (`util/placement.ts`).
// `getMaterial`/`getPset`/`replaceElement`/`removeDeep2` (`util/element.ts`) -- all already landed
// with matching signatures. `calculateUnitScale` (`util/unit.ts`). `addContext` (`api/context/
// addContext.ts`), `addBoolean`/`assignRepresentation`/`editObjectPlacement` (this same
// `api/geometry` module, all already landed) -- each call site here matches every one of those
// functions' own real, already-verified settings shape exactly (`addBoolean(file, {firstItem,
// secondItems})`; `assignRepresentation(file, {product, representation})`;
// `editObjectPlacement(file, {product, matrix, isSi, shouldTransformChildren})`).
//
// *** Entity classes created directly, verified against the generated `.d.ts`s *** -- this file
// creates exactly ONE entity class directly (every other entity is built exclusively through
// already-verified `ShapeBuilder` methods): `IfcCompositeProfileDef` (`ProfileType, ProfileName,
// Profiles, Label`, identical order confirmed across all 3 schemas' generated `.d.ts`s), called
// positionally as `("AREA", null, profiles)` (matching real Python's own `create_ifc_composite_
// profile_def("AREA", Profiles=profiles)`, which leaves `ProfileName`/`Label` at their defaults).
//
// `numpy`/`collections.namedtuple`: only plain elementwise 2/3-component vector math (`+`, `-`,
// `*` by a scalar, cross products, `.copy()`, min/max, `np.allclose`) plus one small immutable
// record type (`PrioritisedLayer`) -- ported as plain `number[]` arithmetic via small per-file
// helpers (matching `addWindowRepresentation.ts`'s/`addRailingRepresentation.ts`'s own established
// convention: no gl-matrix needed for these) and a frozen plain object (see Finding 2 above for why
// a frozen object, not a tuple, was chosen and why that choice is load-bearing here, not merely
// stylistic). The one genuinely 4x4-matrix-shaped operation in the whole file (`join`'s own
// `inv(matrix1) @ matrix2` wall-to-wall coordinate transform, and `regenerate`'s own final
// placement-re-anchoring `matrix[:, 3] = matrix @ concatenate(...)` column replace) DOES use
// `gl-matrix`'s `mat4` (already this project's runtime dependency), matching
// `editObjectPlacement.ts`'s own already-verified `mat4.invert`/`mat4.multiply` conventions
// directly (this file re-verifies nothing new here, just reuses that already-verified convention).
// Python's `next(iterator)`/`next(iterator, default)` calls throughout `join`'s own 3 branches are
// ported via a small local `ArrayIterator` helper class (`.next()` throws when exhausted, mirroring
// Python's bare `next()` raising `StopIteration`; `.nextOrNull()` mirrors `next(it, None)`) rather
// than raw index bookkeeping, specifically so an out-of-sync axes/layers array (a real invariant
// violation, not expected in practice given `get_axes`' own `len(axes) == len(layers) + 1`
// construction) throws loudly instead of silently reading `undefined`.

import { mat4, vec3 } from "gl-matrix";
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { type MatrixType, getLocalPlacement } from "../../util/placement";
import { getContext, getReferenceLine, getRepresentation, resolveRepresentation } from "../../util/representation";
import { ShapeBuilder, intersectXAxis2d, isX, npAngleSigned } from "../../util/shapeBuilder";
import { calculateUnitScale } from "../../util/unit";
import { addContext } from "../context/addContext";
import { wrapUsecase } from "../hooks";
import { addBoolean } from "./addBoolean";
import { assignRepresentation } from "./assignRepresentation";
import { editObjectPlacement } from "./editObjectPlacement";

// --- small local vector-math helpers (plain `number[]` arithmetic -- see this file's header
// comment for why these are duplicated per-file rather than imported from `util/shapeBuilder.ts`'s
// own private, unexported equivalents) ---

function vecSub(a: readonly number[], b: readonly number[]): number[] {
	return a.map((v, i) => v - b[i]);
}

function vecCross3(a: readonly number[], b: readonly number[]): number[] {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function vecLen(a: readonly number[]): number {
	return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
}

/** `np.allclose(a, b)` with numpy's own default `rtol=1e-5`/`atol=1e-8`. */
function allClose(a: readonly number[], b: readonly number[]): boolean {
	return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= 1e-8 + 1e-5 * Math.abs(b[i]));
}

/** `np.array((x, y)).__eq__`-by-value for a 2-element set comparison (`join`'s own `{a, b} ==
 * {c, d}` Python set-equality check). */
function ySetEquals(a: readonly [number, number], b: Set<number>): boolean {
	const setA = new Set(a);
	if (setA.size !== b.size) return false;
	for (const v of setA) if (!b.has(v)) return false;
	return true;
}

/** `matrix @ np.concatenate((point2d, (0, 1)))` -- applies a 4x4 (column-major, `gl-matrix`-flat)
 * affine matrix to a 2D point treated as the homogeneous 4-vector `[x, y, 0, 1]`, returning the
 * full 4-component result (matching real Python's own `matrix[:, 3] = matrix @ ...` full-column
 * replace, including the homogeneous `w` component -- always exactly 1 for a valid affine matrix,
 * but computed and assigned literally here for fidelity, matching Python's own literal `[:, 3]`
 * slice-assignment). Manual flat-index math (not `vec4.transformMat4`), matching
 * `util/shapeBuilder.ts`'s own established "manual flat-index column math" precedent
 * (`mat4LinearPartRowMajor`) rather than introducing a new library-call convention for this one
 * call site. */
function applyMatrixToHomogeneousPoint2d(
	matrix: MatrixType,
	point2d: readonly number[],
): [number, number, number, number] {
	const [x, y] = point2d;
	return [
		matrix[0] * x + matrix[4] * y + matrix[12],
		matrix[1] * x + matrix[5] * y + matrix[13],
		matrix[2] * x + matrix[6] * y + matrix[14],
		matrix[3] * x + matrix[7] * y + matrix[15],
	];
}

/** Python's `getattr(instance, name, None)`. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

/** A minimal reproduction of Python's iterator protocol for a plain array -- see this file's
 * header comment for why this (not raw index bookkeeping) is the faithful translation of `join`'s
 * own repeated `next(iterator)`/`next(iterator, default)` calls. */
class ArrayIterator<T> {
	private index = 0;
	constructor(private readonly items: readonly T[]) {}

	/** Python's `next(iterator)` (no default) -- throws when exhausted. */
	next(): T {
		if (this.index >= this.items.length) {
			throw new Error(
				"regenerateWallRepresentation: an internal axes/layers iterator was exhausted -- mirrors " +
					"Python's StopIteration from a bare next(iterator) call with no default (a real invariant " +
					"violation, not expected given getAxes' own construction).",
			);
		}
		return this.items[this.index++];
	}

	/** Python's `next(iterator, None)` -- returns `null` when exhausted instead of throwing. */
	nextOrNull(): T | null {
		if (this.index >= this.items.length) return null;
		return this.items[this.index++];
	}
}

/**
 * Python: `PrioritisedLayer = namedtuple("PrioritisedLayer", "priority thickness")`.
 *
 * A frozen plain object, NOT a tuple -- see this file's header comment (Finding 2) for why this
 * choice is load-bearing (it is what makes `combineLayers`'s own attempted mutation throw,
 * faithfully reproducing a real, severe, upstream-Python bug) rather than merely stylistic.
 */
interface PrioritisedLayer {
	readonly priority: number;
	readonly thickness: number;
}

function makePrioritisedLayer(priority: number, thickness: number): PrioritisedLayer {
	return Object.freeze({ priority, thickness });
}

/** Python: `Regenerator.get_wall_vectors`'s own returned `dict`. */
interface WallVectors {
	z: number[];
	y: number[];
	a: number;
	d: number;
	h: number;
}

/**
 * The mutable per-`regenerate`-call state real Python threads through `self.*` on a fresh
 * `Regenerator` instance -- see this file's header comment for why this is modelled as an
 * explicit object rather than hidden `this` fields.
 */
interface RegenerateState {
	fallbackLength: number;
	fallbackHeight: number;
	fallbackAngle: number | null;
	isAngled: boolean;
	wallVectors: WallVectors;
	referenceP1: number[];
	referenceP2: number[];
	/** Python: `self.miny`/`self.maxy` -- see this file's header comment for why these are named
	 * distinctly from `regenerate`'s own LATER, different-valued local `localMinY`/`localMaxY`. */
	minY: number;
	maxY: number;
	startPoints: number[][];
	startVector: number[];
	startOffset: number;
	atpathPoints: Array<[number[], number[][]]>;
	splitPoints: number[][][];
	maxpathPoints: number[][][];
	minpathPoints: number[][][];
	endPoints: number[][];
	endVector: number[];
	endOffset: number;
}

/**
 * Python: `Regenerator.get_layers` -- `getattr(l, "Priority", 0) or 0`, not a plain
 * `l.Priority` read: `IfcMaterialLayer.Priority` doesn't exist at all on IFC2X3 (only
 * added on IFC4+, see `../material/addLayer.ts`'s own header comment), and real
 * Python's `getattr(..., 0)` default absorbs that `AttributeError` on IFC2X3 rather
 * than raising -- ported via this file's own established `attrOrNull` helper (already
 * used above for the identical `getattr(x, name, None)` pattern), not a raw `.get()`
 * call, which would otherwise throw here for every IFC2X3 wall with a material layer
 * set.
 */
function getLayers(wall: EntityInstance): PrioritisedLayer[] {
	const material = elementUtil.getMaterial(wall, true);
	if (!material || !material.isA("IfcMaterialLayerSet")) return [];
	return (material.get("MaterialLayers") as EntityInstance[]).map((l) =>
		makePrioritisedLayer((attrOrNull(l, "Priority") as number | null) || 0, l.get("LayerThickness") as number),
	);
}

/**
 * Python: `Regenerator.combine_layers`.
 *
 * **See this file's header comment (Finding 2): throws whenever `overridePriorities` is
 * non-empty** -- a real, severe, verbatim-preserved upstream-Python bug (`layers[i][0] = priority`
 * attempting item-assignment on an immutable `PrioritisedLayer`), not a TS-port gap.
 */
function combineLayers(layersIn: PrioritisedLayer[], overridePriorities: readonly number[]): PrioritisedLayer[] {
	const layers = [...layersIn];
	if (overridePriorities.length > 0) {
		const overrides = overridePriorities.slice(0, layers.length);
		overrides.forEach((priority, i) => {
			// See this file's header comment (Finding 2): throws here on a frozen
			// `PrioritisedLayer`, reproducing real Python's own `TypeError` from
			// `layers[i][0] = priority` on an immutable namedtuple.
			(layers[i] as { priority: number }).priority = priority;
		});
	}
	if (layers.length === 0) return [];
	const results: PrioritisedLayer[] = [layers.shift() as PrioritisedLayer];
	for (const layer of layers) {
		if (!layer.thickness) continue;
		const last = results[results.length - 1];
		if (layer.priority === last.priority) {
			results[results.length - 1] = makePrioritisedLayer(layer.priority, last.thickness + layer.thickness);
		} else {
			results.push(layer);
		}
	}
	return results;
}

/** Python: `Regenerator.get_wall_vectors`. */
function getWallVectors(state: RegenerateState, wall: EntityInstance): WallVectors {
	const body = getRepresentation(wall, "Model", "Body", "MODEL_VIEW");
	if (body) {
		for (let item of resolveRepresentation(body).get("Items") as EntityInstance[]) {
			while (item.isA("IfcBooleanResult")) {
				item = item.get("FirstOperand") as EntityInstance;
			}
			if (item.isA("IfcExtrudedAreaSolid")) {
				const rawZ = (item.get("ExtrudedDirection") as EntityInstance).get("DirectionRatios") as number[];
				const zLen = vecLen(rawZ);
				const z = rawZ.map((v) => v / zLen);
				const y = vecCross3(z, [1.0, 0.0, 0.0]);
				const d = item.get("Depth") as number;
				const h = z[2] * d;
				const a = npAngleSigned([0.0, 1.0], [z[1], z[2]]);
				if (!isX(a, 0)) state.isAngled = true;
				return { z, y, a, d, h };
			}
		}
		// Falls through to the final default `return` below -- see this file's header
		// comment: real Python's own `elif self.fallback_angle:` branch is reachable ONLY
		// when NO body representation exists at all, NOT when one exists but contains no
		// `IfcExtrudedAreaSolid` item (a real control-flow subtlety, verified against the
		// exact source indentation, not assumed).
	} else if (state.fallbackAngle) {
		const a = state.fallbackAngle;
		const z = [0.0, Math.sin(a), Math.cos(a)];
		const y = vecCross3(z, [1.0, 0.0, 0.0]);
		const h = state.fallbackHeight;
		const d = vecLen(z.map((v) => v * (h / z[2])));
		if (!isX(a, 0)) state.isAngled = true;
		return { z, y, a, d, h };
	}
	return {
		z: [0.0, 0.0, 1.0],
		y: [0.0, 1.0, 0.0],
		a: 0.0,
		d: state.fallbackHeight,
		h: state.fallbackHeight,
	};
}

/** Python: `Regenerator.get_join_vector`. */
function getJoinVector(y1: readonly number[], y2: readonly number[]): number[] {
	const result = vecCross3(y1, y2);
	if (result[2] < 0) return result.map((v) => -v);
	return result;
}

/** Python: `Regenerator.get_axes`. */
function getAxes(
	wall: EntityInstance,
	reference: readonly [readonly number[], readonly number[]],
	layers: readonly PrioritisedLayer[],
	angle: number,
): number[][][] {
	const axes: number[][][] = [reference.map((p) => [...p])];
	let senseFactor = 1;
	const usage = elementUtil.getMaterial(wall);
	if (usage?.isA("IfcMaterialLayerSetUsage")) {
		const offsetFromReferenceLine = usage.get("OffsetFromReferenceLine") as number;
		for (const point of axes[0]) point[1] += offsetFromReferenceLine;
		senseFactor = usage.get("DirectionSense") === "POSITIVE" ? 1 : -1;
	}
	for (const layer of layers) {
		const yOffset = (layer.thickness * senseFactor) / Math.cos(angle);
		const prev = axes[axes.length - 1];
		axes.push(prev.map((p) => [p[0], p[1] + yOffset]));
	}
	return axes;
}

/**
 * Python: `Regenerator.get_manual_booleans`.
 *
 * A pure READ of the `BBIM_Boolean` pset -- see this file's header comment for why the
 * previously-disclosed `editPset`/`addPset` write-side gap does NOT apply here.
 */
function getManualBooleans(file: IfcFile, element: EntityInstance): EntityInstance[] {
	const pset = elementUtil.getPset(element, "BBIM_Boolean") as Record<string, unknown> | null;
	if (pset) {
		try {
			const ids = JSON.parse(pset.Data as string) as number[];
			return ids.map((id) => file.byId(id));
		} catch {
			return [];
		}
	}
	return [];
}

/**
 * Python: `Regenerator.join`. See this file's header comment for the full branch structure and
 * Finding 4 (the mitre-join branch's own stale-`axis2` quirk).
 */
function join(
	state: RegenerateState,
	wall1: EntityInstance,
	wall2: EntityInstance,
	layers1In: PrioritisedLayer[],
	layers2In: PrioritisedLayer[],
	connection1: string,
	connection2: string,
): void {
	if (connection1 === "NOTDEFINED" || connection2 === "NOTDEFINED") return;
	if (connection1 === "ATPATH" && connection2 === "ATPATH") return;

	const reference1 = getReferenceLine(wall1, state.fallbackLength).map((p) => [...p]) as [number[], number[]];
	const reference2 = getReferenceLine(wall2, state.fallbackLength).map((p) => [...p]) as [number[], number[]];
	const wallVectors2 = getWallVectors(state, wall2);
	let axes1 = getAxes(wall1, reference1, layers1In, state.wallVectors.a);
	let axes2 = getAxes(wall2, reference2, layers2In, wallVectors2.a);
	let layers1 = layers1In;
	let layers2 = layers2In;

	const matrix1 = getLocalPlacement(wall1.get("ObjectPlacement") as EntityInstance);
	const matrix1i = mat4.create();
	if (!mat4.invert(matrix1i, matrix1)) {
		throw new Error("regenerateWallRepresentation: wall1's object placement matrix is singular and cannot be inverted");
	}
	const matrix2 = getLocalPlacement(wall2.get("ObjectPlacement") as EntityInstance);
	const combined = mat4.create();
	mat4.multiply(combined, matrix1i, matrix2);

	const transformPoint = (p: readonly number[]): number[] => {
		const out = vec3.create();
		vec3.transformMat4(out, [p[0], p[1], 0], combined);
		return [out[0], out[1]];
	};
	// Direction vectors (w=0) -- only the rotation/scale (linear) part of `combined`
	// applies, matching `np.append(v, 0.0)` before the matrix multiply.
	const transformDirection = (v: readonly number[]): number[] => [
		combined[0] * v[0] + combined[4] * v[1] + combined[8] * v[2],
		combined[1] * v[0] + combined[5] * v[1] + combined[9] * v[2],
		combined[2] * v[0] + combined[6] * v[1] + combined[10] * v[2],
	];

	for (const axis of axes2) {
		axis[0] = transformPoint(axis[0]);
		axis[1] = transformPoint(axis[1]);
	}
	reference2[0] = transformPoint(reference2[0]);
	reference2[1] = transformPoint(reference2[1]);
	wallVectors2.z = transformDirection(wallVectors2.z);
	wallVectors2.y = transformDirection(wallVectors2.y);

	let axis2 = axes2[0];
	if (isX(axis2[0][1], axis2[1][1])) return; // Parallel.

	if (connection1 === "ATEND") {
		if (axes2[0][0][0] > axes2[axes2.length - 1][0][0]) {
			axes2 = [...axes2].reverse();
			layers2 = [...layers2].reverse();
		}
	} else if (connection1 === "ATSTART") {
		if (axes2[axes2.length - 1][0][0] > axes2[0][0][0]) {
			axes2 = [...axes2].reverse();
			layers2 = [...layers2].reverse();
		}
	}

	axis2 = axes2[0];
	if (connection2 === "ATSTART") {
		axis2 = [axis2[1], axis2[0]];
	}
	if (axis2[0][1] < axis2[1][1]) {
		if (axes1[axes1.length - 1][0][1] < axes1[0][0][1]) {
			axes1 = [...axes1].reverse();
			layers1 = [...layers1].reverse();
		}
	} else {
		if (axes1[0][0][1] < axes1[axes1.length - 1][0][1]) {
			axes1 = [...axes1].reverse();
			layers1 = [...layers1].reverse();
		}
	}

	if (connection1 === "ATPATH") {
		const firstAxis2 = axes2[0];
		const lastAxis2 = axes2[axes2.length - 1];
		const firstY = axes1[0][0][1];
		const lastY = axes1[axes1.length - 1][0][1];
		const p0 = [intersectXAxis2d(firstAxis2[0], firstAxis2[1], firstY) as number, firstY];
		const pN = [intersectXAxis2d(lastAxis2[0], lastAxis2[1], firstY) as number, firstY];

		const points: number[][] = [p0];
		const axes2Iter = new ArrayIterator(axes2);
		let curAxis2 = axes2Iter.next();
		for (const layer2 of layers2) {
			const ysIter = new ArrayIterator(axes1.map((a) => a[0][1]));
			let y = ysIter.next();
			for (const layer1 of layers1) {
				if (layer2.priority <= layer1.priority) break;
				y = ysIter.next();
			}
			const p1 = [intersectXAxis2d(curAxis2[0], curAxis2[1], y) as number, y];
			curAxis2 = axes2Iter.next();
			const p2 = [intersectXAxis2d(curAxis2[0], curAxis2[1], y) as number, y];
			if (points.length > 0 && allClose(points[points.length - 1], p1)) {
				points[points.length - 1] = p2;
			} else {
				points.push(p1, p2);
			}
		}

		if (!allClose(points[points.length - 1], pN)) {
			points.push(pN);
		}

		const splitYs = new Set([firstY, lastY]);
		let segment: number[][] = [];
		const atpathVector = getJoinVector(state.wallVectors.y, wallVectors2.y);
		state.atpathPoints.push([atpathVector, points]);
		for (const point of points) {
			segment.push(point);
			if (segment.length === 1) continue;
			if (ySetEquals([segment[0][1], segment[segment.length - 1][1]], splitYs)) {
				if (segment[0][1] > segment[segment.length - 1][1]) segment.reverse();
				state.splitPoints.push(segment);
				segment = [];
			} else if (segment[0][1] === segment[segment.length - 1][1]) {
				if (segment[0][1] === state.maxY) {
					if (segment[0][0] > segment[segment.length - 1][0]) segment.reverse();
					state.maxpathPoints.push(segment);
				} else if (segment[0][1] === state.minY) {
					if (segment[segment.length - 1][0] > segment[0][0]) segment.reverse();
					state.minpathPoints.push(segment);
				}
				segment = [];
			}
		}
	} else if (connection2 === "ATPATH") {
		const points: number[][] = [];
		const ysIter = new ArrayIterator(axes1.map((a) => a[0][1]));
		let y = ysIter.next();
		for (const layer1 of layers1) {
			const axes2Iter = new ArrayIterator(axes2);
			let curAxis2 = axes2Iter.next();
			for (const layer2 of layers2) {
				if (layer1.priority <= layer2.priority) break;
				curAxis2 = axes2Iter.next();
			}
			let x = intersectXAxis2d(curAxis2[0], curAxis2[1], y) as number;
			const p1 = [x, y];
			y = ysIter.next();
			x = intersectXAxis2d(curAxis2[0], curAxis2[1], y) as number;
			const p2 = [x, y];
			if (points.length > 0 && allClose(points[points.length - 1], p1)) {
				// Note the asymmetry with the `connection1 === "ATPATH"` branch above,
				// which REPLACES `points[-1]` on a match -- this branch APPENDS instead,
				// preserved verbatim (see this file's header comment).
				points.push(p2);
			} else {
				points.push(p1, p2);
			}
		}

		if (connection1 === "ATSTART") {
			state.startPoints = points;
			state.startVector = getJoinVector(state.wallVectors.y, wallVectors2.y);
			state.startOffset = state.startVector[0] * (state.wallVectors.h / state.startVector[2]);
			state.referenceP1[0] = intersectXAxis2d(reference2[0], reference2[1], reference1[0][1]) as number;
		} else if (connection1 === "ATEND") {
			state.endPoints = points;
			state.endVector = getJoinVector(state.wallVectors.y, wallVectors2.y);
			state.endOffset = state.endVector[0] * (state.wallVectors.h / state.endVector[2]);
			state.referenceP2[0] = intersectXAxis2d(reference2[0], reference2[1], reference1[0][1]) as number;
		}
	} else {
		const lastY = axes1[axes1.length - 1][0][1];
		const ysIter = new ArrayIterator(axes1.map((a) => a[0][1]));

		const lastAxis2 = axes2[axes2.length - 1];
		const axes2Iter = new ArrayIterator(axes2);
		// See this file's header comment (Finding 4): this variable is the one the
		// FIRST/SECOND branches of the `while` loop below read -- deliberately NOT
		// reassigned by the equal-priority (third) branch's own `next(axes2)` call.
		let axis2c = axes2Iter.next();
		let y = ysIter.next();
		let x = intersectXAxis2d(axis2c[0], axis2c[1], y) as number;
		const points: number[][] = [[x, y]];

		const layers1Iter = new ArrayIterator(layers1);
		const layers2Iter = new ArrayIterator(layers2);
		let layer1 = layers1Iter.nextOrNull();
		let layer2 = layers2Iter.nextOrNull();

		// This creates "mitering" behaviour which is an ambiguity by bSI.
		while (layer1 !== null && layer2 !== null) {
			if (layer1.priority > layer2.priority) {
				axis2c = axes2Iter.next();
				x = intersectXAxis2d(axis2c[0], axis2c[1], y) as number;
				layer2 = layers2Iter.nextOrNull();
			} else if (layer2.priority > layer1.priority) {
				y = ysIter.next();
				x = intersectXAxis2d(axis2c[0], axis2c[1], y) as number;
				layer1 = layers1Iter.nextOrNull();
			} else {
				y = ysIter.next();
				// See this file's header comment (Finding 4): `axes2Iter` is advanced
				// here, but the result is used ONLY for this one `x` computation --
				// `axis2c` itself is deliberately left stale, matching real Python's own
				// verbatim behavior.
				const nextAxis2 = axes2Iter.next();
				x = intersectXAxis2d(nextAxis2[0], nextAxis2[1], y) as number;
				layer1 = layers1Iter.nextOrNull();
				layer2 = layers2Iter.nextOrNull();
			}
			points.push([x, y]);
		}

		if (points[points.length - 1][1] !== lastY) {
			points.push([intersectXAxis2d(lastAxis2[0], lastAxis2[1], lastY) as number, lastY]);
		}

		if (connection1 === "ATSTART") {
			state.startPoints = points;
			state.startVector = getJoinVector(state.wallVectors.y, wallVectors2.y);
			state.startOffset = state.startVector[0] * (state.wallVectors.h / state.startVector[2]);
			state.referenceP1[0] = intersectXAxis2d(reference2[0], reference2[1], reference1[0][1]) as number;
		} else if (connection1 === "ATEND") {
			state.endPoints = points;
			state.endVector = getJoinVector(state.wallVectors.y, wallVectors2.y);
			state.endOffset = state.endVector[0] * (state.wallVectors.h / state.endVector[2]);
			state.referenceP2[0] = intersectXAxis2d(reference2[0], reference2[1], reference1[0][1]) as number;
		}
	}
}

/** Python: `Regenerator.__init__`. See this file's header comment (Finding 5) for why `body` --
 * unlike `axis` -- is never auto-created. */
interface RegeneratorContext {
	body: EntityInstance | null;
	axis: EntityInstance;
	unitScale: number;
}

function createRegeneratorContext(file: IfcFile): RegeneratorContext {
	const body = getContext(file, "Model", "Body", "MODEL_VIEW");
	let axis = getContext(file, "Plan", "Axis", "GRAPH_VIEW");
	const unitScale = calculateUnitScale(file);

	if (!axis) {
		let plan = getContext(file, "Plan");
		if (!plan) {
			plan = addContext(file, { contextType: "Plan" });
		}
		axis = addContext(file, {
			contextType: "Plan",
			contextIdentifier: "Axis",
			targetView: "GRAPH_VIEW",
			parent: plan,
		});
	}

	return { body, axis, unitScale };
}

/** Python: `Regenerator.regenerate`. See this file's header comment for the full branch structure
 * and Finding 1 (why this always throws, on every schema, for every wall with a real
 * `IfcMaterialLayerSet`). */
function regenerate(
	file: IfcFile,
	ctx: RegeneratorContext,
	wall: EntityInstance,
	length: number,
	height: number,
	angle: number | null,
): EntityInstance | undefined {
	const state: RegenerateState = {
		fallbackLength: length / ctx.unitScale,
		fallbackHeight: height / ctx.unitScale,
		fallbackAngle: angle,
		isAngled: false,
		wallVectors: { z: [0, 0, 1], y: [0, 1, 0], a: 0, d: 0, h: 0 }, // Placeholder, overwritten below.
		referenceP1: [0, 0],
		referenceP2: [0, 0],
		minY: 0,
		maxY: 0,
		startPoints: [],
		startVector: [0.0, 0.0, 1.0],
		startOffset: 0.0,
		atpathPoints: [],
		splitPoints: [],
		maxpathPoints: [],
		minpathPoints: [],
		endPoints: [],
		endVector: [0.0, 0.0, 1.0],
		endOffset: 0.0,
	};

	const layers = getLayers(wall);
	if (layers.length === 0) return undefined;

	// Python: `self.reference_p1, self.reference_p2 = reference` -- no `.copy()` there (a
	// harmless aliasing choice: `reference` isn't read again afterward in a way that would
	// observe it), reproduced here as an explicit defensive copy instead (non-behavioral).
	const reference = getReferenceLine(wall, state.fallbackLength);
	state.referenceP1 = [...reference[0]];
	state.referenceP2 = [...reference[1]];
	state.wallVectors = getWallVectors(state, wall);
	const axes = getAxes(wall, [state.referenceP1, state.referenceP2], layers, state.wallVectors.a);
	state.minY = axes[0][0][1];
	state.maxY = axes[axes.length - 1][0][1];
	// Python: `self.end_point = None` -- assigned here but never read anywhere else in the
	// whole file (a genuine dead instance attribute, distinct from `self.end_points`,
	// PLURAL) -- see this file's header comment; omitted here entirely, documented rather
	// than silently dropped.

	const manualBooleans = getManualBooleans(file, wall);

	const connectedTo = (attrOrNull(wall, "ConnectedTo") as EntityInstance[] | null) ?? [];
	for (const rel of connectedTo) {
		if (!rel.isA("IfcRelConnectsPathElements")) continue;
		const wall2 = rel.get("RelatedElement") as EntityInstance;
		const layers1 = combineLayers([...layers], rel.get("RelatingPriorities") as number[]);
		const layers2 = combineLayers(getLayers(wall2), rel.get("RelatedPriorities") as number[]);
		if (layers1.length === 0 || layers2.length === 0) continue;
		join(
			state,
			wall,
			wall2,
			layers1,
			layers2,
			rel.get("RelatingConnectionType") as string,
			rel.get("RelatedConnectionType") as string,
		);
	}

	const connectedFrom = (attrOrNull(wall, "ConnectedFrom") as EntityInstance[] | null) ?? [];
	for (const rel of connectedFrom) {
		if (!rel.isA("IfcRelConnectsPathElements")) continue;
		const wall2 = rel.get("RelatingElement") as EntityInstance;
		const layers1 = combineLayers([...layers], rel.get("RelatedPriorities") as number[]);
		const layers2 = combineLayers(getLayers(wall2), rel.get("RelatingPriorities") as number[]);
		if (layers1.length === 0 || layers2.length === 0) continue;
		join(
			state,
			wall,
			wall2,
			layers1,
			layers2,
			rel.get("RelatedConnectionType") as string,
			rel.get("RelatingConnectionType") as string,
		);
	}

	// Python: `miny`/`maxy` LOCAL variables -- see this file's header comment for why these
	// are named distinctly (`localMinY`/`localMaxY`) from `state.minY`/`state.maxY` above,
	// despite Python reusing the same 2 names for genuinely different axis rows.
	const localMinY = axes[axes.length - 2][0][1];
	const localMaxY = axes[axes.length - 1][0][1];
	if (state.startPoints.length === 0) {
		const minx = axes[0][0][0];
		state.startPoints = [
			[minx, axes[0][0][1]],
			[minx, axes[axes.length - 1][0][1]],
		];
	}
	if (state.endPoints.length === 0) {
		const maxx = axes[0][1][0];
		state.endPoints = [
			[maxx, axes[0][0][1]],
			[maxx, axes[axes.length - 1][0][1]],
		];
	}

	if (state.startPoints[0][1] > state.startPoints[state.startPoints.length - 1][1]) {
		state.startPoints.reverse();
	}
	if (state.endPoints[0][1] > state.endPoints[state.endPoints.length - 1][1]) {
		state.endPoints.reverse();
	}

	const builder = new ShapeBuilder(file);

	// Don't offset the wall if there are manual booleans, because that'll also shift operands.
	const offset: number[] | null = manualBooleans.length > 0 ? null : state.referenceP1.map((v) => -v);

	let item: EntityInstance;

	if (state.isAngled) {
		const startPoints = state.startPoints.map((p) => [...p]);
		const endPoints = state.endPoints.map((p) => [...p]);
		if (state.endOffset > 0) {
			for (const point of endPoints) point[0] += state.endOffset;
		}
		if (state.startOffset < 0) {
			for (const point of startPoints) point[0] += state.startOffset;
		}
		const outerPoints: number[][] = [...startPoints, ...[...endPoints].reverse()];
		// See this file's header comment (Finding 1): throws here on IFC4/IFC4X3
		// (`IfcLineIndex`/`IfcArcIndex` gap), or -- if that succeeds (IFC2X3) -- inside
		// `extrude`'s own internal `profile()` upgrade call right below (`Dim` gap).
		item = builder.extrude(
			builder.polyline(outerPoints, true, offset),
			state.wallVectors.d,
			[0, 0, 0],
			state.wallVectors.z,
		);

		const operands: EntityInstance[] = [];
		if (!allClose(state.startVector, [0.0, 0.0, 1.0])) {
			const pts = state.startPoints.map((p) => [...p]);
			while (isX(pts[0][1], pts[1][1])) pts.shift();
			while (isX(pts[pts.length - 1][1], pts[pts.length - 2][1])) pts.pop();
			const newx = Math.min(...pts.map((p) => p[0])) - Math.abs(state.startOffset);
			const p1 = [...pts[pts.length - 1]];
			p1[0] = newx;
			const p2 = [...p1];
			p2[1] = pts[0][1];
			pts.push(p1, p2);
			const magnitude = vecLen(state.startVector.map((v) => v * (state.wallVectors.h / state.startVector[2])));
			operands.push(builder.extrude(builder.polyline(pts, true, offset), magnitude, [0, 0, 0], state.startVector));
		}

		if (!allClose(state.endVector, [0.0, 0.0, 1.0])) {
			const pts = state.endPoints.map((p) => [...p]);
			while (isX(pts[0][1], pts[1][1])) pts.shift();
			while (isX(pts[pts.length - 1][1], pts[pts.length - 2][1])) pts.pop();
			const newx = Math.max(...pts.map((p) => p[0])) + Math.abs(state.endOffset);
			const p1 = [...pts[pts.length - 1]];
			p1[0] = newx;
			const p2 = [...p1];
			p2[1] = pts[0][1];
			pts.push(p1, p2);
			const magnitude = vecLen(state.endVector.map((v) => v * (state.wallVectors.h / state.endVector[2])));
			operands.push(builder.extrude(builder.polyline(pts, true, offset), magnitude, [0, 0, 0], state.endVector));
		}

		for (const [atpathVector, pts] of state.atpathPoints) {
			if (pts.length <= 2) continue;
			const magnitude = vecLen(atpathVector.map((v) => v * (state.wallVectors.h / atpathVector[2])));
			operands.push(builder.extrude(builder.polyline(pts, true, offset), magnitude, [0, 0, 0], atpathVector));
		}

		if (operands.length > 0) {
			const results = addBoolean(file, { firstItem: item, secondItems: operands });
			item = results[results.length - 1];
		}
	} else {
		// A wall footprint may be multiple profiles if the wall is split into two due to
		// an ATPATH connection.
		const profiles: EntityInstance[] = [];
		const minx = Math.max(...state.startPoints.map((p) => p[0]));
		const maxx = Math.min(...state.endPoints.map((p) => p[0]));
		const filteredSplitPoints: number[][][] = [];
		for (const points of [...state.splitPoints].sort((a, b) => a[0][0] - b[0][0])) {
			if (points.some((p) => p[0] > maxx || p[0] < minx)) continue;
			filteredSplitPoints.push(points);
		}
		const startPointsCopy = state.startPoints.map((p) => [...p]);
		const endPointsCopy = state.endPoints.map((p) => [...p]);
		filteredSplitPoints.unshift(startPointsCopy);
		filteredSplitPoints.push(endPointsCopy);
		const splitPointsIter = new ArrayIterator(filteredSplitPoints);

		if (localMaxY < localMinY) {
			[state.maxpathPoints, state.minpathPoints] = [state.minpathPoints, state.maxpathPoints];
			if (state.maxpathPoints.length > 0) {
				state.maxpathPoints[0] = [...state.maxpathPoints[0]].reverse();
			}
			if (state.minpathPoints.length > 0) {
				state.minpathPoints[0] = [...state.minpathPoints[0]].reverse();
			}
		}

		while (true) {
			// Draw each profile as clockwise starting from (minx, miny).
			const startSplit = splitPointsIter.nextOrNull();
			if (!startSplit || startSplit.length === 0) break;
			const endSplit = splitPointsIter.nextOrNull();
			if (!endSplit || endSplit.length === 0) break;
			const maxyMinx = startSplit[startSplit.length - 1][0];
			const maxyMaxx = endSplit[endSplit.length - 1][0];
			const minyMinx = startSplit[0][0];
			const minyMaxx = endSplit[0][0];
			const points = startSplit;

			let remainingPathPoints: number[][][] = [];
			for (const maxpathPoints of state.maxpathPoints) {
				if (maxpathPoints[0][0] > maxyMinx && maxpathPoints[maxpathPoints.length - 1][0] < maxyMaxx) {
					points.push(...maxpathPoints);
				} else {
					remainingPathPoints.push(maxpathPoints);
				}
			}
			state.maxpathPoints = remainingPathPoints;

			points.push(...[...endSplit].reverse());

			remainingPathPoints = [];
			for (const minpathPoints of state.minpathPoints) {
				if (minpathPoints[0][0] < minyMaxx && minpathPoints[minpathPoints.length - 1][0] > minyMinx) {
					points.push(...minpathPoints);
				} else {
					remainingPathPoints.push(minpathPoints);
				}
			}
			state.minpathPoints = remainingPathPoints;

			// See this file's header comment (Finding 1): throws here on IFC4/IFC4X3
			// (`IfcLineIndex`/`IfcArcIndex` gap inside `polyline`), or -- if that succeeds
			// (IFC2X3) -- on the very next line, inside `profile()` itself (`Dim` gap).
			profiles.push(builder.profile(builder.polyline(points, true, offset)));
		}

		for (const points of [...state.maxpathPoints, ...state.minpathPoints]) {
			profiles.push(builder.profile(builder.polyline(points, true, offset)));
		}

		const profile =
			profiles.length > 1 ? file.createEntity("IfcCompositeProfileDef", "AREA", null, profiles) : profiles[0];

		item = builder.extrude(profile, state.wallVectors.d, [0, 0, 0], state.wallVectors.z);
	}

	// See this file's header comment (Finding 3): a SEPARATE, independent re-fetch of the
	// SAME `BBIM_Boolean` pset already read into `manualBooleans` above -- preserved
	// verbatim, not consolidated.
	for (const boolean of getManualBooleans(file, wall)) {
		boolean.set("FirstOperand", item);
		item = boolean;
	}

	// See this file's header comment (Finding 5): `ctx.body` can be `null` here (never
	// auto-created, unlike `ctx.axis`) -- currently unreachable in practice since `item`'s
	// own construction above always throws first.
	const bodyRep = builder.getRepresentation(ctx.body as EntityInstance, [item]);
	const oldBodyRep = ctx.body ? getRepresentation(wall, ctx.body) : null;
	if (oldBodyRep) {
		elementUtil.replaceElement(oldBodyRep, bodyRep);
		elementUtil.removeDeep2(file, oldBodyRep);
	} else {
		assignRepresentation(file, { product: wall, representation: bodyRep });
	}

	const axisItem = builder.polyline([state.referenceP1, state.referenceP2], false, offset);
	const axisRep = builder.getRepresentation(ctx.axis, [axisItem]);
	const oldAxisRep = getRepresentation(wall, ctx.axis);
	if (oldAxisRep) {
		elementUtil.replaceElement(oldAxisRep, axisRep);
		elementUtil.removeDeep2(file, oldAxisRep);
	} else {
		assignRepresentation(file, { product: wall, representation: axisRep });
	}

	if (!allClose(state.referenceP1, [0.0, 0.0]) && manualBooleans.length === 0) {
		const children: Array<[MatrixType, EntityInstance[]]> = [];
		const objectPlacement = wall.get("ObjectPlacement") as EntityInstance;
		const referencedByPlacements =
			(attrOrNull(objectPlacement, "ReferencedByPlacements") as EntityInstance[] | null) ?? [];
		for (const referencedPlacement of referencedByPlacements) {
			const refMatrix = getLocalPlacement(referencedPlacement);
			const placesObject = (attrOrNull(referencedPlacement, "PlacesObject") as EntityInstance[] | null) ?? [];
			children.push([refMatrix, placesObject]);
		}

		const wallMatrix = getLocalPlacement(objectPlacement);
		const transformed = applyMatrixToHomogeneousPoint2d(wallMatrix, state.referenceP1);
		wallMatrix[12] = transformed[0];
		wallMatrix[13] = transformed[1];
		wallMatrix[14] = transformed[2];
		wallMatrix[15] = transformed[3];
		editObjectPlacement(file, { product: wall, matrix: wallMatrix, isSi: false, shouldTransformChildren: true });

		// Restore children to their previous location.
		for (const [childMatrix, elements] of children) {
			for (const element of elements) {
				editObjectPlacement(file, {
					product: element,
					matrix: childMatrix,
					isSi: false,
					shouldTransformChildren: true,
				});
			}
		}
	}

	return bodyRep;
}

export interface RegenerateWallRepresentationSettings {
	/** The `IfcWall` for the representation. Only `Model`/`Body`/`MODEL_VIEW`-type
	 * representations are currently supported. */
	wall: EntityInstance;
	/** If the wall doesn't have an axis length, this is the default length in SI units.
	 * Defaults to 1.0. */
	length?: number;
	/** If the wall doesn't already have a height, this is the default height in SI units.
	 * Defaults to 1.0. */
	height?: number;
	/** If the wall doesn't already have a slope, this is the default angle in radians. Left
	 * as `null`/`undefined` (the default) defines no slope. */
	angle?: number | null;
}

function regenerateWallRepresentationUsecase(
	file: IfcFile,
	settings: RegenerateWallRepresentationSettings,
): EntityInstance | undefined {
	const ctx = createRegeneratorContext(file);
	return regenerate(file, ctx, settings.wall, settings.length ?? 1.0, settings.height ?? 1.0, settings.angle ?? null);
}

/**
 * Regenerate the body representation of a wall taking into account connections (Python:
 * `ifcopenshell.api.geometry.regenerate_wall_representation`).
 *
 * IFC defines how a standard (case) wall should behave that has a material layer set and
 * connections to other walls using `IfcRelConnectsPathElements`. This function will regenerate
 * the body geometry of a wall taking into account the notches, butts, mitres, etc. in the wall
 * due to connections with other walls.
 *
 * A standard wall has a 2D axis line as well as parameters defined in terms of layer thicknesses
 * and priorities. The body geometry is defined as a 2D XY profile which is extruded in the +Z
 * direction. For this function to work, a wall must have these defined and the project must have
 * an axis and body representation context.
 *
 * For non-sloped walls, a 2D profile is generated and extruded in the +Z direction. The profile
 * may be a composite profile, if the wall is split due to wall joins along the path of the wall
 * that protrude all the way through the wall.
 *
 * For sloped walls, a basic rectangular 2D profile is extruded, and then additional extrusions are
 * generated for each connection that boolean-difference the base extrusion.
 *
 * Clippings applied via `clipSolid`/`clipSolidBounded` are preserved only if the `element`
 * parameter was passed when creating them, which registers the result in the `BBIM_Boolean`
 * property set. Clippings created without that parameter are silently discarded during
 * regeneration.
 *
 * This will also update the axis line representation (e.g. trim the axis line to any
 * connections).
 *
 * The wall's object placement will also be updated such that the placement is equivalent to the
 * axis line's start point (which therefore becomes (0.0, 0.0)). This is a logical, consistent,
 * and useful placement coordinate (especially for apps that can pivot using this point).
 *
 * All this functionality relies on the Plan/Axis/GRAPH_VIEW representation context. It will be
 * created if it does not exist.
 *
 * **Read this file's own header comment before using this function**: every real invocation with
 * a wall that has an `IfcMaterialLayerSet` throws while building the actual body solid, on every
 * schema, via 2 pre-existing, already-tracked `entityInstance.ts` primitive-layer gaps (Finding
 * 1). A wall with no `IfcMaterialLayerSet` returns `undefined` immediately and is fully
 * functional, as is every pure layer/axis/connection-join computation this function performs
 * before ever touching `ShapeBuilder`.
 *
 * @returns The newly generated body `IfcShapeRepresentation`, or `undefined` if the wall has no
 * `IfcMaterialLayerSet` (the layer-set rebuild is the only mode this function knows; without
 * layers there is nothing to regenerate and callers should leave the existing representation
 * alone).
 */
export const regenerateWallRepresentation = wrapUsecase(
	"geometry.regenerate_wall_representation",
	regenerateWallRepresentationUsecase,
);
