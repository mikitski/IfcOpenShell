// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/representation.py` (src/ifcopenshell-python,
// 523 lines, 13 functions) -- `planning/ifcopenshell-ts/PROGRESS.md`'s Phase 4 (`util`
// Tier B) table names this as the next-in-line chunk after `util.placement`/
// `util.geolocation` (both landed). This unblocks two pre-existing, disclosed
// cross-module gaps left behind by earlier chunks (see "Cross-file updates" section
// below): `util/element.ts`'s `getStyles` (chunk 3's `findBodyRepresentation` narrow
// stand-in) and `util/selector.ts`'s `"profiles"` key-path key (`getProfilesNarrow`'s
// `get_extrusions`-based fallback blocker).
//
// Ported in full: `get_context`, `is_representation_of_context`,
// `get_representations_iter` (as `getRepresentationsIter`), `get_representation` (as
// `getRepresentation`), `guess_type` (as `guessType`), `resolve_representation` (as
// `resolveRepresentation`), `resolve_items` (as `resolveItems`), `resolve_base_items`
// (as `resolveBaseItems`), `get_prioritised_contexts` (as `getPrioritisedContexts`),
// `get_part_of_product` (as `getPartOfProduct`), `get_item_shape_aspect` (as
// `getItemShapeAspect`), `get_material_style` (as `getMaterialStyle`).
//
// `get_reference_line` (as `getReferenceLine`) is ported in full for its primary
// (`IfcPolyline`/`IfcIndexedPolyCurve` axis-representation) path; its
// `ifcopenshell.util.shape.get_base_extrusions` fallback branch is a genuine,
// disclosed hard blocker (see that function's own doc comment below and "Genuinely
// blocked" section further down) -- `util.shape` is a separate, not-yet-ported Tier B
// module, matching this project's established "only throw when Python itself would
// need the missing piece" pattern (`selector.ts`'s `throwPositionalKeyBlocked`
// precedent).
//
// *** A real, disclosed finding: no Python test file exists for this module ***
//
// `test/util/test_representation.py` does not exist anywhere in
// `src/ifcopenshell-python` (confirmed by a repo-wide search, not merely a missing-file
// guess) -- `util/representation.py` has no dedicated first-party test coverage at all
// in the real Python codebase (some of its functions are exercised indirectly via other
// modules' own tests, e.g. `ifcopenshell.util.shape`/`ifcopenshell.api.geometry`'s test
// suites, but there is no `test_representation.py` to port from). This matches
// `util.constraint`'s own precedent (`PROGRESS.md`'s row for that chunk: "No Python test
// file exists for this module ... original test coverage written") -- every test in
// `test/util/representation.test.ts` is therefore original coverage, written directly
// against this file's own source/`representation.py`'s real behavior, not ported from an
// existing Python test.
//
// *** Three real, disclosed Python-source findings, all preserved verbatim (matching
// this project's "port bugs faithfully, disclose rather than silently fix" convention
// -- `util/element.ts`'s `getQuantities` "data.class" bug and `util/system.ts`'s
// "NOTEDEFINED" typo are the established precedents) ***
//
// 1. **`get_part_of_product`'s real `"IFX2X3"` typo (not `"IFC2X3"`).** The Python
//    source's `IfcTypeProduct` branch reads:
//    `elif element.is_a("IfcTypeProduct") and element.file.schema != "IFX2X3":` --
//    `"IFX2X3"` is never a real schema-version string (`IfcFile.schema`/Python's
//    `ifcopenshell.file.schema` only ever return `"IFC2X3"`/`"IFC4"`/`"IFC4X3"`), so this
//    comparison is a no-op typo: it is *always* true, for every schema including real
//    IFC2X3 files. The function's own docstring claims "Note that this will return None
//    for IFC2X3 element types" -- that claim is **false** in the actual, current Python
//    source, due to this typo (an `IfcTypeProduct` in an IFC2X3 file does NOT
//    short-circuit to `None`; it proceeds into the `RepresentationMaps` filter exactly
//    like IFC4/IFC4X3). Reproduced verbatim below (`schema !== "IFX2X3"`, always true) --
//    not "corrected" to the docstring's evidently-intended `"IFC2X3"`, since that would
//    silently diverge from what real Python actually executes today. Disclosed here and
//    pinned by a dedicated IFC2X3 test in `representation.test.ts` that asserts the
//    (surprising, typo-driven) real behavior, not the docstring's claim.
//
//    **A second, real, undisclosed divergence in this same function, found by this
//    chunk's own `/code-review` pass (an independent adversarial re-review, not the
//    same pass that found the `IDENTIFIER_PRIORITY` casing bug above):** the Python
//    source reads `element.RepresentationMaps` with NO `or []`/`getattr(..., default)`
//    guard (line 443) -- unlike this same Python source file's own `resolve_representation`
//    /`resolve_items` (`representation.Items or []`) and `element.py`'s own repeated
//    `element.RepresentationMaps or []` guard elsewhere for this exact attribute. For a
//    genuinely unset `RepresentationMaps` (a real, common case -- any `IfcTypeProduct`
//    with no geometry mapping assigned yet, not a contrived edge case), Python's list
//    comprehension raises `TypeError: 'NoneType' object is not iterable`. An earlier
//    version of `getPartOfProduct` below used a defensive `?? []` fallback here,
//    silently avoiding that crash and returning `null` instead -- a real behavioral
//    improvement over Python, but an *undisclosed* one that contradicted this file's own
//    "preserve real Python bugs verbatim" convention (unlike `placement.ts`'s `rotation`
//    divergence, which is narrowly justified as TS-type-system-unreachable in practice;
//    this case is neither narrow nor unreachable). Fixed: `getPartOfProduct` now reads
//    `.get("RepresentationMaps")` directly (matching Python's own unguarded access,
//    never throwing "attribute not declared" since the attribute is always declared on
//    `IfcTypeProduct`) and lets the un-guarded `.filter(...)` call throw the TS/JS
//    equivalent (`TypeError: Cannot read properties of null (reading 'filter')`) for a
//    genuinely unset value -- reproducing Python's crash, not silently avoiding it.
//    Pinned by a dedicated test in `representation.test.ts` asserting the throw.
//
// 2. **`resolve_items`'s asymmetric identity-shortcut, which silently discards the
//    caller's accumulated `matrix` on an identity-transform `IfcMappedItem`.** The
//    Python source:
//    ```python
//    rep_matrix = ifcopenshell.util.placement.get_mappeditem_transformation(item)
//    if not np.allclose(rep_matrix, np.eye(4)):
//        rep_matrix = rep_matrix @ matrix.copy()
//    results.extend(resolve_items(item.MappingSource.MappedRepresentation, rep_matrix))
//    ```
//    Mathematically, `rep_matrix @ matrix` when `rep_matrix` is (close to) the identity
//    simplifies to `matrix` itself (`I @ M == M`) -- so one would expect the `if` guard
//    to be a pure optimization (skip a no-op multiplication). It is not: the `if`
//    guard's *false* branch leaves `rep_matrix` as the raw, un-composed
//    `get_mappeditem_transformation(item)` result (i.e. the identity matrix itself, not
//    `matrix`), which is then passed down as the *new* accumulated matrix for the
//    recursive call -- silently discarding whatever transform had accumulated in
//    `matrix` from this call's own ancestors. This is a real, reachable discrepancy
//    (not merely a theoretical one): any multi-level `IfcMappedItem` chain where an
//    *intermediate* level's own `IfcCartesianTransformationOperator3D` happens to be a
//    plain identity transform (a real, unremarkable case -- e.g. a mapped item with no
//    `Axis1`/`Axis2`/`Axis3`/`Scale` overrides at all) resets the accumulated world
//    transform for everything nested below that level. Reproduced verbatim below
//    (`resolveItems`'s own `if` guard has the identical asymmetry) -- not "fixed" to the
//    evidently-intended `rep_matrix = matrix.copy()` fallback, since real Python
//    executes the buggy version today. Disclosed here and pinned by a dedicated
//    3-level-nested-mapped-item test in `representation.test.ts` (an identity-transform
//    middle level) that asserts the real (surprising) discarding behavior, not the
//    "intended" one.
//
// 3. **`get_prioritised_contexts`' `identifier_priority` list spells `"Body-FallBack"`
//    (capital "B" in "Back"), while this same source file's own `REPRESENTATION_IDENTIFIER`
//    type declares the officially-documented spelling `"Body-Fallback"` (lowercase
//    "allback")** -- found by this chunk's own `/code-review` pass, confirmed against
//    the real Python source (`representation.py` line 41 vs. line 378, the identical
//    mismatch, not introduced by this port). A context whose `ContextIdentifier` is
//    really `"Body-Fallback"` never matches `IDENTIFIER_PRIORITY` at all, so
//    `sortContextKey` (below) silently ranks it at priority `0` -- as low as a
//    completely unrecognized identifier -- rather than the documented second-highest
//    priority (right after `"Body"`). Reproduced verbatim (see `IDENTIFIER_PRIORITY`'s
//    own inline comment below for the full story) and pinned by a dedicated test in
//    `representation.test.ts`.
//
// *** A fourth real, disclosed finding: `guess_type`'s `Dim`-dependent branches are
// genuinely blocked by a pre-existing, already-disclosed `entityInstance.ts` gap ***
//
// `guess_type`'s `Curve2D`/`Curve3D`/`Surface2D`/`Surface3D` branches read `i.Dim` --
// `IfcCurve.Dim`/`IfcSurface.Dim` are real EXPRESS DERIVED attributes (`DERIVE Dim :=
// IfcCurveDim(SELF)`/`IfcSurfaceDim(SELF)`, confirmed by reading the real
// `ifcopenshell.express.rules.*` generated rule modules -- `IfcCurveDim` alone is a
// genuinely non-trivial ~20-line recursive function spanning `IfcLine`/`IfcConic`/
// `IfcPolyline`/`IfcTrimmedCurve`/`IfcCompositeCurve`/`IfcBSplineCurve`/
// `IfcOffsetCurve2D`/`3D`/`IfcPcurve`/`IfcIndexedPolyCurve`, each with its own
// sub-dispatch, `IfcSurfaceDim` similarly). Python's real `entity_instance
// .__getattr__` resolves this via `ifcopenshell.express.rules.<schema>`'s compiled
// EXPRESS-rule module (`entity_instance.py`'s own `__getattr__`, the DERIVED-category
// branch) -- this TS port's `EntityInstance.get()` has NO such fallback at all
// (`entityInstance.ts`'s own header comment: "The EXPRESS derived-attribute
// (`calc_<Type>_<name>`) rule-compilation fallback ... is explicitly out of scope for
// this chunk ... `.get()` throws instead"), so `.get("Dim")` on ANY real entity
// unconditionally throws in this port today.
//
// This is a genuinely *reachable*, not merely theoretical, practical limitation: the
// `elif` chain checks `Curve2D` (which evaluates `i.Dim` for every `IfcCurve`-typed
// item) BEFORE the plain, dimension-agnostic `Curve` branch, so `guessType` throws for
// essentially any real-world `items` list containing an actual `IfcCurve` (or
// `IfcSurface`) instance -- including cases that would have resolved to the simple,
// Dim-independent `"Curve"`/`"Surface"` result, since the throwing `Curve2D`/`Surface2D`
// check runs first and never falls through. `guessType` below reproduces Python's exact
// branch order and logic verbatim (not reordered to dodge this) -- implementing
// `IfcCurveDim`/`IfcSurfaceDim` here would be real, disclosed scope creep into a
// separate, sizable EXPRESS-derived-attribute-execution feature (`entityInstance.ts`'s
// own primitive-layer domain, already explicitly scoped out there), not a small,
// narrow addition this chunk should silently take on. Every other `guessType` branch
// (everything not gated on `Dim`) is fully functional and covered by
// `representation.test.ts`'s dedicated `guessType` tests, which also pin this exact
// blocker with a regression test (asserting the real, documented error), not just
// prose. See `TODOS.md`'s new entry for this.
//
// *** A fifth real finding (not a bug, verified against the actual schema, disclosed
// for anyone reading `guess_type`'s branch list expecting each string result to be
// independently reachable): `"AdvancedSweptSolid"`/`"Brep"`/`"AdvancedBrep"` are dead
// code in the real Python source, for a homogeneous single-class items list ***
//
// Checked directly against the real IFC4 class hierarchy (`src/ifcparse/schemas/
// Ifc4.h`), not assumed: `IfcSweptAreaSolid`/`IfcSweptDiskSolid` (the `AdvancedSweptSolid`
// branch's classes) and `IfcManifoldSolidBrep` and its subtypes `IfcFacetedBrep`/
// `IfcAdvancedBrep` (the `Brep`/`AdvancedBrep` branches' classes) are ALL real subtypes
// of `IfcSolidModel`. Since the `SolidModel` branch (`i.isA("IfcSolidModel")`) comes
// BEFORE `AdvancedSweptSolid`/`Clipping`/`CSG`/`Brep`/`AdvancedBrep` in the `elif` chain,
// it always matches first for any of these classes -- so `"AdvancedSweptSolid"`/
// `"Brep"`/`"AdvancedBrep"` can never actually be returned for a homogeneous items list
// built from real instances of the classes each branch names (real Python has the exact
// same dead code, this is not a porting gap). `"Clipping"`/`"CSG"` remain reachable, but
// only via the other, non-`IfcSolidModel`-subtype classes each also accepts
// (`IfcBooleanClippingResult`/`IfcBooleanResult`/`IfcCsgPrimitive3D`, confirmed to
// extend `IfcGeometricRepresentationItem` directly). `representation.test.ts`'s
// `guessType` coverage tests this exact shadowing directly (not just the "happy path"
// classes), since testing only e.g. `IfcFacetedBrep` -> `"Brep"` naively (an assumption
// this investigation started with, then disproved by reading the real schema) would
// have been a wrong, unverified test.
//
// The identical pattern also affects `"PointCloud"` (`isA("IfcCartesianPointList3d")`):
// `IfcCartesianPointList3D` is, itself, always a real subtype of `IfcCartesianPointList`
// (confirmed the same way), and the `Point` branch (`isA("IfcPoint") or
// isA("IfcCartesianPointList")`) comes before `PointCloud` -- so `"PointCloud"` is, by
// this same reasoning, permanently unreachable dead code in real Python for ANY input
// (unlike `"AdvancedSweptSolid"`/`"Brep"`/`"AdvancedBrep"`, `"PointCloud"`'s one and
// only qualifying class is inherently always caught by the earlier, broader `Point`
// check -- there is no other class the `PointCloud` branch could ever match). Also
// pinned by a dedicated test.
//
// *** Generator -> eager array translations (matching `util/element.ts`'s own
// established precedent for `get_controls`/`get_openings`) ***
//
// `get_representations_iter` (Python `Generator[entity_instance]`) and
// `resolve_base_items` (same) are both ported as plain eager `EntityInstance[]`-
// returning functions, not TS generator functions -- every other list-returning
// function in this module already returns a concrete array, and nothing in either
// Python function's own behavior (nor any of this module's own callers of them)
// depends on laziness for correctness, only for not walking more of a
// representation/mapped-item graph than strictly necessary -- a performance nicety,
// not an observable behavior difference. A real Python `list(get_representations_iter
// (element))`/`list(resolve_base_items(representation))` call site sees identical
// values either way.
//
// *** Genuinely blocked (disclosed, not stubbed): `get_reference_line`'s
// `ifcopenshell.util.shape.get_base_extrusions` fallback ***
//
// `get_reference_line`'s Python source is `if axis := get_representation(...): ...
// elif extrusions := ifcopenshell.util.shape.get_base_extrusions(wall): ...`. Because
// this is an `if`/`elif` chain (not two independent `if`s), the `elif` branch is only
// ever reached when the wall has NO "Plan"/"Axis"/"GRAPH_VIEW" representation at all
// (`axis` is falsy) -- when a matching axis representation *is* found but its `Items`
// contain no `IfcPolyline`/`IfcIndexedPolyCurve` (every item hits the inner loop's
// `else: continue`), Python's own control flow falls all the way through to the
// function's final fallback-length return, WITHOUT ever touching the `elif`/
// `get_base_extrusions` branch (`axis` was truthy, so the `elif` is unconditionally
// skipped regardless of what happened inside the `if`-branch's own `for` loop).
// `getReferenceLine` below reproduces this exact fall-through shape (a real, verified
// control-flow subtlety, not assumed): the disclosed blocker below throws only in the
// one case that mirrors Python's own `elif` branch actually executing -- no matching
// "Plan"/"Axis"/"GRAPH_VIEW" representation exists at all. `ifcopenshell.util.shape` is
// a separate, not-yet-ported Tier B module (`PROGRESS.md`), so this cannot be
// implemented until that module lands; per this chunk's own task brief, `util.shape`
// itself is explicitly out of scope here. See `TODOS.md`'s updated entry.
//
// *** Cross-file updates in this PR (both disclosed pre-existing gaps this chunk
// unblocks) ***
//
// 1. `util/element.ts`'s `getStyles` previously called a narrow, disclosed local
//    re-implementation, `findBodyRepresentation` (that file's header comment, finding
//    #1), standing in for exactly `ifcopenshell.util.representation.get_representation
//    (element, "Model", "Body", "MODEL_VIEW")`. Now that this file's real
//    `getRepresentation` exists, `getStyles` calls it directly and
//    `findBodyRepresentation` is removed -- verified behaviorally equivalent first
//    (both implementations walk the exact same `Representation.Representations`/
//    `RepresentationMaps.MappedRepresentation` -> `ContextOfItems` shape;
//    `element.test.ts`'s pre-existing `getStyles` test, unchanged, still passes against
//    the real `getRepresentation` call).
// 2. `util/selector.ts`'s `getProfilesNarrow` (the `"profiles"` key-path key's
//    disclosed hard blocker) previously named *both* `util.shape` and
//    `util.representation` as missing. This chunk unblocks the `util.representation`
//    half only (`util.shape.get_extrusions`/`.get_profiles` themselves are still
//    unported, explicitly out of this chunk's own scope) -- the blocker's error message
//    and this file's/`TODOS.md`'s own disclosure are narrowed to name only the real
//    remaining gap, `util.shape`, rather than continuing to (now inaccurately) claim
//    `util.representation` is also missing.

