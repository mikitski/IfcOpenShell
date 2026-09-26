// This file was generated with the assistance of an AI coding tool.
//
// Near-verbatim port of `ifcopenshell/util/schema.py`'s `class Migrator:` (src/
// ifcopenshell-python, ~380 lines, the tail this project's own `util/schema.ts`
// chunk 1 deliberately excluded -- see that file's header comment) -- a
// JSON-data-file-driven engine that migrates entities between IFC schema versions
// (IFC2X3 <-> IFC4 <-> IFC4X3) when attributes were added/removed/renamed/retyped
// between versions. Kept in its own file (not folded into `schema.ts`) per that
// chunk's own precedent ("architecturally distinct and large enough to warrant its
// own ... chunk, matching `util/element.ts`'s own established 'split large modules'
// precedent") and this chunk's own task brief.
//
// Also ports `_enum_value_outside_target` (`schema.py`'s one `Migrator`-only private
// helper, likewise excluded from chunk 1) as `enumValueOutsideTarget` below, reusing
// `schema.ts`'s own `isEnumMember` (exported from that file for exactly this reuse --
// see its own doc comment) rather than `util/attribute.ts`'s `getEnumItems`, which is
// a real, disclosed, *always-throwing* primitive-layer gap (that function's own doc
// comment: `enumeration_type::enumeration_items()` has no forward index -> name
// binding at all) -- `lookup_enum_offset`'s working *reverse* (name -> index) lookup
// answers the single-value membership question this needs without it, exactly
// matching `reassignClass`'s own established precedent for the identical situation.
//
// *** New JSON-data-bundling precedent established by this chunk ***: no existing
// `src/ifcopenshell-ts/` module loads a static JSON data file (confirmed by searching
// the whole package before writing this) -- `Migrator`'s four lookup tables
// (`class_4_to_2x3.json`, `class_2x3_to_4.json`, `attribute_4_to_2x3.json`,
// `attribute_4x3_to_4.json`, verbatim copies of `src/ifcopenshell-python/ifcopenshell/
// util/*.json`) are copied into `src/ifcopenshell-ts/data/schema-migration/` --
// *sibling* to `src/`/`native/`/`test/`, not inside `src/` itself, because `tsc`
// (this package's `outDir: dist/cjs`, `rootDir: src`) only compiles/copies `.ts`
// files under `rootDir`; a plain data file placed under `src/` would silently NOT
// appear in the compiled `dist/cjs/` tree. Loaded via `fs.readFileSync` off a
// package-root-relative path (`native/native_loader.ts`'s own `findPackageRoot`,
// exported from that module for exactly this reuse -- the same "runs both against
// `src/` directly and against `tsc`'s `dist/cjs/` output" problem that module's own
// header comment already solved for locating the compiled native addon), NOT a
// `resolveJsonModule` static `import` (this package's `tsconfig.json` doesn't enable
// it, and enabling it wouldn't itself make `tsc` copy the raw `.json` into `dist/`
// either). `package.json`'s `files` array gained a `"data"` entry so these ship with
// the published package. Read once at module load (not per-`Migrator`-instance,
// unlike Python's own `__init__`, which re-`json.load`s these 4 files from disk on
// *every* `Migrator()` construction) -- a deliberate, disclosed, non-observable
// optimization: the parsed data is immutable and read-only everywhere it's used, so
// caching it at module scope (Node's own `require`/module-cache semantics do this
// naturally for a real `import`; done explicitly here via a top-level `const` since
// this uses `fs.readFileSync` instead) changes no observable behavior, just avoids
// redundant disk I/O Python's own version doesn't need to pay either (it's a Python
// quirk, not a deliberate design choice worth preserving faithfully).
//
// *** Two real, disclosed, pre-existing primitive-layer gaps surfaced while porting
// `migrate()`'s `element.id() === 0` branch (a source value that is itself a bare,
// not-yet-in-any-file simple/defined-type wrapper -- e.g. an `IfcLabel`/
// `IfcCountMeasure` read off a SELECT- or measure-typed attribute like
// `IfcPropertySingleValue.NominalValue`) -- both investigated and confirmed against
// the real, built addon, not assumed: ***
//
// 1. **Blocking**: creating such a loose value entity *with an initial value* in the
//    target file -- Python's `new_file.create_entity(ifc_class, element.wrappedValue)`
//    -- is NOT possible with this port's existing `IfcFile.createEntity`/
//    `EntityInstance.setByIndex`. Empirically confirmed: `EntityInstance.getByIndex`
//    (reading) works fine on a bare simple-type instance regardless of how it was
//    constructed (`get_attribute_value_variant`, the shim function backing it, calls
//    `express::base::get_attribute_value` directly with no entity-only gate) -- this
//    is what makes `util/unit.ts`'s own finding true (reading a *nested*, already-
//    populated simple-type attribute value off a real parsed instance works). But
//    *writing* an initial value into a **freshly created, not-yet-populated** loose
//    simple-type instance goes through `EntityInstance.setByIndex`, which calls the
//    native `attribute_kind_of` primitive to disambiguate ambiguous JS value kinds
//    (`boolean` -> BOOL vs. LOGICAL, `number` -> INTEGER vs. DOUBLE, `string` ->
//    STRING vs. ENUMERATION vs. BINARY) -- and that primitive's shim implementation
//    (`attribute_value_shim.cpp`'s `attribute_declaration_at` -> `entity_declaration_of`)
//    unconditionally throws "Attribute access is only supported on entity instances"
//    for a non-entity (simple/defined-type) instance, entity or not, populated or not.
//    This is a genuine, pre-existing (not introduced by this chunk) gap in
//    `entityInstance.ts`'s foundational `setByIndex`/`createEntity` machinery (Phase
//    2, well before this chunk) -- fixing it (e.g. teaching `setByIndex` to skip the
//    `attribute_kind_of` lookup, and infer the variant kind a different way, for a
//    non-entity target) is a cross-cutting change to foundational, already-shipped
//    code well outside this chunk's own scope, and per this chunk's own instructions
//    ("do NOT silently add a new native primitive without flagging it for the
//    orchestrating session's review") is NOT attempted here. `migrate()`'s
//    `id() === 0` branch is still ported faithfully below (so it will work correctly
//    the moment this gap is closed, with zero further changes here) -- it currently
//    throws that same, pre-existing, already-disclosed `entityInstance.ts` error
//    whenever actually exercised. Flagged in `TODOS.md`. See
//    `test/util/migrator.test.ts`'s own dedicated test asserting exactly this current,
//    disclosed, blocked behavior (not silently skipped).
//
// 2. **Non-blocking, representational**: Python's `isinstance(value, float)` checks
//    (`migrate`'s `IfcCountMeasure` -> `IfcNumericMeasure` retyping on int-vs-float
//    `wrappedValue`, and the structurally identical `migrate_class`'s
//    `IfcQuantityCount` -> `IfcQuantityNumber` retyping on `element[3]`) distinguish
//    an EXPRESS `INTEGER`-looking literal (`232`) from a `REAL`-looking one (`232.`)
//    at the Python object-type level. JS has one `number` type for both -- and
//    critically, `232` and `232.` parse to the *exact same* IEEE-754 value with zero
//    fractional part, so even a `Number.isInteger()` runtime check (the closest
//    available JS approximation, used below) cannot distinguish them for a
//    whole-number `REAL` literal specifically (it can only detect a *fractional*
//    value as definitely non-integer). This is a narrower, values-can-coincide
//    limitation, not a hard blocker like gap 1 above -- ported as the best-effort
//    `Number.isInteger(...) === false` check, disclosed here rather than silently
//    presented as exact.
//
// Mutation-routing (this project's established rule, `util/element.ts`'s own
// precedent): every file mutation below routes through the *existing*
// `IfcFile.createEntity`/`.remove` and `EntityInstance.setByIndex`/`.set` (which
// already record `Transaction` operations for undo/redo) -- no new transaction-
// recording logic here. Verified with a real undo/redo regression test (not just
// assumed), see `test/util/migrator.test.ts`.
//
// `assignHeaderFrom` (Python's `preprocess`'s first line, `new_file.assign_header_
// from(old_file)`): `file.ts`'s own header comment already disclosed that neither
// `header`/`mvd`/`assignHeaderFrom` were ported in the Phase 2 foundation chunk
// (`spf_header` has no `file_description()`/`file_name()`/`file_schema()` sub-entity
// accessors bound at all -- confirmed again here by re-reading the generated
// `ifcopenshell_native.ts` facade's `spf_header` class, which exposes only
// `create`/`owner_file`/`assign`). This chunk uses the one primitive that *is*
// bound -- `spf_header.assign(other)` (native `ifcopenshell::spf_header::assign`,
// `src/ifcparse/spf_header.cpp`) -- rather than skip the call entirely, but discloses
// a real, verified-by-reading-the-C++-source divergence from Python's own per-field
// `assign_header_from`: the native `assign()` copies only *scalar* header attribute
// values and explicitly skips every aggregate (`vector<express::base>`/list-typed)
// one, whereas Python's version copies list-typed fields too (`file_description
// .Description`, `file_name.Author`/`.Organization`, and `file_schema
// .SchemaIdentifiers` -- that last one being file_schema's *only* attribute, so the
// native `assign()` copies none of it). Scalar fields (`file_description
// .ImplementationLevel`, `file_name.Name`/`.TimeStamp`/`.PreprocessorVersion`/
// `.OriginatingSystem`/`.AuthorisationName`) DO copy correctly. A real, disclosed,
// non-fatal divergence -- not a silent no-op, and strictly more faithful than
// skipping the call outright.

