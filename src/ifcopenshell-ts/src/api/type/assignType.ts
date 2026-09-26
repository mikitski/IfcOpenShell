// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/type/assign_type.py` (src/ifcopenshell-python, 319 lines) --
// completes `api.type` alongside `./mapTypeRepresentations.ts` (a genuine, load-bearing
// dependency called directly below, not an optional side chunk -- see that file's own
// header comment) and `./unassignType.ts` (landed in an earlier chunk; that file's own
// header comment documents a real, disclosed Python variable-shadowing bug in the
// *sibling* `unassign_type.py`, not reproduced here -- `assign_type.py` has no
// equivalent shadowing bug of its own, verified directly).
//
// --- RESOLVED: `map_type_representations`'s own real dependency has landed ---
//
// `map_type_representations` (`./mapTypeRepresentations.ts`) calls
// `ifcopenshell.api.geometry.map_representation`/`.assign_representation` -- both are
// now real, exported functions (this project's `api.geometry` chunk 2), so this call
// site (only reached when `should_map_representations` is true AND `relating_type
// .RepresentationMaps` is non-empty) is fully portable, no throw. See
// `mapTypeRepresentations.ts`'s own header comment for the full resolution writeup.
//
// `map_material_usages` (this file's own final helper, ported below as
// `mapMaterialUsages`) USED to be a second such disclosed blocker (it calls
// `ifcopenshell.api.material.assign_material(file, products=related_objects, type=
// f"{ifc_class}Usage")`, and `api.material` had no TS port of any kind when this file
// was first written) -- it is now a real call. `api.material` chunk 1 landed
// `assignMaterial`/`unassignMaterial`/`copyMaterial` (`../material/index.ts`), and
// `assignMaterial`'s own `"...Usage"` branches (the exact ones this call site needs)
// are fully, faithfully ported with no sibling blocker of their own (see
// `../material/assignMaterial.ts`'s own header comment) -- so `mapMaterialUsages`
// below now calls the real, exported `assignMaterial` directly.
//
// --- Occurrence/type class-pairing validation: three layered fallbacks, not one ---
//
// The EXPRESS schema has no WHERE rule pairing `RelatingType`/`RelatedObjects` classes
// -- the canonical pairing per schema is a buildingSMART implementer agreement, which
// this project's already-landed `util.type.getApplicableEntities` encodes as a static
// JSON map (`util/type.ts`). Real Python layers TWO more fallbacks on top of that map,
// both ported below, verified against the real source line by line (not assumed from
// a summary):
//
//   (a) `relating_type.ApplicableOccurrence` (a real, schema-declared `IfcTypeObject`
//       attribute, e.g. `"IfcWall/PARTITIONING"`) -- when set, its leading `"/"`-
//       delimited token names the occurrence class directly. Real Python guards this
//       with `schema.declaration_by_name(occurrence_class)` wrapped in a bare
//       `except RuntimeError: pass`, tolerating a class name the schema doesn't
//       declare at all. Ported below as `declaresClass` (a `try`/`catch` around
//       `file.nativeFile.schema().declaration_by_name_with_name(...)`, the same native
//       call `util/schema.ts`/`util/migrator.ts` already use directly for this exact
//       "does this class exist in this schema" question -- confirmed it throws, not
//       returns `null`, for an unknown name, by reading `schema_definition::
//       declaration_by_name` in `src/ifcparse/schema.h` directly).
//   (b) A universal `Type`-suffix-stripping fallback for process/resource types the
//       implementer-agreement map has no entry for at all (`IfcTaskType` ->
//       `IfcTask`, `IfcCrewResourceType` -> `IfcCrewResource`, etc) -- gated by the
//       exact same `declaresClass` schema-existence check.
//
// Both fallbacks only ever ADD to `allowedOccurrences` (never narrow it) -- a
// mismatched-class error is raised only if an object's class is in NEITHER the map NOR
// either fallback, matching real Python's `mismatched_classes = sorted({o.is_a() for o
// in related_objects if o.is_a() not in allowed_occurrences})` exactly. This whole
// validation block runs before ANY mutation (matches real Python's own top-to-bottom
// ordering: lines 193-229 of the real source, all before the IFC2X3-vs-IFC4+ dispatch
// at line 231) -- pinned by `test_partial_mismatch_in_selection_rejects_whole_call`
// (a mismatched object anywhere in the batch rejects the WHOLE call, leaving every
// object -- including the otherwise-valid ones -- untouched).
//
// --- IFC2X3-vs-IFC4+ inverse dispatch, verified directly against the generated
// `.d.ts`s (none of these inverse attributes appear there -- confirmed by grep, same
// as every other inverse this project already reads via `EntityInstance.get`'s
// forward-or-inverse dynamic dispatch, e.g. `unassignType.ts`'s identical `IsTypedBy`/
// `IsDefinedBy` branch) ---
//
//   - Finding the TYPE's own existing `IfcRelDefinesByType`: `ObjectTypeOf` (IFC2X3)
//     vs. `Types` (IFC4+), both single-element-in-practice inverses (`next(iter(...),
//     None)`).
//   - Finding an OCCURRENCE's existing type-rel: `IsDefinedBy` filtered by
//     `is_a("IfcRelDefinesByType")` (IFC2X3, which has no dedicated inverse for this at
//     all) vs. the dedicated `IsTypedBy` inverse (IFC4+) -- the exact same branch
//     `util/element.ts`'s own `getType`/`unassignType.ts` already established and rely
//     on.
//
// --- `objectsWithoutTypes`/`objectsWithTypes` partition: `api.project.
// assignDeclaration`'s own "surgery" shape, closer than `api.classification`/
// `api.document`'s ---
//
// Structurally closest to `../project/assignDeclaration.ts`'s own
// `objectsWithoutContexts`/`objectsWithContexts` partition (both compute the two
// buckets up front, unassign from every "previous" rel that's about to lose a member,
// then reuse-or-create exactly one merged rel for every object being (re)assigned) --
// not `api.classification`/`api.document`'s own single-object surgery shape. One real
// difference from `assignDeclaration.ts`'s own dedup rule, verified directly: real
// `assign_type.py` compares each object's existing rel against the type's OWN single
// `types` rel by identity (`object_rel != types`, matching `ObjectTypeOf`/`Types`'
// "at most one in practice" cardinality) -- NOT a membership test against a *set* of
// every rel the type could possibly have, unlike `assign_declaration.py`'s own
// `object_rel not in all_declares` (`IfcContext.Declares` schema-wise permits more than
// one `IfcRelDeclares`, `IfcTypeObject.Types`/`ObjectTypeOf` do not).
//
// --- `PredefinedType`/`ObjectType` "double typing" cleanup (real GitHub issue #7006)
// ---
//
// Only runs if the TYPE's own `util.element.getPredefinedType` (already landed,
// reused directly below) resolves to something other than `"NOTDEFINED"`/`null` --
// then clears BOTH `ObjectType` and (only if the occurrence's own class even declares
// it -- `hasAttribute` below, matching `createEntity.ts`'s own `hasAttribute` local
// helper's identical try/catch mechanism) `PredefinedType` on every related object.
// Real Python's own `test_keep_predefined_type_if_type_assignment_is_notdefined`
// documents the deliberate "NOTDEFINED blocks the cleanup" carve-out (real GitHub issue
// #7011) -- ported verbatim, both pinned below.
//
// --- `IfcRelDefinesByType` positional attribute order, verified directly against all
// 3 generated `.d.ts`s: `GlobalId`, `OwnerHistory`, `Name`, `Description`,
// `RelatedObjects`, `RelatingType` -- identical order in `ifc2x3.d.ts`/`ifc4.d.ts`/
// `ifc4x3.d.ts` ---

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import * as typeUtil from "../../util/type";
import { wrapUsecase } from "../hooks";
import { assignMaterial } from "../material/assignMaterial";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";
import { mapTypeRepresentations } from "./mapTypeRepresentations";

