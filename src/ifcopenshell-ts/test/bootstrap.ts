// This file was generated with the assistance of an AI coding tool.
//
// Port of `test/bootstrap.py`'s fixture pattern
// (planning/ifcopenshell-ts/40-testing-strategy.md SS3) -- `createTestFile(schema)`
// is the foundation every later phase's tests build on. Python achieves "run the same
// test body against IFC2X3/IFC4/IFC4X3" via multiple inheritance
// (`class TestXIFC2X3(test.bootstrap.IFC2X3, TestX): pass`); this reproduces the same
// effect with Vitest's `describe.each`, per the testing-strategy doc's own
// recommendation, rather than attempting a TS equivalent of Python's mixin trick.

import { ownerSettings } from "../src/api/owner/settings";
import type { IfcFile } from "../src/file";
import * as template from "../src/template";
import * as elementUtil from "../src/util/element";

export type Schema = "IFC2X3" | "IFC4" | "IFC4X3";

export const ALL_SCHEMAS: readonly Schema[] = ["IFC2X3", "IFC4", "IFC4X3"];

// `template.create`'s `schemaIdentifier` needs the real, C++-core-registered
// identifier (`file_mixin._determine_schema_identifier`'s own IFC4X3 -> IFC4X3_ADD2
// alias, `research/01-python-core-and-lowlevel.md` SS2.2) -- this repo's IFC4X3
// build currently registers the schema as `IFC4X3_ADD2`, see `IfcFile.schema`'s own
// parsing of whatever the core actually reports.
const SCHEMA_IDENTIFIERS: Record<Schema, string> = {
	IFC2X3: "IFC2X3",
	IFC4: "IFC4",
	IFC4X3: "IFC4X3_ADD2",
};

export function createTestFile(schema: Schema): IfcFile {
	return template.create({ schemaIdentifier: SCHEMA_IDENTIFIERS[schema] });
}

// `ci-ifcopenshell-ts.yml` currently builds the C++ core with `-DSCHEMA_VERSIONS=4`
// (IFC4 only -- a deliberate Phase 0-era build-time budget choice, made before this
// project had any schema-specific porting work; see that workflow's own comment).
// This chunk is the first to need IFC2X3/IFC4X3 in tests at all (verified working
// locally against a manually-built addon with all three schemas registered), so
// rather than hard-failing every IFC2X3/IFC4X3 test in the current CI environment --
// or silently dropping them from the schema list, which would look like this phase
// never intended to cover them -- test suites built on this fixture filter
// `ALL_SCHEMAS` down to `AVAILABLE_SCHEMAS` (computed once, at collection time) and
// run `describe.each` over that instead. This is a disclosed, environment-driven gap
// (flagged for the orchestrating session to decide whether to widen
// `SCHEMA_VERSIONS`), not a bug in the TS port itself -- nothing in
// `file.ts`/`entityInstance.ts` is schema-version-specific.
function isSchemaAvailable(schema: Schema): boolean {
	try {
		const file = createTestFile(schema);
		// Accessing `.schema` is what actually surfaces "No schema loaded" if the
		// core build doesn't have this schema registered -- `template.create`'s
		// buffer-based file-open primitive doesn't itself throw on a schema it
		// can't resolve, it just produces a file with no schema set.
		void file.schema;
		file.dispose();
		return true;
	} catch {
		return false;
	}
}

export const AVAILABLE_SCHEMAS: readonly Schema[] = ALL_SCHEMAS.filter(isSchemaAvailable);

/**
 * Removes every `IfcApplication`/`IfcPersonAndOrganization` from a `createTestFile`
 * result -- `template.ts`'s `TEMPLATE` (matching real Python's
 * `ifcopenshell.template.create`, which `ifcopenshell.api.project.create_file` calls)
 * always pre-populates a default person/organization/application/owner-history chain
 * (`#1`-`#5` in `template.ts`'s `TEMPLATE` string), exactly as real
 * `test/bootstrap.py`'s own comment notes ("bootstrap is creating users in ifc2x3 by
 * default"). Some tests (e.g. `ownerSettings`'s/`createOwnerHistory`'s own
 * "no user or application available" cases) need a file that genuinely has neither,
 * matching what the real Python test achieves by opening a second, bare
 * `ifcopenshell.file(schema=...)` instead of reusing the fixture's `self.file` --
 * this port doesn't have a bound "schema-only, no template" file constructor
 * available at the `IfcFile` level (the low-level `file_new_with_schema_...`
 * primitive exists but nothing wraps it yet, a narrower gap not worth closing just
 * for this), so it reaches the same "no owner entities" state by stripping a
 * `createTestFile` result instead -- behaviorally equivalent for every consumer of
 * `file.byType("IfcApplication")`/`file.byType("IfcPersonAndOrganization")`, since
 * `file.remove` (unlike `util.element.removeDeep`) has no referential-integrity
 * check and simply deletes, leaving `IfcOwnerHistory`/`IfcPerson`/`IfcOrganization`
 * harmlessly dangling (not read by anything these tests exercise).
 */
export function stripOwnerBootstrap(file: IfcFile): void {
	for (const application of file.byType("IfcApplication")) {
		file.remove(application);
	}
	for (const user of file.byType("IfcPersonAndOrganization")) {
		file.remove(user);
	}
}

