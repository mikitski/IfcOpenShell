// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/doc.py`'s **runtime lookup functions only**
// (src/ifcopenshell-python, 1123 lines total) -- planning/ifcopenshell-ts/research/
// 03-python-util-inventory.md's `doc.py` entry: this module splits into two very
// different pieces, and only the first is this chunk's scope:
//
// 1. **Runtime lookup functions** (Tier A -- trivial JSON lookups, THIS chunk's scope,
//    Python lines ~1-252): `get_db`, `get_schema_by_name`, `get_class_suggestions`,
//    `get_entity_doc`, `get_attribute_doc`, `get_predefined_type_doc`,
//    `get_property_set_doc`, `get_property_doc`, `get_type_doc`,
//    `get_inverse_attributes`, plus the `BaseData`/`EntityData`/`PsetData`/
//    `PropertyData`/`ClassesSuggestions`/`SchemaData` `TypedDict`s (ported below as TS
//    interfaces/types).
//
// 2. **`class DocExtractor`** (Python lines ~255-1085) and `run_doc_api_examples()`
//    (line ~1085 onward) -- explicitly, deliberately NOT ported here, and not a porting
//    target at all per the research doc's own Tier C classification. This is a
//    one-time, build-time-only documentation-scraping tool: it reads reStructuredText
//    doc comments out of the bundled HTML/`.ifc`-spec doc trees (`Ifc2.3.0.1/`,
//    `Ifc4.0.2.1/`, `IFC4.3-html/`, `IFC4.3.x-development/`) and, at generation time,
//    scrapes bsDD/buildingSMART spec websites live via `requests`/`bs4`/`lxml`/
//    `markdown` (all four wrapped in Python's own bare `try/except` import at the top
//    of `doc.py`, "Only necessary if you're using it to generate the docs database") --
//    it *produces* the very JSON files the lookup functions above *consume*, it is not
//    itself part of the runtime lookup API, and none of those four scraping
//    dependencies is a reasonable thing to add to a TS runtime library. Confirmed by
//    reading the full 1123-line source, not assumed: `DocExtractor`'s only outputs are
//    the 10 bundled JSON files this chunk copies verbatim (see below) -- reusing
//    Python's own generated output is strictly simpler and more correct than
//    reimplementing an HTML/RST scraper in TS, and matches this project's own stated
//    Tier C guidance ("keep in Python, just reuse its JSON output").
//
// *** JSON-data-bundling approach (reuses, doesn't reinvent, `util/migrator.ts`'s/
// `util/type.ts`'s/`util/pset.ts`'s established precedent -- see any of those files'
// own header comments for the full "why sibling to `src/`, why not `resolveJsonModule`"
// rationale, not repeated here) ***: `get_db`'s `SCHEMA_FILES` dict points at 10 bundled
// JSON files under `src/ifcopenshell-python/ifcopenshell/util/schema/`
// (`{ifc2x3,ifc4,ifc4x3}_{entities,properties,types}.json`, one shared
// `ifc_classes_suggestions.json`) totalling ~5MB. Copied byte-for-byte into
// `src/ifcopenshell-ts/data/doc/` (verified via `diff` against the Python source before
// committing -- see this chunk's own final report) and loaded via `fs.readFileSync` off
// a package-root-relative path (`findPackageRoot`). `package.json`'s `files` array
// already ships the whole `data` directory (added for `migrator.ts`), so no packaging
// change was needed.
//
// Python's `get_db` lazy-loads all 10 files into a module-level `global db` dict on
// first call, then serves every later call (any schema) from that cache forever --
// ported here as a module-level `dbCache` variable populated by `loadDb()` on first
// `getDb()` call, matching `util/type.ts`'s "read once, at module scope" precedent
// (rather than `util/pset.ts`'s per-schema `Map` cache, since Python's own `db` here is
// a single dict keyed by schema, populated *all at once* on first access -- not
// per-schema lazily -- and this port preserves that exact one-shot-then-cache-forever
// shape, including reading every schema's files even if the caller only ever asks about
// one).
//
// `get_schema_by_name` (`ifcopenshell.schema_by_name(version)`, a free-standing
// schema-definition lookup independent of any already-open `IfcFile`) reuses
// `util/schema.ts`'s own already-`export`ed `getSchemaDefinition` -- the exact same
// primitive `util/pset.ts`'s `PsetQto.__init__` already reuses for the identical need
// (see that file's own header comment). No new native primitive or workaround needed.
//
// `get_inverse_attributes(el)` (confirmed via its one real call site,
// `DocExtractor`'s own `for a in list(entity.attributes()) + get_inverse_attributes
// (entity)`, `doc.py` line 994 -- out of this chunk's ported scope, but readable for
// context) operates on a schema-level `entity` declaration (`NativeEntity`), not an
// `entity_instance`/`EntityInstance`. Ported using the *existing* native primitives
// (`entity.all_inverse_attributes()`, `inverse_attribute.attribute_reference()`,
// `attribute.type_of_attribute()`, `parameter_type.as_aggregation_type()`/
// `as_named_type()`, `named_type.declared_type()`, `declaration.as_select_type()`,
// `select_type.select_list()`, `declaration.name()`) -- no new primitive needed. One
// real, disclosed shape mismatch vs. Python fixed along the way: Python calls
// `attribute_type.declared_type()` unconditionally on whatever `parameter_type`
// subclass SWIG's Python proxy has auto-downcast to (relying on Python-side dynamic
// dispatch this TS binding's flat wrapper classes don't reproduce -- `parameter_type`
// itself exposes no `declared_type()`; only `named_type`/`simple_type` do, with
// *different* return types, see `src/ifcparse/schema.h`). In practice this is always a
// `named_type` here: an *inverse* attribute's type is, by EXPRESS-schema construction,
// always a reference to another entity/select (never a bare primitive), so
// `attribute_type.as_named_type()` never actually returns `null` for any inverse
// attribute in any of the three bundled schemas -- verified against all three real
// schemas in `test/util/doc.test.ts` (every inverse attribute across every entity in
// IFC2X3/IFC4/IFC4X3 resolves to a `named_type`). The `null` branch is still handled
// defensively (skipped, not thrown) rather than mirroring Python's implicit crash on a
// `simple_type.declared_type()` returning a non-`declaration` enum, since this project
// never lets a hypothetical primitive-layer type mismatch propagate as an unexplained
// runtime error.
//
// *** Two real, disclosed discrepancies between `doc.py`'s own type hints and the
// actual bundled JSON data (found by reading the real data files, not just the type
// hints -- both also confirmed against `bonsai/bim/module/root/data.py`'s real,
// upstream consumer of `get_class_suggestions`) ***:
//
// 1. `get_class_suggestions`' declared Python return type is `Union[ClassesSuggestions,
//    None]` (a single dict), and `SchemaData.classes_suggestions` is declared as
//    `dict[str, ClassesSuggestions]`. The real bundled `ifc_classes_suggestions.json`
//    (and Bonsai's own `for suggestion_dict in class_suggestions:` loop over the
//    result) both show this is actually a **list** of `ClassesSuggestions` per class
//    name (e.g. `"IfcActuator": [{"name": "Electric Strike", "predefined_type":
//    "NOTDEFINED"}]`) -- a stale/wrong type hint in the Python source, not a real
//    single-object shape. Ported per the *real* data/usage shape, not the wrong
//    annotation: `getClassSuggestions` returns `ClassesSuggestions[] | undefined`, and
//    `SchemaData.classesSuggestions` is `Record<string, ClassesSuggestions[]>`.
//
// 2. `PsetData`'s `description`/`spec_url` fields are correctly marked
//    `NotRequired` in Python (`# Apparently some psets in ifc4 are missing spec url /
//    description`) -- verified true against the real IFC4 data (3 of 515 psets missing
//    `description`, 2 missing `spec_url`) -- ported faithfully as optional (`?`) fields,
//    not tightened to required.
//
// 3. `PsetData.properties` is declared `dict[str, str]` in Python, and `get_property_doc`
//    is declared to return `Union[str, None]` -- both wrong. The real bundled data shows
//    every pset property value is itself a `PropertyData`-shaped dict (e.g.
//    `Pset_WallCommon.properties.FireRating == {"description": "..."}`, never a bare
//    string), and the one real upstream consumer of `get_property_doc`
//    (`bonsai/bim/helper.py`'s `add_attribute_description`: `doc =
//    get_property_doc(...); description = doc.get("description", "")`) confirms it's
//    always treated as a dict, never a string, in practice. Ported per the real shape:
//    `PsetData.properties: Record<string, PropertyData>`, `getPropertyDoc(...):
//    PropertyData | undefined`.
//
// No other disclosed primitive-layer gap or data-shape mismatch: every remaining
// function (`get_entity_doc`'s recursive parent-attribute merge, `get_attribute_doc`,
// `get_predefined_type_doc`, `get_property_set_doc`, `get_property_doc`, `get_type_doc`)
// is a direct, already-supported JSON object lookup plus (for `get_entity_doc` only) an
// already-ported `getSchemaDefinition`/`declaration_by_name_with_name`/`supertype()`
// walk, no native/schema-introspection need beyond what's already bound.