/** Local by-identity set -- see `../aggregate/unassignObject.ts`'s identical helper's own doc comment for why this is duplicated per-module rather than shared. */
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

/** Python's `getattr(x, name, None)` for a possibly-undeclared-on-this-class attribute. */
function attrOrNull(instance: EntityInstance, name: string): unknown {
	try {
		return instance.get(name);
	} catch {
		return null;
	}
}

/** Python's `hasattr(x, name)`, matching `../root/createEntity.ts`'s own local `hasAttribute` helper. */
function hasAttribute(instance: EntityInstance, name: string): boolean {
	try {
		instance.get(name);
		return true;
	} catch {
		return false;
	}
}

/**
 * Python: `try: schema.declaration_by_name(class_name); ... except RuntimeError: pass`
 * -- does this schema declare a class of exactly this name (case-insensitively, per
 * the native call's own uppercasing)? See this file's own header comment for why this
 * is the right native call to reuse (`util/schema.ts`/`util/migrator.ts`'s own
 * established direct-call precedent), and confirmation it throws (not returns `null`)
 * for an unknown name.
 */
function declaresClass(file: IfcFile, className: string): boolean {
	try {
		file.nativeFile.schema().declaration_by_name_with_name(className);
		return true;
	} catch {
		return false;
	}
}

