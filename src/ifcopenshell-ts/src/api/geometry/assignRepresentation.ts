// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/geometry/assign_representation.py` (src/ifcopenshell-python,
// 95 lines) -- `api.geometry`'s first real chunk (2 of ~29 real files, alongside its own
// sibling `./mapRepresentation.ts`), landed early and out of file-count order because
// MULTIPLE already-merged chunks (`api.type.mapTypeRepresentations`,
// `api.root.reassignClass`'s `switchBetweenClassTypes`) disclosed real, loud-throw
// blockers citing this function by name -- landing it retroactively unblocks (at least
// partially, see `../type/mapTypeRepresentations.ts`/`../root/reassignClass.ts`'s own
// updated header comments) both. Verified directly (not assumed): this file's only
// imports are `ifcopenshell.api.geometry` (itself, recursively -- only for
// `map_representation`, ported alongside), `ifcopenshell.api.owner.update_owner_history`
// (already landed), and `ifcopenshell.util.element.get_type`/`get_material` (already
// landed) -- no `numpy`/matrix-math dependency of any kind, unlike the still-unported
// `edit_object_placement.py`.
//
// --- `execute`: an `IfcProduct` occurrence may get silently redirected onto its own
// TYPE instead -- a real, non-obvious guard, ported with its exact boolean shape, not
// approximated ---
//
// Real Python's very first check, BEFORE the `IfcProduct`-vs-`IfcTypeProduct` dispatch:
// if `product` is an `IfcProduct` occurrence, has a type (`get_type`), that type ALREADY
// has at least one `RepresentationMap`, the NEW `representation` being assigned is NOT
// itself already a `"MappedRepresentation"`, AND the type's own resolved material is
// NEITHER an `IfcMaterialProfileSet` NOR an `IfcMaterialLayerSet` -- THEN `product` is
// silently reassigned to `product_type` for the rest of the call, so what looks like
// "assign this representation to this one occurrence" actually assigns it to the whole
// TYPE (cascading to every occurrence via the `IfcTypeProduct` branch below). Real
// Python's own comment (verbatim, citing a specific real upstream bug report): "Revit is
// adding a non-mapped representation to the exported profile-based types, so assigning
// representation to occurrence by accident was assigning it to the type. We guard from
// this by skipping profile and layer-based types. See 6934 for example." -- i.e. the
// material guard exists SPECIFICALLY to avoid this redirect for Revit-exported
// profile/layer-based types (`test_assigning_to_an_instance_with_a_geometric_profile_
// layer_based_type_only_adds_it_to_the_instance`, ported in this chunk's own
// `assignRepresentation.test.ts`, pins exactly this). All 4 conditions are ANDed
// together exactly as written -- e.g. a type with `RepresentationMaps` but a
// non-profile/layer material (or no material at all) still redirects; a
// `"MappedRepresentation"` being assigned directly to an occurrence never redirects
// (used by `map_type_representations.ts`'s own second loop, which deliberately assigns
// the wrapped mapped item straight onto the occurrence, not the type).
//
// --- `IfcTypeProduct` branch: builds a fresh `IfcRepresentationMap`, then cascades onto
// every real occurrence via the schema-dependent `Types`/`ObjectTypeOf` inverse ---
//
// Appends a brand new `IfcRepresentationMap` (identity 3D origin, matching
// `map_representation.ts`'s own identical fallback-origin construction) onto
// `product.RepresentationMaps`, then -- if any real `IfcElement` is already typed to
// `product` via the appropriate `IfcRelDefinesByType` -- wraps `representation` in a
// fresh `IfcMappedItem` (via `map_representation`, called ONCE per occurrence, so each
// occurrence gets its OWN wrapper `IfcShapeRepresentation`/`IfcMappedItem`, all sharing
// the SAME underlying `IfcRepresentationMap`) and assigns that wrapper directly via the
// internal `assign_product_representation` helper (NOT a recursive call back into this
// function's own top-level redirect-guard -- these are real, already-typed occurrences,
// not eligible for the type-redirect check above, matching real Python's own direct
// `self.assign_product_representation(element, mapped_representation)` call, not
// `self.execute(element, mapped_representation)`).
//
// `IfcTypeProduct.ObjectTypeOf` (IFC2X3) vs. `.Types` (IFC4+) -- the identical real,
// schema-dependent inverse-attribute-name split `util/element.ts`'s own already-landed
// `getTypes` free function encodes (confirmed against that function's own source rather
// than re-deriving from scratch) -- ported inline here (not calling `getTypes` itself)
// to match real Python's own structure exactly (real Python inlines the branch here too,
// rather than calling a shared helper).
//
// --- `owner.update_owner_history` -- called exactly once, unconditionally, at the very
// end, on the (possibly type-redirected) `product` ---
//
// Ported verbatim: real Python's `ifcopenshell.api.owner.update_owner_history(self.file,
// element=product)` sits OUTSIDE both branches (`IfcProduct`/`IfcTypeProduct`), and uses
// whatever `product` currently refers to at that point -- the ORIGINAL occurrence if no
// redirect happened, or the TYPE if the redirect guard fired. Neither branch touches
// `product`'s own owner history a second time.
//
// --- Positional `createEntity` calls -- see `./mapRepresentation.ts`'s own header
// comment for the full per-class `.d.ts` verification (identical across all 3 schemas,
// no DERIVE-attribute interleaving) shared by both files ---

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";
import { mapRepresentation } from "./mapRepresentation";

