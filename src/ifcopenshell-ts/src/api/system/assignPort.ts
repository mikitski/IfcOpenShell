// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/system/assign_port.py` (src/ifcopenshell-python, 122
// lines) -- part of this project's `api.system` chunk (see `./index.ts`'s own header
// comment). Real Python structures this as a `Usecase` class with
// `execute`/`execute_ifc2x3`/`update_port_placement` methods -- ported as plain
// functions threading `file`/settings through explicitly, matching this project's
// established "no `class Usecase`" convention (see e.g. `../material/assignMaterial.ts`).
//
// --- IFC4+ (`execute`): `IfcRelNests`, reuse-or-create ---
//
// Looks for `port` among any of `element.IsNestedBy`'s existing `RelatedObjects` --
// returns that rel unchanged if found (a port is only ever assigned once, matching
// `test_assigning_a_port_once_only`). Otherwise: if `element` already has AT LEAST ONE
// `IsNestedBy` rel (nesting something else -- typically not port-related at all, but
// real Python doesn't check the rel's own semantics, just its existence), `port` is
// added into that FIRST rel's `RelatedObjects` (deduplicated via a by-identity set,
// matching real Python's own `set(rel.RelatedObjects) or set()` -- ported via the
// `EntityInstanceSet` helper, this project's established local-per-module pattern, see
// `../group/assignGroup.ts`'s identical helper's own doc comment). If `element` has NO
// `IsNestedBy` rel at all yet, a brand-new `IfcRelNests` is created instead.
//
// --- IFC2X3 (`execute_ifc2x3`): `IfcRelConnectsPortToElement` ---
//
// `IfcRelNests` doesn't exist on IFC2X3 (see `./unassignPort.ts`'s own identical
// finding) -- port assignment uses the dedicated `IfcRelConnectsPortToElement` class,
// found/created via the element's own `HasPorts` inverse.
//
// --- THE ONE DISCLOSED BLOCKER: `update_port_placement` needs
// `api.geometry.edit_object_placement`, not ported anywhere in this project ---
//
// Both `execute`/`execute_ifc2x3` finish (after creating/reusing the rel) by calling
// `update_port_placement`, which -- ONLY if `port.ObjectPlacement` is set AND is an
// `IfcLocalPlacement` -- calls `ifcopenshell.api.geometry.edit_object_placement` to
// re-localize the port's placement (the port now sits under a new `PlacementRelTo`
// parent, `element`'s own placement, and needs its ABSOLUTE world position preserved,
// not its raw relative matrix). `api.geometry.editObjectPlacement` has NO TS port of
// any kind (confirmed by directory listing -- the same pre-existing blocker `TODOS.md`
// already tracks for `api.spatial.assignContainer`/`api.aggregate.assignObject`/
// `api.root.copyClass`).
//
// Per this project's established "throw only at the exact blocked point, never
// proactively, never after a mutation real Python wouldn't already have done" rule
// (see `../style/addSurfaceTextures.ts`'s own header comment for the same discipline):
// this function performs the ENTIRE rest of `assign_port` -- finding/reusing an
// existing rel, or creating a brand-new one -- exactly as real Python does BEFORE ever
// calling `update_port_placement` (real Python's own order: create/reuse the rel
// FIRST, placement-fixup LAST), then throws only if `port` actually has an
// `IfcLocalPlacement` set (the one condition under which real Python would actually
// reach the blocked call). A `port` with no `ObjectPlacement` at all -- true for any
// port fresh out of `root.createEntity`/`system.addPort`, which never sets one -- is
// entirely unaffected and completes normally, matching
// `test_assigning_a_port_once_only`'s own fixture (a bare `createEntity
// ("IfcDistributionPort")`, no placement). Only a caller who has ALREADY given `port`
// its own `IfcLocalPlacement` (e.g. via a real `editObjectPlacement` call happening
// through some other, non-`api.system` path, or a hand-built fixture) hits the throw --
// see `test_updating_the_placement_to_be_relative_if_it_exists`'s own Python fixture,
// which does exactly this, pinned here as a disclosed-throw regression test instead
// (see `TODOS.md`).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