export interface AssignTypeSettings {
	/** The `IfcElement` occurrences. */
	relatedObjects: readonly EntityInstance[];
	/** The `IfcElementType` type. */
	relatingType: EntityInstance;
	/**
	 * If a type has a representation map, IFC requires all occurrences to map those
	 * representations. Some IFC vendors might disobey this, or you might want to
	 * handle it yourself -- in this scenario, you may set this to `false`. This also
	 * enables adding material usages mapping. Python default: `True`.
	 */
	shouldMapRepresentations?: boolean;
}

/**
 * Python: `Usecase.map_material_usages(related_objects, relating_type)`.
 *
 * Calls the real `api.material.assignMaterial` only if `relating_type`'s own material
 * actually resolves to an `IfcMaterialLayerSet`/`IfcMaterialProfileSet` (i.e. only when
 * real Python would actually have called `ifcopenshell.api.material.assign_material`)
 * -- see this file's own header comment.
 */
function mapMaterialUsages(
	file: IfcFile,
	relatedObjects: readonly EntityInstance[],
	relatingType: EntityInstance,
): void {
	const typeMaterial = elementUtil.getMaterial(relatingType);
	if (!typeMaterial) return;
	const ifcClass = typeMaterial.isA();
	if (ifcClass === "IfcMaterialLayerSet") {
		assignMaterial(file, { products: relatedObjects, type: "IfcMaterialLayerSetUsage" });
	} else if (ifcClass === "IfcMaterialProfileSet") {
		assignMaterial(file, { products: relatedObjects, type: "IfcMaterialProfileSetUsage" });
	}
}

