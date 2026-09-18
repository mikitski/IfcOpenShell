// This file was generated with the assistance of an AI coding tool.
//
// Original test suite for `../../../src/api/attribute/editAttributes.ts` -- NOT a port
// of an existing Python test file. Confirmed by search: real Python's own upstream test
// suite has no `test/api/attribute/` directory at all, and no other test file imports
// `ifcopenshell.api.attribute.edit_attributes` either -- this function has never had a
// dedicated regression test upstream (see `editAttributes.ts`'s own header comment).
// Every real branch is covered here, read directly from the source: a plain attribute
// edit, both `ElementType`-based `USERDEFINED`<->`NOTDEFINED` transitions, the
// `ObjectType`-based transitions (untyped occurrence), the typed-occurrence
// `relating_type.PredefinedType` branch (including the buildingSMART/
// IFC4.3.x-development#818 "allow for `null`" edge case), the `OwnerHistory` update
// trigger, and (an original regression, not in the task brief but a direct consequence
// of this chunk's own disclosed correction) that `edit_attributes` really is wired
// through `wrapUsecase`'s pre/post-listener system, matching every other `api.*`
// module's `__init__.py` calling `wrap_usecases` -- NOT the `api.alignment`/`api.cogo`
// plain-function shape the task brief mistakenly suggested.
//
// Schema-generic, not schema-specific: `describe.each(AVAILABLE_SCHEMAS)` throughout,
// matching `api.alignment`'s own precedent for schema-generic files (e.g.
// `getAxisSubcontext.test.ts`). One real, disclosed per-schema difference informed the
// choice of test fixtures below: `IfcWall.PredefinedType` doesn't exist on IFC2X3 at all
// (confirmed against the generated `ifc2x3.d.ts` -- only `ObjectType` is declared
// there), so this suite's occurrence-level (`ObjectType`) fixtures use `IfcSlab`/
// `IfcSlabType` instead, confirmed identical (`ObjectType`/`PredefinedType` both
// present, no `ElementType`) across all 3 generated `.d.ts`s. The type-level
// (`ElementType`) fixtures use `IfcWallType`, likewise confirmed identical
// (`ElementType`/`PredefinedType` both present) across all 3 schemas.

import { beforeEach, describe, expect, test } from "vitest";
import { editAttributes } from "../../../src/api/attribute/editAttributes";
import { addPreListener, removeAllListeners } from "../../../src/api/hooks";
import { ownerSettings } from "../../../src/api/owner/settings";
import type { EntityInstance } from "../../../src/entityInstance";
import * as guid from "../../../src/guid";
import { AVAILABLE_SCHEMAS, createTestFile } from "../../bootstrap";

beforeEach(() => {
	ownerSettings.factoryReset();
	removeAllListeners();
});

/** IfcRelDefinesByType: GlobalId(0), OwnerHistory(1), Name(2), Description(3), RelatedObjects(4), RelatingType(5) -- identical index across all 3 schemas. See `unassignType.test.ts`'s identical helper's own doc comment. */
function createTypeRel(
	file: ReturnType<typeof createTestFile>,
	relatedObjects: readonly EntityInstance[],
	relatingType: EntityInstance,
): EntityInstance {
	return file.createEntity("IfcRelDefinesByType", guid.new(), null, null, null, [...relatedObjects], relatingType);
}

