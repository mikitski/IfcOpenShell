// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/classification.py` (src/ifcopenshell-python,
// 99 lines) -- one of Phase 3's four small, independent `util` Tier A chunks (`type.py`,
// `classification.py`, `constraint.py`, `system.py`). Depends only on `util.element`
// (already ported, `util/element.ts`'s `getType`) -- confirmed against the real Python
// source's own imports.
//
// Ported in full: `get_references`, `get_classification`, `get_inherited_references`,
// `get_classification_data`.
//
// *** Relationship to `util/selector.ts`'s pre-existing narrow re-implementations ***:
// `selector.ts` (landed before this module existed) contains disclosed, narrow, private
// local re-implementations of exactly `get_classification`/`get_references`
// (`getClassificationNarrow`/`getReferencesNarrow`), built because `util.classification`
// wasn't ported yet at the time -- see that file's own header comment, finding #2, for
// the full story. `getReferences`/`getClassification` below were verified line-by-line
// against those narrow versions before being written (not just assumed identical): both
// are behaviorally identical to the real Python functions ported here, so this chunk's
// own logic is the same shape as `selector.ts`'s narrow copies, just promoted to a real,
// exported, fully-documented module-level port. This PR also updates `selector.ts` to
// import and call these real functions instead of its own narrow copies, removing
// `getClassificationNarrow`/`getReferencesNarrow` and their now-obsolete disclosure
// comments (see that file's own header comment for the post-cleanup state) -- the
// "narrow reimplementation becomes obsolete once the real module lands" cleanup this
// project's disclosure discipline anticipates.
//
// No disclosed primitive-layer gap: every function here is a direct attribute-graph
// walk (forward `ReferencedSource`, inverse-via-relationship `HasAssociations`/
// `HasExternalReferences`/`HasExternalReference`/`HasReferences`), all already-bound
// primitives with no schema-introspection or native-layer need beyond what
// `EntityInstance`/`IfcFile` already expose.

import type { EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import { getType } from "./element";

// --- internal helpers (mirroring `util/element.ts`'s own `attrOrMissing`/`attrOrNull`/
// `attrList`/`EntityInstanceSet` -- not exported from that file, so re-declared here
// rather than reaching into another module's private internals; see that file's own doc
// comments, and `util/selector.ts`'s identical precedent, for the full rationale, not
// repeated here) ---

const MISSING: unique symbol = Symbol("ifcopenshell.util.classification: attribute not declared on this class");

function attrOrMissing(element: EntityInstance, name: string): unknown {
	try {
		return element.get(name);
	} catch {
		return MISSING;
	}
}

function attrOrNull(element: EntityInstance, name: string): unknown {
	const value = attrOrMissing(element, name);
	return value === MISSING ? null : value;
}

function attrList(element: EntityInstance, name: string): EntityInstance[] {
	const value = attrOrNull(element, name);
	return value === null ? [] : (value as EntityInstance[]);
}

/** Python's `del data[key]` -- matches `util/element.ts`'s own `deleteKey` helper (not
 * exported from that file, so re-declared here); needs the key genuinely absent
 * afterward (Python dict semantics), not merely set to `undefined`. */
function deleteKey(obj: Record<string, unknown>, key: string): void {
	delete obj[key];
}

/**
 * Python's `results = set()` idiom, keyed by `EntityInstance.identity()` rather than JS
 * `Set`'s reference-equality membership test -- the N-API primitive layer mints a fresh
 * JS wrapper object per accessor call, so two wrappers of the identical underlying
 * instance are never `===`. See `util/element.ts`'s own `EntityInstanceSet` (not
 * exported, hence re-declared here) and `util/selector.ts`'s identical precedent for the
 * full rationale.
 */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}

	update(instances: Iterable<EntityInstance>): void {
		for (const instance of instances) this.add(instance);
	}

	get size(): number {
		return this.byIdentity.size;
	}

	toSet(): Set<EntityInstance> {
		return new Set(this.byIdentity.values());
	}
}

/**
 * Python: `get_classification(reference: entity_instance) -> entity_instance`.
 *
 * Get the IfcClassification that a classification reference belongs to.
 *
 * Python's docstring/signature claims a non-optional `entity_instance` return, but the
 * real implementation falls off the end returning `None` when `reference.ReferencedSource`
 * is unset -- ported faithfully as `EntityInstance | null`, not "fixed" to match the
 * docstring.
 */
export function getClassification(reference: EntityInstance): EntityInstance | null {
	if (reference.isA("IfcClassification")) return reference;
	const referencedSource = reference.get("ReferencedSource") as EntityInstance | null;
	return referencedSource !== null ? getClassification(referencedSource) : null;
}

/**
 * Python: `get_references(element: entity_instance, should_inherit=True) ->
 * set[entity_instance]`.
 *
 * Gets classification references associated with the element.
 *
 * If `shouldInherit` is true, classification references are inherited from the type.
 * Classifications can be overriden per system.
 */
