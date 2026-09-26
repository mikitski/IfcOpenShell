// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/pset.py` (src/ifcopenshell-python, 249 lines)
// -- deals with property-set/quantity-set *templates*: loading the bundled standard
// pset/qto template files, determining which template(s) apply to a given IFC class
// (`PsetQto.get_applicable`/`get_applicable_names`/`is_applicable`), classifying a
// template as PSET vs. QTO (`get_pset_template_type`), and parsing/re-serializing an
// `IfcPropertySetTemplate.ApplicableEntity` query string
// (`parse_applicable_entity`/`convert_applicable_entities_to_query`). Depends on
// `ifcopenshell.util.schema` (already ported, `util/schema.ts`) and
// `ifcopenshell.util.type` (already ported, `util/type.ts`) -- confirmed against the
// real Python source's own imports (`import ifcopenshell.util.schema` /
// `import ifcopenshell.util.type`, nothing else project-internal). Ported in full: no
// function in this module is stubbed, skipped, or blocked.
//
// *** Template-data-loading approach -- corrects a wrong guess in this chunk's own task
// brief *** : the brief speculated the bundled template files might be `.ifcxml`/JSON,
// suggesting either a JSON conversion or a hand-rolled XML reader. Investigated (read
// `PsetQto.__init__` and the actual files on disk, not assumed): the three files Python
// loads (`ifcopenshell/util/schema/Pset_{IFC2X3,IFC4_ADD2,IFC4X3}.ifc`, ~600KB-3.1MB
// each) are **plain STEP/SPF text (`ISO-10303-21;` ... `END-ISO-10303-21;`)** -- ordinary
// `.ifc` files, loaded via `ifcopenshell.open(path)`, the exact same parser every other
// `.ifc` file goes through. This TS port already has a full, working native STEP parser
// exposed as `native.file_new_with_data_data_size` (already used by `template.ts` and
// `test/util/migrator.test.ts`'s `parseIfc` helper) -- so no JSON conversion, no
// hand-rolled XML reader, and no new npm dependency are needed at all; this turned out to
// be a simpler situation than the brief anticipated, not a harder one. The three files are
// copied byte-for-byte into `src/ifcopenshell-ts/data/pset-templates/` (sibling to `src/`,
// matching `util/migrator.ts`'s/`util/type.ts`'s established JSON-data-bundling
// precedent for exactly the same `tsc`-doesn't-copy-non-`.ts`-files-under-`rootDir`
// reason -- see either of those files' own header comments for the full "why not `src/`"
// rationale, not repeated here) and loaded via `fs.readFileSync` off a
// package-root-relative path (`native_loader.ts`'s `findPackageRoot`), then parsed with
// the existing native buffer-based file constructor -- the same technique `template.ts`
// already uses, no new native surface. `package.json`'s `files` array already ships the
// whole `data` directory (added for `migrator.ts`), so no further packaging change is
// needed. Parsed template files are cached at module scope (`get_template`'s Python-level
// `templates: dict` global, ported as `templateFileCache` below) -- read once per schema,
// for the life of the process, matching Python's own global-dict caching exactly (Python
// never re-parses these files either, once `PsetQto(schema)` has been constructed once
// via `get_template`).
//
// `PsetQto.__init__`'s `self.schema = ifcopenshell.schema_by_name(schema)` (a
// free-standing "schema definition for an arbitrary schema name" lookup, independent of
// any already-open `IfcFile`) reuses `util/schema.ts`'s own `getSchemaDefinition` --
// previously module-private there (only used by `geometryClassesIntroducedAfter`/
// `ifc4OnlyGeometryClasses`), now exported specifically for this second real consumer
// (see that file's own updated header comment). No new native primitive or workaround
// needed: `schema.ts` had already solved this exact "no free-standing `schema_by_name`/
// `schema_registry`-instance primitive exists on this surface" problem via
// `template.create()` (confirmed there via the real C API header, not re-investigated
// here).
//
// `PsetQto`'s `@lru_cache`-decorated methods (`get_applicable`/`get_applicable_names`/
// `get_by_name`) are ported as ordinary per-instance `Map` caches keyed by a
// `JSON.stringify`'d argument tuple -- functionally equivalent for repeat calls with the
// same arguments (matching `test_pset.py`'s own 1000-iteration perf-sensitive tests; no
// identity guarantee is tested by Python's own suite here, unlike
// `geometryClassesIntroducedAfter` elsewhere, so this simpler idiom is sufficient), but
// NOT identical in one disclosed respect: a bare `@lru_cache` defaults to `maxsize=128`
// (LRU eviction once the 128th distinct argument tuple is seen), while these `Map`s never
// evict, growing unboundedly with the number of distinct argument tuples a caller passes
// over a `PsetQto` instance's lifetime. Low practical risk (the argument space is a
// finite IFC-class/predefined-type vocabulary -- low hundreds of entries even for an
// exhaustive caller) and arguably no worse than Python's own actual behavior here (a
// `@lru_cache` on an instance method caches keyed on `self` too, which keeps every
// `PsetQto` instance it's ever called on alive for the cache's lifetime -- a known
// `functools.lru_cache`-on-methods footgun this port's simpler per-instance `Map`
// incidentally avoids). Flagged here rather than silently claimed identical; adding a
// real LRU cap is a reasonable, non-blocking follow-up if a caller's usage pattern ever
// makes the unbounded growth a real concern.
//
// `PsetQto.__init__`'s IFC4-only "backport" (`QTO_OCCURRENCEDRIVEN` ->
// `QTO_TYPEDRIVENOVERRIDE`, bug 3583) mutates entities in the freshly-loaded,
// module-cached template file directly via the ordinary `EntityInstance` attribute
// setter (`element.TemplateType = ...`, routed through the existing `EntityInstance`
// Proxy setter -> `setByIndex`, the same "mutation must go through the existing
// `EntityInstance`/`IfcFile` API, never reimplemented" rule this project always follows)
// -- exactly matching Python's own unconditional `element.TemplateType = "..."` on its
// own freshly-`ifcopenshell.open()`-ed template file, with no `Transaction`/undo
// involved on either side (this is `PsetQto`'s own private, internal template file, never
// the caller's working `IfcFile`).
//
// *** Discrepancy vs. this chunk's own task brief, disclosed per its own instructions:
// *** the brief asserted "`util.pset` has real mutating functions" and asked for an
// undo/redo regression test verifying mutations route through `IfcFile`. Investigated by
// reading the full 249-line source (not assumed): this is not accurate. The *only*
// mutation anywhere in `pset.py` is the one-time IFC4 backport patch described above,
// applied exclusively to `PsetQto`'s own internal, process-lifetime-cached template file
// -- never a caller-supplied `IfcFile`. None of this module's public functions
// (`get_template`, `get_applicable`/`get_applicable_names`/`is_applicable`/`get_by_name`/
// `is_templated`, `get_pset_template_type`, `parse_applicable_entity`,
// `convert_applicable_entities_to_query`) mutate anything the caller passes in -- this
// module is a read-only query/lookup API over template data. No undo/redo regression
// test is meaningful here for the same reason Python itself has none (`test_pset.py`,
// read in full, has zero mutation-related assertions) -- `test/util/pset.test.ts` below
// instead has a dedicated test confirming the backport patch actually landed (verifying
// the *effect* of that one internal mutation, e.g. `Qto_WallBaseQuantities` becoming
// applicable to `IfcWallType`, matching `test_pset.py`'s own
// `test_getting_a_pset_of_a_type_where_the_type_class_is_not_explicitly_applicable`).
//
// No other disclosed primitive-layer gap: every remaining piece of this module (the
// `is_applicable` regex-based `ApplicableEntity` grammar, `get_pset_template_type`'s
// `TemplateType`/`HasPropertyTemplates` walk, `parse_applicable_entity`/
// `convert_applicable_entities_to_query`'s pure string parsing) is a direct,
// already-supported `EntityInstance` attribute read or pure string logic, no
// schema-introspection or native-layer need beyond what `EntityInstance`/`IfcFile`/
// `util/schema.ts`/`util/type.ts` already expose.