import { mat4 } from "gl-matrix";
import { EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import { getMappeditemTransformation } from "./placement";
import type { MatrixType } from "./placement";

export type { MatrixType };

/** Python: `CONTEXT_TYPE = Literal["Model", "Plan", "NotDefined"]`. */
export type ContextType = "Model" | "Plan" | "NotDefined";

/** Python: `REPRESENTATION_IDENTIFIER = Literal[...]`. */
export type RepresentationIdentifier =
	| "CoG"
	| "Box"
	| "Annotation"
	| "Axis"
	| "FootPrint"
	| "Profile"
	| "Surface"
	| "Reference"
	| "Body"
	| "Body-Fallback"
	| "Clearance"
	| "Lighting";

/** Python: `TARGET_VIEW = Literal[...]`. */
export type TargetView =
	| "ELEVATION_VIEW"
	| "GRAPH_VIEW"
	| "MODEL_VIEW"
	| "PLAN_VIEW"
	| "REFLECTED_PLAN_VIEW"
	| "SECTION_VIEW"
	| "SKETCH_VIEW"
	| "USERDEFINED"
	| "NOTDEFINED";

// --- internal helpers (not exported -- pure translation aids; small per-module
// private helpers, duplicated rather than imported from `util/element.ts`/
// `util/placement.ts`, matching `util/schema.ts`'s/`util/placement.ts`'s own
// established "small per-module private helpers" precedent) ---

/** Python's `getattr(instance, name, None)`. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

/** Python's `x or []` idiom for a possibly-`null`/`undefined` array attribute. */
function arr<T>(value: readonly T[] | null | undefined): readonly T[] {
	return value ?? [];
}

// --- ported functions ---

/**
 * Get `IfcGeometricRepresentationSubContext` (or `IfcGeometricRepresentationContext`)
 * by the provided context type, identifier, and target view
 * (`ifcopenshell.util.representation.get_context`).
 *
 * @param ifcFile The model to search.
 * @param context ContextType.
 * @param subcontext A ContextIdentifier string, or any if left blank.
 * @param targetView A TargetView string, or any if left blank.
 */
export function getContext(
	ifcFile: IfcFile,
	context: ContextType,
	subcontext?: RepresentationIdentifier | null,
	targetView?: TargetView | null,
): EntityInstance | null {
	const elements =
		subcontext || targetView
			? ifcFile.byType("IfcGeometricRepresentationSubContext")
			: ifcFile.byType("IfcGeometricRepresentationContext", false);
	for (const element of elements) {
		// Python: `getattr(element, "ContextIdentifier")`/`getattr(element,
		// "TargetView")` -- both called with no default, i.e. plain attribute access;
		// `.get(...)` matches directly (both attributes are always declared on the
		// classes reached in each branch above, so this never throws in practice).
		if (context && element.get("ContextType") !== context) continue;
		if (subcontext && element.get("ContextIdentifier") !== subcontext) continue;
		if (targetView && element.get("TargetView") !== targetView) continue;
		return element;
	}
	return null;
}

/**
 * Check if representation has specified context or context type, identifier, and
 * target view (`ifcopenshell.util.representation.is_representation_of_context`).
 *
 * @param representation IfcShapeRepresentation.
 * @param context Either a specific IfcGeometricRepresentationContext or a ContextType.
 * @param subcontext A ContextIdentifier string, or any if left blank.
 * @param targetView A TargetView string, or any if left blank.
 */
export function isRepresentationOfContext(
	representation: EntityInstance,
	context: EntityInstance | ContextType,
	subcontext?: RepresentationIdentifier | null,
	targetView?: TargetView | null,
): boolean {
	if (context instanceof EntityInstance) {
		return (representation.get("ContextOfItems") as EntityInstance).equals(context);
	}

	const contextOfItems = representation.get("ContextOfItems") as EntityInstance;
	if (targetView != null) {
		return (
			contextOfItems.isA("IfcGeometricRepresentationSubContext") &&
			contextOfItems.get("TargetView") === targetView &&
			contextOfItems.get("ContextIdentifier") === subcontext &&
			contextOfItems.get("ContextType") === context
		);
	}
	if (subcontext != null) {
		return (
			contextOfItems.isA("IfcGeometricRepresentationSubContext") &&
			contextOfItems.get("ContextIdentifier") === subcontext &&
			contextOfItems.get("ContextType") === context
		);
	}

	return contextOfItems.get("ContextType") === context;
}

/**
 * Get an element's `IfcShapeRepresentation`s
 * (`ifcopenshell.util.representation.get_representations_iter`).
 *
 * Ported as a plain eager array, not a TS generator -- see this file's header comment.
 *
 * @param element An IfcProduct or IfcTypeProduct.
 */
export function getRepresentationsIter(element: EntityInstance): EntityInstance[] {
	if (element.isA("IfcProduct")) {
		const rep = attrOrNull(element, "Representation") as EntityInstance | null;
		if (rep) {
			return [...(rep.get("Representations") as EntityInstance[])];
		}
	} else if (element.isA("IfcTypeProduct")) {
		const maps = attrOrNull(element, "RepresentationMaps") as EntityInstance[] | null;
		if (maps) {
			return maps.map((r) => r.get("MappedRepresentation") as EntityInstance);
		}
	}
	return [];
}

/**
 * Gets an `IfcShapeRepresentation` filtered by the context type, identifier, and
 * target view (`ifcopenshell.util.representation.get_representation`).
 *
 * @param element An IfcProduct or IfcTypeProduct.
 * @param context Either a specific IfcGeometricRepresentationContext or a ContextType.
 * @param subcontext A ContextIdentifier string, or any if left blank.
 * @param targetView A TargetView string, or any if left blank.
 * @returns The first IfcShapeRepresentation matching the criteria.
 */
export function getRepresentation(
	element: EntityInstance,
	context: EntityInstance | ContextType,
	subcontext?: RepresentationIdentifier | null,
	targetView?: TargetView | null,
): EntityInstance | null {
	for (const r of getRepresentationsIter(element)) {
		if (isRepresentationOfContext(r, context, subcontext, targetView)) return r;
	}
	return null;
}

/**
 * Guesses the appropriate RepresentationType attribute based on a list of items
 * (`ifcopenshell.util.representation.guess_type`).
 *
 * @param items A list of IfcRepresentationItem, typically in an IfcShapeRepresentation.
 * @returns The appropriate RepresentationType value, or `null` if no valid value.
 *
 * **Disclosed limitation**: the `Curve2D`/`Curve3D`/`Surface2D`/`Surface3D` branches
 * read `.get("Dim")`, a real EXPRESS DERIVED attribute this port's `EntityInstance`
 * cannot resolve (a pre-existing `entityInstance.ts` gap, not introduced here) -- this
 * throws for `items` containing any real `IfcCurve`/`IfcSurface` instance. See this
 * file's header comment for the full story.
 */
export function guessType(items: readonly EntityInstance[]): string | null {
	if (items.every((i) => i.isA("IfcMappedItem"))) return "MappedRepresentation";
	if (items.every((i) => i.isA("IfcPoint") || i.isA("IfcCartesianPointList"))) return "Point";
	if (items.every((i) => i.isA("IfcCartesianPointList3d"))) return "PointCloud";
	if (items.every((i) => i.isA("IfcCurve") && (i.get("Dim") as number) === 2)) return "Curve2D";
	if (items.every((i) => i.isA("IfcCurve") && (i.get("Dim") as number) === 3)) return "Curve3D";
	if (items.every((i) => i.isA("IfcCurve"))) return "Curve";
	if (items.every((i) => i.isA("IfcSegment"))) return "Segment";
	if (items.every((i) => i.isA("IfcSurface") && (i.get("Dim") as number) === 2)) return "Surface2D";
	if (items.every((i) => i.isA("IfcSurface") && (i.get("Dim") as number) === 3)) return "Surface3D";
	if (items.every((i) => i.isA("IfcSurface"))) return "Surface";
	if (items.every((i) => i.isA("IfcSectionedSurface"))) return "SectionedSurface";
	if (items.every((i) => i.isA("IfcAnnotationFillArea"))) return "FillArea";
	if (items.every((i) => i.isA("IfcTextLiteral"))) return "Text";
	if (items.every((i) => i.isA("IfcBSplineSurface"))) return "AdvancedSurface";
	if (items.every((i) => i.isA("IfcGeometricSet") || i.isA("IfcPoint") || i.isA("IfcCurve") || i.isA("IfcSurface")))
		return "GeometricSet";
	if (
		items.every(
			(i) =>
				i.isA("IfcGeometricCurveSet") ||
				(i.isA("IfcGeometricSet") && (i.get("Elements") as EntityInstance[]).every((e) => e.isA("IfcSurface"))) ||
				i.isA("IfcPoint") ||
				i.isA("IfcCurve"),
		)
	)
		return "GeometricCurveSet";
	if (
		items.every(
			(i) =>
				i.isA("IfcPoint") ||
				i.isA("IfcCurve") ||
				i.isA("IfcGeometricCurveSet") ||
				i.isA("IfcAnnotationFillArea") ||
				i.isA("IfcTextLiteral"),
		)
	)
		return "Annotation2D";
	if (items.every((i) => i.isA("IfcTessellatedItem"))) return "Tessellation";
	if (
		items.every(
			(i) => i.isA("IfcTessellatedItem") || i.isA("IfcShellBasedSurfaceModel") || i.isA("IfcFaceBasedSurfaceModel"),
		)
	)
		return "SurfaceModel";
	if (items.every((i) => i.isA() === "IfcExtrudedAreaSolid" || i.isA() === "IfcRevolvedAreaSolid")) return "SweptSolid";
	if (items.every((i) => i.isA("IfcSolidModel"))) return "SolidModel";
	if (
		items.every(
			(i) =>
				i.isA("IfcTessellatedItem") ||
				i.isA("IfcShellBasedSurfaceModel") ||
				i.isA("IfcFaceBasedSurfaceModel") ||
				i.isA("IfcSolidModel"),
		)
	)
		return "SurfaceOrSolidModel";
	if (
		items.every((i) => i.isA("IfcSweptAreaSolid") || i.isA("IfcSweptDiskSolid") || i.isA("IfcSectionedSolidHorizontal"))
	)
		return "AdvancedSweptSolid";
	if (items.every((i) => i.isA("IfcCsgSolid") || i.isA("IfcBooleanClippingResult"))) return "Clipping";
	if (items.every((i) => i.isA("IfcBooleanResult") || i.isA("IfcCsgPrimitive3d") || i.isA("IfcCsgSolid"))) return "CSG";
	if (items.every((i) => i.isA("IfcFacetedBrep"))) return "Brep";
	if (items.every((i) => i.isA("IfcManifoldSolidBrep"))) return "AdvancedBrep";
	if (items.every((i) => i.isA("IfcBoundingBox"))) return "BoundingBox";
	if (items.every((i) => i.isA("IfcSectionedSpine"))) return "SectionedSpine";
	if (items.every((i) => i.isA("IfcLightSource"))) return "LightSource";
	if (items.every((i) => i.isA("IfcVertex"))) return "Vertex";
	if (items.every((i) => i.isA("IfcEdge"))) return "Edge";
	if (items.every((i) => i.isA("IfcPath"))) return "Path";
	if (items.every((i) => i.isA("IfcFace"))) return "Face";
	if (items.every((i) => i.isA("IfcOpenShell"))) return "Shell";
	return null;
}

/**
 * Resolve possibly mapped representation
 * (`ifcopenshell.util.representation.resolve_representation`).
 *
 * @param representation IfcRepresentation.
 * @returns Representation resolved from mappings.
 */
export function resolveRepresentation(representation: EntityInstance): EntityInstance {
	// Tekla 2023 has missing items and mapped representation, though it's invalid IFC.
	const items = arr(attrOrNull(representation, "Items") as EntityInstance[] | null);
	if (items.length === 1 && items[0].isA("IfcMappedItem")) {
		const mappingSource = items[0].get("MappingSource") as EntityInstance;
		const mappedRep = mappingSource.get("MappedRepresentation") as EntityInstance | null;
		if (mappedRep) {
			return resolveRepresentation(mappedRep);
		}
	}
	return representation;
}

/** Python: `class ResolvedItemDict(TypedDict): matrix: ...; item: ...`. */
export interface ResolvedItemDict {
	matrix: MatrixType;
	item: EntityInstance;
}

// Hoisted to module scope (found by this chunk's own `/code-review` pass): the
// identity matrix `matAllcloseIdentity` compares against is a constant -- allocating a
// fresh `mat4.create()` on every call is wasted work on `resolveItems`' own recursive
// hot path (one call per `IfcMappedItem` in a representation graph), with no
// correctness benefit (nothing ever mutates this array).
const IDENTITY_MAT4: MatrixType = mat4.create();

/**
 * Python's `numpy.allclose(a, np.eye(4))` for a `gl-matrix` `mat4`, using numpy's own
 * default tolerances (`rtol=1e-05`, `atol=1e-08`): `|a - b| <= atol + rtol * |b|` for
 * every element. Not exported -- only `resolveItems` below needs this.
 */
function matAllcloseIdentity(m: MatrixType): boolean {
	for (let i = 0; i < 16; i++) {
		const a = m[i] as number;
		const b = IDENTITY_MAT4[i] as number;
		if (Math.abs(a - b) > 1e-8 + 1e-5 * Math.abs(b)) return false;
	}
	return true;
}

/**
 * `ifcopenshell.util.representation.resolve_items` (no dedicated docstring in Python).
 *
 * Resolves a representation's items to their fully-resolved world matrix, recursing
 * through `IfcMappedItem` indirection.
 *
 * **Disclosed, verbatim-preserved Python-source quirk**: when an `IfcMappedItem`'s own
 * `IfcCartesianTransformationOperator3D` is (numerically close to) the identity matrix,
 * the caller-supplied `matrix` is silently discarded for everything nested below that
 * mapped item, rather than composed through as one would expect -- see this file's
 * header comment, finding #2, for the full story and why this is reproduced exactly,
 * not "fixed".
 *
 * @param representation IfcRepresentation.
 * @param matrix The accumulated transformation matrix so far (defaults to identity).
 */
export function resolveItems(representation: EntityInstance, matrix?: MatrixType | null): ResolvedItemDict[] {
	const baseMatrix = matrix ?? mat4.create();
	const results: ResolvedItemDict[] = [];
	for (const item of arr(attrOrNull(representation, "Items") as EntityInstance[] | null)) {
		if (item.isA("IfcMappedItem")) {
			// Python doesn't guard against `get_mappeditem_transformation` returning
			// `None` (the disclosed non-3D-`MappingTarget` gap, `placement.ts`'s own
			// header comment) either -- a `null` here throws naturally below
			// (`matAllcloseIdentity` indexing into `null`), matching Python's own
			// unguarded `np.allclose(None, ...)` `TypeError` crash for that case.
			let repMatrix = getMappeditemTransformation(item) as MatrixType;
			if (!matAllcloseIdentity(repMatrix)) {
				// numpy: `rep_matrix @ matrix.copy()` -- verified (`placement.ts`'s own
				// header comment) to correspond to `mat4.multiply(out, A, B)` with `A`
				// first, `B` second.
				const composed = mat4.create();
				mat4.multiply(composed, repMatrix, baseMatrix);
				repMatrix = composed;
			}
			// See this function's own doc comment: when the `if` above is false,
			// `repMatrix` is intentionally left as the raw, un-composed
			// `get_mappeditem_transformation` result (verbatim Python behavior).
			const mappingSource = item.get("MappingSource") as EntityInstance;
			const mappedRep = mappingSource.get("MappedRepresentation") as EntityInstance;
			results.push(...resolveItems(mappedRep, repMatrix));
		} else {
			results.push({ matrix: mat4.clone(baseMatrix), item });
		}
	}
	return results;
}

/**
 * Resolve representation to its base items, resolving mapped items and boolean results
 * to their operands (`ifcopenshell.util.representation.resolve_base_items`).
 *
 * Ported as a plain eager array, not a TS generator -- see this file's header comment.
 * Python's `queue.pop()` pops from the end of the list (LIFO); TS `Array.prototype.pop`
 * does the same, so traversal order matches exactly.
 */
export function resolveBaseItems(representation: EntityInstance): EntityInstance[] {
	const results: EntityInstance[] = [];
	const queue: EntityInstance[] = [...(representation.get("Items") as EntityInstance[])];
	while (queue.length > 0) {
		const item = queue.pop() as EntityInstance;
		if (item.isA("IfcMappedItem")) {
			const mappingSource = item.get("MappingSource") as EntityInstance;
			const mappedRep = mappingSource.get("MappedRepresentation") as EntityInstance;
			results.push(...resolveBaseItems(mappedRep));
		} else if (item.isA("IfcBooleanResult")) {
			queue.push(item.get("FirstOperand") as EntityInstance);
			queue.push(item.get("SecondOperand") as EntityInstance);
		} else {
			results.push(item);
		}
	}
	return results;
}

const TYPE_PRIORITY: readonly string[] = ["Model", "Plan", "Annotation"];
// **Real, disclosed, verbatim-preserved Python-source bug** (found by this chunk's own
// `/code-review` pass): `"Body-FallBack"` (capital "B" in "Back") here does NOT match
// this file's own `RepresentationIdentifier` type's `"Body-Fallback"` (lowercase
// "allback") a few dozen lines above -- confirmed against the real Python source
// (`representation.py` line 41 declares `REPRESENTATION_IDENTIFIER`'s
// `"Body-Fallback"`; line 378's `identifier_priority` list declares `"Body-FallBack"`
// -- the identical casing mismatch, not introduced by this port). A real
// `IfcGeometricRepresentationSubContext` with `ContextIdentifier == "Body-Fallback"`
// (the officially-documented spelling) therefore never matches this list at all,
// falling through to priority `0` (the "not found" default) in `sortContextKey` below
// -- ranked as if it were an unrecognized identifier, well below `"Axis"`/`"Box"`/etc.,
// rather than second-highest as the documented priority order intends. Reproduced
// verbatim (not "corrected" to `"Body-Fallback"`), matching this file's established
// "preserve real Python bugs, disclose rather than silently fix" convention (see this
// file's header comment, findings #1/#2) -- pinned by a dedicated test in
// `representation.test.ts` asserting the real (surprising) low-priority ranking.
const IDENTIFIER_PRIORITY: readonly string[] = [
	"Body",
	"Body-FallBack",
	"Facetation",
	"FootPrint",
	"Profile",
	"Surface",
	"Reference",
	"Axis",
	"Clearance",
	"Box",
	"Lighting",
	"Annotation",
	"CoG",
];
const TARGET_VIEW_PRIORITY: readonly string[] = [
	"MODEL_VIEW",
	"PLAN_VIEW",
	"REFLECTED_PLAN_VIEW",
	"ELEVATION_VIEW",
	"SECTION_VIEW",
	"GRAPH_VIEW",
	"SKETCH_VIEW",
	"USERDEFINED",
	"NOTDEFINED",
];

/** `get_prioritised_contexts`'s per-context sort key -- a 4-tuple compared
 * lexicographically, matching Python's own tuple comparison semantics. */
function sortContextKey(context: EntityInstance): readonly [number, number, number, number] {
	const contextType = attrOrNull(context, "ContextType") as string | null;
	const typeIndex = contextType ? TYPE_PRIORITY.indexOf(contextType) : -1;
	const p0 = typeIndex >= 0 ? TYPE_PRIORITY.length - typeIndex : 0;

	const contextIdentifier = attrOrNull(context, "ContextIdentifier") as string | null;
	const identifierIndex = contextIdentifier ? IDENTIFIER_PRIORITY.indexOf(contextIdentifier) : -1;
	const p1 = identifierIndex >= 0 ? IDENTIFIER_PRIORITY.length - identifierIndex : 0;

	const targetView = attrOrNull(context, "TargetView") as string | null;
	const targetViewIndex = targetView ? TARGET_VIEW_PRIORITY.indexOf(targetView) : -1;
	const p2 = targetViewIndex >= 0 ? TARGET_VIEW_PRIORITY.length - targetViewIndex : 0;

	const p3 = (attrOrNull(context, "TargetScale") as number | null) || 0;

	return [p0, p1, p2, p3];
}

/** Lexicographic tuple comparison, ascending (matches Python's tuple `<`/`>`). */
function compareTuplesAsc(a: readonly number[], b: readonly number[]): number {
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return (a[i] as number) - (b[i] as number);
	}
	return 0;
}

