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
// --- `update_port_placement`: RESOLVED -- `api.geometry.editObjectPlacement` has landed ---
//
// Both `execute`/`execute_ifc2x3` finish (after creating/reusing the rel) by calling
// `update_port_placement`, which -- ONLY if `port.ObjectPlacement` is set AND is an
// `IfcLocalPlacement` -- calls `ifcopenshell.api.geometry.edit_object_placement` to
// re-localize the port's placement (the port now sits under a new `PlacementRelTo`
// parent, `element`'s own placement, and needs its ABSOLUTE world position preserved,
// not its raw relative matrix). `api.geometry.editObjectPlacement` has landed (see
// `../geometry/editObjectPlacement.ts`) -- this now calls it directly, matching real
// Python's own order of operations exactly (create/reuse the rel FIRST,
// placement-fixup LAST). A `port` with no `ObjectPlacement` at all -- true for any
// port fresh out of `root.createEntity`/`system.addPort`, which never sets one -- is
// unaffected (the guard is a no-op), matching `test_assigning_a_port_once_only`'s own
// fixture (a bare `createEntity("IfcDistributionPort")`, no placement).
// `test_updating_the_placement_to_be_relative_if_it_exists` (previously a
// disclosed-throw pin) is now ported for real.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { getLocalPlacement } from "../../util/placement";
import { editObjectPlacement } from "../geometry/editObjectPlacement";
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
 * Python: `Usecase.update_port_placement`. See this file's own header comment -- now
 * fully portable.
 */
function updatePortPlacement(file: IfcFile, port: EntityInstance): void {
	const placement = port.get("ObjectPlacement") as EntityInstance | null;
	if (placement?.isA("IfcLocalPlacement")) {
		editObjectPlacement(file, {
			product: port,
			matrix: getLocalPlacement(placement),
			isSi: false,
		});
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
	updatePortPlacement(file, port);
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

	updatePortPlacement(file, port);

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
 * If `port` already has its own `IfcLocalPlacement`, it is re-localized to preserve
 * its absolute world position under its new parent.
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
