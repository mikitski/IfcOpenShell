// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/material/assign_material.py` (src/ifcopenshell-python, 364
// lines) -- chunk 1 of `api.material` (see `./index.ts`'s own header comment for the
// full chunk scope and why only 3 of this module's 26 files are ported here).
//
// Assigns a material (a plain `IfcMaterial`, an `IfcMaterialList`, a material SET --
// layered/profiled/constituent -- or the "Usage" parametric wrapper an occurrence puts
// around its type's own layer/profile set) to a list of products, dispatching on the
// `type: MaterialType` (`util/element.ts`'s already-landed `MaterialType`) parameter.
//
// --- No sibling `api.material` dependency outside this chunk's own 3-file scope ---
//
// Despite `import ifcopenshell.api.material` at the top of the real source (suggesting
// self-referential calls), the ONLY actual `ifcopenshell.api.material.*` call this
// function makes is `unassign_material` (this chunk's own sibling, `./unassignMaterial
// .ts`) -- confirmed by reading the full 364-line source line by line, not assumed.
// Building a fresh `IfcMaterialLayerSetUsage`/`IfcMaterialProfileSetUsage` does NOT
// call `add_layer`/`add_profile`-style helpers (as the chunk's own planning doc
// speculated it might) -- it constructs the usage entity directly via
// `file.create_entity(...)`. So, contrary to `../root/removeProduct.ts`'s and
// `../type/assignType.ts`'s own precedent of disclosing a genuinely blocked sibling
// call, THIS function has no blocked call site at all: every one of its 7 `type`
// branches (`IfcMaterial`/`IfcMaterialConstituentSet`/`IfcMaterialLayerSet`/
// `IfcMaterialLayerSetUsage`/`IfcMaterialProfileSet`/`IfcMaterialProfileSetUsage`/
// `IfcMaterialList`) is fully, faithfully ported below -- this is what retroactively
// unblocks `../type/assignType.ts`'s `mapMaterialUsages` and `../root/removeProduct
// .ts`'s `IfcRelAssociatesMaterial` cleanup branch (see `index.ts`'s header comment).
//
// --- Real, disclosed quirks/bugs, ported verbatim (not silently fixed) ---
//
// 1. `execute()` ALWAYS unassigns any pre-existing material from every product first
//    (`ifcopenshell.util.element.get_material(p)`, default `should_inherit=True`) --
//    even for a product that only INHERITS a material from its type (no direct
//    `HasAssociations` of its own). Calling `unassign_material` on such a product is a
//    harmless no-op (it only touches `product.HasAssociations`, which is empty for an
//    inheriting-only product), but the call genuinely happens -- ported as-is via this
//    file's own real, exported `unassignMaterial` (not suppressed with
//    `shouldRunListeners: false` -- real Python's own call site doesn't suppress
//    listeners either).
//
// 2. The `type === "IfcMaterial"` dispatch condition has a second, easy-to-miss clause:
//    `self.settings["type"] == "IfcMaterial" or (self.settings["material"] and not
//    self.settings["material"].is_a("IfcMaterial") and not self.settings["type"]
//    .endswith("Usage"))`. Read carefully, this means: passing a `material` that is
//    itself NOT a plain `IfcMaterial` (e.g. a pre-built `IfcMaterialLayerSet`) together
//    with a non-"Usage" `type` OTHER than "IfcMaterial" (e.g. `type:
//    "IfcMaterialConstituentSet"`) makes this `if` branch win over the
//    `type`-matching `elif` a caller would expect -- `assignIfcMaterial` runs instead
//    of "create a fresh `IfcMaterialConstituentSet`", directly reusing/associating the
//    given `material` object as the `RelatingMaterial` (see `assignIfcMaterial`'s own
//    comment). This is a genuinely surprising, unintentional-looking real quirk, not
//    reachable through any of `test_assign_material.py`'s own scenarios (every
//    `IfcMaterialXSet`-typed test call either omits `material` entirely or is a "Usage"
//    call), but ported exactly as written since it's real, load-bearing dispatch logic.
//    The docstring's own narrower claim ("If IfcMaterial is provided as material and
//    type is not IfcMaterial, provided material will be ignored except for
//    IfcMaterialList") only covers the *opposite* case (`material.is_a("IfcMaterial")`
//    true) -- it says nothing about a non-`IfcMaterial` `material` under a mismatched
//    `type`, which is exactly the gap this dispatch quirk falls into.
//
// 3. `types_to_material_sets` -- declared, membership-checked, but NEVER actually
//    populated (real Python: no `types_to_material_sets[element_type] = material_set`
//    assignment anywhere in either the `IfcMaterialLayerSetUsage` or
//    `IfcMaterialProfileSetUsage` branch) -- a real, dead "cache" bug. Its only
//    observable effect: whenever a product's own type has no LayerSet/ProfileSet
//    material of its own (no type at all, or a type whose material isn't the matching
//    set class), EVERY such product gets its OWN brand-new, never-shared
//    `IfcMaterialLayerSet`/`IfcMaterialProfileSet`, one per iteration -- never reused
//    across products that would otherwise share the same (`None`) cache key. This is
//    NOT a cosmetic detail: `test_assign_element_layer_set_usage_is_different_for_
//    different_layer_set_directions` (ported below) explicitly relies on two type-less
//    products getting two DISTINCT layer sets. "Fixing" this cache would break that
//    real, currently-passing Python test. Ported by simply never writing to the
//    lookup structure, exactly matching the real dead code.
//
// 4. `update_representation_profile` (the `IfcMaterialProfileSetUsage` branch's
//    representation-patching step): `if not representation: return` returns from the
//    WHOLE function the instant any one product in the batch lacks a "Model"/"Body"/
//    "MODEL_VIEW" representation -- not `continue` to skip just that product. A batch
//    with products [A (has representation), B (no representation), C (has
//    representation)] would patch A's `SweptArea`, then abort before ever reaching C.
//    Ported verbatim as an early `return`, not "corrected" to `continue`.
//
// 5. `get_rel_associates_material`'s IFC2X3/`IfcMaterialList` branch compares
//    `r.RelatingMaterial == self.settings["material"]` -- the ORIGINAL caller-supplied
//    `material` setting, not the (possibly freshly-`create_entity`-synthesized) local
//    `material` variable `assign_ifc_material` actually works with. Ported literally
//    (as `settingsMaterial`, distinct from the `material` parameter) even though the
//    two are only ever different when `settingsMaterial` is falsy -- in which case the
//    comparison is against `null`/`None`, which never equals a real entity, so this
//    branch always misses (no reuse) for an auto-created `IfcMaterial`/`IfcMaterialList`
//    -- the same practical outcome the `AssociatedTo`-based non-IFC2X3 branch reaches
//    for a fresh, zero-inverse material anyway. No observable behavior difference for
//    any real caller, but ported literally rather than "simplified" to use `material`.
//
// 6. Two identical-shaped `assert` messages contain a real upstream TYPO
//    ("assiged", not "assigned") -- `f"{material_set_class} cannot be assiged as a
//    IfcMaterialLayerSetUsage."` / `"...IfcMaterialProfileSetUsage."`. Ported verbatim,
//    typo included, thrown as a plain `Error` (`assert` has no direct TS equivalent;
//    matches this project's established `assert -> throw new Error` convention for a
//    guard clause, e.g. `../type/assignType.ts`'s own `TypeError` guards).
//
// --- Positional entity construction, verified against generated `.d.ts`s ---
//
// `IfcRelAssociatesMaterial` (`createMaterialAssociation`): `GlobalId`/`OwnerHistory`/
// `Name`/`Description`/`RelatedObjects`/`RelatingMaterial` -- identical 6-attribute
// order across all 3 schemas (`ifc2x3.d.ts`/`ifc4.d.ts`/`ifc4x3.d.ts`), matching real
// Python's own kwarg dict order.
//
// `IfcMaterialLayerSetUsage` (`createLayerSetUsage`): `ForLayerSet`/
// `LayerSetDirection`/`DirectionSense`/`OffsetFromReferenceLine` on all 3 schemas, plus
// a 5th `ReferenceExtent` attribute on IFC4/IFC4X3 only (absent from `ifc2x3.d.ts`
// entirely) -- deliberately left unset (4 positional args only), matching real
// Python's own kwargs dict, which never sets it either.
//
// `IfcMaterialProfileSetUsage` (`createProfileSetUsage`): `ForProfileSet`/
// `CardinalPoint`/`ReferenceExtent` on IFC4/IFC4X3 (this class doesn't exist on
// IFC2X3 at all -- confirmed absent from `ifc2x3.d.ts`, so this branch is implicitly
// IFC4+-only, exactly like real Python, which has no schema guard here either and
// would raise the same native "unknown declaration" error on an IFC2X3 file). Only
// `ForProfileSet` is set (1 positional arg), matching real Python's own
// single-key kwargs dict.
//
// `IfcMaterialConstituentSet`/`IfcMaterialLayerSet`/`IfcMaterialProfileSet`/
// `IfcMaterialList` (the plain-set-creation branches): created with ZERO positional
// args (`file.createEntity(type)`), matching real Python's own bare
// `self.file.create_entity(self.settings["type"])` -- every attribute (including
// `IfcMaterialLayerSet.MaterialLayers`, a schema-mandatory but validly-instantiable-
// unset-at-authoring-time list) is left unset, not defaulted to `[]`.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import { type MaterialType, getMaterial, getType } from "../../util/element";
import { getRepresentation } from "../../util/representation";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";
import { unassignMaterial } from "./unassignMaterial";