import * as fs from "node:fs";
import * as path from "node:path";
import { AttributeCategory, EntityInstance } from "../entityInstance";
import type { IfcFile } from "../file";
import type {
	attribute as NativeAttribute,
	declaration as NativeDeclaration,
	entity as NativeEntity,
} from "../native/ifcopenshell_native";
import { findPackageRoot } from "../native/native_loader";
import { isA, isEnumMember } from "./schema";

// --- JSON migration-rule data (see this file's header comment) ---

type ClassEquivalenceMap = Readonly<Record<string, string>>;
type AttributeEquivalenceMap = Readonly<Record<string, Readonly<Record<string, string>>>>;

function loadMigrationData<T>(filename: string): T {
	const dataDir = path.join(findPackageRoot(__dirname), "data", "schema-migration");
	const text = fs.readFileSync(path.join(dataDir, filename), "utf-8");
	return JSON.parse(text) as T;
}

const CLASS_4_TO_2X3: ClassEquivalenceMap = loadMigrationData("class_4_to_2x3.json");
const CLASS_2X3_TO_4: ClassEquivalenceMap = loadMigrationData("class_2x3_to_4.json");
const ATTRIBUTE_4_TO_2X3: AttributeEquivalenceMap = loadMigrationData("attribute_4_to_2x3.json");
const ATTRIBUTE_4X3_TO_4: AttributeEquivalenceMap = loadMigrationData("attribute_4x3_to_4.json");

