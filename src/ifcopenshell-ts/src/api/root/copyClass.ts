// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/root/copy_class.py` (src/ifcopenshell-python, 193 lines) --
// the last of `api.root`'s 4 functions, completing that module (Phase 6) alongside
// `./reassignClass.ts`. Duplicates a product along with its placement, psets, ports,
// aggregation/containment/type/void/material/group relationships -- explicitly NOT
// representations (real Python's own docstring: "Copying representations is an
// expensive operation so for now the user is responsible for handling representations").
//
// --- Structure: `copyDirectAttributes` (own attributes) + `copyIndirectAttributes`
// (every inverse) ---
//
// `execute`: `util.element.copy` the product itself (shallow, regenerates `GlobalId`),
// strip its representations (`removeRepresentations`), duplicate its `ObjectPlacement`/
// `RelativePlacement` (`copyObjectPlacements`) and, for a type, its `HasPropertySets`
// (`copyPsets`) -- then walk every real inverse of the ORIGINAL product
// (`copyIndirectAttributes`), dispatching on the inverse's class to decide whether the
// new copy: gets its OWN independent duplicate of the relationship (psets, ports,
// non-filled openings, parametric material usages, `IfcMaterialLayerSet`/
// `IfcMaterialProfileSet` material sets), is deliberately left OUT of the relationship
// (aggregation/containment/typing/nesting where the ORIGINAL product is the "whole" side
// -- the copy must not also become parent of the original's own children), or is simply
// ADDED alongside the original into the SAME existing relationship (a shared type,
// shared container, shared aggregate-parent, shared plain material, shared group --
// real Python's own generic fallback branch, ported verbatim including its own
// deliberate MUTATE-the-original-relationship-in-place quirk for a list attribute,
// vs. duplicate-the-relationship-entity for a single-valued one -- see below).
//
// --- Distribution ports: RESOLVED -- now fully portable, no blocked call site left ---
//
// **Distribution ports** (`IfcRelNests`/`IfcRelConnectsPortToElement`, IFC2X3's own
// name for the same concept): real Python recursively `copy_class`-es every nested
// port, builds a fresh nest/connection relationship pointing the copies at the new
// element, then for each new port calls `ifcopenshell.api.system.unassign_port`/
// `.disconnect_port` (severing whatever port-to-port connections got carried over by
// the recursive `copy_class` call's own generic-fallback branch) and
// `ifcopenshell.api.geometry.edit_object_placement` (resetting the copied port's own
// placement to the SAME absolute matrix the original port had, since the new nest
// puts it under a different `PlacementRelTo` parent).
//
// `ifcopenshell.api.system` landed for real (Phase 6, `api.system` chunk), and
// `ifcopenshell.api.geometry.edit_object_placement` has now landed too (see
// `../geometry/editObjectPlacement.ts`) -- this now calls all 3 real functions exactly
// as real Python does, in the same order, for every copied port. A product with no
// nested ports is entirely unaffected.
//
// --- RESOLVED: `IfcMaterialLayerSet`/`IfcMaterialProfileSet`/`IfcMaterialConstituentSet`
// material associations, previously blocked, now call the real `api.material.copyMaterial` ---
//
// (real Python's own `"Set" in inverse.RelatingMaterial.is_a()` check): `api.material`
// chunk 1 landed `copyMaterial` as a real, exported function (`../material/copyMaterial.ts`)
// -- this branch now calls it directly instead of throwing, matching real Python's own
// `inverse.RelatingMaterial = ifcopenshell.api.material.copy_material(self.file, inverse
// .RelatingMaterial)` exactly. A plain `IfcMaterial`/`IfcMaterialList` (no "Set"/"Usage"
// in the class name) or a parametric `IfcMaterialLayerSetUsage`/`IfcMaterialProfileSetUsage`
// (handled by the OTHER, fully-portable material branch just below, real Python's own
// `util.element.copy` shallow-copy path, NOT `api.material.copy_material`) is unaffected
// either way. No material association at all is likewise unaffected.
//
// --- Everything else really is fully portable, confirmed line-by-line against the
// real 193-line source, not assumed from the import list ---
//
// `ifcopenshell.api.root` (self-recursion, both already-landed `createEntity`/
// `removeProduct` neighbours plus this function calling itself for ports/openings),
// `ifcopenshell.util.element` (`copy`/`copyDeep`), `ifcopenshell.api.system
// .unassignPort`/`.disconnectPort` and `ifcopenshell.util.placement.getLocalPlacement`/
// `ifcopenshell.api.geometry.editObjectPlacement` (the ports branch's own real cleanup
// + placement-relocalization calls, see above) are all landed and wired in for real.
//
// --- Self-recursion, matching `../root/removeProduct.ts`'s own established pattern ---
//
// Real Python's own recursive `ifcopenshell.api.root.copy_class(self.file,
// product=...)` calls (for ports and, separately, for non-filled openings) go through
// the module's own `wrap_usecases`-wrapped function, not a raw inner call -- so
// pre/post listeners genuinely fire on every recursive call here too. This port's own
// recursive calls likewise go through this file's own exported, `wrapUsecase`-wrapped
// `copyClass` (referenced by closure from `copyIndirectAttributes`, defined further
// down in this same file -- safe: by the time `copyIndirectAttributes` is actually
// CALLED at runtime, the module has already fully evaluated and `copyClass` is bound),
// not a private unwrapped helper.

import { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { getLocalPlacement } from "../../util/placement";
import { editObjectPlacement } from "../geometry/editObjectPlacement";
import { wrapUsecase } from "../hooks";
import { copyMaterial } from "../material/copyMaterial";
import { disconnectPort } from "../system/disconnectPort";
import { unassignPort } from "../system/unassignPort";

export interface CopyClassSettings {
	/** The `IfcProduct`/`IfcTypeProduct` to copy. */
	product: EntityInstance;
}

/** Python: `Usecase.remove_representations(element)`. */
function removeRepresentations(element: EntityInstance): void {
	if (element.isA("IfcProduct")) {
		element.set("Representation", null);
	} else if (element.isA("IfcTypeProduct")) {
		element.set("RepresentationMaps", null);
	}
}

/** Python: `Usecase.copy_object_placements(element)`. */
function copyObjectPlacements(file: IfcFile, element: EntityInstance): void {
	if (!element.isA("IfcProduct")) return;
	const placement = element.get("ObjectPlacement") as EntityInstance | null;
	if (!placement) return;
	const newPlacement = elementUtil.copy(file, placement);
	element.set("ObjectPlacement", newPlacement);
	newPlacement.set(
		"RelativePlacement",
		elementUtil.copyDeep(file, newPlacement.get("RelativePlacement") as EntityInstance),
	);
}

/** Python: `Usecase.copy_psets(element)`. */
function copyPsets(file: IfcFile, element: EntityInstance): void {
	if (!element.isA("IfcTypeObject")) return;
	const psets = element.get("HasPropertySets") as EntityInstance[] | null;
	if (!psets || psets.length === 0) return;
	element.set(
		"HasPropertySets",
		psets.map((pset) => elementUtil.copyDeep(file, pset)),
	);
}

/** Python: `Usecase.copy_direct_attributes(to_element)`. */
function copyDirectAttributes(file: IfcFile, toElement: EntityInstance): void {
	removeRepresentations(toElement);
	copyObjectPlacements(file, toElement);
	copyPsets(file, toElement);
}

/**
 * Python: `Usecase.copy_indirect_attributes(from_element, to_element)`. Fully portable
 * -- see this file's own header comment for how each branch (ports,
 * `*Set` material associations, and every other real, independent-duplicate /
 * deliberate shared-or-skipped relationship) is handled.
 */
function copyIndirectAttributes(file: IfcFile, fromElement: EntityInstance, toElement: EntityInstance): void {
	// Real Python's `self.file.get_inverse(from_element)` -- a fresh snapshot computed
	// once up front (`IfcFile.getInverse` here is likewise non-live, see `file.ts`'s own
	// `instances_by_reference`-backed implementation), so entities created/mutated
	// during this loop's own recursive `copyClass` calls never retroactively join it --
	// matching real Python's own iteration semantics exactly.
	const inverses = [...(file.getInverse(fromElement) as Set<EntityInstance>)];

	for (let inverse of inverses) {
		if (inverse.isA("IfcRelDefinesByProperties")) {
			// Properties must not be shared between objects for convenience of authoring.
			inverse = elementUtil.copy(file, inverse);
			inverse.set("RelatedObjects", [toElement]);
			const pset = elementUtil.copyDeep(file, inverse.get("RelatingPropertyDefinition") as EntityInstance);
			inverse.set("RelatingPropertyDefinition", pset);
			continue;
		}

		const isNestsWhole =
			inverse.isA("IfcRelNests") && (inverse.get("RelatingObject") as EntityInstance | null)?.equals(fromElement);
		// IfcRelConnectsPortToElement was used in IFC2X3.
		const isPortToElement =
			inverse.isA("IfcRelConnectsPortToElement") &&
			(inverse.get("RelatedElement") as EntityInstance | null)?.equals(fromElement);
		if (isNestsWhole || isPortToElement) {
			const ports: EntityInstance[] = inverse.isA("IfcRelNests")
				? ((inverse.get("RelatedObjects") as EntityInstance[] | null) ?? []).filter((e) => e.isA("IfcDistributionPort"))
				: [inverse.get("RelatingPort") as EntityInstance];
			if (ports.length === 0) continue;

			// Real Python: `new_ports = [ifcopenshell.api.root.copy_class(self.file,
			// product=p) for p in ports]` -- recurses through THIS SAME wrapped `copyClass`
			// export (see this file's own header comment, "Self-recursion"), using the
			// STILL-ORIGINAL `inverse` (not yet reassigned to a copy below). Each recursive
			// call's own `copyIndirectAttributes` walks `p`'s own inverses, which includes
			// this SAME original `inverse` -- since `p` sits inside `inverse`'s own
			// list-valued `RelatedObjects` (IFC4+) or is itself `inverse`'s single-valued
			// `RelatingPort` (IFC2X3), the recursive call's own generic-fallback branch
			// (see this file's own header comment) either MUTATES this exact `inverse` in
			// place (IFC4+: silently appending the new port copy into `fromElement`'s own
			// nest rel) or creates an independent duplicate of it (IFC2X3: a second
			// `IfcRelConnectsPortToElement` also pointing at `fromElement`) -- both real,
			// deliberate quirks (not bugs), exactly why the `unassignPort` cleanup below is
			// needed immediately after, matching real Python's own next step exactly.
			const newPorts = ports.map((port) => copyClass(file, { product: port }));

			inverse = elementUtil.copy(file, inverse);
			if (inverse.isA("IfcRelNests")) {
				inverse.set("RelatingObject", toElement);
				inverse.set("RelatedObjects", newPorts);
			} else {
				inverse.set("RelatedElement", toElement);
				inverse.set("RelatingPort", newPorts[0]);
			}

			for (const newPort of newPorts) {
				// Undoes the recursive-copy side effect disclosed above: strips `newPort`
				// back out of whatever spurious `fromElement`-referencing rel the recursive
				// `copyClass(port)` call's own generic fallback just created/mutated (a
				// duplicate `IfcRelConnectsPortToElement` on IFC2X3, or `fromElement`'s own
				// original nest rel's `RelatedObjects` on IFC4+) -- `unassignPort` already
				// dispatches on schema internally, matching real Python's own single,
				// schema-agnostic call site here.
				unassignPort(file, { element: fromElement, port: newPort });
				// Severs any port-to-port `IfcRelConnectsPorts` connection the recursive
				// `copyClass(port)` call's own generic fallback branch (single-valued
				// `RelatingPort`/`RelatedPort` match) carried over onto `newPort` -- a
				// copied port must not silently inherit the original's own connections.
				disconnectPort(file, { port: newPort });

				// See this file's own header comment ("Distribution ports", RESOLVED now
				// that `api.geometry.editObjectPlacement` has landed) -- resets the copied
				// port's own placement to the SAME absolute matrix the original port had,
				// since the new nest/connection relationship above puts it under a
				// different `PlacementRelTo` parent. Called UNCONDITIONALLY here for every
				// copied port, matching real Python's own call site exactly (unlike
				// `assignPort.ts`'s own placement-guarded call site).
				editObjectPlacement(file, {
					product: newPort,
					matrix: getLocalPlacement(newPort.get("ObjectPlacement") as EntityInstance),
					isSi: false,
				});
			}

			continue;
		}

		if (
			inverse.isA("IfcRelAggregates") &&
			(inverse.get("RelatingObject") as EntityInstance | null)?.equals(fromElement)
		) {
			continue;
		}
		if (
			inverse.isA("IfcRelContainedInSpatialStructure") &&
			(inverse.get("RelatingStructure") as EntityInstance | null)?.equals(fromElement)
		) {
			continue;
		}
		if (
			inverse.isA("IfcRelDefinesByType") &&
			(inverse.get("RelatingType") as EntityInstance | null)?.equals(fromElement)
		) {
			continue;
		}

		if (
			inverse.isA("IfcRelVoidsElement") &&
			(inverse.get("RelatingBuildingElement") as EntityInstance | null)?.equals(fromElement)
		) {
			const opening = inverse.get("RelatedOpeningElement") as EntityInstance;
			// Real Python: `not opening.is_a("IfcOpeningElement") or not opening
			// .HasFillings` -- `or`'s short-circuit means `opening.HasFillings` is NEVER
			// read when `opening` isn't an `IfcOpeningElement` (e.g. a plain
			// `IfcVoidingFeature`, which has no `HasFillings` attribute declared at all --
			// reading it unconditionally would throw). Ported with the identical
			// short-circuit, not a simplified/eager equivalent.
			const isOpeningElement = opening.isA("IfcOpeningElement");
			// We don't copy filled openings, since there is no guarantee the filling is
			// also copied.
			if (!isOpeningElement || ((opening.get("HasFillings") as EntityInstance[] | null) ?? []).length === 0) {
				const newOpening = copyClass(file, { product: opening });
				const voidsElements = newOpening.get("VoidsElements") as EntityInstance[];
				(voidsElements[0] as EntityInstance).set("RelatingBuildingElement", toElement);
				const newOpeningPlacement = newOpening.get("ObjectPlacement") as EntityInstance | null;
				if (newOpeningPlacement?.isA("IfcLocalPlacement")) {
					const toElementPlacement = toElement.get("ObjectPlacement") as EntityInstance | null;
					if (toElementPlacement) {
						newOpeningPlacement.set("PlacementRelTo", toElementPlacement);
					}
				}
				// For now, we do copy opening representations.
				const openingRepresentation = opening.get("Representation") as EntityInstance | null;
				if (openingRepresentation) {
					newOpening.set(
						"Representation",
						elementUtil.copyDeep(file, openingRepresentation, ["IfcGeometricRepresentationContext"]),
					);
				}
			}
			continue;
		}

		if (inverse.isA("IfcRelFillsElement")) continue;
		if (inverse.isA("IfcRelConnectsPathElements")) continue;

		if (inverse.isA("IfcRelAssociatesMaterial")) {
			const relatingMaterial = inverse.get("RelatingMaterial") as EntityInstance;
			const materialClass = relatingMaterial.isA();
			if (materialClass.includes("Usage")) {
				inverse = elementUtil.copy(file, inverse);
				inverse.set("RelatingMaterial", elementUtil.copy(file, relatingMaterial));
				inverse.set("RelatedObjects", [toElement]);
				continue;
			}
			if (materialClass.includes("Set")) {
				// See this file's own header comment ("(2) *Set material associations") --
				// `api.material.copyMaterial` landed for real (api.material chunk 1); this
				// branch now calls it directly instead of throwing.
				inverse = elementUtil.copy(file, inverse);
				inverse.set("RelatingMaterial", copyMaterial(file, { material: relatingMaterial }));
				inverse.set("RelatedObjects", [toElement]);
				continue;
			}
			// Plain IfcMaterial/IfcMaterialList (neither "Usage" nor "Set" in the class
			// name) falls through to the generic fallback below, matching real Python's
			// own `elif` chain exactly -- shared as-is, not duplicated (there's no
			// parametric/set identity to duplicate).
		}

		// Generic fallback: `for i, value in enumerate(inverse): ...` -- real Python's own
		// `entity_instance.__iter__` yields forward attribute values by index, matching
		// `attributeCount()`/`getByIndex` (see `util/element.ts`'s own `replaceAttribute`
		// for the identical, already-established pattern). Two different outcomes,
		// depending on whether the matching attribute is single- or list-valued:
		// - A single-valued attribute equal to `fromElement` gets a NEW, independent
		//   duplicate of `inverse` with just that one attribute repointed at `toElement`
		//   (no real Python call site actually reaches this sub-case with a currently-
		//   ported relationship class, but it's ported verbatim regardless).
		// - A LIST-valued attribute containing `fromElement` instead has `toElement`
		//   appended IN PLACE onto the SAME original `inverse` entity (no copy at all) --
		//   a real, deliberate Python quirk, preserved verbatim, not "fixed": the
		//   ORIGINAL relationship ends up referencing both the original AND the copy.
		//   This is exactly how a shared type (`IfcRelDefinesByType.RelatedObjects`),
		//   container (`IfcRelContainedInSpatialStructure.RelatedElements`), aggregate-
		//   parent (`IfcRelAggregates.RelatedObjects`), or group
		//   (`IfcRelAssignsToGroup.RelatedObjects`) ends up SHARED between original and
		//   copy rather than duplicated -- every one of those classes' own "the other
		//   side is the whole/relating side" attribute is list-valued.
		const count = inverse.attributeCount();
		for (let i = 0; i < count; i++) {
			const value = inverse.getByIndex(i);
			if (value instanceof EntityInstance && value.equals(fromElement)) {
				const newInverse = elementUtil.copy(file, inverse);
				newInverse.setByIndex(i, toElement);
			} else if (Array.isArray(value) && value.some((v) => v instanceof EntityInstance && v.equals(fromElement))) {
				inverse.setByIndex(i, [...(value as unknown[]), toElement]);
			}
		}
	}
}

function copyClassUsecase(file: IfcFile, settings: CopyClassSettings): EntityInstance {
	const { product } = settings;
	const result = elementUtil.copy(file, product);
	copyDirectAttributes(file, result);
	copyIndirectAttributes(file, product, result);
	return result;
}

/**
 * Copies a product (Python: `ifcopenshell.api.root.copy_class`).
 *
 * The following relationships are also duplicated:
 * - The copy will have the same object placement coordinates as the original.
 * - The copy will have duplicated property sets, properties, and quantities.
 * - The copy will have all nested distribution ports copied too, re-localized to the
 *   same absolute placement as the original port.
 * - The copy will be part of the same aggregate.
 * - The copy will be contained in the same spatial structure.
 * - The copy, if it is an occurrence, will have the same type.
 * - Voids are duplicated too.
 * - The copy will have the same material as the original, including a full duplicate
 *   of a genuine `IfcMaterialLayerSet`/`IfcMaterialProfileSet`/`IfcMaterialConstituentSet`
 *   association (via `api.material.copyMaterial`). Parametric material set usages are
 *   copied too.
 * - The copy will be part of the same groups as the original.
 *
 * Be warned that:
 * - Representations are _not_ copied. Copying representations is an expensive
 *   operation so for now the user is responsible for handling representations.
 * - Filled voids are not copied, as there is no guarantee that the filling will also
 *   be copied.
 * - Path connectivity is not copied, as there is no guarantee that the connections are
 *   still valid.
 *
 * @example
 * ```ts
 * // We have a wall.
 * const wall = api.root.createEntity(model, { ifcClass: "IfcWall" });
 *
 * // And now we have two.
 * const wallCopy = api.root.copyClass(model, { product: wall });
 * ```
 */
export const copyClass = wrapUsecase("root.copy_class", copyClassUsecase);
