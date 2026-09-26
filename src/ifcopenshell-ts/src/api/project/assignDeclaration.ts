// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/project/assign_declaration.py` (src/ifcopenshell-python,
// 142 lines) -- declares a list of objects (`definitions`) to a project or project
// library (`relating_context`) via `IfcRelDeclares`. This chunk's task brief warned,
// correctly, that this is NOT a simple reskin of `spatial.assignContainer`/
// `aggregate.assignObject`'s own "surgery" shape despite the superficial resemblance
// (check-existing-rel / unassign-from-old / assign-to-new-or-merge) -- read closely,
// it differs in one load-bearing way from both of those:
//
// **Dedup checks membership in *every* existing `Declares` rel, not just the first.**
// `assignContainer`/`assignObject` each pick a single "the" existing rel up front
// (`relatingStructure.ContainsElements[0]`/`relatingObject.IsDecomposedBy[0]`) and
// compare each candidate's current rel against *that one* via identity (`sameRel`).
// Real `assign_declaration.py` instead does `object_rel not in all_declares`, a
// membership test against the **full set** of `relating_context.Declares` (every
// `IfcRelDeclares` whose `RelatingContext` is this `relating_context` -- schema-wise
// nothing prevents there being more than one, unlike `ContainsElements`/
// `IsDecomposedBy`, which this port's own `sameRel`-based siblings never needed to
// handle as a set). Only when reusing/creating the merged rel does it fall back to
// "the first one" (`next(iter(all_declares), None)`), matching the siblings' own
// single-rel-reuse shape -- but the *dedup* check itself is a real, distinct piece of
// logic, ported below as `allDeclaresSet.has(objectRel)` rather than a `sameRel`
// single-value comparison.
//
// --- `HasContext`/`Declares`: real inverse attributes, not in the generated `.d.ts`s ---
//
// `IfcRelDeclares.RelatingContext`'s inverse (`IfcContext.Declares`) and
// `IfcRelDeclares.RelatedDefinitions`'s inverse (`IfcDefinitionSelect`'s `HasContext`,
// declared on `IfcObjectDefinition`/`IfcPropertyDefinition`) are both real EXPRESS
// inverse attributes -- absent from `src/generated/ifc4.d.ts`/`ifc4x3.d.ts` (those
// files only type *forward* attributes, matching every other inverse used elsewhere in
// this port, e.g. `ContainsElements`/`IsDecomposedBy`/`HasAssignments` -- confirmed by
// grepping the generated `.d.ts`s directly, not assumed) but reachable at runtime via
// `EntityInstance.get(name)`'s existing forward-or-inverse dispatch (`entityInstance.ts`),
// the same established pattern `assignContainer.ts`/`assignObject.ts` already use for
// their own inverse reads.
//
// `getattr(definition, "HasContext", None)`: real Python uses a *soft*, defaulting
// `getattr` here (unlike `unassign_declaration.py`'s own unguarded `obj.HasContext` --
// see `unassignDeclaration.ts`'s header comment for that asymmetry) because not every
// `definition` a caller passes necessarily supports the `HasContext` inverse at all
// (only `IfcObjectDefinition`/`IfcPropertyDefinition` subtypes do) -- ported below as
// `getHasContext`, a small try/catch wrapper matching `EntityInstance.get`'s own
// documented "throws for an attribute name the declared type doesn't support at all"
// behavior (same technique `assignObject.ts`'s `hasContainedInStructure` helper uses
// for an analogous `hasattr` guard).
//
// --- Schema availability: IFC4+ only, confirmed directly, no guard added ---
//
// `IfcRelDeclares`/`IfcProjectLibrary`/the `Declares`/`HasContext` inverse pair do not
// exist in IFC2X3 at all -- confirmed directly against `src/generated/ifc2x3.d.ts`
// (zero matches for either interface name, vs. both present with an identical 6-
// attribute positional order in `ifc4.d.ts`/`ifc4x3.d.ts`:
// `GlobalId`/`OwnerHistory`/`Name`/`Description`/`RelatingContext`/`RelatedDefinitions`).
// Real Python's own docstring says as much ("Feature was added in IFC4") but adds no
// runtime guard for IFC2X3 -- calling this against an IFC2X3 `relating_context` would
// simply throw once `relating_context.Declares`/`file.create_entity("IfcRelDeclares",
// ...)` hits a class the schema doesn't have. This port does the same: no IFC2X3 guard
// added, matching this project's established "disclose, don't silently guard"
// precedent (`api.constraint`'s `add_metric_reference`/`remove_metric` IFC2X3-throws
// findings, referenced in this chunk's own task brief).
//
// --- `IfcRelDeclares` created positionally, 6 attributes ---
//
// Real Python creates it via `file.create_entity("IfcRelDeclares", **{...})` with only
// 4 of the 6 keys set (`GlobalId`/`OwnerHistory`/`RelatedDefinitions`/`RelatingContext`
// -- `Name`/`Description` left at their schema default, i.e. unset/`null`). Ported
// below as one positional `createEntity` call in the schema's own declared order
// (`GlobalId`, `OwnerHistory`, `Name: null`, `Description: null`, `RelatingContext`,
// `RelatedDefinitions`), matching this project's established "synthesize a whole
// entity's initial state in one atomic call" convention (`createOwnerHistory.ts`'s own
// header comment; `assignContainer.ts`'s identically-shaped `IfcRelContainedInSpatialStructure`
// creation is the closest direct precedent).

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as guid from "../../guid";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
import { createOwnerHistory } from "../owner/createOwnerHistory";
import { updateOwnerHistory } from "../owner/updateOwnerHistory";

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