/**
 * Gets a list of contexts ordered from high priority to low priority
 * (`ifcopenshell.util.representation.get_prioritised_contexts`).
 *
 * Models can contain multiple geometric contexts. When visualising models, you may
 * want to prioritise visualising certain contexts over others, determined by the
 * context type, identifier, target view, and target scale.
 *
 * The default prioritises 3D, then 2D. It then prioritises subcontexts, then contexts.
 * It then prioritises bodies, then others. It also prioritises model views, then plan
 * views, then others.
 *
 * @param ifcFile The model containing contexts.
 * @returns A list of IfcGeometricRepresentationContext (or SubContext) from high
 *   priority to low priority.
 */
export function getPrioritisedContexts(ifcFile: IfcFile): EntityInstance[] {
	// Python's `sorted(..., key=sort_context, reverse=True)`: a *stable* descending
	// sort, meaning tied elements keep their ORIGINAL relative order (not a reversed
	// one) -- not equivalent to "sort ascending, then reverse the whole array".
	// `Array.prototype.sort` is guaranteed stable (ES2019+); a comparator computing
	// `compare(keyB, keyA)` (descending) directly, with no index tiebreaker, achieves
	// the exact same "stable descending" semantics as Python's `reverse=True`.
	//
	// A Schwartzian transform (decorate-sort-undecorate) -- found by this chunk's own
	// `/code-review` pass: an earlier version called `sortContextKey` directly inside
	// the comparator, recomputing each context's key (multiple `EntityInstance.get()`
	// calls, each crossing the native N-API boundary) on every pairwise comparison
	// (O(n log n) key computations) rather than once per context (O(n)), unlike
	// Python's own `sorted(..., key=sort_context)`, which evaluates `key` exactly once
	// per element.
	const decorated = ifcFile
		.byType("IfcGeometricRepresentationContext")
		.map((context) => ({ context, key: sortContextKey(context) }));
	decorated.sort((a, b) => compareTuplesAsc(b.key, a.key));
	return decorated.map((d) => d.context);
}

