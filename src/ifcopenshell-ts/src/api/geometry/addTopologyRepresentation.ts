// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/add_topology_representation.py`
// (src/ifcopenshell-python, 97 lines) -- a NEW `api.geometry` chunk (see
// `./index.ts`'s own header comment for the module's overall scope). Verified
// directly: this file's only import is `ifcopenshell` itself (no `util`/kernel
// dependency at all). Note the real Python source's own copyright year is "2026" --
// this is a genuinely recent (AI-assisted, per its own trailing `# This file was
// generated with the assistance of an AI coding tool.` line) addition to
// ifcopenshell-python itself, not a pre-existing function this port is late to.
//
// Builds an `IfcTopologyRepresentation(ContextOfItems, RepresentationIdentifier,
// RepresentationType, Items)` wrapping a single topological item -- the topology
// counterpart to `IfcShapeRepresentation`-based helpers like
// `./addFootprintRepresentation.ts` (its own header comment already confirms
// `IfcShapeRepresentation`'s 4-attribute shape is flat/identical across all 3
// schemas). `IfcTopologyRepresentation` itself is confirmed to have that EXACT SAME
// 4-attribute shape and order, independently verified identical across all 3 schemas'
// generated `.d.ts`s here too. Established `add_*_representation` convention this
// port already follows (`RepresentationIdentifier` defaults to
// `context.ContextIdentifier` when omitted, matching
// `./addFootprintRepresentation.ts`'s own identical default and Python's own
// `context.ContextIdentifier` unconditional read -- no validation against the
// context's own `ContextIdentifier`/`ContextType` here either, matching that file's
// own disclosed non-validation).
//
// `RepresentationType` inference (`_ITEM_TYPE_TO_REP_TYPE`, a `dict[str, str]` in
// Python) is ported as an ordered array of `[ifcClass, repType]` pairs rather than a
// TS `Record`/`Map` literal -- Python's `for ifc_class, rep_type in
// _ITEM_TYPE_TO_REP_TYPE.items(): if item.is_a(ifc_class): ...; break` walk depends on
// INSERTION ORDER (guaranteed since Python 3.7 dicts preserve it), and the real
// source's own dict has "IfcFace" listed before "IfcClosedShell"/"IfcOpenShell"/
// "IfcConnectedFaceSet" -- since `isA` is subtype-inclusive (matches the item's class
// OR any of its declared subtypes), an item whose exact class is, say,
// `IfcConnectedFaceSet` still only ever hits its FIRST matching entry in iteration
// order (here, "IfcFace" itself is not a supertype of `IfcConnectedFaceSet`, so no
// ordering ambiguity actually arises across these 12 entries in practice -- verified
// by checking each one is a leaf/near-leaf class with no other entry as its
// supertype -- but the port preserves the exact iteration order anyway, matching
// Python's `for...break` control flow precisely rather than relying on that
// verification alone). Falls back to `"Undefined"` (Python's `else` clause on the
// `for` loop, executed only when the loop completes without ever `break`ing) when no
// entry matches.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

/** Python: `_ITEM_TYPE_TO_REP_TYPE`, an ordered `dict[str, str]` -- see this file's
 * header comment for why iteration order is preserved as an array of pairs. */
const ITEM_TYPE_TO_REP_TYPE: ReadonlyArray<readonly [string, string]> = [
	["IfcVertex", "Vertex"],
	["IfcVertexPoint", "Vertex"],
	["IfcEdge", "Edge"],
	["IfcOrientedEdge", "Edge"],
	["IfcEdgeCurve", "Edge"],
	["IfcEdgeLoop", "Edge"],
	["IfcPath", "Edge"],
	["IfcFace", "Face"],
	["IfcFaceSurface", "Face"],
	["IfcAdvancedFace", "Face"],
	["IfcClosedShell", "Face"],
	["IfcOpenShell", "Face"],
	["IfcConnectedFaceSet", "Face"],
];

export interface AddTopologyRepresentationSettings {
	/**
	 * The `IfcGeometricRepresentationContext` for the representation, typically a
	 * Reference context.
	 */
	context: EntityInstance;
	/**
	 * The `IfcTopologicalRepresentationItem` (e.g. `IfcFaceSurface`, `IfcEdge`) to
	 * include in the representation.
	 */
	item: EntityInstance;
	/**
	 * The `RepresentationIdentifier` string. Defaults to the context's own
	 * `ContextIdentifier`.
	 */
	representationIdentifier?: string | null;
	/**
	 * The `RepresentationType` string (`"Face"`/`"Edge"`/`"Vertex"`). Inferred from
	 * `item`'s class if not given.
	 */
	representationType?: string | null;
}

function addTopologyRepresentationUsecase(file: IfcFile, settings: AddTopologyRepresentationSettings): EntityInstance {
	const { context, item } = settings;

	const representationIdentifier =
		settings.representationIdentifier ?? (context.get("ContextIdentifier") as string | null);

	let representationType = settings.representationType;
	if (representationType === null || representationType === undefined) {
		representationType = "Undefined";
		for (const [ifcClass, repType] of ITEM_TYPE_TO_REP_TYPE) {
			if (item.isA(ifcClass)) {
				representationType = repType;
				break;
			}
		}
	}

	return file.createEntity("IfcTopologyRepresentation", context, representationIdentifier, representationType, [item]);
}

/**
 * Adds an `IfcTopologyRepresentation` for a structural element (Python:
 * `ifcopenshell.api.geometry.add_topology_representation`).
 *
 * Structural analysis elements (`IfcStructuralSurfaceMember`,
 * `IfcStructuralCurveMember`) use topology representations rather than solid
 * geometry. This is analogous to `add_axis_representation` and
 * `add_profile_representation` (neither yet ported) but produces an
 * `IfcTopologyRepresentation` instead of an `IfcShapeRepresentation`.
 *
 * The representation type (`"Face"`, `"Edge"`, `"Vertex"`) is inferred from the
 * item's IFC class if not provided explicitly.
 */
export const addTopologyRepresentation = wrapUsecase(
	"geometry.add_topology_representation",
	addTopologyRepresentationUsecase,
);
