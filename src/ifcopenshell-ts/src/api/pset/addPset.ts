// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/pset/add_pset.py` (src/ifcopenshell-python, 172 lines).
// Creates a new property set (or, for a material/profile, the schema's equivalent
// "extended properties" definition) and attaches it to a product.
//
// This file's IFC4X3 `IfcObject`/`IfcContext` branch is already independently
// verified correct by `../owner/addApplication.ts`'s own inline reproduction of it
// (written before this chunk existed, for one narrow call site) -- see the
// "discrepancy check against addApplication.ts" section at the bottom of this comment.
//
// --- Four completely different attachment mechanisms, by product kind (read the
// bodies, not assumed to be one uniform "create + link" shape) ---
//
// 1. `IfcObject`/`IfcContext` (e.g. a wall, or an `IfcProject`): a genuinely new,
//    freestanding `IfcPropertySet` is created and then handed to `./assignPset.ts`
//    (`[product]`) -- delegating the actual `IfcRelDefinesByProperties` linking
//    entirely to that function rather than duplicating its "reuse an existing
//    DefinesOccurrence rel, or create one" logic here. First, though, a dedup check:
//    if `product` already has an `IfcRelDefinesByProperties` (via its own
//    `IsDefinedBy` inverse) whose pset already has this exact `name`, that EXISTING
//    pset is returned instead of creating a duplicate -- no new entity, no
//    `assignPset` call at all in that case.
// 2. `IfcTypeObject` (e.g. a wall type): same dedup-by-name idea, but checked against
//    the type's own forward `HasPropertySets` list directly (no rel/inverse
//    involved -- types don't have `IsDefinedBy`). Also delegates the actual "add pset
//    to the list" step to `./assignPset.ts`.
// 3. `IfcMaterialDefinition`/`IfcMaterial`: NOT a plain `IfcPropertySet` at all --
//    always an `IfcMaterialProperties` (IFC4+) or one of its concrete IFC2X3
//    subclasses (`IfcMaterialProperties` itself is abstract there), linked directly
//    via that entity's own `Material` attribute -- no separate rel entity, and no
//    `assignPset` call, since `assignPset`'s whole shape (occurrences/types/rels) has
//    nothing to do with how material properties attach.
// 4. `IfcProfileDef`: same shape as (3) but for `IfcProfileProperties`/its IFC2X3
//    subclasses, linked via `ProfileDefinition` instead of `Material`.
//
// Anything else: throws, matching real Python's own `TypeError` (message text kept
// close, though "class doesn't support" isn't a real distinguishable error *type* in
// this port the way Python's `TypeError` is a distinguishable exception class --
// same disclosed JS-has-no-typed-exception-classes limitation `../root/createEntity.ts`
// and others already carry, not new here).
//
// --- IFC2X3-vs-IFC4+ schema differences (confirmed against the generated `.d.ts`s
// directly, not assumed) ---
//
// `IfcPropertySet`/`IfcRelDefinesByProperties`: `GlobalId`(0), `OwnerHistory`(1),
// `Name`(2), (`Description`(3), `RelatedObjects`(4), `RelatingPropertyDefinition`(5)
// for the rel) -- identical order in all 3 schemas, no DERIVE attributes. Positional
// creation used for these two (via `./assignPset.ts` for the rel).
//
// Material/profile properties, by contrast, are NOT created positionally in this
// port -- deliberately, not an oversight. Real Python's own `kwargs` dict is built by
// ATTRIBUTE NAME and passed as `**kwargs`, resolving by name regardless of position;
// this matters because `ifc2x3_subclass` is an arbitrary caller-supplied IFC2X3 class
// name (`IfcFuelProperties`, `IfcGeneralMaterialProperties`, `IfcStructuralSteelProfileProperties`,
// ... -- there are many), each with `Material`/`ProfileName`+`ProfileDefinition` at a
// DIFFERENT attribute index (confirmed directly: `IfcFuelProperties.Material` is
// index(0), while e.g. `IfcGeneralProfileProperties.ProfileDefinition` is index(1) --
// no single fixed positional shape covers every possible subclass). So this port
// creates the entity with zero positional args and then uses `.set(name, value)` --
// this port's own name-based attribute setter, exactly mirroring real Python's
// name-based `**kwargs` resolution -- rather than hand-building a positional array per
// known subclass (which would silently break for any subclass this port's author
// didn't happen to think of). The two schema differences actually worth calling out:
//
// - IFC2X3's `IfcMaterialProperties`/`IfcProfileProperties` are themselves ABSTRACT
//   (no `.d.ts` interface for `IfcProfileProperties` under IFC2X3 confirms this
//   directly for that one; `IfcMaterialProperties` is non-abstract-looking in the
//   `.d.ts` shape sense but real Python's own comment says so and this port doesn't
//   second-guess it) -- hence `ifc2x3_subclass` exists at all, defaulting to
//   `IfcExtendedMaterialProperties`/`IfcGeneralProfileProperties` respectively.
// - IFC2X3's profile/material classes use `ProfileName` (not `Name`) for profiles, and
//   many material subclasses (confirmed: `IfcFuelProperties`) have NO `Name`-like
//   attribute at all -- real Python's own comment ("In IFC2X3 not all
//   IfcMaterialProperties has Name") and `getattr(definition, "Name", None)` dedup
//   check (ported here via a local `attrOrNull`, same shape `./removePset.ts`'s own
//   header comment already established) both confirm this is expected, not a bug.
//   IFC2X3 profile properties skip the by-name dedup check entirely for this same
//   reason (no `Name` to compare against at all -- real Python's own comment:
//   "we cannot identify them").
//
// --- Discrepancy check against `../owner/addApplication.ts`'s inline reproduction ---
//
// That file's IFC4X3 branch reproduces the `IfcObject`/`IfcContext` no-existing-pset
// path only (a freshly-created actor never has a pre-existing `IfcRelDefinesByProperties`,
// so its dedup-by-name loop was correctly assumed empty and omitted): create a bare
// `IfcPropertySet(GlobalId, OwnerHistory, Name)`, then build the
// `IfcRelDefinesByProperties(GlobalId, OwnerHistory, Name=null, Description=null,
// RelatedObjects=[actor], RelatingPropertyDefinition=pset)` inline in place of a
// genuine `assignPset` call (not yet ported at the time). Comparing this REAL,
// exported `addPsetUsecase`'s `IfcObject`/`IfcContext` branch (below) plus
// `./assignPset.ts`'s own occurrence-with-no-existing-rel path against that
// reproduction: attribute order, positions, and values all match exactly -- NO
// discrepancy found. That earlier chunk's assumption about `add_pset`'s real
// behavior was correct.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { assignPset } from "./assignPset";