/** Local by-identity set -- see `../type/unassignType.ts`'s identical helper's own doc comment for why this is duplicated per-module rather than shared. */
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

// Real Python: a module-level list literal inside the `IfcMaterialLayerSetUsage`
// branch. Hoisted here as a module-level constant since it doesn't depend on anything
// per-call.
const AXIS3_CLASSES = new Set([
	"IfcSlab",
	"IfcSlabStandardCase",
	"IfcSlabElementedCase",
	"IfcRoof",
	"IfcRamp",
	"IfcPlate",
	"IfcPlateStandardCase",
	"IfcCovering",
	"IfcFurniture",
]);

export interface AssignMaterialSettings {
	/** The list of `IfcProduct`s (or `IfcTypeProduct`s) to assign the material or material set to. */
	products: readonly EntityInstance[];
	/**
	 * Choose from `"IfcMaterial"`, `"IfcMaterialConstituentSet"`, `"IfcMaterialLayerSet"`,
	 * `"IfcMaterialLayerSetUsage"`, `"IfcMaterialProfileSet"`,
	 * `"IfcMaterialProfileSetUsage"`, or `"IfcMaterialList"`. Note that "Set Usages" may
	 * only be assigned to occurrences, not types. Defaults to `"IfcMaterial"`.
	 */
	type?: MaterialType;
	/**
	 * The `IfcMaterial` or material set to assign. If `type` is a "Usage" variant, no
	 * need to provide this -- it's deduced from the element's type automatically. See
	 * this file's own header comment (quirk 2) for a real dispatch subtlety when
	 * providing a non-`IfcMaterial` `material` under a mismatched, non-"Usage" `type`.
	 */
	material?: EntityInstance | null;
}

