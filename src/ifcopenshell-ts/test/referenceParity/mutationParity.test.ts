// This file was generated with the assistance of an AI coding tool.
//
// Chunk 3, part B's own verification test suite
// (planning/ifcopenshell-ts/80-reference-parity-testing-plan.md, chunk 3 "Mutation
// differential battery"): replays the `wall-lifecycle` scenario -- specified in full,
// unambiguous detail by `tools/reference_mutation_python.py`'s own docstring (chunk 3
// part A, already merged) -- via this port's own `api.*` functions, for each of the 3
// schemas, dumps the resulting in-memory file via the existing `dump.ts`'s `dumpFile`,
// and diffs it against the already-checked-in golden
// (`test/fixtures/mutations/<schema-dir>/wall-lifecycle.golden.json`, generated once,
// offline, by the orchestrating session's real `ifcopenshell-python` install) via the
// existing `diff.ts`'s `diffFileDumps`. Cheap and Python-free by construction, same as
// chunks 1/2 -- safe for normal `npm test`/PR CI.
//
// --- The exact operation sequence, mirrored 1:1 against `reference_mutation_python.py`'s
// own `scenario_wall_lifecycle` docstring (read that file, not this comment, for the
// authoritative spec) ---
//
// 1. `api.root.createEntity`: IfcProject "Test Project" / IfcSite "Test Site" /
//    IfcBuilding "Test Building" / IfcBuildingStorey "Ground Floor", each GlobalId
//    overwritten with the fixed GUID_* constant below (copied verbatim from the Python
//    script -- these are the literal cross-language contract, not regenerated).
// 2. `api.aggregate.assignObject` x3 (site under project, building under site, storey
//    under building), each returned rel's GlobalId overwritten.
// 3. `api.root.createEntity`: IfcWall "Test Wall", GlobalId overwritten.
// 4. `api.spatial.assignContainer`: wall -> storey, GlobalId overwritten.
// 5. `api.material.addMaterial`: name="Concrete" (no `category` -- IFC2X3 doesn't have
//    one; `addMaterial.ts`'s own settings object simply omits the key, no explicit
//    `null`/`undefined` needed).
// 6. `api.material.assignMaterial`: products=[wall], type="IfcMaterial", material,
//    GlobalId overwritten.
// 7. `api.pset.addPset`: product=wall, name="Pset_WallCommon", GlobalId overwritten.
//    `addPset.ts` delegates the actual `IfcRelDefinesByProperties` creation to
//    `assignPset.ts` internally and returns only the pset -- so, matching the Python
//    script's own `f.by_type("IfcRelDefinesByProperties")[-1]` approach exactly (this is
//    the FIRST such rel ever created in a fresh scenario file, so there is no ordering
//    ambiguity), the newly-created rel is fetched via `file.byType(...)` and its
//    GlobalId overwritten too.
// 8. `api.pset.editPset`: properties={IsExternal: true, FireRating: "2HR", Status: "NEW"}.
// 9. `api.pset.editPset`: properties={FireRating: "1HR", Status: null}.
//
// --- Real, disclosed API-shape divergence: steps 8/9 use pre-built typed values, not
// raw JS scalars ---
//
// Real Python passes plain scalars (`True`/`"2HR"`/`"NEW"`) directly. This port's
// `editPset.ts` has a real, pre-existing, already-disclosed primitive-layer gap (see
// that file's own header comment, and `api/unit/addConversionBasedUnit.ts`'s
// independently-confirmed identical situation): `file.createEntity`/
// `EntityInstance.setByIndex` cannot materialize a NEW simple/defined-type value (e.g.
// `IfcLabel("2HR")`) from a raw JS scalar at all right now -- the native
// `attribute_kind_of` primitive unconditionally throws "Attribute access is only
// supported on entity instances" for a non-entity target, whether populated via
// positional `createEntity` args or a separate `setByIndex` call afterward. Passing a
// plain scalar to `editPset` for a NEW property (exactly what steps 8/9 need for
// `IsExternal`/`FireRating`/`Status`) hits this gap and throws.
//
// This is NOT a signature/semantics gap in `editPset` itself -- `editPset.ts`'s own
// header comment documents a fully-functional, equally-valid alternative already
// established by this project's own test suite (`test/api/pset/editPset.test.ts`,
// `test/api/pset/editQto.test.ts`, `test/util/unit.test.ts` all use the identical
// technique): construct the value as an ALREADY-BUILT `entity_instance` first (via the
// lower-level native `create_with_declaration_instance_id`/`set_attribute_value`
// primitives, bypassing the `attribute_kind_of` gate entirely -- confirmed to have no
// such restriction), then hand that pre-built value to `editPset`, which has a real,
// fully-working `value instanceof EntityInstance` branch for exactly this shape
// (`addNewProperties`'s/`updateExistingPropSingleValue`'s own `!value.isEntity()`/
// `instanceof EntityInstance` branches -- no `castValueToPrimaryMeasureType` call
// involved at all on this path, so the gap is never hit). `createTypedValue` below is
// that exact, already-established helper, copied verbatim from
// `test/api/pset/editPset.test.ts`.
//
// This produces IDENTICAL resulting IFC data to real Python's plain-scalar call,
// confirmed via the diff itself (zero mismatches, see this suite's own results): a
// `NominalValue` attribute of an `IfcPropertySingleValue` is always read back as a
// transparently-unwrapped raw scalar regardless of which underlying defined-type class
// wrapped it (`dump.ts`'s own header comment: an inline, id-0 simple-type wrapper
// unwraps to its own scalar value via `getByIndex(0)`, exactly mirroring how real
// Python's SWIG binding already transparently unwraps `IfcLabel`/`IfcBoolean`/etc. at
// attribute-access time) -- so the flat dump this suite diffs against the golden cannot
// even distinguish "wrapped in IfcLabel" from "wrapped in IfcText", let alone "wrapped
// via a scalar-cast production code path" from "wrapped via a pre-built entity_instance
// test/replay-only construction path". The wrapping class chosen below (`IfcBoolean`
// for `IsExternal`, `IfcLabel` for `FireRating`/`Status`) matches what real Python's own
// `Pset_WallCommon` buildingSMART-standard property template would resolve to anyway,
// for documentation clarity, though it is not load-bearing for the diff to pass.
//
// --- Timestamp normalization (scenario-specific, NOT a `dump.ts`/`diff.ts` engine
// change) ---
//
// Mirrors `reference_mutation_python.py`'s own `normalize_owner_history_timestamps`
// exactly: any `IfcOwnerHistory` instance's `attrs[4]` (`LastModifiedDate`) and
// `attrs[7]` (`CreationDate`) are real `Date.now()`-derived Unix timestamps
// (`createOwnerHistory.ts`'s own `Math.floor(Date.now() / 1000)`) with no override
// hook -- inherently non-deterministic across two separate process runs (the Python
// golden-generation run vs. whenever this suite actually executes) -- so both are
// overwritten to `0` post-dump, pre-diff, kept local to this file rather than added to
// the shared, generic `dump.ts`/`diff.ts` engine (per the plan doc's own guidance that
// engine stays schema-attribute-agnostic). IFC4/IFC4X3 never create an `IfcOwnerHistory`
// at all in this scenario (`OwningUser`/`OwningApplication` are optional there, and
// `useOwnerSettingsFixture`'s non-IFC2X3 branch returns `null` for a genuinely blank
// file with no pre-existing `IfcPersonAndOrganization`/`IfcApplication`) -- confirmed
// empirically against both goldens (zero `IfcOwnerHistory` instances in either), so this
// normalization is a no-op there, matching the Python golden's own confirmed-empty
// state.
//
// Result (investigated in full, not just run-and-hope, per this chunk's own task
// brief): all 3 schemas pass with ZERO mismatches once the pre-built-typed-value
// adaptation above is applied. `TODOS.md`'s already-disclosed LOGICAL-attribute native
// gap (chunk 1) was checked and confirmed NOT relevant here -- this scenario touches no
// LOGICAL-typed attribute in any of the 3 schemas' `IfcProject`/`IfcSite`/`IfcBuilding`/
// `IfcBuildingStorey`/`IfcWall`/`IfcRelAggregates`/`IfcRelContainedInSpatialStructure`/
// `IfcMaterial`/`IfcRelAssociatesMaterial`/`IfcPropertySet`/`IfcRelDefinesByProperties`/
// `IfcPropertySingleValue`/`IfcOwnerHistory`/`IfcPerson`/`IfcOrganization`/
// `IfcPersonAndOrganization`/`IfcApplication` declarations (checked directly against
// each schema's generated `.d.ts`, not assumed).