import * as fs from "node:fs";
import * as path from "node:path";
import type {
	attribute as NativeAttribute,
	declaration as NativeDeclaration,
	entity as NativeEntity,
	inverse_attribute as NativeInverseAttribute,
	schema_definition as NativeSchemaDefinition,
} from "../native/ifcopenshell_native";
import { findPackageRoot } from "../native/native_loader";
import { type IFC_SCHEMA, entityName, getFallbackSchema, getSchemaDefinition } from "./schema";

/** Python: `class BaseData(TypedDict)`. */
export interface BaseData {
	description: string;
	specUrl: string;
}

/** Python: `class EntityData(BaseData)`. */
export interface EntityData extends BaseData {
	attributes?: Record<string, string>;
	predefinedTypes?: Record<string, string>;
}

/**
 * Python: `class PsetData(TypedDict)`.
 *
 * Apparently some psets in IFC4 are missing spec url / description -- verified against
 * the real bundled data (see this file's own header comment); ported as optional, not
 * tightened to required.
 */
export interface PsetData {
	description?: string;
	specUrl?: string;
	// Python's own type hint says `dict[str, str]` -- wrong, per this file's own header
	// comment's third disclosed discrepancy: the real bundled data (and `get_property_doc`'s
	// real, upstream consumer, `bonsai/bim/helper.py`'s `doc.get("description", "")`)
	// both confirm each property is a `PropertyData`-shaped dict, never a bare string.
	properties: Record<string, PropertyData>;
}

