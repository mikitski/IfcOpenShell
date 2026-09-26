// This file was generated with the assistance of an AI coding tool.
//
// Phase EX-3 chunk 1 (planning/ifcopenshell-ts/70-express-rules-plan.md): hand-rolled
// coverage for `spf_header`'s 10 new sub-entity field accessors
// (`file_description_description`/`file_description_implementation_level`/
// `file_name_name`/`file_name_time_stamp`/`file_name_author`/`file_name_organization`/
// `file_name_preprocessor_version`/`file_name_originating_system`/
// `file_name_authorization`/`file_schema_schema_identifiers`) -- the one real,
// confirmed, blocking native-primitive gap `file.ts`'s own header comment disclosed
// ("`spf_header` has no `file_description()`/`file_name()`/`file_schema()` sub-entity
// accessors"). No dedicated real Python test exercises just this primitive surface
// (`validate.py`'s own `validate_ifc_header` is the only real consumer, and that lands
// in a later chunk, per the phase plan) -- original, hand-rolled coverage instead,
// matching this project's established convention for shim-layer code with no dedicated
// real test (e.g. `runtimeShim.ts`'s own 85 hand-rolled tests).
//
// Design note (see `header_shim.h`'s own doc comment for the full investigation): these
// are FLAT accessors directly on `spf_header` (`spf_header.file_description_description()`,
// not a nested `spf_header.file_description().description()`) -- real Python's own SWIG
// glue (`IfcParseWrapper.i` lines 76-90, 944-965) upcasts `file_description`/`file_name`/
// `file_schema` to a generic `express::base`/`entity_instance` owned by the *file*, a path
// this port can't reuse verbatim: `express::base`'s owner-propagation chain
// (`emit.py`'s `_owner_expression`) is hardwired to `ifcopenshell::file`, but a
// `spf_header` value can be entirely standalone (`spf_header.create(file, logger)`/
// `.with_other(other)`, no live file behind it) and is itself "value" (not `shared_ptr`)
// handle_kind, so nothing returned off it can safely declare an owner today. Flat,
// ownerless field accessors sidestep the whole problem: no intermediate native handle for
// `file_description`/`file_name`/`file_schema` is ever created, so there's nothing whose
// lifetime could outlive its owner.
//
// Fixture: `test/fixtures/validate/pass-header-valid.ifc` (already vendored,
// `70-express-rules-plan.md`'s own "all 38 real fixture files are ALREADY vendored"
// finding) has a real, fully-populated, non-trivial header:
//   FILE_DESCRIPTION(('ViewDefinition[DesignTransferView]'),'2;1');
//   FILE_NAME('test.ifc','2024-08-30T12:34:53+05:00',('author','author email'),
//             ('organization','organization email'),'IfcOpenShell','Bonsai','Nobody');
//   FILE_SCHEMA(('IFC4'));
// -- every field distinct and non-empty, so a copy/paste or off-by-one field-index bug
// in the shim would be caught by mismatched values, not just "didn't throw".

import * as path from "node:path";
import { describe, expect, test } from "vitest";
import { file as File, spf_header as SpfHeader } from "../../src/native/ifcopenshell_native";
import { native } from "../../src/native/native_loader";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");

function openFixture(relativePath: string): File {
	return new File(native.file_new_with_path(path.join(FIXTURES_DIR, relativePath)));
}

function openBlankIfc4File(): File {
	return new File(native.file_new());
}

