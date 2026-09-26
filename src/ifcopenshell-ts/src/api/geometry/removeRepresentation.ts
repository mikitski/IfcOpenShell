// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/remove_representation.py` (src/ifcopenshell-python,
// 92 lines) -- see `./unassignRepresentation.ts`'s own header comment for why this is
// ported here, alongside that file, as a small, self-contained, minimal dependency of
// `api.context.removeContext`, and NOT the rest of `ifcopenshell.api.geometry` (which
// has no TS port of any kind yet -- `edit_object_placement` remains a genuine, disclosed
// blocker, see `TODOS.md`). Verified directly: this file's only import is
// `ifcopenshell.util.element` (already fully ported) -- no kernel/matrix-math
// dependency, unlike `edit_object_placement`.
//
// Removes an `IfcRepresentation`, purging its representation items and any related
// elements (`IfcStyledItem`, tessellated faceset colours/textures, presentation-layer
// assignments) that become orphaned as a result -- but never an
// `IfcGeometricRepresentationContext` (explicitly protected, `do_not_delete`) or a
// *named* `IfcProfileDef` (protected by default via `should_keep_named_profiles`, since
// a named profile is assumed to be curated as part of a shared profile library, not
// disposable representation-item plumbing).
//
// --- Real, schema-dependent inverse-attribute-name branch, ported verbatim (matching
// the identical branch this project's still-unported `util.element.get_layers` has --
// confirmed directly against that real Python source too, not assumed) ---
//
// `IfcRepresentationItem.LayerAssignment` (singular) is the real IFC4+ inverse
// attribute name; IFC2X3 instead declares `LayerAssignments` (plural) on
// `IfcGeometricRepresentationItem` -- a genuine cross-schema attribute-name difference,
// not a typo (confirmed against `ifcopenshell.util.element.get_layers`'s own identical
// `if ifc_file.schema == "IFC2X3": ... subelement.LayerAssignments ... else: ...
// subelement.LayerAssignment` branch). `IfcRepresentation.LayerAssignments` (plural),
// by contrast, is the same name on every schema -- only the *item*-level inverse name
// changes.
//
// --- Identity-keyed sets throughout, matching `util/element.ts`'s own established
// per-module-private `EntityInstanceSet` convention (duplicated here, not imported --
// see `../aggregate/unassignObject.ts`'s identical helper's own doc comment for why) ---
//
// Every Python `set()` in this function (`styled_items`, `presentation_layer_
// assignments_items`/`_reps`, `textures`, `colours`, `named_profiles`, `do_not_delete`)
// is backed by `EntityInstanceSet` below rather than a native JS `Set<EntityInstance>`
// -- this project's `.get()` calls return a fresh JS wrapper object per access, not a
// stable per-pointer identity (`planning/ifcopenshell-ts/PROGRESS.md`'s Phase 1 gaps
// list), so a plain `Set`/`===`-based membership check would silently fail to dedupe
// two wrapper instances of the very same underlying STEP entity.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