import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, test } from "vitest";
import { assignObject } from "../../src/api/aggregate/assignObject";
import { addMaterial } from "../../src/api/material/addMaterial";
import { assignMaterial } from "../../src/api/material/assignMaterial";
import { createFile } from "../../src/api/project/createFile";
import { addPset } from "../../src/api/pset/addPset";
import { editPset } from "../../src/api/pset/editPset";
import { createEntity } from "../../src/api/root/createEntity";
import { assignContainer } from "../../src/api/spatial/assignContainer";
import { EntityInstance } from "../../src/entityInstance";
import type { IfcFile } from "../../src/file";
import { entity_instance as NativeEntityInstance } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";
import { AVAILABLE_SCHEMAS, type Schema, useOwnerSettingsFixture } from "../bootstrap";
import { type DumpMismatch, diffFileDumps } from "./diff";
import { type FileDump, dumpFile } from "./dump";

const FIXTURES_ROOT = path.join(__dirname, "..", "fixtures", "mutations");

const SCHEMA_DIR_TO_SCHEMA: Record<string, Schema> = {
	ifc2x3: "IFC2X3",
	ifc4: "IFC4",
	ifc4x3: "IFC4X3",
};

// --- Fixed GUID constants -- copied VERBATIM from `tools/reference_mutation_python.py`,
// not regenerated. See that file's own header comment for why: a fresh `guid.new()`
// call on each side would never agree by chance, which would make every diff report a
// spurious 100%-of-entities mismatch on `GlobalId` alone. ---
const GUID_PROJECT = "0ebuHayv50LvfDNsHoXYWb";
const GUID_SITE = "1av_VGvIjAZu3k7RmsAT$r";
const GUID_BUILDING = "2jNHsX90XCcQku8De7qdsN";
const GUID_STOREY = "3NydKujK935xXtC5rwKay3";
const GUID_AGG_SITE = "0XdOjoksD7LuTPJLa5QYzr";
const GUID_AGG_BUILDING = "3o4e$aAWDDg82PjGUdKucY";
const GUID_AGG_STOREY = "2Esl9i4o9E$9Lx9BdTwytY";
const GUID_WALL = "0gKni1lQX3XwjFwK4TBYKf";
const GUID_CONTAINED = "2Be8YCZoD26vcUJlUNXgD8";
const GUID_ASSOC_MATERIAL = "2YAVCNB5f2mumcCEqaUBjC";
const GUID_PSET = "1W44wqaRr3vRwBSCkjDca6";
const GUID_DEFINES_PROPS = "2botKWKCL1FQXgUu2wFgsU";