// --- `_enum_value_outside_target` ---

/**
 * Python: `_enum_value_outside_target(attribute, value) -> bool`. See this file's
 * header comment for why this reuses `schema.ts`'s `isEnumMember` (a real, working
 * `lookup_enum_offset` membership check) instead of `util/attribute.ts`'s
 * `getEnumItems` (a real, disclosed, always-throwing gap for this exact use).
 */
function enumValueOutsideTarget(attribute: NativeAttribute, value: unknown): boolean {
	if (typeof value !== "string") return false;
	const namedType = attribute.type_of_attribute().as_named_type();
	if (namedType === null) return false;
	const enumeration = namedType.declared_type().as_enumeration_type();
	if (enumeration === null) return false;
	return !isEnumMember(attribute, value);
}

// --- small internal helpers ---

/**
 * Python: `hasattr(element, name)`. `EntityInstance` has no boolean "does this name
 * resolve" query of its own; this consults the same attribute-metadata cache
 * `EntityInstance`'s own attribute `Proxy` is built on (`_resolveTypeInfo().cache
 * .byName`, loosened from `private` for exactly this kind of reuse, see
 * `schema.ts`'s own `attributeNameAt` for the established precedent of an
 * `util/schema.ts`-family helper reaching into it directly). Answers both FORWARD and
 * INVERSE names (both populated in `byName`, `attributeCache.ts`'s own doc comment) --
 * matching Python's uniform `hasattr` dispatch across both categories. A DERIVED name
 * (the EXPRESS `calc_<Type>_<name>` rule-execution fallback) is, project-wide, out of
 * scope (`entityInstance.ts`'s own header comment) -- `byName` never contains one
 * (`attributeCache.ts`'s own disclosed derived-slot exclusion), so this correctly
 * reports `false` for it too, matching `.get()`'s own "has no attribute" behavior for
 * the same name, not a new divergence introduced here.
 */
function hasAttributeName(instance: EntityInstance, name: string): boolean {
	return instance._resolveTypeInfo().cache.byName.has(name);
}

/**
 * `spf_header.assign(other)` (see this file's header comment for the real, disclosed
 * scalar-only-copy divergence from Python's own per-field `assign_header_from`).
 * Silently no-ops if either file's header is unavailable (mirrors Python's own
 * per-field `try/except: pass "Header is invalid"` -- a missing header is treated the
 * same as an unassignable field, not a hard error).
 */
function assignHeaderFrom(newFile: IfcFile, oldFile: IfcFile): void {
	const newHeader = newFile.nativeFile.header();
	const oldHeader = oldFile.nativeFile.header();
	if ((newHeader as unknown) === null || (oldHeader as unknown) === null) return;
	newHeader.assign(oldHeader);
}

