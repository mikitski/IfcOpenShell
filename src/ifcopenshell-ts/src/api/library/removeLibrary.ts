// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/library/remove_library.py` (src/ifcopenshell-python, 62
// lines) -- see `./index.ts`'s own header comment for the module's overall scope.
// Removes an `IfcLibraryInformation` along with every reference belonging to it (but NOT
// their own consequences beyond that -- see below) and every `IfcRelAssociatesLibrary`
// directly or indirectly pointing at either.
//
// --- IFC2X3-vs-IFC4+ dispatch, ported verbatim -- each branch collects `rels`
//     differently, confirmed directly against the real Python source ---
//
// IFC4+: walks `library.HasLibraryReferences` (an inverse attribute, not in the
// generated `.d.ts` -- dynamically accessed via `.get(...)`, matching this port's
// established convention for undeclared inverse attributes; NOT the same name as
// `util/element.ts`'s `REFERENCE_TYPES["IfcLibraryInformation"].inverseAttribute`, which
// is `LibraryInfoForObjects` -- a DIFFERENT inverse, pointing at rels that relate
// PRODUCTS to the library itself, not at the library's own child references). For each
// reference, its own `LibraryRefForObjects` rels (association rels involving that
// reference, not the library) are collected into `rels` BEFORE the reference itself is
// removed -- then, after every reference is removed, `library.LibraryInfoForObjects`
// (rels associating products directly with the LIBRARY, i.e. `REFERENCE_TYPES`'s own
// entry) is appended too, and finally `library` itself is removed.
//
// IFC2X3: has no `HasLibraryReferences`/`LibraryRefForObjects`/`LibraryInfoForObjects`
// inverse attributes at all, so instead removes every entry in the forward
// `library.LibraryReference` list, then `library` itself, then does a WHOLE-FILE sweep
// over every `IfcRelAssociatesLibrary` whose `RelatingLibrary` is now `null` -- relying
// on `IfcFile.remove`'s own automatic "null out any attribute referencing a just-removed
// entity" cascade (see `../classification/removeClassification.ts`'s own header comment
// for the identical mechanism, confirmed there against `IfcFile.remove`'s doc comment) to
// have already nulled `RelatingLibrary` on every rel that pointed at either the removed
// `library` OR any of its removed references. Real Python's own inline comment says it
// outright: `# RelatingLibrary could either be library itself or library reference we
// removed`. Ported verbatim via the same schema branch, not collapsed to one shared path.

import type { EntityInstance } from "../../entityInstance";
import type { IfcFile } from "../../file";
import * as elementUtil from "../../util/element";
import { wrapUsecase } from "../hooks";

/** Python's `set()`/dedup-by-identity idiom -- see `./assignReference.ts`'s identical, independently re-declared local helper for the full rationale. */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}

	update(instances: Iterable<EntityInstance>): void {
		for (const instance of instances) this.add(instance);
	}

	toArray(): EntityInstance[] {
		return [...this.byIdentity.values()];
	}
}

export interface RemoveLibrarySettings {
	/** The `IfcLibraryInformation` entity you want to remove. */
	library: EntityInstance;
}

function removeLibraryUsecase(file: IfcFile, settings: RemoveLibrarySettings): void {
	const { library } = settings;

	// Python's plain `rels = []` list (not deduplicated by identity -- appended to via
	// `.extend(...)` in both branches, ported the same way via a plain array).
	let rels: EntityInstance[] = [];

	if (file.schema !== "IFC2X3") {
		const references = new EntityInstanceSet();
		references.update(library.get("HasLibraryReferences") as EntityInstance[]);
		for (const reference of references.toArray()) {
			rels = rels.concat(reference.get("LibraryRefForObjects") as EntityInstance[]);
			file.remove(reference);
		}
		rels = rels.concat(library.get("LibraryInfoForObjects") as EntityInstance[]);
		file.remove(library);
	} else {
		const references = new EntityInstanceSet();
		references.update((library.get("LibraryReference") as EntityInstance[] | null) ?? []);
		for (const reference of references.toArray()) {
			file.remove(reference);
		}
		file.remove(library);
		// RelatingLibrary could either be the library itself or a library reference we
		// removed -- see header comment.
		rels = file.byType("IfcRelAssociatesLibrary").filter((rel) => !rel.get("RelatingLibrary"));
	}

	for (const rel of rels) {
		const history = rel.get("OwnerHistory") as EntityInstance | null;
		file.remove(rel);
		if (history) elementUtil.removeDeep2(file, history);
	}
}

/**
 * Removes a library (Python: `ifcopenshell.api.library.remove_library`).
 *
 * All references along with their relationships will also be removed. Any products
 * which have relationships to this library will not be removed.
 *
 * @example
 * ```ts
 * const library = api.library.addLibrary(model, { name: "Brickschema" });
 * api.library.removeLibrary(model, { library });
 * ```
 */
export const removeLibrary = wrapUsecase("library.remove_library", removeLibraryUsecase);
