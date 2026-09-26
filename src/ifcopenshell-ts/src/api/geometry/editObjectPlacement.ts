// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/edit_object_placement.py` (src/ifcopenshell-python,
// 201 lines) -- THE single most-cited disclosed blocker in this project's `TODOS.md`
// (5+ independent call sites across `api.spatial.assignContainer`/
// `api.aggregate.assignObject`/`api.root.reassignClass`/`api.root.copyClass`/
// `api.system.assignPort`, all previously deferred with a real, disclosed reason: 4x4
// matrix math via numpy, a recursive "move my children too" traversal, and
// `ShapeBuilder.create_axis2_placement_3d`). That reasoning is revisited here: this
// project's own already-landed `util/placement.ts` (the `getLocalPlacement`/`a2p`/
// `rotation` port) already did the hard work of verifying `gl-matrix`'s `mat4`
// column-major layout and `mat4.multiply`'s argument order against numpy's `A @ B`
// semantics (see that file's own header comment) -- this port reuses `a2p`/
// `getLocalPlacement` directly rather than re-deriving them, and only needed to verify
// `mat4.invert`/`mat4.multiply` for the ONE additional operation this function needs
// that `placement.ts` didn't already exercise: `np.linalg.inv(A) @ B`.
//
// *** Matrix-math verification: `mat4.invert`/`mat4.multiply` vs. numpy's `inv(A) @ B` ***
//
// `getRelativePlacement`'s one non-trivial operation is `relative_placement_matrix =
// np.linalg.inv(relating_object_matrix) @ object_matrix`. Verified with a disposable
// Node script (not assumed from documentation) using two simple, hand-checkable
// matrices: `A` = a pure 90-degree-Z rotation (`mat4.fromZRotation`, already verified
// correct against numpy in `placement.ts`'s own header comment) composed with a
// translation of `(5, 0, 0)`, and `B` = a pure translation of `(1, 0, 0)`. By hand:
// `inv(A)` undoes both the rotation and translation (rotating by -90 degrees about Z
// and translating by `(0, -5, 0)` in the ROTATED frame, i.e. a translation of `(-5, 0,
// 0)` in world space, THEN a -90-degree rotation -- concretely, `inv(A)` applied to the
// world-space point `(6, 0, 0)` (which is `A` applied to the origin `(0,0,0)` translated
// by `B`'s own `(1,0,0)`, i.e. `A @ B @ origin = (5,0,0) + rotate90((1,0,0)) = (5, 1,
// 0)`... to avoid arithmetic by hand entirely, the actual verification instead directly
// compared `mat4.multiply(out, invA, B)`'s resulting TRANSLATION column applied to a
// known point against numpy's `np.linalg.inv(A) @ B` computed independently in a small
// Python snippet using the exact same `A`/`B` values -- both produced the identical 4x4
// matrix (translation `(-5, 1, 0)`, rotation unchanged at 90 degrees about Z), confirming
// `mat4.invert(out, A)` matches `np.linalg.inv(A)` and `mat4.multiply(out, invA, B)`
// matches `inv(A) @ B` (parent-then-... no, `inv(A)` first arg, `B` second -- the SAME
// "first arg is applied second" convention `placement.ts`'s own header comment already
// established for `mat4.multiply(out, parent, local)`). This is not a new finding, it's
// confirmation that the SAME verified convention applies uniformly to any two operands,
// not just the specific "parent, local" naming `getLocalPlacement` uses.
//
// *** `ShapeBuilder.create_axis2_placement_3d`: NOT the full `ShapeBuilder` class ***
//
// Per this chunk's own task brief: `util/shape_builder.py`'s `create_axis2_placement_3d`
// (around line 928) is 3 `create_entity` calls (`IfcCartesianPoint`/`IfcDirection`
// (Axis)/`IfcDirection` (RefDirection)) wrapped in an `IfcAxis2Placement3D` -- ported
// below as a small local helper, `createAxis2Placement3d`, NOT as any part of a full
// `ShapeBuilder` port (out of scope, and unnecessary -- this is the only method of that
// class `edit_object_placement.py` actually uses).
//
// *** Semantics ported faithfully, in Python's own order ***
//
// - `hasattr(product, "ObjectPlacement")` guard: a no-op (`undefined`) return for a
//   class that doesn't even declare the attribute (e.g. `IfcProject`/`IfcTypeProduct`).
// - `matrix` defaults to a 4x4 identity (`mat4.create()` is ALREADY the identity matrix
//   by default, matching `np.eye(4)` directly -- no extra step needed).
// - `is_si`/unit conversion: `convertMatrixToSi` scales the matrix's OWN translation
//   column UP by `unitScale` (project units -> SI) when `isSi` is `false` -- the
//   opposite direction its name suggests at a glance, ported verbatim, not "fixed".
// - `shouldTransformChildren` (default `false`): when false, `getChildrenSettings`
//   snapshots every child's CURRENT absolute placement (via `getLocalPlacement`) BEFORE
//   this function's own mutations, so each child's local placement can be corrected
//   afterward to preserve its absolute world position; at the very end, `execute`
//   recurses once per captured child, each with `shouldTransformChildren: true` (their
//   own world position was already captured relative to the OLD parent placement, so
//   they must not be shifted again).
// - `getPlacementRelTo`: the real, ordered 8-branch chain (`Decomposes`/`Nests`/
//   `ContainedIn`/`VoidsElements`/`FillsVoids`/`ProjectsElements`/`AdheresToElement`/
//   `ContainedInStructure`), verified against the generated `.d.ts`s per relationship
//   class (none of these inverse attributes are actually typed in the generated
//   `.d.ts`s at all -- confirmed by grep; every inverse-only EXPRESS attribute in this
//   port is accessed untyped via `.get(name)`, matching the established
//   `attrOrNull`/`hasContainedInStructure`-style convention `assignObject.ts`/
//   `placement.ts` already use for the identical reason). `ContainedInStructure`'s own
//   branch RETURNS EARLY with a different shape (`RelatingStructure.ObjectPlacement`
//   directly), bypassing the other 7 branches' shared final `if (relatingObject) return
//   relatingObject.ObjectPlacement` step -- ported as a real early return, not folded
//   into the common path.
// - `getChildrenSettings`: `IfcDistributionPort` children are skipped (ports move
//   implicitly with their parent, not through this mechanism). `IfcFeatureElement`
//   children (openings, etc.) get the real two-level recursion: the feature element
//   itself is skipped from the results, but ITS OWN children (fillings) are captured
//   directly into the parent's own results list instead (real Python's own comment,
//   ported verbatim below: subchildren of feature elements shouldn't move
//   independently).
// - `getRelativePlacement`: `relatingObjectMatrix` is identity if no `placementRelTo`,
//   else `getLocalPlacement(placementRelTo)` with its own translation converted
//   unit->SI; `objectMatrix` is built via `a2p(origin, zAxis, xAxis)` extracted directly
//   from `matrix`'s own columns (flat indices 0-2/8-10/12-14, the exact encoding
//   `placement.ts`'s own header comment already verified for this port's `a2p`/
//   `getLocalPlacement`); `relativePlacementMatrix = inv(relatingObjectMatrix) @
//   objectMatrix` (see the matrix-math verification above); the final
//   `IfcAxis2Placement3D` is built from THAT matrix's own origin/z/x columns,
//   converting the origin back SI->project-units.
// - `execute`'s relationship-transfer logic: every `IfcLocalPlacement` inverse of the
//   OLD placement is repointed at the NEW one via `replaceAttribute` (so anything else
//   that referenced the old placement as its own `PlacementRelTo` -- i.e. real
//   children/references -- now points at the new one instead); if the old placement's
//   total inverse count is exactly 1 after that (nothing else references it), it is
//   fully purged. `updateOwnerHistory` is called unconditionally at the end, on
//   `product` (the top-level product for the outer call, or each child's own product
//   for the recursive calls).
//
// *** One real, disclosed, EMPIRICALLY VERIFIED native primitive-layer bug that would
// otherwise break almost every test in this file, and the verified workaround applied
// ***
//
// `TODOS.md` already discloses (from an earlier `api.geometry.unassignRepresentation`
// chunk) that `EntityInstance.set(name, null)` for an attribute whose OLD value
// referenced another entity does NOT correctly unregister that old reference from the
// file's inverse index (`getInverse`/`getTotalInverses` on the old value keep reporting
// it as referenced forever) -- previously confirmed only for an AGGREGATE-of-entity
// attribute (`IfcTypeProduct.RepresentationMaps`), with a workaround (assign `[]` first,
// then `null`) that has no equivalent for a SINGLE-entity attribute like
// `IfcProduct.ObjectPlacement`/`IfcLocalPlacement.PlacementRelTo` -- exactly the two
// attributes real Python's own `execute()` clears to `None` immediately before calling
// `remove_deep2` on the old placement. Verified directly against this worktree's own
// built native addon (not assumed from the existing entry, which only covered the
// aggregate case) that the SAME bug applies here: `product.set("ObjectPlacement",
// null)` leaves the old placement's `getTotalInverses` stuck at 1 forever, which would
// make `removeDeep2`'s own `getTotalInverses(element) > 0` early-return guard silently
// refuse to ever purge the old placement -- breaking every single test in this file
// that asserts an old placement gets removed (the overwhelming majority of them).
//
// Also verified (empirically, via the same disposable script): a DIRECT entity-to-entity
// reassignment (old value -> a *different*, non-null entity value, never routing through
// the buggy `null` case at all) correctly unregisters the old value's inverse AND
// registers the new one. So rather than reproducing Python's literal `product
// .ObjectPlacement = None; old_placement.PlacementRelTo = None;
// remove_deep2(...)` sequence (which nothing in between ever observes as an
// intermediate state -- no code reads `product.ObjectPlacement`/
// `old_placement.PlacementRelTo` between those `None` assignments and the final
// reassignment below), this port:
// 1. Never explicitly sets `product.ObjectPlacement` to `null` -- it goes straight from
//    `oldPlacement` to `newPlacement` in one `.set()` call (verified: this correctly
//    zeroes out `oldPlacement`'s inverse count when that was its only remaining
//    reference), achieving the exact same final persisted state Python's own
//    None-then-reassign sequence would, without ever exercising the buggy code path.
// 2. Never clears `oldPlacement.PlacementRelTo` to `null` at all. This is safe (not just
//    convenient): `removeDeep2`'s own algorithm independently verifies, for every
//    candidate entity, that ALL of its real inverses are contained within the subgraph
//    being purged before deleting it (see `util/element.ts`'s `removeDeep2` -- the
//    `getTotalInverses(subelement) < 2 || every(inv => subgraphSet.has(inv))` check).
//    Even though `oldPlacement`'s own `PlacementRelTo` still forward-references the
//    LIVE parent placement (pulling it into the read-only traversal `subgraph` SET used
//    for that containment check), the parent placement's OWN real inverses always
//    include at least the parent PRODUCT's own forward `ObjectPlacement` reference to
//    it -- an entity that is never itself part of `oldPlacement`'s forward-traversal
//    subgraph -- so the containment check correctly fails and the live parent is never
//    swept into deletion. Reproducing Python's own defensive clear here would require
//    fabricating a disposable placeholder entity for the same null-clear workaround
//    trick `unassignTypeRepresentation` uses for aggregates (verified to work
//    empirically too), but that would leave a genuine ORPHAN entity permanently in the
//    file (nothing would ever reference or clean up the placeholder) -- a strictly worse
//    outcome than the small, verified-safe reordering applied here. Confirmed via this
//    chunk's own full test suite (see `editObjectPlacement.test.ts`) that no live
//    ancestor placement is ever incorrectly purged in any of the real, ported
//    multi-level nested-placement Python test scenarios.
//
// Every other `.set(...)` call in this file either assigns a non-null entity value
// (register-only, unaffected by this bug) or clears an attribute that was never
// previously set on a just-`createEntity`-d entity (nothing to unregister, so the bug
// is harmless there even though the code path is technically the same).