// --- default value/entity tables (Python: `self.default_values`/`self.default_entities`) ---

const DEFAULT_VALUES: Readonly<Record<string, unknown>> = {
	ChangeAction: "NOCHANGE",
	CompositionType: "ELEMENT",
	CrossSectionArea: 1,
	DataValue: 0,
	DefinedValues: [0],
	DefiningValues: [0],
	DestabilizingLoad: false,
	Edition: "",
	EndParam: 1.0,
	EnumerationValues: [0],
	GeodeticDatum: "",
	Intent: "",
	IsHeading: false,
	ListValues: [0],
	LongitudinalBarCrossSectionArea: 1,
	LongitudinalBarNominalDiameter: 1,
	LongitudinalBarSpacing: 1,
	Name: "",
	NominalDiameter: 1,
	PredefinedType: "NOTDEFINED",
	RowCells: [0],
	SequenceType: "NOTDEFINED",
	Source: "",
	StartParam: 0.0,
	TransverseBarCrossSectionArea: 1,
	TransverseBarNominalDiameter: 1,
	TransverseBarSpacing: 1,
	// Manual additions from experience (Python's own comment, preserved verbatim).
	InteriorOrExteriorSpace: "NOTDEFINED",
	AssemblyPlace: "NOTDEFINED", // See bug https://github.com/Autodesk/revit-ifc/issues/395
};

const DEFAULT_ENTITY_NAMES = [
	"CurrentValue",
	"DepreciatedValue",
	"Jurisdiction",
	"OriginalValue",
	"Owner",
	"OwnerHistory",
	"Position",
	"PropertyReference",
	"RepresentationContexts",
	"ResponsiblePerson",
	"ResponsiblePersons",
	"Rows",
	"TotalReplacementCost",
	"UnitsInContext",
	"User",
] as const;

/** Sentinel for Python's `value = ...` (Ellipsis, "no branch matched at all yet"). */
const UNRESOLVED: unique symbol = Symbol("migrator-attribute-unresolved");

export interface MigratorOptions {
	/**
	 * Python: `fallback_element_to_proxy: bool = False`. When `true` and the target
	 * schema is IFC2X3, IFC4 entity classes with no direct IFC2X3 equivalent but that
	 * inherit from `IfcElement`/`IfcElementType` migrate as
	 * `IfcBuildingElementProxy`/`IfcBuildingElementProxyType` instead of throwing.
	 * Defaults to `false` so non-recipe callers keep the strict failure-on-unmappable
	 * contract.
	 */
	readonly fallbackElementToProxy?: boolean;
}

/**
 * Python: `class Migrator`. See this file's header comment for scope, the JSON-data-
 * bundling precedent this chunk establishes, and the two disclosed primitive-layer
 * findings surfaced while porting `migrate()`'s `id() === 0` branch.
 */
export class Migrator {
	readonly fallbackElementToProxy: boolean;

	/** Python: `self.migrated_ids: dict[int, int]` -- source STEP id -> target STEP id. */
	private readonly migratedIds = new Map<number, number>();

	/**
	 * Python: `self.attribute_overrides: dict[int, dict[int, str]]` -- source element
	 * id -> {target attribute index -> literal override value}, populated by
	 * `preprocess`'s `IfcCalendarDate` handling.
	 */
	private readonly attributeOverrides = new Map<number, Map<number, unknown>>();

	/** Python: `self.default_entities` -- per-instance (not shared module state,
	 * matching Python's own per-`__init__` dict): `OwnerHistory` is lazily created
	 * once per `Migrator` instance and cached here, exactly mirroring Python's own
	 * `self.default_entities[attribute.name()] = ...` mutation in
	 * `generate_default_value`. */
	private readonly defaultEntities: Record<string, unknown> = Object.fromEntries(
		DEFAULT_ENTITY_NAMES.map((name) => [name, null]),
	);

	constructor(options: MigratorOptions = {}) {
		this.fallbackElementToProxy = options.fallbackElementToProxy ?? false;
	}