/**
 * Gets the product definition or representation map of an element
 * (`ifcopenshell.util.representation.get_part_of_product`).
 *
 * This is typically used for setting shape aspects. Note that this will return `null`
 * for IFC2X3 element types **in Python's docstring's stated intent -- see this file's
 * header comment, finding #1, for why the real Python source does NOT actually do this
 * due to a real `"IFX2X3"` typo, reproduced verbatim below.**
 *
 * **Also throws (matching Python) for an `IfcTypeProduct` with a genuinely unset
 * `RepresentationMaps`** -- Python's own source reads that attribute with no `or
 * []`/`getattr(..., default)` guard, so a real, common case (a type object with no
 * geometry mapping assigned yet) raises `TypeError` there; found by this chunk's own
 * `/code-review` pass (an earlier version of this port silently avoided that crash with
 * a `?? []` fallback -- see this file's header comment, finding #1, for the full story).
 *
 * @param element An IfcProduct or IfcTypeProduct.
 * @param context A IfcGeometricRepresentationContext.
 * @returns IfcProductRepresentationSelect.
 */
export function getPartOfProduct(element: EntityInstance, context: EntityInstance): EntityInstance | null {
	if (element.isA("IfcProduct")) {
		return attrOrNull(element, "Representation") as EntityInstance | null;
	}
	// `!== "IFX2X3"` (not `"IFC2X3"`) is a verbatim reproduction of a real Python typo
	// -- see this file's header comment, finding #1. This comparison is therefore
	// always true, for every real schema.
	if (element.isA("IfcTypeProduct") && (element.file as IfcFile).schema !== "IFX2X3") {
		// Python: `element.RepresentationMaps` -- direct attribute access, deliberately
		// NOT the `or []`/`getattr(..., default)` guard this same source file's own
		// `resolve_representation`/`resolve_items` use for their own `Items` reads (see
		// this file's header comment, a real found-by-`/code-review` finding: an
		// earlier version of this port defensively substituted `?? []` here, silently
		// avoiding a crash Python's real source does NOT avoid). For a genuinely unset
		// `RepresentationMaps` (a real, common case -- any `IfcTypeProduct` with no
		// geometry mapping assigned yet), Python's own list comprehension raises
		// `TypeError: 'NoneType' object is not iterable`; `.get(...)` below matches
		// Python's own unguarded direct attribute access exactly (never throws
		// "attribute not declared", since `RepresentationMaps` is always declared on
		// `IfcTypeProduct` -- only the *value* can be `null`), and the un-guarded
		// `.filter(...)` call two lines down throws the TS/JS equivalent
		// (`TypeError: Cannot read properties of null (reading 'filter')`) for the same
		// input, reproducing Python's crash rather than silently avoiding it.
		const maps = element.get("RepresentationMaps") as EntityInstance[] | null;
		const matching = (maps as EntityInstance[]).filter((r) =>
			((r.get("MappedRepresentation") as EntityInstance).get("ContextOfItems") as EntityInstance).equals(context),
		);
		if (matching.length > 0) return matching[0];
	}
	return null;
}

