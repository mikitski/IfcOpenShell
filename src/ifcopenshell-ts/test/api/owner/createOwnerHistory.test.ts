// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_create_owner_history.py` (src/ifcopenshell-
// python). Both real Python test methods are ported:
// `test_creating_nothing_if_no_user_or_application_is_available` and
// `test_creating_a_history_using_a_specified_user_and_application` -- adapted to this
// project's own `createTestFile` bootstrap (`test/bootstrap.ts`) rather than the real
// Python `test.bootstrap.IFC4`/`IFC2X3` fixture classes, since those depend on the
// not-yet-ported `ifcopenshell.api.project.create_file` and install a lenient,
// suite-wide `ownerSettings` override this chunk doesn't need to reproduce (see
// `settings.test.ts`'s own header comment).
//
// `createTestFile` already includes a default `IfcApplication`/`IfcPersonAndOrganization`
// (`template.ts`'s `TEMPLATE`, matching real Python's `ifcopenshell.template.create`) --
// the "no user or application available" case uses `stripOwnerBootstrap` to remove
// those first, matching what the real Python test achieves by opening a second, bare
// `ifcopenshell.file(schema=...)` instead of reusing its fixture's `self.file` (see
// `stripOwnerBootstrap`'s own doc comment in `../../bootstrap.ts`).
//
// `beforeEach(() => ownerSettings.factoryReset())` guarantees a clean starting point
// regardless of test order (see `settings.test.ts`'s own header comment on this).

import { beforeEach, describe, expect, test } from "vitest";
import { createOwnerHistory } from "../../../src/api/owner/createOwnerHistory";
import { ownerSettings } from "../../../src/api/owner/settings";
import { AVAILABLE_SCHEMAS, createTestFile, stripOwnerBootstrap } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.owner.createOwnerHistory (%s)", (schema) => {
	test("creating nothing if no user or application is available", () => {
		const file = createTestFile(schema);
		stripOwnerBootstrap(file);
		if (schema !== "IFC2X3") {
			const history = createOwnerHistory(file, {});
			expect(history).toBeNull();
		} else {
			expect(() => createOwnerHistory(file, {})).toThrow("Please create a user to continue");
		}
	});

	test("creating a history using a specified user and application", () => {
		const file = createTestFile(schema);
		const user = file.createEntity("IfcPersonAndOrganization");
		const application = file.createEntity("IfcApplication");
		ownerSettings.getUser = () => user;
		ownerSettings.getApplication = () => application;

		const before = Math.floor(Date.now() / 1000);
		const history = createOwnerHistory(file, {});
		const after = Math.floor(Date.now() / 1000);

		expect(history).not.toBeNull();
		// biome-ignore lint/style/noNonNullAssertion: asserted non-null immediately above.
		const h = history!;
		expect(h.isA("IfcOwnerHistory")).toBe(true);
		expect((h.get("OwningUser") as typeof user).equals(user)).toBe(true);
		expect((h.get("OwningApplication") as typeof application).equals(application)).toBe(true);
		expect(h.get("State")).toBe("READWRITE");
		expect(h.get("ChangeAction")).toBe("ADDED");
		expect(h.get("LastModifiedDate") as number).toBeGreaterThanOrEqual(before);
		expect(h.get("LastModifiedDate") as number).toBeLessThanOrEqual(after);
		expect((h.get("LastModifyingUser") as typeof user).equals(user)).toBe(true);
		expect((h.get("LastModifyingApplication") as typeof application).equals(application)).toBe(true);
		expect(h.get("CreationDate") as number).toBeGreaterThanOrEqual(before);
		expect(h.get("CreationDate") as number).toBeLessThanOrEqual(after);
	});
});