import * as fs from "node:fs";
import * as path from "node:path";
import type { EntityInstance } from "../entityInstance";
import { IfcFile } from "../file";
import type {
	declaration as NativeDeclaration,
	entity as NativeEntity,
	schema_definition as NativeSchemaDefinition,
} from "../native/ifcopenshell_native";
import { declaration as NativeDeclarationCtor } from "../native/ifcopenshell_native";
import { findPackageRoot, native } from "../native/native_loader";
import { type IFC_SCHEMA, getFallbackSchema, getSchemaDefinition, isA } from "./schema";
import { getApplicableTypes } from "./type";

/**
 * Python: `applicable = r"(\w+)(\[\w+\])*" + "/" + r"*(\w+)*(\[\w+\])*"` (the two halves
 * concatenated back-to-back form `PsetQto.is_applicable`'s inline `re.match` pattern --
 * split here only so this doc comment itself doesn't contain a literal `*` immediately
 * followed by `/`, which would terminate the comment early). `^`-anchored here (unlike
 * the bare pattern used with
 * `RegExp.prototype.exec`) to reproduce `re.match`'s implicit "only matches at position
 * 0" semantics -- without the anchor, `.exec()` would search anywhere in the string
 * rather than failing outright for a non-word-starting `applicable` segment the way
 * Python's `re.match` does. In practice every real `ApplicableEntity` segment starts
 * with an IFC class name (a word character), so this only matters for malformed input.
 */