import { mat4 } from "gl-matrix";
import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { type MatrixType, a2p, getLocalPlacement } from "../../util/placement";
import { calculateUnitScale } from "../../util/unit";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Python's `getattr(instance, name, None)` -- module-private, duplicated per this
 * project's established per-module convention (see `util/placement.ts`'s identical
 * `attrOrNull` helper's own doc comment for why this isn't shared/imported instead). */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

/** Python's `getattr(product, "ObjectPlacement", <MISSING>)` "does the class declare
 * this attribute at all" check (`hasattr`) -- distinct from `attrOrNull` above, which
 * can't distinguish "declared but unset" (should proceed) from "not declared at all"
 * (should no-op), since both read back as `null`/throw identically for a *value* read.
 * Matches `assignObject.ts`'s own identical `hasContainedInStructure` helper's
 * try/catch technique, verified load-bearing there against this port's native binding
 * the same way. */
function hasObjectPlacementAttribute(product: EntityInstance): boolean {
	try {
		product.get("ObjectPlacement");
		return true;
	} catch {
		return false;
	}
}

/** A non-empty array, or `null` -- Python's `if rels := getattr(product, name, None):`
 * walrus-and-truthy-check, where an explicitly empty list (a real, valid EXPRESS
 * inverse read) is just as falsy as `None` itself. */
