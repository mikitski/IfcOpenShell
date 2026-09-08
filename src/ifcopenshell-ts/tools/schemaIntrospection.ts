// This file was generated with the assistance of an AI coding tool.
//
// Shared schema-walking helpers for the `.d.ts` generator (`generate-dts.ts`) and the
// differential attribute-cache correctness test (`test/attributeCache.test.ts`, per
// `40-testing-strategy.md` SS5.5) -- both need to call `entity_instance`-level
// primitives (`get_attribute_category`/`get_argument_index`/`attribute_type`/
// `attribute_kind_of`) for *every* entity class in the schema, but those are all
// per-instance methods, and ~half of a typical IFC schema's entity classes are
// abstract (EXPRESS `ABSTRACT SUPERTYPE`) and can never be instantiated directly
// (`file.createEntity("IfcElement")` throws).
//
// The fix: map every entity class to a concrete, instantiable *representative* --
// itself if concrete, else any concrete descendant found via `EntityInstance.isA(name)`.
// This is correct, not just convenient: `attribute_kind_of`/`get_attribute_type_name`/
// `get_attribute_category` (`src/wrappergen/shim/attribute_value_shim.cpp`) all resolve
// purely from `instance.declaration()` -- the instance's *type*, never its actual
// attribute *values* -- so any instance whose declared type is `E` or a descendant of
// `E` is an equally valid stand-in for querying `E`'s own (or inherited) attributes.
// This also relies on attribute indices being stable/inherited across the hierarchy by
// construction (`ifcopenshell::entity::attribute_index`, `src/ifcparse/schema.h`: a
// subtype's attribute list is exactly its supertype's `all_attributes()` list *plus*
// its own further attributes, appended) -- verified by reading that implementation,
// not assumed.
//
// A genuine, disclosed primitive-layer gap this module works around rather than
// papering over: `entity.supertype(): entity` *is* exposed, but the returned `entity`
// object carries no way to recover its own name (or `index_in_schema()`, or any other
// `declaration`-inherited accessor) via the currently-exposed N-API surface --
// wrappergen's clang frontend only discovers a class's own directly-declared C++
// methods, not members inherited from a base class (`entity : public declaration`),
// the exact same limitation `entityInstance.ts`'s `getInverseAttribute` already
// documents for `inverse_attribute.entity_reference()`. This means a supertype-name
// graph (needed for a TS `extends` clause) cannot be built from `.supertype()` at all
// without either a new primitive (out of scope for this chunk, flagged rather than
// added) or a fragile pointer-reinterpretation hack across mismatched C-API wrapper
// structs (not attempted). `generate-dts.ts` deliberately does not use `.supertype()`
// for this reason -- see its own header comment for the resulting design choice (flat,
// fully-inlined interfaces, no `extends` chain).

import type { EntityInstance } from "../src/entityInstance";
import type { IfcFile } from "../src/file";
import type { entity as NativeEntity } from "../src/native/ifcopenshell_native";

export interface EntityCatalogEntry {
	readonly name: string;
	readonly entity: NativeEntity;
	readonly isAbstract: boolean;
}

export interface EntityCatalog {
	readonly entries: readonly EntityCatalogEntry[];
}

/** Every entity declaration in `file`'s schema (abstract and concrete alike). */
export function buildEntityCatalog(file: IfcFile): EntityCatalog {
	const entries: EntityCatalogEntry[] = [];
	for (const declaration of file.nativeFile.schema().declarations()) {
		const entity = declaration.as_entity();
		if (entity === null) continue; // not an entity declaration (a type/select/enum)
		entries.push({ name: declaration.name(), entity, isAbstract: entity.is_abstract() });
	}
	return { entries };
}

export interface RepresentativeResult {
	/** className -> a concrete instance whose type is that class or a descendant of it. */
	readonly representatives: ReadonlyMap<string, EntityInstance>;
	/** Classes with no reachable concrete representative (should be empty in practice
	 * for a real IFC schema -- every abstract type has at least one concrete
	 * descendant -- surfaced explicitly rather than silently dropped if ever wrong). */
	readonly unresolved: readonly string[];
}

/**
 * Creates one throwaway shadow instance per concrete entity class in `file` (mutates
 * `file` -- callers should use a dedicated scratch `IfcFile`, never one holding real
 * data) and resolves every class (including abstract ones) to a representative.
 */
export function buildRepresentatives(file: IfcFile, catalog: EntityCatalog): RepresentativeResult {
	const representatives = new Map<string, EntityInstance>();
	const concreteInstances: EntityInstance[] = [];
	for (const entry of catalog.entries) {
		if (entry.isAbstract) continue;
		try {
			const instance = file.createEntity(entry.name);
			representatives.set(entry.name, instance);
			concreteInstances.push(instance);
		} catch {
			// Disclosed, narrow: a concrete class that genuinely can't be
			// default-constructed with zero attributes (none observed in practice
			// across IFC2X3/IFC4/IFC4X3, but not assumed impossible) is skipped here;
			// it ends up in `unresolved` below like an abstract class with no
			// reachable descendant would.
		}
	}
	const unresolved: string[] = [];
	for (const entry of catalog.entries) {
		if (representatives.has(entry.name)) continue; // concrete, resolved to itself above
		const found = concreteInstances.find((instance) => instance.isA(entry.name));
		if (found) {
			representatives.set(entry.name, found);
		} else {
			unresolved.push(entry.name);
		}
	}
	return { representatives, unresolved };
}