/**
 * Gets the shape aspect relating to an item
 * (`ifcopenshell.util.representation.get_item_shape_aspect`).
 *
 * @param representation The IfcShapeRepresentation that the item is part of.
 * @param item The IfcRepresentationItem you want to get the shape aspect of.
 * @returns IfcShapeAspect, or `null` if none exists.
 */
export function getItemShapeAspect(representation: EntityInstance, item: EntityInstance): EntityInstance | null {
	const file = item.file as IfcFile;
	for (const inverse of file.getInverse(item) as Set<EntityInstance>) {
		if (!inverse.isA("IfcShapeRepresentation")) continue;
		if (
			!(inverse.get("ContextOfItems") as EntityInstance).equals(representation.get("ContextOfItems") as EntityInstance)
		)
			continue;
		const ofShapeAspect = attrOrNull(inverse, "OfShapeAspect") as EntityInstance[] | null;
		if (ofShapeAspect && ofShapeAspect.length > 0) return ofShapeAspect[0];
	}
	return null;
}

/**
 * Get a presentation style associated with a material
 * (`ifcopenshell.util.representation.get_material_style`).
 *
 * @param material The IfcMaterial.
 * @param context IfcGeometricRepresentationContext that the style belongs to.
 * @param ifcClass The class name of the type of style you need, typically
 *   IfcSurfaceStyle for 3D styling.
 * @returns IfcPresentationStyle.
 */