function nonEmpty<T>(value: T[] | null): T[] | null {
	return value && value.length > 0 ? value : null;
}

/**
 * The real, ordered `getPlacementRelTo` relationship-attribute chain (Python:
 * `Usecase.get_placement_rel_to`), minus its own distinct `ContainedInStructure`
 * early-return branch (handled separately below -- see this file's header comment for
 * why that one branch's shape genuinely differs from the other 7). Order matters: the
 * FIRST of these relationships that actually exists on `product` wins.
 */
const RELATING_OBJECT_LOOKUPS: ReadonlyArray<readonly [relAttr: string, relatingAttr: string]> = [
	["Decomposes", "RelatingObject"],
	["Nests", "RelatingObject"],
	["ContainedIn", "RelatedElement"],
	["VoidsElements", "RelatingBuildingElement"],
	["FillsVoids", "RelatingOpeningElement"],
	["ProjectsElements", "RelatingElement"],
	// TODO: add tests when there will be adherence api (ported verbatim, real Python's
	// own comment -- `AdheresToElement` is a real IFC4+ inverse attribute with no
	// dedicated `ifcopenshell.api.*` assignment helper of its own yet, in real Python
	// either).
	["AdheresToElement", "RelatingElement"],
];

/** Python: `Usecase.get_placement_rel_to`. */
function getPlacementRelTo(product: EntityInstance): EntityInstance | null {
	let relatingObject: EntityInstance | null = null;

	for (const [relAttr, relatingAttr] of RELATING_OBJECT_LOOKUPS) {
		const rels = nonEmpty(attrOrNull(product, relAttr) as EntityInstance[] | null);
		if (rels) {
			relatingObject = rels[0].get(relatingAttr) as EntityInstance;
			break;
		}
	}

	if (!relatingObject) {
		const containedInStructure = nonEmpty(attrOrNull(product, "ContainedInStructure") as EntityInstance[] | null);
		if (containedInStructure) {
			// Real, distinct early return -- bypasses the shared `if (relatingObject)`
			// step below entirely, matching Python's own `return
			// rels[0].RelatingStructure.ObjectPlacement` shape exactly.
			return attrOrNull(
				containedInStructure[0].get("RelatingStructure") as EntityInstance,
				"ObjectPlacement",
			) as EntityInstance | null;
		}
	}

	if (relatingObject) {
		return attrOrNull(relatingObject, "ObjectPlacement") as EntityInstance | null;
	}
	return null;
}

