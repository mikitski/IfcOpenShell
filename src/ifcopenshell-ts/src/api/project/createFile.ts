// This file was generated with the assistance of an AI coding tool.
//
// Port of `ifcopenshell/api/project/create_file.py` (src/ifcopenshell-python, 61
// lines) -- the first of this chunk's 3 `api.project` functions. Real Python:
// constructs a bare `ifcopenshell.file(schema=version)` (a genuinely empty file, zero
// entities) then sets 5 STEP header fields (`file_name.name`/`.time_stamp`/
// `.preprocessor_version`/`.originating_system`/`.authorization`, and
// `file_description.description`).
//
// --- Reuse decision: `template.create({ blank: true, ... })`, not a from-scratch port ---
//
// This chunk's task brief called for comparing `create_file.py`'s exact header values
// against `template.ts`'s own `TEMPLATE`/`create()` (already used elsewhere in this
// project, e.g. `test/bootstrap.ts`'s `createTestFile`, as the established "get a real
// file for schema X" route -- `util/schema.ts`'s own `getSchemaDefinition` header
// comment: "the only available route is `template.create()`"). Two distinct gaps were
// found, not just header-field differences:
//
// 1. **`template.create()`'s default `TEMPLATE` is not entity-free.** It always bakes
//    in a starter `IfcProject`/`IfcUnitAssignment`/`IfcGeometricRepresentationContext`/
//    `IfcOwnerHistory`/`IfcPerson`/`IfcOrganization`/`IfcApplication` chain (`#1`-`#20`)
//    -- real `create_file()` produces a truly blank file with **zero** entities. This
//    is a real, pre-existing, already-disclosed gap (`test/bootstrap.ts`'s own
//    `stripProjectBootstrap`/`stripOwnerBootstrap` header comments, found by an earlier
//    `api.unit` chunk: "`create_file` is NOT `ifcopenshell.template.create`"), not
//    something newly discovered here.
// 2. **No live header-setter primitive exists at all** to reach real Python's
//    `file.header.file_name.name = ...` shape directly on an already-open `IfcFile`.
//    `spf_header` (`src/native/ifcopenshell_native.ts`) has `create`/`owner_file`/
//    `assign` but no `file_name()`/`file_description()`/`file_schema()` sub-entity
//    accessor at all (`TODOS.md`'s dedicated "`spf_header` has no `file_description()`
//    sub-entity accessor" entry; `util/mvdInfo.ts`'s identical finding). So even a
//    genuinely-blank native file (see below) couldn't have these 6 fields set onto it
//    afterwards through this primitive surface today.
//
// Given #2, the *only* currently-available way to produce a file with specific,
// chosen header field values at all is `template.create()`'s own technique: bake them
// into STEP text and parse it via the existing `native.file_new_with_data_data_size`
// primitive. So rather than reinventing that STEP-templating machinery from scratch in
// this file (duplicating `guid.new()`+buffer-parse plumbing `template.ts` already
// has), this chunk extends `template.create()` itself with a new, purely additive
// `blank`/`authorization`/`description` option set (see `template.ts`'s own updated
// header comment and its new `BLANK_TEMPLATE` string) -- small, safe, and backward
// compatible (every existing caller keeps its exact prior behavior; nothing here
// changes unless `blank: true` is passed). This resolves gap #1 in full (the resulting
// file genuinely has zero entities -- only a `HEADER` section and an empty `DATA`
// section) while working within gap #2's real constraint, rather than either silently
// reusing the wrong (non-blank) shape or blocking this whole chunk on new C++-side
// primitive work (`file_new_with_schema_filetype_path_logger` exists as a raw
// primitive but has no way to construct the `logger` it requires -- investigated and
// confirmed genuinely blocked, not just "unwrapped"; see `template.ts`'s own comment
// for the full investigation of that alternate route).
//
// --- Field-by-field comparison against real Python's `create_file.py` ---
//
// | Field                  | Real Python                              | This port                                   |
// |-------------------------|-------------------------------------------|----------------------------------------------|
// | `file_name.name`        | `"/dev/null"`                             | `"/dev/null"` -- exact match                  |
// | `file_name.time_stamp`  | local-tz `datetime.now().isoformat()`     | UTC, trailing `Z` stripped, no offset shown  |
// | `preprocessor_version`  | `"IfcOpenShell {ifcopenshell.version}"`   | `template.create()`'s own default `"IfcOpenShell-TS - v{version}"` |
// | `originating_system`    | same string as `preprocessor_version`     | same string as `preprocessor_version` (both reuse `{application}`, an invariant `BLANK_TEMPLATE` preserves structurally) |
// | `authorization`         | `"Nobody"`                                | `"Nobody"` -- exact match (new `BLANK_TEMPLATE` option) |
// | `file_description.description` | `("ViewDefinition[DesignTransferView]",)` (no space, hardcoded regardless of `version`) | `["ViewDefinition[DesignTransferView]"]` -- exact match, same schema-independent hardcoding |
//
// The `time_stamp`/`preprocessor_version` rows are real, but small and pre-existing
// (not introduced by this chunk): `time_stamp`'s exact format is `template.ts`'s own
// long-standing choice (real Python's own test only asserts truthiness, not an exact
// format, and this port's own `createFile.test.ts` does the same); `preprocessor_
// version`/`originating_system`'s exact string content depends on this port not
// binding a real `ifcopenshell.version`-equivalent primitive yet (`template.ts`'s own
// pre-existing disclosed deviation) -- both still contain the substring `"IfcOpenShell"`,
// which is all real Python's own `test_create_file.py::test_run` actually asserts
// (`assert "IfcOpenShell" in ifc.header.file_name.preprocessor_version`), so this is
// not a newly-introduced gap, just an inherited one, and doesn't need overriding here.
//
// --- `version` parameter type ---
//
// Real Python types this as `ifcopenshell.util.schema.IFC_SCHEMA` (`Literal["IFC2X3",
// "IFC4", "IFC4X3"]`) despite the docstring's own "if you have loaded in a custom
// schema, you may specify that schema identifier here too" note -- Python's dynamic
// typing lets a caller pass any string anyway. This port uses the exact same `IFC_SCHEMA`
// type (`util/schema.ts`) for the same reason `assign_declaration`/every other ported
// usecase reuses this project's existing types rather than inventing a parallel one --
// `templateSchemaIdentifier` below still passes an arbitrary custom string straight
// through unchanged (not narrowed to only the 3 known literals at runtime), preserving
// that same "custom schema" escape hatch structurally, just not reflected in the
// compile-time type (same trade-off Python's own type-hint-vs-dynamic-typing gap makes).
//
// --- `wrapUsecase` with no real `file` argument ---
//
// `create_file(version="IFC4")` takes no `ifcopenshell.file` argument at all -- it
// *creates* one. `hooks.ts`'s own header comment already anticipates exactly this
// usecase by name as the reason `wrapUsecase`'s `TFile` is a free type parameter, not
// hardcoded to `IfcFile`: real Python's generic `ifc_file = args[0] if args else None`
// means a typical no-positional-argument call (`ifcopenshell.api.project.create_file()`,
// this function's own docstring example) sees `ifc_file=None` in any registered
// listener. This port's call shape (`createFile(undefined, settings)`) reproduces that
// same "no real file, `undefined`/`None` in the listener slot" behavior faithfully.