const APPLICABLE_ENTITY_RE = /^(\w+)(\[\w+\])*\/*(\w+)*(\[\w+\])*/;

function loadTemplateFile(filename: string): IfcFile {
	const dataDir = path.join(findPackageRoot(__dirname), "data", "pset-templates");
	const buffer = fs.readFileSync(path.join(dataDir, filename));
	const handle = native.file_new_with_data_data_size(buffer, buffer.length);
	return new IfcFile(handle);
}

/**
 * `entity : public declaration` reinterpret-cast, the same verified, disclosed technique
 * `util/schema.ts`'s `entitySchema`/`entityName` already established (see that file's
 * header comment for the full justification) -- reused here (not re-derived) because
 * `schema.isA` needs a `declaration`-shaped handle, but this module only ever has an
 * `entity` handle (`schema_definition.declaration_by_name_with_name(...).as_entity()`)
 * for the IFC class being tested.
 */
function asDeclaration(entity: NativeEntity): NativeDeclaration {
	return new NativeDeclarationCtor(entity._handle);
}

function isEntityA(entity: NativeEntity, ifcClass: string): boolean {
	return isA(asDeclaration(entity), ifcClass);
}

/**
 * Python: `class PsetQto`. Loads/queries the standard property-set and quantity-set
 * templates for one IFC schema.
 */
export class PsetQto {
	// fmt: off
	private static readonly TEMPLATES_PATH: Readonly<Record<IFC_SCHEMA, string>> = {
		IFC2X3: "Pset_IFC2X3.ifc",
		IFC4: "Pset_IFC4_ADD2.ifc",
		IFC4X3: "Pset_IFC4X3.ifc",
	};
	// fmt: on

	readonly schema: NativeSchemaDefinition;
	readonly templates: IfcFile[];

	private readonly applicableCache = new Map<string, EntityInstance[]>();
	private readonly applicableNamesCache = new Map<string, string[]>();
	private readonly byNameCache = new Map<string, EntityInstance | null>();