/**
 * Python: `getattr(definition, "HasContext", None)`. Returns `null` for a `definition`
 * whose declared type doesn't support the `HasContext` inverse at all (mirrors
 * Python's `AttributeError` -> `None` default), rather than the raw inverse array
 * (possibly empty, but not `null`, for a supported type with no current context).
 */
function getHasContext(definition: EntityInstance): EntityInstance[] | null {
	try {
		return definition.get("HasContext") as EntityInstance[];
	} catch {
		return null;
	}
}

export interface AssignDeclarationSettings {
	/** The list of objects you want to declare. Typically a list of assets. */
	definitions: readonly EntityInstance[];
	/** The `IfcProject`, or more commonly the `IfcProjectLibrary`, that you want the object to be part of. */
	relatingContext: EntityInstance;
}

function assignDeclarationUsecase(file: IfcFile, settings: AssignDeclarationSettings): EntityInstance | null {
	const allDeclares = settings.relatingContext.get("Declares") as EntityInstance[];
	const allDeclaresSet = new EntityInstanceSet();
	allDeclaresSet.update(allDeclares);

	const definitionsSet = new EntityInstanceSet();
	definitionsSet.update(settings.definitions);

	const previousDeclaresRels = new EntityInstanceSet();
	const objectsWithoutContexts: EntityInstance[] = [];
	const objectsWithContexts: EntityInstance[] = [];

	// Check if there is anything to change.
	for (const definition of definitionsSet.values()) {
		const hasContext = getHasContext(definition);
		if (hasContext === null) {
			continue;
		}

		const objectRel = hasContext[0] ?? null;
		if (!objectRel) {
			objectsWithoutContexts.push(definition);
			continue;
		}

		// Either `objectRel` doesn't belong to `relatingContext`'s own `Declares` set at
		// all, or `definition` is currently declared under a *different* context.
		if (!allDeclaresSet.has(objectRel)) {
			previousDeclaresRels.add(objectRel);
			objectsWithContexts.push(definition);
		}
		// Definitions already declared under `relatingContext` are skipped entirely.
	}

	const objectsToChange = [...objectsWithoutContexts, ...objectsWithContexts];
	// Nothing to change.
	if (objectsToChange.length === 0) {
		return null;
	}

	const objectsWithContextsSet = new EntityInstanceSet();
	objectsWithContextsSet.update(objectsWithContexts);

	for (const hasContext of previousDeclaresRels.values()) {
		const relatedDefinitions = (hasContext.get("RelatedDefinitions") as EntityInstance[]).filter(
			(d) => !objectsWithContextsSet.has(d),
		);
		if (relatedDefinitions.length > 0) {
			hasContext.set("RelatedDefinitions", relatedDefinitions);
			updateOwnerHistory(file, { element: hasContext });
		} else {
			const history = hasContext.get("OwnerHistory") as EntityInstance | null;
			file.remove(hasContext);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}

	let declares: EntityInstance | null = allDeclares[0] ?? null;
	if (declares) {
		const merged = new EntityInstanceSet();
		merged.update(declares.get("RelatedDefinitions") as EntityInstance[]);
		merged.update(objectsToChange);
		declares.set("RelatedDefinitions", merged.values());
		updateOwnerHistory(file, { element: declares });
	} else {
		declares = file.createEntity(
			"IfcRelDeclares",
			guid.new(),
			createOwnerHistory(file, {}),
			null, // Name
			null, // Description
			settings.relatingContext, // RelatingContext
			objectsToChange, // RelatedDefinitions
		);
	}
	return declares;
}

/**
 * Declares the list of elements to the project (Python: `ifcopenshell.api.project.assign_declaration`).
 *
 * Feature was added in IFC4.
 *
 * All data in a model must be directly or indirectly related to the project. Most
 * data is indirectly related, existing instead within the spatial decomposition tree.
 * Other data, such as types, may be declared at the top level.
 *
 * Most of the time, the API handles declaration automatically for you. There is one
 * scenario where you might want to explicitly declare objects to the project, and
 * that's when you want to organise objects into project libraries for future use
 * (such as an assets library). Assigning a declaration lets you say that an object
 * belongs to a library.
 *
 * @returns The new `IfcRelDeclares` relationship, or `null` if all `definitions` were
 * already declared under `relatingContext` / do not support declaration.
 */
export const assignDeclaration = wrapUsecase("project.assign_declaration", assignDeclarationUsecase);