function createMaterialAssociation(
	file: IfcFile,
	relatingMaterial: EntityInstance,
	products: readonly EntityInstance[],
): EntityInstance {
	return file.createEntity(
		"IfcRelAssociatesMaterial",
		guid.new(),
		createOwnerHistory(file, {}),
		null, // Name
		null, // Description
		[...products], // RelatedObjects
		relatingMaterial, // RelatingMaterial
	);
}

/** See this file's own header comment (quirk 5) for why `settingsMaterial` (not `material`) is what gets compared. */
function getRelAssociatesMaterial(
	file: IfcFile,
	settingsMaterial: EntityInstance | null,
	material: EntityInstance,
): EntityInstance | null {
	if (file.schema === "IFC2X3" || material.isA("IfcMaterialList")) {
		if (!settingsMaterial) return null;
		return (
			file.byType("IfcRelAssociatesMaterial").find((r) => {
				const relatingMaterial = r.get("RelatingMaterial") as EntityInstance | null;
				return relatingMaterial?.equals(settingsMaterial) ?? false;
			}) ?? null
		);
	}
	const associatedTo = (material.get("AssociatedTo") as EntityInstance[] | null) ?? [];
	return associatedTo.length > 0 ? associatedTo[0] : null;
}

function assignIfcMaterial(
	file: IfcFile,
	settingsMaterial: EntityInstance | null,
	products: readonly EntityInstance[],
): EntityInstance {
	const material = settingsMaterial ?? file.createEntity("IfcMaterial");
	const rel = getRelAssociatesMaterial(file, settingsMaterial, material);
	if (!rel) {
		return createMaterialAssociation(file, material, products);
	}
	const merged = new EntityInstanceSet();
	merged.update(rel.get("RelatedObjects") as EntityInstance[]);
	merged.update(products);
	rel.set("RelatedObjects", merged.values());
	updateOwnerHistory(file, { element: rel });
	return rel;
}

