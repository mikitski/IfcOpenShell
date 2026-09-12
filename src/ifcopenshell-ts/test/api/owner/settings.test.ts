// This file was generated with the assistance of an AI coding tool.
//
// Original test coverage for `src/api/owner/settings.ts`'s box defaults and
// `factoryReset`/`restore` round trip -- no dedicated Python test file exists for
// `owner/settings.py` on its own (`test/bootstrap.py` exercises it only indirectly, by
// overriding it globally for the whole Python test suite; `test/api/owner/
// test_create_owner_history.py`'s own `factory_reset()`/`restore()` usage is ported
// separately in `createOwnerHistory.test.ts`, matching that file's real Python
// counterpart). This file's job is narrower: pin down `defaultGetUser`/
// `defaultGetApplication`'s own behavior (first-in-file lookup, IFC2X3-throws-if-none)
// and the backup/restore semantics in isolation.
//
// `createTestFile` already includes a default `IfcApplication`/`IfcPersonAndOrganization`
// (`template.ts`'s `TEMPLATE`, matching real Python's `ifcopenshell.template.create`) --
// tests below that need a genuinely owner-less file use `stripOwnerBootstrap`
// (`../../bootstrap.ts`) to remove those first, matching what the real Python test
// achieves by opening a second, bare `ifcopenshell.file(schema=...)` instead (see that
// helper's own doc comment).
//
// `beforeEach(() => ownerSettings.factoryReset())` guarantees every test starts from
// the true, un-overridden defaults regardless of what an earlier test (in this file or
// any other file sharing this module-level singleton) left behind -- a stronger
// isolation guarantee than Python's own `test/bootstrap.py`, which resets to a
// *lenient* per-suite override, not the true out-of-the-box default.

import { beforeEach, describe, expect, test } from "vitest";
import { ownerSettings } from "../../../src/api/owner/settings";
import { AVAILABLE_SCHEMAS, createTestFile, stripOwnerBootstrap } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC4"))("ownerSettings box defaults (IFC4)", () => {
	test("getApplication returns null when the file has none", () => {
		const file = createTestFile("IFC4");
		stripOwnerBootstrap(file);
		expect(ownerSettings.getApplication(file)).toBeNull();
	});

	test("getUser returns null when the file has none", () => {
		const file = createTestFile("IFC4");
		stripOwnerBootstrap(file);
		expect(ownerSettings.getUser(file)).toBeNull();
	});

	test("getApplication returns the first IfcApplication in the file", () => {
		const file = createTestFile("IFC4");
		stripOwnerBootstrap(file);
		const application = file.createEntity("IfcApplication");
		expect(ownerSettings.getApplication(file)?.equals(application)).toBe(true);
	});

	test("getUser returns the first IfcPersonAndOrganization in the file", () => {
		const file = createTestFile("IFC4");
		stripOwnerBootstrap(file);
		const user = file.createEntity("IfcPersonAndOrganization");
		expect(ownerSettings.getUser(file)?.equals(user)).toBe(true);
	});
});

describe.skipIf(!AVAILABLE_SCHEMAS.includes("IFC2X3"))("ownerSettings box defaults (IFC2X3)", () => {
	test("getApplication throws when the file has none", () => {
		const file = createTestFile("IFC2X3");
		stripOwnerBootstrap(file);
		expect(() => ownerSettings.getApplication(file)).toThrow("Please create an application to continue");
	});

	test("getUser throws when the file has none", () => {
		const file = createTestFile("IFC2X3");
		stripOwnerBootstrap(file);
		expect(() => ownerSettings.getUser(file)).toThrow("Please create a user to continue");
	});
});

describe("ownerSettings.factoryReset/restore", () => {
	// Reference-identity checks, not behavioral ones -- creating a real
	// `IfcPersonAndOrganization` to use as a distinguishable override return value
	// would defeat the point (the true box default's own "first in file" lookup would
	// then find it too, regardless of any override), so this pins down the actual
	// documented semantics directly: `factoryReset()` saves *whatever function is
	// currently assigned* and resets to the true, never-reassigned factory default;
	// `restore()` puts back exactly what was saved.
	test("factoryReset saves the current override, restore puts it back", () => {
		const defaultGetUser = ownerSettings.getUser;
		const customGetUser = () => null;
		ownerSettings.getUser = customGetUser;

		ownerSettings.factoryReset();
		expect(ownerSettings.getUser).toBe(defaultGetUser);
		expect(ownerSettings.getUser).not.toBe(customGetUser);

		ownerSettings.restore();
		expect(ownerSettings.getUser).toBe(customGetUser);
	});

	test("factoryReset is idempotent when called with no active override", () => {
		ownerSettings.factoryReset();
		const afterFirstReset = ownerSettings.getUser;
		ownerSettings.factoryReset();
		expect(ownerSettings.getUser).toBe(afterFirstReset);
	});
});