import type { IfcFile } from "../../file";
import * as template from "../../template";
import type { IFC_SCHEMA } from "../../util/schema";
import { wrapUsecase } from "../hooks";

// Real, C++-core-registered schema identifiers differ from the 3 public `IFC_SCHEMA`
// literals for IFC4X3 only -- see `test/bootstrap.ts`'s own identically-shaped
// `SCHEMA_IDENTIFIERS` map (duplicated here rather than imported, matching that file's
// own precedent of `util/schema.ts`'s private `SCHEMA_TEMPLATE_IDENTIFIER` not being
// exported for reuse -- each small consumer keeps its own copy). Any other string
// (a custom, non-`IFC_SCHEMA` schema identifier -- see this file's header comment)
// passes through unchanged.
const SCHEMA_TEMPLATE_IDENTIFIER: Partial<Record<IFC_SCHEMA, string>> = {
	IFC4X3: "IFC4X3_ADD2",
};

function templateSchemaIdentifier(version: string): string {
	return SCHEMA_TEMPLATE_IDENTIFIER[version as IFC_SCHEMA] ?? version;
}

export interface CreateFileSettings {
	/**
	 * The schema version of the IFC file. Choose from `"IFC2X3"`, `"IFC4"`, or
	 * `"IFC4X3"`. Defaults to `"IFC4"`, matching real Python.
	 */
	version?: IFC_SCHEMA;
}

function createFileUsecase(_file: undefined, settings: CreateFileSettings = {}): IfcFile {
	const version = settings.version ?? "IFC4";
	return template.create({
		schemaIdentifier: templateSchemaIdentifier(version),
		blank: true,
		filename: "/dev/null",
		authorization: "Nobody",
		// Real Python hardcodes this literal regardless of `version` -- see this file's
		// header comment table.
		description: "ViewDefinition[DesignTransferView]",
	});
}

/**
 * Create a blank IFC model file object (Python: `ifcopenshell.api.project.create_file`).
 *
 * Create a new IFC file object based on the nominated schema version. The schema
 * version you choose determines what type of IFC data you can store in this model.
 * The file is blank and contains no entities.
 *
 * It also sets up header data for STEP file serialisation, such as the current
 * timestamp, IfcOpenShell as the preprocessor, and defaults to a DesignTransferView
 * MVD.
 *
 * Since this function creates the file itself (there is no `IfcFile` to pass in), call
 * it with `undefined` as the first argument, matching this project's uniform
 * `wrapUsecase(file, settings)` calling convention -- see this file's header comment.
 *
 * @example
 * ```ts
 * // Start a new model.
 * const model = api.project.createFile(undefined);
 *
 * // It's currently a blank model, so typically the first thing we do is create a
 * // project in it.
 * const project = api.root.createEntity(model, { ifcClass: "IfcProject", name: "Test" });
 *
 * // ... and off we go!
 * ```
 */
export const createFile = wrapUsecase("project.create_file", createFileUsecase);
