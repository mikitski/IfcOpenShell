// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/copy_material.py` (src/ifcopenshell-python, 103
// lines) -- chunk 1 of `api.material` (see `./index.ts`'s own header comment). Also,
// independently, the exact function `../root/copyClass.ts`'s `*Set`
// material-association branch is expected to need (see `index.ts`'s header comment
// for whether that file exists yet in this worktree).
//
// Duplicates a material (a plain `IfcMaterial`, or a material SET -- constituent,
// layer, or profile -- recursing into the set's own items). All material psets and
// styles are copied too. The copy is not associated with any elements. If a material
// SET is copied, the set items are also copied, but the underlying materials (and
// profiles) referenced BY those items are reused, not copied. If a material is
// associated with a presentation style, that style is reused too.
//
// No sibling `api.material` dependency of any kind -- the only cross-module calls are
// `ifcopenshell.util.element.copy`/`.copy_deep` (both already landed, see
// `util/element.ts`), and the function's OWN self-recursion (`copy_material(file, i)`
// for each set item) -- which, matching `../root/removeProduct.ts`'s own established
// "self-recursion always goes through the wrapped export" precedent (real Python's
// `wrap_usecases` reflection replaces the module's own function name, so its own
// internal self-calls hit the wrapped version too, firing pre/post-listeners on every
// recursive call, not just the outermost one), recurses through this file's own
// exported, wrapped `copyMaterial`.
//
// --- A NEWLY-DISCLOSED, pre-existing `util.element.copyDeep`/`copy` limitation
// (found by this chunk, not introduced by it, and NOT fixed here -- out of scope,
// belongs to an already-merged, separately-reviewed utility) ---
//
// `copyMaterialWithInverses`'s `IfcMaterialProperties` branch calls `copyDeep(file,
// pset)` for each of a material's own property sets -- matching real Python's `copy_
// deep(file, pset)` exactly. This works fine for a pset whose properties have no
// value yet (`NominalValue: null`), but throws ("No forward attribute at index 0 for
// instance of type '<Class>'") the moment a property's `NominalValue` is an actual,
// populated "simple"/defined-type value (e.g. `IfcLabel("bar")`, `IfcText(...)`) --
// confirmed by direct repro: `copy`/`copyDeep` cannot handle a defined-type instance
// AT ALL, whether passed directly as the top-level argument or reached by recursing
// into a forward attribute, since `util/element.ts`'s attribute-metadata cache
// (`attributeCache.ts`) is built from ENTITY declarations only (`entity
// .all_attributes()`), and a defined type has no such declaration to look up its
// single wrapped-value "attribute" by name against. No other already-merged caller of
// `copyDeep` (`util/shapeBuilder.ts`'s geometry-curve copies, `../pset/editPset.ts`'s
// `EnumerationReference` copy) ever recurses into a populated simple-type leaf value,
// so this chunk is the first to surface it. Pinned as a dedicated "throws" test in
// `copyMaterial.test.ts` (split from real Python's own `test_copy_a_material_with_
// properties`, whose structural half -- a pset WITH a property attached, just not a
// populated value -- passes for real) and tracked in `TODOS.md`.
//
// --- A real, disclosed quirk ported verbatim ---
//
// `_copy_material_with_inverses`' `IfcMaterialProperties` branch reassigns its own
// loop variable (`inverse = ifcopenshell.util.element.copy(file, inverse)`) BEFORE the
// IFC2X3-vs-IFC4+ schema branch that may `continue` past it -- so a shallow copy of
// the properties container (with `Material` already repointed at the new material) is
// ALWAYS created and left in the file, even on IFC2X3 when the container turns out not
// to be an `IfcExtendedMaterialProperties` (the only concrete, non-abstract subtype
// IFC2X3 psets on a material actually use) and the function `continue`s without ever
// deep-copying its nested properties. Not a bug with an observable *wrong* outcome
// (the shallow copy is a fully valid, if property-less, `IfcMaterialProperties`
// clone), but a real, slightly wasteful control-flow shape ported exactly as written,
// not restructured to check the schema branch before copying.
//
// --- Positional/attribute-name verification against generated `.d.ts`s ---
//
// `IfcMaterialProperties.Material`'s declared type is `IfcMaterial` on IFC2X3 (its own
// `.Properties`/`.Name`/`.Description` don't exist at all -- only the concrete
// `IfcExtendedMaterialProperties` subtype, reached via `.is_a("IfcMaterialProperties")`
// matching the ABSTRACT supertype, per this project's already-landed `api.pset
// .addPset` chunk's own identical finding about this class) vs. the broader
// `IfcMaterialDefinition` on IFC4/IFC4X3 (materials sets, not just plain `IfcMaterial`,
// can carry psets there) -- `.set("Material", created)` below works either way since
// `EntityInstance.set` isn't statically typed against the generated `.d.ts` union
// (confirmed via `ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`, not assumed). No positional
// entity CREATION happens in this file at all -- every new entity here comes from
// `util/element.ts`'s already-verified `copy`/`copyDeep` (which read the target's own
// existing attribute count/order dynamically, not a hand-written positional list).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import { copy, copyDeep } from "../../util/element";
import { wrapUsecase } from "../hooks";