/** Python's `getattr(x, name, None)` -- see this file's header comment. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

export interface AddPsetSettings {
	/** The `IfcObject` (or type, material, profile) to assign a property set to. */
	product: EntityInstance;
	/**
	 * The name of the property set. Property sets standardised by buildingSMART
	 * typically use a "Pset_" prefix, e.g. "Pset_WallCommon".
	 *
	 * In IFC2X3 should be provided as an empty string for profile properties (they all
	 * lack a name property) and for all material properties besides
	 * `IfcExtendedMaterialProperties`.
	 */
	name: string;
	/**
	 * IFC2X3 subclass for material or profile properties (`IfcMaterialProperties`/
	 * `IfcProfileProperties` are abstract there). Defaults to
	 * `IfcExtendedMaterialProperties`/`IfcGeneralProfileProperties` respectively. Has
	 * no effect on IFC4+.
	 */
	ifc2x3Subclass?: string | null;
}

function addPsetUsecase(file: IfcFile, settings: AddPsetSettings): EntityInstance {
	const { product, name } = settings;
	const isIfc2x3 = file.schema === "IFC2X3";

	if (product.isA("IfcObject") || product.isA("IfcContext")) {
		for (const rel of (product.get("IsDefinedBy") as EntityInstance[] | null) ?? []) {
			if (
				rel.isA("IfcRelDefinesByProperties") &&
				(rel.get("RelatingPropertyDefinition") as EntityInstance).get("Name") === name
			) {
				return rel.get("RelatingPropertyDefinition") as EntityInstance;
			}
		}

		// `IfcPropertySet`: GlobalId(0), OwnerHistory(1), Name(2) -- see header comment.
		const pset = file.createEntity("IfcPropertySet", guid.new(), createOwnerHistory(file, {}), name);
		assignPset(file, { products: [product], pset });
		return pset;
	}

	if (product.isA("IfcTypeObject")) {
		for (const definition of (product.get("HasPropertySets") as EntityInstance[] | null) ?? []) {
			if (definition.get("Name") === name) {
				return definition;
			}
		}

		const pset = file.createEntity("IfcPropertySet", guid.new(), createOwnerHistory(file, {}), name);
		assignPset(file, { products: [product], pset });
		return pset;
	}

	// In IFC2X3 IfcMaterialDefinition didn't exist yet -- `isA` simply never matches an
	// undeclared type name, so this falls through to the `isA("IfcMaterial")` check on
	// IFC2X3, exactly matching real Python's own `or` chain.
	if (product.isA("IfcMaterialDefinition") || product.isA("IfcMaterial")) {
		let ifcClass: string;
		let definitions: EntityInstance[];
		if (isIfc2x3) {
			ifcClass = settings.ifc2x3Subclass || "IfcExtendedMaterialProperties";
			definitions = file
				.byType("IfcMaterialProperties")
				// Python: `d.Material == product` tolerates `d.Material` being `None`
				// (`None == product` is `False`) -- a schema-valid file can never
				// actually have this unset (`Material` is mandatory), but a malformed
				// one could; guarded to match Python's graceful behavior rather than
				// throwing (TODOS.md).
				.filter((d) => (d.get("Material") as EntityInstance | null)?.equals(product) ?? false);
		} else {
			ifcClass = "IfcMaterialProperties";
			definitions = (product.get("HasProperties") as EntityInstance[] | null) ?? [];
		}
		for (const definition of definitions) {
			// In IFC2X3 not all IfcMaterialProperties subclasses have a Name attribute.
			if (attrOrNull(definition, "Name") === name) {
				return definition;
			}
		}

		const properties = file.createEntity(ifcClass);
		properties.set("Material", product);
		if (!isIfc2x3 || ifcClass === "IfcExtendedMaterialProperties") {
			properties.set("Name", name);
		}
		return properties;
	}

	if (product.isA("IfcProfileDef")) {
		// In IFC2X3 IfcProfileProperties doesn't have Name and we cannot identify them.
		if (!isIfc2x3) {
			for (const definition of (product.get("HasProperties") as EntityInstance[] | null) ?? []) {
				if (definition.get("Name") === name) {
					return definition;
				}
			}
		}

		const ifcClass = isIfc2x3 ? settings.ifc2x3Subclass || "IfcGeneralProfileProperties" : "IfcProfileProperties";
		const properties = file.createEntity(ifcClass);
		properties.set("ProfileDefinition", product);
		if (!isIfc2x3) {
			properties.set("Name", name);
		}
		return properties;
	}

	throw new TypeError(`Class '${product.isA(true)}' doesn't support adding a property set.`);
}

/**
 * Adds a new property set to a product (Python: `ifcopenshell.api.pset.add_pset`).
 *
 * Products, such as physical objects or types in IFC may have properties associated
 * with them. These properties are typically simple key-value metadata with data
 * types, grouped into property sets so that related properties are grouped together.
 *
 * This function adds a blank named property set. Once you have a property set you may
 * add properties using `api.pset.editPset` (a future chunk, not yet ported).
 *
 * @returns The newly created (or, if one with this exact `name` already existed,
 * pre-existing) `IfcPropertySet`/material-or-profile-properties instance.
 *
 * @example
 * ```ts
 * const wallType = api.root.createEntity(model, { ifcClass: "IfcWallType" });
 * const pset = api.pset.addPset(model, { product: wallType, name: "Pset_WallCommon" });
 * ```
 */
export const addPset = wrapUsecase("pset.add_pset", addPsetUsecase);
