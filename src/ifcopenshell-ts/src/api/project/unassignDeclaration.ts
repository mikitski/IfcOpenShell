// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/project/unassign_declaration.py` (src/ifcopenshell-python,
// 72 lines) -- removes a list of objects (`definitions`) from whatever project or
// project library they are currently declared under.
//
// --- Real, disclosed Python quirk: `relatingContext` is accepted but never used ---
//
// Read closely, real Python's `relating_context` parameter is **never consulted
// anywhere in the function body** -- it's assigned into a local `settings` dict
// (`settings = {"definitions": definitions, "relating_context": relating_context}`)
// purely for symmetry with the rest of this module's usecases, and that dict's
// `"relating_context"` key is never read again afterwards. The actual unassignment
// logic (`{rel for obj in definitions if (rel := next(iter(obj.HasContext), None))}`)
// finds each `obj`'s *current* `IfcRelDeclares` via its own `HasContext` inverse and
// operates on that directly -- it never checks that this rel's `RelatingContext`
// equals the given `relating_context` at all. Concretely: calling `unassign_declaration
// (file, definitions=[x], relating_context=someUnrelatedContext)` still un-declares
// `x` from whatever context it actually happens to be declared under, silently
// ignoring a caller-supplied `relatingContext` that doesn't match. This is ported
// **faithfully, not "fixed"**, per this project's bug-compatibility-with-disclosure
// discipline -- `relatingContext` stays a required settings field (for call-site
// symmetry with `assignDeclaration`, and in case a future schema/behavior change
// starts consulting it) but is genuinely unused by this function's own logic below.
//
// --- Walrus-in-set-comprehension: which `obj`s contribute a `rel`, exactly ---
//
// `rels = {rel for obj in definitions if (rel := next(iter(obj.HasContext), None))}`:
// for each `obj`, `next(iter(obj.HasContext), None)` yields either `None` (empty
// `HasContext` -- `obj` isn't currently declared anywhere) or the sole rel it holds.
// The `if` clause is the walrus assignment's own truthiness -- since a real
// `entity_instance` is always truthy, this reduces to "only `obj`s with a *non-empty*
// `HasContext` contribute their rel to the set" (`None`, i.e. an empty `HasContext`,
// is filtered out; a real rel is always kept). Ported below as a plain loop building
// an `EntityInstanceSet`, which has the exact same "skip falsy/duplicate, keep every
// distinct real rel" semantics as the Python set comprehension.
//
// --- No `getattr` guard on `obj.HasContext`: a real, disclosed asymmetry vs. `assignDeclaration` ---
//
// Unlike `assign_declaration.py`'s own `getattr(definition, "HasContext", None)` soft
// guard (see `assignDeclaration.ts`'s header comment), `unassign_declaration.py`
// accesses `obj.HasContext` directly, with no default. If `obj`'s declared type
// doesn't support the `HasContext` inverse at all (i.e. it isn't an
// `IfcObjectDefinition`/`IfcPropertyDefinition` subtype), real Python raises an
// uncaught `AttributeError` here -- ported faithfully: this port's own `.get("HasContext")`
// call is *not* wrapped in a try/catch (unlike `assignDeclaration.ts`'s `getHasContext`
// helper), so it throws the equivalent "entity instance ... has no attribute
// 'HasContext'" error for the same case, exactly mirroring this real asymmetry between
// the two sibling functions rather than smoothing it away.
//
// --- Schema availability: IFC4+ only, no guard added -- see `assignDeclaration.ts` ---
//
// Same finding, same rationale: `HasContext`/`IfcRelDeclares` don't exist in IFC2X3 at
// all (confirmed against `src/generated/ifc2x3.d.ts` directly), and real Python adds
// no runtime guard for it here either -- this port doesn't add one that isn't there.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";
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

export interface UnassignDeclarationSettings {
	/** The list of objects you want to undeclare. Typically a list of assets. */
	definitions: readonly EntityInstance[];
	/**
	 * The `IfcProject`, or more commonly the `IfcProjectLibrary`, that you want the
	 * object to no longer be part of. **Genuinely unused by real Python's own logic --
	 * see this file's header comment.** Kept as a required field only for call-site
	 * symmetry with `assignDeclaration` and documentation parity with real Python.
	 */
	relatingContext: EntityInstance;
}

function unassignDeclarationUsecase(file: IfcFile, settings: UnassignDeclarationSettings): void {
	const definitions = new EntityInstanceSet();
	definitions.update(settings.definitions);

	const rels = new EntityInstanceSet();
	for (const obj of definitions.values()) {
		// No try/catch here -- see this file's header comment on the disclosed
		// unguarded-`HasContext`-access asymmetry vs. `assignDeclaration`.
		const hasContext = obj.get("HasContext") as EntityInstance[];
		const rel = hasContext[0] ?? null;
		if (rel) {
			rels.add(rel);
		}
	}

	for (const rel of rels.values()) {
		const relatedDefinitions = (rel.get("RelatedDefinitions") as EntityInstance[]).filter((d) => !definitions.has(d));
		if (relatedDefinitions.length > 0) {
			rel.set("RelatedDefinitions", relatedDefinitions);
			updateOwnerHistory(file, { element: rel });
		} else {
			const history = rel.get("OwnerHistory") as EntityInstance | null;
			file.remove(rel);
			if (history) elementUtil.removeDeep2(file, history);
		}
	}
}

/**
 * Unassigns a list of objects from a project or project library (Python:
 * `ifcopenshell.api.project.unassign_declaration`).
 *
 * Typically used to remove an asset from a project library.
 *
 * See this file's header comment for a real, disclosed Python quirk: `relatingContext`
 * is accepted but not actually consulted by this function's own logic -- each
 * definition is un-declared from whatever context it is *currently* declared under,
 * regardless of whether that matches `relatingContext`.
 */
export const unassignDeclaration = wrapUsecase("project.unassign_declaration", unassignDeclarationUsecase);