/**
 * Local identity-keyed set -- see this file's header comment and `util/element.ts`'s
 * own private `EntityInstanceSet` for why. Not exported, matching every other `api.*`
 * module's own duplicated-per-file copy of this exact class.
 */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	has(instance: EntityInstance | null | undefined): boolean {
		if (!instance) return false;
		return this.byIdentity.has(instance.identity());
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface RemoveRepresentationSettings {
	/**
	 * The `IfcRepresentation` to remove. Note that it's expected that the
	 * representation won't be in use before calling this function (e.g. as part of an
	 * `IfcProductRepresentation`/`IfcShapeAspect`) -- otherwise it won't actually be
	 * removed.
	 */
	representation: EntityInstance;
	/**
	 * If `true` (the default), named profile defs will not be removed as they are
	 * assumed to be significant (i.e. curated as part of a profile library).
	 */
	shouldKeepNamedProfiles?: boolean;
}

function removeRepresentationUsecase(file: IfcFile, settings: RemoveRepresentationSettings): void {
	const { representation } = settings;
	const shouldKeepNamedProfiles = settings.shouldKeepNamedProfiles ?? true;
	const isIfc2x3 = file.schema === "IFC2X3";

	const styledItems = new EntityInstanceSet();
	const presentationLayerAssignmentsItems = new EntityInstanceSet();
	const presentationLayerAssignmentsReps = new EntityInstanceSet();
	const textures = new EntityInstanceSet();
	const colours = new EntityInstanceSet();
	const namedProfiles = new EntityInstanceSet();

	for (const subelement of file.traverse(representation)) {
		if (subelement.isA("IfcRepresentationItem")) {
			styledItems.update((subelement.get("StyledByItem") as EntityInstance[] | null) ?? []);
			// IFC2X3 uses `LayerAssignments` (plural); IFC4+ uses `LayerAssignment`
			// (singular) -- see this file's header comment.
			const layerAssignments = isIfc2x3
				? ((subelement.get("LayerAssignments") as EntityInstance[] | null) ?? [])
				: ((subelement.get("LayerAssignment") as EntityInstance[] | null) ?? []);
			presentationLayerAssignmentsItems.update(layerAssignments);
			// IfcTessellatedFaceSet inverses.
			if (subelement.isA("IfcTessellatedFaceSet")) {
				textures.update((subelement.get("HasTextures") as EntityInstance[] | null) ?? []);
				colours.update((subelement.get("HasColours") as EntityInstance[] | null) ?? []);
			}
		} else if (subelement.isA("IfcRepresentation")) {
			presentationLayerAssignmentsReps.update((subelement.get("LayerAssignments") as EntityInstance[] | null) ?? []);
		} else if (subelement.isA("IfcProfileDef") && subelement.get("ProfileName")) {
			namedProfiles.add(subelement);
		}
	}

	const doNotDelete = new EntityInstanceSet();
	doNotDelete.update(file.byType("IfcGeometricRepresentationContext"));
	if (shouldKeepNamedProfiles) {
		doNotDelete.update(namedProfiles.values());
	}

	// Order matters -- layer assignments may reference representation directly.
	const alsoConsider: EntityInstance[] = [...presentationLayerAssignmentsReps.values()];
	alsoConsider.push(
		...presentationLayerAssignmentsItems.values().filter((item) => !presentationLayerAssignmentsReps.has(item)),
	);
	alsoConsider.push(...styledItems.values());
	alsoConsider.push(...textures.values());

	elementUtil.removeDeep2(file, representation, alsoConsider, doNotDelete.values());

	for (const texture of textures.values()) {
		elementUtil.removeDeep2(file, texture);
	}
	for (const colour of colours.values()) {
		elementUtil.removeDeep2(file, colour);
	}

	const toDelete = new EntityInstanceSet();
	toDelete.update(file.toDelete ?? []);

	for (const element of styledItems.values()) {
		const item = element.get("Item") as EntityInstance | null;
		if (!item || toDelete.has(item)) {
			file.remove(element);
		}
	}

	const presentationLayerAssignments = new EntityInstanceSet();
	presentationLayerAssignments.update(presentationLayerAssignmentsReps.values());
	presentationLayerAssignments.update(presentationLayerAssignmentsItems.values());
	for (const element of presentationLayerAssignments.values()) {
		// Python: `all(item in to_delete for item in element.AssignedItems)` -- vacuously
		// `true` for an empty `AssignedItems` (Python's own `all([])`), matching JS
		// `Array.prototype.every`'s identical vacuous-truth behavior for `[]`.
		const assignedItems = (element.get("AssignedItems") as EntityInstance[] | null) ?? [];
		if (assignedItems.every((item) => toDelete.has(item))) {
			file.remove(element);
		}
	}
}

/**
 * Removes a representation (Python: `ifcopenshell.api.geometry.remove_representation`).
 *
 * Also purges representation items and their related elements like `IfcStyledItem`,
 * tessellated faceset colours, and UV maps.
 *
 * By default, named profiles are assumed to be significant (i.e. curated as part of a
 * profile library) and will not be removed.
 */
export const removeRepresentation = wrapUsecase("geometry.remove_representation", removeRepresentationUsecase);