	/**
	 * Python: `preprocess(old_file, new_file) -> None`. Handles two schema-specific
	 * deprecations that need special pre-migration surgery on `old_file` (not
	 * expressible as a per-class/per-attribute JSON mapping): `IfcCalendarDate`
	 * (deprecated in IFC4, replaced with a literal date string on its referencing
	 * attribute) and `IfcPresentationStyleAssignment` (deprecated in IFC4X3, folded
	 * directly into `IfcStyledItem.Styles`). Mutates `old_file` (`old_file.remove`,
	 * an existing, transaction-recording `IfcFile` method) and this `Migrator`'s own
	 * `attributeOverrides` map (consulted later by `migrateAttributes`) -- calling
	 * this before any `migrate()` calls is the caller's own responsibility, matching
	 * Python (this class never calls its own `preprocess` internally).
	 */
	preprocess(oldFile: IfcFile, newFile: IfcFile): void {
		assignHeaderFrom(newFile, oldFile);

		// Python: `to_delete = set()` (an `entity_instance`-keyed set) -- keyed by
		// `.identity()` here, matching `schema.ts`'s own `BatchReassignClass`
		// precedent for the identical "Python dict/set keys by instance identity, our
		// fresh-wrapper-per-access primitive layer can't" problem
		// (research/07-fresh-wrapper-per-access.md).
		const toDelete = new Map<number, EntityInstance>();

		if (oldFile.schema === "IFC2X3" && newFile.schema === "IFC4") {
			// IfcCalendarDate is deprecated in IFC4.
			for (const element of oldFile.byType("IfcCalendarDate")) {
				const pairs = oldFile.getInverse(element, true, true) as Array<[EntityInstance, number]>;
				for (const [inverse, attributeIndex] of pairs) {
					let overrides = this.attributeOverrides.get(inverse.id());
					if (!overrides) {
						overrides = new Map();
						this.attributeOverrides.set(inverse.id(), overrides);
					}
					// DayComponent(0)-MonthComponent(1)-YearComponent(2) on
					// IfcCalendarDate, formatted YYYY-MM-DD (Python's own
					// `f"{element[2]}-{element[1]}-{element[0]}"`, verified against the
					// real IFC2X3 schema attribute order, not assumed).
					overrides.set(attributeIndex, `${element.getByIndex(2)}-${element.getByIndex(1)}-${element.getByIndex(0)}`);
				}
				toDelete.set(element.identity(), element);
			}
		}

		if (oldFile.schema === "IFC4" && newFile.schema === "IFC4X3") {
			// IfcPresentationStyleAssignment is deprecated in IFC4X3.
			for (const assignment of oldFile.byType("IfcPresentationStyleAssignment")) {
				const inverses = oldFile.getInverse(assignment) as Set<EntityInstance>;
				for (const styledItem of inverses) {
					if (!styledItem.isA("IfcStyledItem")) continue;
					// `Styles` is mandatory (non-optional) on both `IfcStyledItem` and
					// `IfcPresentationStyleAssignment` -- deliberately NOT defaulted to
					// `[]` on a `null` read (an earlier version of this line did,
					// caught by `/code-review`): Python's `for s in styled_item.Styles`/
					// `list(assignment.Styles)` raises for a non-conformant file where
					// one is unexpectedly unset, and silently substituting `[]` instead
					// would produce a silently-incomplete migrated file rather than
					// surfacing the malformed input loudly, same as Python does.
					const currentStyles = styledItem.get("Styles") as EntityInstance[];
					const assignmentStyles = assignment.get("Styles") as EntityInstance[];
					const keep = currentStyles.filter((s) => s.isA("IfcPresentationStyle"));
					styledItem.set("Styles", [...keep, ...assignmentStyles]);
				}
				toDelete.set(assignment.identity(), assignment);
			}
		}

		for (const element of toDelete.values()) {
			oldFile.remove(element);
		}
	}

	/**
	 * Python: `migrate(element, new_file) -> entity_instance`. See this file's header
	 * comment (finding 1) for the real, disclosed, pre-existing primitive-layer gap
	 * blocking the `element.id() === 0` branch's value-creation step, and (finding 2)
	 * for the int-vs-float representational limitation in the `IfcCountMeasure`
	 * check just above it.
	 */
	migrate(element: EntityInstance, newFile: IfcFile): EntityInstance {
		if (element.id() === 0) {
			let ifcClass = element.isA();
			if (ifcClass === "IfcCountMeasure" && newFile.schema === "IFC4X3") {
				const value = element.getByIndex(0);
				if (typeof value === "number" && !Number.isInteger(value)) {
					ifcClass = "IfcNumericMeasure";
				}
			}
			// See this file's header comment, finding 1: this `createEntity` call
			// throws the pre-existing, disclosed `entityInstance.ts` "Attribute access
			// is only supported on entity instances" error whenever `element`'s
			// wrapped value is non-null -- ported faithfully (not stubbed) so it will
			// work correctly the moment that gap is closed elsewhere.
			return newFile.createEntity(ifcClass, element.getByIndex(0));
		}

		const existingId = this.migratedIds.get(element.id());
		if (existingId !== undefined) {
			try {
				return newFile.byId(existingId);
			} catch {
				// Python's bare `except: pass` -- the previously-migrated target
				// instance no longer exists in `newFile` (e.g. removed since); fall
				// through and re-migrate.
			}
		}

		const newElement = this.migrateClass(element, newFile);
		const newElementSchema = newElement.declaration().as_entity();
		if (newElementSchema === null) {
			// Python: `if not hasattr(new_element_schema, "all_attributes"): return
			// element`. The element has no (forward) attributes to migrate.
			return element;
		}
		const migrated = this.migrateAttributes(element, newFile, newElement, newElementSchema);
		this.migratedIds.set(element.id(), migrated.id());
		return migrated;
	}