function createLayerSetUsage(
	file: IfcFile,
	materialSet: EntityInstance,
	layerSetDirection: string,
	products: readonly EntityInstance[],
): EntityInstance {
	const usage = file.createEntity("IfcMaterialLayerSetUsage", materialSet, layerSetDirection, "POSITIVE", 0);
	return createMaterialAssociation(file, usage, products);
}

function createProfileSetUsage(file: IfcFile, materialSet: EntityInstance): EntityInstance {
	return file.createEntity("IfcMaterialProfileSetUsage", materialSet);
}

/** See this file's own header comment (quirk 4) -- the early `return` deliberately aborts the whole function, not just the current `product`. */
function updateRepresentationProfile(
	file: IfcFile,
	materialSet: EntityInstance,
	products: readonly EntityInstance[],
): void {
	let profile = materialSet.get("CompositeProfile") as EntityInstance | null;
	if (!profile) {
		const materialProfiles = (materialSet.get("MaterialProfiles") as EntityInstance[] | null) ?? [];
		if (materialProfiles.length > 0) {
			profile = materialProfiles[0].get("Profile") as EntityInstance;
		}
	}
	if (!profile) return;
	for (const product of products) {
		const representation = getRepresentation(product, "Model", "Body", "MODEL_VIEW");
		if (!representation) return;
		for (const subelement of file.traverse(representation)) {
			if (subelement.isA("IfcSweptAreaSolid")) {
				subelement.set("SweptArea", profile);
			}
		}
	}
}

function assignMaterialLayerSetUsages(
	file: IfcFile,
	products: readonly EntityInstance[],
	providedMaterial: EntityInstance | null,
): EntityInstance | EntityInstance[] {
	if (providedMaterial) {
		const materialSetClass = providedMaterial.isA();
		if (materialSetClass !== "IfcMaterialLayerSet") {
			throw new Error(`${materialSetClass} cannot be assiged as a IfcMaterialLayerSetUsage.`);
		}
	}

	// See this file's own header comment (quirk 3): `typesToMaterialSets` is
	// deliberately declared but NEVER written to -- reproducing a real, test-relied-
	// upon dead-cache bug, not an oversight here.
	const typesToMaterialSets = new Map<number | null, EntityInstance>();

	interface Group {
		materialSet: EntityInstance;
		layerSetDirection: string;
		products: EntityInstance[];
	}
	const groups = new Map<string, Group>();
	const order: string[] = [];

	for (const product of products) {
		let materialSet: EntityInstance;
		if (providedMaterial) {
			materialSet = providedMaterial;
		} else {
			const elementType = getType(product);
			const cacheKey = elementType ? elementType.identity() : null;
			const cached = typesToMaterialSets.get(cacheKey);
			if (cached) {
				materialSet = cached;
			} else {
				const elementTypeMaterial = elementType ? getMaterial(elementType) : null;
				materialSet = elementTypeMaterial?.isA("IfcMaterialLayerSet")
					? elementTypeMaterial
					: file.createEntity("IfcMaterialLayerSet");
			}
		}

		const layerSetDirection = AXIS3_CLASSES.has(product.isA()) ? "AXIS3" : "AXIS2";
		const key = `${materialSet.identity()}::${layerSetDirection}`;
		let group = groups.get(key);
		if (!group) {
			group = { materialSet, layerSetDirection, products: [] };
			groups.set(key, group);
			order.push(key);
		}
		group.products.push(product);
	}

	const rels = order.map((key) => {
		const group = groups.get(key) as Group;
		return createLayerSetUsage(file, group.materialSet, group.layerSetDirection, group.products);
	});
	return rels.length === 1 ? rels[0] : rels;
}