/**
 * Python: `class PropertyData(TypedDict)`.
 *
 * In IFC4X3 there is no `children` for properties.
 */
export interface PropertyData {
	description: string;
	children?: Record<string, PropertyData>;
}

/** Python: `class ClassesSuggestions(TypedDict)`. */
export interface ClassesSuggestions {
	name: string;
	predefinedType?: string;
}

/**
 * Python: `class SchemaData(TypedDict)`.
 *
 * `classesSuggestions` is a `Record<string, ClassesSuggestions[]>`, not `Record<string,
 * ClassesSuggestions>` as Python's own (stale) type hint claims -- see this file's own
 * header comment for the real-data-and-real-caller evidence.
 */
export interface SchemaData {
	entities: Record<string, EntityData>;
	types: Record<string, BaseData>;
	properties: Record<string, PsetData>;
	classesSuggestions: Record<string, ClassesSuggestions[]>;
}

/**
 * Raw on-disk JSON shapes (snake_case keys, exactly as the bundled files -- and
 * Python's own field names -- spell them) for the four `SchemaData` sub-lookups. Not
 * exported: `loadDb` below translates each into the camelCase `SchemaData` shape above
 * immediately after reading it, so no caller ever sees the raw snake_case form.
 */
interface RawBaseData {
	description: string;
	spec_url: string;
}
interface RawEntityData extends RawBaseData {
	attributes?: Record<string, string>;
	predefined_types?: Record<string, string>;
}
interface RawPsetData {
	description?: string;
	spec_url?: string;
	// `PropertyData` needs no snake_case/camelCase translation of its own (its fields --
	// `description`/`children` -- are already single words), so the raw and translated
	// shapes are identical here; `toPsetData` passes this straight through.
	properties: Record<string, PropertyData>;
}
interface RawClassesSuggestions {
	name: string;
	predefined_type?: string;
}

