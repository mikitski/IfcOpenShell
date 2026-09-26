// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/type.py` (src/ifcopenshell-python, 81 lines)
// -- one of Phase 3's four small, independent `util` Tier A chunks (`type.py`,
// `classification.py`, `constraint.py`, `system.py`), each ported in its own file per
// this project's one-file-per-Python-module convention. Depends on `util.schema`
// (already ported, `util/schema.ts`'s `getFallbackSchema`) -- no other dependency,
// confirmed against the real Python source's own imports.
//
// Ported in full: `get_applicable_types`, `get_applicable_entities`, plus the
// module-load-time `entity_to_type_map`/`type_to_entity_map` construction (including
// IFC2X3's two special-case adjustments -- prioritising `IfcBuildingElementProxyType`
// and the "guessed element" narrowing -- both reproduced verbatim, not simplified).
//
// *** New JSON-data-bundling precedent reused (not established) by this chunk ***: the
// three `entity_to_type_map_{2x3,4,4x3}.json` files this module loads at import time
// are verbatim copies of `src/ifcopenshell-python/ifcopenshell/util/entity_to_type_map_
// *.json`, copied into `src/ifcopenshell-ts/data/type-map/` -- *sibling* to `src/`, not
// inside it, and loaded via `fs.readFileSync` off a package-root-relative path
// (`native/native_loader.ts`'s `findPackageRoot`), exactly matching `util/migrator.ts`'s
// own established precedent for this (see that file's header comment for the full
// "why not `src/`, why not `resolveJsonModule`" rationale, not repeated here).
// `package.json`'s `files` array already ships the whole `data` directory (added for
// `migrator.ts`), so no further packaging change is needed. Read once at module load
// (module-level `const`s below), matching Python's own module-level (not per-call)
// construction.
//
// No disclosed primitive-layer gap: this module is pure data transformation (JSON ->
// two derived lookup maps) plus two trivial dict lookups, no native/schema-introspection
// calls at all.

import * as fs from "node:fs";
import * as path from "node:path";
import { findPackageRoot } from "../native/native_loader";
import { type IFC_SCHEMA, getFallbackSchema } from "./schema";

function loadTypeMapData(filename: string): Record<string, string[]> {
	const dataDir = path.join(findPackageRoot(__dirname), "data", "type-map");
	const text = fs.readFileSync(path.join(dataDir, filename), "utf-8");
	return JSON.parse(text) as Record<string, string[]>;
}

const MAPPED_SCHEMA_FILES: Readonly<Record<IFC_SCHEMA, string>> = {
	IFC2X3: "entity_to_type_map_2x3.json",
	IFC4: "entity_to_type_map_4.json",
	IFC4X3: "entity_to_type_map_4x3.json",
};

const BUILDING_ELEMENT_PROXY_TYPE = "IfcBuildingElementProxyType";

/** Python: `element_types.sort(key=lambda x: x == "IfcBuildingElementProxyType",
 * reverse=True)` -- a stable descending sort by the boolean "is this the target string"
 * key, which moves every occurrence of the target string to the front while preserving
 * the relative order of everything else (and of multiple target occurrences, though in
 * practice there is at most one). JS `Array.prototype.sort` is guaranteed stable
 * (ES2019+), so a comparator expressing the same "target first, else unchanged" rule
 * reproduces this exactly. Mutates `elementTypes` in place, matching Python's own
 * in-place `list.sort()`. */
function prioritiseBuildingElementProxyType(elementTypes: string[]): void {
	elementTypes.sort((a, b) => {
		const aIsTarget = a === BUILDING_ELEMENT_PROXY_TYPE;
		const bIsTarget = b === BUILDING_ELEMENT_PROXY_TYPE;
		if (aIsTarget === bIsTarget) return 0;
		return aIsTarget ? -1 : 1;
	});
}

const entityToTypeMap: Record<IFC_SCHEMA, Record<string, string[]>> = {} as Record<
	IFC_SCHEMA,
	Record<string, string[]>
>;
const typeToEntityMap: Record<IFC_SCHEMA, Record<string, string[]>> = {} as Record<
	IFC_SCHEMA,
	Record<string, string[]>
>;

for (const schema of Object.keys(MAPPED_SCHEMA_FILES) as IFC_SCHEMA[]) {
	entityToTypeMap[schema] = loadTypeMapData(MAPPED_SCHEMA_FILES[schema]);

	const typeToEntity: Record<string, string[]> = {};
	for (const [element, elementTypes] of Object.entries(entityToTypeMap[schema])) {
		for (const elementType of elementTypes) {
			const occurrences = typeToEntity[elementType];
			if (occurrences) {
				occurrences.push(element);
			} else {
				typeToEntity[elementType] = [element];
			}
		}
	}
	typeToEntityMap[schema] = typeToEntity;

	if (schema === "IFC2X3") {
		// Prioritize IfcBuildingElementProxyType if it's available as it seems to be
		// the most generic type. Otherwise classes that don't have a special type in
		// IFC2X3 (e.g. IfcBuildingElementPart, IfcRoof) have IfcBeamType as their
		// first matching type, which can be confusing.
		for (const elementTypes of Object.values(entityToTypeMap[schema])) {
			if (elementTypes.includes(BUILDING_ELEMENT_PROXY_TYPE)) {
				prioritiseBuildingElementProxyType(elementTypes);
			}
		}

		// There is no official mapping for IFC2X3 but this method gets us something
		// that looks correct.
		//
		// NOTE: currently `type_to_entity_map` in IFC2X3 doesn't completely match
		// `entity_to_type_map`, e.g. `get_applicable_types(IfcRoof)` returns
		// `[IfcBuildingElementProxyType, IfcBeamType, ...]` but
		// `get_applicable_entities(IfcBuildingElementProxyType)` returns
		// `[IfcBuildingElementProxy]`.
		for (const [elementType, elements] of Object.entries(typeToEntityMap[schema])) {
			// Need to take both Type (4 symbols) and Style (5 symbols) into account.
			const guessedElement = elementType.endsWith("Style") ? elementType.slice(0, -5) : elementType.slice(0, -4);
			if (elements.includes(guessedElement)) {
				typeToEntityMap[schema][elementType] = elements.filter((e) => e.includes(guessedElement));
			}
		}
	}
}

/**
 * Python: `get_applicable_types(ifc_class: str, schema: IFC_SCHEMA = "IFC4") ->
 * list[str]`.
 *
 * Get applicable types IFC classes for the occurrence IFC class. E.g. `"IfcWindow"` ->
 * `["IfcWindowType"]`.
 */
export function getApplicableTypes(ifcClass: string, schema = "IFC4"): string[] {
	const resolvedSchema = getFallbackSchema(schema.toUpperCase());
	return entityToTypeMap[resolvedSchema][ifcClass] ?? [];
}

/**
 * Python: `get_applicable_entities(ifc_type_class: str, schema: IFC_SCHEMA = "IFC4") ->
 * list[str]`.
 *
 * Get applicable occurrence IFC classes for the type IFC class. E.g. `"IfcWindowType"`
 * -> `["IfcWindow"]`.
 */
export function getApplicableEntities(ifcTypeClass: string, schema = "IFC4"): string[] {
	const resolvedSchema = getFallbackSchema(schema.toUpperCase());
	return typeToEntityMap[resolvedSchema][ifcTypeClass] ?? [];
}