	constructor(schema: IFC_SCHEMA, templates?: IfcFile[]) {
		this.schema = getSchemaDefinition(schema);
		let resolvedTemplates = templates;
		if (!resolvedTemplates) {
			const file = loadTemplateFile(PsetQto.TEMPLATES_PATH[schema]);
			resolvedTemplates = [file];
			// See bug 3583. We backport this change from IFC4X3 because it just makes
			// sense. Users aren't forced to use it.
			if (schema === "IFC4") {
				for (const element of file.byType("IfcPropertySetTemplate")) {
					if ((element.get("TemplateType") as string | null) === "QTO_OCCURRENCEDRIVEN") {
						element.set("TemplateType", "QTO_TYPEDRIVENOVERRIDE");
					}
				}
			}
		}
		this.templates = resolvedTemplates;
	}

	/** Python: `get_applicable(...) -> list[entity_instance]`. Get applicable property
	 * set templates. */
	getApplicable(
		ifcClass = "",
		predefinedType = "",
		psetOnly = false,
		qtoOnly = false,
		schema: IFC_SCHEMA = "IFC4",
	): EntityInstance[] {
		const cacheKey = JSON.stringify([ifcClass, predefinedType, psetOnly, qtoOnly, schema]);
		const cached = this.applicableCache.get(cacheKey);
		if (cached !== undefined) return cached;

		const anyClass = !ifcClass;
		let entity: NativeEntity | null = null;
		if (!anyClass) {
			// `declaration_by_name_with_name` throws for a name that doesn't exist in
			// this schema at all (matching Python's own `declaration_by_name` raising
			// for an unknown class -- `util/schema.ts`'s `reassignClass` established
			// this same "wrap in try/catch, don't assume null" precedent). `.as_entity()`
			// separately, cleanly returns `null` (no throw) for a name that DOES exist
			// but isn't an entity declaration (e.g. a defined type) -- Python's `assert
			// entity` is the equivalent check for that case.
			let declaration: NativeDeclaration;
			try {
				declaration = this.schema.declaration_by_name_with_name(ifcClass);
			} catch {
				throw new Error(`'${ifcClass}' does not exist in this schema.`);
			}
			entity = declaration.as_entity();
			if (entity === null) {
				throw new Error(`'${ifcClass}' is not an entity in this schema.`);
			}
		}

		const result: EntityInstance[] = [];
		for (const template of this.templates) {
			for (const propSet of template.byType("IfcPropertySetTemplate")) {
				const templateType = propSet.get("TemplateType") as string | null;
				if (psetOnly && templateType?.startsWith("QTO_")) continue;
				if (qtoOnly && templateType?.startsWith("PSET_")) continue;
				if (
					anyClass ||
					(entity &&
						this.isApplicable(
							entity,
							// Python: `prop_set.ApplicableEntity or "IfcRoot"` -- `||`,
							// not `??`, to also fall back on an empty string, matching
							// Python's truthiness check exactly.
							(propSet.get("ApplicableEntity") as string | null) || "IfcRoot",
							predefinedType,
							templateType,
							schema,
						))
				) {
					result.push(propSet);
				}
			}
		}
		this.applicableCache.set(cacheKey, result);
		return result;
	}

	/** Python: `get_applicable_names(...) -> list[str]`. Return names instead of objects
	 * for other use e.g. enum. */
	getApplicableNames(
		ifcClass: string,
		predefinedType = "",
		psetOnly = false,
		qtoOnly = false,
		schema: IFC_SCHEMA = "IFC4",
	): string[] {
		const cacheKey = JSON.stringify([ifcClass, predefinedType, psetOnly, qtoOnly, schema]);
		const cached = this.applicableNamesCache.get(cacheKey);
		if (cached !== undefined) return cached;

		const names = this.getApplicable(ifcClass, predefinedType, psetOnly, qtoOnly, schema).map(
			(propSet) => propSet.get("Name") as string,
		);
		this.applicableNamesCache.set(cacheKey, names);
		return names;
	}

