// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/brick.py` (src/ifcopenshell-python, 105
// lines) -- Phase 10's "Niche `util` modules" chunk (`PROGRESS.md`'s own table entry),
// one of the 3 confirmed-remaining-unported real Python `util` files. Depends only on
// `util.classification` (`getReferences`/`getClassification`), `util.element`
// (`getPredefinedType`/`getType`), and `util.system` (`getConnectedTo`/
// `getConnectedFrom`) -- all already landed, confirmed against the real Python source's
// own imports.
//
// Ported in full: `get_brick_type`, `get_element_feeds`.
//
// *** Static data-file loading ***: Python loads `ifc4_to_brick.json` (sitting next to
// `brick.py` in the real source tree) as a MODULE-LEVEL side effect at import time via
// `os.path.join(os.path.dirname(os.path.realpath(__file__)), "ifc4_to_brick.json")`.
// This port follows `util/doc.ts`'s own already-established "bundle the JSON verbatim
// under this package's own `data/` directory, load via `fs.readFileSync` off a
// `findPackageRoot`-relative path" precedent (see that file's own header comment for
// the full "why sibling to `src/`, why not `resolveJsonModule`" rationale, not repeated
// here) rather than inventing a new loading mechanism: the file is copied
// byte-for-byte (verified via `diff` against the real Python source before committing)
// into `data/brick/ifc4_to_brick.json`, and read once, at module scope, into
// `ifc4ToBrickMap` below -- matching Python's own "read once, at import time" eagerness
// (unlike `doc.ts`'s own *lazy* first-call cache, since this file's own JSON is a single
// flat, tiny (35-entry) lookup table with no per-schema variants to defer loading of).
//
// No disclosed primitive-layer gap: every function here is a direct JSON-lookup plus
// already-bound `EntityInstance`/`util.classification`/`util.element`/`util.system`
// primitive, no schema-introspection or native-layer need beyond what's already bound.

import * as fs from "node:fs";
import * as path from "node:path";
import type { EntityInstance } from "../entityInstance";
import { findPackageRoot } from "../native/native_loader";
import { getClassification, getReferences } from "./classification";
import { getPredefinedType, getType } from "./element";
import { getConnectedFrom, getConnectedTo } from "./system";

// --- internal helper (mirroring `util/classification.ts`'s own private
// `EntityInstanceSet`, re-declared here rather than reaching into another module's
// private internals -- see that file's own doc comment, and `util/selector.ts`'s
// identical precedent, for the full rationale. This copy additionally exposes `has()`,
// which `getElementFeeds`'s `processed_elements` membership test needs and
// `classification.ts`'s own copy doesn't currently expose) ---

/**
 * Python's `results = set()`/`x in results` idioms, keyed by `EntityInstance.identity()`
 * rather than JS `Set`'s reference-equality membership test -- the N-API primitive
 * layer mints a fresh JS wrapper object per accessor call, so two wrappers of the
 * identical underlying instance are never `===`. See `util/classification.ts`'s own
 * identical `EntityInstanceSet` (not exported, hence re-declared here).
 */
class EntityInstanceSet {
	private readonly byIdentity = new Map<number, EntityInstance>();

	add(instance: EntityInstance): void {
		this.byIdentity.set(instance.identity(), instance);
	}

	has(instance: EntityInstance): boolean {
		return this.byIdentity.has(instance.identity());
	}

	toSet(): Set<EntityInstance> {
		return new Set(this.byIdentity.values());
	}
}

/** Python: `cwd = os.path.dirname(os.path.realpath(__file__))` + `with open(os.path.
 * join(cwd, "ifc4_to_brick.json")) as f: ifc4_to_brick_map = json.load(f)` -- see this
 * file's own header comment for the bundling/loading rationale. */
const ifc4ToBrickMap: Record<string, string> = JSON.parse(
	fs.readFileSync(path.join(findPackageRoot(__dirname), "data", "brick", "ifc4_to_brick.json"), "utf-8"),
);

/**
 * Python: `get_brick_type(element: entity_instance) -> Union[str, None]`.
 *
 * Gets the Brick Schema class URI (e.g. `https://brickschema.org/schema/Brick#AHU`) an
 * IFC element most closely maps onto, first checking for a real, explicit "Brick"
 * `IfcClassification` reference, then falling back to the bundled IFC4-class ->
 * Brick-class lookup table (by `IfcClass.PredefinedType`, then bare `IfcClass`, then
 * the element's *type*'s equivalents with `"Type"` stripped from the class name), then
 * a generic `IfcDistributionElement`/`IfcSpatialElement`/`IfcSpatialStructureElement`/
 * `IfcSystem` fallback.
 */