	/**
	 * Python: `_is_subclass_of(ifc_class, ancestor, source_file) -> bool`
	 * (`@staticmethod`). Reuses `schema.ts`'s `isA` (this exact "declaration is-a a
	 * named ancestor" question is already solved there) rather than re-deriving it.
	 *
	 * Python wraps both the lookup *and* the `is_a` call in one `try`, catching only
	 * `RuntimeError` (the SWIG-wrapped C++ exception for "class not found") -- this
	 * primitive layer has no typed exception to discriminate the same way on (every
	 * native failure surfaces as a plain `Error`, confirmed against this exact
	 * `declaration_by_name_with_name` call's own established bare-catch precedent in
	 * `schema.ts`'s `reassignClass`, `/code-review`-reviewed and accepted there
	 * already). Narrowed here to wrap *only* the lookup (the one call this method
	 * actually intends to tolerate failing) rather than `isA` too -- a genuine `isA`
	 * failure on an already-successfully-resolved declaration is unexpected and
	 * should propagate, not be silently swallowed as "not a subclass" the way an
	 * earlier version of this method (wrapping both calls) would have.
	 */
	private static isSubclassOf(ifcClass: string, ancestor: string, sourceFile: IfcFile): boolean {
		let declaration: NativeDeclaration;
		try {
			declaration = sourceFile.nativeFile.schema().declaration_by_name_with_name(ifcClass);
		} catch {
			// Class doesn't exist in the source schema -- treat as "not a subclass",
			// matching Python's own `except RuntimeError: return False`.
			return false;
		}
		return isA(declaration, ancestor);
	}

	/**
	 * Python: `migrate_class(element, new_file) -> entity_instance`. See this file's
	 * header comment, finding 2, for the `IfcQuantityCount` int-vs-float check's
	 * representational limitation.
	 */
	private migrateClass(element: EntityInstance, newFile: IfcFile): EntityInstance {
		let ifcClass = element.isA();
		if (ifcClass === "IfcQuantityCount" && newFile.schema === "IFC4X3") {
			// IfcPhysicalSimpleQuantity's subtype-specific "Value" attribute is at
			// forward index 3 on IfcQuantityCount (verified against the real IFC4
			// schema, not assumed -- Python's own literal `element[3]`).
			const value = element.getByIndex(3);
			if (typeof value === "number" && !Number.isInteger(value)) {
				ifcClass = "IfcQuantityNumber";
			}
		}

		try {
			return newFile.createEntity(ifcClass);
		} catch {
			// Falls through to the equivalence-table lookup below, matching Python's
			// own `except: pass`.
		}

		// The lookup tables use an empty string as a sentinel meaning "no direct
		// equivalent, needs geometric translation" (e.g. polygonal face set -> faceted
		// brep) -- callers that want a clean downgrade are expected to preprocess such
		// carriers before calling the Migrator (Python's own comment, preserved).
		let equivalent: string | undefined;
		if (newFile.schema === "IFC2X3") {
			equivalent = CLASS_4_TO_2X3[ifcClass];
		} else if (newFile.schema === "IFC4") {
			equivalent = CLASS_2X3_TO_4[ifcClass];
		} else {
			equivalent = undefined;
		}

		// IfcBuildingElementProxy fallback is opt-in (see constructor) -- only the
		// IfcElement/IfcElementType subtrees have a meaningful generic IFC2X3
		// stand-in; non-element IFC4-only classes (rels, geometry items, materials,
		// times) still throw below.
		if (!equivalent && newFile.schema === "IFC2X3" && this.fallbackElementToProxy) {
			if (element.file && Migrator.isSubclassOf(ifcClass, "IfcElement", element.file)) {
				equivalent = "IfcBuildingElementProxy";
			} else if (element.file && Migrator.isSubclassOf(ifcClass, "IfcElementType", element.file)) {
				equivalent = "IfcBuildingElementProxyType";
			}
		}

		if (!equivalent) {
			const inverses = element.file ? Array.from(element.file.getInverse(element) as Set<EntityInstance>) : [];
			let inverseHint = inverses
				.slice(0, 3)
				.map((i) => `#${i.id()}=${i.isA()}`)
				.join(", ");
			if (inverses.length > 3) {
				inverseHint += `, … (+${inverses.length - 3} more)`;
			}
			throw new Error(
				`Cannot migrate #${element.id()}=${ifcClass} to schema ${newFile.schema}: no direct equivalent ` +
					`exists. Referenced by: ${inverseHint || "(no inverses)"}.`,
			);
		}
		return newFile.createEntity(equivalent);
	}