/**
 * Constructs a standalone, correctly-typed defined-type value (e.g. `IfcLabel("2HR")`),
 * bypassing `editPset.ts`'s own disclosed `attribute_kind_of` primitive-layer gap for
 * materializing a NEW typed value from a raw JS scalar -- see this file's own header
 * comment. Copied verbatim from `test/api/pset/editPset.test.ts`'s identically-named,
 * already-established helper (itself matching `test/util/unit.test.ts`'s/
 * `test/api/pset/editQto.test.ts`'s own precedent for the same gap).
 */
function createTypedValue(file: IfcFile, className: string, value: number | string | boolean): EntityInstance {
	const declaration = file.nativeFile.schema().declaration_by_name_with_name(className);
	const handle = file.nativeFile.create_with_declaration_instance_id(declaration, -1);
	let variant: { kind: number; integer_value?: unknown; double_value?: unknown; string_value?: unknown };
	if (typeof value === "string") {
		variant = { kind: native.STRING, string_value: value };
	} else if (typeof value === "boolean") {
		variant = { kind: native.BOOL, integer_value: value ? 1 : 0 };
	} else {
		variant = { kind: native.DOUBLE, double_value: value };
	}
	new NativeEntityInstance(handle._handle).set_attribute_value(0, variant);
	return new EntityInstance(handle._handle, file);
}

/**
 * Replays `reference_mutation_python.py`'s own `scenario_wall_lifecycle` exactly, via
 * this port's own `api.*` functions -- see this file's own header comment for the full
 * step-by-step mirror and the one disclosed API-shape divergence (steps 8/9).
 */