function toEntityData(raw: RawEntityData): EntityData {
	const data: EntityData = { description: raw.description, specUrl: raw.spec_url };
	if (raw.attributes) data.attributes = raw.attributes;
	if (raw.predefined_types) data.predefinedTypes = raw.predefined_types;
	return data;
}

function toBaseData(raw: RawBaseData): BaseData {
	return { description: raw.description, specUrl: raw.spec_url };
}

function toPsetData(raw: RawPsetData): PsetData {
	const data: PsetData = { properties: raw.properties };
	if (raw.description !== undefined) data.description = raw.description;
	if (raw.spec_url !== undefined) data.specUrl = raw.spec_url;
	return data;
}

function toClassesSuggestions(raw: RawClassesSuggestions): ClassesSuggestions {
	const data: ClassesSuggestions = { name: raw.name };
	if (raw.predefined_type !== undefined) data.predefinedType = raw.predefined_type;
	return data;
}

/** Python: `SCHEMA_FILES: dict[SUPPORTED_SCHEMA, dict[str, Path]]`. */
const SCHEMA_FILES: Record<
	IFC_SCHEMA,
	{ entities: string; properties: string; types: string; classesSuggestions: string }
> = {
	IFC2X3: {
		entities: "ifc2x3_entities.json",
		properties: "ifc2x3_properties.json",
		types: "ifc2x3_types.json",
		classesSuggestions: "ifc_classes_suggestions.json",
	},
	IFC4: {
		entities: "ifc4_entities.json",
		properties: "ifc4_properties.json",
		types: "ifc4_types.json",
		classesSuggestions: "ifc_classes_suggestions.json",
	},
	IFC4X3: {
		entities: "ifc4x3_entities.json",
		properties: "ifc4x3_properties.json",
		types: "ifc4x3_types.json",
		classesSuggestions: "ifc_classes_suggestions.json",
	},
};

function readJsonFile<T>(filename: string): T {
	const dataDir = path.join(findPackageRoot(__dirname), "data", "doc");
	const text = fs.readFileSync(path.join(dataDir, filename), "utf-8");
	return JSON.parse(text) as T;
}

/**
 * Python: `db: dict[SUPPORTED_SCHEMA, SchemaData] = None`, lazily populated by
 * `get_db`. Module-level cache, matching `util/type.ts`'s "read once, cache forever"
 * precedent -- see this file's own header comment for why this is a single "load
 * everything on first call" cache (like Python's own `global db`), not a per-schema
 * lazy `Map`.
 */
let dbCache: Record<IFC_SCHEMA, SchemaData> | null = null;

function loadDb(): Record<IFC_SCHEMA, SchemaData> {
	const db = {} as Record<IFC_SCHEMA, SchemaData>;
	for (const ifcVersion of Object.keys(SCHEMA_FILES) as IFC_SCHEMA[]) {
		const files = SCHEMA_FILES[ifcVersion];

		const rawEntities = readJsonFile<Record<string, RawEntityData>>(files.entities);
		const entities: Record<string, EntityData> = {};
		for (const [name, raw] of Object.entries(rawEntities)) entities[name] = toEntityData(raw);

		const rawTypes = readJsonFile<Record<string, RawBaseData>>(files.types);
		const types: Record<string, BaseData> = {};
		for (const [name, raw] of Object.entries(rawTypes)) types[name] = toBaseData(raw);

		const rawProperties = readJsonFile<Record<string, RawPsetData>>(files.properties);
		const properties: Record<string, PsetData> = {};
		for (const [name, raw] of Object.entries(rawProperties)) properties[name] = toPsetData(raw);

		const rawClassesSuggestions = readJsonFile<Record<string, RawClassesSuggestions[]>>(files.classesSuggestions);
		const classesSuggestions: Record<string, ClassesSuggestions[]> = {};
		for (const [name, raw] of Object.entries(rawClassesSuggestions)) {
			classesSuggestions[name] = raw.map(toClassesSuggestions);
		}

		db[ifcVersion] = { entities, types, properties, classesSuggestions };
	}
	return db;
}

