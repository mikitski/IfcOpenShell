// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/map_representation.py` (src/ifcopenshell-python,
// 64 lines) -- part of `api.geometry`'s first real chunk (alongside
// `./assignRepresentation.ts`, its own primary caller), landed early because MULTIPLE
// already-merged chunks (`api.type.mapTypeRepresentations`, `api.root.reassignClass`'s
// `switchBetweenClassTypes`) disclosed real, loud-throw blockers citing this function
// and `assign_representation` by name. Verified directly (not assumed): this file has
// NO `ifcopenshell.api.*`/`ifcopenshell.util.*` import at all -- fully self-contained,
// no `numpy`/matrix-math dependency of any kind (unlike the still-unported
// `edit_object_placement.py`).
//
// Wraps `representation` in a fresh `IfcMappedItem`, reusing (or creating) the
// underlying `IfcRepresentationMap` -- the mechanism `assign_representation` uses to
// cascade a type's own representation onto every real occurrence of that type, and
// that a manual caller can also use directly to create additional mapped instances of
// an existing representation (e.g. multiple `IfcFurniture` occurrences all reusing one
// `IfcFurnitureType`'s chair mesh, positioned differently via each `IfcMappedItem`'s own
// `MappingTarget`).
//
// --- `get_mapping_source`: reuse-or-create, first inverse found wins ---
//
// Real Python scans `representation`'s OWN inverses (`file.get_inverse(representation)`)
// for the first `IfcRepresentationMap` whose `MappedRepresentation` is `representation`
// itself, and reuses it verbatim if found -- otherwise creates a brand new one (with a
// fresh identity 3D origin: `IfcCartesianPoint(0,0,0)`/`IfcDirection(0,0,1)` (Axis)/
// `IfcDirection(1,0,0)` (RefDirection), matching `assign_representation`'s own identical
// origin construction for a type's `RepresentationMaps` entry). `get_inverse` order is
// whatever the native inverse index returns first -- not deterministic beyond "some
// `IfcRepresentationMap` referencing this exact representation", ported as-is (real
// Python makes the identical assumption, taking `for inverse in ...: return inverse` on
// the very first match).
//
// --- Positional `createEntity` calls: real Python's `createIfcXxx(...)`/`create_entity`
// kwargs calls, re-derived from the generated `.d.ts`s (this port's `createEntity` is
// positional-only, no keyword-argument support -- see `file.ts`'s own `createEntity` doc
// comment) ---
//
// Every entity class this file constructs was checked against all 3 schemas'
// `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts` and found IDENTICAL (no DERIVE-attribute
// interleaving, no IFC2X3-vs-IFC4+ split, unlike e.g. `addContext.ts`'s own
// `IfcGeometricRepresentationSubContext` finding) across all 3:
//   - `IfcCartesianPoint(Coordinates)`, `IfcDirection(DirectionRatios)` -- single
//     aggregate-of-real attribute each, passed as one array argument (matching
//     `addContext.ts`'s own established convention for these 2 classes).
//   - `IfcAxis2Placement3D(Location, Axis, RefDirection)`.
//   - `IfcCartesianTransformationOperator3D(Axis1, Axis2, LocalOrigin, Scale, Axis3)` --
//     a flat, non-DERIVE 5-attribute layout (`IfcCartesianTransformationOperator`'s own
//     4 attributes, `Axis1`/`Axis2`/`LocalOrigin`/`Scale`, followed by the 3D subtype's
//     own added `Axis3` -- no re-declared/DERIVE attribute in between, confirmed against
//     `attributeCount()`-style reasoning from the flat `.d.ts` shape alone this time,
//     unlike `IfcGeometricRepresentationSubContext`'s own genuine DERIVE-reindexing
//     gotcha).
//   - `IfcRepresentationMap(MappingOrigin, MappedRepresentation)`.
//   - `IfcMappedItem(MappingSource, MappingTarget)`.
//   - `IfcShapeRepresentation(ContextOfItems, RepresentationIdentifier,
//     RepresentationType, Items)` -- also a flat, non-DERIVE 4-attribute layout across
//     all 3 schemas (`IfcRepresentation`'s own `ContextOfItems`/`RepresentationIdentifier`/
//     `RepresentationType`/`Items`, with `IfcShapeModel`/`IfcShapeRepresentation`
//     themselves adding nothing new positionally).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { wrapUsecase } from "../hooks";

export interface MapRepresentationSettings {
	/** The `IfcRepresentation` to wrap in a fresh `IfcMappedItem`. */
	representation: EntityInstance;
}

/** Python: `Usecase.get_mapping_source()`. See this file's own header comment. */
function getMappingSource(file: IfcFile, representation: EntityInstance): EntityInstance {
	for (const inverse of file.getInverse(representation) as Set<EntityInstance>) {
		if (inverse.isA("IfcRepresentationMap")) return inverse;
	}
	const zero = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
	const xAxis = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
	const zAxis = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
	const mappingOrigin = file.createEntity("IfcAxis2Placement3D", zero, zAxis, xAxis);
	return file.createEntity("IfcRepresentationMap", mappingOrigin, representation);
}

function mapRepresentationUsecase(file: IfcFile, settings: MapRepresentationSettings): EntityInstance {
	const { representation } = settings;
	const mappingSource = getMappingSource(file, representation);

	const zero = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
	const xAxis = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
	const yAxis = file.createEntity("IfcDirection", [0.0, 1.0, 0.0]);
	const zAxis = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);

	const mappingTarget = file.createEntity("IfcCartesianTransformationOperator3D", xAxis, yAxis, zero, 1, zAxis);
	const mappedItem = file.createEntity("IfcMappedItem", mappingSource, mappingTarget);
	return file.createEntity(
		"IfcShapeRepresentation",
		representation.get("ContextOfItems") as EntityInstance | null,
		representation.get("RepresentationIdentifier") as string | null,
		"MappedRepresentation",
		[mappedItem],
	);
}

/**
 * Wraps a representation in an `IfcMappedItem` (Python:
 * `ifcopenshell.api.geometry.map_representation`).
 *
 * Creates a fresh `IfcShapeRepresentation` whose sole item is an `IfcMappedItem`
 * pointing at `representation` via a (reused-if-found, otherwise freshly created)
 * `IfcRepresentationMap`. The returned representation's `ContextOfItems`/
 * `RepresentationIdentifier` are copied from `representation` itself;
 * `RepresentationType` is always `"MappedRepresentation"`.
 *
 * @returns The newly created `IfcShapeRepresentation` (the mapped item wrapper, not
 * `representation` itself).
 */
export const mapRepresentation = wrapUsecase("geometry.map_representation", mapRepresentationUsecase);