function assignTypeUsecase(file: IfcFile, settings: AssignTypeSettings): EntityInstance | null {
	if (settings.relatedObjects.length === 0) return null;

	const relatingType = settings.relatingType;
	const shouldMapRepresentations = settings.shouldMapRepresentations ?? true;

	// --- Occurrence/type class-pairing validation: three layered fallbacks. See this
	// file's own header comment. ---
	const allowedOccurrences = new Set<string>(typeUtil.getApplicableEntities(relatingType.isA(), file.schema));

	const applicableOccurrence = attrOrNull(relatingType, "ApplicableOccurrence") as string | null;
	if (applicableOccurrence) {
		const occurrenceClass = applicableOccurrence.split("/", 1)[0];
		if (declaresClass(file, occurrenceClass)) allowedOccurrences.add(occurrenceClass);
	}

	const typeClass = relatingType.isA();
	if (typeClass.endsWith("Type")) {
		const occurrenceClass = typeClass.slice(0, -"Type".length);
		if (declaresClass(file, occurrenceClass)) allowedOccurrences.add(occurrenceClass);
	}

	const mismatchedClasses = Array.from(
		new Set(settings.relatedObjects.filter((o) => !allowedOccurrences.has(o.isA())).map((o) => o.isA())),
	).sort();
	if (mismatchedClasses.length > 0) {
		const allowedSorted = Array.from(allowedOccurrences).sort();
		throw new TypeError(
			`${relatingType.isA()} cannot type ${mismatchedClasses.join(", ")} in schema ${file.schema} ` +
				`(allowed occurrence classes: ${allowedSorted.join(", ") || "<none>"})`,
		);
	}

	const ifc2x3 = file.schema === "IFC2X3";
	const relatedObjectsSet = new EntityInstanceSet();
	relatedObjectsSet.update(settings.relatedObjects);

	// --- IFC2X3-vs-IFC4+ inverse dispatch: the type's own existing `IfcRelDefinesByType`. ---
	let types: EntityInstance | null;
	if (ifc2x3) {
		const objectTypeOf = relatingType.get("ObjectTypeOf") as EntityInstance[];
		types = objectTypeOf[0] ?? null;
	} else {
		const typesRels = relatingType.get("Types") as EntityInstance[];
		types = typesRels[0] ?? null;
	}

	const previousTypesRels = new EntityInstanceSet();
	const objectsWithoutTypes: EntityInstance[] = [];
	const objectsWithTypes: EntityInstance[] = [];

	// Check if there is anything to change.
	for (const obj of relatedObjectsSet.values()) {
		let objectRel: EntityInstance | null;
		if (ifc2x3) {
			const isDefinedBy = obj.get("IsDefinedBy") as EntityInstance[];
			objectRel = isDefinedBy.find((r) => r.isA("IfcRelDefinesByType")) ?? null;
		} else {
			const isTypedBy = obj.get("IsTypedBy") as EntityInstance[];
			objectRel = isTypedBy[0] ?? null;
		}

		if (!objectRel) {
			objectsWithoutTypes.push(obj);
			continue;
		}

		// Either the rel doesn't exist (types is null) or the object is part of a
		// different rel.
		if (!types || !objectRel.equals(types)) {
			previousTypesRels.add(objectRel);
			objectsWithTypes.push(obj);
		}
	}

	const objectsToChange = [...objectsWithoutTypes, ...objectsWithTypes];
	// Nothing to change.
	if (objectsToChange.length === 0) {
		return types;
	}

	// Unassign from previous types.
	for (const isTypedBy of previousTypesRels.values()) {
		const curRelatedObjects = (isTypedBy.get("RelatedObjects") as EntityInstance[]).filter(
			(o) => !relatedObjectsSet.has(o),
		);
		if (curRelatedObjects.length > 0) {
			isTypedBy.set("RelatedObjects", curRelatedObjects);
			updateOwnerHistory(file, { element: isTypedBy });
		} else {
			const history = isTypedBy.get("OwnerHistory") as EntityInstance | null;
			file.remove(isTypedBy);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}

	// Assign objects to a new type.
	if (types) {
		const merged = new EntityInstanceSet();
		merged.update(types.get("RelatedObjects") as EntityInstance[]);
		merged.update(relatedObjectsSet.values());
		types.set("RelatedObjects", merged.values());
		updateOwnerHistory(file, { element: types });
	} else {
		types = file.createEntity(
			"IfcRelDefinesByType",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			relatedObjectsSet.values(), // RelatedObjects
			relatingType, // RelatingType
		);
	}

	if (shouldMapRepresentations) {
		// Python: `if getattr(relating_type, "RepresentationMaps", None):` -- an empty
		// list is falsy in Python, unlike a JS empty array, so this checks `.length`
		// explicitly rather than relying on `attrOrNull`'s own truthiness (which would
		// otherwise call `mapTypeRepresentations` redundantly, if harmlessly, for an
		// empty `RepresentationMaps`, since that function has its own identical
		// empty-check early-return).
		const representationMaps = attrOrNull(relatingType, "RepresentationMaps") as EntityInstance[] | null;
		if (representationMaps && representationMaps.length > 0) {
			for (const relatedObject of objectsToChange) {
				mapTypeRepresentations(file, { relatedObject, relatingType });
			}
		}
		mapMaterialUsages(file, objectsToChange, relatingType);
	}

	// Remove PredefinedType/ObjectType if existing, to forbid double typing (see #7006).
	const predefinedType = elementUtil.getPredefinedType(relatingType);
	if (predefinedType !== "NOTDEFINED" && predefinedType !== null) {
		for (const obj of relatedObjectsSet.values()) {
			obj.set("ObjectType", null);
			if (hasAttribute(obj, "PredefinedType")) {
				obj.set("PredefinedType", null);
			}
		}
	}

	return types;
}

/**
 * Assigns a type to occurrences of an object (Python: `ifcopenshell.api.type.assign_type`).
 *
 * IFC supports the concept of occurrences and types. An occurrence is an actual
 * physical product in the real world -- like a wall, a chair, a door, a column, a
 * pump. Most occurrences have a corresponding type. An occurrence may only have zero
 * or one type. An occurrence of a type inherits all the properties and materials of
 * the type.
 *
 * @returns The `IfcRelDefinesByType` relationship, or `null` if `relatedObjects` was
 * an empty list.
 * @throws {TypeError} if any `relatedObjects` entry's class is not a valid occurrence
 * class for `relatingType` in this file's schema -- see this file's own header comment
 * for the three-layer validation this performs. Rejects the WHOLE call without
 * mutating anything.
 * @throws {Error} if `shouldMapRepresentations` is `true` (the default) and
 * `relatingType` has a non-empty `RepresentationMaps` -- needs `api.geometry`
 * functions not ported yet. See this file's own header comment and `TODOS.md`. (A
 * material-usage-mapping throw here is no longer possible -- `api.material
 * .assignMaterial` is real, see `mapMaterialUsages`'s own doc comment.)
 */
export const assignType = wrapUsecase("type.assign_type", assignTypeUsecase);