/**
 * Python: `get_db(version: IFC_SCHEMA) -> Union[SchemaData, None]`.
 *
 * Lazily loads (once, for the process lifetime) and returns the bundled documentation
 * database for `version`'s fallback schema.
 */
export function getDb(version: string): SchemaData | undefined {
	if (!dbCache) {
		dbCache = loadDb();
	}
	const resolvedVersion = getFallbackSchema(version);
	return dbCache[resolvedVersion];
}

/**
 * Python: `get_schema_by_name(version: str) -> ifcopenshell_wrapper.schema_definition`.
 *
 * Python maintains its own `global schema_by_name` per-schema cache dict here; this
 * port deliberately doesn't duplicate it -- `util/schema.ts`'s own `getSchemaDefinition`
 * (reused below, the same free-standing "`schema_definition` for an arbitrary schema
 * name" primitive `util/pset.ts`'s `PsetQto` already reuses) already caches per schema
 * at its own module scope, so a second cache layer here would only add indirection with
 * no observable behavior difference.
 */
export function getSchemaByName(version: string): NativeSchemaDefinition {
	return getSchemaDefinition(getFallbackSchema(version));
}

/**
 * Python: `get_class_suggestions(version, class_name) -> Union[ClassesSuggestions,
 * None]`.
 *
 * Returns `ClassesSuggestions[] | undefined` -- see this file's own header comment for
 * why this is a list, not a single object, correcting Python's own stale type hint.
 */
export function getClassSuggestions(version: string, className: string): ClassesSuggestions[] | undefined {
	const db = getDb(version);
	if (!db) return undefined;
	return db.classesSuggestions[className];
}

/**
 * Python: `get_entity_doc(version, entity_name, recursive=True) -> Union[EntityData,
 * None]`.
 *
 * Get the documentation for an entity. If `recursive`, attributes are merged in from
 * every supertype (Python: `copy.deepcopy` + walking `.supertype()`).
 */
export function getEntityDoc(version: string, entityName_: string, recursive = true): EntityData | undefined {
	const db = getDb(version);
	if (!db) return undefined;
	const found = db.entities[entityName_];
	// Deliberate, disclosed, verified-never-observed divergence from Python here:
	// Python's `entity = copy.deepcopy(db["entities"].get(entity_name))` doesn't
	// early-return on a missing entry -- if `entity_name` is a real schema entity that
	// happens to be *absent* from the JSON db (docs generation gap) and also has a
	// supertype, Python's own `entity["attributes"] = dict()` a few lines down would
	// raise `TypeError: 'NoneType' object does not support item assignment`. This port
	// returns `undefined` early instead, which is safe rather than a hidden crash.
	// Verified this never actually changes behavior on any real input: every entity
	// declared in each of the three bundled native schemas (653/776/876 for
	// IFC2X3/IFC4/IFC4X3) has a corresponding JSON db entry, with zero gaps, in all
	// three -- confirmed directly against the real built schemas, not assumed.
	if (!found) return undefined;
	// Python: `copy.deepcopy(db["entities"].get(entity_name))` -- a fresh, mutable copy
	// so the recursive merge below never mutates the cached `db` entry.
	const entity: EntityData = {
		description: found.description,
		specUrl: found.specUrl,
		...(found.attributes ? { attributes: { ...found.attributes } } : {}),
		...(found.predefinedTypes ? { predefinedTypes: { ...found.predefinedTypes } } : {}),
	};
	if (!recursive) return entity;

	const ifcSchema = getSchemaByName(version);
	const ifcEntity = ifcSchema.declaration_by_name_with_name(entityName_).as_entity();
	const ifcSupertype = ifcEntity?.supertype() ?? null;
	if (ifcSupertype) {
		const parentEntity = getEntityDoc(version, entityName(ifcSupertype), true);
		if (!entity.attributes) entity.attributes = {};
		for (const [parentAttr, parentDoc] of Object.entries(parentEntity?.attributes ?? {})) {
			entity.attributes[parentAttr] = parentDoc;
		}
	}
	return entity;
}