export function getMaterialStyle(
	material: EntityInstance,
	context: EntityInstance,
	ifcClass = "IfcSurfaceStyle",
): EntityInstance | null {
	const definitionRepresentation = attrOrNull(material, "HasRepresentation") as EntityInstance[] | null;
	if (definitionRepresentation && definitionRepresentation.length > 0) {
		for (const styledRep of definitionRepresentation[0].get("Representations") as EntityInstance[]) {
			if (!(styledRep.get("ContextOfItems") as EntityInstance).equals(context)) continue;
			for (const item of styledRep.get("Items") as EntityInstance[]) {
				for (const style of item.get("Styles") as EntityInstance[]) {
					if (style.isA(ifcClass)) return style;
				}
			}
		}
	}
	return null;
}

/**
 * Fetch the reference axis that goes in the +X direction
 * (`ifcopenshell.util.representation.get_reference_line`).
 *
 * A base line will then be offset from this reference line based on the material
 * usage. From that base line, the layer thicknesses will offset again, and be extruded
 * to form the body representation.
 *
 * **Genuinely blocked (disclosed, not stubbed)**: Python's `get_base_extrusions`
 * fallback (`ifcopenshell.util.shape`, a separate, not-yet-ported Tier B module) is
 * only reached when `wall` has NO "Plan"/"Axis"/"GRAPH_VIEW" representation at all --
 * see this file's header comment for the full, verified `if`/`elif` control-flow
 * reasoning. `getReferenceLine` throws a clear, descriptive error only in that one
 * case; every wall WITH a real axis representation (even one whose `Items` contain no
 * `IfcPolyline`/`IfcIndexedPolyCurve`, matching Python's own fall-through) works fully,
 * unaffected.
 *
 * @param wall ifcopenshell.entity_instance.
 * @param fallbackLength If there is no reference axis, assume it starts at the object
 *   placement (i.e. 0.0, 0.0) and extends for this fallback length along the +X axis.
 * @returns A list of two 2D coordinates representing the start and end of the axis.
 *   The axis always goes in the +X direction.
 */