	/**
	 * Python: `is_applicable(entity: W.entity, applicables: str, predefined_type: str =
	 * "", template_type: str = "NOTDEFINED", schema: IFC_SCHEMA = "IFC4") -> bool`.
	 *
	 * `applicables` can have multiple possible patterns:
	 * - `IfcBoilerType`                               (IfcClass)
	 * - `IfcBoilerType/STEAM`                         (IfcClass/PREDEFINEDTYPE)
	 * - `IfcBoilerType[PerformanceHistory]`           (IfcClass[PerformanceHistory])
	 * - `IfcBoilerType/STEAM[PerformanceHistory]`     (IfcClass/PREDEFINEDTYPE[PerformanceHistory])
	 */
	isApplicable(
		entity: NativeEntity,
		applicables: string,
		predefinedType = "",
		templateType: string | null = "NOTDEFINED",
		schema: IFC_SCHEMA = "IFC4",
	): boolean {
		for (const applicable of applicables.split(",")) {
			const match = APPLICABLE_ENTITY_RE.exec(applicable);
			if (!match) continue;
			// Uncomment if usage found
			// const applicablePerfHistory = match[2] ?? match[4];
			const matchedType = match[3];
			if (matchedType && !predefinedType) continue;
			// Case insensitive to handle things like material categories
			if (matchedType && predefinedType.toLowerCase() !== matchedType.toLowerCase()) continue;

			const applicableClass = match[1];
			if (isEntityA(entity, applicableClass)) return true;
			// There is an implementer agreement that if the template type is
			// type based, the type need not be explicitly mentioned
			// https://github.com/buildingSMART/IFC4.3.x-development/issues/22
			// This will be fixed in IFC4.3
			const effectiveTemplateType = templateType ?? "";
			if (effectiveTemplateType.includes("TYPE") && isEntityA(entity, "IfcTypeObject")) {
				let types = getApplicableTypes(applicableClass, schema);
				if (types.length === 0) {
					// Abstract classes will not have an "applicable type" but the
					// implementer agreement still applies to them.
					let occurrenceClass: NativeDeclaration | null = null;
					try {
						occurrenceClass = this.schema.declaration_by_name_with_name(`${applicableClass}Type`);
					} catch {
						try {
							occurrenceClass = this.schema.declaration_by_name_with_name(`IfcType${applicableClass.slice(3)}`);
						} catch {
							occurrenceClass = null;
						}
					}
					if (occurrenceClass) {
						types = [occurrenceClass.name()];
					}
				}
				for (const ifcType of types) {
					if (isEntityA(entity, ifcType)) return true;
				}
			}
		}
		return false;
	}

	/** Python: `get_by_name(name: str) -> Optional[entity_instance]`. */
	getByName(name: string): EntityInstance | null {
		const cached = this.byNameCache.get(name);
		if (cached !== undefined) return cached;

		let found: EntityInstance | null = null;
		outer: for (const template of this.templates) {
			for (const propSet of template.byType("IfcPropertySetTemplate")) {
				if ((propSet.get("Name") as string | null) === name) {
					found = propSet;
					break outer;
				}
			}
		}
		this.byNameCache.set(name, found);
		return found;
	}

	/** Python: `is_templated(name: str) -> bool`. */
	isTemplated(name: string): boolean {
		return this.getByName(name) !== null;
	}
}

const templateFileCache = new Map<IFC_SCHEMA, PsetQto>();

/**
 * Python: `get_template(schema_identiier: str) -> PsetQto`.
 *
 * @param schemaIdentifier As in `file.schemaIdentifier`, not `file.schema`.
 */
export function getTemplate(schemaIdentifier: string): PsetQto {
	const schema = getFallbackSchema(schemaIdentifier);
	let template = templateFileCache.get(schema);
	if (!template) {
		template = new PsetQto(schema);
		templateFileCache.set(schema, template);
	}
	return template;
}

/**
 * Python: `get_pset_template_type(pset_template: entity_instance) -> Literal["PSET",
 * "QTO", None]`.
 *
 * Get the type of the pset template. If type is mixed or not defined, return `null`.
 */