	/** Python: `migrate_attributes(element, new_file, new_element, new_element_schema)
	 * -> entity_instance`. See this file's header comment for why the DERIVED-slot
	 * skip (Python's `new_element_schema.derived()[i]`) is worked around via the
	 * attribute-metadata cache instead of a `derived()` binding (none exists, see
	 * `attributeCache.ts`'s own disclosed gap). */
	private migrateAttributes(
		element: EntityInstance,
		newFile: IfcFile,
		newElement: EntityInstance,
		newElementSchema: NativeEntity,
	): EntityInstance {
		const overrides = this.attributeOverrides.get(element.id());
		if (overrides) {
			for (const [attributeIndex, value] of overrides) {
				newElement.setByIndex(attributeIndex, value);
			}
		}

		const byName = newElement._resolveTypeInfo().cache.byName;
		for (const attribute of newElementSchema.all_attributes()) {
			const meta = byName.get(attribute.name());
			if (meta === undefined || meta.category !== AttributeCategory.FORWARD) {
				// DERIVED (excluded from the cache entirely -- `attributeCache.ts`'s
				// own disclosed gap workaround) -- skip, matching Python's `if
				// new_element_schema.derived()[i]: continue`.
				continue;
			}
			this.migrateAttribute(attribute, element, newFile, newElement, newElementSchema);
		}
		return newElement;
	}

	/** Python: `find_equivalent_attribute(new_element, attribute, element,
	 * attributes_mapping, reverse_mapping=False) -> Union[Any, None]`. Returns `null`
	 * for a successfully-mapped-but-`hasattr`-false lookup (Python's own bare
	 * `return`/`None`), or throws for a failed lookup (Python's own raised
	 * exception) -- the two distinct outcomes `migrateAttribute` below branches on. */
	private findEquivalentAttribute(
		newElement: EntityInstance,
		attribute: NativeAttribute,
		element: EntityInstance,
		attributesMapping: AttributeEquivalenceMap,
		reverseMapping = false,
	): unknown {
		const ifcClass = newElement.isA();
		const attrName = attribute.name();
		try {
			const equivalentMap = attributesMapping[ifcClass];
			if (!equivalentMap) {
				throw new Error(`No attribute-equivalence mapping for class '${ifcClass}'`);
			}
			let equivalent: string;
			if (reverseMapping) {
				const found = Object.entries(equivalentMap).find(([, value]) => value === attrName);
				if (!found) {
					throw new Error(`No reverse attribute-equivalence mapping for '${attrName}' on '${ifcClass}'`);
				}
				equivalent = found[0];
			} else {
				if (!(attrName in equivalentMap)) {
					throw new Error(`No attribute-equivalence mapping for '${attrName}' on '${ifcClass}'`);
				}
				equivalent = equivalentMap[attrName];
			}
			if (hasAttributeName(element, equivalent)) {
				return element.get(equivalent);
			}
			return null;
		} catch (e) {
			if (
				ifcClass === "IfcQuantityNumber" &&
				attrName === "NumberValue" &&
				newElement.file?.schema === "IFC4X3" &&
				element.isA("IfcQuantityCount")
			) {
				// IfcPhysicalSimpleQuantity's subtype-specific "Value" attribute is at
				// forward index 3 (Python's own literal `element[3]`, see
				// `migrateClass`'s own comment for the same index).
				return element.getByIndex(3);
			}
			console.log(
				`Unable to find equivalent attribute of ${attrName} to migrate from ` +
					`${element.isA()}#${element.id()} to ${newElement.isA()}#${newElement.id()}`,
			);
			throw e;
		}
	}