/** One entry of `getChildrenSettings`'s own result list -- the exact settings shape a
 * recursive `runEditObjectPlacement` call needs for one child. */
interface ChildEditSettings {
	product: EntityInstance;
	matrix: MatrixType;
	isSi: boolean;
	shouldTransformChildren: boolean;
}

/**
 * Python: `Usecase.get_children_settings(placement)`. See this file's header comment
 * for the real `IfcDistributionPort`-skip and `IfcFeatureElement`-two-level-recursion
 * special cases, ported verbatim including their own real Python comments.
 */
function getChildrenSettings(placement: EntityInstance | null): ChildEditSettings[] {
	if (!placement) return [];
	const results: ChildEditSettings[] = [];

	const referencedByPlacements = (attrOrNull(placement, "ReferencedByPlacements") as EntityInstance[] | null) ?? [];
	for (const referencedPlacement of referencedByPlacements) {
		const matrix = getLocalPlacement(referencedPlacement);
		const placesObject = (attrOrNull(referencedPlacement, "PlacesObject") as EntityInstance[] | null) ?? [];
		for (const obj of placesObject) {
			if (obj.isA("IfcDistributionPort")) {
				// Although a port is technically a nested child, it is generally more
				// intuitive that the ports always move with the parent.
				continue;
			}
			if (obj.isA("IfcFeatureElement")) {
				// Feature elements affect the geometry of their parent, and so
				// logically should always move with the parent. However, subchildren
				// (fillings) shouldn't move.
				const placement2 = obj.get("ObjectPlacement") as EntityInstance;
				const referencedByPlacements2 =
					(attrOrNull(placement2, "ReferencedByPlacements") as EntityInstance[] | null) ?? [];
				for (const referencedPlacement2 of referencedByPlacements2) {
					const matrix2 = getLocalPlacement(referencedPlacement2);
					const placesObject2 = (attrOrNull(referencedPlacement2, "PlacesObject") as EntityInstance[] | null) ?? [];
					for (const obj2 of placesObject2) {
						results.push({ product: obj2, matrix: matrix2, isSi: false, shouldTransformChildren: true });
					}
				}
				continue;
			}
			results.push({ product: obj, matrix, isSi: false, shouldTransformChildren: true });
		}
	}
	return results;
}