/**
 * Removes the `createTestFile` template's pre-populated `IfcProject` (and, via
 * `util.element.removeDeep2`'s ordinary "delete anything left with zero remaining
 * inverses" cascade, everything the template only keeps alive *through* that
 * project: its `UnitsInContext` `IfcUnitAssignment` and member units, its
 * `RepresentationContexts`, and -- since `IfcProject.OwnerHistory` is the template's
 * only reference to `IfcOwnerHistory`, which is in turn the template's only
 * reference to `IfcPersonAndOrganization`/`IfcApplication`, which are in turn the
 * only references to `IfcPerson`/`IfcOrganization` -- the entire default person/
 * organization/application/owner-history chain too), for tests that need a truly
 * project-and-unit-free file. Added for the `api.unit` chunk: unlike every previously
 * landed `api.*` chunk, `api.unit`'s `assignUnit`/`unassignUnit`/`removeUnit` are the
 * first functions to actually read/write `IfcProject.UnitsInContext`, and the real
 * Python test suite's own fixture (`test/bootstrap.py`'s `IFC4`/`IFC2X3`/`IFC4X3`
 * classes: `self.file = ifcopenshell.api.project.create_file(...)`) is genuinely
 * blank -- `create_file` is NOT `ifcopenshell.template.create` (confirmed by reading
 * `api/project/create_file.py`: it's a bare `ifcopenshell.file(schema=version)` plus
 * cosmetic header metadata, no entities at all) -- unlike `createTestFile` here,
 * which intentionally uses the richer `template.create` port for other chunks'
 * needs (`stripOwnerBootstrap`'s own header comment above already documents this
 * same real fixture-shape gap for the owner/person/organization/application slice;
 * this is the same gap's `IfcProject`/unit-assignment slice, not a new one). Every
 * real Python `test/api/unit/test_*.py` test that needs a project calls
 * `self.file.createIfcProject()` itself against that genuinely blank file -- this
 * port's tests do the same against a file stripped with this helper first, reaching
 * the same "one project, no pre-existing units" starting state.
 */
export function stripProjectBootstrap(file: IfcFile): void {
	for (const project of file.byType("IfcProject")) {
		elementUtil.removeDeep2(file, project);
	}
}

/**
 * Port of real Python's `test/bootstrap.py`'s `IFC2X3`/`IFC4`/`IFC4X3` fixture classes'
 * own `ifcopenshell.api.owner.settings.get_user`/`get_application` override (lines
 * ~35-76 there) -- an `autouse=True` pytest fixture that reassigns those two GLOBAL
 * functions before every single test method, generically for whatever file is later
 * passed to them (the real closures take `ifc` as a parameter; they are not bound to any
 * one fixture's own `self.file`). On IFC2X3, where owner tracking is mandatory
 * (`src/api/owner/settings.ts`'s own `defaultGetUser`/`defaultGetApplication` raise there
 * instead of returning `null`), the real fixture swaps in a LAZY-CREATE override: return
 * the first existing `IfcPersonAndOrganization`/`IfcApplication` if one exists in the
 * file, otherwise silently create a bare one (real Python: `ifc.create_entity("IfcPerson")`
 * / `ifc.create_entity("IfcOrganization")` / `ifc.create_entity("IfcPersonAndOrganization",
 * ThePerson=person, TheOrganization=organization)` / `ifc.create_entity("IfcApplication")`
 * -- all with every other attribute left unset, exactly as ported below; the native layer
 * doesn't enforce attribute-cardinality validity at creation time, only real usecases'
 * own logic does, same established precedent as `stripOwnerBootstrap`'s own callers).
 * IFC4/IFC4X3's own fixture override is behaviorally a no-op vs. the true box default
 * (same first-in-file-or-null lookup, since neither schema's box default ever raises) --
 * reproduced anyway, for parity, and so a caller never needs to special-case "IFC2X3 vs.
 * everything else" itself.
 *
 * Deliberately NOT folded into `createTestFile` itself, for two independent reasons: (1)
 * `ownerSettings` is a shared, module-level mutable singleton -- `test/api/owner
 * /settings.test.ts`'s own "getApplication/getUser throws when the file has none
 * (IFC2X3)" cases deliberately call `createTestFile("IFC2X3")` to obtain a valid IFC2X3
 * file WITHOUT this override installed, specifically to assert the true, un-monkeypatched
 * raising default -- folding this override into `createTestFile` unconditionally would
 * make that assertion impossible to write. (2) Real Python's own override is schema-
 * generic and file-instance-agnostic (`get_user(ifc)` operates on whatever file is passed
 * at CALL time, not the fixture's own `self.file`), so it applies equally to a separate
 * "library" file built independently of `createTestFile` (e.g. `appendAsset.test.ts`'s own
 * `blankFile` helper, built via the low-level `createFile` directly) -- which folding into
 * `createTestFile` could never reach anyway, since that file is never passed through it.
 *
 * Call this from a `beforeEach` inside whatever `describe.each(AVAILABLE_SCHEMAS)` block
 * needs real Python's autouse-fixture behavior -- i.e. any suite that builds its own
 * owner-history-requiring fixtures (anything that calls, directly or transitively,
 * `api.owner.createOwnerHistory`) from a genuinely owner-chain-less file, matching what
 * real Python's own per-schema test class gets for free via `test.bootstrap`.
 */
export function useOwnerSettingsFixture(schema: Schema): void {
	if (schema === "IFC2X3") {
		ownerSettings.getUser = (file) => {
			const existing = file.byType("IfcPersonAndOrganization")[0] ?? null;
			if (existing) return existing;
			const person = file.createEntity("IfcPerson");
			const organization = file.createEntity("IfcOrganization");
			return file.createEntity("IfcPersonAndOrganization", person, organization);
		};
		ownerSettings.getApplication = (file) => {
			const existing = file.byType("IfcApplication")[0] ?? null;
			if (existing) return existing;
			return file.createEntity("IfcApplication");
		};
	} else {
		ownerSettings.getUser = (file) => file.byType("IfcPersonAndOrganization")[0] ?? null;
		ownerSettings.getApplication = (file) => file.byType("IfcApplication")[0] ?? null;
	}
}