/** Local by-identity set -- see `../group/assignGroup.ts`'s identical helper's own doc comment. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();
	add(instance: EntityInstance | null | undefined): void {
		if (!instance) return;
		this.byIdentity.set(instance.identity(), instance);
	}
	update(instances: Iterable<EntityInstance | null | undefined>): void {
		for (const instance of instances) this.add(instance);
	}
	values(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface AssignPortSettings {
	/** The `IfcDistributionElement` to assign the port to. */
	element: EntityInstance;
	/** The `IfcDistributionPort` you want to assign. */
	port: EntityInstance;
}

/**
 * Python: `Usecase.update_port_placement`. See this file's own header comment for the
 * one disclosed blocker this throws for.
 */
function updatePortPlacement(port: EntityInstance): void {
	const placement = port.get("ObjectPlacement") as EntityInstance | null;
	if (placement?.isA("IfcLocalPlacement")) {
		// See this file's own header comment -- `api.geometry.editObjectPlacement` has no
		// TS port of any kind. Thrown here, at the exact point real Python would call it,
		// after the rel has already been created/reused (matching real Python's own
		// order of operations exactly).
		throw new Error(
			`assignPort: re-localizing port#${port.id()}'s IfcLocalPlacement needs api.geometry.editObjectPlacement, not ported yet -- see TODOS.md.`,
		);
	}
}

function assignPortIfc2x3(file: IfcFile, settings: AssignPortSettings): EntityInstance {
	const { element, port } = settings;
	for (const rel of (element.get("HasPorts") as EntityInstance[] | null) ?? []) {
		if ((rel.get("RelatingPort") as EntityInstance).equals(port)) {
			return rel;
		}
	}
	const rel = file.createEntity(
		"IfcRelConnectsPortToElement",
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		null, // Description
		port, // RelatingPort
		element, // RelatedElement
	);
	updatePortPlacement(port);
	return rel;
}

function assignPortNonIfc2x3(file: IfcFile, settings: AssignPortSettings): EntityInstance {
	const { element, port } = settings;
	const rels = (element.get("IsNestedBy") as EntityInstance[] | null) ?? [];

	for (const rel of rels) {
		if ((rel.get("RelatedObjects") as EntityInstance[]).some((o) => o.equals(port))) {
			return rel;
		}
	}

	let rel: EntityInstance;
	if (rels.length > 0) {
		rel = rels[0];
		const relatedObjects = new EntityInstanceSet();
		relatedObjects.update(rel.get("RelatedObjects") as EntityInstance[]);
		relatedObjects.add(port);
		rel.set("RelatedObjects", relatedObjects.values());
		updateOwnerHistory(file, { element: rel });
	} else {
		rel = file.createEntity(
			"IfcRelNests",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			element, // RelatingObject
			[port], // RelatedObjects
		);
	}

	updatePortPlacement(port);

	return rel;
}

function assignPortUsecase(file: IfcFile, settings: AssignPortSettings): EntityInstance {
	if (file.schema === "IFC2X3") {
		return assignPortIfc2x3(file, settings);
	}
	return assignPortNonIfc2x3(file, settings);
}

/**
 * Assigns a port to an element (Python: `ifcopenshell.api.system.assign_port`).
 *
 * If you have an orphaned port, you may assign it to a distribution element using
 * this function. Ports should typically not be orphaned, but it may be useful when
 * patching up models.
 *
 * See this file's own header comment for the one disclosed case (`port` already has
 * its own `IfcLocalPlacement`) where this throws instead of completing, pending
 * `api.geometry.editObjectPlacement`.
 *
 * @returns The `IfcRelNests` relationship, or the `IfcRelConnectsPortToElement` for
 * IFC2X3.
 *
 * @example
 * ```ts
 * // Create a duct
 * const duct = api.root.createEntity(model, { ifcClass: "IfcDuctSegment", predefinedType: "RIGIDSEGMENT" });
 *
 * // Create 2 ports, one for either end.
 * const port1 = api.system.addPort(model, { element: duct });
 * const port2 = api.system.addPort(model, { element: duct });
 *
 * // Unassign one port for some weird reason.
 * api.system.unassignPort(model, { element: duct, port: port1 });
 *
 * // Reassign it back
 * api.system.assignPort(model, { element: duct, port: port1 });
 * ```
 */
export const assignPort = wrapUsecase("system.assign_port", assignPortUsecase);