function assignMaterialProfileSetUsages(
	file: IfcFile,
	products: readonly EntityInstance[],
	providedMaterial: EntityInstance | null,
): EntityInstance | EntityInstance[] {
	if (providedMaterial) {
		const materialSetClass = providedMaterial.isA();
		if (materialSetClass !== "IfcMaterialProfileSet") {
			throw new Error(`${materialSetClass} cannot be assiged as a IfcMaterialProfileSetUsage.`);
		}
	}

	// See this file's own header comment (quirk 3) -- same dead-cache shape as
	// `assignMaterialLayerSetUsages` above, never written to.
	const typesToMaterialSets = new Map<number | null, EntityInstance>();

	interface Group {
		materialSet: EntityInstance;
		products: EntityInstance[];
	}
	const groups = new Map<number, Group>();
	const order: number[] = [];

	for (const product of products) {
		let materialSet: EntityInstance;
		if (providedMaterial) {
			materialSet = providedMaterial;
		} else {
			const elementType = getType(product);
			const cacheKey = elementType ? elementType.identity() : null;
			const cached = typesToMaterialSets.get(cacheKey);
			if (cached) {
				materialSet = cached;
			} else {
				const elementTypeMaterial = elementType ? getMaterial(elementType) : null;
				materialSet = elementTypeMaterial?.isA("IfcMaterialProfileSet")
					? elementTypeMaterial
					: file.createEntity("IfcMaterialProfileSet");
			}
		}

		const key = materialSet.identity();
		let group = groups.get(key);
		if (!group) {
			group = { materialSet, products: [] };
			groups.set(key, group);
			order.push(key);
		}
		group.products.push(product);
	}

	const rels = order.map((key) => {
		const group = groups.get(key) as Group;
		updateRepresentationProfile(file, group.materialSet, group.products);
		const usage = createProfileSetUsage(file, group.materialSet);
		return createMaterialAssociation(file, usage, group.products);
	});
	return rels.length === 1 ? rels[0] : rels;
}

function assignMaterialUsecase(
	file: IfcFile,
	settings: AssignMaterialSettings,
): EntityInstance | EntityInstance[] | null | undefined {
	const productsSet = new EntityInstanceSet();
	productsSet.update(settings.products);
	const products = productsSet.values();
	if (products.length === 0) return null;

	const type = settings.type ?? "IfcMaterial";
	const material = settings.material ?? null;

	// NOTE: we always reassign material, even if it might be assigned before. See this
	// file's own header comment (quirk 1).
	const productsToUnassignMaterial = products.filter((p) => getMaterial(p));
	if (productsToUnassignMaterial.length > 0) {
		unassignMaterial(file, { products: productsToUnassignMaterial });
	}

	// See this file's own header comment (quirk 2) for the full writeup of this
	// condition's second clause.
	if (type === "IfcMaterial" || (material !== null && !material.isA("IfcMaterial") && !type.endsWith("Usage"))) {
		return assignIfcMaterial(file, material, products);
	}

	if (type === "IfcMaterialConstituentSet" || type === "IfcMaterialLayerSet" || type === "IfcMaterialProfileSet") {
		const materialSet = file.createEntity(type);
		return createMaterialAssociation(file, materialSet, products);
	}

	if (type === "IfcMaterialLayerSetUsage") {
		return assignMaterialLayerSetUsages(file, products, material);
	}

	if (type === "IfcMaterialProfileSetUsage") {
		return assignMaterialProfileSetUsages(file, products, material);
	}

	if (type === "IfcMaterialList") {
		const materialSet = file.createEntity("IfcMaterialList");
		materialSet.set("Materials", [material]);
		return createMaterialAssociation(file, materialSet, products);
	}

	// Real Python: an exhausted if/elif chain with no `else` implicitly returns `None`
	// -- unreachable for a well-typed `type: MaterialType` caller (the union above is
	// exhaustive), but mirrored here for parity with a caller that bypasses the type
	// system (plain JS, or an `as MaterialType` cast on a bad string).
	return undefined;
}

/**
 * Assigns a material to the list of products (Python: `ifcopenshell.api.material
 * .assign_material`).
 *
 * Will unassign previously assigned material.
 *
 * When a material is assigned to a product, it means that the product is made out of
 * that material. In its simplest form, a single material may be assigned to a
 * product, meaning that the entire product is made out of that one material.
 * Alternatively, a material set may be assigned to a product, meaning that the
 * product is made out of a set of materials. There are three types of sets, including
 * layered construction, profiled materials, and arbitrary material constituents.
 *
 * Materials are typically assigned to the element types rather than individual
 * occurrences of elements. Individual occurrences would then inherit the material
 * from the type.
 *
 * For layers and profiles assigned to types, the occurrences must be assigned an
 * `IfcMaterialLayerSetUsage` or an `IfcMaterialProfileSetUsage`. This allows
 * individual occurrences to override the layered or profiled construction offset from
 * a reference line.
 *
 * @returns An `IfcRelAssociatesMaterial` entity, or a list of them (possible if `type`
 * is a "Usage" variant and `products` require different usages), or `null` if
 * `products` was an empty list.
 *
 * See this file's own header comment for several real, disclosed Python quirks ported
 * verbatim (a dead "type -> material set" cache bug, an early-`return`-not-`continue`
 * representation-patching quirk, and a subtle dispatch-order edge case).
 */
export const assignMaterial = wrapUsecase("material.assign_material", assignMaterialUsecase);