export function getReferences(element: EntityInstance, shouldInherit = true): Set<EntityInstance> {
	if (!element.isA("IfcRoot")) {
		// Python: `(references := getattr(element, "HasExternalReferences", None)) is not
		// None or (references := getattr(element, "HasExternalReference", None)) is not
		// None` -- takes this branch only when the attribute is both *declared* and
		// *non-None* (a declared-but-unset forward attribute, `null` here, does NOT
		// short-circuit this check), matching `!== MISSING && !== null` below, not just
		// `!== MISSING`.
		let references = attrOrMissing(element, "HasExternalReferences");
		if (references === MISSING || references === null) {
			references = attrOrMissing(element, "HasExternalReference");
		}
		if (references !== MISSING && references !== null) {
			const refs = references as EntityInstance[];
			const set = new EntityInstanceSet();
			set.update(refs.map((r) => r.get("RelatingReference") as EntityInstance));
			return set.toSet();
		}
	}

	let results = new Set<EntityInstance>();
	if (shouldInherit && element.isA("IfcObject")) {
		const elementType = getType(element);
		if (elementType && !elementType.equals(element)) {
			results = getReferences(elementType);
		}
	}

	const occurrenceSet = new EntityInstanceSet();
	for (const rel of attrList(element, "HasAssociations")) {
		if (rel.isA("IfcRelAssociatesClassification")) {
			occurrenceSet.add(rel.get("RelatingClassification") as EntityInstance);
		}
	}
	const occurrenceResults = occurrenceSet.toSet();

	if (results.size === 0) return occurrenceResults;

	// Group both the inherited type-level references and the element's own occurrence
	// references by their owning `IfcClassification` "system", then let an occurrence
	// group fully *replace* a type-level group for the same system (Python's
	// `type_references_per_system.update(occurrence_references_per_system)`), rather
	// than merge into it -- an element's own classification under a given system
	// overrides an inherited one under that same system.
	const groupBySystem = (refs: Iterable<EntityInstance>): Map<number, EntityInstance[]> => {
		const groups = new Map<number, EntityInstance[]>();
		for (const r of refs) {
			const classification = getClassification(r);
			const key = classification ? classification.identity() : -1;
			const group = groups.get(key);
			if (group) group.push(r);
			else groups.set(key, [r]);
		}
		return groups;
	};
	const bySystem = groupBySystem(results);
	for (const [key, refs] of groupBySystem(occurrenceResults)) bySystem.set(key, refs);
	const merged = new EntityInstanceSet();
	for (const refs of bySystem.values()) {
		merged.update(refs);
	}
	return merged.toSet();
}

/**
 * Python: `get_inherited_references(reference: Optional[entity_instance]) ->
 * list[entity_instance]`.
 *
 * Walks up the `ReferencedSource` chain from `reference`, collecting every
 * `IfcClassificationReference` visited (stopping at, and NOT including, the owning
 * `IfcClassification` itself), in nearest-to-furthest order.
 */
export function getInheritedReferences(reference: EntityInstance | null): EntityInstance[] {
	const results: EntityInstance[] = [];
	let current = reference;
	while (true) {
		if (!current || current.isA("IfcClassification")) break;
		results.push(current);
		current = current.get("ReferencedSource") as EntityInstance | null;
	}
	return results;
}

/**
 * Python: `get_classification_data(file: ifcopenshell.file) -> Optional[tuple[list[dict],
 * str]]`.
 *
 * Builds a nested, JSON-serialisable tree of the file's first `IfcClassification`'s
 * `HasReferences` graph (recursively, via each reference's own `HasReferences`), plus
 * that classification's `Name`. Returns `([], "")` when `file` is falsy or has no
 * `IfcClassification` at all -- matching Python's own guard exactly (despite the
 * `Optional[...]` in the signature, the real implementation never returns `None`).
 */
export function getClassificationData(file: IfcFile | null): [Record<string, unknown>[], string] {
	if (!file || file.byType("IfcClassification").length === 0) return [[], ""];
	const classification = file.byType("IfcClassification")[0];
	const classificationName = classification.get("Name") as string;

	function processReferences(reference: EntityInstance): Record<string, unknown> {
		const data = reference.getInfo();
		// Python's `del data["ReferencedSource"]` -- matches `util/element.ts`'s own
		// `deleteKey` helper (needs the key genuinely absent, not merely `undefined`).
		deleteKey(data, "ReferencedSource");
		const referencedSource = reference.get("ReferencedSource") as EntityInstance | null;
		data.referenced_source = referencedSource ? referencedSource.id() : null;
		const hasReferences = attrList(reference, "HasReferences");
		data.has_references = hasReferences.length > 0;
		data.references = hasReferences.length > 0 ? hasReferences.map(processReferences) : [];
		return data;
	}

	const classificationData = attrList(classification, "HasReferences").map(processReferences);
	return [classificationData, classificationName];
}