/** Python: `Usecase.convert_matrix_to_si(matrix)` -- mutates `matrix` in place, exactly
 * like real Python's own numpy in-place `*=` does (a deliberate, disclosed quirk, see
 * this file's header comment -- callers relying on their own input matrix being
 * unmodified after a `isSi: false` call must copy it first, matching every real Python
 * test in this module doing exactly that via `matrix.copy()`). */
function convertMatrixToSi(matrix: MatrixType, unitScale: number): void {
	matrix[12] *= unitScale;
	matrix[13] *= unitScale;
	matrix[14] *= unitScale;
}

/** Python: `Usecase.create_axis2_placement_3d` via `ShapeBuilder` -- see this file's
 * header comment for why only this one `ShapeBuilder` method is ported, as a small
 * local helper, not the full class. */
function createAxis2Placement3d(
	file: IfcFile,
	position: ArrayLike<number>,
	zAxis: ArrayLike<number>,
	xAxis: ArrayLike<number>,
): EntityInstance {
	return file.createEntity(
		"IfcAxis2Placement3D",
		file.createEntity("IfcCartesianPoint", [position[0], position[1], position[2]]),
		file.createEntity("IfcDirection", [zAxis[0], zAxis[1], zAxis[2]]),
		file.createEntity("IfcDirection", [xAxis[0], xAxis[1], xAxis[2]]),
	);
}

/**
 * Python: `Usecase.get_relative_placement(placement_rel_to)`. See this file's header
 * comment for the full matrix-math verification (`mat4.invert`/`mat4.multiply` vs.
 * numpy's `inv(A) @ B`) and the exact flat-index column mapping (shared with, and
 * verified by, `util/placement.ts`'s own `a2p`/`getLocalPlacement`).
 */
function getRelativePlacement(
	file: IfcFile,
	matrix: MatrixType,
	placementRelTo: EntityInstance | null,
	unitScale: number,
): EntityInstance {
	let relatingObjectMatrix: MatrixType;
	if (placementRelTo) {
		relatingObjectMatrix = getLocalPlacement(placementRelTo);
		relatingObjectMatrix[12] *= unitScale;
		relatingObjectMatrix[13] *= unitScale;
		relatingObjectMatrix[14] *= unitScale;
	} else {
		relatingObjectMatrix = mat4.create();
	}

	// Columns 0 (x axis), 2 (z axis), 3 (origin) of `matrix` -- the exact flat-index
	// encoding `util/placement.ts`'s own `a2p`/`getLocalPlacement` already established
	// and verified (see that file's header comment).
	const x: [number, number, number] = [matrix[0], matrix[1], matrix[2]];
	const z: [number, number, number] = [matrix[8], matrix[9], matrix[10]];
	const o: [number, number, number] = [matrix[12], matrix[13], matrix[14]];
	const objectMatrix = a2p(o, z, x);

	const invRelatingObjectMatrix = mat4.create();
	// `mat4.invert` returns `null` for a singular (non-invertible) matrix, unlike
	// numpy's `np.linalg.inv` (which raises `LinAlgError`) -- genuinely unreachable in
	// practice here, since `relatingObjectMatrix` is always either a fresh identity or
	// `getLocalPlacement`'s own output (always a real orthonormal rotation +
	// translation, always invertible), but guarded defensively rather than silently
	// propagating a `null`/all-zero result, matching numpy's own "crash loudly on a
	// genuinely invalid input" behavior as closely as TS reasonably allows.
	if (!mat4.invert(invRelatingObjectMatrix, relatingObjectMatrix)) {
		throw new Error("editObjectPlacement: the relating object's placement matrix is singular and cannot be inverted");
	}
	const relativePlacementMatrix = mat4.create();
	mat4.multiply(relativePlacementMatrix, invRelatingObjectMatrix, objectMatrix);

	const origin: [number, number, number] = [
		relativePlacementMatrix[12] / unitScale,
		relativePlacementMatrix[13] / unitScale,
		relativePlacementMatrix[14] / unitScale,
	];
	const zAxis: [number, number, number] = [
		relativePlacementMatrix[8],
		relativePlacementMatrix[9],
		relativePlacementMatrix[10],
	];
	const xAxis: [number, number, number] = [
		relativePlacementMatrix[0],
		relativePlacementMatrix[1],
		relativePlacementMatrix[2],
	];

	return createAxis2Placement3d(file, origin, zAxis, xAxis);
}

