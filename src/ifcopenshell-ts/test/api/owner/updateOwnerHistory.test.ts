// This file was generated with the assistance of an AI coding tool.
//
// TS counterpart to `test/api/owner/test_update_owner_history.py` (src/ifcopenshell-
// python). All 4 real Python test methods ported verbatim (per-case), run against
// every `AVAILABLE_SCHEMAS` entry (real Python: `TestUpdateOwnerHistory` on IFC4,
// `TestUpdateOwnerHistoryIFC2X3` on IFC2X3 -- this port also runs on IFC4X3 since
// nothing here is schema-specific, unlike `createEntity.test.ts`'s `IfcDoorStyle` case).
//
// `ownerSettings.getUser`/`.getApplication` overrides are set directly (matching
// real Python's `ifcopenshell.api.owner.settings.get_user = lambda x: user` monkeypatch
// pattern) and restored via `beforeEach(() => ownerSettings.factoryReset())` rather
// than each test's own manual save/restore -- see `createOwnerHistory.test.ts`'s
// identical precedent.

import { beforeEach, describe, expect, test } from "vitest";
import { createOwnerHistory } from "../../../src/api/owner/createOwnerHistory";
import { ownerSettings } from "../../../src/api/owner/settings";
import { updateOwnerHistory } from "../../../src/api/owner/updateOwnerHistory";
import type { EntityInstance } from "../../../src/entityInstance";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
});

describe.each(AVAILABLE_SCHEMAS)("api.owner.updateOwnerHistory (%s)", (schema) => {
	test("creating an owner history when there is no existing history", () => {
		const file = createTestFile(schema);
		const user = file.createEntity("IfcPersonAndOrganization");
		const application = file.createEntity("IfcApplication");
		ownerSettings.getUser = () => user;
		ownerSettings.getApplication = () => application;

		const element = file.createEntity("IfcWall");
		const before = Math.floor(Date.now() / 1000);
		const history = updateOwnerHistory(file, { element });
		const after = Math.floor(Date.now() / 1000);

		expect(history).toBeTruthy();
		const h = history as EntityInstance;
		expect(h.isA("IfcOwnerHistory")).toBe(true);
		expect((element.get("OwnerHistory") as EntityInstance).equals(h)).toBe(true);
		expect(h.get("ChangeAction")).toBe("ADDED");
		expect(h.get("LastModifiedDate") as number).toBeGreaterThanOrEqual(before);
		expect(h.get("LastModifiedDate") as number).toBeLessThanOrEqual(after);
		expect((h.get("LastModifyingApplication") as EntityInstance).equals(application)).toBe(true);
		expect((h.get("LastModifyingUser") as EntityInstance).equals(user)).toBe(true);
	});

	test("updating an existing history", () => {
		const file = createTestFile(schema);
		const user = file.createEntity("IfcPersonAndOrganization");
		const application = file.createEntity("IfcApplication");
		ownerSettings.getUser = () => user;
		ownerSettings.getApplication = () => application;

		const element = file.createEntity("IfcWall");
		const oldHistory = createOwnerHistory(file, {}) as EntityInstance;
		element.set("OwnerHistory", oldHistory);

		const before = Math.floor(Date.now() / 1000);
		const newHistory = updateOwnerHistory(file, { element });
		const after = Math.floor(Date.now() / 1000);

		expect(newHistory).toBeTruthy();
		const h = newHistory as EntityInstance;
		expect(h.equals(oldHistory)).toBe(true);
		expect((element.get("OwnerHistory") as EntityInstance).equals(h)).toBe(true);
		expect(h.get("ChangeAction")).toBe("MODIFIED");
		expect(h.get("LastModifiedDate") as number).toBeGreaterThanOrEqual(before);
		expect(h.get("LastModifiedDate") as number).toBeLessThanOrEqual(after);
		expect((h.get("LastModifyingApplication") as EntityInstance).equals(application)).toBe(true);
		expect((h.get("LastModifyingUser") as EntityInstance).equals(user)).toBe(true);
	});

	test("updating an existing history shared by multiple elements copies it (copy-on-write)", () => {
		const file = createTestFile(schema);
		const user = file.createEntity("IfcPersonAndOrganization");
		const application = file.createEntity("IfcApplication");
		ownerSettings.getUser = () => user;
		ownerSettings.getApplication = () => application;

		const element = file.createEntity("IfcWall");
		const element2 = file.createEntity("IfcWall");
		const oldHistory = createOwnerHistory(file, {}) as EntityInstance;
		element.set("OwnerHistory", oldHistory);
		element2.set("OwnerHistory", oldHistory);

		const newHistory = updateOwnerHistory(file, { element });

		expect(newHistory).toBeTruthy();
		const h = newHistory as EntityInstance;
		expect(h.equals(oldHistory)).toBe(false);
		expect((element.get("OwnerHistory") as EntityInstance).equals(h)).toBe(true);
		expect(h.get("ChangeAction")).toBe("MODIFIED");
		// The second element's own OwnerHistory is untouched by the copy-on-write.
		expect((element2.get("OwnerHistory") as EntityInstance).equals(oldHistory)).toBe(true);
	});

	test("doing nothing if no history can be updated (non-IfcRoot element)", () => {
		const file = createTestFile(schema);
		const person = file.createEntity("IfcPerson");
		expect(updateOwnerHistory(file, { element: person })).toBeUndefined();
	});
});