function scenarioWallLifecycle(file: IfcFile): void {
	const project = createEntity(file, { ifcClass: "IfcProject", name: "Test Project" });
	project.set("GlobalId", GUID_PROJECT);
	const site = createEntity(file, { ifcClass: "IfcSite", name: "Test Site" });
	site.set("GlobalId", GUID_SITE);
	const building = createEntity(file, { ifcClass: "IfcBuilding", name: "Test Building" });
	building.set("GlobalId", GUID_BUILDING);
	const storey = createEntity(file, { ifcClass: "IfcBuildingStorey", name: "Ground Floor" });
	storey.set("GlobalId", GUID_STOREY);

	const relAggSite = assignObject(file, { products: [site], relatingObject: project }) as EntityInstance;
	relAggSite.set("GlobalId", GUID_AGG_SITE);
	const relAggBuilding = assignObject(file, { products: [building], relatingObject: site }) as EntityInstance;
	relAggBuilding.set("GlobalId", GUID_AGG_BUILDING);
	const relAggStorey = assignObject(file, { products: [storey], relatingObject: building }) as EntityInstance;
	relAggStorey.set("GlobalId", GUID_AGG_STOREY);

	const wall = createEntity(file, { ifcClass: "IfcWall", name: "Test Wall" });
	wall.set("GlobalId", GUID_WALL);
	const relContained = assignContainer(file, { products: [wall], relatingStructure: storey }) as EntityInstance;
	relContained.set("GlobalId", GUID_CONTAINED);

	const material = addMaterial(file, { name: "Concrete" });
	const relAssociates = assignMaterial(file, {
		products: [wall],
		type: "IfcMaterial",
		material,
	}) as EntityInstance;
	relAssociates.set("GlobalId", GUID_ASSOC_MATERIAL);

	const wallPset = addPset(file, { product: wall, name: "Pset_WallCommon" });
	wallPset.set("GlobalId", GUID_PSET);
	// `addPset.ts` delegates rel creation to `assignPset.ts` internally without
	// returning it -- fetch it the same way the Python script itself does
	// (`f.by_type("IfcRelDefinesByProperties")[-1]`), unambiguous since this is the
	// first (and, at this point, only) such rel in the file.
	const definesRels = file.byType("IfcRelDefinesByProperties");
	const relDefines = definesRels[definesRels.length - 1];
	relDefines.set("GlobalId", GUID_DEFINES_PROPS);

	editPset(file, {
		pset: wallPset,
		properties: {
			IsExternal: createTypedValue(file, "IfcBoolean", true),
			FireRating: createTypedValue(file, "IfcLabel", "2HR"),
			Status: createTypedValue(file, "IfcLabel", "NEW"),
		},
	});

	editPset(file, {
		pset: wallPset,
		properties: {
			FireRating: createTypedValue(file, "IfcLabel", "1HR"),
			Status: null,
		},
	});
}

/**
 * Mirrors `reference_mutation_python.py`'s own `normalize_owner_history_timestamps`
 * exactly -- see this file's own header comment. Scenario-specific, deliberately not
 * folded into the shared `dump.ts`/`diff.ts` engine.
 */
function normalizeOwnerHistoryTimestamps(dump: FileDump): void {
	for (const entry of Object.values(dump)) {
		if (entry.type === "IfcOwnerHistory") {
			const attrs = entry.attrs as unknown[];
			attrs[4] = 0;
			attrs[7] = 0;
		}
	}
}

describe("mutation parity fixture bookkeeping", () => {
	test("all 3 wall-lifecycle goldens are present, one per schema", () => {
		for (const schemaDir of Object.keys(SCHEMA_DIR_TO_SCHEMA)) {
			const goldenPath = path.join(FIXTURES_ROOT, schemaDir, "wall-lifecycle.golden.json");
			expect(fs.existsSync(goldenPath)).toBe(true);
		}
	});
});

describe("mutation parity: wall-lifecycle scenario (TS api.* replay) vs. real ifcopenshell-python golden", () => {
	for (const [schemaDir, schema] of Object.entries(SCHEMA_DIR_TO_SCHEMA)) {
		test.skipIf(!AVAILABLE_SCHEMAS.includes(schema))(`${schemaDir}/wall-lifecycle`, () => {
			const goldenPath = path.join(FIXTURES_ROOT, schemaDir, "wall-lifecycle.golden.json");
			const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8")) as FileDump;

			// Real Python's own scenario runner starts from a genuinely bare
			// `ifcopenshell.file(schema=schema)` -- zero entities, not
			// `template.create()`'s richer starter chain. `api.project.createFile` is
			// this port's own faithful port of that exact bare-file primitive
			// (`ifcopenshell.api.project.create_file`), confirmed by its own header
			// comment to produce zero entities.
			useOwnerSettingsFixture(schema);
			const file = createFile(undefined, { version: schema });
			let mismatches: DumpMismatch[];
			try {
				scenarioWallLifecycle(file);
				const actual = dumpFile(file);
				normalizeOwnerHistoryTimestamps(actual);
				mismatches = diffFileDumps(golden, actual);
			} finally {
				file.dispose();
			}

			if (mismatches.length > 0) {
				console.log(`${schemaDir}/wall-lifecycle: ${mismatches.length} mismatch(es)`, mismatches.slice(0, 20));
			}
			expect(mismatches).toEqual([]);
		});
	}
});