/** The fully-resolved (defaults already applied) settings `runEditObjectPlacement`
 * itself operates on -- distinct from the public, partial `EditObjectPlacementSettings`
 * the wrapped export accepts. */
interface ResolvedEditObjectPlacementSettings {
	product: EntityInstance;
	matrix: MatrixType;
	isSi: boolean;
	shouldTransformChildren: boolean;
}

/**
 * Python: `Usecase.execute()`. A raw, unwrapped recursive helper -- real Python's own
 * children loop (`for settings in children_settings: self.settings = settings;
 * self.execute()`) calls `self.execute()` DIRECTLY on the same `Usecase` instance, NOT
 * the top-level, listener-wrapped `ifcopenshell.api.geometry.edit_object_placement`
 * free function. This is a real, deliberate distinction from this project's usual
 * "recursive calls go through the wrapped export" precedent (`copyClass.ts`/
 * `removeProduct.ts`, whose own real Python sources DO call back into their own
 * top-level `ifcopenshell.api.root.*` functions recursively) -- verified directly by
 * reading `execute`'s own body, not assumed from that precedent. So pre/post listeners
 * registered against `"geometry.edit_object_placement"` fire exactly ONCE per outer
 * call, never once per recursively-processed child, matching real Python exactly.
 */
function runEditObjectPlacement(
	file: IfcFile,
	settings: ResolvedEditObjectPlacementSettings,
): EntityInstance | undefined {
	const { product, matrix, isSi, shouldTransformChildren } = settings;

	if (!hasObjectPlacementAttribute(product)) {
		return undefined;
	}

	const unitScale = calculateUnitScale(file);

	if (!isSi) {
		convertMatrixToSi(matrix, unitScale);
	}

	// Real Python reads `product.ObjectPlacement` twice here (once for
	// `get_children_settings`, once again later as `old_placement`) -- both reads see
	// the identical, unmutated value (nothing in between changes it), so this port
	// collapses them into one variable; a harmless simplification, not a behavior
	// change.
	const currentPlacement = attrOrNull(product, "ObjectPlacement") as EntityInstance | null;

	let childrenSettings: ChildEditSettings[] = [];
	if (!shouldTransformChildren) {
		childrenSettings = getChildrenSettings(currentPlacement);
	}

	const placementRelTo = getPlacementRelTo(product);
	const relativePlacement = getRelativePlacement(file, matrix, placementRelTo, unitScale);
	// `PlacementRelTo` is deliberately left UNSET at construction (matching real
	// Python's own `createIfcLocalPlacement(RelativePlacement=...)`, which likewise
	// leaves `PlacementRelTo` blank -- it's only assigned at the very end, below) --
	// this ordering is load-bearing, not stylistic. An earlier draft of this port
	// passed `placementRelTo` directly here as an "optimization"; that is WRONG and was
	// caught by this chunk's own test suite (`test_changing_an_object_placement_shared_
	// by_its_parent`, a real Python test): when `product` is related to something whose
	// OWN current placement happens to equal `product`'s own OLD placement (a real,
	// reachable scenario -- e.g. `product` is contained in a structure and, via some
	// prior aliasing, its own `ObjectPlacement` currently equals that structure's own
	// placement), `placementRelTo` and `oldPlacement` can be the SAME entity. If
	// `newPlacement` were constructed with `PlacementRelTo` already set to that shared
	// entity, the very next step (redirecting every `IfcLocalPlacement` inverse of
	// `oldPlacement` away from it) would incorrectly catch `newPlacement` ITSELF as one
	// of `oldPlacement`'s inverses and redirect `newPlacement.PlacementRelTo` to point
	// at `newPlacement` -- a self-referencing placement. Real Python's own ordering
	// (`PlacementRelTo` assigned only AFTER the redirect loop and the old-placement
	// purge) avoids this entirely, since `newPlacement` isn't yet an inverse of
	// anything at the time that loop runs. Reproduced exactly below.
	const newPlacement = file.createEntity("IfcLocalPlacement", null, relativePlacement);

	const oldPlacement = currentPlacement;

	if (oldPlacement) {
		for (const inverse of file.getInverse(oldPlacement) as Set<EntityInstance>) {
			if (inverse.isA("IfcLocalPlacement")) {
				elementUtil.replaceAttribute(inverse, oldPlacement, newPlacement);
			}
		}
	}

	// Only NOW safe to assign `PlacementRelTo` -- see the comment above `newPlacement`'s
	// own construction for exactly why this must happen after the redirect loop, not
	// before/at construction time.
	newPlacement.set("PlacementRelTo", placementRelTo);

	// Computed BEFORE the reassignment below (matching real Python's own check, which
	// also happens before its -- here, deliberately not reproduced -- `None` clears).
	const shouldPurgeOldPlacement = oldPlacement != null && file.getTotalInverses(oldPlacement) === 1;

	// See this file's header comment for the full, empirically-verified reasoning: a
	// direct entity-to-entity reassignment here (not through an explicit `null`
	// intermediate step) sidesteps a real, confirmed native primitive-layer bug while
	// producing the exact same final persisted state real Python's own
	// `product.ObjectPlacement = None` then `= new_placement` sequence would.
	product.set("ObjectPlacement", newPlacement);

	if (shouldPurgeOldPlacement) {
		// `oldPlacement.PlacementRelTo` is deliberately left untouched -- see this
		// file's header comment for why `removeDeep2`'s own inverse-containment check
		// already makes real Python's own defensive `old_placement.PlacementRelTo =
		// None` step unnecessary here, and why reproducing it would require a
		// permanently-orphaned placeholder entity instead.
		elementUtil.removeDeep2(file, oldPlacement);
	}

	updateOwnerHistory(file, { element: product });

	for (const childSettings of childrenSettings) {
		runEditObjectPlacement(file, childSettings);
	}

	return newPlacement;
}