export function getReferenceLine(wall: EntityInstance, fallbackLength = 1.0): [readonly number[], readonly number[]] {
	const axis = getRepresentation(wall, "Plan", "Axis", "GRAPH_VIEW");
	if (axis) {
		for (const item of arr(attrOrNull(resolveRepresentation(axis), "Items") as EntityInstance[] | null)) {
			let points: readonly number[][];
			if (item.isA("IfcPolyline")) {
				points = (item.get("Points") as EntityInstance[]).map((p) => p.getByIndex(0) as number[]);
			} else if (item.isA("IfcIndexedPolyCurve")) {
				points = (item.get("Points") as EntityInstance).get("CoordList") as number[][];
			} else {
				continue;
			}
			if (points[0][0] < points[1][0]) {
				// An axis always goes in the +X direction.
				return [points[0], points[1]];
			}
			return [points[1], points[0]];
		}
	} else {
		// Python's `elif extrusions := ifcopenshell.util.shape.get_base_extrusions
		// (wall):` -- only reached when `axis` is falsy, see this function's own doc
		// comment. `util.shape` is not ported yet (out of this chunk's scope).
		throw new Error(
			'getReferenceLine: wall has no "Plan"/"Axis"/"GRAPH_VIEW" representation -- Python would fall back to ' +
				"`ifcopenshell.util.shape.get_base_extrusions(wall)` here, but `util.shape` is not ported yet in this TS " +
				"port (a separate Tier B module; see TODOS.md). Not stubbed or partially implemented.",
		);
	}
	return [
		[0.0, 0.0],
		[fallbackLength, 0.0],
	];
}