	/** Python: `migrate_attribute(attribute, element, new_file, new_element,
	 * new_element_schema) -> None`. `attribute` is an attribute on `new_element`'s
	 * schema, not `element`'s. */
	private migrateAttribute(
		attribute: NativeAttribute,
		element: EntityInstance,
		newFile: IfcFile,
		newElement: EntityInstance,
		_newElementSchema: NativeEntity,
	): void {
		const oldFile = element.file;
		const oldSchema = oldFile?.schema;
		const newSchema = newFile.schema;
		const attrName = attribute.name();
		let value: unknown = UNRESOLVED;

		if (hasAttributeName(element, attrName)) {
			value = element.get(attrName);
		} else if (newSchema === "IFC2X3" && oldSchema === "IFC4") {
			// IFC4 to IFC2X3: we know the IFC2X3 attribute name, but not its IFC4
			// equivalent.
			try {
				value = this.findEquivalentAttribute(newElement, attribute, element, ATTRIBUTE_4_TO_2X3, true);
			} catch {
				return; // We tried our best (Python's own comment).
			}
		} else if (newSchema === "IFC4" && oldSchema === "IFC2X3") {
			// IFC2X3 to IFC4: we know the IFC4 attribute name, but not its IFC2X3
			// equivalent.
			try {
				value = this.findEquivalentAttribute(newElement, attribute, element, ATTRIBUTE_4_TO_2X3, false);
			} catch {
				return;
			}
		} else if (newSchema === "IFC4X3" && oldSchema === "IFC4") {
			try {
				value = this.findEquivalentAttribute(newElement, attribute, element, ATTRIBUTE_4X3_TO_4, false);
			} catch {
				return;
			}
		} else if (newSchema === "IFC4" && oldSchema === "IFC4X3") {
			try {
				value = this.findEquivalentAttribute(newElement, attribute, element, ATTRIBUTE_4X3_TO_4, true);
			} catch {
				return;
			}
		}

		if (value === UNRESOLVED) {
			console.log(
				`Couldn't match attribute ${attrName} by name to migrate from ${element.isA()}#${element.id()} ` +
					`to ${newElement.isA()} and there is no special mapping to handle migration from ` +
					`${oldSchema} -> ${newSchema}`,
			);
			return;
		}

		if (value === null && !attribute.optional()) {
			value = this.generateDefaultValue(attribute, newFile);
			if (value === null) {
				console.log(`Failed to generate default value for ${attrName} on ${element.isA()}#${element.id()}`);
			}
		} else if (value instanceof EntityInstance) {
			value = this.migrate(value, newFile);
		} else if (Array.isArray(value)) {
			if (value.length > 0 && value[0] instanceof EntityInstance) {
				value = (value as EntityInstance[]).map((item) => this.migrate(item, newFile));
			}
		}

		if (value !== null) {
			if (enumValueOutsideTarget(attribute, value)) {
				// Enum value present in source schema but missing in target
				// (typically a downgrade after a cross-class fallback, e.g.
				// IfcLamp.PredefinedType=COMPACTFLUORESCENT copied onto
				// IfcBuildingElementProxy.CompositionType whose enum is
				// IfcElementCompositionEnum). Leave the attribute unset rather than
				// abort the whole entity's migration.
				return;
			}
			newElement.set(attrName, value);
		}
	}

	/** Python: `generate_default_value(attribute, new_file) -> Any`. */
	private generateDefaultValue(attribute: NativeAttribute, newFile: IfcFile): unknown {
		const name = attribute.name();
		if (name in DEFAULT_VALUES) {
			return DEFAULT_VALUES[name];
		}
		if (name === "Position") {
			// IFC4 relaxed Position to OPTIONAL for many profile defs; IFC2X3 still
			// requires it. Synthesize a unit placement at origin so
			// IfcIShapeProfileDef and friends downgrade without crashing downstream
			// validators (Python's own comment).
			let typeName: string | null = null;
			try {
				typeName = attribute.type_of_attribute().as_named_type().declared_type().name();
			} catch {
				typeName = null;
			}
			if (typeName === "IfcAxis2Placement2D") {
				return newFile.createEntity("IfcAxis2Placement2D", newFile.createEntity("IfcCartesianPoint", [0.0, 0.0]));
			}
			if (typeName === "IfcAxis2Placement3D") {
				return newFile.createEntity("IfcAxis2Placement3D", newFile.createEntity("IfcCartesianPoint", [0.0, 0.0, 0.0]));
			}
		} else if (name === "OwnerHistory") {
			this.defaultEntities.OwnerHistory = newFile.createEntity(
				"IfcOwnerHistory",
				newFile.createEntity(
					"IfcPersonAndOrganization",
					newFile.createEntity("IfcPerson"),
					newFile.createEntity("IfcOrganization", null, "IfcOpenShell Migrator"),
				),
				newFile.createEntity(
					"IfcApplication",
					newFile.createEntity("IfcOrganization", null, "IfcOpenShell Migrator"),
					"Works for me",
					"IfcOpenShell Migrator",
					"IfcOpenShell Migrator",
				),
				null,
				"NOCHANGE",
				null,
				null,
				null,
				Math.floor(Date.now() / 1000),
			);
		}
		return this.defaultEntities[name] ?? null;
	}
}