describe.each(AVAILABLE_SCHEMAS)("api.attribute.editAttributes (%s)", (schema) => {
	test("editing a plain attribute", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");

		editAttributes(file, { product: wall, attributes: { Name: "Waldo" } });

		expect(wall.get("Name")).toBe("Waldo");
	});

	test("editing multiple plain attributes at once", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");

		editAttributes(file, { product: wall, attributes: { Name: "Waldo", Description: "A wall" } });

		expect(wall.get("Name")).toBe("Waldo");
		expect(wall.get("Description")).toBe("A wall");
	});

	// --- ElementType/PredefinedType consistency (type-level: IfcWallType) ---

	test("clearing ElementType while PredefinedType is USERDEFINED resets it to NOTDEFINED", () => {
		const file = createTestFile(schema);
		const wallType = file.createEntity("IfcWallType");
		wallType.set("ElementType", "CustomWall");
		wallType.set("PredefinedType", "USERDEFINED");

		editAttributes(file, { product: wallType, attributes: { ElementType: null } });

		expect(wallType.get("ElementType")).toBeNull();
		expect(wallType.get("PredefinedType")).toBe("NOTDEFINED");
	});

	test("setting ElementType while PredefinedType isn't USERDEFINED forces USERDEFINED", () => {
		const file = createTestFile(schema);
		const wallType = file.createEntity("IfcWallType");
		wallType.set("ElementType", null);
		wallType.set("PredefinedType", "NOTDEFINED");

		editAttributes(file, { product: wallType, attributes: { ElementType: "CustomWall" } });

		expect(wallType.get("ElementType")).toBe("CustomWall");
		expect(wallType.get("PredefinedType")).toBe("USERDEFINED");
	});

	test("ElementType/PredefinedType already consistent is left untouched", () => {
		const file = createTestFile(schema);
		const wallType = file.createEntity("IfcWallType");
		wallType.set("ElementType", "CustomWall");
		wallType.set("PredefinedType", "USERDEFINED");

		editAttributes(file, { product: wallType, attributes: { Name: "Renamed" } });

		expect(wallType.get("ElementType")).toBe("CustomWall");
		expect(wallType.get("PredefinedType")).toBe("USERDEFINED");
	});

	// --- ObjectType/PredefinedType consistency (occurrence-level, untyped: IfcSlab) ---

	test("clearing ObjectType while PredefinedType is USERDEFINED resets it to NOTDEFINED (untyped occurrence)", () => {
		const file = createTestFile(schema);
		const slab = file.createEntity("IfcSlab");
		slab.set("ObjectType", "CustomSlab");
		slab.set("PredefinedType", "USERDEFINED");

		editAttributes(file, { product: slab, attributes: { ObjectType: null } });

		expect(slab.get("ObjectType")).toBeNull();
		expect(slab.get("PredefinedType")).toBe("NOTDEFINED");
	});

	test("setting ObjectType while PredefinedType isn't USERDEFINED forces USERDEFINED (untyped occurrence)", () => {
		const file = createTestFile(schema);
		const slab = file.createEntity("IfcSlab");
		slab.set("ObjectType", null);
		slab.set("PredefinedType", "NOTDEFINED");

		editAttributes(file, { product: slab, attributes: { ObjectType: "CustomSlab" } });

		expect(slab.get("ObjectType")).toBe("CustomSlab");
		expect(slab.get("PredefinedType")).toBe("USERDEFINED");
	});

	// --- ObjectType/PredefinedType consistency (occurrence-level, TYPED: IfcSlab + IfcSlabType) ---
	//
	// `relating_type.PredefinedType not in ("NOTDEFINED", None)` -- real Python's own
	// comment references https://github.com/buildingSMART/IFC4.3.x-development/issues/818
	// ("allow for None due to..."), i.e. a relating type's own `PredefinedType` being
	// `null` is a deliberately tolerated schema ambiguity, NOT treated the same as a real
	// defined type. Three cases below: a real, defined, non-NOTDEFINED relating-type
	// PredefinedType forces the occurrence's own ObjectType/PredefinedType to `null`;
	// "NOTDEFINED" and `null` both do NOT trigger that clear, instead falling through to
	// the normal ObjectType-based elif chain.

	test("a typed occurrence whose type has a real (non-NOTDEFINED) PredefinedType has its own ObjectType/PredefinedType cleared", () => {
		const file = createTestFile(schema);
		const slabType = file.createEntity("IfcSlabType");
		slabType.set("PredefinedType", "USERDEFINED");
		const slab = file.createEntity("IfcSlab");
		slab.set("ObjectType", "CustomSlab");
		slab.set("PredefinedType", "USERDEFINED");
		createTypeRel(file, [slab], slabType);

		editAttributes(file, { product: slab, attributes: { Name: "Renamed" } });

		expect(slab.get("ObjectType")).toBeNull();
		expect(slab.get("PredefinedType")).toBeNull();
	});

	test("a typed occurrence whose type's PredefinedType is NOTDEFINED falls through to the normal ObjectType-based transition", () => {
		const file = createTestFile(schema);
		const slabType = file.createEntity("IfcSlabType");
		slabType.set("PredefinedType", "NOTDEFINED");
		const slab = file.createEntity("IfcSlab");
		slab.set("ObjectType", "CustomSlab");
		slab.set("PredefinedType", "NOTDEFINED");
		createTypeRel(file, [slab], slabType);

		editAttributes(file, { product: slab, attributes: { Name: "Renamed" } });

		// object_type is truthy and predefined_type != "USERDEFINED" -> "USERDEFINED".
		expect(slab.get("ObjectType")).toBe("CustomSlab");
		expect(slab.get("PredefinedType")).toBe("USERDEFINED");
	});

	test("a typed occurrence whose type's PredefinedType is null (#818) falls through to the normal ObjectType-based transition, not cleared", () => {
		const file = createTestFile(schema);
		const slabType = file.createEntity("IfcSlabType");
		slabType.set("PredefinedType", null as unknown as string);
		const slab = file.createEntity("IfcSlab");
		slab.set("ObjectType", null);
		slab.set("PredefinedType", "USERDEFINED");
		createTypeRel(file, [slab], slabType);

		editAttributes(file, { product: slab, attributes: { Name: "Renamed" } });

		// object_type is None and predefined_type == "USERDEFINED" -> "NOTDEFINED",
		// NOT cleared to null by the relating-type branch (the #818 allowance).
		expect(slab.get("ObjectType")).toBeNull();
		expect(slab.get("PredefinedType")).toBe("NOTDEFINED");
	});

	// --- OwnerHistory update trigger ---

	test("editing an attribute updates OwnerHistory when owner settings are configured", () => {
		const file = createTestFile(schema);
		const user = file.createEntity("IfcPersonAndOrganization");
		const application = file.createEntity("IfcApplication");
		ownerSettings.getUser = () => user;
		ownerSettings.getApplication = () => application;

		const wall = file.createEntity("IfcWall");
		const before = Math.floor(Date.now() / 1000);

		editAttributes(file, { product: wall, attributes: { Name: "Waldo" } });

		const after = Math.floor(Date.now() / 1000);
		const history = wall.get("OwnerHistory") as EntityInstance;
		expect(history).toBeTruthy();
		expect(history.isA("IfcOwnerHistory")).toBe(true);
		expect(history.get("ChangeAction")).toBe("ADDED");
		expect(history.get("LastModifiedDate") as number).toBeGreaterThanOrEqual(before);
		expect(history.get("LastModifiedDate") as number).toBeLessThanOrEqual(after);
		expect((history.get("LastModifyingUser") as EntityInstance).equals(user)).toBe(true);
		expect((history.get("LastModifyingApplication") as EntityInstance).equals(application)).toBe(true);
	});

	test("editing an attribute again updates an existing OwnerHistory to MODIFIED", () => {
		const file = createTestFile(schema);
		const user = file.createEntity("IfcPersonAndOrganization");
		const application = file.createEntity("IfcApplication");
		ownerSettings.getUser = () => user;
		ownerSettings.getApplication = () => application;

		const wall = file.createEntity("IfcWall");
		editAttributes(file, { product: wall, attributes: { Name: "First" } });
		const firstHistory = wall.get("OwnerHistory") as EntityInstance;

		editAttributes(file, { product: wall, attributes: { Name: "Second" } });
		const secondHistory = wall.get("OwnerHistory") as EntityInstance;

		expect(secondHistory.equals(firstHistory)).toBe(true);
		expect(secondHistory.get("ChangeAction")).toBe("MODIFIED");
	});
});

// --- `wrapUsecase` wiring regression (no Python counterpart -- see this file's own
// header comment for the correction this test locks in: real Python's
// `api/attribute/__init__.py` calls `wrap_usecases`, so `edit_attributes` genuinely
// fires pre/post-listeners exactly like every other mutating `api.*` usecase, unlike
// `api.alignment`/`api.cogo`'s plain-function modules). ---

describe.each(AVAILABLE_SCHEMAS)("api.attribute.editAttributes pre-listener wiring (%s)", (schema) => {
	test("registering a pre-listener for 'attribute.edit_attributes' fires on every call", () => {
		const file = createTestFile(schema);
		const wall = file.createEntity("IfcWall");
		const seen: Array<Record<string, unknown>> = [];
		addPreListener<typeof file, { product: EntityInstance; attributes: Record<string, unknown> }>(
			"attribute.edit_attributes",
			"test-listener",
			(_usecasePath, _ifcFile, settings) => {
				seen.push(settings);
			},
		);

		editAttributes(file, { product: wall, attributes: { Name: "Waldo" } });

		expect(seen).toHaveLength(1);
		expect((seen[0].product as EntityInstance).equals(wall)).toBe(true);
	});
});