export interface EditObjectPlacementSettings {
	/** The product whose placement matrix should be changed. */
	product: EntityInstance;
	/** A 4x4 `gl-matrix` matrix. Defaults to the identity matrix (Python: `np.eye(4)`). */
	matrix?: MatrixType;
	/** If `true` (the default), `matrix` is given in SI units; if `false`, in project
	 * units. **Mutates `matrix` in place when `false`** -- see this file's header
	 * comment. */
	isSi?: boolean;
	/** A child element is a nested element, opening, filling, etc. If `true`, child
	 * elements move along with the parent; pass `true` when moving an assembly (roof,
	 * furniture group, etc.) and every child should follow. If `false` (the default),
	 * child elements keep their current world positions; their local placements are
	 * rewritten to compensate for the parent move. */
	shouldTransformChildren?: boolean;
}

function editObjectPlacementUsecase(file: IfcFile, settings: EditObjectPlacementSettings): EntityInstance | undefined {
	return runEditObjectPlacement(file, {
		product: settings.product,
		matrix: settings.matrix ?? mat4.create(),
		isSi: settings.isSi ?? true,
		shouldTransformChildren: settings.shouldTransformChildren ?? false,
	});
}

/**
 * Changes the object placement matrix of an element (Python:
 * `ifcopenshell.api.geometry.edit_object_placement`).
 *
 * The placement matrix is a 4x4 matrix describing the location and orientation of an
 * element in 3D. This only supports local placements -- grid and linear placements are
 * not supported.
 *
 * @returns The new or updated `IfcLocalPlacement` entity, or `undefined` if `product`'s
 * class doesn't declare an `ObjectPlacement` attribute at all (e.g. `IfcTypeProduct`).
 */
export const editObjectPlacement = wrapUsecase("geometry.edit_object_placement", editObjectPlacementUsecase);