export function getBrickType(element: EntityInstance): string | undefined {
	const references = getReferences(element);
	for (const reference of references) {
		const system = getClassification(reference);
		// Python: `system.Name` -- no `None` guard, matching Python's own unguarded
		// access (`util/cost.ts`/`util/placement.ts`'s established "cast, don't
		// silently guard, when Python itself doesn't" precedent for this exact
		// situation).
		if ((system as EntityInstance).get("Name") === "Brick") {
			return reference.get("Location") as string;
		}
	}

	let result: string | undefined;
	const predefinedType = getPredefinedType(element);
	if (predefinedType) {
		result = ifc4ToBrickMap[`${element.isA()}.${predefinedType}`];
	}
	if (!result) {
		result = ifc4ToBrickMap[element.isA()];
	}
	if (!result) {
		const elementType = getType(element);
		if (elementType) {
			// Python's `str.replace(old, new)` with no `count` argument replaces
			// EVERY occurrence, not just the first -- `String.prototype.replace`
			// with a plain string argument replaces only the first, so this uses
			// `replaceAll` to match Python's actual (all-occurrences) semantics,
			// not JS's own single-replace default. (No real IFC4 class name
			// contains "Type" more than once today, so this never observably
			// differs in practice -- ported for exact semantic parity anyway.)
			const ifcTypeClass = elementType.isA().replaceAll("Type", "");
			result = ifc4ToBrickMap[`${ifcTypeClass}.${predefinedType}`];
			if (!result) {
				result = ifc4ToBrickMap[ifcTypeClass];
			}
		}
	}

	if (result) {
		if (result.startsWith("http")) return result;
		return `https://brickschema.org/schema/Brick#${result}`;
	}

	// Generic fallback
	if (element.isA("IfcDistributionElement")) {
		return "https://brickschema.org/schema/Brick#Equipment";
	}
	if (element.isA("IfcSpatialElement") || element.isA("IfcSpatialStructureElement")) {
		return "https://brickschema.org/schema/Brick#Location";
	}
	if (element.isA("IfcSystem")) {
		return "https://brickschema.org/schema/Brick#System";
	}
	return undefined;
}

/** Python: internal `extend_branch`'s `branch_element` dict shape. Not exported --
 * module-private, matching Python's own closure-local dict (never returned to
 * `get_element_feeds`'s own caller; see `getElementFeeds`'s own doc comment for why
 * this whole tree is built and then discarded, ported anyway for exact structural/
 * side-effect fidelity). */
interface BranchElement {
	element: EntityInstance;
	// Python: `branch_element["children"].append(extend_branch(...))` appends
	// `extend_branch`'s own RETURN VALUE (`branch`, the list it was passed and
	// mutated in place) -- i.e. each child is itself a whole (single-item) branch
	// list, not a single `BranchElement` -- so this is genuinely `BranchElement[][]`,
	// not `BranchElement[]`, matching Python's real (slightly unusual) shape exactly.
	children: BranchElement[][];
	predecessor: EntityInstance | null;
}

/**
 * Python: `get_element_feeds(element: entity_instance) -> set[entity_instance]`.
 *
 * Walks downstream through `IfcFlowFitting`/`IfcFlowSegment` elements (flow-direction
 * `"SOURCE"`, both `get_connected_to`/`get_connected_from`) from `element`, collecting
 * every non-fitting/non-segment element reached along the way (`downstream_equipment`).
 *
 * Python builds a full branch/children tree (`extend_branch`'s own `branch`/
 * `branch_element`/`predecessor` bookkeeping) purely for the traversal's own recursive
 * control flow -- the tree itself (`extended_branch`) is never read after being built,
 * only `downstream_equipment` (populated as a side effect of the same walk) is
 * returned. Ported completely, including the unused tree, for exact structural
 * fidelity rather than only porting the "used" subset -- see this file's own header
 * comment.
 */
export function getElementFeeds(element: EntityInstance): Set<EntityInstance> {
	const processedElements = new EntityInstanceSet();
	const downstreamEquipment = new EntityInstanceSet();

	function extendBranch(
		el: EntityInstance,
		branch: BranchElement[],
		predecessor: EntityInstance | null = null,
	): BranchElement[] {
		processedElements.add(el);
		const branchElement: BranchElement = { element: el, children: [], predecessor };
		branch.push(branchElement);

		const connected = new EntityInstanceSet();
		for (const e of getConnectedTo(el, "SOURCE")) {
			if (!processedElements.has(e)) connected.add(e);
		}
		for (const e of getConnectedFrom(el, "SOURCE")) {
			if (!processedElements.has(e)) connected.add(e);
		}

		for (const connectedElement of connected.toSet()) {
			if (connectedElement.isA("IfcFlowFitting") || connectedElement.isA("IfcFlowSegment")) {
				branchElement.children.push(extendBranch(connectedElement, [], el));
			} else {
				downstreamEquipment.add(connectedElement);
			}
		}

		return branch;
	}

	extendBranch(element, []);
	return downstreamEquipment.toSet();
}