export function getPsetTemplateType(psetTemplate: EntityInstance): "PSET" | "QTO" | null {
	// Try to identify whether it's pset or qto from the template type.
	const templateType = psetTemplate.get("TemplateType") as string | null;
	if (templateType) {
		if (templateType.startsWith("PSET_")) return "PSET";
		if (templateType.startsWith("QTO_")) return "QTO";
		// Can also be 'NOTDEFINED'.
	}

	const psetTypes = new Set<"PSET" | "QTO">();
	const propTemplates = (psetTemplate.get("HasPropertyTemplates") as EntityInstance[]) ?? [];
	for (const prop of propTemplates) {
		const propTemplateType = prop.get("TemplateType") as string | null;
		if (propTemplateType) {
			if (propTemplateType.startsWith("P_")) {
				psetTypes.add("PSET");
			} else {
				// All other values are Q_.
				psetTypes.add("QTO");
			}
		}
	}

	return psetTypes.size === 1 ? [...psetTypes][0] : null;
}

/**
 * Python: `class ApplicableEntity(NamedTuple)`. TS has no direct namedtuple equivalent
 * (a positionally-indexable, named-field tuple) -- ported as a plain readonly object with
 * the same field names, matching `util/element.ts`'s own established
 * `PrioritisedLayer` precedent for this exact situation.
 */
export interface ApplicableEntity {
	readonly value: string;
	readonly ifcClass: string;
	readonly predefinedType: string | null;
	readonly performanceHistory: boolean;
}

/**
 * Splits `text` on `separator`, matching Python's `parts if len(parts := text.split(sep))
 * > 1 else (text, fallback)` idiom used twice in `parse_applicable_entity` (once for
 * `"/"`, once for `"["`). Python's tuple-unpacking (`item, predefined_type = parts`)
 * would raise `ValueError` for a 3+-part split (more than one separator occurrence) --
 * not reproduced here; only the first two parts are used, a deliberate, inconsequential
 * simplification for malformed input. Verified safe against every one of the 1407
 * distinct `ApplicableEntity` segments actually present across all three bundled
 * template files (`data/pset-templates/*.ifc`, not just the five hand-picked Python test
 * fixtures) -- programmatically split each on `,` and checked for a second `/` or `[`:
 * zero matches in any of the three files, so this simplification never actually diverges
 * from Python's behavior on real data, only on hypothetical malformed input no real
 * template currently contains.
 */
function splitOnce(text: string, separator: string): [string, string | null] {
	const parts = text.split(separator);
	if (parts.length > 1) {
		return [parts[0], parts[1]];
	}
	return [text, null];
}

/**
 * Python: `parse_applicable_entity(applicable_entity: str) -> list[ApplicableEntity]`.
 *
 * Parse `ApplicableEntity` string query to tuples.
 *
 * @param applicableEntity `IfcPropertySetTemplate.ApplicableEntity` query.
 */
export function parseApplicableEntity(applicableEntity: string): ApplicableEntity[] {
	const items: ApplicableEntity[] = [];
	for (const item of applicableEntity.split(",")) {
		const value = item;
		const [beforePredefinedType, predefinedType] = splitOnce(item, "/");
		const [ifcClass, performanceHistoryPart] = splitOnce(beforePredefinedType, "[");
		items.push({
			value,
			ifcClass,
			predefinedType,
			performanceHistory: performanceHistoryPart !== null,
		});
	}
	return items;
}

/**
 * Python: `convert_applicable_entities_to_query(applicable_entities: list[ApplicableEntity])
 * -> str`.
 *
 * Get query supported by `ifcopenshell.util.selector.filter_elements`.
 */
export function convertApplicableEntitiesToQuery(applicableEntities: readonly ApplicableEntity[]): string {
	const parts: string[] = [];
	for (const entity of applicableEntities) {
		// NOTE: selector currently doesn't support checking if element has performance
		// history.
		let part = entity.ifcClass;
		if (entity.predefinedType) {
			part += `, PredefinedType="${entity.predefinedType}"`;
		}
		parts.push(part);
	}
	return parts.join(" + ");
}