export interface AssignRepresentationSettings {
	/** The `IfcProduct` or `IfcTypeProduct` to assign the representation to. */
	product: EntityInstance;
	/** The `IfcRepresentation` to assign. */
	representation: EntityInstance;
}

/** Python: `Usecase.assign_product_representation(product, representation)`. */
function assignProductRepresentation(file: IfcFile, product: EntityInstance, representation: EntityInstance): void {
	let definition = product.get("Representation") as EntityInstance | null;
	if (!definition) {
		definition = file.createEntity("IfcProductDefinitionShape");
		product.set("Representation", definition);
	}
	const representations = [...((definition.get("Representations") as EntityInstance[] | null) ?? [])];
	representations.push(representation);
	definition.set("Representations", representations);
}

function assignRepresentationUsecase(file: IfcFile, settings: AssignRepresentationSettings): void {
	let product = settings.product;
	const { representation } = settings;

	// See this file's own header comment for the exact 4-condition redirect guard,
	// ported with its precise boolean shape -- not approximated.
	if (product.isA("IfcProduct")) {
		const productType = elementUtil.getType(product);
		if (productType) {
			const hasRepresentationMaps =
				((productType.get("RepresentationMaps") as EntityInstance[] | null)?.length ?? 0) > 0;
			const isAlreadyMappedRepresentation = representation.get("RepresentationType") === "MappedRepresentation";
			const typeMaterial = elementUtil.getMaterial(productType);
			const isProfileOrLayerBasedType =
				typeMaterial != null && (typeMaterial.isA("IfcMaterialProfileSet") || typeMaterial.isA("IfcMaterialLayerSet"));
			if (hasRepresentationMaps && !isAlreadyMappedRepresentation && !isProfileOrLayerBasedType) {
				product = productType;
			}
		}
	}

	if (product.isA("IfcProduct")) {
		assignProductRepresentation(file, product, representation);
	} else if (product.isA("IfcTypeProduct")) {
		const existingMaps = (product.get("RepresentationMaps") as EntityInstance[] | null) ?? [];
		const maps = [...existingMaps];
		const zero = file.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]);
		const xAxis = file.createEntity("IfcDirection", [1.0, 0.0, 0.0]);
		const zAxis = file.createEntity("IfcDirection", [0.0, 0.0, 1.0]);
		const mappingOrigin = file.createEntity("IfcAxis2Placement3D", zero, zAxis, xAxis);
		maps.push(file.createEntity("IfcRepresentationMap", mappingOrigin, representation));
		product.set("RepresentationMaps", maps);

		// See this file's own header comment -- `ObjectTypeOf` (IFC2X3) vs. `Types`
		// (IFC4+), the same real inverse-attribute-name split `util/element.ts`'s own
		// `getTypes` already encodes, inlined here to match real Python's own structure.
		const types =
			file.schema === "IFC2X3"
				? ((product.get("ObjectTypeOf") as EntityInstance[] | null) ?? [])
				: ((product.get("Types") as EntityInstance[] | null) ?? []);
		if (types.length > 0) {
			const relatedObjects = (types[0]?.get("RelatedObjects") as EntityInstance[] | null) ?? [];
			for (const element of relatedObjects) {
				const mappedRepresentation = mapRepresentation(file, { representation });
				assignProductRepresentation(file, element, mappedRepresentation);
			}
		}
	}

	updateOwnerHistory(file, { element: product });
}

/**
 * Assigns a geometric representation to a product or type product (Python:
 * `ifcopenshell.api.geometry.assign_representation`).
 *
 * If `product` is an occurrence whose type already has representation maps (and the new
 * `representation` isn't itself already a mapped representation, and the type isn't a
 * profile/layer-based material type -- see this file's own header comment for the exact
 * guard), the assignment is silently redirected onto the TYPE instead. If `product` is a
 * type, a fresh `IfcRepresentationMap` is created and the mapped representation is
 * cascaded onto every real occurrence of that type via `mapRepresentation`.
 */
export const assignRepresentation = wrapUsecase("geometry.assign_representation", assignRepresentationUsecase);