/**
 * Python: `get_attribute_doc(version, entity, attribute, recursive=True) ->
 * Union[str, None]`.
 */
export function getAttributeDoc(
	version: string,
	entity: string,
	attribute: string,
	recursive = true,
): string | undefined {
	const db = getDb(version);
	if (!db) return undefined;
	const entity_ = getEntityDoc(version, entity, recursive);
	return entity_?.attributes?.[attribute];
}

/**
 * Python: `get_predefined_type_doc(version, entity, predefined_type) -> Union[str,
 * None]`.
 */
export function getPredefinedTypeDoc(version: string, entity: string, predefinedType: string): string | undefined {
	const db = getDb(version);
	if (!db) return undefined;
	const entity_ = db.entities[entity];
	return entity_?.predefinedTypes?.[predefinedType];
}

/** Python: `get_property_set_doc(version, pset) -> Union[PsetData, None]`. */
export function getPropertySetDoc(version: string, pset: string): PsetData | undefined {
	const db = getDb(version);
	if (!db) return undefined;
	return db.properties[pset];
}

/**
 * Python: `get_property_doc(version, pset, prop) -> Union[str, None]`.
 *
 * Python's own declared return type (`Union[str, None]`) is wrong -- see this file's
 * own header comment's third disclosed discrepancy: ported per the real data/real
 * upstream-consumer shape, `PropertyData | undefined`, not a bare string.
 */
export function getPropertyDoc(version: string, pset: string, prop: string): PropertyData | undefined {
	const db = getDb(version);
	if (!db) return undefined;
	const pset_ = db.properties[pset];
	return pset_?.properties[prop];
}

/** Python: `get_type_doc(version, ifc_type) -> Union[BaseData, None]`. */
export function getTypeDoc(version: string, ifcType: string): BaseData | undefined {
	const db = getDb(version);
	if (!db) return undefined;
	return db.types[ifcType];
}

/**
 * Python: `get_inverse_attributes(el)`.
 *
 * `el`'s only real call site (`DocExtractor`, out of this chunk's scope) passes a
 * schema-level `entity` declaration, not an `entity_instance`/`EntityInstance` -- see
 * this file's own header comment for the full type-resolution story (the
 * `parameter_type` -> `named_type`/`declaration` walk this needs) and the one
 * disclosed, verified-safe simplification (`as_named_type()` returning `null` is
 * skipped defensively, never observed for any real inverse attribute).
 *
 * TODO (ported verbatim from Python): there are still some discrepancies between this
 * method and the specs website because of the asymmetry. More:
 * https://github.com/buildingSMART/IFC4.3.x-development/issues/582
 */
export function getInverseAttributes(el: NativeEntity): NativeInverseAttribute[] {
	const inverseAttrs: NativeInverseAttribute[] = [];
	const elName = entityName(el);

	for (const a of el.all_inverse_attributes()) {
		const attribute: NativeAttribute = a.attribute_reference();
		let attributeType = attribute.type_of_attribute();

		// unpacking aggregation types
		let asAggregation = attributeType.as_aggregation_type();
		while (asAggregation !== null) {
			attributeType = asAggregation.type_of_element();
			asAggregation = attributeType.as_aggregation_type();
		}

		const namedType = attributeType.as_named_type();
		if (namedType === null) {
			// See this file's own header comment: never observed for any real inverse
			// attribute across all three bundled schemas, handled defensively anyway.
			continue;
		}
		const declaredType = namedType.declared_type();

		// recursively looking for entities inside the selections
		const typesToProcess: NativeDeclaration[] = [declaredType];
		const entityAttrTypes: string[] = [];
		while (typesToProcess.length > 0) {
			for (const attrType of [...typesToProcess]) {
				const selectType = attrType.as_select_type();
				if (selectType !== null) {
					typesToProcess.push(...selectType.select_list());
				} else {
					entityAttrTypes.push(attrType.name());
				}
				typesToProcess.splice(typesToProcess.indexOf(attrType), 1);
			}
		}

		if (entityAttrTypes.includes(elName)) {
			inverseAttrs.push(a);
		}
	}
	return inverseAttrs;
}