describe("Phase EX-3 chunk 1: spf_header sub-entity field accessors", () => {
	test("reads every field of a real, fully-populated header (pass-header-valid.ifc)", () => {
		const file = openFixture("validate/pass-header-valid.ifc");
		const header = file.header();

		expect(header.file_description_description()).toEqual(["ViewDefinition[DesignTransferView]"]);
		expect(header.file_description_implementation_level()).toBe("2;1");

		expect(header.file_name_name()).toBe("test.ifc");
		expect(header.file_name_time_stamp()).toBe("2024-08-30T12:34:53+05:00");
		expect(header.file_name_author()).toEqual(["author", "author email"]);
		expect(header.file_name_organization()).toEqual(["organization", "organization email"]);
		expect(header.file_name_preprocessor_version()).toBe("IfcOpenShell");
		expect(header.file_name_originating_system()).toBe("Bonsai");
		expect(header.file_name_authorization()).toBe("Nobody");

		expect(header.file_schema_schema_identifiers()).toEqual(["IFC4"]);
	});

	test("returns real, non-parsed default values for a freshly-constructed blank file's header", () => {
		// `openBlankIfc4File()`'s header is never parsed from STEP text -- `ifcopenshell::
		// file::set_default_header_values()` (parse.cpp, called from the blank-file
		// constructor path) fills in a real, deterministic default header instead of
		// leaving it empty. Confirmed directly against that function's own source rather
		// than assumed: `description` defaults to `["ViewDefinition [CoordinationView]"]`,
		// `implementation_level` to `"2;1"`, `name`/`authorization` to `""`, `author`/
		// `organization` to `[""]`, and `schema_identifiers` to `[schema()->name()]`
		// (`["IFC4"]` here) -- `time_stamp`/`preprocessor_version`/`originating_system`
		// are intentionally not asserted exactly (the first is wall-clock-dependent via
		// `create_timestamp()`, the other two embed the build's own `IFCOPENSHELL_VERSION`
		// string), just checked for the shape real Python callers would rely on. This
		// confirms the accessors don't require a *parsed* header specifically -- any real
		// `spf_header` (parsed or freshly constructed) answers them correctly.
		const file = openBlankIfc4File();
		const header = file.header();

		expect(header.file_description_description()).toEqual(["ViewDefinition [CoordinationView]"]);
		expect(header.file_description_implementation_level()).toBe("2;1");
		expect(header.file_name_name()).toBe("");
		expect(header.file_name_author()).toEqual([""]);
		expect(header.file_name_organization()).toEqual([""]);
		expect(header.file_name_authorization()).toBe("");
		expect(header.file_name_time_stamp().length).toBeGreaterThan(0);
		expect(header.file_name_preprocessor_version()).toMatch(/^IfcOpenShell /);
		expect(header.file_name_originating_system()).toMatch(/^IfcOpenShell /);
		expect(header.file_schema_schema_identifiers()).toEqual(["IFC4"]);
	});

	test("each field accessor round-trips through spf_header.with_other() (a real C++ copy, not aliasing)", () => {
		// `spf_header.with_other()` wraps the real `spf_header(const spf_header&)` copy
		// constructor (a genuine deep clone -- 3 fresh header entities, values copied via
		// `assign()`, `spf_header.cpp`'s own doc comment). Confirms the new accessors work
		// correctly against a `spf_header` obtained via that path too, not just via
		// `file.header()`.
		const file = openFixture("validate/pass-header-valid.ifc");
		const original = file.header();
		const copy = SpfHeader.with_other(original);

		expect(copy.file_description_description()).toEqual(original.file_description_description());
		expect(copy.file_name_name()).toEqual(original.file_name_name());
		expect(copy.file_name_author()).toEqual(original.file_name_author());
		expect(copy.file_schema_schema_identifiers()).toEqual(original.file_schema_schema_identifiers());
	});

	test("author/organization preserve declaration order (not sorted or deduplicated)", () => {
		// A real, disclosed-by-example regression guard: a naive `Set`-based or
		// alphabetizing implementation slip would still pass a length/membership check but
		// fail an exact ordered-array comparison.
		const file = openFixture("validate/pass-header-valid.ifc");
		const header = file.header();

		expect(header.file_name_author()).toEqual(["author", "author email"]);
		expect(header.file_name_organization()).toEqual(["organization", "organization email"]);
	});

	test("each accessor is independently callable multiple times and stays consistent (no hidden native-side mutation)", () => {
		const file = openFixture("validate/pass-header-valid.ifc");
		const header = file.header();

		expect(header.file_description_description()).toEqual(header.file_description_description());
		expect(header.file_name_author()).toEqual(header.file_name_author());
		expect(header.file_schema_schema_identifiers()).toEqual(header.file_schema_schema_identifiers());
	});
});