function copyMaterialWithInverses(file: IfcFile, material: EntityInstance): EntityInstance {
	const created = copy(file, material);
	for (const inverseOriginal of file.getInverse(material) as Set<EntityInstance>) {
		if (inverseOriginal.isA("IfcMaterialProperties")) {
			// See this file's own header comment -- the shallow copy (and `Material`
			// repoint) always happens, even when the IFC2X3 branch below is about to
			// `continue` without deep-copying any nested properties.
			const inverse = copy(file, inverseOriginal);
			inverse.set("Material", created);

			let propsAttribute = "Properties";
			if (file.schema === "IFC2X3") {
				if (!inverse.isA("IfcExtendedMaterialProperties")) continue;
				propsAttribute = "ExtendedProperties";
			}

			const props = (inverse.get(propsAttribute) as EntityInstance[] | null) ?? [];
			if (props.length === 0) continue;

			const copiedProps = props.map((pset) => copyDeep(file, pset));
			inverse.set(propsAttribute, copiedProps);
		} else if (inverseOriginal.isA("IfcMaterialDefinitionRepresentation")) {
			const inverse = copyDeep(file, inverseOriginal, [
				"IfcRepresentationContext",
				"IfcMaterial",
				"IfcPresentationStyle",
			]);
			inverse.set("RepresentedMaterial", created);
		}
	}
	return created;
}

export interface CopyMaterialSettings {
	/** The `IfcMaterialDefinition` (or `IfcMaterialList`) to copy. */
	material: EntityInstance;
}

function copyMaterialUsecase(file: IfcFile, settings: CopyMaterialSettings): EntityInstance {
	const { material } = settings;

	if (material.isA("IfcMaterial")) {
		return copyMaterialWithInverses(file, material);
	}
	if (material.isA("IfcMaterialConstituentSet")) {
		const created = copyMaterialWithInverses(file, material);
		const constituents = (material.get("MaterialConstituents") as EntityInstance[] | null) ?? [];
		created.set(
			"MaterialConstituents",
			constituents.map((i) => copyMaterial(file, { material: i })),
		);
		return created;
	}
	if (material.isA("IfcMaterialConstituent")) {
		return copyMaterialWithInverses(file, material);
	}
	if (material.isA("IfcMaterialLayerSet")) {
		const created = copyMaterialWithInverses(file, material);
		const layers = (material.get("MaterialLayers") as EntityInstance[] | null) ?? [];
		created.set(
			"MaterialLayers",
			layers.map((i) => copyMaterial(file, { material: i })),
		);
		return created;
	}
	if (material.isA("IfcMaterialLayer")) {
		return copyMaterialWithInverses(file, material);
	}
	if (material.isA("IfcMaterialProfileSet")) {
		const created = copyMaterialWithInverses(file, material);
		const profiles = (material.get("MaterialProfiles") as EntityInstance[] | null) ?? [];
		created.set(
			"MaterialProfiles",
			profiles.map((i) => copyMaterial(file, { material: i })),
		);
		return created;
	}
	if (material.isA("IfcMaterialProfile")) {
		return copyMaterialWithInverses(file, material);
	}
	if (material.isA("IfcMaterialList")) {
		return copyMaterialWithInverses(file, material);
	}

	throw new Error(`copyMaterial: unexpected material type: '${material.isA()}' (${material}).`);
}

/**
 * Copies a material or material set (Python: `ifcopenshell.api.material.copy_material`).
 *
 * All material psets and styles are copied. The copied material is not associated to
 * any elements.
 *
 * If a material set is copied, the set items are also copied. However the underlying
 * materials (and profiles) used within the set items are reused.
 *
 * If a material is associated with a presentation style, that presentation style is
 * reused.
 *
 * **Disclosed limitation** (see this file's own header comment): copying a material
 * whose pset has a property with an actual, populated value throws -- a pre-existing
 * `util.element.copyDeep`/`copy` gap (cannot copy a "simple"/defined-type instance,
 * e.g. `IfcLabel`), not something this function itself does wrong. A pset with no
 * properties, or properties with no value yet, copies fine.
 *
 * @returns The new copy of the material.
 */
export const copyMaterial = wrapUsecase("material.copy_material", copyMaterialUsecase);
